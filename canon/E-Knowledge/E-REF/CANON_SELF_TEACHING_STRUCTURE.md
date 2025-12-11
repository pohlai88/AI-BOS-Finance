# Canon Self-Teaching Directory Structure

**Status:** ✅ Ratified & Ready for Migration  
**Date:** 2025-12-11  
**Strategy:** "Self-Teaching Directory" - Zero Memorization Required

---

## 🎯 The Golden Path

The folder structure **IS** the cheat sheet. You don't need to read the manual to know that `Contracts` start with `CONT` and live in `Plane A`. The folder name tells you: `A-Governance/A-CONT`.

### Structure

```text
/
├── canon/                      # The Governance Root
│   ├── A-Governance/           # Plane A: Laws & Decisions
│   │   ├── A-CONT/             # (CONT) Contracts
│   │   │   ├── CONT_01_CanonIdentity.md
│   │   │   └── CONT_02_DataPrivacy.md
│   │   └── A-ADR/              # (ADR)  Architecture Decision Records
│   │       ├── ADR_001_NextJsAppRouter.md
│   │       └── ADR_002_CanonSecurity.md
│   │
│   ├── B-Functional/           # Plane B: UI & Experience
│   │   ├── B-PAGE/             # (PAGE) Page Registry
│   │   │   └── registry.yaml
│   │   ├── B-COMP/             # (COMP) Component Registry
│   │   │   └── registry.yaml
│   │   └── B-CELL/             # (CELL) Cell Registry
│   │       └── registry.yaml
│   │
│   ├── C-DataLogic/            # Plane C: Data & Business Rules
│   │   ├── C-ENT/              # (ENT)  Entity Registry
│   │   │   └── registry.yaml
│   │   ├── C-SCH/              # (SCH)  Schema Registry
│   │   │   └── registry.yaml
│   │   ├── C-POLY/             # (POLY) Policy Registry
│   │   │   └── registry.yaml
│   │   └── C-CONST/            # (CONST) Constants Registry
│   │       └── registry.yaml
│   │
│   ├── D-Operations/           # Plane D: Tooling & Infrastructure
│   │   ├── D-TOOL/             # (TOOL) Scripts & Runbooks
│   │   │   ├── TOOL_01_CanonSync.ts
│   │   │   └── TOOL_03_CheckGovernanceStamps.ts
│   │   ├── D-MIG/              # (MIG)  Database Migrations
│   │   │   └── MIG_20241211_AddUserRole.sql
│   │   └── D-INFRA/            # (INFRA) Infrastructure Docs
│   │       └── INFRA_01_RedisCluster.tf
│   │
│   └── E-Knowledge/            # Plane E: Library & Evidence
│       ├── E-SPEC/             # (SPEC) Feature Specifications
│       │   ├── SPEC_010_PaymentHub_v2.md
│       │   └── SPEC_011_FraudDetection.md
│       └── E-REF/              # (REF)  External References
│           ├── REF_001_ISO27001.pdf
│           └── REF_002_StripeAPI_v3.md
│
├── src/                        # Implementation (Source Code)
│   ├── pages/                  # PAGE implementations
│   ├── components/             # COMP implementations
│   └── constants/              # CONST implementations
│
└── db/                         # Database (ENT implementations)
    └── schema.cds
```

---

## ✨ Why This Wins

### 1. **Sorted for Logic**
- `A` always comes before `B`
- Alphabetical sorting = logical grouping
- No cognitive load searching

### 2. **Embedded Cheat Sheet**
- Navigate to `A-CONT` → Learn "Contracts use `CONT` prefix"
- Navigate to `B-PAGE` → Learn "Pages use `PAGE` prefix"
- **Zero memorization required**

### 3. **Conflict Proof**
- `A-ADR` cannot be confused with `E-REF`
- Folders are physically separated by planes
- Clear boundaries prevent mistakes

### 4. **Self-Documenting**
- Folder name = Plane + Prefix + Description
- New team members understand immediately
- No need to read documentation first

---

## 🚀 Migration

### Quick Start

```bash
# 1. Ensure you have a clean git state
git status

# 2. Create a backup branch
git checkout -b backup-before-plane-migration
git commit -am "Backup before plane migration"
git checkout main

# 3. Run migration script
npm run canon:migrate-planes

# 4. Review changes
git status
git diff

# 5. Test your application
npm run dev

# 6. If everything works, commit
git add .
git commit -m "feat: migrate to self-teaching Canon plane structure"
```

### Manual Migration (if script doesn't work)

```bash
# 1. Create structure
mkdir -p canon/A-Governance/{A-CONT,A-ADR}
mkdir -p canon/B-Functional/{B-PAGE,B-COMP,B-CELL}
mkdir -p canon/C-DataLogic/{C-ENT,C-SCH,C-POLY,C-CONST}
mkdir -p canon/D-Operations/{D-TOOL,D-MIG,D-INFRA}
mkdir -p canon/E-Knowledge/{E-SPEC,E-REF}

# 2. Move Plane A (Governance)
mv canon/contracts/CONT_*.md canon/A-Governance/A-CONT/ 2>/dev/null || true
mv canon/contracts/adrs/ADR_*.md canon/A-Governance/A-ADR/ 2>/dev/null || true

# 3. Move Plane D (Operations - TOOL files)
mv scripts/TOOL_*.ts canon/D-Operations/D-TOOL/ 2>/dev/null || true

# 4. Move Plane E (Knowledge)
mv knowledge/REF_*.md canon/E-Knowledge/E-REF/ 2>/dev/null || true
mv knowledge/SPEC_*.md canon/E-Knowledge/E-SPEC/ 2>/dev/null || true

# 5. Create registry placeholders
touch canon/B-Functional/B-PAGE/registry.yaml
touch canon/B-Functional/B-COMP/registry.yaml
touch canon/C-DataLogic/C-ENT/registry.yaml
```

---

## 📋 Post-Migration Checklist

- [ ] Review new structure in `canon/`
- [ ] Update import paths in code:
  - [ ] `import ... from 'canon/contracts/...'` → `import ... from 'canon/A-Governance/A-CONT/...'`
  - [ ] Update build configs (vite.config.ts, tsconfig.json)
- [ ] Update documentation references
- [ ] Update CI/CD scripts if they reference old paths
- [ ] Test application builds and runs
- [ ] Commit changes

---

## 🔍 Quick Reference

### Finding Files by Plane

| Plane | Directory | Prefixes | Example |
|-------|-----------|----------|---------|
| **A** | `canon/A-Governance/` | CONT_, ADR_ | `A-CONT/CONT_01_CanonIdentity.md` |
| **B** | `canon/B-Functional/` | PAGE_, COMP_, CELL_ | `B-PAGE/registry.yaml` |
| **C** | `canon/C-DataLogic/` | ENT_, SCH_, POLY_, CONST_ | `C-ENT/registry.yaml` |
| **D** | `canon/D-Operations/` | TOOL_, MIG_, INFRA_ | `D-TOOL/TOOL_01_CanonSync.ts` |
| **E** | `canon/E-Knowledge/` | SPEC_, REF_ | `E-SPEC/SPEC_010_PaymentHub.md` |

### Naming Pattern

```
canon/{PlaneLetter}-{Description}/{PlaneLetter}-{Prefix}/
```

Examples:
- `canon/A-Governance/A-CONT/` → Plane A, Governance, CONT prefix
- `canon/B-Functional/B-PAGE/` → Plane B, Functional, PAGE prefix
- `canon/C-DataLogic/C-ENT/` → Plane C, Data & Logic, ENT prefix

---

## 📚 Related Documents

- **CONT_01_CanonIdentity.md** - Full Canon Identity Contract (after migration: `canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`)
- **CANON_PLANES_DIRECTORY_ANALYSIS.md** - Analysis of current structure
- **CANON_PLANES_NAMING_STRATEGY.md** - Naming strategy comparison

---

## 🎓 Learning Path

1. **Navigate to `canon/A-Governance/A-CONT/`**
   - See: `CONT_01_CanonIdentity.md`
   - Learn: "Contracts use `CONT_` prefix, live in Plane A"

2. **Navigate to `canon/B-Functional/B-PAGE/`**
   - See: `registry.yaml`
   - Learn: "Pages use `PAGE_` prefix, live in Plane B"

3. **Navigate to `canon/D-Operations/D-TOOL/`**
   - See: `TOOL_01_CanonSync.ts`
   - Learn: "Tools use `TOOL_` prefix, live in Plane D"

**Result:** Zero memorization. The structure teaches itself.

---

**Status:** ✅ Ready for Production  
**Next:** Run `npm run canon:migrate-planes` to migrate
