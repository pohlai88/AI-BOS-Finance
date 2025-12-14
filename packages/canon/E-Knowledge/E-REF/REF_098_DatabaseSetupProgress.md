# REF_098: Database Setup Progress - COA Hierarchy Schema

> **🟡 [STAGING]** — Database Schema Setup Progress  
> **Date:** 2025-01-27  
> **Status:** ⏸️ **In Progress - Ready to Continue**

---

## 🎯 **Objective**

Set up the Forensic Metadata Architecture database schema with COA/Sub-Ledger hierarchy (Group → Child → Cell) to enforce DEF_03: Structural Immutability.

---

## ✅ **Completed Steps**

### **Step 1: Enhanced Schema with COA Hierarchy Fields** ✅

**File:** `apps/kernel/src/db/schema.ts`

**Added Fields to `mdmGlobalMetadata` table:**
- ✅ `isGroup: boolean` - Identifies Group-level metadata (e.g., "GC-REV-001")
- ✅ `parentDictId: varchar(50)` - Self-reference FK for hierarchy (Group → Transaction → Cell)
- ✅ `isBindable: boolean` - Whether metadata can be bound to actual data

**Self-Referential Foreign Key:**
- ✅ Added `foreignKey` constraint using Drizzle's third argument pattern
- ✅ Constraint name: `mdm_global_metadata_parent_dict_id_fkey`

**Relations:**
- ✅ Added `mdmGlobalMetadataRelations` with parent/children relations
- ✅ Relation name: `'hierarchy'` (required for self-referential relations)

---

## ⏸️ **Current Status - Where We Stopped**

### **Issue Encountered:**

**Drizzle Kit Config Error:**
```
require is not defined in ES module scope, you can use import instead
```

**Location:** `apps/kernel/drizzle.config.ts`  
**Problem:** Drizzle Kit config is using CommonJS `require` but project uses ES modules (`"type": "module"`)

---

## 🔧 **Next Steps to Complete**

### **Step 2: Fix Drizzle Config** ⏳

**File:** `apps/kernel/drizzle.config.ts`

**Current Issue:**
- Using `dotenv.config()` (CommonJS style)
- Need to convert to ES module imports

**Fix Required:**
```typescript
// Change from:
import * as dotenv from 'dotenv';
dotenv.config({ path: ... });

// To ES module compatible approach
```

**Options:**
1. Use `import 'dotenv/config'` (if available)
2. Use dynamic import for dotenv
3. Update drizzle.config.ts to use ES module syntax

---

### **Step 3: Generate Migrations** ⏳

After fixing config:
```bash
cd apps/kernel
pnpm db:generate
```

**Expected Output:**
- Creates migration files in `apps/kernel/drizzle/` directory
- Migration will include:
  - All existing tables (mdm_global_metadata, mdm_entity_catalog, etc.)
  - New COA hierarchy fields (is_group, parent_dict_id, is_bindable)
  - Self-referential foreign key constraint

---

### **Step 4: Apply Migrations** ⏳

```bash
cd apps/kernel
pnpm db:push
# OR
pnpm db:migrate
```

**This will:**
- Create/update tables in Supabase PostgreSQL
- Add COA hierarchy fields
- Create foreign key constraints

---

### **Step 5: Create Seed Data Script** ⏳

**File:** `apps/kernel/scripts/seed.ts` (already exists, needs enhancement)

**Seed Data Required:**
1. **Root Group:** `MD-ID-GRP` (Metadata Identity Group)
2. **COA Hierarchy Examples:**
   - Group: `GC-REV-001` (Revenue Recognition)
   - Transaction: `TL-REV-ANNUAL-001` (Subscription Revenue - Annual)
   - Cell: `CC-REV-RECOG-MONTH-001` (Recognition Month)

**Structure:**
```typescript
// Example seed data
const seedData = [
  {
    dictId: 'GC-REV-001',
    businessTerm: 'Revenue Recognition',
    isGroup: true,
    parentDictId: null,
    isBindable: false,
    // ... other fields
  },
  {
    dictId: 'TL-REV-ANNUAL-001',
    businessTerm: 'Subscription Revenue – Annual',
    isGroup: false,
    parentDictId: 'GC-REV-001', // Child of Group
    isBindable: true,
    // ... other fields
  },
  {
    dictId: 'CC-REV-RECOG-MONTH-001',
    businessTerm: 'Recognition Month',
    isGroup: false,
    parentDictId: 'TL-REV-ANNUAL-001', // Child of Transaction
    isBindable: true,
    // ... other fields
  },
];
```

---

### **Step 6: Create Hierarchical Query API** ⏳

**File:** `apps/kernel/src/routes/metadata.ts` (enhance existing)

**New Endpoint Needed:**
```
GET /metadata/hierarchy/{dict_id}
```

**Returns:**
- Metadata record with full hierarchy tree
- Parent chain (if child)
- Children list (if parent)

**Example Query:**
```typescript
// Get Group with all children
const group = await db.query.mdmGlobalMetadata.findFirst({
  where: eq(mdmGlobalMetadata.dictId, 'GC-REV-001'),
  with: {
    children: true, // Recursive children
  },
});
```

---

## 📊 **Schema Changes Summary**

### **New Fields Added:**

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `is_group` | boolean | Identifies Group-level metadata | `true` for "GC-REV-001" |
| `parent_dict_id` | varchar(50) | FK to parent metadata | `"GC-REV-001"` (for Transaction) |
| `is_bindable` | boolean | Can be bound to actual data | `true` for Transactions & Cells |

### **Hierarchy Rules:**

1. **Groups** (`is_group = true`):
   - `parent_dict_id` = NULL (top level)
   - `is_bindable` = false (cannot bind to data)

2. **Transactions** (`is_group = false`, has parent):
   - `parent_dict_id` = Group dict_id
   - `is_bindable` = true (can bind to data)

3. **Cells** (`is_group = false`, has parent):
   - `parent_dict_id` = Transaction dict_id
   - `is_bindable` = true (can bind to data)

---

## 🔍 **Files Modified**

1. ✅ `apps/kernel/src/db/schema.ts`
   - Added COA hierarchy fields
   - Added self-referential foreign key
   - Added relations

---

## 📝 **Files to Modify Next**

1. ⏳ `apps/kernel/drizzle.config.ts` - Fix ES module issue
2. ⏳ `apps/kernel/scripts/seed.ts` - Add foundational seed data
3. ⏳ `apps/kernel/src/routes/metadata.ts` - Add hierarchy query endpoint

---

## 🎯 **Verification Checklist**

After completing all steps:

- [ ] Drizzle config fixed (ES module compatible)
- [ ] Migrations generated successfully
- [ ] Migrations applied to database
- [ ] Seed data script created
- [ ] Seed data inserted (Group → Transaction → Cell)
- [ ] Hierarchy query endpoint working
- [ ] Can query Group and get all children
- [ ] Can query Cell and get parent chain
- [ ] Foreign key constraint enforced at DB level

---

## 📚 **Related Documents**

- [REF_081: Dependency Analysis](./REF_081_DependencyAnalysis.md)
- [REF_091: pnpm Migration Complete](./REF_091_pnpmMigrationComplete.md)
- [REF_094: Dual System Success](./REF_094_DualSystemSuccess.md)
- [PRD_KERNEL_01_AIBOS_KERNEL.md](../../packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md)

---

## 🚀 **Quick Start Next Session**

1. **Fix Drizzle Config:**
   ```bash
   cd apps/kernel
   # Edit drizzle.config.ts to use ES modules
   ```

2. **Generate Migrations:**
   ```bash
   pnpm db:generate
   ```

3. **Apply Migrations:**
   ```bash
   pnpm db:push
   ```

4. **Create Seed Data:**
   ```bash
   # Edit scripts/seed.ts
   pnpm seed
   ```

5. **Test Hierarchy:**
   ```bash
   # Test API endpoint
   curl http://localhost:3001/metadata/hierarchy/GC-REV-001
   ```

---

**Last Updated:** 2025-01-27  
**Status:** ⏸️ **Paused - Ready to Continue with Drizzle Config Fix**
