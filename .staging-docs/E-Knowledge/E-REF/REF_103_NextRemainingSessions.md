# REF_103: Next Remaining Sessions & Development Roadmap

> **🟢 [STAGING]** — Development Roadmap & Next Steps  
> **Date:** 2025-01-27  
> **Status:** 📋 **Planning Document**

---

## 🎯 **Current Status**

### ✅ **Completed (This Session)**
1. **Database Setup** ✅
   - Drizzle schema with COA hierarchy (Group → Transaction → Cell)
   - Migrations generated and applied
   - Seed script with 10 foundational records

2. **META_02 Metadata Registry** ✅
   - Frontend page built (`/meta-registry`)
   - Kernel API integration (`/metadata/fields/search`)
   - Hierarchy display with badges
   - Default filtering (bindable records)
   - Statistics dashboard

3. **Fixes Applied** ✅
   - Turborepo config (`pipeline` → `tasks`)
   - Count query fix (`count()` function)
   - Client-side fetch caching
   - Route mismatch fixes

### ⚠️ **Pending Verification**
- **Kernel Server Restart** - Required to apply count query fix
- **API Testing** - Verify `/metadata/fields/search` returns `total: 10`
- **Frontend Testing** - Verify table displays 6 records correctly

---

## 🚀 **Next Remaining Sessions**

### **Session 1: Verification & Testing** (Immediate)
**Priority:** 🔴 **HIGH**  
**Duration:** ~30 minutes

**Tasks:**
1. ✅ Restart Kernel server
2. ✅ Test API endpoint: `curl http://localhost:3001/metadata/fields/search?limit=1000`
3. ✅ Verify frontend displays data correctly
4. ✅ Test DetailDrawer integration
5. ✅ Verify hierarchy badges display correctly
6. ✅ Check statistics cards accuracy

**Success Criteria:**
- API returns `total: 10` with all records
- Frontend shows 6 records (bindable filter)
- No console errors
- Hierarchy badges display correctly

---

### **Session 2: Enhanced Hierarchy Features** (Optional Enhancement)
**Priority:** 🟡 **MEDIUM**  
**Duration:** ~2-3 hours

**Features:**
1. **Recursive Hierarchy Display**
   - Show full parent chain in table (e.g., "GC-REV-001 > TC-REV-001")
   - Expandable rows for Groups showing children
   - Breadcrumb navigation

2. **DetailDrawer Hierarchy Integration**
   - Fetch hierarchy data when record selected (`/metadata/hierarchy/{dict_id}`)
   - Display parent/children in drawer
   - Navigate up/down hierarchy buttons

3. **Hierarchy Filtering**
   - Filter by hierarchy level (Group/Transaction/Cell)
   - Filter by parent Group
   - "Show only top-level Groups" toggle

**Files to Modify:**
- `apps/web/src/views/META_02_MetadataGodView.tsx`
- `apps/web/src/components/metadata/DetailDrawer.tsx`
- `apps/web/src/lib/kernel-client.ts` (already has `getMetadataHierarchy`)

---

### **Session 3: META_03 Detail Page Enhancement** (Core Feature)
**Priority:** 🔴 **HIGH**  
**Duration:** ~3-4 hours

**Current State:**
- META_03 page exists (`/meta-registry/:id`)
- Component: `MetadataDetailPage.tsx`
- Status: Built but may need Kernel integration

**Tasks:**
1. **Connect to Kernel API**
   - Use `getMetadataField(dictId)` for single record
   - Use `getFieldContext(dictId)` for complete context
   - Use `getMetadataHierarchy(dictId)` for parent/children

2. **Display Full Forensic Profile**
   - All metadata fields (classification, criticality, compliance)
   - Hierarchy context (parent chain, children)
   - Lineage information (if available)
   - Related entities

3. **Navigation**
   - Breadcrumb: `META_02 > META_03`
   - "Back to Registry" button
   - Navigate to parent/children

**Files to Modify:**
- `apps/web/app/meta-registry/[id]/page.tsx`
- `apps/web/src/views/META_03_MetadataDetailPage.tsx`
- `apps/web/src/lib/kernel-client.ts` (verify all functions exist)

---

### **Session 4: Additional Kernel API Endpoints** (Backend)
**Priority:** 🟡 **MEDIUM**  
**Duration:** ~2-3 hours

**Missing Endpoints:**
1. **Field Context** (`/metadata/context/field/{dict_id}`)
   - Complete field context for sidebar
   - Related fields, mappings, lineage

2. **Entity Context** (`/metadata/context/entity/{entity_id}`)
   - Entity-level context for screen rendering
   - All fields for an entity

3. **Mappings** (`/metadata/mappings/*`)
   - Lookup mapping for local field
   - Suggest mappings for local fields

**Files to Create/Modify:**
- `apps/kernel/src/routes/metadata.ts`
- `apps/kernel/src/services/metadata.service.ts`

---

### **Session 5: META_05 Canon Matrix** (Hierarchy Visualization)
**Priority:** 🟢 **LOW**  
**Duration:** ~4-5 hours

**Current State:**
- META_05 page exists (`/meta-canon`)
- Component: `MetaCanonMatrixPage.tsx`
- Status: Built but needs Kernel integration

**Features:**
1. **Hierarchy Tree Visualization**
   - Visual tree of Group → Transaction → Cell
   - Expandable/collapsible nodes
   - Color-coded by hierarchy level

2. **Governance Display**
   - Show canon status (LOCKED/ACTIVE/DEPRECATED)
   - Show compliance tags
   - Show approval requirements

3. **Interactive Features**
   - Click node → Navigate to META_03 detail page
   - Filter by domain, status, criticality
   - Export hierarchy tree

**Files to Modify:**
- `apps/web/app/meta-canon/page.tsx`
- `apps/web/src/views/META_05_MetaCanonMatrixPage.tsx`
- May need new Kernel endpoint: `/metadata/hierarchy/tree`

---

### **Session 6: Data Seeding Expansion** (Database)
**Priority:** 🟡 **MEDIUM**  
**Duration:** ~2-3 hours

**Current State:**
- 10 records seeded (4 COA + 6 fields)
- Basic hierarchy structure

**Expansion:**
1. **More COA Hierarchy**
   - Additional Groups (Expenses, Assets, Liabilities)
   - More Transactions per Group
   - More Cells per Transaction

2. **More Metadata Fields**
   - Additional domains (Operations, HR, Sales)
   - More entity groups
   - Complete field sets for entities

3. **Relationships**
   - Entity-to-field mappings
   - Field-to-field mappings
   - Lineage relationships

**Files to Modify:**
- `apps/kernel/scripts/seed.ts`
- May need additional seed scripts

---

### **Session 7: Performance & Optimization** (Polish)
**Priority:** 🟢 **LOW**  
**Duration:** ~2-3 hours

**Optimizations:**
1. **API Performance**
   - Add pagination to large queries
   - Implement caching strategy
   - Optimize database queries

2. **Frontend Performance**
   - Virtual scrolling for large tables
   - Lazy loading of DetailDrawer
   - Memoization of expensive computations

3. **Error Handling**
   - Better error messages
   - Retry logic for failed requests
   - Offline mode handling

---

## 📊 **Priority Matrix**

| Session | Priority | Duration | Dependencies |
|---------|----------|----------|--------------|
| **1. Verification** | 🔴 HIGH | 30 min | None |
| **2. Hierarchy Features** | 🟡 MEDIUM | 2-3 hrs | Session 1 |
| **3. META_03 Detail** | 🔴 HIGH | 3-4 hrs | Session 1 |
| **4. Kernel APIs** | 🟡 MEDIUM | 2-3 hrs | Session 3 |
| **5. META_05 Matrix** | 🟢 LOW | 4-5 hrs | Session 2, 3 |
| **6. Data Seeding** | 🟡 MEDIUM | 2-3 hrs | None |
| **7. Performance** | 🟢 LOW | 2-3 hrs | All above |

---

## 🎯 **Recommended Next Steps**

### **Immediate (Today):**
1. ✅ **Session 1: Verification** - Restart Kernel, test everything works
2. ✅ **Session 3: META_03 Detail** - Connect detail page to Kernel API

### **Short-term (This Week):**
3. ✅ **Session 2: Hierarchy Features** - Enhance hierarchy display
4. ✅ **Session 4: Kernel APIs** - Add missing API endpoints

### **Medium-term (Next Week):**
5. ✅ **Session 6: Data Seeding** - Expand seed data
6. ✅ **Session 5: META_05 Matrix** - Build hierarchy visualization

### **Long-term (Polish):**
7. ✅ **Session 7: Performance** - Optimize and polish

---

## 📝 **Notes**

- **META_02 is functionally complete** - Just needs verification
- **META_03 exists** - Needs Kernel integration
- **META_05 exists** - Needs Kernel integration + hierarchy visualization
- **All other META pages** (META_01, META_04, META_06, META_07, META_08) are built but may need Kernel integration

---

**Last Updated:** 2025-01-27  
**Status:** 📋 **Planning Document - Ready for Execution**
