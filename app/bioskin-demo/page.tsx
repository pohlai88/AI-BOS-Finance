// ============================================================================
// BIOSKIN v0 DEMO - Payment Schema Integration
// ============================================================================
// Demonstrates BioSkin rendering Payment entity in view and edit modes
// 🛡️ GOVERNANCE: Uses BioSkin components (which use atoms only)
// ============================================================================

'use client'

import { useState } from 'react'
import {
  BioObject,
  BioList,
  FieldContextSidebar,
  type ExtendedMetadataField,
} from '../../../packages/bioskin/src/index'
import { PAYMENT_SCHEMA } from '@/modules/payment/data/paymentSchema'
import type { Payment } from '@/modules/payment/data/paymentSchema'
import { Surface, Txt, Btn } from '@aibos/ui'

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPayment: Payment = {
  id: 'pay-001',
  tx_id: 'TX-2024-001',
  beneficiary: 'Acme Corporation',
  invoice_ref: 'INV-2024-001',
  amount: 12500.0,
  currency: 'USD',
  method: 'wire',
  status: 'pending',
  tx_type: 'external',
  elimination_status: 'n/a',
  functional_cluster: 'utilities',
  risk_score: 0.15,
  requested_by: 'John Doe',
  requestor_id: 'user-123',
  created_at: '2024-12-01T10:00:00Z',
  due_date: '2024-12-15T00:00:00Z',
  entity: 'US_HOLDING_CORP',
  cost_center: 'CC-001',
  gl_account: 'GL-5000',
  docs_attached: 2,
  docs_required: 3,
}

const mockPayments: Payment[] = [
  mockPayment,
  {
    ...mockPayment,
    id: 'pay-002',
    tx_id: 'TX-2024-002',
    beneficiary: 'Tech Solutions Inc',
    amount: 8500.0,
    status: 'approved',
  },
  {
    ...mockPayment,
    id: 'pay-003',
    tx_id: 'TX-2024-003',
    beneficiary: 'Global Services Ltd',
    amount: 22000.0,
    status: 'rejected',
  },
]

// ============================================================================
// DEMO PAGE
// ============================================================================

export default function BioSkinDemoPage() {
  const [intent, setIntent] = useState<'view' | 'edit'>('view')
  const [selectedRecord, setSelectedRecord] = useState<Payment | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<Payment>(mockPayment)

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setPaymentData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleRowClick = (record: Record<string, unknown>) => {
    setSelectedRecord(record as unknown as Payment)
    setSidebarOpen(true)
  }

  return (
    <div className="min-h-screen space-y-8 bg-surface-flat p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Txt variant="h1">BioSkin v0 Demo</Txt>
          <Txt variant="body" className="mt-2 text-text-tertiary">
            Schema-driven UI rendering Payment entity
          </Txt>
        </div>
        <div className="flex items-center gap-2">
          <Btn
            variant={intent === 'view' ? 'primary' : 'secondary'}
            onClick={() => setIntent('view')}
          >
            View Mode
          </Btn>
          <Btn
            variant={intent === 'edit' ? 'primary' : 'secondary'}
            onClick={() => setIntent('edit')}
          >
            Edit Mode
          </Btn>
        </div>
      </div>

      {/* BioObject Demo */}
      <Surface variant="base" className="p-6">
        <Txt variant="h2" className="mb-4">
          BioObject - Details/Form Renderer
        </Txt>
        <BioObject
          schema={PAYMENT_SCHEMA as unknown as ExtendedMetadataField[]}
          data={paymentData as unknown as Record<string, unknown>}
          intent={intent}
          onChange={handleFieldChange}
        />
      </Surface>

      {/* BioList Demo */}
      <Surface variant="base" className="p-6">
        <Txt variant="h2" className="mb-4">
          BioList - Table Renderer
        </Txt>
        <Txt variant="small" className="mb-4 text-text-tertiary">
          Click a row to open FieldContextSidebar
        </Txt>
        <BioList
          schema={PAYMENT_SCHEMA as unknown as ExtendedMetadataField[]}
          data={mockPayments as unknown as Record<string, unknown>[]}
          onRowClick={handleRowClick}
          rowKey="id"
        />
      </Surface>

      {/* FieldContextSidebar */}
      <FieldContextSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        record={
          selectedRecord as unknown as Record<string, unknown> | undefined
        }
        schema={PAYMENT_SCHEMA as unknown as ExtendedMetadataField[]}
        fieldMeta={
          selectedRecord
            ? (PAYMENT_SCHEMA[0] as unknown as ExtendedMetadataField)
            : undefined
        }
      />
    </div>
  )
}
