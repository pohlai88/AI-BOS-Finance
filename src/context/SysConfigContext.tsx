import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

// ============================================================================
// SYS CONFIG CONTEXT
// Manages the global state of the onboarding/configuration process.
// ============================================================================

type ConfigStep = 'profile' | 'organization' | 'team';

interface SysConfigState {
  steps: {
    profile: boolean;
    organization: boolean;
    team: boolean;
  };
  markComplete: (step: ConfigStep) => void;
  applyDefaults: () => void;
  isFullyConfigured: boolean;
}

const SysConfigContext = createContext<SysConfigState | undefined>(undefined);

export function SysConfigProvider({ children }: { children: ReactNode }) {
  // Initialize with defaults first (SSR-safe), then hydrate from localStorage
  const [steps, setSteps] = useState({
    profile: false,
    organization: false,
    team: false,
  });

  // Hydrate from localStorage after mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('nexus_sys_config');
    if (saved) {
      try {
        setSteps(JSON.parse(saved));
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('nexus_sys_config', JSON.stringify(steps));
  }, [steps]);

  const markComplete = (step: ConfigStep) => {
    setSteps((prev) => {
      if (prev[step]) return prev; // No change
      return { ...prev, [step]: true };
    });
  };

  const applyDefaults = () => {
    setSteps({
      profile: true, // Assuming defaults fills profile too for demo
      organization: true,
      team: false, // Team is usually manual
    });
    toast.success('System defaults applied successfully.');
  };

  const isFullyConfigured = steps.profile && steps.organization;

  return (
    <SysConfigContext.Provider value={{ steps, markComplete, applyDefaults, isFullyConfigured }}>
      {children}
    </SysConfigContext.Provider>
  );
}

export function useSysConfig() {
  const context = useContext(SysConfigContext);
  if (context === undefined) {
    throw new Error('useSysConfig must be used within a SysConfigProvider');
  }
  return context;
}
