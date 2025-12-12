// ============================================================================
// BIOSKIN: FieldContextSidebar - Nervous System Hook-in
// ============================================================================
// Opens when a row/field is clicked, showing field context and metadata
// 🛡️ GOVERNANCE: Only uses Surface, Txt, Btn, StatusDot
// ============================================================================

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { Btn } from '@/components/ui/Btn';
import { StatusDot } from '@/components/ui/StatusDot';
import { BioObject } from './BioObject';
import type { ExtendedMetadataField } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface FieldContextSidebarProps {
  /** Field metadata from Kernel */
  fieldMeta?: ExtendedMetadataField;
  /** Record data (for context) */
  record?: Record<string, unknown>;
  /** Full schema (for BioObject rendering) */
  schema?: ExtendedMetadataField[];
  /** Is sidebar open? */
  open: boolean;
  /** Close handler */
  onClose: () => void;
}

// ============================================================================
// FIELD CONTEXT SIDEBAR
// ============================================================================

export function FieldContextSidebar({
  fieldMeta,
  record,
  schema,
  open,
  onClose,
}: FieldContextSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-surface-base border-l border-border-surface-base shadow-lg z-50 flex flex-col">
      {/* Header */}
      <Surface variant="flat" className="p-4 border-b border-border-surface-base flex items-center justify-between shrink-0">
        <Txt variant="h3">Field Context</Txt>
        <Btn variant="secondary" size="sm" onClick={onClose} title="Close">
          <X className="w-4 h-4" />
        </Btn>
      </Surface>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Field Metadata */}
        {fieldMeta && (
          <Surface variant="base" className="p-4">
            <Txt variant="h4" className="mb-4">
              {fieldMeta.business_term}
            </Txt>
            <div className="space-y-2">
              <div>
                <Txt variant="small" className="text-text-tertiary">
                  Technical Name
                </Txt>
                <Txt variant="body" className="font-mono">
                  {fieldMeta.technical_name}
                </Txt>
              </div>
              {fieldMeta.description && (
                <div>
                  <Txt variant="small" className="text-text-tertiary">
                    Description
                  </Txt>
                  <Txt variant="body">{fieldMeta.description}</Txt>
                </div>
              )}
              <div>
                <Txt variant="small" className="text-text-tertiary">
                  Data Type
                </Txt>
                <Txt variant="body">{fieldMeta.data_type}</Txt>
              </div>
              {fieldMeta.is_critical && (
                <div className="flex items-center gap-2">
                  <StatusDot variant="warning" size="sm" />
                  <Txt variant="small">Critical Field</Txt>
                </div>
              )}
            </div>
          </Surface>
        )}

        {/* Full Record (BioObject) */}
        {record && schema && (
          <div>
            <Txt variant="h4" className="mb-4">
              Record Details
            </Txt>
            <BioObject schema={schema} data={record} intent="view" />
          </div>
        )}
      </div>
    </div>
  );
}
