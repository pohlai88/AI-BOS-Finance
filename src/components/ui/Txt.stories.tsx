import type { Meta, StoryObj } from '@storybook/react'
import { Txt } from './Txt'

/**
 * 🛡️ THE CONTROL PLANE - Typography Governance
 *
 * This Storybook story acts as the "Contract" for the Txt component.
 *
 * Governance Workflow:
 * 1. Developer creates/updates Txt.tsx
 * 2. Developer opens Storybook
 * 3. Developer verifies: "Does this match the design spec?"
 * 4. Only then is it merged into the App
 *
 * This prevents "50 Shades of Grey" by forcing visual verification
 * before code enters production.
 */

const meta: Meta<typeof Txt> = {
  title: 'Atoms/Txt', // Organized hierarchy: Atoms → Molecules → Organisms
  component: Txt,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Txt Component - Typography Enforcement Layer**

The Txt component is the "Martial Law" for typography. It ENFORCES the typography system
by preventing developers from using arbitrary text classes like \`text-slate-500\`.

**Governance Rules:**
- ✅ Only 7 variants allowed: h1, h2, h3, h4, body, subtle, small
- ✅ Uses governed colors (text-text-primary/secondary/tertiary)
- ✅ No arbitrary font sizes allowed
- ✅ Semantic HTML by default (h1 renders as <h1>, body renders as <p>)

**Changing tokens in globals.css updates ALL text automatically.**
        `,
      },
    },
  },
  tags: ['autodocs'], // Generates documentation automatically
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'body', 'subtle', 'small'],
      description:
        'Text variant - defines semantic meaning and visual hierarchy',
    },
    as: {
      control: false,
      description:
        'Semantic HTML element override (e.g., render h1 visually but use h2 tag)',
    },
    children: {
      control: 'text',
      description: 'Text content',
    },
  },
}

export default meta
type Story = StoryObj<typeof Txt>

/**
 * 🧪 TEST CASE 1: Heading Hierarchy
 *
 * Verify all heading variants render correctly.
 * This is the "Visual Audit" - see all text styles in one place.
 */
export const Headings: Story = {
  render: () => (
    <div className="space-y-4">
      <Txt variant="h1">Heading 1 (Main Title)</Txt>
      <Txt variant="h2">Heading 2 (Section Title)</Txt>
      <Txt variant="h3">Heading 3 (Card Title)</Txt>
      <Txt variant="h4">Heading 4 (Subsection Title)</Txt>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All heading variants for visual hierarchy verification.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 2: Body Text
 *
 * Standard body text with proper contrast and line height.
 */
export const BodyText: Story = {
  args: {
    variant: 'body',
    children:
      'The quick brown fox jumps over the lazy dog. Standard body text should be readable, high contrast but not harsh black, and have comfortable line height. This is the default variant.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard body text variant with proper contrast and line height.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 3: Subtle Context
 *
 * Subtle text for captions, metadata, and less important information.
 */
export const SubtleContext: Story = {
  args: {
    variant: 'subtle',
    children: 'Last updated: 2 hours ago • 1,234 views',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Subtle text variant for captions, metadata, and less important information.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 4: Small Labels
 *
 * Small text for labels, fine print, and compact UI elements.
 */
export const SmallLabels: Story = {
  args: {
    variant: 'small',
    children: 'Required field',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Small text variant for labels, fine print, and compact UI elements.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 5: Semantic Override
 *
 * Verify the `as` prop works for SEO (visual h1, semantic h2).
 */
export const SemanticOverride: Story = {
  render: () => (
    <div className="space-y-4">
      <Txt variant="h1" as="h2">
        This looks like H1 but renders as H2 tag (for SEO)
      </Txt>
      <Txt variant="body" as="div">
        This looks like body text but renders as div (for layout)
      </Txt>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates semantic HTML override using the `as` prop.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 6: All Variants Comparison
 *
 * Side-by-side comparison of all variants.
 * This is the "Visual Audit" - see all text styles in one place.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <Txt variant="h1">Heading 1</Txt>
        <Txt variant="body" className="mt-2">
          Main page title or hero heading. Largest, boldest text in the system.
        </Txt>
      </div>
      <div>
        <Txt variant="h2">Heading 2</Txt>
        <Txt variant="body" className="mt-2">
          Section titles and major content divisions.
        </Txt>
      </div>
      <div>
        <Txt variant="h3">Heading 3</Txt>
        <Txt variant="body" className="mt-2">
          Card titles and subsection headings.
        </Txt>
      </div>
      <div>
        <Txt variant="h4">Heading 4</Txt>
        <Txt variant="body" className="mt-2">
          Minor subsection headings and nested titles.
        </Txt>
      </div>
      <div>
        <Txt variant="body">
          Standard body text for paragraphs, descriptions, and main content.
          This is the default variant and should be used for most text content.
        </Txt>
      </div>
      <div>
        <Txt variant="subtle">
          Subtle text for captions, metadata, timestamps, and less important
          information.
        </Txt>
      </div>
      <div>
        <Txt variant="small">
          Small text for labels, fine print, and compact UI elements.
        </Txt>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all Txt variants for visual audit.',
      },
    },
  },
}

/**
 * 🧪 TEST CASE 7: Stress Test - Long Content
 *
 * Verify Txt handles long content gracefully.
 * This prevents production bugs from content overflow.
 */
export const LongContent: Story = {
  args: {
    variant: 'body',
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress test with long content to verify proper wrapping and spacing.',
      },
    },
  },
}
