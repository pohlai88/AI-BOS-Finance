# REF_030: Canon Refactor Culture & Usage Guide

**Date:** 2025-01-27  
**Status:** Active Guide  
**Purpose:** How to make REF_028 DOD part of AI-BOS culture, not just documentation  
**Related:** REF_028_CanonRefactorDOD.md, REF_029_CanonRefactorPRTemplate.md

---

## Overview

This document explains how to integrate REF_028 (Canon Refactor DOD) into daily development workflow, making it a **first-class Canon asset** rather than just documentation.

**Goal:** Every Canon refactor follows the same governed process, creating a repeatable, auditable change management system.

---

## The Complete System

### Documentation Stack

1. **REF_028** - Definition of Done (the checklist)
2. **REF_027** - Execution log (what was done, when, with which DOD version)
3. **REF_029** - PR template (how to document refactors)
4. **REF_014** - Audit reports (what needs fixing)
5. **REF_026** - Migration plans (target structures)

### Tools

1. **TOOL_18** - Validation (before/after metrics)
2. **TOOL_23** - Automated renames (with mapping files)
3. **PR Template** - Standardized documentation

---

## Making It Part of Culture

### 1. First "Live Fire" Exercise

**Start Small:**
- Pick the lowest-risk refactor (e.g., tool/reference renames)
- Follow REF_028 v1.0.0 **literally**
- Document everything in REF_027
- Use the PR template

**After First Refactor:**
- Note any friction or missing steps
- Adjust REF_028 if needed → bump to v1.0.1
- Update this guide with lessons learned

### 2. PR Template Integration

**Location:** `.github/PULL_REQUEST_TEMPLATE/canon-refactor.md`

**Usage:**
- When creating a Canon refactor PR, use this template
- GitHub will auto-suggest it for branches matching `canon-refactor/**`
- Or manually select it when creating PR

**Benefits:**
- Ensures DOD version is referenced
- Captures baseline/after metrics
- Documents sign-off
- Links to all related REFs

### 3. Execution Log Pattern

**In REF_027, log each refactor:**

```markdown
## Phase 2 Execution Log

### Run #1: Tool & Reference Renames
- **Date:** 2025-01-27
- **DOD Version:** REF_028 v1.0.0
- **Branch:** `feat/canon-refactor-phase2-rename-files`
- **Commit:** `abc123...`
- **PR:** #123
- **Status:** ✅ Complete
- **Notes:** All 16 files renamed successfully, 3 cross-references updated
```

This creates a **complete audit trail**.

### 4. Version Tracking

**DOD Versioning:**
- REF_028 has version number (currently v1.0.0)
- Each refactor logs which DOD version was used
- When DOD evolves, bump version and document changes

**Why This Matters:**
- Auditors can see: "This refactor followed DOD v1.0.0, which was effective at that time"
- Prevents "moving goalposts" accusations
- Shows process maturity over time

### 5. Roles & Sign-Off

**REF_028 defines:**
- Low-risk: 1 Reviewer
- Medium-risk: 1 Reviewer + 1 Approver (if needed)
- High-risk: 1 Reviewer + 1 Approver (required)
- Canon-critical: 1 Reviewer + 1 Approver + Architecture review

**In Practice:**
- PR template includes sign-off section
- Reviewers check DOD compliance
- Approvers verify governance requirements

---

## Practical Workflow

### For Developers

**When starting a Canon refactor:**

1. **Read REF_028** - Understand the DOD
2. **Check REF_027** - See what's been done before
3. **Follow Pre-Flight** - Complete all checks
4. **Execute** - Follow phase-specific DOD
5. **Document** - Update REF_027, use PR template
6. **Review** - Get required sign-offs

### For Reviewers

**When reviewing a Canon refactor PR:**

1. **Check DOD Version** - Is it referenced?
2. **Verify Pre-Flight** - Were checks completed?
3. **Review Metrics** - Baseline vs. after
4. **Check Validations** - Do they pass?
5. **Verify Documentation** - REF_027 updated?
6. **Confirm Sign-Off** - Required approvals present?

### For Approvers

**When approving a Canon refactor:**

1. **Risk Assessment** - Is risk level correct?
2. **DOD Compliance** - Was process followed?
3. **Impact Analysis** - What's affected?
4. **Rollback Plan** - Can we revert if needed?
5. **Documentation** - Is audit trail complete?

---

## Future Enhancements

### CI Hook (Planned)

**GitHub Actions workflow** that:

1. Detects PRs with `canon-refactor` label or branch pattern
2. Checks PR description for:
   - DOD version reference
   - Links to REF_027, REF_028
   - Mapping file (if applicable)
3. Adds comment (non-blocking) if requirements missing

**Example Implementation:**
```yaml
# .github/workflows/canon-refactor-check.yml
name: Canon Refactor Check
on:
  pull_request:
    types: [opened, edited]
    paths:
      - 'canon/**'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check DOD Compliance
        run: |
          # Check for REF_028 reference
          # Check for REF_027 link
          # Add comment if missing
```

**Status:** Planned for future implementation

---

## Success Metrics

### Process Maturity Indicators

**After 3-5 refactors:**
- ✅ All refactors documented in REF_027
- ✅ All PRs use template
- ✅ DOD versions tracked
- ✅ No "surprise" refactors

**After 10+ refactors:**
- ✅ Process is second nature
- ✅ DOD improvements identified
- ✅ CI hook implemented (if needed)
- ✅ Culture shift complete

---

## Common Patterns

### Pattern 1: Small Rename

**Example:** Renaming 2-3 tool files

1. Follow REF_028 Phase 2 DOD
2. Use TOOL_23 (dry-run first)
3. Execute
4. Update REF_027
5. PR with template
6. 1 Reviewer (low-risk)

### Pattern 2: Domain Migration

**Example:** Moving META domain pages

1. Follow REF_028 Phase 3 DOD
2. Create batch branch
3. Move files (git mv)
4. Update imports
5. Test routes
6. Update REF_026, REF_027
7. PR with template
8. 1 Reviewer + 1 Approver (medium-risk)

### Pattern 3: Critical Domain

**Example:** PAY domain migration

1. Follow REF_028 Phase 3 DOD
2. Extra caution (business-critical)
3. Extensive testing
4. Update REF_026, REF_027
5. PR with template
6. 1 Reviewer + 1 Approver + Architecture review (high-risk)

---

## Troubleshooting

### "DOD is too strict"

**Response:** DOD ensures auditability. If steps are unnecessary, update REF_028 and bump version.

### "I don't have time for all these checks"

**Response:** Pre-flight checks prevent costly mistakes. They save time in the long run.

### "This is just a small change"

**Response:** Small changes accumulate. Following DOD ensures consistency.

### "Can I skip documentation?"

**Response:** No. Documentation is part of the audit trail. Use PR template to make it easy.

---

## Integration Checklist

To make REF_028 part of AI-BOS culture:

- [x] REF_028 created with versioning
- [x] REF_027 execution log created
- [x] PR template created
- [x] Roles & sign-off defined
- [ ] First "live fire" refactor executed
- [ ] Lessons learned documented
- [ ] DOD refined (if needed)
- [ ] CI hook implemented (future)
- [ ] Team trained on process
- [ ] Process becomes second nature

---

## Related Documentation

- **REF_028:** Canon Refactor Definition of Done (DOD)
- **REF_027:** Stabilization Sequence Execution
- **REF_029:** Canon Refactor PR Template
- **REF_014:** TOOL_18 Validation Audit Report
- **REF_026:** Canon Pages Migration Plan

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial culture guide created |
