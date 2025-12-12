import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'
import { Btn } from './Btn'

/**
 * 🛡️ THE CONTROL PLANE - Input Governance
 *
 * This Storybook story acts as the "Contract" for the Input component.
 *
 * Governance Workflow:
 * 1. Developer creates/updates Input.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match Button height/border-radius?"
 * 4. Only then is it merged into the App
 *
 * This prevents "Form Symmetry" drift by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input', // Organized hierarchy: Atoms → Molecules → Organisms
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Input Component - Data Entry Enforcement Layer**

The Input component ENFORCES form symmetry with Button. It prevents developers
from creating inputs that don't align with buttons when placed side-by-side.

**Governance Rules:**
- ✅ Height MUST match Button exactly (h-10 for md)
- ✅ Border-radius MUST match Button exactly (rounded-action)
- ✅ Focus ring MUST match Button exactly (ring-action-primary)
- ✅ Padding MUST match Button exactly (px-4 for md)
- ✅ Only 3 sizes allowed: sm, md, lg (matches Button)
- ✅ Uses governed tokens (input-border, input-bg, input-text)
- ✅ Error state uses token (border-status-error)

**Form Symmetry Test:**
Input + Button side-by-side MUST align perfectly (same height, same border-radius).

**Changing tokens in globals.css updates ALL inputs automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size - MUST match Button size for form symmetry',
    },
    error: {
      control: 'boolean',
      description: 'Error state - shows error styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state - prevents interaction',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

// 🧪 TEST CASE 1: Basic Input
export const Basic: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

// 🧪 TEST CASE 2: All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
}

// 🧪 TEST CASE 3: Form Symmetry (CRITICAL TEST)
// This is the most important test - Input + Button MUST align perfectly
export const FormSymmetry: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">
          ✅ Form Symmetry Test (Medium Size)
        </h3>
        <div className="flex gap-2">
          <Input size="md" placeholder="Search..." className="flex-1" />
          <Btn variant="primary" size="md">
            Search
          </Btn>
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          Input and Button MUST have same height (h-10) and border-radius
          (rounded-action)
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">
          ✅ Form Symmetry Test (Small Size)
        </h3>
        <div className="flex gap-2">
          <Input size="sm" placeholder="Search..." className="flex-1" />
          <Btn variant="primary" size="sm">
            Search
          </Btn>
        </div>
        <p className="mt-2 text-xs text-text-tertiary">Both MUST be h-8</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">
          ✅ Form Symmetry Test (Large Size)
        </h3>
        <div className="flex gap-2">
          <Input size="lg" placeholder="Search..." className="flex-1" />
          <Btn variant="primary" size="lg">
            Search
          </Btn>
        </div>
        <p className="mt-2 text-xs text-text-tertiary">Both MUST be h-12</p>
      </div>
    </div>
  ),
}

// 🧪 TEST CASE 4: Error State
export const ErrorState: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Input error placeholder="Invalid email" />
      <Input error value="user@example" />
      <p className="text-xs text-text-tertiary">
        Error state uses border-status-error token
      </p>
    </div>
  ),
}

// 🧪 TEST CASE 5: Disabled State
export const DisabledState: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Input disabled placeholder="Disabled input" />
      <Input disabled value="Cannot edit" />
    </div>
  ),
}

// 🧪 TEST CASE 6: Real-World Forms
export const RealWorldForms: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      {/* Login Form */}
      <div className="border-border-surface-base space-y-4 rounded-surface border bg-surface-base p-6">
        <h3 className="text-lg font-semibold text-text-primary">Login Form</h3>
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />
        <Btn variant="primary" className="w-full">
          Sign In
        </Btn>
      </div>

      {/* Search Bar */}
      <div className="border-border-surface-base space-y-4 rounded-surface border bg-surface-base p-6">
        <h3 className="text-lg font-semibold text-text-primary">Search Bar</h3>
        <div className="flex gap-2">
          <Input placeholder="Search products..." className="flex-1" />
          <Btn variant="primary">Search</Btn>
        </div>
      </div>

      {/* Settings Form */}
      <div className="border-border-surface-base space-y-4 rounded-surface border bg-surface-base p-6">
        <h3 className="text-lg font-semibold text-text-primary">Settings</h3>
        <Input placeholder="Display Name" />
        <Input placeholder="Email" type="email" />
        <div className="flex gap-2">
          <Btn variant="secondary">Cancel</Btn>
          <Btn variant="primary">Save</Btn>
        </div>
      </div>
    </div>
  ),
}

// 🧪 TEST CASE 7: Before/After Comparison
export const BeforeAfter: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h3 className="mb-2 font-semibold text-red-600">❌ Before (Drift)</h3>
        <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-4">
          <input
            className="h-9 rounded-md border border-gray-300 px-3"
            placeholder="Search..."
          />
          <button className="h-10 rounded-md bg-green-500 px-4 text-white">
            Search
          </button>
        </div>
        <code className="mt-2 block rounded bg-white px-2 py-1 text-xs">
          Input: h-9, Button: h-10 → MISALIGNED (Form Symmetry Broken)
        </code>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-green-600">
          ✅ After (Governed)
        </h3>
        <div className="flex gap-2 rounded border border-green-200 bg-green-50 p-4">
          <Input size="md" placeholder="Search..." className="flex-1" />
          <Btn variant="primary" size="md">
            Search
          </Btn>
        </div>
        <code className="mt-2 block rounded bg-white px-2 py-1 text-xs">
          Input: h-10, Button: h-10 → PERFECT ALIGNMENT (Form Symmetry Enforced)
        </code>
      </div>
    </div>
  ),
}

// 🧪 TEST CASE 8: All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Input placeholder="Default input" />
      <Input error placeholder="Error input" />
      <Input disabled placeholder="Disabled input" />
      <Input size="sm" placeholder="Small input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
}
