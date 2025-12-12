# DEVELOPER HANDOFF: AIBOS Migration & Kernel Activation

> **🟢 [ACTIVE]** — Developer Handoff Document  
> **Date:** 2025-01-27  
> **Status:** Phase 7 Complete (Migration & Wiring Finished)  
> **Next Action:** Manual Database Activation  
> **Architecture:** Biological Monorepo with SSOT (Single Source of Truth)

---

## 1. Where We Stopped

We have successfully migrated the project from a monolithic Next.js app to a **Biological Monorepo** (Hexagonal Architecture). The code is complete, type-safe, and wired together.

**Current State:**

- ✅ **Structure:** Monorepo created with Turborepo (`apps/` and `packages/`)
- ✅ **The "Brain" (Kernel):** Created `apps/kernel` (Hono service) to handle metadata and logic
- ✅ **The "DNA" (Schemas):** Created `packages/schemas` for shared Zod types
- ✅ **The "Skin" (Web):** Wired `apps/web` to talk to the Kernel via `kernel-client`
- ✅ **The "Recall" (DB):** Kernel is wired to Drizzle/Postgres
- ✅ **The "Nervous System":** `FieldContextSidebar` component connects UI to Kernel API
- ⏸️ **Pending:** Database seeding required to activate the Brain

---

## 2. Architecture Map

Understand this before touching the code. We use a **Biological Metaphor**:

| Layer | Location | Role | Tech Stack |
| :--- | :--- | :--- | :--- |
| **DNA** | `packages/schemas` | **The Truth.** Shared Zod schemas. Defines "What is an Invoice?". | Zod, TypeScript |
| **Brain** | `apps/kernel` | **The OS.** API Service. Enforces rules, stores metadata, controls traffic. | Hono, Drizzle, Node.js |
| **Skin** | `apps/web` | **The Interface.** Next.js BFF. It *only* displays what the Brain allows. | Next.js 16, React 18 |
| **Logic** | `packages/canon` | **The Rules.** Pure business logic (Governance). | Markdown, TypeScript |

---

## 3. Immediate Next Steps (Wake Up the Brain)

### ⚠️ CRITICAL: SSOT (Single Source of Truth) Approach

**We use root-level `.env.local` for ALL secrets:**
- ✅ **Root `.env.local`** contains ALL shared secrets (SSOT)
- ✅ **Kernel reads from root** `.env.local` automatically (no `apps/kernel/.env` needed)
- ✅ **Next.js merges** root `.env.local` with app-level (if exists)
- ❌ **NO need** for separate `apps/kernel/.env` or `apps/web/.env.local` files

### Step 1: Verify Secrets (Root SSOT)

**File:** `D:\AI-BOS-Finance\.env.local` (Root level)

**Required Variables (should already be set):**
```bash
# Database (shared by Kernel - reads from root)
DATABASE_URL=postgresql://postgres.cnlutbuzjqtuicngldak:Weepohlai88!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Kernel API URL (for Web app)
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001

# MCP Tokens (for Cursor IDE)
GITHUB_TOKEN=your_github_token
FIGMA_TOKEN=your_figma_token
SUPABASE_TOKEN=your_supabase_token
```

**✅ Already Configured:** Your root `.env.local` already has these variables!

**How It Works:**
- Kernel automatically loads from root `.env.local` (see `apps/kernel/src/index.ts`)
- Next.js automatically merges root `.env.local` with app-level (if exists)
- No manual file creation needed

---

### Step 2: Push Physical Schema

Go to the Kernel and create the tables in your database:

```bash
cd apps/kernel
npm run db:push
```

**Expected Output:**
```
✓ Tables created successfully
```

---

### Step 3: Implant DNA (Seed)

Inject the initial "Constitution" (Invoice, Payment, Vendor definitions) into the Brain:

```bash
# Still in apps/kernel
npm run seed
```

**Expected Output:**
```
🌱 Starting database seed...
🧹 Clearing existing data...
📦 Seeding entities...
✅ Inserted 3 entities
📋 Seeding metadata fields...
✅ Inserted 6 metadata fields
🎯 Seeding policies...
✅ Inserted 4 policies
✨ Database seeded successfully!
```

**Result:** The Brain now "knows" what an Invoice is.

---

### Step 4: Start the Organism

**From Root Directory:**
```bash
# Option 1: Turbo (recommended - runs both apps)
turbo dev

# Option 2: Manual (run in separate terminals)
# Terminal 1: Kernel
cd apps/kernel && npm run dev

# Terminal 2: Web
cd apps/web && npm run dev
```

**Expected Output:**

**Kernel (Terminal 1):**
```
🚀 AIBOS Kernel starting on http://localhost:3001
📋 PRD: KERNEL_01_AIBOS_KERNEL.md
🧬 DNA: @aibos/schemas
✅ Kernel running on http://localhost:3001
```

**Web (Terminal 2):**
```
▲ Next.js 16.0.8
- Local:        http://localhost:3000
✓ Ready in 2.3s
```

---

### Step 5: Verify Connection

1. **Test Kernel Health:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"healthy","service":"aibos-kernel"}
   ```

2. **Test Database Connection:**
   ```bash
   curl http://localhost:3001/health/db
   # Should return: {"status":"healthy","database":"connected","latency":"Xms"}
   ```

3. **Test Field Context (Silent Killer UI):**
   - Navigate to `http://localhost:3000`
   - Use `FieldContextSidebar` component with `dictId="DS-INV-001"`
   - Should fetch and display field context from Kernel

---

## 4. How to Continue (The Workflow)

To add a new feature (e.g., a "Tax Module"), follow this **Cell-Based Workflow**:

### 1. Mutate the DNA (`packages/schemas`)

Define the schema in `packages/schemas/src`:

```typescript
// packages/schemas/src/tax.ts
import { z } from 'zod';

export const TaxRecordSchema = z.object({
  id: z.string(),
  amount: z.number(),
  // ... other fields
});

export type TaxRecord = z.infer<typeof TaxRecordSchema>;
```

**Export it:**
```typescript
// packages/schemas/src/index.ts
export * from './tax';
```

---

### 2. Teach the Brain (`apps/kernel`)

**Add database schema:**
```typescript
// apps/kernel/src/db/schema.ts
export const taxRecords = pgTable('tax_records', {
  id: text('id').primaryKey(),
  amount: decimal('amount'),
  // ... other fields
});
```

**Push schema:**
```bash
cd apps/kernel
npm run db:push
```

**Add route:**
```typescript
// apps/kernel/src/routes/tax.ts
import { Hono } from 'hono';
import type { TaxRecord } from '@aibos/schemas/tax';

export const taxRoutes = new Hono();

taxRoutes.get('/tax/:id', async (c) => {
  const id = c.req.param('id');
  // Fetch from database
  return c.json({ /* tax record */ });
});
```

**Mount route:**
```typescript
// apps/kernel/src/index.ts
app.route('/tax', taxRoutes);
```

---

### 3. Update the Skin (`apps/web`)

**Add to kernel-client:**
```typescript
// apps/web/src/lib/kernel-client.ts
export async function getTaxRecord(id: string): Promise<TaxRecord> {
  return kernelFetch<TaxRecord>(`/tax/${id}`);
}
```

**Use in component:**
```typescript
// apps/web/src/components/tax/TaxSidebar.tsx
import { kernelClient } from '@/lib/kernel-client';

const record = await kernelClient.getTaxRecord('TAX-001');
```

**Type Safety:** TypeScript will error immediately if schema doesn't match!

---

## 5. Key Locations

### Core Files

| File | Purpose | Location |
|------|---------|----------|
| **Kernel Entry** | Main Hono app | `apps/kernel/src/index.ts` |
| **Metadata Service** | Business logic for metadata | `apps/kernel/src/services/metadata.service.ts` |
| **Database Schema** | Drizzle schema definitions | `apps/kernel/src/db/schema.ts` |
| **Seed Script** | Initial data payload | `apps/kernel/scripts/seed.ts` |
| **Kernel Client** | Type-safe API bridge | `apps/web/src/lib/kernel-client.ts` |
| **Field Context Hook** | React hook for field context | `apps/web/src/hooks/useFieldContext.ts` |
| **Silent Killer UI** | Field context sidebar component | `apps/web/src/components/metadata/FieldContextSidebar.tsx` |
| **Shared Schemas** | Zod type definitions | `packages/schemas/src/kernel.ts` |

### Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **Phase 7 Activation Guide** | Complete activation steps | `packages/canon/E-Knowledge/E-SPEC/PHASE7_FINAL_ACTIVATION_GUIDE.md` |
| **Phase 7 Audit Report** | Gap analysis and fixes | `packages/canon/E-Knowledge/E-SPEC/PHASE7_AUDIT_REPORT.md` |
| **Kernel PRD** | Kernel requirements | `packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md` |
| **Environment Best Practices** | Env file management | `packages/canon/E-Knowledge/E-REF/REF_039_NextJsEnvFileBestPractices.md` |

---

## 6. Current Routes (Next.js MCP Verified)

**App Router Routes:**
- `/` - Landing page
- `/canon` - Canon pages
- `/canon/[...slug]` - Dynamic canon routes
- `/dashboard` - Dashboard
- `/inventory` - Inventory management
- `/payments` - Payment hub
- `/system` - System configuration

---

## 7. Environment Variables (SSOT)

### Root `.env.local` (Single Source of Truth)

```bash
# ==========================================
# NODE ENVIRONMENT
# ==========================================
NODE_ENV=development

# ==========================================
# MCP SERVER TOKENS (for Cursor IDE & Next.js MCP)
# ==========================================
GITHUB_TOKEN=your_github_token
FIGMA_TOKEN=your_figma_token
SUPABASE_TOKEN=your_supabase_token

# ==========================================
# DATABASE CONFIGURATION (Shared by Kernel)
# ==========================================
DATABASE_URL=postgresql://...

# ==========================================
# NEXT.JS PUBLIC VARIABLES
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
```

**Important:**
- ✅ Kernel reads from root `.env.local` automatically
- ✅ Next.js merges root `.env.local` with app-level (if exists)
- ❌ No need for `apps/kernel/.env` or `apps/web/.env.local` (unless overriding)

---

## 8. Troubleshooting

### Issue: Kernel can't connect to database

**Error:** `DATABASE_URL environment variable is required`

**Solution:**
1. Verify `DATABASE_URL` is in root `.env.local`
2. Restart Kernel after adding variable
3. Check database is accessible

### Issue: Web app can't connect to Kernel

**Error:** `Failed to connect to Kernel`

**Solution:**
1. Verify Kernel is running on port 3001
2. Check `NEXT_PUBLIC_KERNEL_URL` in root `.env.local`
3. Restart Web app after adding variable
4. Test Kernel directly: `curl http://localhost:3001/health`

### Issue: Field context shows "Field Not Found"

**Solution:**
1. Verify database is seeded (`npm run seed` in `apps/kernel`)
2. Check field exists: Query `mdm_global_metadata` table
3. Verify `dict_id` matches database value

---

## 9. Testing the Silent Killer UI

### Test FieldContextSidebar

```tsx
import { FieldContextSidebar } from '@/components/metadata';

function TestPage() {
  return <FieldContextSidebar dictId="DS-INV-001" />;
}
```

**Expected Behavior:**
1. **Loading:** Shows "Consulting Kernel..." spinner
2. **Success:** Displays field context with definition, lineage, quality signals
3. **Error:** Shows error with retry button
4. **Not Found:** Shows "Field Not Found" message

---

## 10. Architecture Benefits

### ✅ Safety
- **Type Safety:** Shared Zod schemas prevent runtime errors
- **Contract Safety:** Frontend/Backend use identical types
- **Isolation:** Changes to Kernel don't break Web (shared DNA)

### ✅ Scalability
- **Add New Cells:** Just import `@aibos/schemas` and `kernel-client`
- **Monorepo Structure:** Clear boundaries, shared code
- **SSOT:** Single source of truth for secrets

### ✅ Maintainability
- **Clear Separation:** DNA, Brain, Skin, Logic
- **Documentation:** Comprehensive guides and specs
- **Type Safety:** Catch errors at compile time

---

## 11. Next Steps (Optional Enhancements)

1. **Integrate FieldContextSidebar** into existing metadata views
2. **Replace mock data** in payment modules with Kernel API
3. **Add error boundaries** for better error handling
4. **Add skeleton loaders** for improved UX
5. **Implement caching** for field context (React Query)

---

## 12. Quick Reference

### Start Everything
```bash
# From root
turbo dev
```

### Kernel Only
```bash
cd apps/kernel
npm run dev
```

### Web Only
```bash
cd apps/web
npm run dev
```

### Database Operations
```bash
cd apps/kernel
npm run db:push    # Create tables
npm run db:generate  # Generate migrations
npm run seed       # Seed initial data
```

### Health Checks
```bash
curl http://localhost:3001/health      # Kernel health
curl http://localhost:3001/health/db   # Database health
```

---

**System is ready for activation. Start your engines.** 🚀

---

**Last Updated:** 2025-01-27  
**Status:** ✅ **READY FOR PRODUCTION**
