# Canon Refactor Pull Request

> **Template:** Use this template for all Canon refactoring operations (renames, migrations, structural changes)

---

## DOD Compliance

- [ ] **DOD Version Used:** REF_028 v1.0.0
- [ ] **Pre-Flight Checklist:** All items completed (see REF_028)
- [ ] **Baseline Metrics:** Documented below
- [ ] **Execution Log:** Updated in REF_027

---

## Refactor Details

**Type:** [ ] Phase 2 (Rename Files) | [ ] Phase 3 (Canon Pages Migration) | [ ] Other

**Scope:**
- Files affected: ___
- Domains affected: ___
- Risk level: [ ] Low | [ ] Medium | [ ] High | [ ] Canon-Critical

**Related Documentation:**
- REF_014: [Link to audit report]
- REF_026: [Link to migration plan, if applicable]
- REF_027: [Link to execution log]
- REF_028: [Link to DOD checklist]

---

## Baseline Metrics (Before)

**TOOL_18 Results:**
```
Invalid files: ___
Framework files: ___
Canon files: ___
Unknown files: ___
```

**Other Validations:**
- Type check: [ ] Pass | [ ] Fail
- Linter: [ ] Pass | [ ] Fail
- Tests: [ ] Pass | [ ] Fail
- Build: [ ] Pass | [ ] Fail

---

## Changes Made

### Files Renamed/Moved
<!-- List files or attach mapping file -->
- `old/path/file.ts` → `new/path/file.ts`

### Import Path Updates
<!-- List import changes -->
- Updated imports in: `file1.ts`, `file2.ts`

### Route Updates
<!-- If applicable -->
- Updated Next.js routes: `app/.../page.tsx`

### Documentation Updates
<!-- List documentation changes -->
- Updated: REF_027, REF_026 (if applicable)

---

## After Metrics

**TOOL_18 Results:**
```
Invalid files: ___
Framework files: ___
Canon files: ___
Unknown files: ___
```

**Improvement:**
- Invalid files reduced by: ___
- New violations: [ ] None | [ ] List below

**Other Validations:**
- Type check: [ ] Pass | [ ] Fail
- Linter: [ ] Pass | [ ] Fail
- Tests: [ ] Pass | [ ] Fail
- Build: [ ] Pass | [ ] Fail

---

## Manual Testing

**Routes Tested:**
- [ ] Route 1: `/path` - Status: [ ] ✅ Works | [ ] ❌ Broken
- [ ] Route 2: `/path` - Status: [ ] ✅ Works | [ ] ❌ Broken

**Browser Testing:**
- [ ] All migrated pages load correctly
- [ ] Navigation works
- [ ] Metadata/SEO intact
- [ ] No console errors

**Issues Found:**
<!-- List any issues discovered during testing -->
- None
- Issue 1: Description
- Issue 2: Description

---

## Mapping File

**Location:** `canon/D-Operations/D-TOOL/TOOL_23_RENAME_MAPPING.json` (if applicable)

**Summary:**
- Total files renamed: ___
- Cross-references found: ___
- Cross-references updated: ___

---

## Sign-Off

**Author:** @username  
**Reviewer:** @username (required)  
**Approver:** @username (required for medium/high-risk refactors)

**Checklist:**
- [ ] All pre-flight checks passed
- [ ] All validations pass
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] REF_027 execution log updated
- [ ] DOD version referenced

---

## Additional Notes

<!-- Any additional context, concerns, or follow-up items -->

---

## Related Issues

<!-- Link to related issues or tickets -->

---

**Remember:** This PR follows REF_028 Canon Refactor DOD v1.0.0. All checklist items must be completed before merge.
