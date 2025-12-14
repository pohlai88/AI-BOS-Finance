/**
 * In-Memory Canon Registry
 * 
 * Fast, no-setup implementation for development and testing.
 * Data is lost on server restart.
 */

import crypto from "node:crypto";
import type { CanonRegistryPort } from "@aibos/kernel-core";
import type { Canon } from "@aibos/kernel-core";

export class InMemoryCanonRegistry implements CanonRegistryPort {
  private items: Canon[] = [];

  async register(input: Omit<Canon, "id" | "created_at">): Promise<Canon> {
    const canon: Canon = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    };
    this.items.unshift(canon);
    return canon;
  }

  async list(input: { tenant_id: string }): Promise<Canon[]> {
    return this.items.filter((x) => x.tenant_id === input.tenant_id);
  }

  async getById(input: {
    tenant_id: string;
    canon_id: string;
  }): Promise<Canon | null> {
    return (
      this.items.find(
        (x) => x.tenant_id === input.tenant_id && x.id === input.canon_id
      ) ?? null
    );
  }

  // Debug helper - not part of the port interface
  clear(): void {
    this.items = [];
  }
}

