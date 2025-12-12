import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Maximize2,
  Copy,
  Check,
  FileJson,
  FileSpreadsheet,
  Database,
  ArrowRight,
  ExternalLink,
  Share2,
  Shield,
  Clock,
  User,
  Layers,
  FileText,
  Settings2,
  RotateCcw,
  GripVertical,
  Plus,
  Trash2,
  Save,
} from 'lucide-react'
import { MetadataRecord } from '../../types/metadata'
import { RouterLink } from '@/hooks/useRouterAdapter'
import clsx from 'clsx'
// DND-KIT Imports for Drag and Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- TYPE DEFINITIONS ---

type WidgetType = 'row' | 'card' | 'tags' | 'list' | 'risk-alert'

interface FieldSchema {
  id: string
  label: string
  key: keyof MetadataRecord | string
  type: WidgetType
  span: 1 | 2
  transform?: (record: MetadataRecord) => string | string[]
  isVisible?: boolean // Track visibility
}

interface SectionSchema {
  id: string
  title: string
  fields: FieldSchema[]
}

interface DetailDrawerProps {
  record: MetadataRecord | null
  isOpen: boolean
  onClose: () => void
}

// --- DEFAULT CONFIGURATION ---
const DEFAULT_LAYOUT: SectionSchema[] = [
  {
    id: 'identity',
    title: 'Identity & Names',
    fields: [
      {
        id: 'id',
        label: 'Metadata ID',
        key: 'dict_id',
        type: 'row',
        span: 2,
        isVisible: true,
      },
      {
        id: 'biz_name',
        label: 'Business Name',
        key: 'business_term',
        type: 'row',
        span: 2,
        isVisible: true,
      },
      {
        id: 'tech_name',
        label: 'Technical Name',
        key: 'technical_name',
        type: 'row',
        span: 2,
        isVisible: true,
      },
      {
        id: 'tags',
        label: 'Tags',
        key: 'tags',
        type: 'tags',
        span: 2,
        isVisible: true,
      },
    ],
  },
  {
    id: 'definitions',
    title: 'Definitions',
    fields: [
      {
        id: 'short_def',
        label: 'Short Definition',
        key: 'definition_full',
        type: 'card',
        span: 1,
        isVisible: true,
        transform: (r) => r.definition_full.split('.')[0] + '.',
      },
      {
        id: 'full_def',
        label: 'Full Definition',
        key: 'definition_full',
        type: 'card',
        span: 1,
        isVisible: true,
      },
    ],
  },
  {
    id: 'usage',
    title: 'Examples & Use Cases',
    fields: [
      {
        id: 'examples',
        label: 'Example Values',
        key: 'example_values',
        type: 'tags',
        span: 1,
        isVisible: true,
      },
      {
        id: 'usecases',
        label: 'Use Cases',
        key: 'use_cases',
        type: 'list',
        span: 1,
        isVisible: true,
        transform: () => ['Board pack reporting', 'Q4 Audit Trail'],
      },
    ],
  },
  {
    id: 'source',
    title: 'Reference Source',
    fields: [
      {
        id: 'sot',
        label: 'Source of Truth',
        key: 'source_of_truth',
        type: 'row',
        span: 2,
        isVisible: true,
      },
      {
        id: 'domain',
        label: 'Domain',
        key: 'domain',
        type: 'row',
        span: 2,
        isVisible: true,
      },
      {
        id: 'conn',
        label: 'Connection Path',
        key: 'connection',
        type: 'row',
        span: 2,
        isVisible: true,
        transform: (r) => `jdbc://${r.domain}.db/${r.technical_name}`,
      },
    ],
  },
  {
    id: 'specs',
    title: 'Technical Specs',
    fields: [
      {
        id: 'biz_type',
        label: 'Business Type',
        key: 'data_type_biz',
        type: 'card',
        span: 1,
        isVisible: true,
      },
      {
        id: 'tech_type',
        label: 'Technical Type',
        key: 'data_type_tech',
        type: 'card',
        span: 1,
        isVisible: true,
      },
    ],
  },
  {
    id: 'gov',
    title: 'Governance & Risk',
    fields: [
      {
        id: 'risk',
        label: 'Risk Impact',
        key: 'errors_if_wrong',
        type: 'risk-alert',
        span: 2,
        isVisible: true,
        transform: (r) =>
          r.errors_if_wrong ||
          'Potential revenue misstatement and audit failure.',
      },
    ],
  },
]

// --- RENDERER COMPONENTS ---
const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'rounded p-1.5 transition-all',
        copied
          ? 'bg-[#28E7A2]/10 text-[#28E7A2]'
          : 'text-[#666] hover:bg-[#222] hover:text-white'
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

const WidgetRow = ({ label, value }: { label: string; value: string }) => (
  <div className="group -mx-2 flex h-full items-center justify-between rounded border-b border-[#1F1F1F] px-2 py-2 last:border-0 hover:bg-[#0A0A0A]">
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
        {label}
      </span>
      <span className="break-all text-sm text-[#EEE]">{value}</span>
    </div>
    <CopyBtn text={value} />
  </div>
)

const WidgetCard = ({ label, value }: { label: string; value: string }) => (
  <div className="group relative flex h-full flex-col rounded border border-[#1F1F1F] bg-[#0A0A0A] p-3 transition-colors hover:border-[#333]">
    <div className="mb-2 flex items-start justify-between">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
        {label}
      </span>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <CopyBtn text={value} />
      </div>
    </div>
    <div className="flex-1 break-words text-xs leading-relaxed text-[#CCC]">
      {value}
    </div>
  </div>
)

const WidgetTags = ({ label, values }: { label: string; values: string[] }) => (
  <div
    className={clsx(
      'flex h-full flex-col justify-center gap-2',
      values.length === 0 && 'hidden'
    )}
  >
    {label !== 'Tags' && (
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
        {label}
      </span>
    )}
    <div className="flex flex-wrap gap-2">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-block rounded border border-[#333] bg-[#1F1F1F] px-1.5 py-0.5 font-mono text-[10px] text-[#28E7A2]"
        >
          {v}
        </span>
      ))}
    </div>
  </div>
)

const WidgetList = ({ label, items }: { label: string; items: string[] }) => (
  <div className="h-full rounded border border-[#1F1F1F] bg-[#0A0A0A] p-3">
    <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-[#666]">
      {label}
    </span>
    <ul className="list-inside list-disc space-y-1 text-xs text-[#CCC]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
)

const WidgetRisk = ({ label, value }: { label: string; value: string }) => (
  <div className="flex h-full items-start gap-3 rounded border border-[#491C1C] bg-[#2F1515] p-3">
    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D4D]" />
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[#FF4D4D]">
        {label}
      </div>
      <p className="text-xs text-[#FF4D4D]/90">{value}</p>
    </div>
  </div>
)

// --- SORTABLE ITEM COMPONENT ---
const SortableItem = ({
  id,
  field,
  children,
  isEditing,
  onRemove,
}: {
  id: string
  field: FieldSchema
  children: React.ReactNode
  isEditing: boolean
  onRemove: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        field.span === 2 ? 'col-span-2' : 'col-span-1',
        'group relative h-full'
      )}
    >
      {/* EDIT OVERLAY */}
      {isEditing && (
        <div className="pointer-events-none absolute -inset-1 z-50 flex items-start justify-between rounded border-2 border-dashed border-[#28E7A2] bg-[#28E7A2]/5 p-1">
          <div
            {...attributes}
            {...listeners}
            className="pointer-events-auto cursor-grab rounded border border-[#28E7A2] bg-[#050505] p-1 transition-colors hover:bg-[#28E7A2] hover:text-black active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3" />
          </div>
          <button
            onClick={onRemove}
            className="pointer-events-auto rounded border border-red-500 bg-[#050505] p-1 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* CONTENT */}
      {children}
    </div>
  )
}

// --- THE LAYOUT ENGINE ---
const LayoutRenderer = ({
  layout,
  record,
  isEditing,
  onLayoutChange,
}: {
  layout: SectionSchema[]
  record: MetadataRecord
  isEditing: boolean
  onLayoutChange: (newLayout: SectionSchema[]) => void
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent, sectionIndex: number) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const newLayout = [...layout]
      const items = newLayout[sectionIndex].fields
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)

      newLayout[sectionIndex].fields = arrayMove(items, oldIndex, newIndex)
      onLayoutChange(newLayout)
    }
  }

  const handleRemoveField = (sectionIndex: number, fieldId: string) => {
    const newLayout = [...layout]
    newLayout[sectionIndex].fields = newLayout[sectionIndex].fields.map((f) =>
      f.id === fieldId ? { ...f, isVisible: false } : f
    )
    onLayoutChange(newLayout)
  }

  return (
    <div className="space-y-6">
      {layout.map((section, sectionIndex) => (
        <div
          key={section.id}
          className={clsx(
            'transition-all duration-300',
            isEditing &&
              'rounded-lg border border-dashed border-[#333] bg-[#0A0A0A] p-4'
          )}
        >
          {/* Section Header */}
          <div className="mb-3 mt-2 flex items-center justify-between border-b border-[#1F1F1F]/50 pb-1">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#28E7A2]" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
                {section.title}
              </h3>
            </div>
            {isEditing && (
              <button className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[9px] text-[#28E7A2] transition-colors hover:bg-[#28E7A2]/10">
                <Plus className="h-3 w-3" /> ADD FIELD
              </button>
            )}
          </div>

          {/* DND Context for Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, sectionIndex)}
          >
            <SortableContext
              items={section.fields
                .filter((f) => f.isVisible !== false)
                .map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4">
                {section.fields
                  .filter((f) => f.isVisible !== false)
                  .map((field) => {
                    const rawValue: any = field.transform
                      ? field.transform(record)
                      : record[field.key as keyof MetadataRecord]
                    if (!rawValue) return null

                    return (
                      <SortableItem
                        key={field.id}
                        id={field.id}
                        field={field}
                        isEditing={isEditing}
                        onRemove={() =>
                          handleRemoveField(sectionIndex, field.id)
                        }
                      >
                        {field.type === 'row' && (
                          <WidgetRow
                            label={field.label}
                            value={String(rawValue)}
                          />
                        )}
                        {field.type === 'card' && (
                          <WidgetCard
                            label={field.label}
                            value={String(rawValue)}
                          />
                        )}
                        {field.type === 'tags' && (
                          <WidgetTags
                            label={field.label}
                            values={
                              Array.isArray(rawValue)
                                ? rawValue
                                : [String(rawValue)]
                            }
                          />
                        )}
                        {field.type === 'list' && (
                          <WidgetList
                            label={field.label}
                            items={
                              Array.isArray(rawValue)
                                ? rawValue
                                : [String(rawValue)]
                            }
                          />
                        )}
                        {field.type === 'risk-alert' && (
                          <WidgetRisk
                            label={field.label}
                            value={String(rawValue)}
                          />
                        )}
                      </SortableItem>
                    )
                  })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  )
}

// --- MINI MAP COMPONENT (Static Anchor) ---
const LineageMap = ({ record }: { record: MetadataRecord }) => (
  <div className="group relative mb-4 h-32 overflow-hidden rounded border border-[#1F1F1F] bg-[#080808]">
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    />
    <div className="absolute inset-0 flex items-center justify-center gap-4 px-8">
      <div className="flex flex-col items-center gap-2 opacity-60">
        <div className="rounded border border-[#333] bg-[#111] p-2">
          <Database className="h-4 w-4 text-[#666]" />
        </div>
        <span className="font-mono text-[9px] text-[#666]">SRC</span>
      </div>
      <div className="relative h-px w-12 bg-[#333]">
        <ArrowRight className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 text-[#333]" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded border border-[#28E7A2] bg-[#132F2B] p-2.5 shadow-[0_0_15px_rgba(40,231,162,0.15)]">
          <Layers className="h-5 w-5 text-[#28E7A2]" />
        </div>
        <span className="font-mono text-[9px] font-bold text-[#28E7A2]">
          THIS
        </span>
      </div>
      <div className="relative h-px w-12 bg-[#333]">
        <ArrowRight className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 text-[#333]" />
      </div>
      <div className="flex flex-col items-center gap-2 opacity-60">
        <div className="rounded border border-[#333] bg-[#111] p-2">
          <Share2 className="h-4 w-4 text-[#666]" />
        </div>
        <span className="font-mono text-[9px] text-[#666]">
          {record.downstream_use.length} USERS
        </span>
      </div>
    </div>
    <button className="absolute right-2 top-2 rounded border border-[#333] bg-black/80 p-1.5 text-[#888] transition-colors hover:border-[#28E7A2] hover:text-[#28E7A2]">
      <Maximize2 className="h-3.5 w-3.5" />
    </button>
  </div>
)

// --- UTILITIES: DYNAMIC EXPORT ---

// Process export data based on scope (full or filtered by visible fields)
const processExportData = (
  record: MetadataRecord,
  layout: SectionSchema[],
  scope: 'full' | 'selected'
) => {
  // 1. FULL: Return everything
  if (scope === 'full') {
    return {
      headers: Object.keys(record),
      data: record,
    }
  }

  // 2. SELECTED: Filter based on layout visibility
  const selectedData: Record<string, any> = {}

  // Always include ID for reference, even if hidden in UI
  selectedData['dict_id'] = record.dict_id

  layout.forEach((section) => {
    section.fields.forEach((field) => {
      // Only include if visible
      if (field.isVisible !== false) {
        const value = field.transform
          ? field.transform(record)
          : record[field.key as keyof MetadataRecord]

        // Use the technical key for data integrity
        selectedData[String(field.key)] = value
      }
    })
  })

  return {
    headers: Object.keys(selectedData),
    data: selectedData,
  }
}

// Handle download for both JSON and CSV formats
const handleDownload = (
  format: 'json' | 'csv',
  scope: 'full' | 'selected',
  record: MetadataRecord,
  layout: SectionSchema[]
) => {
  const { headers, data } = processExportData(record, layout, scope)
  const filename = `${record.technical_name}_${scope}.${format}`

  if (format === 'json') {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(data, null, 2))
    const link = document.createElement('a')
    link.href = dataStr
    link.download = filename
    link.click()
  } else {
    // Flatten arrays for CSV
    const csvRow = headers
      .map((header) => {
        const val = data[header]
        // Handle arrays (like tags) by joining them with pipes | to avoid CSV breaking
        return Array.isArray(val)
          ? `"${val.join('|')}"`
          : `"${String(val || '')}"`
      })
      .join(',')

    const csvContent = `${headers.join(',')}\n${csvRow}`
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
    link.download = filename
    link.click()
  }
}

// --- EXPORT BUTTON COMPONENT ---
const ExportButton = ({
  format,
  record,
  layout,
}: {
  format: 'json' | 'csv'
  record: MetadataRecord
  layout: SectionSchema[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const Icon = format === 'json' ? FileJson : FileSpreadsheet
  const label = format.toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      {/* MAIN BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'group flex items-center gap-2 rounded border px-3 py-2 font-mono text-xs uppercase transition-colors',
          isOpen
            ? 'border-[#28E7A2] bg-[#28E7A2] text-black'
            : 'border-[#333] bg-[#1F1F1F] text-[#888] hover:border-[#28E7A2] hover:bg-[#28E7A2] hover:text-black'
        )}
      >
        <Icon
          className={clsx(
            'h-3.5 w-3.5',
            isOpen ? 'stroke-black' : 'group-hover:stroke-black'
          )}
        />
        {label}
      </button>

      {/* POPOVER MENU */}
      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-56 overflow-hidden rounded border border-[#333] bg-[#0A0A0A] shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="border-b border-[#1F1F1F] bg-[#111] px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
              Select {label} Scope
            </span>
          </div>

          <div className="p-1">
            {/* OPTION 1: CURRENT VIEW */}
            <button
              onClick={() => {
                handleDownload(format, 'selected', record, layout)
                setIsOpen(false)
              }}
              className="group flex w-full items-start gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-[#1A1A1A]"
            >
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#28E7A2]" />
              <div className="flex flex-col">
                <span className="font-mono text-xs text-[#CCC] group-hover:text-white">
                  Current View
                </span>
                <span className="text-[9px] leading-tight text-[#666]">
                  Visible fields only
                </span>
              </div>
            </button>

            {/* OPTION 2: FULL DATA */}
            <button
              onClick={() => {
                handleDownload(format, 'full', record, layout)
                setIsOpen(false)
              }}
              className="group flex w-full items-start gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-[#1A1A1A]"
            >
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-[#666] group-hover:text-[#28E7A2]" />
              <div className="flex flex-col">
                <span className="font-mono text-xs text-[#CCC] group-hover:text-white">
                  Full Fact Sheet
                </span>
                <span className="text-[9px] leading-tight text-[#666]">
                  All raw database fields
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- MAIN DRAWER ---
export const DetailDrawer = ({
  record,
  isOpen,
  onClose,
}: DetailDrawerProps) => {
  const [layout, setLayout] = useState<SectionSchema[]>(DEFAULT_LAYOUT)
  const [isEditing, setIsEditing] = useState(false)

  // RESET HANDLER
  const handleReset = () => {
    if (confirm('Reset layout to default settings?')) {
      setLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT))) // Deep copy reset
      setIsEditing(false)
    }
  }

  // SAVE HANDLER
  const handleSave = () => {
    // TODO: Persist to localStorage or backend
    // localStorage.setItem('nexus-drawer-layout', JSON.stringify(layout));
    setIsEditing(false)
  }

  if (!record) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-[650px] flex-col border-l border-[#1F1F1F] bg-[#050505] shadow-[-20px_0_50px_rgba(0,0,0,0.6)]"
          >
            {/* HEADER: With Edit Controls */}
            <div className="z-10 flex flex-none items-center justify-between border-b border-[#1F1F1F] bg-[#050505] px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${record.canon_status === 'LOCKED' ? 'bg-[#28E7A2]' : 'bg-yellow-500'} animate-pulse`}
                />
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#888]">
                  {isEditing ? 'Editing Layout...' : 'Metadata Record'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* EDIT MODE TOGGLES */}
                {isEditing ? (
                  <>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 rounded border border-red-900/50 bg-red-900/20 px-3 py-1.5 font-mono text-[10px] uppercase text-red-500 transition-colors hover:bg-red-900/40"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded border border-[#28E7A2] bg-[#28E7A2] px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-black shadow-[0_0_10px_rgba(40,231,162,0.3)] transition-colors hover:bg-[#28E7A2]/90"
                    >
                      <Save className="h-3 w-3" /> Save View
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center gap-2 rounded border border-[#28E7A2] bg-[#132F2B] px-4 py-2 font-mono text-[11px] font-bold uppercase text-[#28E7A2] shadow-[0_0_15px_rgba(40,231,162,0.2)] transition-all hover:bg-[#28E7A2] hover:text-black hover:shadow-[0_0_25px_rgba(40,231,162,0.4)]"
                  >
                    <Settings2 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />{' '}
                    Customize
                  </button>
                )}
                <div className="mx-2 h-4 w-px bg-[#333]" />
                <button
                  onClick={onClose}
                  className="text-[#666] transition-colors hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div
              className={clsx(
                'custom-scrollbar flex-1 overflow-y-auto p-8',
                isEditing && 'bg-[#080808]'
              )}
            >
              {/* STATIC HERO SECTION (Lineage + Title) */}
              <div
                className={clsx(
                  'transition-opacity duration-300',
                  isEditing && 'pointer-events-none opacity-50'
                )}
              >
                <LineageMap record={record} />

                <div className="mb-6 flex justify-end">
                  <RouterLink
                    to={`/metadata/${record.dict_id}`}
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-[#28E7A2] hover:underline"
                  >
                    View Full Fact Sheet <ArrowRight className="h-3 w-3" />
                  </RouterLink>
                </div>

                <div className="mb-6 border-l-2 border-[#28E7A2] pl-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-[#1F1F1F] px-1.5 py-0.5 font-mono text-[10px] text-[#888]">
                      {record.dict_id}
                    </span>
                    <span className="rounded border border-[#1D4436] bg-[#132F2B] px-1.5 py-0.5 font-mono text-[10px] text-[#28E7A2]">
                      {record.canon_status}
                    </span>
                  </div>
                  <h1 className="mb-1 text-2xl font-semibold text-white">
                    {record.business_term}
                  </h1>
                  <p className="font-mono text-sm text-[#666]">
                    {record.technical_name}
                  </p>
                </div>
              </div>

              {/* DYNAMIC LAYOUT ENGINE */}
              <LayoutRenderer
                layout={layout}
                record={record}
                isEditing={isEditing}
                onLayoutChange={setLayout}
              />

              {!isEditing && (
                <div className="mb-4 mt-8 flex justify-center border-t border-[#1F1F1F] pt-6">
                  <RouterLink
                    to={`/metadata/${record.dict_id}`}
                    className="flex items-center gap-2 rounded border border-[#333] bg-[#111] px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-[#222]"
                  >
                    View Full Fact Sheet <ArrowRight className="h-3.5 w-3.5" />
                  </RouterLink>
                </div>
              )}
            </div>

            {/* FOOTER */}
            {!isEditing && (
              <div className="flex flex-none items-center justify-between border-t border-[#1F1F1F] bg-[#0A0A0A] p-4">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#28E7A2]">
                  Take this metadata to your tools
                </span>
                <div className="flex items-center gap-2">
                  <ExportButton format="json" record={record} layout={layout} />
                  <ExportButton format="csv" record={record} layout={layout} />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
