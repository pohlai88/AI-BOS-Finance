# 🎨 Exception Colors Fix - Automated Solution

## Problem
Exception cards use harsh orange/red/yellow colors that clash with the professional design:
- `bg-orange-50 border-orange-200` → Too bright, unprofessional
- `text-red-600 bg-red-50` → Screaming, alarming
- `text-yellow-600 bg-yellow-50` → Too vibrant

## Solution: One-Command Fix

I've already fixed the colors manually, but here's the automated tool for future use:

```bash
pnpm fix:exception-colors
```

This script:
1. ✅ Finds all harsh exception colors (orange-*, red-*, yellow-*)
2. ✅ Replaces with muted design system colors
3. ✅ Reports what was changed

## What Changed

### Before (Harsh)
```tsx
color: 'text-orange-600 bg-orange-50 border-orange-200'
```

### After (Muted & Professional)
```tsx
color: 'text-status-warning/90 bg-status-warning/10 border-status-warning/20'
```

## Color Mapping

| Old (Harsh) | New (Muted) | Use Case |
|------------|-------------|----------|
| `orange-*` | `status-warning/10` | Warnings, duplicates |
| `red-*` | `status-danger/10` | Critical, blocked |
| `yellow-*` | `status-warning/10` | Info warnings |

## Files Already Fixed

✅ `ExceptionBadge.tsx` - All exception types
✅ `BioExceptionDashboard.tsx` - Severity config
✅ `RiskQueueDashboard.tsx` - Active card colors
✅ `ExpandablePaymentRow.tsx` - Exception badges

## Using Figma MCP (Future)

When Figma MCP is configured, you can extract colors directly:

```bash
# Extract exception colors from Figma
figma-mcp get-variable-defs --file w0bI6UKGtkTUwzhMGMhs93 --node 0:1

# Then sync to design system
pnpm figma:sync
```

The script `TOOL_27_FixExceptionColors.ts` can be extended to:
1. Query Figma MCP for exception color tokens
2. Extract HSL values
3. Update `globals.css` with new tokens
4. Run the color replacement automatically

## Result

Exception cards now use **muted, professional colors** that:
- ✅ Don't clash with the overall theme
- ✅ Maintain visual hierarchy
- ✅ Feel premium, not alarming
- ✅ Follow design system tokens

---

**Status:** ✅ **FIXED** - All exception colors updated to muted design system colors.
