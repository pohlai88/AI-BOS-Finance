/**
 * BIOSKIN 2.1 Demo Page - Complete Component Showcase
 *
 * Route: /payments/bio-demo
 *
 * Visual validation of ALL BIOSKIN 2.1 components:
 * - Spinner (8 variants)
 * - StatusBadge (all states)
 * - MotionEffect (animations)
 * - BioTable (TanStack powered)
 * - BioForm (RHF + Zod)
 *
 * @see CONT_10 BioSkin Architecture v2.1
 * @see packages/bioskin/TESTING.md
 */

'use client';

import * as React from 'react';
import { z } from 'zod';

// BIOSKIN 2.1 Imports
import {
  Spinner,
  StatusBadge,
  MotionEffect,
  StaggerContainer,
  StaggerItem,
  Surface,
  Txt,
  Btn,
  BioTable,
  BioForm,
} from '@aibos/bioskin';

// ============================================================
// Demo Schemas
// ============================================================

const PaymentSchema = z.object({
  id: z.string(),
  vendorName: z.string().min(2, 'Vendor name required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'SGD']),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'completed']),
  dueDate: z.string(),
});

type Payment = z.infer<typeof PaymentSchema>;

const ContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// ============================================================
// Mock Data
// ============================================================

const mockPayments: Payment[] = [
  { id: '1', vendorName: 'Acme Corp', amount: 5000, currency: 'USD', status: 'approved', dueDate: '2024-12-20' },
  { id: '2', vendorName: 'TechVentures', amount: 12500, currency: 'EUR', status: 'pending', dueDate: '2024-12-25' },
  { id: '3', vendorName: 'Global Services', amount: 3200, currency: 'GBP', status: 'draft', dueDate: '2024-12-30' },
  { id: '4', vendorName: 'Innovation Labs', amount: 8900, currency: 'SGD', status: 'rejected', dueDate: '2024-12-18' },
  { id: '5', vendorName: 'CloudFirst Inc', amount: 15000, currency: 'USD', status: 'completed', dueDate: '2024-12-15' },
  { id: '6', vendorName: 'DataFlow Systems', amount: 7500, currency: 'EUR', status: 'pending', dueDate: '2024-12-22' },
  { id: '7', vendorName: 'SecureNet', amount: 4200, currency: 'USD', status: 'approved', dueDate: '2024-12-28' },
  { id: '8', vendorName: 'AI Solutions', amount: 22000, currency: 'SGD', status: 'draft', dueDate: '2025-01-05' },
];

// ============================================================
// Demo Sections
// ============================================================

function SpinnerDemo() {
  const variants = ['default', 'dots', 'pulse', 'bars', 'ring', 'dual-ring', 'bounce', 'wave'] as const;
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
  const colors = ['default', 'primary', 'success', 'warning', 'danger'] as const;

  return (
    <DemoSection title="Spinner" description="8 animated variants powered by motion">
      <div className="space-y-6">
        {/* Variants */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Variants</Txt>
          <div className="flex flex-wrap gap-6 items-center">
            {variants.map(variant => (
              <div key={variant} className="flex flex-col items-center gap-2">
                <Spinner variant={variant} size="md" />
                <Txt variant="caption" color="muted">{variant}</Txt>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Sizes</Txt>
          <div className="flex flex-wrap gap-6 items-end">
            {sizes.map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Spinner variant="default" size={size} />
                <Txt variant="caption" color="muted">{size}</Txt>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Colors</Txt>
          <div className="flex flex-wrap gap-6 items-center">
            {colors.map(color => (
              <div key={color} className="flex flex-col items-center gap-2">
                <Spinner variant="ring" size="md" color={color} />
                <Txt variant="caption" color="muted">{color}</Txt>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

function StatusBadgeDemo() {
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed', 'active', 'inactive', 'warning', 'error'];

  return (
    <DemoSection title="StatusBadge" description="Status indicators with optional pulsing dot">
      <div className="space-y-6">
        {/* Badge Variant */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Badge Variant</Txt>
          <div className="flex flex-wrap gap-3">
            {statuses.map(status => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </div>

        {/* Dot Variant */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Dot Variant</Txt>
          <div className="flex flex-wrap gap-6 items-center">
            {['active', 'pending', 'error', 'inactive'].map(status => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} variant="dot" />
                <Txt variant="body">{status}</Txt>
              </div>
            ))}
          </div>
        </div>

        {/* With Pulse */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">With Pulse Animation</Txt>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="active" pulse />
            <StatusBadge status="pending" pulse />
            <StatusBadge status="processing" pulse label="Processing..." />
          </div>
        </div>

        {/* Sizes */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Sizes</Txt>
          <div className="flex flex-wrap gap-3 items-center">
            <StatusBadge status="approved" size="sm" />
            <StatusBadge status="approved" size="md" />
            <StatusBadge status="approved" size="lg" />
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

function MotionEffectDemo() {
  const [key, setKey] = React.useState(0);
  const presets = ['fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'scaleIn', 'bounce', 'blur'] as const;

  return (
    <DemoSection title="MotionEffect" description="Reusable animation presets">
      <div className="space-y-6">
        <Btn variant="secondary" onClick={() => setKey(k => k + 1)}>
          Replay Animations
        </Btn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presets.map((preset, i) => (
            <MotionEffect key={`${preset}-${key}`} preset={preset} delay={i * 0.1}>
              <Surface className="p-4 text-center">
                <Txt variant="label">{preset}</Txt>
              </Surface>
            </MotionEffect>
          ))}
        </div>

        {/* Stagger Demo */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Stagger Animation</Txt>
          <StaggerContainer key={`stagger-${key}`} staggerDelay={0.1} className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <StaggerItem key={i} preset="scaleIn">
                <div className="w-12 h-12 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                  <Txt variant="label">{i}</Txt>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </DemoSection>
  );
}

function BioTableDemo() {
  return (
    <DemoSection title="BioTable" description="TanStack Table + Jotai - sorting, filtering, pagination, selection">
      <BioTable
        schema={PaymentSchema}
        data={mockPayments}
        title="Payments"
        keyField="id"
        enableSorting
        enableFiltering
        enablePagination
        enableSelection
        pageSize={5}
        onRowClick={(row) => console.log('Row clicked:', row)}
        onSelectionChange={(selected) => console.log('Selected:', selected)}
      />
    </DemoSection>
  );
}

function BioFormDemo() {
  const [submitted, setSubmitted] = React.useState<unknown>(null);

  return (
    <DemoSection title="BioForm" description="react-hook-form + Zod - schema-driven forms">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BioForm
          schema={ContactSchema}
          title="Contact Form"
          description="Schema-driven form with real-time validation"
          onSubmit={async (data) => {
            await new Promise(r => setTimeout(r, 1000)); // Simulate API
            setSubmitted(data);
            console.log('Form submitted:', data);
          }}
          onCancel={() => console.log('Cancelled')}
          layout="single"
          submitLabel="Send Message"
          cancelLabel="Clear"
        />

        {submitted && (
          <Surface className="p-4">
            <Txt variant="label" color="secondary" className="mb-2 block">Submitted Data:</Txt>
            <pre className="text-small bg-surface-subtle p-3 rounded overflow-auto">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </Surface>
        )}
      </div>
    </DemoSection>
  );
}

function AtomsDemo() {
  return (
    <DemoSection title="Atoms" description="Foundational building blocks">
      <div className="space-y-6">
        {/* Surface */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Surface</Txt>
          <div className="flex gap-4">
            <Surface className="p-4">Default Surface</Surface>
            <Surface variant="elevated" className="p-4">Elevated</Surface>
            <Surface variant="outlined" className="p-4">Outlined</Surface>
          </div>
        </div>

        {/* Txt */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Typography (Txt)</Txt>
          <div className="space-y-2">
            <Txt variant="display">Display Text</Txt>
            <Txt variant="heading">Heading Text</Txt>
            <Txt variant="subheading">Subheading Text</Txt>
            <Txt variant="body">Body text for paragraphs and content.</Txt>
            <Txt variant="caption" color="muted">Caption text for metadata</Txt>
          </div>
        </div>

        {/* Btn */}
        <div>
          <Txt variant="label" color="secondary" className="mb-3 block">Buttons (Btn)</Txt>
          <div className="flex flex-wrap gap-3">
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="danger">Danger</Btn>
            <Btn variant="primary" loading>Loading</Btn>
            <Btn variant="primary" disabled>Disabled</Btn>
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

// ============================================================
// Layout Components
// ============================================================

function DemoSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <Txt variant="heading" as="h2">{title}</Txt>
        <Txt variant="body" color="secondary">{description}</Txt>
      </div>
      <Surface className="p-6">
        {children}
      </Surface>
    </section>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function BioSkinDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <MotionEffect preset="slideDown">
          <header className="mb-12 text-center">
            <Txt variant="display" as="h1" className="mb-2">
              BIOSKIN 2.1
            </Txt>
            <Txt variant="subheading" color="secondary" className="mb-4">
              Complete Component Showcase
            </Txt>
            <div className="flex justify-center gap-2">
              <StatusBadge status="active" label="v2.1.0" />
              <StatusBadge status="completed" label="18 Tests Passing" />
            </div>
          </header>
        </MotionEffect>

        {/* Component Sections */}
        <StaggerContainer staggerDelay={0.1}>
          <StaggerItem preset="slideUp">
            <SpinnerDemo />
          </StaggerItem>

          <StaggerItem preset="slideUp">
            <StatusBadgeDemo />
          </StaggerItem>

          <StaggerItem preset="slideUp">
            <MotionEffectDemo />
          </StaggerItem>

          <StaggerItem preset="slideUp">
            <AtomsDemo />
          </StaggerItem>

          <StaggerItem preset="slideUp">
            <BioTableDemo />
          </StaggerItem>

          <StaggerItem preset="slideUp">
            <BioFormDemo />
          </StaggerItem>
        </StaggerContainer>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-default text-center">
          <Txt variant="caption" color="muted">
            BIOSKIN 2.1 — Powered by TanStack Table, react-hook-form, Zod, Jotai, motion
          </Txt>
          <Txt variant="caption" color="muted" className="block mt-1">
            Testing: Vitest Browser Mode + Playwright | See <code className="text-accent-primary">packages/bioskin/TESTING.md</code>
          </Txt>
        </footer>
      </div>
    </div>
  );
}
