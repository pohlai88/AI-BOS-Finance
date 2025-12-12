// ============================================================================
// ERROR BOUNDARY - Meta App Error Handling
// Figma Best Practice: Graceful error recovery with branded fallback
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Meta App Error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#000000] p-8">
          {/* HUD Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Error Card */}
          <div className="relative z-10 w-full max-w-2xl">
            {/* Top Border Highlight */}
            <div className="mb-8 h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent" />

            <div className="border border-[#1F1F1F] bg-[#0A0A0A] p-12">
              {/* Inner Top Glow */}
              <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#EF4444]/50 to-transparent" />

              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center border border-[#EF4444]">
                  <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-3 text-center text-2xl tracking-[-0.02em] text-white">
                System Error Detected
              </h1>

              {/* Subtitle */}
              <p className="mb-8 text-center font-mono text-sm tracking-wide text-[#888]">
                META_ERROR // CRITICAL
              </p>

              {/* Error Message */}
              <div className="mb-8 border border-[#1F1F1F] bg-[#050505] p-6">
                <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[#EF4444]">
                  Error Details:
                </div>
                <div className="font-mono text-sm leading-relaxed text-[#CCC]">
                  {this.state.error?.message || 'Unknown error occurred'}
                </div>

                {/* Stack Trace (Collapsed) */}
                {process.env.NODE_ENV === 'development' &&
                  this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-[#666] hover:text-[#28E7A2]">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto text-[10px] leading-relaxed text-[#666]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex flex-1 items-center justify-center gap-2 bg-[#28E7A2] px-6 py-3 font-mono text-sm uppercase tracking-wide text-black transition-colors hover:bg-[#28E7A2]/90"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Application
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex flex-1 items-center justify-center gap-2 border border-[#333] px-6 py-3 font-mono text-sm uppercase tracking-wide text-[#CCC] transition-colors hover:border-[#28E7A2] hover:text-white"
                >
                  <Home className="h-4 w-4" />
                  Return Home
                </button>
              </div>

              {/* Footer Metadata */}
              <div className="mt-8 flex items-center justify-between border-t border-[#1F1F1F] pt-6">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#444]">
                  Error Code: {Date.now().toString(36).toUpperCase()}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#444]">
                  NexusCanon Error Handler
                </span>
              </div>
            </div>

            {/* Bottom Coordinate */}
            <div className="mt-4 text-center font-mono text-[8px] uppercase tracking-wider text-[#333]">
              If error persists, contact system administrator
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
