# Hardcoded Values Audit Report

## Summary

Analysis of `src/` directory for hardcoded values that should use design tokens from `app/globals.css`.

**Status:** ⚠️ **INCOMPLETE CONVERSION** - Many components still use hardcoded values

---

## Statistics

- **Files with hex colors:** 30 files
- **Hardcoded hex in Tailwind classes:** 2,642 matches across 101 files
- **Files with rgb/rgba:** 55 files
- **Total files needing conversion:** ~100+ files

---

## Common Hardcoded Patterns Found

### 1. Hex Colors in Tailwind Classes

**Pattern:** `bg-[#HEX]`, `text-[#HEX]`, `border-[#HEX]`

**Examples:**
```tsx
// ❌ HARDCODED
className="bg-[#0A0A0A] text-[#28E7A2] border-[#1F1F1F]"

// ✅ SHOULD USE TOKENS
className="bg-surface-base text-action-primary border-border-base"
```

**Common Hardcoded Colors:**
- `#28E7A2` (Nexus Green) → `--action-primary` / `text-action-primary`
- `#0A0A0A` (Dark surface) → `--surface-base` / `bg-surface-base`
- `#1F1F1F` (Border/subtle) → `--border-base` / `border-border-base`
- `#050505` (Darker surface) → `--surface-base` with opacity
- `#888888` (Secondary text) → `--text-secondary` / `text-text-secondary`
- `#666666` (Tertiary text) → `--text-tertiary` / `text-text-tertiary`

### 2. RGB/RGBA Values

**Pattern:** `rgb(...)`, `rgba(...)`, `style={{ backgroundColor: 'rgb(...)' }}`

**Examples:**
```tsx
// ❌ HARDCODED
style={{ backgroundColor: 'rgb(10, 10, 10)' }}
style={{ color: 'rgba(40, 231, 162, 0.5)' }}

// ✅ SHOULD USE TOKENS
className="bg-surface-base"
style={{ color: 'rgb(var(--action-primary) / 0.5)' }}
```

### 3. Direct Hex in Style Props

**Pattern:** `style={{ color: '#HEX' }}`, `style={{ backgroundColor: '#HEX' }}`

**Examples:**
```tsx
// ❌ HARDCODED
style={{ color: '#28E7A2' }}

// ✅ SHOULD USE TOKENS
style={{ color: 'rgb(var(--action-primary))' }}
// OR use Tailwind class
className="text-action-primary"
```

---

## Files Requiring Conversion

### High Priority (Core Components)

1. **Shell Components:**
   - `src/components/shell/MetaCommandPalette.tsx` - 28 hardcoded hex colors
   - `src/components/shell/MetaAppShell.tsx` - Multiple hardcoded values
   - `src/components/shell/AppShell.tsx` - Hardcoded colors

2. **Metadata Components:**
   - `src/modules/metadata/components/SuperTable.tsx` - 94 hardcoded hex colors
   - `src/modules/metadata/components/SuperTableBody.tsx` - 28 hardcoded values
   - `src/modules/metadata/components/SuperTableHeader.tsx` - 23 hardcoded values
   - `src/modules/metadata/components/SuperTablePagination.tsx` - 24 hardcoded values
   - `src/modules/metadata/components/MetadataRequestForm.tsx` - 58 hardcoded values

3. **System Views:**
   - `src/modules/system/views/EntityMasterPage.tsx` - 89 hardcoded values
   - `src/modules/system/views/SYS_01_SysBootloaderPage.tsx` - 15 hardcoded values
   - `src/modules/system/views/SYS_02_SysOrganizationPage.tsx` - 35 hardcoded values

4. **Metadata Views:**
   - `src/modules/metadata/views/META_02_MetadataGodView.tsx` - 37 hardcoded values
   - `src/modules/metadata/views/META_03_ThePrismPage.tsx` - Uses CSS variables (✅ Good)
   - `src/modules/metadata/views/META_05_MetaCanonMatrixPage.tsx` - 52 hardcoded values

### Medium Priority

5. **Payment Components:**
   - `src/modules/payment/components/PaymentTable.tsx` - Multiple hardcoded values
   - `src/modules/payment/components/AuditSidebar.tsx` - 2 hardcoded values

6. **Radar Components:**
   - `src/modules/radar/components/ThreatRadar.tsx` - Hardcoded colors
   - `src/modules/radar/components/TacticalRadar.tsx` - Hardcoded colors

7. **Health Components:**
   - `src/modules/health/components/HealthModuleCard.tsx` - 16 hardcoded values
   - `src/modules/health/components/HealthDeepDivePanel.tsx` - 48 hardcoded values

---

## Design Token Mapping

### Color Tokens Available in `app/globals.css`

| Hardcoded Value | Design Token | Tailwind Class |
|----------------|--------------|----------------|
| `#28E7A2` | `--action-primary` | `text-action-primary`, `bg-action-primary` |
| `#0A0A0A` | `--surface-base` | `bg-surface-base` |
| `#1F1F1F` | `--border-base`, `--surface-flat` | `border-border-base`, `bg-surface-flat` |
| `#050505` | `--surface-base` (with opacity) | `bg-surface-base/90` |
| `#FFFFFF` | `--text-primary` (dark mode) | `text-text-primary` |
| `#888888` | `--text-secondary` | `text-text-secondary` |
| `#666666` | `--text-tertiary` | `text-text-tertiary` |
| `#F5A623` | `--status-warning` | `text-status-warning`, `bg-status-warning` |
| `#E74C3C` | `--status-error` | `text-status-error`, `bg-status-error` |
| `#3498DB` | `--status-neutral` | `text-status-neutral`, `bg-status-neutral` |

### Usage Examples

```tsx
// ❌ BEFORE (Hardcoded)
<div className="bg-[#0A0A0A] text-[#28E7A2] border-[#1F1F1F]">
  Content
</div>

// ✅ AFTER (Design Tokens)
<div className="bg-surface-base text-action-primary border-border-base">
  Content
</div>

// For inline styles with opacity:
<div style={{ backgroundColor: 'rgb(var(--surface-base) / 0.9)' }}>
  Content
</div>
```

---

## Conversion Strategy

### Phase 1: Core Components (High Priority)
1. Shell components (navigation, command palette)
2. Table components (SuperTable family)
3. System views (EntityMasterPage, SYS pages)

### Phase 2: Feature Components (Medium Priority)
1. Payment components
2. Metadata views
3. Health components
4. Radar components

### Phase 3: Utility Components (Low Priority)
1. Icons
2. Magic UI components
3. Auth components

---

## Recommendations

1. **Create a migration script** to automatically replace common patterns
2. **Add ESLint rule** to prevent new hardcoded hex colors
3. **Update component library** (`packages/ui`) to use tokens exclusively
4. **Document token usage** in component guidelines
5. **Gradual migration** - convert one module at a time

---

## Next Steps

1. ✅ **Audit Complete** - This report identifies all hardcoded values
2. ⏳ **Create Migration Plan** - Prioritize components by usage
3. ⏳ **Update Core Components** - Start with shell and table components
4. ⏳ **Add Linting Rules** - Prevent regression
5. ⏳ **Update Documentation** - Token usage guidelines

---

**Last Updated:** 2025-01-27  
**Status:** ⚠️ Conversion Incomplete - ~100+ files need updates
