// ============================================================================
// BIOSKIN: Zod Bio Demo - The Vision in Action
// ============================================================================
// Demonstrates "Generative UI" - UI that grows from Zod schemas
// This shows the transformation from "dead pages" to "living cells"
// ============================================================================

'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { ZodBioObject, ZodBioList } from './ZodBioObject'
import { Surface, Txt, Btn } from '@aibos/ui'

// ============================================================================
// EXAMPLE SCHEMAS (The DNA)
// ============================================================================

// Example 1: User Schema
const UserSchema = z.object({
  id: z.string().describe('Unique user identifier'),
  name: z.string().min(3).describe('Full name'),
  email: z.string().email().describe('Email address'),
  age: z.number().min(18).max(100).describe('Age in years'),
  status: z.enum(['active', 'inactive', 'pending']).describe('Account status'),
  isVerified: z.boolean().describe('Email verification status'),
  createdAt: z.date().describe('Account creation date'),
})

type User = z.infer<typeof UserSchema>

// Example 2: Payment Schema (simplified)
const PaymentSchema = z.object({
  id: z.string(),
  tx_id: z.string().describe('Transaction ID'),
  beneficiary: z.string().describe('Recipient name'),
  amount: z.number().min(0).describe('Payment amount'),
  currency: z.string().default('USD'),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).describe('Payment status'),
  method: z.enum(['wire', 'ach', 'check', 'card']).describe('Payment method'),
  dueDate: z.date().describe('Due date'),
})

type Payment = z.infer<typeof PaymentSchema>

// ============================================================================
// DEMO COMPONENT
// ============================================================================

export function ZodBioDemo() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Mock data
  const users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      status: 'active',
      isVerified: true,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 28,
      status: 'pending',
      isVerified: false,
      createdAt: new Date('2024-02-20'),
    },
  ]

  const payments: Payment[] = [
    {
      id: '1',
      tx_id: 'PAY-001',
      beneficiary: 'Acme Corp',
      amount: 5000.0,
      currency: 'USD',
      status: 'pending',
      method: 'wire',
      dueDate: new Date('2024-03-31'),
    },
    {
      id: '2',
      tx_id: 'PAY-002',
      beneficiary: 'Tech Services',
      amount: 1250.0,
      currency: 'USD',
      status: 'approved',
      method: 'ach',
      dueDate: new Date('2024-03-25'),
    },
  ]

  const handleUserSubmit = async (data: User) => {
    console.log('User submitted:', data)
    alert(`User saved: ${data.name}`)
  }

  const handlePaymentSubmit = async (data: Payment) => {
    console.log('Payment submitted:', data)
    alert(`Payment saved: ${data.tx_id}`)
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <Surface variant="base" className="p-6">
        <Txt variant="h1" className="mb-2">
          🧬 Generative UI Demo
        </Txt>
        <Txt variant="body" className="text-text-secondary">
          UI that grows from Zod schemas (DNA → UI). No hardcoded components.
        </Txt>
      </Surface>

      {/* Example 1: User List + Detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Surface variant="base" className="p-6">
          <Txt variant="h2" className="mb-4">
            Example 1: User Management
          </Txt>
          <Txt variant="small" className="text-text-tertiary mb-4 font-mono">
            Schema: UserSchema (name, email, age, status, isVerified, createdAt)
          </Txt>

          {/* Table - Auto-generated from schema */}
          <ZodBioList
            schema={UserSchema}
            data={users}
            onRowClick={setSelectedUser}
            rowKey="id"
            className="mb-4"
          />

          {/* Detail View - Auto-generated from schema */}
          {selectedUser && (
            <div className="mt-4">
              <Txt variant="h3" className="mb-4">
                Edit User
              </Txt>
              <ZodBioObject
                schema={UserSchema}
                data={selectedUser}
                intent="edit"
                onSubmit={handleUserSubmit}
                onCancel={() => setSelectedUser(null)}
                introspectionOptions={{
                  businessTermMap: {
                    isVerified: 'Verified',
                    createdAt: 'Created At',
                  },
                  fieldGroups: {
                    id: 'Identity',
                    name: 'Identity',
                    email: 'Identity',
                    age: 'Profile',
                    status: 'Profile',
                    isVerified: 'Profile',
                    createdAt: 'Metadata',
                  },
                }}
              />
            </div>
          )}
        </Surface>

        {/* Example 2: Payment List + Detail */}
        <Surface variant="base" className="p-6">
          <Txt variant="h2" className="mb-4">
            Example 2: Payment Management
          </Txt>
          <Txt variant="small" className="text-text-tertiary mb-4 font-mono">
            Schema: PaymentSchema (tx_id, beneficiary, amount, status, method, dueDate)
          </Txt>

          {/* Table - Auto-generated from schema */}
          <ZodBioList
            schema={PaymentSchema}
            data={payments}
            onRowClick={setSelectedPayment}
            rowKey="id"
            className="mb-4"
          />

          {/* Detail View - Auto-generated from schema */}
          {selectedPayment && (
            <div className="mt-4">
              <Txt variant="h3" className="mb-4">
                Edit Payment
              </Txt>
              <ZodBioObject
                schema={PaymentSchema}
                data={selectedPayment}
                intent="edit"
                onSubmit={handlePaymentSubmit}
                onCancel={() => setSelectedPayment(null)}
                introspectionOptions={{
                  businessTermMap: {
                    tx_id: 'Transaction ID',
                    dueDate: 'Due Date',
                  },
                  fieldGroups: {
                    id: 'Identity',
                    tx_id: 'Identity',
                    beneficiary: 'Identity',
                    amount: 'Financial',
                    currency: 'Financial',
                    status: 'Workflow',
                    method: 'Workflow',
                    dueDate: 'Timeline',
                  },
                }}
              />
            </div>
          )}
        </Surface>
      </div>

      {/* The Vision */}
      <Surface variant="base" className="p-6 bg-status-success/10 border-status-success/30">
        <Txt variant="h3" className="mb-4 text-status-success">
          ✨ The Vision: Living Code
        </Txt>
        <div className="space-y-3">
          <div>
            <Txt variant="body" className="font-mono text-text-secondary">
              <strong>Old Way (Dead Code):</strong>
            </Txt>
            <pre className="mt-2 rounded bg-surface-flat p-3 text-xs text-text-tertiary">
              {`<div className="card">
  <h1>{user.name}</h1>
  <span className="badge">{user.status}</span>
</div>`}
            </pre>
          </div>
          <div>
            <Txt variant="body" className="font-mono text-text-secondary">
              <strong>New Way (Living Code):</strong>
            </Txt>
            <pre className="mt-2 rounded bg-surface-flat p-3 text-xs text-text-tertiary">
              {`<ZodBioObject 
  schema={UserSchema} 
  data={user} 
  intent="view" 
/>`}
            </pre>
          </div>
          <Txt variant="small" className="text-text-tertiary mt-4">
            The UI grows itself from the schema. Change the schema, and the UI adapts automatically.
            No manual refactoring needed. The Skin reacts to the DNA.
          </Txt>
        </div>
      </Surface>
    </div>
  )
}
