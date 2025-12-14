/**
 * In-Memory Audit Writer
 * 
 * Fast, no-setup implementation for development and testing.
 * Audit events are stored in memory and lost on restart.
 */

import crypto from "node:crypto";
import type { AuditPort, AuditWriteInput, AuditQueryInput, AuditQueryOutput } from "@aibos/kernel-core";

export interface StoredAuditEvent extends AuditWriteInput {
  id: string;
  created_at: string;
}

export class InMemoryAudit implements AuditPort {
  private events: StoredAuditEvent[] = [];
  private readonly retentionLimit: number;

  constructor(retentionLimit: number = 10000) {
    this.retentionLimit = retentionLimit;
  }

  /**
   * Append an audit event (append-only, immutable)
   */
  async append(input: AuditWriteInput): Promise<void> {
    const event: StoredAuditEvent = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    };
    this.events.unshift(event); // newest first

    // Apply retention limit (FIFO)
    if (this.events.length > this.retentionLimit) {
      this.events = this.events.slice(0, this.retentionLimit);
    }
  }

  /**
   * Query audit events with filtering and pagination (Phase 4)
   */
  async query(input: AuditQueryInput): Promise<AuditQueryOutput> {
    // Filter events
    let filtered = this.events.filter((e) => {
      // Tenant filter (if provided)
      if (input.tenant_id && e.tenant_id !== input.tenant_id) {
        return false;
      }

      // Correlation ID filter
      if (input.correlation_id && e.correlation_id !== input.correlation_id) {
        return false;
      }

      // Actor ID filter
      if (input.actor_id && e.actor_id !== input.actor_id) {
        return false;
      }

      // Action filter
      if (input.action && e.action !== input.action) {
        return false;
      }

      // Resource filter
      if (input.resource && e.resource !== input.resource) {
        return false;
      }

      // Result filter
      if (input.result && e.result !== input.result) {
        return false;
      }

      // Time range filters
      if (input.start_time || input.end_time) {
        const eventTime = new Date(e.created_at).getTime();

        if (input.start_time) {
          const startTime = new Date(input.start_time).getTime();
          if (eventTime < startTime) return false;
        }

        if (input.end_time) {
          const endTime = new Date(input.end_time).getTime();
          if (eventTime > endTime) return false;
        }
      }

      return true;
    });

    const total = filtered.length;

    // Apply pagination
    const offset = input.offset || 0;
    const limit = input.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total,
    };
  }

  // Debug helpers - not part of the port interface
  list(): StoredAuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }

  findByCorrelationId(correlationId: string): StoredAuditEvent[] {
    return this.events.filter((e) => e.correlation_id === correlationId);
  }
}

