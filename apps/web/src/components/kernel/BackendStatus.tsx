'use client'

/**
 * BackendStatus - The "Handshake" Component
 * 
 * Simple component that proves Site A (Frontend) can talk to Site B (Backend).
 * This is the first integration test - making the dual system "move".
 * 
 * @see REF_086_IntegrationTestReport.md - Dual System Strategy
 */

import { useEffect, useState } from 'react'
import { checkKernelHealth } from '@/lib/kernel-client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface BackendStatus {
  status: 'checking' | 'connected' | 'disconnected'
  message: string
  uptime?: number
}

export function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    status: 'checking',
    message: 'Checking backend connection...',
  })

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await checkKernelHealth()
        setBackendStatus({
          status: 'connected',
          message: `Backend Online (${health.service})`,
          uptime: health.uptime,
        })
      } catch (error) {
        setBackendStatus({
          status: 'disconnected',
          message: error instanceof Error ? error.message : 'Backend unavailable',
        })
      }
    }

    checkConnection()
    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-card rounded-lg border border-border-default">
      {backendStatus.status === 'checking' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{backendStatus.message}</span>
        </>
      )}
      {backendStatus.status === 'connected' && (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm text-foreground">{backendStatus.message}</span>
          {backendStatus.uptime && (
            <span className="text-xs text-muted-foreground">
              (uptime: {Math.floor(backendStatus.uptime)}s)
            </span>
          )}
        </>
      )}
      {backendStatus.status === 'disconnected' && (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-500">{backendStatus.message}</span>
        </>
      )}
    </div>
  )
}
