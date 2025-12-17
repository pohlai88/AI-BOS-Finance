/**
 * Home Page (/) - Thin Route
 * Delegates to marketing feature module
 * @see FRONTEND_CLEAN_STATE_REVIEW.md
 */

import { LandingPageClient } from '@/features/marketing/components/LandingPageClient';
import { Suspense } from 'react';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LandingPageClient />
    </Suspense>
  );
}
