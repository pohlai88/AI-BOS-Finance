/**
 * BioSkin Knowledge Contract
 * 
 * This file defines what "NORMAL" looks like in BioSkin.
 * Anything that deviates from this is an ABNORMALITY.
 * 
 * The MCP uses this contract to:
 * 1. Validate component structure
 * 2. Check naming conventions
 * 3. Verify required patterns
 * 4. Detect anti-patterns
 */

// ============================================================
// COMPONENT STRUCTURE RULES
// ============================================================

export const COMPONENT_STRUCTURE_RULES = {
  /**
   * Atoms - The smallest building blocks
   * NORMAL: Single responsibility, no business logic, pure presentation
   */
  atoms: {
    allowedImports: [
      'react',
      'clsx',
      'class-variance-authority',
      '@/lib/utils',
      '../utils',
      './types',
    ],
    forbiddenImports: [
      'axios',
      'fetch',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form', // Atoms should NOT know about forms
    ],
    requiredExports: ['default'], // Must have default export
    maxLines: 150, // Atoms should be small
    maxProps: 10, // Too many props = not atomic
    mustHave: {
      displayName: true, // For React DevTools
      types: true, // TypeScript types required
    },
    patterns: {
      // Must use forwardRef for DOM elements
      forwardRef: 'recommended',
      // Must use cn() for class merging
      cnUtility: 'required',
    },
  },

  /**
   * Molecules - Combinations of atoms
   * NORMAL: Composition of atoms, minimal state, no API calls
   */
  molecules: {
    allowedImports: [
      'react',
      'clsx',
      'class-variance-authority',
      '../atoms',
      '../atoms/*',
      '@/lib/utils',
      'framer-motion',
      'motion/react',
    ],
    forbiddenImports: [
      'axios',
      '@tanstack/react-query',
    ],
    requiredExports: ['default'],
    maxLines: 300,
    maxProps: 15,
    mustHave: {
      displayName: true,
      types: true,
    },
    patterns: {
      composesAtoms: 'required', // Must use atoms
      cnUtility: 'required',
    },
  },

  /**
   * Organisms - Complex components with business logic
   * NORMAL: Can have state, can use hooks, can compose molecules/atoms
   */
  organisms: {
    allowedImports: [
      'react',
      'clsx',
      'class-variance-authority',
      '../atoms',
      '../atoms/*',
      '../molecules',
      '../molecules/*',
      '@/lib/utils',
      'react-hook-form',
      'zod',
      '@hookform/resolvers/zod',
      'framer-motion',
      'motion/react',
    ],
    forbiddenImports: [
      // Organisms can do more, but still no direct API calls
      // API calls should be in hooks or server actions
    ],
    requiredExports: ['default'],
    maxLines: 800, // Organisms can be larger
    maxProps: 25,
    mustHave: {
      displayName: true,
      types: true,
    },
    patterns: {
      composesLowerLevels: 'required',
      cnUtility: 'required',
    },
  },
} as const;

// ============================================================
// NAMING CONVENTIONS
// ============================================================

export const NAMING_CONVENTIONS = {
  /**
   * File naming
   * NORMAL: PascalCase for components, camelCase for utilities
   */
  files: {
    components: /^[A-Z][a-zA-Z0-9]*\.tsx$/, // Button.tsx, BioForm.tsx
    utilities: /^[a-z][a-zA-Z0-9]*\.ts$/, // utils.ts, helpers.ts
    types: /^[a-z][a-zA-Z0-9]*\.types\.ts$/, // button.types.ts
    hooks: /^use[A-Z][a-zA-Z0-9]*\.ts$/, // useBioForm.ts
    tests: /^.*\.(test|spec)\.(ts|tsx)$/, // Button.test.tsx
  },

  /**
   * Export naming
   * NORMAL: Component name matches file name
   */
  exports: {
    componentMatchesFile: true,
    propsTypeSuffix: 'Props', // ButtonProps, BioFormProps
    variantsSuffix: 'Variants', // buttonVariants
  },

  /**
   * CSS class naming
   * NORMAL: Uses design tokens, not hardcoded values
   */
  cssClasses: {
    // Surface tokens
    surfaces: ['bg-surface-base', 'bg-surface-subtle', 'bg-surface-card', 'bg-surface-nested', 'bg-surface-hover'],
    // Text tokens
    text: ['text-text-primary', 'text-text-secondary', 'text-text-tertiary', 'text-text-muted', 'text-text-disabled'],
    // Border tokens
    borders: ['border-default', 'border-border-active'],
    // Accent tokens
    accents: ['accent-primary', 'accent-secondary', 'ring-accent-primary'],
    // Status tokens
    status: ['text-status-success', 'text-status-warning', 'text-status-danger', 'text-status-info',
      'bg-status-success', 'bg-status-warning', 'bg-status-danger', 'bg-status-info'],
  },
} as const;

// ============================================================
// REQUIRED PATTERNS
// ============================================================

export const REQUIRED_PATTERNS = {
  /**
   * All interactive components must have
   */
  interactive: {
    accessibilityProps: ['aria-label', 'aria-describedby', 'role'],
    keyboardSupport: ['onKeyDown', 'onKeyUp', 'tabIndex'],
    focusManagement: ['focus:ring', 'focus:outline', 'focus-visible'],
  },

  /**
   * All form components must have
   */
  form: {
    validation: ['error', 'isInvalid', 'errorMessage'],
    states: ['disabled', 'required', 'readOnly'],
    labels: ['label', 'aria-label', 'id'],
  },

  /**
   * All components must have
   */
  universal: {
    className: true, // Accept className prop for customization
    testId: 'recommended', // data-testid for testing
    ref: 'recommended', // forwardRef for DOM access
  },
} as const;

// ============================================================
// ANTI-PATTERNS (ABNORMALITIES)
// ============================================================

export const ANTI_PATTERNS = {
  /**
   * ABNORMALITY: Hardcoded colors
   * Instead of: bg-[#18181B]
   * Use: bg-surface-base
   */
  hardcodedColors: {
    pattern: /#[0-9A-Fa-f]{3,8}/,
    severity: 'warning',
    message: 'Hardcoded color detected. Use design token instead.',
    autoFix: null, // Cannot auto-fix without context
  },

  /**
   * ABNORMALITY: Inline styles
   * Instead of: style={{ color: 'red' }}
   * Use: className="text-status-danger"
   */
  inlineStyles: {
    pattern: /style=\{/,
    severity: 'warning',
    message: 'Inline style detected. Use Tailwind classes instead.',
    exceptions: ['transform', 'animation', 'dynamic values'],
  },

  /**
   * ABNORMALITY: Direct DOM manipulation
   * Instead of: document.getElementById
   * Use: useRef
   */
  directDOM: {
    pattern: /document\.(getElementById|querySelector|getElementsBy)/,
    severity: 'error',
    message: 'Direct DOM manipulation detected. Use React refs instead.',
  },

  /**
   * ABNORMALITY: Magic numbers
   * Instead of: width: 384
   * Use: w-96 or design token
   */
  magicNumbers: {
    pattern: /(?:width|height|margin|padding):\s*\d+(?:px)?/,
    severity: 'info',
    message: 'Magic number detected. Consider using design token.',
  },

  /**
   * ABNORMALITY: Missing 'use client' with hooks
   */
  missingUseClient: {
    pattern: /\b(useState|useEffect|useContext)\b/,
    requiresDirective: "'use client'",
    severity: 'error',
    message: "Uses React hooks but missing 'use client' directive.",
  },

  /**
   * ABNORMALITY: console.log in production code
   */
  consoleLog: {
    pattern: /console\.(log|warn|error)\(/,
    severity: 'warning',
    message: 'Console statement detected. Remove before production.',
    exceptions: ['error boundaries', 'development blocks'],
  },

  /**
   * ABNORMALITY: any type
   */
  anyType: {
    pattern: /:\s*any\b/,
    severity: 'warning',
    message: 'any type detected. Use specific type instead.',
  },

  /**
   * ABNORMALITY: Disabled ESLint rules
   */
  disabledLint: {
    pattern: /eslint-disable/,
    severity: 'info',
    message: 'ESLint rule disabled. Ensure this is intentional.',
  },

  /**
   * ABNORMALITY: TODO/FIXME comments
   */
  todoComments: {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
    severity: 'info',
    message: 'Unresolved TODO/FIXME comment.',
  },
} as const;

// ============================================================
// COMPONENT TEMPLATES (What "NORMAL" looks like)
// ============================================================

export const COMPONENT_TEMPLATES = {
  /**
   * NORMAL Atom template
   */
  atom: `'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const componentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'variant-classes',
      },
      size: {
        default: 'size-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ComponentProps
  extends React.ComponentPropsWithoutRef<'element'>,
    VariantProps<typeof componentVariants> {
  // Additional props
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Component.displayName = 'Component';

export { Component, componentVariants };
export default Component;
`,

  /**
   * NORMAL Molecule template
   */
  molecule: `'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Atom1 } from '../atoms/Atom1';
import { Atom2 } from '../atoms/Atom2';

export interface MoleculeProps {
  className?: string;
  // Composed props
}

export function Molecule({ className, ...props }: MoleculeProps) {
  return (
    <div className={cn('molecule-base-classes', className)}>
      <Atom1 />
      <Atom2 />
    </div>
  );
}

Molecule.displayName = 'Molecule';

export default Molecule;
`,

  /**
   * NORMAL Organism template
   */
  organism: `'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema definition
const schema = z.object({
  // fields
});

type FormData = z.infer<typeof schema>;

export interface OrganismProps {
  className?: string;
  onSubmit?: (data: FormData) => void;
}

export function Organism({ className, onSubmit }: OrganismProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.(data);
  });

  return (
    <form onSubmit={handleSubmit} className={cn('organism-base', className)}>
      {/* Composed molecules and atoms */}
    </form>
  );
}

Organism.displayName = 'Organism';

export default Organism;
`,
} as const;

// ============================================================
// PERFORMANCE RULES
// ============================================================

export const PERFORMANCE_RULES = {
  /**
   * NORMAL: Memoization for expensive components
   */
  memoization: {
    largeListItems: 'React.memo required',
    expensiveCalculations: 'useMemo required',
    callbackProps: 'useCallback required',
  },

  /**
   * NORMAL: Code splitting for organisms
   */
  codeSplitting: {
    largeOrganisms: 'dynamic import recommended',
    conditionalRendering: 'lazy load recommended',
  },

  /**
   * NORMAL: Image optimization
   */
  images: {
    useNextImage: 'required for Next.js',
    provideDimensions: 'required',
    usePlaceholder: 'recommended',
  },
} as const;

// ============================================================
// ACCESSIBILITY RULES
// ============================================================

export const ACCESSIBILITY_RULES = {
  /**
   * NORMAL: All interactive elements
   */
  interactive: {
    buttons: {
      required: ['type', 'aria-label OR visible text'],
      keyboard: 'Enter/Space to activate',
    },
    links: {
      required: ['href', 'aria-label OR visible text'],
      keyboard: 'Enter to activate',
    },
    inputs: {
      required: ['id', 'label OR aria-label', 'type'],
      keyboard: 'Tab to focus',
    },
  },

  /**
   * NORMAL: Color contrast
   */
  colorContrast: {
    normalText: '4.5:1 minimum',
    largeText: '3:1 minimum',
    uiComponents: '3:1 minimum',
  },

  /**
   * NORMAL: Focus indicators
   */
  focusIndicators: {
    visible: 'required',
    style: 'ring-2 ring-accent-primary recommended',
  },
} as const;

// ============================================================
// EXPORT ALL KNOWLEDGE
// ============================================================

export const BIOSKIN_KNOWLEDGE_CONTRACT = {
  componentStructure: COMPONENT_STRUCTURE_RULES,
  namingConventions: NAMING_CONVENTIONS,
  requiredPatterns: REQUIRED_PATTERNS,
  antiPatterns: ANTI_PATTERNS,
  templates: COMPONENT_TEMPLATES,
  performance: PERFORMANCE_RULES,
  accessibility: ACCESSIBILITY_RULES,

  // Version for cache invalidation
  version: '1.1.0',
  lastUpdated: '2025-01-14',

  // Learning from deep scan
  scanLearnings: {
    goldStandardComponents: [
      'atoms/Btn.tsx',
      'atoms/Icon.tsx',
      'atoms/Surface.tsx',
      'atoms/Txt.tsx',
    ],
    topIssues: [
      { code: 'CONSOLELOG', count: 78, priority: 'medium', action: 'Remove before production' },
      { code: 'INLINESTYLES', count: 51, priority: 'medium', action: 'Convert to Tailwind classes' },
      { code: 'HARDCODEDCOLORS', count: 46, priority: 'low', action: 'Use design tokens (except in contracts)' },
      { code: 'MAX_LINES', count: 10, priority: 'high', action: 'Split into smaller components' },
      { code: 'MISSING_USE_CLIENT', count: 4, priority: 'critical', action: "Add 'use client' directive" },
      { code: 'DIRECTDOM', count: 4, priority: 'critical', action: 'Convert to React refs' },
      { code: 'ANYTYPE', count: 3, priority: 'high', action: 'Add proper TypeScript types' },
    ],
    layerHealth: {
      atoms: { avgHealth: 90, status: 'excellent' },
      molecules: { avgHealth: 86, status: 'good' },
      organisms: { avgHealth: 73, status: 'needs-improvement' },
    },
    exceptions: {
      // These files are allowed to have hardcoded colors (they ARE the token definitions)
      allowHardcodedColors: [
        'theme/BioThemeContract.ts',
        'theme/BioThemeGuard.tsx',
        'mcp/BioSkinKnowledgeContract.ts',
      ],
      // These files are allowed console.log (they are CLI/MCP tools)
      allowConsoleLog: [
        'mcp/BioSkinMCP.ts',
        'mcp/BioSkinMCPEnhanced.ts',
        'registry/BioRegistry.ts',
      ],
      // These files are allowed direct DOM access (legitimate use cases)
      allowDirectDOM: [
        'BioSpotlight.tsx',    // Needs querySelector for tooltip positioning
        'BioTour.tsx',         // Needs querySelector for tour step targeting
        'BioPrintTemplate.tsx', // Needs DOM for injecting print styles
      ],
    },
  },
} as const;

export type BioSkinKnowledgeContract = typeof BIOSKIN_KNOWLEDGE_CONTRACT;

export default BIOSKIN_KNOWLEDGE_CONTRACT;
