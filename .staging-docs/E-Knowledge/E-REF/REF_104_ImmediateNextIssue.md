# REF_104: Immediate Next Issue

> **🔴 [ACTIVE]** — Blocking Issue  
> **Date:** 2025-01-27  
> **Status:** ⚠️ **ACTION REQUIRED**

---

## 🚨 **The Issue**

**Kernel Server is NOT Running** - Port 3001 is inactive, preventing:
- API endpoint testing (`/metadata/fields/search`)
- Frontend data fetching
- Verification of count query fix

---

## ✅ **What's Already Fixed**

1. ✅ **Count Query Fix** - Changed to use `count()` function
2. ✅ **Client-Side Fetch** - Added proper cache handling
3. ✅ **Route Mismatch** - Fixed DetailDrawer links
4. ✅ **Turborepo Config** - Updated to use `tasks` instead of `pipeline`
5. ✅ **Seed Data** - 10 records successfully inserted into database

---

## 🔧 **The Fix**

### **Step 1: Start Kernel Server**

```bash
# Terminal 1: Start Kernel (Backend)
cd apps/kernel
pnpm dev
```

**Expected Output:**
```
🚀 AIBOS Kernel starting on http://localhost:3001
✅ Kernel running on http://localhost:3001
```

### **Step 2: Verify Server is Running**

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"healthy","service":"kernel"}
```

### **Step 3: Test API Endpoint**

```bash
# Test metadata search endpoint
curl http://localhost:3001/metadata/fields/search?limit=1000

# Expected: {"total": 10, "results": [...]}
```

**Critical Check:**
- ✅ `total` should be `10` (not `0`)
- ✅ `results` array should contain 10 records
- ✅ Records should include COA hierarchy (GC-REV-001, TC-REV-001, etc.)

### **Step 4: Verify Frontend**

1. Navigate to: http://localhost:3000/meta-registry
2. Check browser console for errors
3. Verify table displays 6 records (bindable filter applied)
4. Verify hierarchy badges show correctly
5. Verify statistics cards show correct counts

---

## 🐛 **If Issues Persist**

### **Issue: API returns `total: 0`**

**Possible Causes:**
1. Count query fix not applied (server needs restart)
2. Database connection issue
3. Seed data not in database

**Solutions:**
```bash
# 1. Verify seed data exists
cd apps/kernel
pnpm seed

# 2. Check database connection
curl http://localhost:3001/health/db

# 3. Verify count query syntax
# Check: apps/kernel/src/services/metadata.service.ts line 97
# Should be: .select({ count: count() })
```

### **Issue: Frontend shows empty table**

**Possible Causes:**
1. Kernel server not running
2. Wrong Kernel URL in `.env`
3. CORS issue
4. API returning empty results

**Solutions:**
```bash
# 1. Check Kernel URL
# Verify: NEXT_PUBLIC_KERNEL_URL=http://localhost:3001

# 2. Check browser console
# Look for fetch errors or CORS errors

# 3. Test API directly
curl http://localhost:3001/metadata/fields/search?limit=1000
```

### **Issue: 404 errors in browser**

**Possible Causes:**
1. Route mismatch (already fixed in DetailDrawer)
2. Frontend route not matching API endpoint

**Solutions:**
- ✅ Already fixed: DetailDrawer links updated to `/meta-registry/`
- Verify: No `/metadata:1` errors in console

---

## ✅ **Success Criteria**

After restarting Kernel server:

- [ ] Kernel server running on port 3001
- [ ] Health check returns: `{"status":"healthy"}`
- [ ] Database health: `{"database":"connected"}`
- [ ] API endpoint returns: `total: 10`
- [ ] API returns all 10 records in results array
- [ ] Frontend loads without errors
- [ ] Table displays 6 records (bindable filter applied)
- [ ] Hierarchy column shows correct badges
- [ ] Statistics cards show correct counts
- [ ] No 404 errors in browser console

---

## 📋 **Quick Checklist**

```bash
# 1. Start Kernel
cd apps/kernel && pnpm dev

# 2. Wait for "Kernel running" message

# 3. Test API (in another terminal)
curl http://localhost:3001/metadata/fields/search?limit=1000

# 4. Check frontend
# Open: http://localhost:3000/meta-registry
# Verify: 6 records displayed, no errors
```

---

## 🎯 **Expected Outcome**

Once Kernel server is restarted:

1. ✅ API will return `total: 10` (count query fix applied)
2. ✅ Frontend will fetch and display data
3. ✅ Table will show 6 records (bindable filter)
4. ✅ Hierarchy badges will display correctly
5. ✅ Statistics will be accurate
6. ✅ No 404 errors

---

**Last Updated:** 2025-01-27  
**Status:** 🔴 **BLOCKING - Kernel Server Must Be Restarted**
