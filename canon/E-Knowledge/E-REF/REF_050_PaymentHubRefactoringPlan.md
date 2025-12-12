# 🎯 Phase 3: Payment Hub Refactoring Plan

**Date:** December 2025  
**Status:** 🟡 **IN PROGRESS**  
**Target:** `src/modules/payment/PAY_01_PaymentHub.tsx` + Components  
**Objective:** Eliminate 154 hardcoded colors → Zero drift

---

## 📊 Drift Analysis

### **Hardcoded Colors Inventory**

| File | Hardcoded Colors Found | Pattern |
|------|------------------------|---------|
| **PAY_01_PaymentHub.tsx** | 31 instances | Hex: `bg-[#050505]`, `bg-[#0A0A0A]`, `bg-[#1F1F1F]`<br>Arbitrary: `text-amber-500`, `text-emerald-500`, `text-gray-500` |
| **TreasuryHeader.tsx** | 28 instances | Hex: `bg-[#111]`, `text-[#666]`, `text-[#888]`<br>Status: `bg-emerald-500`, `bg-amber-500`, `bg-red-500` |
| **PaymentTable.tsx** | 4 instances | Status: `bg-red-900/5`, `bg-amber-900/5`<br>Ring: `ring-[#28E7A2]` |
| **ApprovalActions.tsx** | 12 instances | Hex: `bg-[#28E7A2]`, `bg-[#1F1F1F]`<br>Status: `border-red-900/30`, `text-red-500` |
| **FunctionalCard.tsx** | 45 instances | Hex: `bg-[#0A0A0A]`, `border-[#1F1F1F]`<br>Status: `bg-emerald-900/10`, `bg-amber-900/10` |
| **AuditSidebar.tsx** | 34 instances | Hex: `bg-[#0A0A0A]`, `text-[#666]`<br>Status: `bg-amber-900/10`, `bg-red-900/10` |

**Total:** 154 hardcoded colors → **Target: 0**

---

## 🎯 Refactoring Strategy

### **Phase 3A: Token Mapping**

#### **Hex Color → Surface Token Mapping**

| Hardcoded Hex | Token | Usage |
|---------------|-------|-------|
| `bg-[#050505]` | `bg-surface-base` (dark) | Main background |
| `bg-[#0A0A0A]` | `bg-surface-base` (dark) | Header/Footer backgrounds |
| `bg-[#1F1F1F]` | `bg-surface-flat` (dark) | Cards/Panels |
| `bg-[#111]` | `bg-surface-flat` (dark) | Input backgrounds |
| `border-[#1F1F1F]` | `border-border-surface-base` | Borders |
| `border-[#333]` | `border-border-surface-base` | Subtle borders |
| `text-[#666]` | `text-text-tertiary` | Secondary text |
| `text-[#888]` | `text-text-tertiary` | Tertiary text |
| `text-[#555]` | `text-text-tertiary` | Subtle text |

#### **Status Color → Token Mapping**

| Hardcoded Color | Token | Component |
|-----------------|-------|-----------|
| `bg-emerald-500` | `bg-status-success` | StatusDot |
| `text-emerald-500` | `text-status-success` | Status text |
| `bg-amber-500` | `bg-status-warning` | StatusDot |
| `text-amber-500` | `text-status-warning` | Warning text |
| `bg-red-500` | `bg-status-error` | StatusDot |
| `text-red-500` | `text-status-error` | Error text |
| `bg-emerald-900/10` | `bg-status-success/10` | Status backgrounds |
| `bg-amber-900/10` | `bg-status-warning/10` | Warning backgrounds |
| `bg-red-900/10` | `bg-status-error/10` | Error backgrounds |

#### **Brand Color → Token Mapping**

| Hardcoded | Token | Usage |
|-----------|-------|-------|
| `bg-[#28E7A2]` | `bg-action-primary` | Primary buttons |
| `text-[#28E7A2]` | `text-action-primary` | Primary text |
| `hover:bg-[#20b881]` | `hover:bg-action-primary-hover` | Button hover |

---

## 🔧 Component Refactoring Plan

### **1. PAY_01_PaymentHub.tsx (Main Container)**

#### **Current Issues:**
- ❌ `bg-[#050505]` → Should be `bg-surface-base` (dark)
- ❌ `bg-[#0A0A0A]` → Should be `bg-surface-base` (dark)
- ❌ `border-[#1F1F1F]` → Should be `border-border-surface-base`
- ❌ `text-amber-500`, `text-emerald-500` → Should use StatusDot component
- ❌ Fake buttons → Should use `Btn` component

#### **Refactoring Steps:**

1. **Replace Container Backgrounds**
   ```tsx
   // BEFORE
   <div className="h-screen bg-[#050505]">
   
   // AFTER
   <div className="h-screen bg-surface-base">
   ```

2. **Replace Header**
   ```tsx
   // BEFORE
   <header className="h-16 border-b border-[#1F1F1F] bg-[#0A0A0A]">
   
   // AFTER
   <Surface variant="flat" className="h-16 border-b">
   ```

3. **Replace Status Indicators**
   ```tsx
   // BEFORE
   <Clock className="w-4 h-4 text-amber-500" />
   
   // AFTER
   <StatusDot variant="warning" size="sm" />
   ```

4. **Replace Buttons**
   ```tsx
   // BEFORE
   <button className="bg-[#28E7A2] text-black">
   
   // AFTER
   <Btn variant="primary">New Payment</Btn>
   ```

---

### **2. TreasuryHeader.tsx**

#### **Current Issues:**
- ❌ `bg-[#111]`, `bg-[#0A0A0A]` → Should use `Surface` component
- ❌ `bg-emerald-500`, `bg-amber-500`, `bg-red-500` → Should use `StatusDot`
- ❌ `text-[#666]`, `text-[#888]` → Should use `Txt` component
- ❌ Fake buttons → Should use `Btn` component

#### **Refactoring Steps:**

1. **Replace Entity Selector**
   ```tsx
   // BEFORE
   <button className="bg-[#111] border border-[#1F1F1F]">
     <span className="bg-emerald-500" />
   
   // AFTER
   <Surface variant="flat" className="border">
     <StatusDot variant="success" size="sm" />
   ```

2. **Replace Metric Cards**
   ```tsx
   // BEFORE
   <div className="bg-emerald-900/20 text-emerald-400">
   
   // AFTER
   <Surface variant="base">
     <StatusDot variant="success" />
     <Txt variant="body">{value}</Txt>
   ```

---

### **3. PaymentTable.tsx**

#### **Current Issues:**
- ❌ `bg-red-900/5`, `bg-amber-900/5` → Should use status tokens
- ❌ `ring-[#28E7A2]` → Should use `ring-action-primary`

#### **Refactoring Steps:**

1. **Replace Row Styling**
   ```tsx
   // BEFORE
   if (payment.tx_type === 'intercompany' && payment.elimination_status === 'unmatched') {
     classes.push('bg-red-900/5');
   }
   
   // AFTER
   if (payment.tx_type === 'intercompany' && payment.elimination_status === 'unmatched') {
     classes.push('bg-status-error/5');
   }
   ```

2. **Replace Selection Ring**
   ```tsx
   // BEFORE
   rowClassName={(row) => row.id === selectedId && 'ring-1 ring-[#28E7A2]'}
   
   // AFTER
   rowClassName={(row) => row.id === selectedId && 'ring-1 ring-action-primary'}
   ```

---

### **4. ApprovalActions.tsx**

#### **Current Issues:**
- ❌ `bg-[#28E7A2]` → Should use `Btn` component
- ❌ `border-red-900/30`, `text-red-500` → Should use status tokens
- ❌ Fake buttons → Should use `Btn` component

#### **Refactoring Steps:**

1. **Replace Approve Button**
   ```tsx
   // BEFORE
   <button className="bg-[#28E7A2] text-black">
     Approve
   </button>
   
   // AFTER
   <Btn variant="primary" disabled={!canApprove}>
     Approve
   </Btn>
   ```

2. **Replace Reject Button**
   ```tsx
   // BEFORE
   <button className="border-red-900/30 text-red-500">
     Reject
   </button>
   
   // AFTER
   <Btn variant="secondary" className="border-status-error/30 text-status-error">
     Reject
   </Btn>
   ```

---

### **5. FunctionalCard.tsx**

#### **Current Issues:**
- ❌ `bg-[#0A0A0A]`, `border-[#1F1F1F]` → Should use `Surface` component
- ❌ `bg-emerald-900/10`, `bg-amber-900/10` → Should use status tokens
- ❌ `text-[#28E7A2]` → Should use `text-action-primary`
- ❌ Fake buttons → Should use `Btn` component

#### **Refactoring Steps:**

1. **Replace Card Container**
   ```tsx
   // BEFORE
   <div className="bg-[#0A0A0A] border border-[#1F1F1F]">
   
   // AFTER
   <Surface variant="base" className="border">
   ```

2. **Replace Status Sections**
   ```tsx
   // BEFORE
   <div className="bg-emerald-900/10 border-emerald-800/30">
   
   // AFTER
   <Surface variant="base" className="bg-status-success/10 border-status-success/30">
     <StatusDot variant="success" />
   ```

3. **Replace Action Buttons**
   ```tsx
   // BEFORE
   <button className="bg-[#28E7A2] text-black">
     Approve Batch
   </button>
   
   // AFTER
   <Btn variant="primary" className="w-full">
     Approve Batch
   </Btn>
   ```

---

### **6. AuditSidebar.tsx**

#### **Current Issues:**
- ❌ `bg-[#0A0A0A]`, `bg-[#050505]` → Should use `Surface` component
- ❌ `text-[#666]`, `text-[#888]` → Should use `Txt` component
- ❌ `bg-amber-900/10`, `bg-red-900/10` → Should use status tokens
- ❌ Fake buttons → Should use `Btn` component

#### **Refactoring Steps:**

1. **Replace Container**
   ```tsx
   // BEFORE
   <div className="bg-[#0A0A0A]">
   
   // AFTER
   <Surface variant="base" className="h-full flex flex-col">
   ```

2. **Replace Warning Sections**
   ```tsx
   // BEFORE
   <div className="bg-amber-900/10 border-amber-900/30">
   
   // AFTER
   <Surface variant="base" className="bg-status-warning/10 border-status-warning/30">
     <StatusDot variant="warning" />
     <Txt variant="body">{message}</Txt>
   ```

3. **Replace Action Buttons**
   ```tsx
   // BEFORE
   <button className="bg-[#28E7A2] text-black">
     Approve
   </button>
   
   // AFTER
   <Btn variant="primary" className="w-full">
     Approve
   </Btn>
   ```

---

## 📋 Refactoring Checklist

### **Phase 3A: Token Mapping**
- [ ] Map all hex colors to surface tokens
- [ ] Map all status colors to status tokens
- [ ] Map brand colors to action tokens
- [ ] Document token mappings

### **Phase 3B: Component Replacement**
- [ ] Replace containers with `Surface` component
- [ ] Replace text with `Txt` component
- [ ] Replace buttons with `Btn` component
- [ ] Replace status indicators with `StatusDot` component
- [ ] Replace inputs with `Input` component (if any)

### **Phase 3C: Verification**
- [ ] Verify zero hardcoded colors (grep check)
- [ ] Verify visual consistency (Storybook)
- [ ] Verify form symmetry (Input + Btn alignment)
- [ ] Verify dark mode compatibility
- [ ] Run lint checks

---

## 🎯 Expected Results

### **Before Refactoring:**
- **Lines:** ~450 lines (PAY_01_PaymentHub.tsx)
- **Hardcoded Colors:** 154 instances
- **Components:** 0 atomic components used
- **Drift Risk:** High

### **After Refactoring:**
- **Lines:** ~250 lines (estimated 44% reduction)
- **Hardcoded Colors:** 0 instances
- **Components:** 5 atomic components integrated
- **Drift Risk:** Zero

---

## 🚀 Implementation Order

1. **Start with Leaf Components** (Easiest wins)
   - ApprovalActions.tsx (buttons → Btn)
   - PaymentTable.tsx (status colors → tokens)

2. **Then Card Components** (Medium complexity)
   - FunctionalCard.tsx (Surface + StatusDot)
   - TreasuryHeader.tsx (Surface + Txt + StatusDot)

3. **Finally Main Container** (Most complex)
   - AuditSidebar.tsx (Full refactor)
   - PAY_01_PaymentHub.tsx (Orchestration)

---

## ✅ Success Criteria

- ✅ Zero hardcoded colors (grep verification)
- ✅ All containers use `Surface` component
- ✅ All text uses `Txt` component
- ✅ All buttons use `Btn` component
- ✅ All status indicators use `StatusDot` component
- ✅ Visual consistency maintained
- ✅ Dark mode works correctly
- ✅ No TypeScript errors
- ✅ No lint errors

---

**Ready to begin refactoring?**  
**Starting with ApprovalActions.tsx (easiest win - buttons → Btn component)**
