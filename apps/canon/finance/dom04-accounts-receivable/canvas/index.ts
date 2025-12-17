/**
 * AR Canvas Module — Barrel Export
 * 
 * Exports all canvas-related utilities for the AR domain.
 * Powers the Lively Layer for AR Manager (Revenue Command Center).
 * 
 * @module AR-Canvas
 */

// =============================================================================
// URN UTILITIES
// =============================================================================

export {
  parseURN,
  tryParseURN,
  buildURN,
  buildURNFromEntity,
  extractEntityId,
  extractCellCode,
  getCellDisplayCode,
  isSameEntity,
  groupURNsByCell,
  isValidURN,
  isValidUUID,
  URNParseError,
  CELL_ENTITY_MAP,
  ENTITY_CELL_MAP,
  CELL_NAMES,
  CELL_DISPLAY_CODES,
} from './urn';
export type { ARCellCode, AREntityType, ParsedURN } from './urn';

// =============================================================================
// ENTITY TRANSFORMERS
// =============================================================================

export {
  transformCustomer,
  transformInvoice,
  transformReceipt,
  transformCreditNote,
  transformAging,
  transformEntity,
  calculateUrgency,
  calculateDaysOverdue,
  calculateARPriorityScore,
  getStatusColor,
  formatAmount,
  STATUS_COLORS,
  AGING_BUCKET_COLORS,
  CELL_COLORS,
} from './entityTransformers';
export type {
  CustomerEntity,
  InvoiceEntity,
  ReceiptEntity,
  CreditNoteEntity,
  AgingEntity,
} from './entityTransformers';

// =============================================================================
// CANVAS OBJECT SERVICE
// =============================================================================

export {
  CanvasObjectService,
  createCanvasObjectService,
  CanvasServiceError,
  ObjectNotFoundError,
  LayerPermissionError,
  VersionConflictError,
} from './CanvasObjectService';
export type {
  CreateHydratedStickyInput,
  CreatePlainStickyInput,
} from './CanvasObjectService';

// =============================================================================
// ZONE TRIGGER SERVICE
// =============================================================================

export {
  ZoneTriggerService,
  createZoneTriggerService,
} from './ZoneTriggerService';
export type {
  ZoneTriggerResult,
  ZoneMoveRequest,
  ZoneMoveResponse,
  StatusMapping,
  ARZoneTriggerAction,
  CollectionZoneType,
} from './ZoneTriggerService';

// =============================================================================
// PRE-FLIGHT SERVICE
// =============================================================================

export {
  PreFlightService,
  createPreFlightService,
  PRIORITY_THRESHOLDS,
  AR_PRIORITY_FACTORS,
} from './PreFlightService';
export type {
  PreFlightItem,
  BlockedRoute,
  ExtendedPreFlightStatus,
  AcknowledgmentRequest,
  AcknowledgmentResponse,
} from './PreFlightService';

// =============================================================================
// EVENT BROADCASTER
// =============================================================================

export {
  EventBroadcaster,
  createEventBroadcaster,
} from './EventBroadcaster';
export type {
  PubSubAdapter,
  EventActor,
} from './EventBroadcaster';

// =============================================================================
// WEBSOCKET TYPES
// =============================================================================

export {
  createWSMessage,
  generateUserColor,
  getAgingBucketTopic,
  TOPIC_PATTERNS,
} from './WebSocketTypes';
export type {
  WSMessageType,
  WSBaseMessage,
  WSMessage,
  WSMessagePayloadMap,
  ObjectCreatedPayload,
  ObjectUpdatedPayload,
  ObjectMovedPayload,
  ObjectDeletedPayload,
  ZoneEnteredPayload,
  ZoneExitedPayload,
  ZoneTriggerFiredPayload,
  ReactionAddedPayload,
  ReactionRemovedPayload,
  AcknowledgmentCreatedPayload,
  SourceStatusChangedPayload,
  SourceArchivedPayload,
  SourceDeletedPayload,
  PaymentReceivedPayload,
  AgingUpdatedPayload,
  CollectionActionPayload,
  PresenceJoinedPayload,
  PresenceLeftPayload,
  PresenceCursorMovedPayload,
  ConnectionEstablishedPayload,
  ErrorPayload,
  WSClientCommandType,
  WSClientCommand,
  SubscribePayload,
  UnsubscribePayload,
  PresenceUpdatePayload,
  ObjectMovePayload,
  ReactionTogglePayload,
  CollectionLogPayload,
} from './WebSocketTypes';
