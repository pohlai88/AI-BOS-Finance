> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_004  
> **Version:** 1.0.0  
> **Purpose:** Standardized SEAL format for all Canon documents  
> **Plane:** E — Knowledge (Reference)

---

# REF_004: SEAL Format Standard

> **Purpose:** Define the standardized SEAL (Status, Entity, Authority, Label) format for all Canon documents and README files.

---

## 📋 SEAL Format Definition

### Standard SEAL Header Structure

```markdown
> **{STATUS}** — {DOCUMENT_TYPE}  
> **Canon Code:** {CODE}  
> **Version:** {VERSION} (if applicable)  
> **{FIELD_1}:** {VALUE_1}  
> **{FIELD_2}:** {VALUE_2}  
> **Plane:** {PLANE_LETTER} — {PLANE_NAME} ({PLANE_TYPE})
```

---

## 🎯 SEAL Components

### 1. Status (Required)
- `🟢 [ACTIVE]` - Production-ready, certified
- `🟡 [DRAFT]` - Work in progress
- `🔴 [DEPRECATED]` - Superseded, do not use

### 2. Document Type (Required)
- `Certified for Production` - Contracts (CONT)
- `Architectural Decision` - ADRs
- `Reference Document` - REF documents
- `Specification` - SPEC documents
- `Navigation Index` - README files

### 3. Canon Code (Required)
- Format: `{PREFIX}_{NUMBER}`
- Examples: `CONT_01`, `ADR_001`, `REF_004`

### 4. Plane (Required for governed documents)
- Format: `{LETTER} — {NAME} ({TYPE})`
- Examples: `A — Governance (Contract)`, `E — Knowledge (Reference)`

---

## 📐 README SEAL Format

### Standard README Header

```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** {PLANE_LETTER}-{PLANE_NAME}  
> **Prefixes:** {PREFIX_1}, {PREFIX_2}, ...  
> **Location:** `{RELATIVE_PATH}`  
> **SSOT:** `{SSOT_FILE_PATH}` (if applicable)  
> **Auto-Generated:** {DATE} (if auto-generated)
```

### README Fields by Plane

#### Plane A — Governance
```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** A-Governance  
> **Prefixes:** CONT, ADR  
> **Location:** `canon/A-Governance/`  
> **SSOT:** `CONT_01_CanonIdentity.md` — Single Source of Truth
```

#### Plane B — Functional
```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** B-Functional  
> **Prefixes:** PAGE, COMP, CELL  
> **Location:** `canon/B-Functional/`  
> **Registry Type:** YAML manifests
```

#### Plane C — Data & Logic
```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** C-DataLogic  
> **Prefixes:** ENT, SCH, POLY, CONST  
> **Location:** `canon/C-DataLogic/`  
> **Registry Type:** YAML manifests
```

#### Plane D — Operations
```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** D-Operations  
> **Prefixes:** TOOL, MIG, INFRA  
> **Location:** `canon/D-Operations/`  
> **Content Type:** Scripts, runbooks, infrastructure docs
```

#### Plane E — Knowledge
```markdown
> **🟢 [ACTIVE]** — Navigation Index  
> **Canon Plane:** E-Knowledge  
> **Prefixes:** SPEC, REF  
> **Location:** `canon/E-Knowledge/`  
> **Content Type:** Specifications, reference documents
```

---

## 📊 Document Type SEAL Formats

### CONT (Contract)
```markdown
> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_01  
> **Version:** 2.2.0  
> **Certified Date:** YYYY-MM-DD  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** {SCOPE}  
> **Authority:** {AUTHORITY}
```

### ADR (Architecture Decision Record)
```markdown
> **🟢 [ACTIVE]** — Architectural Decision  
> **Canon Code:** ADR_XXX  
> **Status:** Accepted  
> **Date:** YYYY-MM-DD  
> **Context:** {CONTEXT}  
> **Supersedes:** {PREVIOUS_ADR or N/A}  
> **Related:** {RELATED_DOCS}
```

### REF (Reference Document)
```markdown
> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_XXX  
> **Version:** X.X.X  
> **Purpose:** {PURPOSE}  
> **Plane:** E — Knowledge (Reference)
```

### SPEC (Specification)
```markdown
> **🟢 [ACTIVE]** — Specification  
> **Canon Code:** SPEC_XXX  
> **Version:** X.X.X  
> **Purpose:** {PURPOSE}  
> **Plane:** E — Knowledge (Specification)
```

---

## ✅ Validation Rules

### Required Fields (All Documents)
1. ✅ Status emoji and label
2. ✅ Document type
3. ✅ Canon Code

### Required Fields (Governed Documents)
4. ✅ Plane designation
5. ✅ Version (if applicable)

### Required Fields (README Files)
6. ✅ Canon Plane
7. ✅ Prefixes
8. ✅ Location
9. ✅ SSOT reference (if applicable)

---

## 🔧 Auto-Generation

README headers should be **auto-generated** by parsing:
- Directory structure (Plane, Prefixes)
- Files in directory (SSOT detection)
- Registry files (for registry-based directories)

**Tool:** `TOOL_13_GenerateReadmeHeaders.ts`

---

## 📚 Related Documents

- **CONT_01:** `canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`
- **Validation Tool:** `canon/D-Operations/D-TOOL/TOOL_14_ValidateSEALFormat.ts`
- **Generation Tool:** `canon/D-Operations/D-TOOL/TOOL_13_GenerateReadmeHeaders.ts`

---

**Last Updated:** 2025-12-11  
**Status:** ✅ Active Standard
