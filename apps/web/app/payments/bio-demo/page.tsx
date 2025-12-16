/**
 * BioTable Demo Page - Proof of Concept
 * 
 * Route: /payments/bio-demo
 * 
 * Demonstrates the Bio Transform Self architecture by showing
 * a schema-driven BioTable implementation with PaymentSchema.
 * 
 * @see CONT_10 BioSkin Architecture Contract
 * @see Phase 6: Wire BioTable to /payments page as proof of concept
 */

import { Suspense } from 'react';
import { PaymentBioTableDemo } from '@/features/payment/components/PaymentBioTableDemo';

export const metadata = {
  title: 'BioTable Demo | AI-BOS Finance',
  description: 'Bio Transform Self - Schema-driven UI demonstration',
};

export default function BioTableDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-display font-bold text-text-primary mb-2">
            BioTable Demo
          </h1>
          <p className="text-body text-text-secondary">
            Phase 6 Proof of Concept — Bio Transform Self Architecture
          </p>
        </header>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }>
          <PaymentBioTableDemo />
        </Suspense>

        <footer className="mt-12 pt-6 border-t border-default">
          <p className="text-caption text-text-tertiary">
            This demo shows how Zod schemas (DNA) are introspected to auto-generate UI components (Cells).
            See <code className="text-primary">@aibos/bioskin</code> - the single governed UI cell.
          </p>
        </footer>
      </div>
    </div>
  );
}
