// ============================================================================
// ERROR BOUNDARY - Meta App Error Handling
// Figma Best Practice: Graceful error recovery with branded fallback
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Meta App Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-8">
          
          {/* HUD Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(#28E7A2 1px, transparent 1px), linear-gradient(90deg, #28E7A2 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
          />

          {/* Error Card */}
          <div className="relative z-10 max-w-2xl w-full">
            
            {/* Top Border Highlight */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent mb-8" />

            <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-12">
              
              {/* Inner Top Glow */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#EF4444]/50 to-transparent" />

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 border border-[#EF4444] flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-white text-2xl tracking-[-0.02em] mb-3 text-center">
                System Error Detected
              </h1>

              {/* Subtitle */}
              <p className="text-[#888] font-mono text-sm mb-8 text-center tracking-wide">
                META_ERROR // CRITICAL
              </p>

              {/* Error Message */}
              <div className="bg-[#050505] border border-[#1F1F1F] p-6 mb-8">
                <div className="font-mono text-xs text-[#EF4444] mb-2 uppercase tracking-wider">
                  Error Details:
                </div>
                <div className="font-mono text-sm text-[#CCC] leading-relaxed">
                  {this.state.error?.message || 'Unknown error occurred'}
                </div>
                
                {/* Stack Trace (Collapsed) */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="font-mono text-xs text-[#666] cursor-pointer hover:text-[#28E7A2] uppercase tracking-wider">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-[10px] text-[#666] overflow-auto max-h-40 leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-[#28E7A2] text-black font-mono text-sm tracking-wide px-6 py-3 hover:bg-[#28E7A2]/90 transition-colors flex items-center justify-center gap-2 uppercase"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Application
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 border border-[#333] text-[#CCC] hover:border-[#28E7A2] hover:text-white font-mono text-sm tracking-wide px-6 py-3 transition-colors flex items-center justify-center gap-2 uppercase"
                >
                  <Home className="w-4 h-4" />
                  Return Home
                </button>
              </div>

              {/* Footer Metadata */}
              <div className="mt-8 pt-6 border-t border-[#1F1F1F] flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#444] uppercase tracking-wider">
                  Error Code: {Date.now().toString(36).toUpperCase()}
                </span>
                <span className="font-mono text-[9px] text-[#444] uppercase tracking-wider">
                  NexusCanon Error Handler
                </span>
              </div>

            </div>

            {/* Bottom Coordinate */}
            <div className="mt-4 font-mono text-[8px] text-[#333] text-center uppercase tracking-wider">
              If error persists, contact system administrator
            </div>

          </div>

        </div>
      );
    }

    return this.props.children;
  }
}
