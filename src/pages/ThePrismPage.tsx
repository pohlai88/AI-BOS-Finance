// ============================================================================
// META_03 // THE PRISM PRO (Design System v4)
// Morphology Comparator - HP/Dell/Apple Inspired
// - Resizable columns (drag borders)
// - Smart empty slot sizing (40px collapsed)
// - Section grouping with headers
// - Difference highlighting
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Database, Key, X, Plus, ChevronDown, Check,
  ScanLine, Filter, Download, Eraser, Maximize2, Minimize2,
  ChevronRight, GripVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import * as tokens from '../lib/prism-helpers';
import { MetaAppShell } from '../components/shell/MetaAppShell';

// --- MOCK DATA ---
type SchemaColumn = {
  tech_name: string;
  type: string;
  pk?: boolean;
  nullable?: boolean;
  notes?: string;
};

type DatasetModel = {
  id: string;
  name: string;
  type: 'KERNEL' | 'TRANSACTIONAL' | 'INTEGRATION';
  owner: string;
  color: string;
  schema: Record<string, SchemaColumn>;
};

type DensityMode = 'compact' | 'normal' | 'comfortable';

const DATASETS: DatasetModel[] = [
  {
    id: 'KRNL_SAP_EU',
    name: 'SAP EU Kernel',
    type: 'KERNEL',
    owner: 'Frankfurt Team',
    color: '#F59E0B',
    schema: {
      'SEM_ID': { tech_name: 'BELNR', type: 'VARCHAR(10)', pk: true, notes: 'Legacy string ID with padding' },
      'SEM_AMT': { tech_name: 'DMBTR', type: 'FLOAT', notes: 'Precision loss risk on large values' },
      'SEM_DATE': { tech_name: 'BUDAT', type: 'DATE', notes: 'Missing time component - date only' },
      'SEM_STATUS': { tech_name: 'BSTAT', type: 'CHAR(1)', notes: 'Single character status code' },
      'SEM_CURR': { tech_name: 'WAERS', type: 'CHAR(5)' },
      'SEM_CUST': { tech_name: 'KUNNR', type: 'VARCHAR(10)' },
      'SEM_TAX': { tech_name: 'MWSTS', type: 'FLOAT' },
      'SEM_QTY': { tech_name: 'MENGE', type: 'DECIMAL(13,3)' }
    }
  },
  {
    id: 'KRNL_SFDC_NA',
    name: 'Salesforce NA',
    type: 'KERNEL',
    owner: 'New York Team',
    color: '#3B82F6',
    schema: {
      'SEM_ID': { tech_name: 'Id', type: 'STRING(18)', pk: true, notes: 'Salesforce ID format (18 chars)' },
      'SEM_AMT': { tech_name: 'Amount', type: 'CURRENCY', notes: 'Native currency type with precision' },
      'SEM_DATE': { tech_name: 'CreatedDate', type: 'DATETIME' },
      'SEM_STATUS': { tech_name: 'Status__c', type: 'PICKLIST', notes: 'Custom picklist field' },
      'SEM_CURR': { tech_name: 'CurrencyIsoCode', type: 'STRING(3)' },
      'SEM_CUST': { tech_name: 'AccountId', type: 'REFERENCE', notes: 'Lookup to Account object' },
      'SEM_TAX': { tech_name: 'TaxAmount__c', type: 'CURRENCY' },
      'SEM_DISC': { tech_name: 'Discount__c', type: 'PERCENT' }
    }
  },
  {
    id: 'TXN_POS_ASIA',
    name: 'POS Asia',
    type: 'TRANSACTIONAL',
    owner: 'Singapore Team',
    color: '#8B5CF6',
    schema: {
      'SEM_ID': { tech_name: 'pos_receipt_id', type: 'BIGINT', pk: true, notes: 'Integer sequence ID (auto-increment)' },
      'SEM_AMT': { tech_name: 'total_net', type: 'DECIMAL(10,2)' },
      'SEM_DATE': { tech_name: 'created_at', type: 'TIMESTAMP' },
      'SEM_STATUS': { tech_name: 'state', type: 'INT', notes: 'Enum stored as integer' },
      'SEM_CURR': { tech_name: 'currency', type: 'VARCHAR(3)' },
      'SEM_CUST': { tech_name: 'member_id', type: 'VARCHAR(50)' },
      'SEM_QTY': { tech_name: 'quantity', type: 'INT' },
      'SEM_UNIT': { tech_name: 'uom', type: 'CHAR(2)' }
    }
  },
  {
    id: 'INT_STRIPE',
    name: 'Stripe Integration',
    type: 'INTEGRATION',
    owner: 'Payments Team',
    color: '#EC4899',
    schema: {
      'SEM_ID': { tech_name: 'id', type: 'STRING', pk: true, notes: 'Stripe object ID (ch_xxx pattern)' },
      'SEM_AMT': { tech_name: 'amount', type: 'INTEGER', notes: 'Amount in smallest currency unit (cents)' },
      'SEM_DATE': { tech_name: 'created', type: 'UNIX_TIMESTAMP', notes: 'Seconds since epoch' },
      'SEM_STATUS': { tech_name: 'status', type: 'STRING', notes: 'succeeded/failed/pending enum' },
      'SEM_CURR': { tech_name: 'currency', type: 'STRING(3)' },
      'SEM_CUST': { tech_name: 'customer', type: 'STRING', notes: 'Stripe customer ID (cus_xxx)' }
    }
  }
];

const AVAILABLE_SPECS = [
  { id: 'SEM_ID', label: 'Unique Identifier', category: 'Core' },
  { id: 'SEM_AMT', label: 'Transaction Value', category: 'Core' },
  { id: 'SEM_DATE', label: 'Event Timestamp', category: 'Core' },
  { id: 'SEM_STATUS', label: 'Lifecycle State', category: 'Core' },
  { id: 'SEM_CURR', label: 'Currency Code', category: 'Core' },
  { id: 'SEM_CUST', label: 'Customer Ref', category: 'Core' },
  { id: 'SEM_TAX', label: 'Tax Amount', category: 'Financial' },
  { id: 'SEM_DISC', label: 'Discount Applied', category: 'Financial' },
  { id: 'SEM_QTY', label: 'Quantity', category: 'Operational' },
  { id: 'SEM_UNIT', label: 'Unit of Measure', category: 'Operational' }
];

// Group specs by category
const SPEC_GROUPS = [
  { name: 'Core', specs: AVAILABLE_SPECS.filter(s => s.category === 'Core') },
  { name: 'Financial', specs: AVAILABLE_SPECS.filter(s => s.category === 'Financial') },
  { name: 'Operational', specs: AVAILABLE_SPECS.filter(s => s.category === 'Operational') }
];

// --- COMPONENTS ---

// 1. DATA CELL (Simplified - HP/Dell/Apple style)
const DenseCell = ({ 
  col, 
  color, 
  density,
  isDifferent 
}: { 
  col?: SchemaColumn; 
  color: string; 
  density: DensityMode;
  isDifferent: boolean;
}) => {
  const densityConfig = tokens.DENSITY[density];
  
  if (!col) return (
    <div 
      className={clsx(densityConfig.row_height, 'bg-[#050505] w-full')}
      role="gridcell"
      aria-label="Not implemented"
    >
      <div className="w-full h-full flex items-center justify-center">
        <span className={clsx('font-mono', tokens.TYPOGRAPHY.meta)} style={{ color: tokens.COLORS.noise_faint }}>
          —
        </span>
      </div>
    </div>
  );

  return (
    <div 
      className={clsx(
        densityConfig.row_height,
        densityConfig.padding,
        'flex items-center justify-between w-full relative group',
        tokens.STATES.hover,
        tokens.STATES.focus,
        tokens.TRANSITIONS.colors
      )}
      style={{ 
        backgroundColor: isDifferent ? 'rgba(245, 158, 11, 0.08)' : tokens.COLORS.void
      }}
      tabIndex={0}
      role="gridcell"
      aria-label={`${col.tech_name} - ${col.type}${isDifferent ? ' - Different from others' : ''}`}
    >
      {/* Simplified: Just tech name + icons */}
      <div className={clsx('flex items-center overflow-hidden', tokens.SPACING.cell_gap_sm)}>
        <span 
          className={clsx(
            'font-mono truncate',
            tokens.TYPOGRAPHY.label,
            tokens.TRACKING.normal
          )}
          style={{ color: tokens.COLORS.signal_secondary }}
        >
          {col.tech_name}
        </span>
        {col.pk && (
          <Key 
            className="w-3 h-3 flex-shrink-0" 
            style={{ color: tokens.COLORS.warning }}
            aria-label="Primary key"
          />
        )}
      </div>
      
      {/* Type badge - smaller, right-aligned */}
      <span 
        className={clsx(
          'font-mono px-1.5 py-0.5 rounded flex-shrink-0',
          tokens.TYPOGRAPHY.meta,
          tokens.TRACKING.normal
        )}
        style={{ 
          backgroundColor: `${color}12`, 
          color: color,
          fontSize: '9px'
        }}
      >
        {col.type.split('(')[0]}
      </span>
      
      {/* Hover Detail Tooltip */}
      {col.notes && (
        <div 
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-3 py-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap max-w-xs',
            tokens.SHADOWS.tooltip,
            tokens.Z_INDEX.tooltip,
            tokens.TYPOGRAPHY.meta,
            tokens.TRANSITIONS.normal
          )}
          style={{
            backgroundColor: tokens.COLORS.structure_primary,
            borderColor: tokens.COLORS.structure_secondary,
            color: tokens.COLORS.noise,
            border: '1px solid'
          }}
          role="tooltip"
        >
          <div className="mb-1" style={{ color: tokens.COLORS.signal_secondary }}>{col.tech_name}</div>
          <div style={{ color: tokens.COLORS.noise }}>{col.type}</div>
          <div className="mt-1 pt-1 border-t" style={{ borderColor: tokens.COLORS.structure_secondary, color: tokens.COLORS.noise_dim }}>
            {col.notes}
          </div>
        </div>
      )}
    </div>
  );
};

// 2. SECTION HEADER ROW
const SectionHeader = ({ 
  name, 
  isCollapsed, 
  onToggle 
}: { 
  name: string; 
  isCollapsed: boolean; 
  onToggle: () => void;
}) => {
  return (
    <tr role="row" className="group">
      <td 
        colSpan={100}
        className={clsx(
          'sticky left-0 border-b-2 cursor-pointer',
          tokens.Z_INDEX.sticky_column,
          tokens.STATES.hover_strong,
          tokens.TRANSITIONS.colors
        )}
        style={{ 
          backgroundColor: tokens.COLORS.matter,
          borderColor: tokens.COLORS.structure_secondary
        }}
        onClick={onToggle}
        role="button"
        aria-expanded={!isCollapsed}
      >
        <div className={clsx('flex items-center py-2 px-4', tokens.SPACING.cell_gap_sm)}>
          <ChevronRight 
            className={clsx('w-4 h-4 transition-transform', isCollapsed ? '' : 'rotate-90')}
            style={{ color: tokens.COLORS.nexus }}
          />
          <span 
            className={clsx('font-mono uppercase', tokens.TYPOGRAPHY.label, tokens.TRACKING.meta_caps)}
            style={{ color: tokens.COLORS.signal }}
          >
            {name}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default function ThePrismPage() {
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(['SEM_ID', 'SEM_AMT', 'SEM_DATE', 'SEM_STATUS', 'SEM_CURR']);
  const [selectedSlots, setSelectedSlots] = useState<(string | null)[]>(['KRNL_SAP_EU', 'KRNL_SFDC_NA', 'INT_STRIPE']);
  const [showSpecMenu, setShowSpecMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState<number | null>(null);
  const [density, setDensity] = useState<DensityMode>('normal');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // Column widths (resizable)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    semantic: 160,
  });
  
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  const activeModels = selectedSlots.map(id => id ? DATASETS.find(d => d.id === id) || null : null);
  const activeSpecs = AVAILABLE_SPECS.filter(s => selectedSpecs.includes(s.id));

  const toggleSpec = (id: string) => {
    setSelectedSpecs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const selectModel = (slotIdx: number, modelId: string) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIdx] = modelId;
    setSelectedSlots(newSlots);
    setShowModelMenu(null);
  };

  const removeModel = (slotIdx: number) => {
    const newSlots = [...selectedSlots];
    newSlots.splice(slotIdx, 1);
    setSelectedSlots(newSlots);
  };

  const addEmptySlot = () => {
    setSelectedSlots([...selectedSlots, null]);
  };

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  // Check if values differ across models for a spec
  const getValueDifferences = (specId: string) => {
    const values = activeModels
      .filter(m => m !== null)
      .map(m => m?.schema[specId]?.tech_name || null);
    const uniqueValues = new Set(values.filter(v => v !== null));
    return uniqueValues.size > 1;
  };

  // Column resizing handlers
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const currentWidth = index === -1 
      ? columnWidths.semantic 
      : (columnWidths[`model_${index}`] || 200);
    
    setResizing({
      index,
      startX: e.clientX,
      startWidth: currentWidth
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(100, Math.min(400, resizing.startWidth + delta));
      
      if (resizing.index === -1) {
        setColumnWidths(prev => ({ ...prev, semantic: newWidth }));
      } else {
        setColumnWidths(prev => ({ ...prev, [`model_${resizing.index}`]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSpecMenu(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setDensity(prev => {
          if (prev === 'compact') return 'normal';
          if (prev === 'normal') return 'comfortable';
          return 'compact';
        });
      }
      if (e.key === 'Escape') {
        setShowSpecMenu(false);
        setShowModelMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <MetaAppShell>
      <div 
        className="h-screen text-[#CCC] flex flex-col overflow-hidden"
        style={{ backgroundColor: tokens.COLORS.void }}
      >
        {/* TOOLBAR */}
        <div 
          className={clsx(
            'h-14 border-b flex items-center justify-between flex-shrink-0 relative',
            tokens.SPACING.header_padding_x,
            tokens.BORDERS.primary,
            tokens.Z_INDEX.sticky_intersection
          )}
          style={{ backgroundColor: tokens.COLORS.elevated }}
          role="toolbar"
          aria-label="Table controls"
        >
          <div className={clsx('flex items-center', tokens.SPACING.section_gap)}>
            <Link 
              to="/meta-registry" 
              className={clsx(
                'p-1.5 rounded',
                tokens.STATES.hover_strong,
                tokens.STATES.focus,
                tokens.TRANSITIONS.colors
              )}
              style={{ color: tokens.COLORS.noise_dim }}
              onMouseEnter={(e) => e.currentTarget.style.color = tokens.COLORS.signal}
              onMouseLeave={(e) => e.currentTarget.style.color = tokens.COLORS.noise_dim}
              aria-label="Back to registry"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div 
              className="h-6 w-px" 
              style={{ backgroundColor: tokens.COLORS.structure_primary }}
              aria-hidden="true"
            />
            <div className={clsx('flex items-center', tokens.SPACING.cell_gap_sm)}>
              <div 
                className="w-6 h-6 rounded flex items-center justify-center border"
                style={{ 
                  backgroundColor: '#0A1A10',
                  borderColor: tokens.COLORS.nexus
                }}
                aria-hidden="true"
              >
                <ScanLine className="w-3.5 h-3.5" style={{ color: tokens.COLORS.nexus }} />
              </div>
              <span 
                className={clsx('font-mono uppercase', tokens.TYPOGRAPHY.value, tokens.TRACKING.tight)}
                style={{ color: tokens.COLORS.signal }}
              >
                The Prism
              </span>
              <span 
                className={clsx('font-mono uppercase', tokens.TYPOGRAPHY.meta, tokens.TRACKING.meta_caps)}
                style={{ color: tokens.COLORS.noise_dim }}
              >
                Pro v4
              </span>
            </div>
          </div>

          <div className={clsx('flex items-center', tokens.SPACING.cell_gap_sm)}>
            {/* Density Toggle */}
            <button
              onClick={() => setDensity(prev => {
                if (prev === 'compact') return 'normal';
                if (prev === 'normal') return 'comfortable';
                return 'compact';
              })}
              className={clsx(
                'flex items-center px-3 py-1.5 border rounded font-mono uppercase',
                tokens.TYPOGRAPHY.meta,
                tokens.TRACKING.meta_caps,
                tokens.STATES.hover,
                tokens.STATES.focus,
                tokens.TRANSITIONS.colors,
                tokens.BORDERS.primary
              )}
              style={{
                backgroundColor: tokens.COLORS.void,
                color: tokens.COLORS.noise
              }}
              title="Cmd+D to toggle"
              aria-label={`Current density: ${density}. Click to change.`}
            >
              {density === 'compact' && <Minimize2 className="w-3.5 h-3.5 mr-1.5" />}
              {density === 'comfortable' && <Maximize2 className="w-3.5 h-3.5 mr-1.5" />}
              <span>{density}</span>
            </button>

            {/* Specs Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowSpecMenu(!showSpecMenu)}
                className={clsx(
                  'flex items-center px-3 py-1.5 border rounded font-mono uppercase',
                  tokens.TYPOGRAPHY.meta,
                  tokens.TRACKING.meta_caps,
                  tokens.STATES.hover,
                  tokens.STATES.focus,
                  tokens.TRANSITIONS.colors,
                  showSpecMenu ? tokens.BORDERS.active : tokens.BORDERS.primary
                )}
                style={{
                  backgroundColor: showSpecMenu ? tokens.COLORS.structure_subtle : tokens.COLORS.void,
                  color: showSpecMenu ? tokens.COLORS.nexus : tokens.COLORS.noise
                }}
                aria-label={`Filter specs. ${selectedSpecs.length} selected. Press Cmd+K`}
                aria-expanded={showSpecMenu}
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <span>Specs ({selectedSpecs.length})</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showSpecMenu && (
                <>
                  <div 
                    className={clsx('fixed inset-0', tokens.Z_INDEX.dropdown)} 
                    onClick={() => setShowSpecMenu(false)}
                    aria-hidden="true"
                  />
                  <div 
                    className={clsx(
                      'absolute top-full right-0 mt-2 w-72 rounded p-2',
                      tokens.Z_INDEX.dropdown,
                      tokens.SHADOWS.modal,
                      tokens.BORDERS.width_2,
                      tokens.BORDERS.active
                    )}
                    style={{ backgroundColor: tokens.COLORS.matter }}
                    role="menu"
                    aria-label="Spec filter menu"
                  >
                    <div 
                      className={clsx(
                        'flex items-center justify-between mb-2 pb-2 border-b',
                        tokens.BORDERS.primary
                      )}
                    >
                      <div 
                        className={clsx('uppercase font-mono', tokens.TYPOGRAPHY.meta, tokens.TRACKING.meta_caps)}
                        style={{ color: tokens.COLORS.noise_dim }}
                      >
                        Visible Columns
                      </div>
                      <button 
                        onClick={() => setSelectedSpecs([])}
                        className={clsx(
                          'uppercase font-mono flex items-center',
                          tokens.TYPOGRAPHY.meta,
                          tokens.TRACKING.meta_caps,
                          tokens.STATES.focus,
                          tokens.TRANSITIONS.colors,
                          tokens.SPACING.cell_gap_sm
                        )}
                        style={{ color: tokens.COLORS.noise_dim }}
                        onMouseEnter={(e) => e.currentTarget.style.color = tokens.COLORS.nexus}
                        onMouseLeave={(e) => e.currentTarget.style.color = tokens.COLORS.noise_dim}
                        aria-label="Clear all selections"
                      >
                        <Eraser className="w-3 h-3" /> Clear
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-1">
                      {AVAILABLE_SPECS.map(spec => (
                        <button 
                          key={spec.id} 
                          onClick={() => toggleSpec(spec.id)} 
                          className={clsx(
                            'w-full flex items-center px-2 py-2 rounded text-left',
                            tokens.SPACING.cell_gap_md,
                            tokens.STATES.hover_strong,
                            tokens.STATES.focus,
                            tokens.TRANSITIONS.colors
                          )}
                          role="menuitemcheckbox"
                          aria-checked={selectedSpecs.includes(spec.id)}
                        >
                          <div 
                            className={clsx(
                              'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                              selectedSpecs.includes(spec.id) ? tokens.BORDERS.active : 'border-[#444]'
                            )}
                            style={{ 
                              backgroundColor: selectedSpecs.includes(spec.id) ? tokens.COLORS.nexus : 'transparent'
                            }}
                          >
                            {selectedSpecs.includes(spec.id) && (
                              <Check className="w-2.5 h-2.5" style={{ color: tokens.COLORS.void }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div 
                              className={clsx(tokens.TYPOGRAPHY.label, tokens.TRACKING.normal)}
                              style={{ color: tokens.COLORS.signal_secondary }}
                            >
                              {spec.label}
                            </div>
                            <div className={clsx('flex items-center mt-0.5', tokens.SPACING.cell_gap_sm)}>
                              <span 
                                className={clsx('font-mono', tokens.TYPOGRAPHY.meta)}
                                style={{ color: tokens.COLORS.noise_dim }}
                              >
                                {spec.id}
                              </span>
                              <span style={{ color: tokens.COLORS.structure_secondary }}>•</span>
                              <span 
                                className={tokens.TYPOGRAPHY.meta}
                                style={{ color: tokens.COLORS.noise_faint }}
                              >
                                {spec.category}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              className={clsx(
                'p-2 rounded',
                tokens.STATES.hover,
                tokens.STATES.focus,
                tokens.TRANSITIONS.colors
              )}
              style={{ color: tokens.COLORS.noise_dim }}
              onMouseEnter={(e) => e.currentTarget.style.color = tokens.COLORS.signal}
              onMouseLeave={(e) => e.currentTarget.style.color = tokens.COLORS.noise_dim}
              title="Export to CSV"
              aria-label="Export table to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THE GRID */}
        <div 
          className="flex-1 min-h-0 overflow-auto relative"
          style={{ 
            backgroundColor: tokens.COLORS.void,
            cursor: resizing ? 'col-resize' : 'default'
          }}
          role="region"
          aria-label="Data comparison grid"
        >
          {activeSpecs.length === 0 ? (
            // Empty State
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div 
                  className={clsx(
                    'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                    tokens.BORDERS.width_2,
                    tokens.BORDERS.primary
                  )}
                  style={{ backgroundColor: tokens.COLORS.matter }}
                  aria-hidden="true"
                >
                  <Filter className="w-8 h-8" style={{ color: tokens.COLORS.structure_secondary }} />
                </div>
                <h3 
                  className={clsx('mb-2', tokens.TYPOGRAPHY.heading)}
                  style={{ color: tokens.COLORS.signal }}
                >
                  No Specifications Selected
                </h3>
                <p 
                  className={clsx('mb-4', tokens.TYPOGRAPHY.value)}
                  style={{ color: tokens.COLORS.noise_dim }}
                >
                  Choose specs from the filter menu to start comparing implementations.
                </p>
                <button 
                  onClick={() => setShowSpecMenu(true)}
                  className={clsx(
                    'px-4 py-2 font-mono uppercase rounded',
                    tokens.TYPOGRAPHY.label,
                    tokens.TRACKING.meta_caps,
                    tokens.STATES.focus,
                    tokens.TRANSITIONS.colors
                  )}
                  style={{ 
                    backgroundColor: tokens.COLORS.nexus,
                    color: tokens.COLORS.void
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.COLORS.nexus_dim}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.COLORS.nexus}
                >
                  Select Specs
                </button>
                <div 
                  className={clsx('mt-4 font-mono', tokens.TYPOGRAPHY.meta)}
                  style={{ color: tokens.COLORS.noise_faint }}
                >
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: tokens.COLORS.structure_primary }}>⌘K</kbd> to open filter
                </div>
              </div>
            </div>
          ) : (
            <table 
              className="w-full border-separate border-spacing-0"
              role="grid"
              aria-label="Schema morphology comparison table"
              style={{ tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: `${columnWidths.semantic}px` }} />
                {selectedSlots.map((slot, idx) => (
                  <col 
                    key={idx} 
                    style={{ 
                      width: slot !== null 
                        ? `${columnWidths[`model_${idx}`] || 200}px` 
                        : '48px'
                    }} 
                  />
                ))}
              </colgroup>
              
              {/* HEADER ROW */}
              <thead>
                <tr role="row">
                  <th 
                    className={clsx(
                      'sticky top-0 left-0 text-left border-r border-b relative',
                      tokens.DENSITY[density].header_height,
                      tokens.SPACING.header_padding_x,
                      tokens.Z_INDEX.sticky_intersection,
                      tokens.BORDERS.primary,
                      tokens.SHADOWS.sticky_intersection
                    )}
                    style={{ backgroundColor: tokens.COLORS.matter }}
                    role="columnheader"
                    scope="col"
                  >
                    <div className={clsx('flex items-center', tokens.SPACING.cell_gap_sm)}>
                      <Database 
                        className="w-3.5 h-3.5" 
                        style={{ color: tokens.COLORS.noise_dim }}
                        aria-hidden="true"
                      />
                      <span 
                        className={clsx('font-mono uppercase truncate', tokens.TYPOGRAPHY.meta, tokens.TRACKING.meta_caps)}
                        style={{ color: tokens.COLORS.noise_dim }}
                      >
                        Semantic
                      </span>
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#28E7A2] transition-colors group"
                      onMouseDown={(e) => handleResizeStart(-1, e)}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <GripVertical 
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 opacity-0 group-hover:opacity-100" 
                        style={{ color: tokens.COLORS.nexus }}
                      />
                    </div>
                  </th>

                  {selectedSlots.map((slot, idx) => {
                    const model = activeModels[idx];
                    
                    if (!model) {
                      return (
                        <th
                          key={idx}
                          className={clsx(
                            'sticky top-0 border-r border-b p-0 align-top relative',
                            tokens.DENSITY[density].header_height,
                            tokens.Z_INDEX.sticky_header,
                            tokens.BORDERS.primary
                          )}
                          style={{ backgroundColor: tokens.COLORS.elevated }}
                          role="columnheader"
                          scope="col"
                        >
                          <button
                            onClick={addEmptySlot}
                            className={clsx(
                              'w-full h-full flex items-center justify-center',
                              tokens.STATES.hover_strong,
                              tokens.STATES.focus,
                              tokens.TRANSITIONS.colors
                            )}
                            style={{ color: tokens.COLORS.noise_faint }}
                            onMouseEnter={(e) => e.currentTarget.style.color = tokens.COLORS.nexus}
                            onMouseLeave={(e) => e.currentTarget.style.color = tokens.COLORS.noise_faint}
                            aria-label="Add model"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      );
                    }

                    return (
                      <th
                        key={idx}
                        className={clsx(
                          'sticky top-0 p-0 align-top border-r border-b relative',
                          tokens.DENSITY[density].header_height,
                          tokens.Z_INDEX.sticky_header,
                          tokens.BORDERS.primary,
                          tokens.SHADOWS.sticky_header
                        )}
                        style={{ backgroundColor: tokens.COLORS.matter }}
                        role="columnheader"
                        aria-label={`${model.name} column`}
                      >
                        <div className={clsx(
                          'w-full h-full flex items-center justify-between group relative',
                          tokens.DENSITY[density].padding
                        )}>
                          <div className={clsx('flex items-center overflow-hidden', tokens.SPACING.cell_gap_sm)}>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: model.color }}
                              aria-hidden="true"
                            />
                            <div className="flex flex-col items-start min-w-0">
                              <span 
                                className={clsx('truncate w-full', tokens.TYPOGRAPHY.label, tokens.TRACKING.tight)}
                                style={{ color: tokens.COLORS.signal }}
                              >
                                {model.name}
                              </span>
                              <span 
                                className={clsx('font-mono truncate w-full', tokens.TYPOGRAPHY.meta)}
                                style={{ color: tokens.COLORS.noise_dim }}
                              >
                                {model.owner}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeModel(idx)}
                            className={clsx(
                              'opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0',
                              tokens.STATES.hover_strong,
                              tokens.TRANSITIONS.normal,
                              tokens.STATES.focus
                            )}
                            style={{ color: tokens.COLORS.noise_dim }}
                            onMouseEnter={(e) => e.currentTarget.style.color = tokens.COLORS.error}
                            onMouseLeave={(e) => e.currentTarget.style.color = tokens.COLORS.noise_dim}
                            aria-label={`Remove ${model.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-[2px]" 
                            style={{ backgroundColor: model.color }}
                            aria-hidden="true"
                          />
                        </div>
                        <div
                          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#28E7A2] transition-colors group/resize"
                          onMouseDown={(e) => handleResizeStart(idx, e)}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <GripVertical 
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 opacity-0 group-hover/resize:opacity-100" 
                            style={{ color: tokens.COLORS.nexus }}
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* DATA ROWS WITH SECTION GROUPING */}
              <tbody role="rowgroup">
                {SPEC_GROUPS.map(group => {
                  const groupSpecs = group.specs.filter(s => selectedSpecs.includes(s.id));
                  if (groupSpecs.length === 0) return null;
                  
                  const isCollapsed = collapsedSections.has(group.name);
                  
                  return (
                    <React.Fragment key={group.name}>
                      <SectionHeader 
                        name={group.name}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleSection(group.name)}
                      />
                      {!isCollapsed && groupSpecs.map((spec) => {
                        const isDifferent = getValueDifferences(spec.id);
                        
                        return (
                          <tr 
                            key={spec.id} 
                            className="group"
                            role="row"
                          >
                            <td 
                              className={clsx(
                                'sticky left-0 border-r border-b',
                                tokens.DENSITY[density].padding,
                                tokens.Z_INDEX.sticky_column,
                                tokens.BORDERS.primary,
                                tokens.SHADOWS.sticky_column,
                                tokens.TRANSITIONS.colors
                              )}
                              style={{ 
                                backgroundColor: tokens.COLORS.elevated
                              }}
                              role="rowheader"
                              scope="row"
                            >
                              <div className="flex items-center justify-between">
                                <span 
                                  className={clsx('truncate', tokens.TYPOGRAPHY.label, tokens.TRACKING.tight)}
                                  style={{ color: tokens.COLORS.signal_secondary }}
                                  title={spec.label}
                                >
                                  {spec.label}
                                </span>
                                {isDifferent && (
                                  <span 
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
                                    style={{ 
                                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                      color: tokens.COLORS.warning
                                    }}
                                    title="Different implementations"
                                  >
                                    Diff
                                  </span>
                                )}
                              </div>
                            </td>

                            {selectedSlots.map((slot, colIdx) => {
                              const model = activeModels[colIdx];
                              return (
                                <td 
                                  key={colIdx} 
                                  className={clsx('border-r border-b p-0 align-middle', tokens.BORDERS.primary)}
                                  style={{ backgroundColor: tokens.COLORS.void }}
                                  role="gridcell"
                                >
                                  <DenseCell 
                                    col={model?.schema[spec.id]} 
                                    color={model?.color || tokens.COLORS.structure_secondary}
                                    density={density}
                                    isDifferent={isDifferent && model?.schema[spec.id] !== undefined}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MetaAppShell>
  );
}
