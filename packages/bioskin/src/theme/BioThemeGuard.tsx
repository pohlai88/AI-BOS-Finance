/**
 * BioThemeGuard - Runtime theme validation
 * 
 * IMMORTAL Strategy - Layer 2: Runtime Defense
 * 
 * This component validates that all required CSS tokens exist.
 * If tokens are missing in DEVELOPMENT, it shows a warning overlay.
 * In PRODUCTION, it logs errors but doesn't break the UI.
 * 
 * Usage:
 *   <BioThemeGuard>
 *     <YourApp />
 *   </BioThemeGuard>
 */

'use client';

import * as React from 'react';
import { validateThemeTokens } from './BioThemeContract';

interface BioThemeGuardProps {
  children: React.ReactNode;
  /** Show overlay in development when tokens are missing */
  showDevWarning?: boolean;
  /** Callback when validation completes */
  onValidation?: (result: { missing: string[]; warnings: string[] }) => void;
}

export function BioThemeGuard({
  children,
  showDevWarning = true,
  onValidation,
}: BioThemeGuardProps) {
  const [validationResult, setValidationResult] = React.useState<{
    missing: string[];
    warnings: string[];
  } | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Validate after mount (needs DOM)
    const result = validateThemeTokens();
    setValidationResult(result);
    onValidation?.(result);

    // Log issues
    if (result.missing.length > 0) {
      console.error(
        '[BioThemeGuard] Missing CSS tokens:',
        result.missing,
        '\nThese tokens should be defined in globals.css'
      );
    }

    if (result.warnings.length > 0) {
      console.warn('[BioThemeGuard] Warnings:', result.warnings);
    }
  }, [onValidation]);

  const isDev = process.env.NODE_ENV === 'development';
  const hasMissingTokens = validationResult && validationResult.missing.length > 0;

  return (
    <>
      {children}

      {/* Development warning overlay */}
      {isDev && showDevWarning && hasMissingTokens && !dismissed && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            maxWidth: '400px',
            padding: '16px',
            backgroundColor: '#7F1D1D',
            color: '#FEE2E2',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 99999,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <strong style={{ color: '#FCA5A5' }}>⚠️ Missing Theme Tokens</strong>
            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FCA5A5',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: '8px 0', opacity: 0.9 }}>
            The following CSS tokens are not defined in globals.css:
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px', maxHeight: '150px', overflow: 'auto' }}>
            {validationResult?.missing.slice(0, 10).map((token) => (
              <li key={token} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {token}
              </li>
            ))}
            {validationResult && validationResult.missing.length > 10 && (
              <li>...and {validationResult.missing.length - 10} more</li>
            )}
          </ul>
          <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
            See BioThemeContract.ts for token definitions.
          </p>
        </div>
      )}
    </>
  );
}

BioThemeGuard.displayName = 'BioThemeGuard';
