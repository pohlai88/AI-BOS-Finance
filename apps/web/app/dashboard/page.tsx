'use client'

/**
 * META_02 - Metadata God View (Dashboard)
 * 
 * 🔌 DUAL SYSTEM INTEGRITY CHECK - Ping-Pong Test
 * 
 * This is a temporary tester to verify Site A (Frontend) can talk to Site B (Backend).
 * Once connection is verified, we'll restore the full MetadataGodView.
 * 
 * @see REF_087_DualSystemHandshake.md - Making It Move Strategy
 * 
 * Note: Route segment config (dynamic, revalidate) cannot be exported from Client Components.
 * This component uses client-side fetch with cache: 'no-store' for real-time updates.
 */

import { useState, useEffect } from 'react'
import { Suspense } from 'react'

export default function DashboardPage() {
  const [message, setMessage] = useState('Waiting for signal...')
  const [status, setStatus] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [backendData, setBackendData] = useState<any>(null)

  // Use Kernel backend (port 3001) - already configured in kernel-client.ts
  const BACKEND_URL = process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001'
  const HEALTH_ENDPOINT = `${BACKEND_URL}/health`

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Next.js fetch caching disabled for real-time test
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setBackendData(data)
        setMessage(`✅ Success! Backend says: "${JSON.stringify(data, null, 2)}"`)
        setStatus('success')
      } catch (err) {
        console.error('Connection test failed:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setMessage(
          `❌ Connection Failed. Is the Kernel backend running on port 3001?\n\nError: ${errorMessage}`
        )
        setStatus('error')
      }
    }

    testConnection()
  }, [HEALTH_ENDPOINT])

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <div className="min-h-screen bg-background p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 font-mono">
            🔌 Dual System Integrity Check
          </h1>

          {/* Status Box */}
          <div
            className={`p-6 rounded-lg border-2 ${status === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : status === 'error'
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-300 bg-gray-50 dark:bg-gray-900'
              }`}
          >
            <strong className="block mb-2 text-lg">Status Report:</strong>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {message}
            </pre>
          </div>

          {/* Backend Response Details */}
          {backendData && (
            <div className="mt-6 p-4 bg-surface-card rounded-lg border border-border-default">
              <h2 className="font-bold mb-2">Backend Response:</h2>
              <pre className="text-xs overflow-auto bg-black/50 p-4 rounded font-mono">
                {JSON.stringify(backendData, null, 2)}
              </pre>
            </div>
          )}

          {/* Connection Info */}
          <div className="mt-6 space-y-2">
            <p>
              <strong>Target Backend:</strong>{' '}
              <code className="bg-surface-subtle px-2 py-1 rounded">{BACKEND_URL}</code>
            </p>
            <p>
              <strong>Health Endpoint:</strong>{' '}
              <code className="bg-surface-subtle px-2 py-1 rounded">{HEALTH_ENDPOINT}</code>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              🔄 Retry Connection
            </button>
          </div>

          {/* Next Steps */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-bold mb-2">Next Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Green Box?</strong> → Dual system is moving! Proceed to build features.
              </li>
              <li>
                <strong>Red Box?</strong> → Check if Kernel backend is running on port 3001
              </li>
              <li>
                <strong>Backend not running?</strong> → Run: <code className="bg-white dark:bg-black px-1 rounded">cd apps/kernel && npm run dev</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
