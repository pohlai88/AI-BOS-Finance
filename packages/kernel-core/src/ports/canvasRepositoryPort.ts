/**
 * Canvas Repository Port
 * 
 * Interface for canvas persistence operations.
 * Used by the Lively Layer for AP Manager collaborative workspace.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. ENUMS & TYPES
// ============================================================================

/**
 * Canvas object types
 */
export type CanvasObjectType = 'hydrated_sticky' | 'plain_sticky' | 'annotation';

/**
 * Canvas layer types with z-index semantics
 */
export type CanvasLayerType = 'data' | 'team' | 'personal';

/**
 * Source entity status (for ghost state handling)
 */
export type SourceStatus = 'active' | 'archived' | 'deleted' | 'orphaned';

/**
 * Zone types for workflow triggers
 */
export type ZoneType = 'inbox' | 'in_progress' | 'review' | 'done' | 'blocked' | 'custom';

/**
 * Zone trigger actions
 */
export type ZoneTriggerAction = 'none' | 'status_update' | 'notify' | 'archive' | 'escalate';

/**
 * Connector styles
 */
export type ConnectorStyle = 'arrow' | 'line' | 'dashed' | 'double';

/**
 * Canvas audit actions
 */
export type CanvasAuditAction =
  | 'object_created'
  | 'object_moved'
  | 'object_updated'
  | 'object_deleted'
  | 'zone_enter'
  | 'zone_exit'
  | 'zone_trigger_fired'
  | 'reaction_added'
  | 'reaction_removed'
  | 'acknowledged'
  | 'tag_added'
  | 'tag_removed'
  | 'source_status_changed';

// ============================================================================
// 2. ENTITY INTERFACES
// ============================================================================

/**
 * Canvas zone entity
 */
export interface CanvasZone {
  id: string;
  tenantId: string;
  name: string;
  zoneType: ZoneType;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  triggerAction: ZoneTriggerAction;
  triggerConfig: Record<string, unknown>;
  allowedRoles: string[];
  displayOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Canvas object entity (hydrated sticky, plain sticky, annotation)
 */
export interface CanvasObject {
  id: string;
  tenantId: string;
  objectType: CanvasObjectType;
  layerType: CanvasLayerType;
  ownerId?: string;
  
  // Source binding
  sourceRef?: string;
  sourceStatus: SourceStatus;
  sourceLastSync?: Date;
  
  // Position
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  
  // Data
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  tags: string[];
  
  // Zone
  zoneId?: string;
  
  // Pre-flight
  priorityScore: number;
  requiresAcknowledgment: boolean;
  
  // Versioning
  version: number;
  
  // Timestamps
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

/**
 * Display data for canvas objects (denormalized from source)
 */
export interface CanvasDisplayData {
  entityType?: string;
  cellCode?: string;
  title?: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  amount?: string;
  currency?: string;
  dueDate?: string;
  urgency?: 'normal' | 'soon' | 'overdue' | 'critical';
  content?: string;  // For plain stickies
  metadata?: Record<string, unknown>;
}

/**
 * Style configuration for canvas objects
 */
export interface CanvasStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  opacity?: number;
  ghostIcon?: string;
}

/**
 * Canvas connector entity
 */
export interface CanvasConnector {
  id: string;
  tenantId: string;
  fromObjectId: string;
  toObjectId: string;
  connectorStyle: ConnectorStyle;
  label?: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Canvas reaction entity
 */
export interface CanvasReaction {
  id: string;
  objectId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

/**
 * Canvas acknowledgment entity
 */
export interface CanvasAcknowledgment {
  id: string;
  objectId: string;
  userId: string;
  acknowledgedAt: Date;
  comment?: string;
  auditEventId?: string;
}

/**
 * Canvas audit log entry
 */
export interface CanvasAuditEntry {
  id: string;
  tenantId: string;
  action: CanvasAuditAction;
  actorId: string;
  actorName?: string;
  objectId?: string;
  objectSourceRef?: string;
  zoneId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
  correlationId?: string;
  createdAt: Date;
}

// ============================================================================
// 3. INPUT INTERFACES
// ============================================================================

/**
 * Transaction context
 */
export interface CanvasTransactionContext {
  tx: unknown;
  correlationId: string;
}

/**
 * Create zone input
 */
export interface CreateZoneInput {
  tenantId: string;
  name: string;
  zoneType: ZoneType;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  triggerAction?: ZoneTriggerAction;
  triggerConfig?: Record<string, unknown>;
  allowedRoles?: string[];
  displayOrder?: number;
}

/**
 * Update zone input
 */
export interface UpdateZoneInput {
  name?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  triggerAction?: ZoneTriggerAction;
  triggerConfig?: Record<string, unknown>;
  allowedRoles?: string[];
  displayOrder?: number;
}

/**
 * Create object input
 */
export interface CreateObjectInput {
  tenantId: string;
  objectType: CanvasObjectType;
  layerType: CanvasLayerType;
  ownerId?: string;
  sourceRef?: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  zIndex?: number;
  displayData: CanvasDisplayData;
  style?: CanvasStyle;
  tags?: string[];
  zoneId?: string;
  priorityScore?: number;
  requiresAcknowledgment?: boolean;
  createdBy: string;
}

/**
 * Update object input
 */
export interface UpdateObjectInput {
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  displayData?: Partial<CanvasDisplayData>;
  style?: Partial<CanvasStyle>;
  tags?: string[];
  zoneId?: string | null;
  priorityScore?: number;
  requiresAcknowledgment?: boolean;
  sourceStatus?: SourceStatus;
  sourceLastSync?: Date;
  updatedBy: string;
}

/**
 * Object move input (for zone triggers)
 */
export interface MoveObjectInput {
  positionX?: number;
  positionY?: number;
  zoneId?: string | null;
  expectedVersion: number;
  updatedBy: string;
}

/**
 * Query filters for objects
 */
export interface ObjectQueryFilters {
  tenantId: string;
  layerType?: CanvasLayerType;
  ownerId?: string;  // For personal layer
  zoneId?: string;
  objectType?: CanvasObjectType;
  sourceRef?: string;
  tags?: string[];  // Objects containing any of these tags
  requiresAcknowledgment?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Create connector input
 */
export interface CreateConnectorInput {
  tenantId: string;
  fromObjectId: string;
  toObjectId: string;
  connectorStyle?: ConnectorStyle;
  label?: string;
  createdBy: string;
}

/**
 * Create reaction input
 */
export interface CreateReactionInput {
  objectId: string;
  userId: string;
  emoji: string;
}

/**
 * Create acknowledgment input
 */
export interface CreateAcknowledgmentInput {
  objectId: string;
  userId: string;
  comment?: string;
  auditEventId?: string;
}

/**
 * Create audit entry input
 */
export interface CreateAuditEntryInput {
  tenantId: string;
  action: CanvasAuditAction;
  actorId: string;
  actorName?: string;
  objectId?: string;
  objectSourceRef?: string;
  zoneId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
  correlationId?: string;
}

// ============================================================================
// 4. AGGREGATES & RESULTS
// ============================================================================

/**
 * Object with aggregated data (reactions, acknowledgments)
 */
export interface CanvasObjectWithAggregates extends CanvasObject {
  reactions: { emoji: string; count: number; userIds: string[] }[];
  acknowledgments: { userId: string; userName?: string; acknowledgedAt: Date }[];
  zone?: CanvasZone;
}

/**
 * Pre-flight status response
 */
export interface PreFlightStatus {
  requiresAcknowledgment: boolean;
  hardStops: CanvasObject[];    // priority >= 80
  softStops: CanvasObject[];    // priority >= 50
  informational: CanvasObject[]; // priority >= 20
  totalUrgent: number;
  highestPriority: number;
}

/**
 * Move result with conflict handling
 */
export interface MoveResult {
  success: boolean;
  object?: CanvasObject;
  newVersion?: number;
  error?: 'CONFLICT' | 'NOT_FOUND' | 'PERMISSION_DENIED';
  currentVersion?: number;
  currentZoneId?: string;
}

// ============================================================================
// 5. PORT INTERFACE
// ============================================================================

/**
 * Canvas Repository Port
 */
export interface CanvasRepositoryPort {
  // Transaction support
  withTransaction<T>(callback: (txContext: CanvasTransactionContext) => Promise<T>): Promise<T>;
  
  // -------------------------------------------------------------------------
  // ZONES
  // -------------------------------------------------------------------------
  
  createZone(input: CreateZoneInput, txContext?: CanvasTransactionContext): Promise<CanvasZone>;
  findZoneById(id: string, tenantId: string): Promise<CanvasZone | null>;
  listZones(tenantId: string): Promise<CanvasZone[]>;
  updateZone(id: string, input: UpdateZoneInput, expectedVersion: number, txContext?: CanvasTransactionContext): Promise<CanvasZone>;
  deleteZone(id: string, tenantId: string, txContext?: CanvasTransactionContext): Promise<void>;
  
  // -------------------------------------------------------------------------
  // OBJECTS
  // -------------------------------------------------------------------------
  
  createObject(input: CreateObjectInput, txContext?: CanvasTransactionContext): Promise<CanvasObject>;
  findObjectById(id: string, tenantId: string): Promise<CanvasObject | null>;
  findObjectByIdWithAggregates(id: string, tenantId: string): Promise<CanvasObjectWithAggregates | null>;
  findObjectsBySourceRef(sourceRef: string, tenantId: string): Promise<CanvasObject[]>;
  listObjects(filters: ObjectQueryFilters): Promise<{ objects: CanvasObject[]; total: number }>;
  updateObject(id: string, input: UpdateObjectInput, expectedVersion: number, txContext?: CanvasTransactionContext): Promise<CanvasObject>;
  moveObject(id: string, input: MoveObjectInput, txContext?: CanvasTransactionContext): Promise<MoveResult>;
  softDeleteObject(id: string, deletedBy: string, tenantId: string, txContext?: CanvasTransactionContext): Promise<void>;
  
  // Bulk operations
  updateObjectsSourceStatus(sourceRef: string, status: SourceStatus, txContext?: CanvasTransactionContext): Promise<number>;
  
  // -------------------------------------------------------------------------
  // CONNECTORS
  // -------------------------------------------------------------------------
  
  createConnector(input: CreateConnectorInput, txContext?: CanvasTransactionContext): Promise<CanvasConnector>;
  listConnectorsForObject(objectId: string, tenantId: string): Promise<CanvasConnector[]>;
  deleteConnector(id: string, tenantId: string, txContext?: CanvasTransactionContext): Promise<void>;
  
  // -------------------------------------------------------------------------
  // REACTIONS
  // -------------------------------------------------------------------------
  
  addReaction(input: CreateReactionInput, txContext?: CanvasTransactionContext): Promise<CanvasReaction>;
  removeReaction(objectId: string, userId: string, emoji: string, txContext?: CanvasTransactionContext): Promise<void>;
  listReactionsForObject(objectId: string): Promise<CanvasReaction[]>;
  getReactionCounts(objectId: string): Promise<{ emoji: string; count: number }[]>;
  
  // -------------------------------------------------------------------------
  // ACKNOWLEDGMENTS
  // -------------------------------------------------------------------------
  
  createAcknowledgment(input: CreateAcknowledgmentInput, txContext?: CanvasTransactionContext): Promise<CanvasAcknowledgment>;
  findAcknowledgment(objectId: string, userId: string): Promise<CanvasAcknowledgment | null>;
  listAcknowledgmentsForObject(objectId: string): Promise<CanvasAcknowledgment[]>;
  listAcknowledgmentsByUser(userId: string, limit?: number): Promise<CanvasAcknowledgment[]>;
  
  // -------------------------------------------------------------------------
  // PRE-FLIGHT
  // -------------------------------------------------------------------------
  
  getPreFlightStatus(tenantId: string, userId: string): Promise<PreFlightStatus>;
  getUnacknowledgedUrgentObjects(tenantId: string, userId: string): Promise<CanvasObject[]>;
  
  // -------------------------------------------------------------------------
  // AUDIT
  // -------------------------------------------------------------------------
  
  createAuditEntry(input: CreateAuditEntryInput, txContext?: CanvasTransactionContext): Promise<CanvasAuditEntry>;
  listAuditEntriesForObject(objectId: string, limit?: number): Promise<CanvasAuditEntry[]>;
  listAuditEntriesBySourceRef(sourceRef: string, limit?: number): Promise<CanvasAuditEntry[]>;
}
