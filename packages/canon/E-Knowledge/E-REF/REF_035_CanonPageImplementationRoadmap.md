# REF_035: Canon Page Implementation Roadmap

**Date:** 2025-01-27  
**Status:** Ready for Implementation  
**Purpose:** Clear roadmap for implementing maintainable, scalable Canon page system  
**Related:** REF_032, REF_033, REF_034

---

## System Status

✅ **Complete and Ready**

All components created:
- ✅ Canon Page Registry (`canon/registry/canon-pages.ts`)
- ✅ CanonPageShell Component (`app/components/canon/CanonPageShell.tsx`)
- ✅ MDX Components (`mdx-components.tsx`)
- ✅ Template Generator (TOOL_24)
- ✅ Documentation (REF_032, REF_033, REF_034)

---

## Implementation Roadmap

### Phase 1: Setup (One-Time)

**Prerequisites:**
- Next.js App Router configured
- `@next/mdx` installed
- `mdx-components.tsx` at project root

**Steps:**
1. [ ] Install MDX dependencies:
   ```bash
   npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
   ```

2. [ ] Configure `next.config.js`:
   ```js
   import createMDX from '@next/mdx'
   
   const nextConfig = {
     pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
   }
   
   const withMDX = createMDX({})
   export default withMDX(nextConfig)
   ```

3. [ ] Verify `mdx-components.tsx` exists at root
4. [ ] Verify `canon/registry/canon-pages.ts` exists
5. [ ] Verify `app/components/canon/CanonPageShell.tsx` exists

**Time:** ~10 minutes

---

### Phase 2: Execute Renames (Current Priority)

**Follow:** REF_027 "Live Fire #1" script

**Steps:**
1. [ ] Pre-flight checks (REF_028)
2. [ ] Run TOOL_23 dry-run
3. [ ] Execute TOOL_23
4. [ ] Update references
5. [ ] Validate
6. [ ] Create PR

**Time:** ~30 minutes

**Result:** 16 files renamed (4 tools + 12 refs)

---

### Phase 3: Migrate Canon Pages (Per Batch)

**Follow:** REF_026 migration plan + REF_033 implementation guide

#### Batch 1: META Domain (8 files)

**Steps:**
1. [ ] Create `canon-pages/META/` directory
2. [ ] Convert 8 TSX files to MDX
3. [ ] Add 8 entries to registry
4. [ ] Run TOOL_24 to generate wrappers
5. [ ] Update imports
6. [ ] Test routes
7. [ ] Validate (TOOL_18, build, manual test)
8. [ ] Create PR

**Time:** ~2-3 hours

**Expected:** 8 META pages migrated, routes working

#### Batch 2-5: REG, SYS, PAY, INV

**Repeat same pattern** for each domain.

**Total Time:** ~10-15 hours (across multiple PRs)

---

## Quick Reference

### Adding New Canon Page

```bash
# 1. Create MDX
touch canon-pages/META/META_09_NewPage.mdx

# 2. Add to registry (canon/registry/canon-pages.ts)
# 3. Generate wrapper
npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute

# 4. Test
npm run dev
# Navigate to route
```

**Time:** 5 minutes

### Updating Shell

```bash
# Edit: app/components/canon/CanonPageShell.tsx
# All pages updated automatically
```

**Time:** 2 minutes, affects all pages

### Regenerating Wrappers

```bash
npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
```

**Time:** 10 seconds

---

## Success Metrics

### After Phase 2
- ✅ 16 files renamed
- ✅ TOOL_18: 35 → 19 invalid files
- ✅ All validations pass

### After Phase 3 (All Batches)
- ✅ 20 Canon pages migrated
- ✅ TOOL_18: 19 → 0 invalid files
- ✅ All routes working
- ✅ Consistent thin wrapper pattern
- ✅ Registry-driven system

---

## Maintenance Benefits

### Single Point of Change

**Update Shell:** Edit `CanonPageShell.tsx` → All pages updated  
**Update MDX Styling:** Edit `mdx-components.tsx` → All MDX updated  
**Add New Page:** Update registry → Generate wrapper → Done

### Scalability

**10 pages:** Same process as 1 page  
**100 pages:** Same process, just more registry entries  
**1000 pages:** Same process, TOOL_24 handles generation

### Auditability

**Registry:** Single source of truth  
**Generated Files:** Can regenerate anytime  
**Type Safety:** TypeScript ensures correctness

---

## Next Actions

1. **Immediate:** Execute Phase 2 (rename files)
2. **Short-term:** Setup Next.js MDX (if not done)
3. **Medium-term:** Execute Phase 3 Batch 1 (META)
4. **Long-term:** Complete all batches

---

## Related Documentation

- **REF_032:** Thin Wrapper Pattern (design)
- **REF_033:** Implementation Guide (how-to)
- **REF_034:** System Summary (overview)
- **REF_026:** Migration Plan
- **REF_028:** Canon Refactor DOD

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial roadmap created |
