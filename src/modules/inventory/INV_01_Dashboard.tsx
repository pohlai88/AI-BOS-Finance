// ============================================================================
// INV_01 - GLOBAL INVENTORY DASHBOARD
// Schema-driven inventory management powered by the Kernel
// ============================================================================
// 🏭 FACTORY PROOF:
// This module proves the Kernel architecture scales to real business data.
// 80 lines of business logic = full ERP module!
// ============================================================================

import React, { useState, useMemo } from 'react'
import { SuperTable } from '@/modules/metadata/components/SuperTable'
import {
  generateColumnsFromSchema,
  MetadataField,
  STATUS_PRESETS,
} from '@/modules/metadata/kernel'
import {
  Package,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  Plus,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@aibos/ui'

// ============================================================================
// 1. THE BUSINESS CONTRACT (Schema)
// ============================================================================
// In a real app: const { schema } = useMetadata('INV_MAIN')
// This single array drives the ENTIRE UI!
// ============================================================================

const INVENTORY_SCHEMA: MetadataField[] = [
  {
    technical_name: 'sku_id',
    business_term: 'SKU Code',
    data_type: 'code',
    is_critical: true,
    width: 120,
    description: 'Stock Keeping Unit - Unique Identifier',
    canon_id: 'INV_SKU_ID',
  },
  {
    technical_name: 'product_name',
    business_term: 'Product Name',
    data_type: 'text',
    width: 220,
    description: 'Human-readable product name',
  },
  {
    technical_name: 'category',
    business_term: 'Category',
    data_type: 'status',
    width: 130,
    status_config: {
      electronics: 'bg-blue-900/30 text-blue-400 border-blue-800',
      furniture: 'bg-amber-900/30 text-amber-400 border-amber-800',
      office: 'bg-gray-800 text-gray-300 border-gray-600',
      software: 'bg-purple-900/30 text-purple-400 border-purple-800',
    },
  },
  {
    technical_name: 'stock_level',
    business_term: 'On Hand',
    data_type: 'number',
    is_critical: true,
    width: 100,
    description: 'Current stock quantity',
  },
  {
    technical_name: 'unit_price',
    business_term: 'Unit Price',
    data_type: 'currency',
    format_pattern: 'USD',
    width: 120,
  },
  {
    technical_name: 'total_value',
    business_term: 'Total Value',
    data_type: 'currency',
    format_pattern: 'USD',
    width: 130,
    description: 'Calculated: Stock × Unit Price',
  },
  {
    technical_name: 'status',
    business_term: 'Stock Status',
    data_type: 'status',
    is_critical: true,
    width: 130,
    status_config: {
      in_stock: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      low_stock: 'bg-amber-900/30 text-amber-400 border-amber-800',
      out_of_stock: 'bg-red-900/30 text-red-400 border-red-800',
    },
  },
  {
    technical_name: 'last_restock',
    business_term: 'Last Restock',
    data_type: 'date',
    width: 140,
  },
]

// ============================================================================
// 2. MOCK INVENTORY DATA
// ============================================================================

interface InventoryItem {
  id: string
  sku_id: string
  product_name: string
  category: string
  stock_level: number
  unit_price: number
  total_value: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  last_restock: string
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    sku_id: 'TECH-001',
    product_name: 'Nexus Core Processor',
    category: 'electronics',
    stock_level: 1450,
    unit_price: 299.99,
    total_value: 434985.5,
    status: 'in_stock',
    last_restock: '2024-03-10',
  },
  {
    id: '2',
    sku_id: 'FURN-882',
    product_name: 'ErgoChair Pro',
    category: 'furniture',
    stock_level: 12,
    unit_price: 850.0,
    total_value: 10200.0,
    status: 'low_stock',
    last_restock: '2024-01-15',
  },
  {
    id: '3',
    sku_id: 'OFF-101',
    product_name: 'A4 Paper Ream (500)',
    category: 'office',
    stock_level: 0,
    unit_price: 12.5,
    total_value: 0.0,
    status: 'out_of_stock',
    last_restock: '2023-11-20',
  },
  {
    id: '4',
    sku_id: 'TECH-202',
    product_name: '4K Monitor 27"',
    category: 'electronics',
    stock_level: 56,
    unit_price: 450.0,
    total_value: 25200.0,
    status: 'in_stock',
    last_restock: '2024-03-01',
  },
  {
    id: '5',
    sku_id: 'TECH-999',
    product_name: 'Server Rack 42U',
    category: 'electronics',
    stock_level: 3,
    unit_price: 1200.0,
    total_value: 3600.0,
    status: 'low_stock',
    last_restock: '2024-02-28',
  },
  {
    id: '6',
    sku_id: 'SOFT-001',
    product_name: 'NexusCanon Enterprise License',
    category: 'software',
    stock_level: 999,
    unit_price: 4999.0,
    total_value: 4994001.0,
    status: 'in_stock',
    last_restock: '2024-03-15',
  },
  {
    id: '7',
    sku_id: 'OFF-202',
    product_name: 'Mechanical Keyboard',
    category: 'office',
    stock_level: 89,
    unit_price: 149.99,
    total_value: 13349.11,
    status: 'in_stock',
    last_restock: '2024-02-20',
  },
  {
    id: '8',
    sku_id: 'FURN-100',
    product_name: 'Standing Desk Frame',
    category: 'furniture',
    stock_level: 0,
    unit_price: 599.0,
    total_value: 0.0,
    status: 'out_of_stock',
    last_restock: '2023-12-01',
  },
]

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export function INV01Dashboard() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [selectedRows, setSelectedRows] = useState<InventoryItem[]>([])

  // === THE MAGIC: Generate columns from schema ===
  const columns = useMemo(
    () => generateColumnsFromSchema<InventoryItem>(INVENTORY_SCHEMA),
    []
  )

  // === STATISTICS ===
  const stats = useMemo(
    () => ({
      totalSKUs: MOCK_INVENTORY.length,
      totalValue: MOCK_INVENTORY.reduce(
        (sum, item) => sum + item.total_value,
        0
      ),
      inStock: MOCK_INVENTORY.filter((i) => i.status === 'in_stock').length,
      lowStock: MOCK_INVENTORY.filter((i) => i.status === 'low_stock').length,
      outOfStock: MOCK_INVENTORY.filter((i) => i.status === 'out_of_stock')
        .length,
    }),
    []
  )

  // === HANDLERS ===
  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item)
  }

  // === RENDER ===
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* HEADER */}
      <header className="border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-600/40 bg-blue-600/20">
                  <Warehouse className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="flex items-center gap-2 text-xl font-bold text-white">
                    <span className="font-mono text-blue-500">INV_01</span>
                    <span className="text-[#333]">/</span>
                    <span>Global Inventory</span>
                  </h1>
                  <p className="font-mono text-[11px] text-[#666]">
                    Real-time stock levels • Schema-driven •{' '}
                    {INVENTORY_SCHEMA.length} fields
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#1F1F1F] px-4 py-2 font-mono text-xs text-gray-300 transition-colors hover:border-[#444] hover:text-white">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#1F1F1F] px-4 py-2 font-mono text-xs text-gray-300 transition-colors hover:border-[#444] hover:text-white">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-colors hover:bg-blue-500">
                <Plus className="h-4 w-4" />
                New SKU
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {/* STATISTICS CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Total SKUs
              </span>
            </div>
            <div className="font-mono text-2xl text-white">
              {stats.totalSKUs}
            </div>
          </div>

          <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Total Value
              </span>
            </div>
            <div className="font-mono text-xl text-emerald-400">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(stats.totalValue)}
            </div>
          </div>

          <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                In Stock
              </span>
            </div>
            <div className="font-mono text-2xl text-emerald-400">
              {stats.inStock}
            </div>
          </div>

          <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Low Stock
              </span>
            </div>
            <div className="font-mono text-2xl text-amber-400">
              {stats.lowStock}
            </div>
          </div>

          <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Out of Stock
              </span>
            </div>
            <div className="font-mono text-2xl text-red-400">
              {stats.outOfStock}
            </div>
          </div>
        </div>

        {/* SUPER TABLE - Schema Generated! */}
        <SuperTable<InventoryItem>
          data={MOCK_INVENTORY}
          columns={columns}
          title="INVENTORY_MASTER"
          mobileKey="product_name"
          onRowClick={handleRowClick}
          // Feature Flags
          enableSelection={true}
          enablePagination={true}
          enableColumnVisibility={true}
          enableColumnFilters={true}
          enableGlobalFilter={true}
          // Selection Handler
          onSelectionChange={setSelectedRows}
        />

        {/* BULK ACTION BAR */}
        {selectedRows.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-600/30 bg-blue-600/10 p-4">
            <span className="font-mono text-sm text-blue-400">
              {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex gap-2">
              <button className="rounded bg-blue-600 px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-blue-500">
                RESTOCK SELECTED
              </button>
              <button className="rounded border border-blue-600 px-3 py-1.5 font-mono text-xs text-blue-400 transition-colors hover:bg-blue-600/10">
                EXPORT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* DETAIL PANEL (Slide Over) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />

          {/* Panel */}
          <div className="custom-scrollbar relative ml-auto h-full w-full max-w-md overflow-y-auto border-l border-[#1F1F1F] bg-[#0A0A0A] shadow-2xl">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 border-b border-[#1F1F1F] bg-[#050505] px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 font-mono text-[10px] text-blue-400">
                    {selectedItem.sku_id}
                  </p>
                  <h2 className="text-lg font-bold text-white">
                    {selectedItem.product_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg p-2 text-[#666] transition-colors hover:bg-[#1F1F1F] hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="space-y-8 p-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden rounded-lg border border-[#222] bg-[#111] p-4">
                  <div className="absolute right-0 top-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                    <Package className="h-12 w-12 text-white" />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                    Stock Level
                  </div>
                  <div
                    className={cn(
                      'mt-2 font-mono text-3xl',
                      selectedItem.status === 'out_of_stock'
                        ? 'text-red-400'
                        : selectedItem.status === 'low_stock'
                          ? 'text-amber-400'
                          : 'text-white'
                    )}
                  >
                    {selectedItem.stock_level.toLocaleString()}
                  </div>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-[10px]',
                      selectedItem.status === 'in_stock'
                        ? 'text-emerald-500'
                        : selectedItem.status === 'low_stock'
                          ? 'text-amber-500'
                          : 'text-red-500'
                    )}
                  >
                    {selectedItem.status === 'in_stock'
                      ? '● Safe Level'
                      : selectedItem.status === 'low_stock'
                        ? '● Reorder Soon'
                        : '● Restock Required'}
                  </div>
                </div>

                <div className="rounded-lg border border-[#222] bg-[#111] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                    Total Asset Value
                  </div>
                  <div className="mt-2 font-mono text-3xl text-[#28E7A2]">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      notation:
                        selectedItem.total_value > 10000
                          ? 'compact'
                          : 'standard',
                    }).format(selectedItem.total_value)}
                  </div>
                  <div className="mt-1 text-[10px] text-[#666]">
                    @ ${selectedItem.unit_price.toFixed(2)} / unit
                  </div>
                </div>
              </div>

              {/* Read-Only Metadata View */}
              <div>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-[#666]">
                  Technical Metadata
                </h3>
                <div className="overflow-hidden rounded-lg border border-[#222] bg-[#0A0A0A]">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-[#1F1F1F]">
                      {Object.entries(selectedItem).map(([key, val]) => (
                        <tr
                          key={key}
                          className="transition-colors hover:bg-[#111]"
                        >
                          <td className="w-1/3 px-4 py-2.5 font-mono text-xs text-[#666]">
                            {key}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-300">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Footer */}
              <div className="space-y-3 border-t border-[#1F1F1F] pt-4">
                <div className="flex gap-3">
                  <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-mono text-sm text-white transition-colors hover:bg-blue-500">
                    Edit SKU
                  </button>
                  <button className="flex-1 rounded-lg bg-[#28E7A2] px-4 py-2 font-mono text-sm font-bold text-black transition-colors hover:bg-[#28E7A2]/80">
                    Restock
                  </button>
                </div>
                <button className="w-full rounded-lg border border-[#333] bg-[#1F1F1F] py-2 font-mono text-sm text-[#666] transition-all hover:border-red-500 hover:text-red-400">
                  Deprecate SKU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default INV01Dashboard
