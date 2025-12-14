# REF_113: Kernel Server Start Guide

> **🟢 [STAGING]** — Kernel Server Startup Guide  
> **Date:** 2025-01-27  
> **Status:** 📋 **Startup Instructions**

---

## 🚀 **KERNEL SERVER STARTUP**

### **Step 1: Navigate to Kernel Directory**
```bash
cd apps/kernel
```

### **Step 2: Start Development Server**
```bash
pnpm dev
```

### **Expected Output:**
```
🚀 AIBOS Kernel starting on http://localhost:3001
✅ Kernel running on http://localhost:3001
```

---

## ✅ **VERIFICATION STEPS**

### **1. Check Server is Running**
```bash
# Check if port 3001 is listening
netstat -ano | findstr ":3001"
```

**Expected:** Port 3001 should be LISTENING

### **2. Test Health Endpoint**
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "kernel"
}
```

### **3. Test Database Health**
```bash
curl http://localhost:3001/health/db
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### **4. Test Metadata Search API**
```bash
curl http://localhost:3001/metadata/fields/search?limit=1000
```

**Expected Response:**
```json
{
  "total": 10,
  "results": [
    {
      "dict_id": "GC-REV-001",
      "business_term": "Revenue Concepts",
      "is_group": true,
      "parent_dict_id": null,
      "is_bindable": false,
      ...
    },
    ...
  ],
  "limit": 1000,
  "offset": 0
}
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Server Doesn't Start**

**Possible Causes:**
1. Port 3001 already in use
2. Missing environment variables
3. Database connection issue

**Solutions:**

1. **Check Port Availability:**
   ```bash
   netstat -ano | findstr ":3001"
   ```
   If port is in use, kill the process or change port in `src/index.ts`

2. **Verify Environment Variables:**
   ```bash
   # Check if DATABASE_URL is set
   echo $env:DATABASE_URL
   ```
   Should show your Supabase connection string

3. **Check Database Connection:**
   - Verify `.env.local` exists in root directory
   - Verify `DATABASE_URL` is set correctly
   - Test connection: `psql $DATABASE_URL` (if psql installed)

### **Issue: Database Connection Fails**

**Check:**
1. `.env.local` file exists in root directory
2. `DATABASE_URL` is set correctly
3. Supabase project is accessible
4. Database credentials are correct

**Fix:**
```bash
# Create/update .env.local in root directory
cd ../..
echo "DATABASE_URL=postgresql://..." > .env.local
```

---

## 📋 **STARTUP CHECKLIST**

- [ ] Navigate to `apps/kernel` directory
- [ ] Verify `DATABASE_URL` is set in `.env.local`
- [ ] Run `pnpm dev`
- [ ] Wait for "Kernel running" message
- [ ] Test `/health` endpoint
- [ ] Test `/health/db` endpoint
- [ ] Test `/metadata/fields/search` endpoint
- [ ] Verify returns `total: 10`

---

## 🎯 **SUCCESS CRITERIA**

✅ **Server Started:**
- Port 3001 is listening
- Health endpoint returns OK
- Database health returns connected

✅ **API Working:**
- Search endpoint returns data
- Returns `total: 10`
- Returns all 10 records

✅ **Ready for Frontend:**
- All endpoints accessible
- CORS configured for localhost:3000
- Data transformation working

---

**Last Updated:** 2025-01-27  
**Status:** 📋 **Startup Guide - Follow Steps Above**
