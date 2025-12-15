// metadata-studio/db/schema/profile-job.tables.ts

/**
 * Profile Job Table (Optional - Advanced Deduplication)
 *
 * Purpose:
 * - Exactly-once guarantee (one job per entity at a time)
 * - Concurrent request protection (multiple events → single execution)
 * - Job history/audit trail
 * - Retry logic for failed profiles
 *
 * When to Use:
 * - High-volume event streams (>1000 events/day)
 * - Distributed deployments (multiple Metadata Studio instances)
 * - Need exactly-once semantics
 * - Need job history for debugging
 *
 * When NOT to Use:
 * - Single-instance deployments (EventEmitter is fine)
 * - Low event volume (<100 events/day)
 * - Layers 1-2 cost guards are sufficient
 *
 * Implementation Note:
 * - This table is OPTIONAL (not required for basic functionality)
 * - Layers 1-2 cost guards already handle most spam
 * - Use this for production-grade exactly-once guarantees
 */

import {
    pgTable,
    uuid,
    text,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';

/**
 * mdm_profile_job
 *
 * Tracks profiler job execution state.
 * Unique constraint ensures one pending/running job per entity.
 */
export const mdmProfileJob = pgTable(
    'mdm_profile_job',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // Tenant isolation
        tenantId: text('tenant_id').notNull(),

        // Entity being profiled
        entityType: text('entity_type').notNull(), // 'METADATA' | 'KPI'
        entityId: uuid('entity_id').notNull(),
        entityKey: text('entity_key').notNull(), // Canonical key (for display)

        // Job state
        status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'

        // Timestamps
        scheduledAt: timestamp('scheduled_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        startedAt: timestamp('started_at', { withTimezone: true }),
        finishedAt: timestamp('finished_at', { withTimezone: true }),

        // Error tracking
        lastError: text('last_error'),
        retryCount: text('retry_count').notNull().default('0'),

        // Trigger context
        triggeredBy: text('triggered_by').notNull(), // 'scheduler' | 'approval' | 'etl'
        reason: text('reason').notNull(), // 'SCHEDULE' | 'STRUCTURAL_CHANGE' | 'QUALITY_DROP'

        // Result (profile ID)
        profileId: uuid('profile_id'), // mdm_profile.id (set on completion)

        // Event correlation
        correlationId: text('correlation_id'), // Original event ID
    },
    (table) => ({
        /**
         * Unique constraint: one pending/running job per entity.
         *
         * Key: (tenantId, entityType, entityId)
         *
         * This ensures:
         * - Multiple events for same entity → only one executes
         * - Completed/failed jobs can be replaced (partial unique index)
         * - No distributed locks needed (database handles it)
         */
        tenantEntityStatusUq: uniqueIndex('profile_job_tenant_entity_status_uq').on(
            table.tenantId,
            table.entityType,
            table.entityId,
            table.status
        ).where('status IN (\'pending\', \'running\')'),

        // Index for querying jobs by status
        statusIdx: index('profile_job_status_idx').on(
            table.tenantId,
            table.status,
        ),

        // Index for querying job history by entity
        entityIdx: index('profile_job_entity_idx').on(
            table.tenantId,
            table.entityType,
            table.entityId,
        ),
    })
);

/**
 * Usage Example:
 *
 * ```typescript
 * // In profile.subscriber.ts
 *
 * async function handleProfileDue(event: Event): Promise<void> {
 *   let jobId: string;
 *
 *   try {
 *     // 1. Try to insert pending job (deduplication check)
 *     const [job] = await db.insert(mdmProfileJob).values({
 *       tenantId: event.tenantId,
 *       entityType: event.payload.entityType,
 *       entityId: event.payload.entityId,
 *       entityKey: event.payload.canonicalKey,
 *       status: 'pending',
 *       triggeredBy: event.source,
 *       reason: event.payload.reason,
 *       correlationId: event.id,
 *     }).returning();
 *
 *     jobId = job.id;
 *   } catch (error: any) {
 *     // Unique constraint violation → job already pending/running
 *     if (error.code === '23505') {
 *       console.log(`Job already pending for ${event.payload.canonicalKey}`);
 *       return; // Skip (exactly-once protection)
 *     }
 *     throw error;
 *   }
 *
 *   // 2. Update to 'running'
 *   await db.update(mdmProfileJob)
 *     .set({ status: 'running', startedAt: new Date() })
 *     .where(eq(mdmProfileJob.id, jobId));
 *
 *   try {
 *     // 3. Run profiler
 *     const result = await qualityService.runProfiler({...});
 *
 *     // 4. Mark completed
 *     await db.update(mdmProfileJob)
 *       .set({
 *         status: 'completed',
 *         finishedAt: new Date(),
 *         profileId: result.profileId,
 *       })
 *       .where(eq(mdmProfileJob.id, jobId));
 *
 *     // 5. Emit success event
 *     await eventBus.publish({
 *       type: 'metadata.profile.completed',
 *       ...
 *     });
 *   } catch (error: any) {
 *     // 6. Mark failed (with retry logic)
 *     const [failedJob] = await db.update(mdmProfileJob)
 *       .set({
 *         status: 'failed',
 *         finishedAt: new Date(),
 *         lastError: error.message,
 *         retryCount: sql`${mdmProfileJob.retryCount} + 1`,
 *       })
 *       .where(eq(mdmProfileJob.id, jobId))
 *       .returning();
 *
 *     // 7. Emit failure event
 *     await eventBus.publish({
 *       type: 'metadata.profile.failed',
 *       ...
 *     });
 *
 *     // 8. Optional: Auto-retry if retryCount < 3
 *     if (parseInt(failedJob.retryCount) < 3) {
 *       setTimeout(async () => {
 *         await eventBus.publish({
 *           type: 'metadata.profile.due',
 *           payload: { ...event.payload, reason: 'RETRY' },
 *         });
 *       }, 60000); // Retry after 1 minute
 *     }
 *   }
 * }
 * ```
 */

/**
 * Helper: Get job history for an entity
 */
export async function getProfileJobHistory(
    tenantId: string,
    entityId: string,
    limit: number = 20
) {
    // This function would be in a repository file
    // Included here for documentation
    return []; // Placeholder
}

/**
 * Helper: Get pending jobs (for monitoring)
 */
export async function getPendingProfileJobs(tenantId: string) {
    // This function would be in a repository file
    return []; // Placeholder
}

/**
 * Helper: Clean up old completed jobs (cron job)
 */
export async function cleanupOldProfileJobs(
    olderThanDays: number = 30
) {
    // DELETE completed/failed jobs older than X days
    // Keep pending/running jobs forever (shouldn't happen, but safe)
    return 0; // Placeholder
}

