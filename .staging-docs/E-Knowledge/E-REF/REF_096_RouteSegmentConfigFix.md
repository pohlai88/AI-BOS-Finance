# REF_096: Route Segment Config Fix - Client Component Error

> **🟢 [STAGING]** — Fixed Invalid Route Segment Config in Client Components  
> **Date:** 2025-01-27  
> **Status:** ✅ Fixed

---

## 🐛 **Error Encountered**

```
Error: Invalid revalidate value "function() {
    throw new Error("Attempted to call revalidate() from the server but revalidate is on the client...");
}" on "/dashboard", must be a non-negative number or false
```

**Root Cause:** Client Components (`'use client'`) cannot export route segment config (`dynamic`, `revalidate`). These exports are only valid in Server Components.

---

## ✅ **Fix Applied**

### **Files Fixed:**

1. **`apps/web/app/dashboard/page.tsx`**
   - ❌ Removed: `export const dynamic = 'force-dynamic'`
   - ❌ Removed: `export const revalidate = 0`
   - ✅ Added: Comment explaining why route segment config can't be used

2. **`apps/web/app/inventory/page.tsx`**
   - ❌ Removed: `export const dynamic = 'force-dynamic'`
   - ❌ Removed: `export const revalidate = 0`

3. **`apps/web/app/payments/page.tsx`**
   - ❌ Removed: `export const dynamic = 'force-dynamic'`
   - ❌ Removed: `export const revalidate = 0`

4. **`apps/web/app/system/page.tsx`**
   - ❌ Removed: `export const dynamic = 'force-dynamic'`
   - ❌ Removed: `export const revalidate = 0`

### **Files That Are Correct:**

- ✅ **`apps/web/app/page.tsx`** - Server Component, can keep route segment config

---

## 📚 **Understanding the Issue**

### **Server Components vs Client Components:**

**Server Components:**
- Can export route segment config (`dynamic`, `revalidate`, `runtime`, etc.)
- Run on the server only
- Can use server-only APIs

**Client Components (`'use client'`):**
- Cannot export route segment config
- Run in the browser
- Use `cache: 'no-store'` in fetch calls for real-time updates

### **Why This Happened:**

During Phase 2 optimizations, route segment config was added to all pages for caching control. However, these pages were later converted to client components for interactivity, creating a conflict.

---

## 🔧 **Solution**

### **For Client Components:**

Instead of route segment config, use fetch options:

```typescript
// ❌ Don't do this in Client Components
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ✅ Do this instead
fetch(url, {
  cache: 'no-store', // Disable caching for real-time updates
})
```

### **For Server Components:**

Route segment config is fine:

```typescript
// ✅ This is correct for Server Components
export const dynamic = 'force-static'
export const revalidate = 3600
```

---

## ✅ **Verification**

After fix:
- ✅ Dashboard page loads without errors
- ✅ Green box appears (ping-pong test working)
- ✅ No route segment config errors in logs

---

## 📝 **Best Practices**

1. **Route Segment Config:** Only use in Server Components
2. **Client Components:** Use fetch `cache` options for caching control
3. **Hybrid Approach:** Server Component wrapper + Client Component for interactivity

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Fixed - All client components updated
