import type { Meta, StoryObj } from '@storybook/react'
import { StatusDot } from './StatusDot'

/**
 * 🛡️ THE CONTROL PLANE - Status Dot Governance
 * 
 * This Storybook story acts as the "Contract" for the StatusDot component.
 * 
 * Governance Workflow:
 * 1. Developer creates/updates StatusDot.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match the design spec?"
 * 4. Only then is it merged into the App
 * 
 * This prevents "hardcoded green dot" drift by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof StatusDot> = {
  title: 'Atoms/StatusDot', // Organized hierarchy: Atoms → Molecules → Organisms
  component: StatusDot,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**StatusDot Component - Status Indicator Enforcement**

The StatusDot component prevents "hardcoded green dot" drift by enforcing
the status system. Developers CANNOT use arbitrary colors like \`bg-emerald-500\`.

**Governance Rules:**
- ✅ Only 4 variants allowed: success, warning, error, neutral
- ✅ Only 3 sizes allowed: sm, md, lg
- ✅ Uses governed colors (status-success/warning/error/neutral)
- ✅ Semantic meaning (variant defines intent)
- ✅ Accessible (aria-label for screen readers)

**Replaces hardcoded dots:**
- ❌ \`<span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />\`
- ✅ \`<StatusDot variant="success" size="md" />\`

**Changing tokens in globals.css updates ALL dots automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'neutral'],
      description: 'Status variant - defines intent (good, caution, problem, info)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Dot size - defines visual prominence',
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusDot>

/**
 * 🧪 TEST CASE 1: All Status Variants
 * 
 * All four status variants as dots.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <StatusDot variant="success" />
        <span>Success</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot variant="warning" />
        <span>Warning</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot variant="error" />
        <span>Error</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot variant="neutral" />
        <span>Neutral</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All status variants as indicator dots.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 2: Size Variants
 * 
 * All three size variants for different use cases.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <StatusDot variant="success" size="sm" />
        <span>Small</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot variant="success" size="md" />
        <span>Medium</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot variant="success" size="lg" />
        <span>Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All size variants: sm (compact), md (default), lg (prominent).',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 3: Real-World Usage
 * 
 * How StatusDot replaces hardcoded dots in actual UI.
 */
export const RealWorldUsage: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold">System Status</span>
        <StatusDot variant="success" size="md" />
        <span>Operational</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Active Nodes</span>
        <StatusDot variant="neutral" size="md" />
        <span>24/24</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Uptime</span>
        <StatusDot variant="success" size="md" />
        <span>99.9%</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">Alert</span>
        <StatusDot variant="warning" size="md" />
        <span>Attention Required</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage example - how StatusDot replaces hardcoded status dots.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 4: Before/After Comparison
 * 
 * Shows the drift elimination - before (hardcoded) vs after (governed).
 */
export const BeforeAfter: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-semibold text-red-600">❌ Before (Drift)</h3>
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded border border-red-200">
          <span>Status:</span>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <code className="text-xs bg-white px-2 py-1 rounded">
            bg-emerald-500 (hardcoded)
          </code>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-green-600">✅ After (Governed)</h3>
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded border border-green-200">
          <span>Status:</span>
          <StatusDot variant="success" size="md" />
          <code className="text-xs bg-white px-2 py-1 rounded">
            StatusDot variant="success" (token-based)
          </code>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Before/After comparison showing drift elimination.',
      },
    },
  },
}
