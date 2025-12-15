// metadata-studio/events/profile.subscriber.ts

/**
 * Profiler Event Subscriber
 *
 * Listens to:
 * - metadata.profile.due (from Kernel Scheduler)
 * - data.refreshed (from ETL pipelines)
 * - metadata.approved (from Approval workflow)
 *
 * Actions:
 * - Triggers profiler when needed
 * - Applies cost optimization filters
 * - Emits metadata.profile.completed / metadata.profile.failed events
 */

import type { Event } from '@aibos/events';
import { eventBus } from './event-bus';
import { QualityService } from '../services/quality.service';
import { ProfilerExecutor } from '../db/profiler.executor';
import { observabilityRepo } from '../db/observability.repo';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Initialize quality service
const profilerExecutor = new ProfilerExecutor(db as any);
const qualityService = new QualityService(profilerExecutor);

/**
 * Calculate hours since a given date.
 */
function hoursSince(date: Date | string): number {
  const then = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60);
}

/**
 * Calculate days since a given date.
 */
function daysSince(date: Date | string): number {
  return hoursSince(date) / 24;
}

/**
 * Get stale threshold in days based on governance tier.
 */
function getStaleThreshold(tier: string): number {
  if (tier === 'tier1') return 7;   // Tier1: 7 days (GRCD compliance)
  if (tier === 'tier2') return 14;  // Tier2: 14 days
  if (tier === 'tier3') return 30;  // Tier3: 30 days
  return 90;                        // Tier4+: 90 days
}

/**
 * Resolve entity URN to physical table location.
 * 
 * In production, this would query a metadata registry or lineage graph.
 * For now, we use a simple heuristic:
 * - entityUrn format: "domain.module:canonical_key"
 * - Assume table name = canonical_key (simplified)
 */
async function resolveEntityToTable(
  tenantId: string,
  entityId: string,
  canonicalKey: string
): Promise<{ schema: string; table: string } | null> {
  // TODO: Implement proper entity → table resolution via lineage
  // For now, return null to skip profiling (avoid errors)
  console.log(
    `[ProfileSubscriber] Table resolution not implemented for ${canonicalKey}`
  );
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handler: metadata.profile.due
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle metadata.profile.due event from Kernel Scheduler.
 *
 * Decision logic:
 * - Tier1 + high priority → Always profile (GRCD compliance)
 * - Tier2+ → Check if profile is stale before profiling
 * - Skip if profiled recently (cost optimization)
 */
async function handleProfileDue(event: Event): Promise<void> {
  if (event.type !== 'metadata.profile.due') return;

  console.log(
    `[ProfileSubscriber] Profile due: ${event.payload.canonicalKey} (tier: ${event.payload.tier}, priority: ${event.payload.priority})`
  );

  // Tier1 + high priority → always profile (compliance requirement)
  if (event.payload.tier === 'tier1' && event.payload.priority === 'high') {
    console.log(
      `[ProfileSubscriber] Tier1 high priority: profiling immediately`
    );
    await runProfiler(event);
    return;
  }

  // For Tier2+, check if last profile is stale
  const lastProfile = await observabilityRepo.getLatestProfile(
    event.tenantId,
    event.payload.canonicalKey // Using canonicalKey as entityUrn
  );

  if (!lastProfile) {
    console.log(`[ProfileSubscriber] No previous profile: profiling`);
    await runProfiler(event);
    return;
  }

  const staleThreshold = getStaleThreshold(event.payload.tier);
  const daysSinceProfile = daysSince(lastProfile.createdAt);

  if (daysSinceProfile >= staleThreshold) {
    console.log(
      `[ProfileSubscriber] Profile stale (${daysSinceProfile.toFixed(1)} days > ${staleThreshold} days): profiling`
    );
    await runProfiler(event);
  } else {
    console.log(
      `[ProfileSubscriber] Profile recent (${daysSinceProfile.toFixed(1)} days < ${staleThreshold} days): skipping`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handler: data.refreshed
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle data.refreshed event from ETL pipelines.
 *
 * Decision logic:
 * - Never profiled → Profile
 * - Last profile > 24 hours old → Profile
 * - Major data refresh (>10% row change) → Profile
 * - Otherwise → Skip (avoid noise)
 */
async function handleDataRefreshed(event: Event): Promise<void> {
  if (event.type !== 'data.refreshed') return;

  console.log(
    `[ProfileSubscriber] Data refreshed: ${event.payload.entityUrn} (${event.payload.rowsAffected} rows)`
  );

  const lastProfile = await observabilityRepo.getLatestProfile(
    event.tenantId,
    event.payload.entityUrn
  );

  // Never profiled → profile
  if (!lastProfile) {
    console.log(`[ProfileSubscriber] No previous profile: profiling`);
    await runProfilerFromDataRefresh(event);
    return;
  }

  const hoursSinceProfile = hoursSince(lastProfile.createdAt);

  // Profile > 24 hours old → profile
  if (hoursSinceProfile > 24) {
    console.log(
      `[ProfileSubscriber] Profile stale (${hoursSinceProfile.toFixed(1)} hours): profiling`
    );
    await runProfilerFromDataRefresh(event);
    return;
  }

  // Major data refresh (>10% row change) → profile
  const rowChangePercent =
    event.payload.rowsAffected / lastProfile.profile.rowCount;

  if (rowChangePercent > 0.1) {
    console.log(
      `[ProfileSubscriber] Major data change (${(rowChangePercent * 100).toFixed(1)}%): profiling`
    );
    await runProfilerFromDataRefresh(event);
    return;
  }

  console.log(
    `[ProfileSubscriber] Recent profile + minor refresh: skipping`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handler: metadata.approved
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle metadata.approved event from Approval workflow.
 *
 * Decision logic:
 * - Tier1/Tier2 approvals → Always profile (validate SoT compliance)
 * - Tier3+ → Skip (not critical)
 */
async function handleMetadataApproved(event: Event): Promise<void> {
  if (event.type !== 'metadata.approved') return;

  console.log(
    `[ProfileSubscriber] Metadata approved: ${event.payload.canonicalKey} (tier: ${event.payload.tier})`
  );

  // Only profile Tier1/Tier2 approvals
  if (event.payload.tier === 'tier1' || event.payload.tier === 'tier2') {
    console.log(
      `[ProfileSubscriber] Tier1/2 approval: profiling to validate`
    );
    await runProfiler(event);
  } else {
    console.log(
      `[ProfileSubscriber] Tier3+ approval: skipping profile`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Profiler Execution Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run profiler for metadata.profile.due or metadata.approved events.
 */
async function runProfiler(event: Event): Promise<void> {
  if (event.type !== 'metadata.profile.due' && event.type !== 'metadata.approved') {
    return;
  }

  const { entityId, canonicalKey } = event.payload;

  // Resolve entity → table
  const tableLocation = await resolveEntityToTable(
    event.tenantId,
    entityId,
    canonicalKey
  );

  if (!tableLocation) {
    console.warn(
      `[ProfileSubscriber] Cannot resolve table for ${canonicalKey}: skipping`
    );
    return;
  }

  try {
    const result = await qualityService.runProfiler({
      tenantId: event.tenantId,
      entityUrn: canonicalKey,
      service: tableLocation,
      triggeredBy: {
        actorId: event.source,
        actorType: 'SYSTEM',
      },
      governanceTier: event.payload.tier as any,
    });

    // Emit success event
    await eventBus.emitEvent({
      id: uuidv4(),
      type: 'metadata.profile.completed',
      version: '1.0.0',
      tenantId: event.tenantId,
      source: 'metadata-studio.api',
      correlationId: event.id,
      createdAt: new Date().toISOString(),
      payload: {
        entityType: 'METADATA',
        entityId,
        canonicalKey,
        completeness: result.profile.completeness || 0,
        uniqueness: result.profile.uniqueness || 0,
        validity: result.profile.validity || 0,
        qualityScore: result.profile.qualityScore || 0,
        qualityGrade: result.qualityGrade,
        profileId: result.profileId,
        rowCount: result.profile.rowCount,
        duration: 0, // TODO: track actual duration
        triggeredBy: {
          actorId: event.source,
          actorType: 'SYSTEM',
        },
      },
    });

    console.log(
      `[ProfileSubscriber] Profile completed: ${canonicalKey} (score: ${result.profile.qualityScore}%)`
    );
  } catch (error: any) {
    console.error(
      `[ProfileSubscriber] Profile failed for ${canonicalKey}:`,
      error
    );

    // Emit failure event
    await eventBus.emitEvent({
      id: uuidv4(),
      type: 'metadata.profile.failed',
      version: '1.0.0',
      tenantId: event.tenantId,
      source: 'metadata-studio.api',
      correlationId: event.id,
      createdAt: new Date().toISOString(),
      payload: {
        entityType: 'METADATA',
        entityId,
        canonicalKey,
        error: error?.message ?? String(error),
        triggeredBy: {
          actorId: event.source,
          actorType: 'SYSTEM',
        },
      },
    });
  }
}

/**
 * Run profiler for data.refreshed events.
 */
async function runProfilerFromDataRefresh(event: Event): Promise<void> {
  if (event.type !== 'data.refreshed') return;

  try {
    const result = await qualityService.runProfiler({
      tenantId: event.tenantId,
      entityUrn: event.payload.entityUrn,
      service: event.payload.service,
      triggeredBy: event.payload.triggeredBy,
    });

    // Emit success event
    await eventBus.emitEvent({
      id: uuidv4(),
      type: 'metadata.profile.completed',
      version: '1.0.0',
      tenantId: event.tenantId,
      source: 'metadata-studio.api',
      correlationId: event.id,
      createdAt: new Date().toISOString(),
      payload: {
        entityType: 'METADATA',
        entityId: '', // Not available from data.refreshed
        canonicalKey: event.payload.entityUrn,
        completeness: result.profile.completeness || 0,
        uniqueness: result.profile.uniqueness || 0,
        validity: result.profile.validity || 0,
        qualityScore: result.profile.qualityScore || 0,
        qualityGrade: result.qualityGrade,
        profileId: result.profileId,
        rowCount: result.profile.rowCount,
        duration: 0,
        triggeredBy: event.payload.triggeredBy,
      },
    });

    console.log(
      `[ProfileSubscriber] Profile completed: ${event.payload.entityUrn} (score: ${result.profile.qualityScore}%)`
    );
  } catch (error: any) {
    console.error(
      `[ProfileSubscriber] Profile failed for ${event.payload.entityUrn}:`,
      error
    );

    await eventBus.emitEvent({
      id: uuidv4(),
      type: 'metadata.profile.failed',
      version: '1.0.0',
      tenantId: event.tenantId,
      source: 'metadata-studio.api',
      correlationId: event.id,
      createdAt: new Date().toISOString(),
      payload: {
        entityType: 'METADATA',
        entityId: '',
        canonicalKey: event.payload.entityUrn,
        error: error?.message ?? String(error),
        triggeredBy: event.payload.triggeredBy,
      },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Subscriber Registration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Register all profile-related event subscribers.
 * Call this once at application startup.
 */
export function registerProfileSubscribers(): void {
  eventBus.subscribe('metadata.profile.due', handleProfileDue);
  eventBus.subscribe('data.refreshed', handleDataRefreshed);
  eventBus.subscribe('metadata.approved', handleMetadataApproved);

  console.log('[ProfileSubscriber] All profile subscribers registered ✅');
}

