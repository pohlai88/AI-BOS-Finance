'use client';

/**
 * Client wrapper for LandingPage
 * Handles client-side navigation using RouterAdapter
 */

import { LandingPage } from '../views/LandingPage';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';

export function LandingPageClient() {
  const { navigate } = useRouterAdapter()

  const handleTryIt = () => {
    navigate('/dashboard')
  }

  return <LandingPage onTryIt={handleTryIt} onCanonClick={handleTryIt} />
}
