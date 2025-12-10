// ============================================================================
// APP PROVIDERS - Centralized Provider Composition
// Wraps the application with all necessary context providers
// Per NEXUSCANON REFACTORING GUIDELINES: Avoid "provider hell" in App.tsx
// ============================================================================

import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SysConfigProvider } from '@/context/SysConfigContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <BrowserRouter>
      <SysConfigProvider>
        {children}
        <Toaster />
      </SysConfigProvider>
    </BrowserRouter>
  );
};
