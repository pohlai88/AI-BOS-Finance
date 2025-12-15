// metadata-studio/services/rollback.service.ts

/**
 * Rollback Service
 * 
 * GRCD Phase 3: Change Reversal
 * 
 * Enables reversal of auto-applied or human-approved changes
 * by restoring previous state from change history.
 */

import { db } from '../db/client';
import { mdmChangeHistory } from '../db/schema/auto-apply.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmBusinessRule } from '../db/schema/business-rule.tables';
import { mdmKpiDefinition } from '../db/schema/kpi.tables';
import { mdmGlossaryTerm } from '../db/schema/glossary.tables';
import { eq, and, desc } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface RollbackResult {
  success: boolean;
  changeHistoryId: string;
  entityType: string;
  entityId: string;
  previousState: unknown;
  restoredState: unknown;
  error?: string;
}

export interface ChangeHistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  entityKey?: string | null;
  changeType: string;
  previousState: unknown;
  newState: unknown;
  changedBy: string;
  changeSource: string;
  agentType?: string | null;
  isRolledBack: boolean;
  createdAt: Date;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get change history for an entity
 */
export async function getChangeHistory(
  tenantId: string,
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<ChangeHistoryEntry[]> {
  const history = await db
    .select()
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.entityType, entityType as any),
        eq(mdmChangeHistory.entityId, entityId),
      ),
    )
    .orderBy(desc(mdmChangeHistory.createdAt))
    .limit(limit);

  return history.map(h => ({
    id: h.id,
    entityType: h.entityType,
    entityId: h.entityId,
    entityKey: h.entityKey,
    changeType: h.changeType,
    previousState: h.previousState,
    newState: h.newState,
    changedBy: h.changedBy,
    changeSource: h.changeSource,
    agentType: h.agentType,
    isRolledBack: h.isRolledBack,
    createdAt: h.createdAt,
  }));
}

/**
 * Rollback a specific change
 */
export async function rollbackChange(
  changeHistoryId: string,
  rolledBackBy: string,
  reason: string,
): Promise<RollbackResult> {
  // 1. Get the change record
  const [change] = await db
    .select()
    .from(mdmChangeHistory)
    .where(eq(mdmChangeHistory.id, changeHistoryId))
    .limit(1);

  if (!change) {
    return {
      success: false,
      changeHistoryId,
      entityType: 'unknown',
      entityId: 'unknown',
      previousState: null,
      restoredState: null,
      error: 'Change history record not found',
    };
  }

  if (change.isRolledBack) {
    return {
      success: false,
      changeHistoryId,
      entityType: change.entityType,
      entityId: change.entityId,
      previousState: change.previousState,
      restoredState: null,
      error: 'Change has already been rolled back',
    };
  }

  if (!change.previousState) {
    return {
      success: false,
      changeHistoryId,
      entityType: change.entityType,
      entityId: change.entityId,
      previousState: null,
      restoredState: null,
      error: 'No previous state available for rollback (was this a create operation?)',
    };
  }

  try {
    // 2. Restore previous state based on entity type
    await restoreEntity(
      change.entityType,
      change.entityId,
      change.previousState as Record<string, unknown>,
      change.tenantId,
    );

    // 3. Mark change as rolled back
    await db
      .update(mdmChangeHistory)
      .set({
        isRolledBack: true,
        rolledBackAt: new Date(),
        rolledBackBy,
        rollbackReason: reason,
      })
      .where(eq(mdmChangeHistory.id, changeHistoryId));

    // 4. Create a new change history entry for the rollback
    await db.insert(mdmChangeHistory).values({
      tenantId: change.tenantId,
      entityType: change.entityType as any,
      entityId: change.entityId,
      entityKey: change.entityKey,
      changeType: 'update',
      previousState: change.newState,
      newState: change.previousState,
      changedBy: rolledBackBy,
      changeSource: 'system',
    });

    return {
      success: true,
      changeHistoryId,
      entityType: change.entityType,
      entityId: change.entityId,
      previousState: change.newState,
      restoredState: change.previousState,
    };
  } catch (error) {
    return {
      success: false,
      changeHistoryId,
      entityType: change.entityType,
      entityId: change.entityId,
      previousState: change.previousState,
      restoredState: null,
      error: error instanceof Error ? error.message : 'Unknown error during rollback',
    };
  }
}

/**
 * Rollback to a specific point in time for an entity
 */
export async function rollbackToPoint(
  tenantId: string,
  entityType: string,
  entityId: string,
  targetTimestamp: Date,
  rolledBackBy: string,
  reason: string,
): Promise<RollbackResult> {
  // Find the state at the target timestamp
  const [targetChange] = await db
    .select()
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.entityType, entityType as any),
        eq(mdmChangeHistory.entityId, entityId),
      ),
    )
    .orderBy(desc(mdmChangeHistory.createdAt))
    .limit(1);

  if (!targetChange) {
    return {
      success: false,
      changeHistoryId: '',
      entityType,
      entityId,
      previousState: null,
      restoredState: null,
      error: 'No change history found for this entity',
    };
  }

  // Get all changes after the target timestamp
  const changesToRollback = await db
    .select()
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.entityType, entityType as any),
        eq(mdmChangeHistory.entityId, entityId),
        eq(mdmChangeHistory.isRolledBack, false),
      ),
    )
    .orderBy(desc(mdmChangeHistory.createdAt));

  // Find the first change before or at the target timestamp
  let targetState: unknown = null;
  for (const change of changesToRollback) {
    if (change.createdAt <= targetTimestamp) {
      targetState = change.newState;
      break;
    }
    if (change.previousState && change.createdAt > targetTimestamp) {
      targetState = change.previousState;
    }
  }

  if (!targetState) {
    return {
      success: false,
      changeHistoryId: '',
      entityType,
      entityId,
      previousState: null,
      restoredState: null,
      error: 'Could not determine state at target timestamp',
    };
  }

  try {
    // Restore the entity to target state
    await restoreEntity(
      entityType,
      entityId,
      targetState as Record<string, unknown>,
      tenantId,
    );

    // Record the rollback
    const [rollbackRecord] = await db
      .insert(mdmChangeHistory)
      .values({
        tenantId,
        entityType: entityType as any,
        entityId,
        changeType: 'update',
        previousState: null, // Current state unknown
        newState: targetState,
        changedBy: rolledBackBy,
        changeSource: 'system',
      })
      .returning();

    return {
      success: true,
      changeHistoryId: rollbackRecord.id,
      entityType,
      entityId,
      previousState: null,
      restoredState: targetState,
    };
  } catch (error) {
    return {
      success: false,
      changeHistoryId: '',
      entityType,
      entityId,
      previousState: null,
      restoredState: null,
      error: error instanceof Error ? error.message : 'Unknown error during rollback',
    };
  }
}

// ============================================================================
// Entity Restoration Functions
// ============================================================================

async function restoreEntity(
  entityType: string,
  entityId: string,
  state: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  switch (entityType) {
    case 'GLOBAL_METADATA':
      await restoreGlobalMetadata(entityId, state, tenantId);
      break;
    case 'BUSINESS_RULE':
      await restoreBusinessRule(entityId, state, tenantId);
      break;
    case 'KPI':
      await restoreKpi(entityId, state, tenantId);
      break;
    case 'GLOSSARY':
      await restoreGlossary(entityId, state, tenantId);
      break;
    default:
      throw new Error(`Unsupported entity type for rollback: ${entityType}`);
  }
}

async function restoreGlobalMetadata(
  entityId: string,
  state: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  const { id, createdAt, updatedAt, ...updateData } = state;
  
  await db
    .update(mdmGlobalMetadata)
    .set({
      ...updateData,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(mdmGlobalMetadata.id, entityId),
        eq(mdmGlobalMetadata.tenantId, tenantId),
      ),
    );
}

async function restoreBusinessRule(
  entityId: string,
  state: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  const { id, createdAt, updatedAt, ...updateData } = state;
  
  await db
    .update(mdmBusinessRule)
    .set({
      ...updateData,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(mdmBusinessRule.id, entityId),
        eq(mdmBusinessRule.tenantId, tenantId),
      ),
    );
}

async function restoreKpi(
  entityId: string,
  state: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  const { id, createdAt, updatedAt, ...updateData } = state;
  
  await db
    .update(mdmKpiDefinition)
    .set({
      ...updateData,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(mdmKpiDefinition.id, entityId),
        eq(mdmKpiDefinition.tenantId, tenantId),
      ),
    );
}

async function restoreGlossary(
  entityId: string,
  state: Record<string, unknown>,
  tenantId: string,
): Promise<void> {
  const { id, createdAt, updatedAt, ...updateData } = state;
  
  await db
    .update(mdmGlossaryTerm)
    .set({
      ...updateData,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(mdmGlossaryTerm.id, entityId),
        eq(mdmGlossaryTerm.tenantId, tenantId),
      ),
    );
}

/**
 * Get rollback-eligible changes (not already rolled back, has previous state)
 */
export async function getRollbackEligibleChanges(
  tenantId: string,
  entityType?: string,
  limit = 50,
): Promise<ChangeHistoryEntry[]> {
  let query = db
    .select()
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.isRolledBack, false),
      ),
    )
    .orderBy(desc(mdmChangeHistory.createdAt))
    .limit(limit);

  const history = await query;

  return history
    .filter(h => h.previousState !== null)
    .map(h => ({
      id: h.id,
      entityType: h.entityType,
      entityId: h.entityId,
      entityKey: h.entityKey,
      changeType: h.changeType,
      previousState: h.previousState,
      newState: h.newState,
      changedBy: h.changedBy,
      changeSource: h.changeSource,
      agentType: h.agentType,
      isRolledBack: h.isRolledBack,
      createdAt: h.createdAt,
    }));
}

