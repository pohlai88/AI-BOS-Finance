# AIBOS Kernel - The Brain

**Version:** 0.0.0  
**Status:** 🚧 **INITIALIZATION**  
**PRD:** `packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md`

---

## Overview

The AIBOS Kernel is the **Active Neural Center** of the AIBOS ecosystem. It is a standalone API service that enforces the AI-BOS Constitution by providing:

- **Metadata Services** (Hippocampus) - Global Metadata Registry
- **Policy Services** (Frontal Lobe) - Constitution enforcement
- **Event Services** (Motor Cortex) - Event orchestration
- **Lineage Services** (Thalamus) - Data lineage queries

---

## Quick Start

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start
```

The Kernel runs on **http://localhost:3001** by default.

---

## Architecture

### Four Lobes:

1. **Hippocampus** (`/metadata`) - Memory & Truth
2. **Frontal Lobe** (`/policy`) - Governance & Policy
3. **Motor Cortex** (`/events`) - Dispatch & Event Bus
4. **Thalamus** (`/lineage`) - API Gateway

### Tech Stack:

- **Framework:** Hono v4.6.14 (high-performance API framework)
- **Runtime:** Node.js (via @hono/node-server)
- **Types:** TypeScript with `@aibos/schemas` (shared DNA)
- **Database:** Postgres/Supabase (via Drizzle ORM - TODO)

---

## API Endpoints

### Health Check
- `GET /` - Service status
- `GET /health` - Health check

### Metadata (Hippocampus)
- `GET /metadata/fields/search` - Search metadata
- `GET /metadata/fields/{dict_id}` - Get field definition
- `GET /metadata/context/field/{dict_id}` - Field context (Silent Killer)
- `GET /metadata/context/entity/{entity_id}` - Entity context (Silent Killer)

### Lineage
- `GET /lineage/graphForNode` - Get lineage graph
- `GET /lineage/impactReport` - Get impact analysis
- `POST /lineage/registerNode` - Register lineage node
- `POST /lineage/registerEdge` - Register lineage edge

### Policy (Frontal Lobe)
- `POST /policy/dataAccess/check` - Check if action allowed
- `POST /policy/changeRequest/create` - Create change request
- `GET /policy/controlStatus/list` - List control status
- `GET /policy/tiers` - List autonomy tiers

### Events (Motor Cortex)
- `POST /events/emit` - Emit new event
- `GET /events/{event_id}` - Get event status
- `GET /events/queue/status` - Get queue health

---

## Dependencies

- `@aibos/schemas` - Shared type definitions (workspace package)
- `hono` - Web framework
- `@hono/node-server` - Node.js adapter

---

## Next Steps

1. ✅ **Initialization Complete** - Basic Hono server running
2. ⏳ **Database Connection** - Set up Drizzle ORM for `mdm_*` tables
3. ⏳ **Service Implementation** - Implement MetadataService, LineageService, etc.
4. ⏳ **Frontend Integration** - Connect `apps/web` to Kernel

---

**See PRD for full specification.**
