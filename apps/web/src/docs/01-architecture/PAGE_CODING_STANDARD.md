# 🏗️ NEXUSCANON PAGE CODING STANDARD

## PURPOSE

Rigorous page identification system for audit trails, documentation, and large-scale governance platforms.

---

## CURRENT PAGE REGISTRY

| Page Code | Page Name | Route | Component | Function |
|-----------|-----------|-------|-----------|----------|
| **LAND_01** | Marketing Landing Page | `/` | `LandingPage.tsx` | Primary marketing entry point |
| **META_01** | Meta Forensic Architecture | `/meta-architecture` | `MetadataArchitecturePage.tsx` | WHO AM I structurally? System doctrine & canon stack |
| **META_02** | Meta Registry (God View) | `/meta-registry` | `MetadataGodView.tsx` | WHERE AM I? Global search & metadata hunting |
| **META_03** | Meta Fact Sheet | `/meta-registry/:id` | `MetadataDetailPage.tsx` | WHAT AM I? Single-item forensic profile |
| **META_04** | Meta Risk Radar | `/meta-risk` | `MetaRiskRadarPage.tsx` | HOW AM I DOING? Stay out of jail view |
| **META_05** | Meta Canon Matrix | `/meta-canon` | `MetaCanonMatrixPage.tsx` | WHO AM I in hierarchy? Group/Transaction/Cell governance |
| **META_06** | Meta Health Scan | `/meta-health` | `MetaHealthScanPage.tsx` | BYOS telemetry & health scores |
| **META_07** | Meta Lynx Codex | `/meta-lynx` | `MetaLynxCodexPage.tsx` | WHO helps me? AI investigator & explainer |
| **META_08** | Meta Implementation Playbook | `/meta-playbook` | `MetaImplementationPage.tsx` | HOW do I start? From SME to governed enterprise |
| **SYS_01** | System Bootloader | `/sys-bootloader` | `SysBootloaderPage.tsx` | ONBOARDING: System initialization & health check |
| **SYS_02** | Organization Matrix | `/sys-organization` | `SysOrganizationPage.tsx` | CONFIG: Global entity variables (Currency, Time) |
| **SYS_03** | Access Control | `/sys-access` | `SysAccessPage.tsx` | USERS: RBAC, Invites, Team management |
| **SYS_04** | Personal Visor | `/sys-profile` | `SysProfilePage.tsx` | USER: Personal settings & API keys |

---

## THE 8-PAGE STORY SPINE

After the landing page, every page answers either:
- **WHO AM I?** – identity, canon, purpose
- **HOW AM I DOING?** – health, risk, misclassification, telemetry

### Page Flow:
1. **SYS_01** - System Bootloader (INITIALIZE: The entry point for new tenants)
2. **META_01** - Meta Forensic Architecture (WHO AM I structurally?)
2. **META_02** - Meta Registry (WHERE AM I? Search all metadata)
3. **META_03** - Meta Fact Sheet (WHAT AM I exactly? Full forensic sheet)
4. **META_04** - Meta Risk Radar (HOW AM I DOING legally & financially?)
5. **META_05** - Meta Canon Matrix (WHO AM I in canon hierarchy?)
6. **META_06** - Meta Health Scan (1-click health check for BYOS)
7. **META_07** - Meta Lynx Codex (WHO helps me? AI explainer)
8. **META_08** - Meta Implementation Playbook (HOW to implement without pain)

---

## NAMING CONVENTION

### Format: `[DOMAIN]_[NUMBER]`

**DOMAIN Codes:**
- `LAND` - Landing pages (marketing, onboarding)
- `SYS` - System configuration, onboarding, and user management
- `META` - Metadata management & governance pages
- `LINE` - Lineage visualization pages (future)
- `AUDIT` - Audit trail pages (future)
- `GOV` - Governance workflow pages (future)
- `ADMIN` - System administration pages (future)

**NUMBER:**
- Two-digit sequential number starting from `01`
- Increment within domain

---

## USAGE GUIDELINES

### 1. **Display Page Code on Every Page**
```tsx
<header className="flex justify-between items-center">
  <h1>Page Title</h1>
  <span className="text-[#666] font-mono text-sm">CODE: META_01</span>
</header>
```

### 2. **Reference in Navigation**
```tsx
<button onClick={() => navigate('/meta-registry')}>
  <span>Hunt for Metadata</span>
  <span className="text-xs opacity-75">(META_02)</span>
</button>
```

### 3. **Document in Comments**
```tsx
// ============================================================================
// META_01 - META FORENSIC ARCHITECTURE
// WHO AM I structurally? System doctrine & canon stack
// ============================================================================
```

### 4. **Include in Audit Logs**
```json
{
  "user_id": "user_123",
  "action": "VIEW_PAGE",
  "page_code": "META_03",
  "page_path": "/meta-registry/DS-8821",
  "timestamp": "2024-12-08T10:30:00Z"
}
```

---

## BENEFITS

### 1. **Audit Trail**
Every user action can reference a specific page code for forensic analysis.

### 2. **Documentation**
Clear reference system for user guides and training materials.

### 3. **Developer Handoff**
New developers can quickly locate page components using code.

### 4. **Cross-Reference**
Easy to reference pages in tickets, logs, and discussions.

### 5. **Version Control**
Page codes remain stable even if routes or component names change.

---

## IMPLEMENTATION CHECKLIST

When creating a new page:

- [ ] Assign next available page code in appropriate domain
- [ ] Add entry to this registry document
- [ ] Display page code in top-right header
- [ ] Document in component file header comment
- [ ] Update navigation tooltips/labels
- [ ] Add route to `/App.tsx` with code comment
- [ ] Update `PAGE_CODING_STANDARD.md`
- [ ] Update `MetaSideNav.tsx` if META page

---

Last Updated: 2024-12-08  
Maintained By: Data Governance Team
