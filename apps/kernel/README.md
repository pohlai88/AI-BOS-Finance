# AIBOS Kernel - The Brain

**Version:** 0.0.0  
**Status:** ✅ **READY FOR DATABASE SETUP**  
**PRD:** `packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md`

---

## Overview

The AIBOS Kernel is the **Active Neural Center** of the AIBOS ecosystem. It is a standalone API service that enforces the AI-BOS Constitution by providing:

- **Metadata Services** (Hippocampus) - Global Metadata Registry ✅ **IMPLEMENTED**
- **Policy Services** (Frontal Lobe) - Constitution enforcement
- **Event Services** (Motor Cortex) - Event orchestration
- **Lineage Services** (Thalamus) - Data lineage queries

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Postgres database (local or Supabase)
- `DATABASE_URL` environment variable

### Step 1: Environment Setup

Create a `.env` file in `apps/kernel/`:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your database URL
DATABASE_URL="postgresql://user:password@localhost:5432/your_database"
PORT=3001
```

**Example for Supabase:**
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Step 2: Database Schema Setup

Push the schema to your database:

```bash
cd apps/kernel
npm run db:push
```

This creates all `mdm_*` tables in your database.

**Alternative: Generate Migrations**
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Step 3: Seed the Database (First Breath)

Populate the database with initial metadata:

```bash
npm run seed
```

This inserts:
- **3 Entities:** Invoice, Payment, Vendor
- **6 Metadata Fields:** invoice_id, total_amount, status, payment_id, amount, vendor_name
- **4 Autonomy Tier Policies:** Tier 0-3 definitions

**Expected Output:**
```
🌱 Starting database seed...
🧹 Clearing existing data...
📦 Seeding entities...
✅ Inserted 3 entities
📋 Seeding metadata fields...
✅ Inserted 6 metadata fields
🔒 Seeding naming policies...
✅ Inserted 4 naming policies
✅ Seed completed successfully!
🧠 The Hippocampus now has memory!
```

### Step 4: Start the Kernel

```bash
npm run dev
```

The Kernel will start on **http://localhost:3001** (or your configured PORT).

**Expected Output:**
```
🚀 AIBOS Kernel starting on http://localhost:3001
📋 PRD: KERNEL_01_AIBOS_KERNEL.md
🧬 DNA: @aibos/schemas
✅ Kernel running on http://localhost:3001
```

### Step 5: Verify It Works

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Database Health:**
```bash
curl http://localhost:3001/health/db
```

**List Entities:**
```bash
curl http://localhost:3001/metadata/entities
```

**Get Field Definition:**
```bash
curl http://localhost:3001/metadata/fields/DS-INV-001
```

---

## 📁 Project Structure

```
apps/kernel/
├── src/
│   ├── index.ts              # Hono server entry point
│   ├── db/
│   │   ├── index.ts          # Database connection client
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── routes/
│   │   ├── metadata.ts       # Hippocampus endpoints ✅
│   │   ├── lineage.ts        # Lineage queries
│   │   ├── policy.ts         # Frontal Lobe endpoints
│   │   └── events.ts         # Motor Cortex endpoints
│   └── services/
│       └── metadata.service.ts # Metadata query service ✅
├── scripts/
│   └── seed.ts               # Database seeding script ✅
├── drizzle.config.ts         # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧠 Architecture

### Four Lobes:

1. **Hippocampus** (`/metadata`) - Memory & Truth ✅ **ACTIVE**
   - Stores and serves field/entity definitions
   - Provides context for Silent Killer Frontend
   - Maps local fields to canonical metadata

2. **Frontal Lobe** (`/policy`) - Governance & Policy
   - Enforces Constitution rules
   - Checks autonomy tier permissions
   - Manages change requests

3. **Motor Cortex** (`/events`) - Dispatch & Event Bus
   - Validates and routes events
   - Logs lineage for audit
   - Triggers Cells (Workers)

4. **Thalamus** (`/lineage`) - API Gateway
   - Provides lineage graph queries
   - Impact analysis
   - Node/edge registration

### Tech Stack:

- **Framework:** Hono v4.6.14 (high-performance API framework)
- **Runtime:** Node.js (via @hono/node-server)
- **Database:** Postgres/Supabase (via Drizzle ORM) ✅
- **Types:** TypeScript with `@aibos/schemas` (shared DNA)
- **ORM:** Drizzle ORM v0.45.1 ✅

---

## 📡 API Endpoints

### Health Check
- `GET /` - Service status
- `GET /health` - Health check
- `GET /health/db` - Database connectivity check ✅

### Metadata (Hippocampus) ✅ **IMPLEMENTED**

- `GET /metadata/fields/search` - Search metadata with filters ✅
  - Query params: `q`, `domain`, `entity_group`, `canon_status`, `classification`, `criticality`, `limit`, `offset`
  
- `GET /metadata/fields/{dict_id}` - Get field definition ✅
  - Returns: Complete `MdmGlobalMetadata` object
  
- `GET /metadata/context/field/{dict_id}` - Field context (Silent Killer) ✅
  - Returns: Field + lineage summary + quality signals
  
- `GET /metadata/context/entity/{entity_id}` - Entity context (Silent Killer) ✅
  - Returns: Entity + fields + mappings + quality signals
  
- `GET /metadata/entities` - List all entities ✅
  - Query params: `domain`, `type`
  
- `GET /metadata/entities/{entity_id}/fields` - Get fields for entity ✅
  
- `GET /metadata/mappings/lookup` - Lookup canonical mapping ✅
  - Query params: `field`, `system`

### Lineage
- `GET /lineage/graphForNode` - Get lineage graph
- `GET /lineage/impactReport` - Get impact analysis
- `POST /lineage/registerNode` - Register lineage node
- `POST /lineage/registerEdge` - Register lineage edge

### Policy (Frontal Lobe)
- `POST /policy/dataAccess/check` - Check if action allowed ✅ (Basic tier enforcement)
- `POST /policy/changeRequest/create` - Create change request
- `GET /policy/controlStatus/list` - List control status
- `GET /policy/tiers` - List autonomy tiers ✅

### Events (Motor Cortex)
- `POST /events/emit` - Emit new event
- `GET /events/{event_id}` - Get event status
- `GET /events/queue/status` - Get queue health

---

## 🛠️ Development

### Available Scripts

```bash
# Development (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Production start
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Database operations
npm run db:push          # Push schema to database
npm run db:generate      # Generate migration files
npm run db:migrate       # Apply migrations

# Seeding
npm run seed             # Seed database with initial data
```

### Database Migrations

**Push Schema (Development):**
```bash
npm run db:push
```

**Generate Migrations (Production):**
```bash
npm run db:generate
# Creates SQL files in ./drizzle/
```

**Apply Migrations:**
```bash
npm run db:migrate
```

---

## 🧪 Testing the API

### Using curl

**Search Metadata:**
```bash
curl "http://localhost:3001/metadata/fields/search?q=invoice&limit=10"
```

**Get Field:**
```bash
curl http://localhost:3001/metadata/fields/DS-INV-001
```

**Get Entity Context:**
```bash
curl http://localhost:3001/metadata/context/entity/ENT_INVOICE
```

### Using HTTPie

```bash
http GET localhost:3001/metadata/entities
http GET localhost:3001/metadata/fields/DS-INV-001
```

---

## 📊 Database Schema

The Kernel uses the following `mdm_*` tables:

- `mdm_global_metadata` - Field definitions (Hippocampus core)
- `mdm_entity_catalog` - Entity catalog
- `mdm_metadata_mapping` - Local → Canonical mappings
- `mdm_lineage_nodes` - Lineage graph nodes
- `mdm_lineage_edges` - Lineage graph edges
- `mdm_naming_policy` - Autonomy tier policies

See `src/db/schema.ts` for complete schema definitions.

---

## 🔗 Integration

### Frontend Integration (`apps/web`)

The Frontend can call the Kernel:

```typescript
const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001';

// Get field definition
const field = await fetch(`${KERNEL_URL}/metadata/fields/${dictId}`)
  .then(r => r.json());

// Search metadata
const results = await fetch(`${KERNEL_URL}/metadata/fields/search?q=${query}`)
  .then(r => r.json());
```

### Environment Variables

Add to `apps/web/.env.local`:
```bash
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `DATABASE_URL environment variable is required`
- **Solution:** Create `.env` file with `DATABASE_URL`

**Error:** `Connection refused` or `ECONNREFUSED`
- **Solution:** Verify database is running and URL is correct
- **Check:** Run `curl http://localhost:3001/health/db`

### Schema Push Fails

**Error:** `relation "mdm_global_metadata" already exists`
- **Solution:** Tables already exist. Use migrations instead: `npm run db:generate`

**Error:** Enum type conflicts
- **Solution:** Drop existing enums or use migrations to update them

### Seed Script Fails

**Error:** `Foreign key constraint violation`
- **Solution:** Ensure tables are created first: `npm run db:push`

**Error:** `Cannot find module`
- **Solution:** Run `npm install` in `apps/kernel`

---

## 📝 Next Steps

1. ✅ **Database Integration** - Drizzle ORM connected
2. ✅ **Metadata Service** - Query service implemented
3. ✅ **Seed Script** - Initial data populated
4. ⏳ **Lineage Service** - Implement graph traversal
5. ⏳ **Policy Service** - Full policy check logic
6. ⏳ **Event Service** - Event routing and queue
7. ⏳ **Frontend Integration** - Connect `apps/web` to Kernel

---

## 📚 References

- **PRD:** `packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md`
- **Schemas:** `packages/schemas/src/metadata.ts`
- **Drizzle Docs:** https://orm.drizzle.team/
- **Hono Docs:** https://hono.dev/

---

**Status:** ✅ **READY FOR USE**

**The Hippocampus is now operational!** 🧠
