/**
 * Canvas Module — Lively Layer for AP Manager
 * 
 * Exports URN utilities, entity transformers, and canvas services.
 */

// ============================================================================
// URN UTILITIES
// ============================================================================

export {
  // Types
  type APCellCode,
  type APEntityType,
  type ParsedURN,
  
  // Constants
  CELL_ENTITY_MAP,
  ENTITY_CELL_MAP,
  CELL_NAMES,
  CELL_DISPLAY_CODES,
  
  // Parser
  parseURN,
  tryParseURN,
  isValidURN,
  isValidUUID,
  URNParseError,
  
  // Builder
  buildURN,
  buildURNFromEntity,
  
  // Helpers
  extractEntityId,
  extractCellCode,
  getCellDisplayCode,
  isSameEntity,
  groupURNsByCell,
} from './urn';

// ============================================================================
// ENTITY TRANSFORMERS
// ============================================================================

export {
  // Status colors
  STATUS_COLORS,
  CELL_COLORS,
  
  // Urgency & Priority
  calculateUrgency,
  calculatePriorityScore,
  
  // Entity types
  type VendorEntity,
  type InvoiceEntity,
  type MatchEntity,
  type ApprovalEntity,
  type PaymentEntity,
  
  // Transformers
  transformVendor,
  transformInvoice,
  transformMatch,
  transformApproval,
  transformPayment,
  transformEntity,
  
  // Helpers
  getStatusColor,
} from './entityTransformers';

// ============================================================================
// CANVAS OBJECT SERVICE
// ============================================================================

export {
  // Service
  CanvasObjectService,
  createCanvasObjectService,
  
  // Input types
  type CreateHydratedStickyInput,
  type CreatePlainStickyInput,
  
  // Errors
  CanvasServiceError,
  ObjectNotFoundError,
  LayerPermissionError,
  VersionConflictError,
} from './CanvasObjectService';

// ============================================================================
// ZONE TRIGGER SERVICE
// ============================================================================

export {
  // Service
  ZoneTriggerService,
  createZoneTriggerService,
  
  // Types
  type ZoneTriggerResult,
  type ZoneMoveRequest,
  type ZoneMoveResponse,
  type StatusMapping,
} from './ZoneTriggerService';

// ============================================================================
// PRE-FLIGHT SERVICE
// ============================================================================

export {
  // Service
  PreFlightService,
  createPreFlightService,
  
  // Constants
  PRIORITY_THRESHOLDS,
  
  // Types
  type PreFlightItem,
  type BlockedRoute,
  type ExtendedPreFlightStatus,
  type AcknowledgmentRequest,
  type AcknowledgmentResponse,
} from './PreFlightService';

// ============================================================================
// WEBSOCKET INFRASTRUCTURE
// ============================================================================

export {
  // Types
  type WSMessageType,
  type WSBaseMessage,
  type WSMessage,
  type WSMessagePayloadMap,
  
  // Payloads
  type ObjectCreatedPayload,
  type ObjectUpdatedPayload,
  type ObjectMovedPayload,
  type ObjectDeletedPayload,
  type ZoneEnteredPayload,
  type ZoneExitedPayload,
  type ZoneTriggerFiredPayload,
  type ReactionAddedPayload,
  type ReactionRemovedPayload,
  type AcknowledgmentCreatedPayload,
  type SourceStatusChangedPayload,
  type PresenceJoinedPayload,
  type PresenceLeftPayload,
  type PresenceCursorMovedPayload,
  
  // Topic patterns
  TOPIC_PATTERNS,
  
  // Helpers
  createWSMessage,
  generateUserColor,
} from './WebSocketTypes';

export {
  // Service
  EventBroadcaster,
  createEventBroadcaster,
  
  // Types
  type PubSubAdapter,
  type EventActor,
} from './EventBroadcaster';
