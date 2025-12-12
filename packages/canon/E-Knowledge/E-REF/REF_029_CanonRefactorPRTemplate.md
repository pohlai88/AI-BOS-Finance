# REF_029: Canon Refactor PR Template

**Date:** 2025-01-27  
**Status:** Active Template  
**Purpose:** Standardized PR template for Canon refactoring operations  
**Related:** REF_028_CanonRefactorDOD.md

---

## Overview

This document defines the standard PR template for Canon refactoring operations. The template is located at:

**`.github/PULL_REQUEST_TEMPLATE/canon-refactor.md`**

Use this template for all Canon refactors to ensure consistent documentation and auditability.

---

## Template Sections

### 1. DOD Compliance
- DOD version used
- Pre-flight checklist confirmation
- Baseline metrics
- Execution log reference

### 2. Refactor Details
- Type of refactor (Phase 2, Phase 3, Other)
- Scope (files, domains, risk level)
- Links to related REF documents

### 3. Baseline Metrics
- TOOL_18 results (before)
- Other validation results (typecheck, lint, tests, build)

### 4. Changes Made
- Files renamed/moved
- Import path updates
- Route updates
- Documentation updates

### 5. After Metrics
- TOOL_18 results (after)
- Improvement metrics
- Validation results

### 6. Manual Testing
- Routes tested
- Browser testing results
- Issues found

### 7. Mapping File
- Location of mapping file
- Summary of changes

### 8. Sign-Off
- Author, Reviewer, Approver
- Checklist confirmation

### 9. Additional Notes
- Context, concerns, follow-up items

---

## Usage

### For Phase 2 (Rename Files)

1. Create PR from feature branch
2. Select "canon-refactor" template (if GitHub supports template selection)
3. Fill in all sections
4. Attach mapping file: `TOOL_23_RENAME_MAPPING.json`
5. Link to REF_014, REF_027, REF_028

### For Phase 3 (Canon Pages Migration)

1. Create PR per batch
2. Use "canon-refactor" template
3. Fill in batch-specific details
4. Link to REF_026 (migration plan)
5. Include manual testing results

---

## Integration with REF_028

The PR template enforces REF_028 requirements:

- ✅ DOD version tracking
- ✅ Baseline vs. after metrics
- ✅ Validation results
- ✅ Sign-off requirements
- ✅ Documentation links

---

## Future Enhancements

### CI Hook (Future)

Add a GitHub Actions workflow that:

1. Detects PRs with `canon-refactor` label or matching branch pattern
2. Checks for:
   - DOD version in PR description
   - Links to REF_027, REF_028
   - Mapping file attachment (if applicable)
3. Adds comment (non-blocking) if requirements missing

**Example:**
```yaml
# .github/workflows/canon-refactor-check.yml
name: Canon Refactor Check
on:
  pull_request:
    types: [opened, edited]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check DOD Compliance
        # Check PR description for REF_028 reference
        # Add comment if missing
```

---

## Related Documentation

- **REF_028:** Canon Refactor Definition of Done (DOD)
- **REF_027:** Stabilization Sequence Execution
- **REF_014:** TOOL_18 Validation Audit Report
- **REF_026:** Canon Pages Migration Plan

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial PR template created |
