# REF_040: Staging Documentation Workflow

**Date:** 2025-01-27  
**Status:** ✅ Active  
**Related:** CONT_01_CanonIdentity, REF_039_FilesystemMCP_CanonIntegration  
**Purpose:** Define workflow for managing files before they enter Canon governance

---

## 🎯 Problem Statement

**Issue:** IDE/AI creates files at project root, making it messy and bypassing Canon governance.

**Solution:** Two-stage workflow:
1. **Stage 1:** Files created in `.staging-docs/` (staging area)
2. **Stage 2:** Files promoted to `canon/` after developer approval

---

## 📁 Directory Structure

```
.staging-docs/
├── README.md                    # This workflow guide
├── A-Governance/               # Mirrors canon/ structure directly
│   ├── A-ADR/                  # ADR files before approval
│   └── A-CONT/                 # Contract files before approval
├── B-Functional/
│   ├── B-PAGE/                 # Page files before approval
│   ├── B-COMP/                 # Component files before approval
│   └── B-CELL/                 # Cell files before approval
├── C-DataLogic/
│   ├── C-ENT/                  # Entity files before approval
│   ├── C-SCH/                  # Schema files before approval
│   ├── C-POLY/                 # Policy files before approval
│   └── C-CONST/                # Constant files before approval
├── D-Operations/
│   └── D-TOOL/                 # Tool files before approval
└── E-Knowledge/
    ├── E-REF/                  # Reference files before approval
    └── E-SPEC/                 # Specification files before approval
```

---

## 🔄 Workflow

### Step 1: Create File in Staging

**AI/IDE creates file:**
```
.staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
```

**File is:**
- ✅ Created in staging area
- ✅ NOT tracked by Git (`.gitignore`)
- ✅ NOT validated by Canon governance
- ✅ NOT in registry.ts
- ✅ Can be edited freely

### Step 2: Developer Review

**Developer checks:**
- ✅ File follows Canon naming convention (e.g., `ADR_003_Name.md`)
- ✅ File is in correct plane directory
- ✅ Content is appropriate for Canon
- ✅ File structure matches Canon requirements

### Step 3: Promote to Canon

**Run promotion command:**
```bash
npm run canon:promote .staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
```

**What happens:**
1. File is moved from `.staging-docs/` to `canon/`
2. File is added to `canon/registry.ts` automatically
3. File is now governed by Canon rules
4. File is tracked by Git

**Result:**
```
canon/A-Governance/A-ADR/ADR_003_NewDecision.md  ✅ Now in Canon
```

---

## 🛠️ Tools & Commands

### List Staging Files
```bash
npm run canon:list-staging
```

**Output:**
```
📋 Staging Files:
  - A-Governance/A-ADR/ADR_003_NewDecision.md
  - E-Knowledge/E-REF/REF_041_NewReference.md
```

### Promote File to Canon
```bash
npm run canon:promote <file-path>
```

**Example:**
```bash
npm run canon:promote .staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
```

**Output:**
```
✅ File promoted successfully
📁 Moved to: canon/A-Governance/A-ADR/ADR_003_NewDecision.md
📝 Registry updated
✅ File is now part of Canon governance system
```

### Validation

The promotion tool automatically validates:
- ✅ File is in `.staging-docs/` directory
- ✅ File follows Canon naming convention (e.g., `ADR_001_Name.md`)
- ✅ File is in correct plane directory
- ✅ Target location doesn't already exist

---

## 📋 Rules & Guidelines

### File Naming Convention

**Must follow pattern:**
```
{PREFIX}_{NUMBER}_{Name}.{ext}
```

**Examples:**
- ✅ `ADR_003_NewDecision.md`
- ✅ `CONT_02_DataPrivacy.md`
- ✅ `TOOL_30_NewTool.ts`
- ✅ `REF_041_NewReference.md`
- ❌ `new-decision.md` (missing prefix)
- ❌ `ADR_NewDecision.md` (missing number)
- ❌ `ADR_003.md` (missing name)

### Directory Structure

**Must mirror canon structure:**
```
.staging-docs/{Plane}/{Plane-Prefix}/
```

**Examples:**
- ✅ `.staging-docs/A-Governance/A-ADR/`
- ✅ `.staging-docs/B-Functional/B-COMP/`
- ✅ `.staging-docs/D-Operations/D-TOOL/`
- ❌ `.staging-docs/ADR/` (missing plane structure)
- ❌ `.staging-docs/canon/A-Governance/` (extra canon/ depth)

### Git Tracking

**Files in `.staging-docs/` are:**
- ❌ NOT tracked by Git (in `.gitignore`)
- ❌ NOT committed to repository
- ❌ NOT visible in Git status

**After promotion to `canon/`:**
- ✅ Tracked by Git
- ✅ Can be committed
- ✅ Visible in Git status

---

## 🚨 Common Mistakes

### ❌ Creating Files at Root

**Wrong:**
```
AI-BOS-Finance/
├── ADR_003_NewDecision.md  ❌ At root
├── new-doc.md              ❌ At root
└── canon/...
```

**Correct:**
```
AI-BOS-Finance/
├── .staging-docs/
│   └── A-Governance/
│       └── A-ADR/
│           └── ADR_003_NewDecision.md  ✅ In staging
└── canon/...
```

### ❌ Creating Files Directly in Canon

**Wrong:**
```
canon/A-Governance/A-ADR/ADR_003_NewDecision.md  ❌ Direct creation
```

**Correct:**
```
.staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md  ✅ First
→ Review & approve
→ npm run canon:promote
→ canon/A-Governance/A-ADR/ADR_003_NewDecision.md  ✅ After promotion
```

### ❌ Wrong Naming Convention

**Wrong:**
```
.staging-docs/A-Governance/A-ADR/new-decision.md  ❌
.staging-docs/A-Governance/A-ADR/ADR_NewDecision.md  ❌
```

**Correct:**
```
.staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md  ✅
```

---

## 🔍 Integration with Filesystem MCP

**Filesystem MCP can:**
- ✅ Query staging files: "List all staging ADR files"
- ✅ Validate structure: "Check if staging file follows naming convention"
- ✅ Auto-promote: "Promote all approved staging files"

**Example MCP Query:**
```
"List all staging files in .staging-docs/A-Governance/A-ADR/"
```

---

## 📊 Benefits

### 1. Clean Root Directory
- ✅ No clutter at project root
- ✅ All documentation organized
- ✅ Clear separation of concerns

### 2. Governance Control
- ✅ Files reviewed before entering Canon
- ✅ Naming conventions enforced
- ✅ Structure validated

### 3. Git Hygiene
- ✅ Staging files not tracked
- ✅ Only approved files in repository
- ✅ Clean commit history

### 4. Developer Workflow
- ✅ Clear process for file creation
- ✅ Easy promotion tool
- ✅ Automatic registry updates

---

## ✅ Checklist for Developers

When creating new documentation:

- [ ] Create file in `.staging-docs/` (not root, not canon/)
- [ ] Follow naming convention: `{PREFIX}_{NUMBER}_{Name}.{ext}`
- [ ] Place in correct plane directory
- [ ] Review content and structure
- [ ] Run `npm run canon:promote` to move to canon/
- [ ] Verify file appears in `canon/registry.ts`
- [ ] Commit to Git

---

## 🔗 Related Documents

- **CONT_01_CanonIdentity.md** - Canon governance rules
- **REF_039_FilesystemMCP_CanonIntegration.md** - Filesystem MCP integration
- **TOOL_29_PromoteUnauditedToCanon.ts** - Promotion tool implementation
- **.staging-docs/README.md** - Quick reference

---

**Status:** ✅ **Active Workflow**  
**Last Updated:** 2025-01-27  
**Next Review:** When workflow needs adjustment
