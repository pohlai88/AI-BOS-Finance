// metadata-studio/db/observability.repo.ts
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './client';
import { mdmUsageLog, mdmProfile } from './schema/observability.tables';

/**
 * Usage event payload (what gets logged)
 */
export type UsageEvent = {
  tenantId: string;
  entityUrn: string;
  conceptId?: string;
  actorId: string;
  actorType: 'HUMAN' | 'AGENT' | 'SYSTEM';
  eventType: 'read' | 'query' | 'export' | 'write' | 'download';
  governanceTier?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  source?: string;
  metadata?: Record<string, unknown>;
  usedAt?: Date;
};

/**
 * Aggregated usage statistics for an entity
 */
export type UsageStats = {
  entityUrn: string;
  totalAccess: number;
  uniqueUsers: number;
  readCount: number;
  writeCount: number;
  queryCount: number;
  exportCount: number;
  downloadCount: number;
  popularityScore: number;
  lastAccessedAt: Date | null;
};

/**
 * Profile input (what gets saved)
 */
export type ProfileInput = {
  tenantId: string;
  entityUrn: string;
  profile: Record<string, unknown>;
  completeness?: number;
  uniqueness?: number;
  validity?: number;
  qualityScore?: number;
  governanceTier?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  standardPackId?: string;
  createdBy: string;
};

/**
 * Observability Repository
 *
 * Implements:
 * - Usage event logging (trackUsageEvent)
 * - Usage analytics (getUsageStats, getPopularEntities, getUserActivity)
 * - Data quality profiling (saveProfile, getLatestProfile, getProfileHistory)
 *
 * Closes audit gaps from GRCD review (NJo6):
 * - "observability.repo.ts is stubbed" → RESOLVED
 * - "No usage tracking for Tier1/2" → RESOLVED
 * - "No profile storage" → RESOLVED
 */
export const observabilityRepo = {
  //
  // ═══════════════════════════════════════════════════════════════════
  // USAGE EVENTS
  // ═══════════════════════════════════════════════════════════════════
  //

  /**
   * Track a single usage event (read, write, query, export, download)
   *
   * Example:
   * ```ts
   * await observabilityRepo.trackUsageEvent({
   *   tenantId: '123',
   *   entityUrn: 'gl.account:cash_and_cash_equivalents',
   *   actorId: 'user-456',
   *   actorType: 'HUMAN',
   *   eventType: 'read',
   *   governanceTier: 'T1',
   *   source: 'metadata-studio-api',
   *   metadata: { requestId: 'xyz', endpoint: '/metadata' }
   * });
   * ```
   */
  async trackUsageEvent(event: UsageEvent) {
    const [row] = await db
      .insert(mdmUsageLog)
      .values({
        tenantId: event.tenantId,
        entityUrn: event.entityUrn,
        conceptId: event.conceptId,
        actorId: event.actorId,
        actorType: event.actorType,
        eventType: event.eventType,
        governanceTier: event.governanceTier,
        source: event.source,
        usedAt: event.usedAt ?? new Date(),
        metadata: event.metadata ?? {},
      })
      .returning();

    return row;
  },

  /**
   * Get aggregated usage statistics for a specific entity URN.
   *
   * Returns:
   * - Total access count
   * - Unique users count
   * - Breakdown by event type (read, write, query, export, download)
   * - Popularity score (0-100, logarithmic scale)
   * - Last accessed timestamp
   *
   * Example:
   * ```ts
   * const stats = await observabilityRepo.getUsageStats(
   *   'tenant-123',
   *   'gl.account:revenue_gross'
   * );
   * console.log(stats.totalAccess);      // 1500
   * console.log(stats.uniqueUsers);      // 45
   * console.log(stats.readCount);        // 1200
   * console.log(stats.popularityScore);  // 78
   * ```
   */
  async getUsageStats(tenantId: string, entityUrn: string): Promise<UsageStats | null> {
    const [row] = await db
      .select({
        entityUrn: mdmUsageLog.entityUrn,
        totalAccess: sql<number>`COUNT(*)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${mdmUsageLog.actorId})`,
        readCount: sql<number>`COUNT(*) FILTER (WHERE ${mdmUsageLog.eventType} = 'read')`,
        writeCount: sql<number>`COUNT(*) FILTER (WHERE ${mdmUsageLog.eventType} = 'write')`,
        queryCount: sql<number>`COUNT(*) FILTER (WHERE ${mdmUsageLog.eventType} = 'query')`,
        exportCount: sql<number>`COUNT(*) FILTER (WHERE ${mdmUsageLog.eventType} = 'export')`,
        downloadCount: sql<number>`COUNT(*) FILTER (WHERE ${mdmUsageLog.eventType} = 'download')`,
        lastAccessedAt: sql<Date | null>`MAX(${mdmUsageLog.usedAt})`,
      })
      .from(mdmUsageLog)
      .where(
        and(
          eq(mdmUsageLog.tenantId, tenantId),
          eq(mdmUsageLog.entityUrn, entityUrn),
        ),
      )
      .groupBy(mdmUsageLog.entityUrn);

    if (!row) return null;

    // Popularity score: logarithmic scale (0-100)
    // 1 access = 0, 10 = 25, 100 = 50, 1000 = 75, 10000+ = 100
    const popularityScore =
      row.totalAccess === 0
        ? 0
        : Math.min(100, Math.round(Math.log10(row.totalAccess + 1) * 25));

    return {
      entityUrn: row.entityUrn,
      totalAccess: row.totalAccess,
      uniqueUsers: row.uniqueUsers,
      readCount: row.readCount,
      writeCount: row.writeCount,
      queryCount: row.queryCount,
      exportCount: row.exportCount,
      downloadCount: row.downloadCount,
      lastAccessedAt: row.lastAccessedAt,
      popularityScore,
    };
  },

  /**
   * Get most popular entities (most accessed) for a tenant.
   *
   * Useful for:
   * - "Top 10 most accessed Tier1 fields"
   * - "Which metadata is business users actually using?"
   * - Prioritizing data quality efforts
   *
   * Example:
   * ```ts
   * const top10 = await observabilityRepo.getPopularEntities('tenant-123', 10);
   * top10.forEach(e => console.log(`${e.entityUrn}: ${e.totalAccess} accesses`));
   * ```
   */
  async getPopularEntities(tenantId: string, limit: number) {
    const rows = await db
      .select({
        entityUrn: mdmUsageLog.entityUrn,
        totalAccess: sql<number>`COUNT(*)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${mdmUsageLog.actorId})`,
        lastAccessedAt: sql<Date | null>`MAX(${mdmUsageLog.usedAt})`,
      })
      .from(mdmUsageLog)
      .where(eq(mdmUsageLog.tenantId, tenantId))
      .groupBy(mdmUsageLog.entityUrn)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return rows.map((row) => ({
      entityUrn: row.entityUrn,
      totalAccess: row.totalAccess,
      uniqueUsers: row.uniqueUsers,
      lastAccessedAt: row.lastAccessedAt,
    }));
  },

  //
  // ═══════════════════════════════════════════════════════════════════
  // USER ACTIVITY (audit trail helper)
  // ═══════════════════════════════════════════════════════════════════
  //

  /**
   * Get recent activity for a specific user/actor.
   *
   * Useful for:
   * - User audit trails ("What did user X access?")
   * - Compliance reports ("Show all Tier1 accesses by CFO")
   * - Suspicious activity detection
   *
   * Example:
   * ```ts
   * const activity = await observabilityRepo.getUserActivity(
   *   'tenant-123',
   *   'user-cfo',
   *   50
   * );
   * activity.forEach(log => {
   *   console.log(`${log.eventType} ${log.entityUrn} at ${log.usedAt}`);
   * });
   * ```
   */
  async getUserActivity(tenantId: string, actorId: string, limit: number = 50) {
    const rows = await db
      .select()
      .from(mdmUsageLog)
      .where(
        and(
          eq(mdmUsageLog.tenantId, tenantId),
          eq(mdmUsageLog.actorId, actorId),
        ),
      )
      .orderBy(desc(mdmUsageLog.usedAt))
      .limit(limit);

    return rows;
  },

  //
  // ═══════════════════════════════════════════════════════════════════
  // DATA QUALITY PROFILES
  // ═══════════════════════════════════════════════════════════════════
  //

  /**
   * Save a new data quality profile snapshot.
   *
   * Profiles contain:
   * - Statistical metrics (min, max, avg, stddev, percentiles)
   * - Quality metrics (completeness, uniqueness, validity)
   * - Value distributions (top values, cardinality)
   * - Governance context (tier, SoT pack)
   *
   * Example:
   * ```ts
   * await observabilityRepo.saveProfile({
   *   tenantId: 'tenant-123',
   *   entityUrn: 'gl.account:revenue_gross',
   *   profile: {
   *     rowCount: 10000,
   *     nullCount: 15,
   *     distinctCount: 9985,
   *     min: 0,
   *     max: 1500000.50,
   *     avg: 45000.75,
   *     stddev: 12000.30,
   *     percentiles: { p50: 40000, p95: 120000, p99: 250000 }
   *   },
   *   completeness: 99.85,
   *   uniqueness: 99.85,
   *   validity: 100.0,
   *   qualityScore: 99.9,
   *   governanceTier: 'T1',
   *   createdBy: 'profiler-agent'
   * });
   * ```
   */
  async saveProfile(input: ProfileInput) {
    const [row] = await db
      .insert(mdmProfile)
      .values({
        tenantId: input.tenantId,
        entityUrn: input.entityUrn,
        profile: input.profile,
        completeness:
          input.completeness !== undefined ? String(input.completeness) : null,
        uniqueness:
          input.uniqueness !== undefined ? String(input.uniqueness) : null,
        validity:
          input.validity !== undefined ? String(input.validity) : null,
        qualityScore:
          input.qualityScore !== undefined ? String(input.qualityScore) : null,
        governanceTier: input.governanceTier,
        standardPackId: input.standardPackId,
        createdBy: input.createdBy,
      })
      .returning();

    return row;
  },

  /**
   * Get the most recent profile for an entity.
   *
   * Example:
   * ```ts
   * const latest = await observabilityRepo.getLatestProfile(
   *   'tenant-123',
   *   'gl.account:revenue_gross'
   * );
   * if (latest) {
   *   console.log(`Quality score: ${latest.qualityScore}`);
   *   console.log(`Completeness: ${latest.completeness}%`);
   * }
   * ```
   */
  async getLatestProfile(tenantId: string, entityUrn: string) {
    const [row] = await db
      .select()
      .from(mdmProfile)
      .where(
        and(
          eq(mdmProfile.tenantId, tenantId),
          eq(mdmProfile.entityUrn, entityUrn),
        ),
      )
      .orderBy(desc(mdmProfile.createdAt))
      .limit(1);

    return row ?? null;
  },

  /**
   * Get profile history (time series of quality metrics).
   *
   * Useful for:
   * - Trend analysis ("Is data quality improving or degrading?")
   * - Anomaly detection ("Quality dropped 20% this week!")
   * - Audit trail ("Show quality history for Tier1 fields")
   *
   * Example:
   * ```ts
   * const history = await observabilityRepo.getProfileHistory(
   *   'tenant-123',
   *   'gl.account:revenue_gross',
   *   20
   * );
   * history.forEach(profile => {
   *   console.log(`${profile.createdAt}: quality=${profile.qualityScore}`);
   * });
   * ```
   */
  async getProfileHistory(tenantId: string, entityUrn: string, limit = 20) {
    const rows = await db
      .select()
      .from(mdmProfile)
      .where(
        and(
          eq(mdmProfile.tenantId, tenantId),
          eq(mdmProfile.entityUrn, entityUrn),
        ),
      )
      .orderBy(desc(mdmProfile.createdAt))
      .limit(limit);

    return rows;
  },
};

