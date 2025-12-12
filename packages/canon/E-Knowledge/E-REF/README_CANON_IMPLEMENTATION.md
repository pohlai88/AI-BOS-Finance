> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_006  
> **Version:** 1.0.0  
> **Purpose:** Canon Identity Contract implementation guide  
> **Plane:** E — Knowledge (Reference)  
> **Date:** 2025-12-11

---

# Canon Identity Contract - Implementation Guide

**Status:** Step 1 (Enforcer) + Step 2 (Generator) Complete ✅

---

## Quick Start

### 1. Install Dependencies (if needed)

```bash
# Check if glob and js-yaml are installed
npm list glob js-yaml

# If not, install them
npm install --save-dev glob js-yaml
```

### 2. Test ESLint Rule

```bash
# Run ESLint to check for PAGE_META in canonical pages
npm run lint

# The rule will flag canonical pages (META_*, PAY_*, SYS_*) missing PAGE_META
```

### 3. Test Sync Script

```bash
# Generate canon/pages.yaml from PAGE_META exports
npm run canon:sync

# Output:
# 🔄 Syncing Canon Identity Registry...
# ✅ Synced 15 pages to canon/pages.yaml
```

---

## Workflow

### Developer Creates New Page

1. **Create file:** `src/pages/META_05_NewFeature.tsx`
2. **ESLint flags error:** "Canonical page must export 'PAGE_META'."
3. **Add PAGE_META:**
   ```tsx
   export const PAGE_META = {
     code: 'META_05',
     version: '1.0.0',
     name: 'New Feature',
     route: '/meta/new-feature',
     domain: 'METADATA',
     owner: 'CID_METADATA',
   } as const satisfies PageMeta;
   ```
4. **ESLint passes:** ✅
5. **CI/CD runs:** `npm run canon:sync`
6. **Registry updated:** `canon/pages.yaml` automatically includes `META_05`

---

## Files Created

- ✅ `scripts/sync-canon.ts` - Auto-sync script (v1.1)
- ✅ `eslint-local-rules.js` - ESLint rule for PAGE_META enforcement
- ✅ `eslint.config.js` - Updated with Canon rules
- ✅ `package.json` - Already has `canon:sync` script

---

## Next Steps

1. **Add PAGE_META to existing pages** (start with one, test sync)
2. **Set up CI/CD** to run `canon:sync` on push
3. **Step 3:** Refactor component library (TBLM01, TBLL01, etc.)

---

**For detailed documentation, see:**
- `.identity_contract/CANON_IDENTITY_CONTRACT_v2.0.1.md`
- `.identity_contract/IMPLEMENTATION_COMPLETE.md`

