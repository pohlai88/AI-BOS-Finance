/**
 * BioTableImport - CSV/Excel import component
 *
 * Provides a UI for importing data from CSV files with:
 * - File upload (drag & drop or click)
 * - Column mapping
 * - Preview
 * - Validation
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { introspectZodSchema, type BioFieldDefinition } from '../../introspector/ZodSchemaIntrospector';

// ============================================================
// Types
// ============================================================

export interface BioTableImportProps<T extends z.ZodRawShape> {
  /** Zod schema for validation */
  schema: z.ZodObject<T>;
  /** Called when import is complete */
  onImport: (data: z.infer<z.ZodObject<T>>[]) => void;
  /** Called when dialog should close */
  onClose?: () => void;
  /** Enable auto column mapping */
  autoMapColumns?: boolean;
  /** Required fields that must be mapped */
  requiredFields?: (keyof T)[];
  /** Maximum rows to import */
  maxRows?: number;
  /** Show preview */
  showPreview?: boolean;
  /** Additional className */
  className?: string;
}

interface ColumnMapping {
  csvHeader: string;
  schemaField: string | null;
  confidence: number;
}

interface ParsedRow {
  original: Record<string, string>;
  mapped: Record<string, unknown>;
  errors: string[];
  isValid: boolean;
}

// ============================================================
// CSV Parser
// ============================================================

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, j) => {
      row[header] = values[j] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// ============================================================
// Auto-mapper
// ============================================================

function autoMapColumns(
  csvHeaders: string[],
  schemaFields: BioFieldDefinition[]
): ColumnMapping[] {
  return csvHeaders.map((csvHeader) => {
    const normalizedHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');

    let bestMatch: { field: string; confidence: number } = { field: '', confidence: 0 };

    for (const field of schemaFields) {
      const normalizedField = field.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Exact match
      if (normalizedHeader === normalizedField || normalizedHeader === normalizedLabel) {
        bestMatch = { field: field.name, confidence: 1 };
        break;
      }

      // Partial match
      if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
        const confidence = Math.min(normalizedHeader.length, normalizedField.length) /
          Math.max(normalizedHeader.length, normalizedField.length);
        if (confidence > bestMatch.confidence) {
          bestMatch = { field: field.name, confidence };
        }
      }

      if (normalizedHeader.includes(normalizedLabel) || normalizedLabel.includes(normalizedHeader)) {
        const confidence = Math.min(normalizedHeader.length, normalizedLabel.length) /
          Math.max(normalizedHeader.length, normalizedLabel.length);
        if (confidence > bestMatch.confidence) {
          bestMatch = { field: field.name, confidence };
        }
      }
    }

    return {
      csvHeader,
      schemaField: bestMatch.confidence >= 0.5 ? bestMatch.field : null,
      confidence: bestMatch.confidence,
    };
  });
}

// ============================================================
// Component
// ============================================================

export function BioTableImport<T extends z.ZodRawShape>({
  schema,
  onImport,
  onClose,
  autoMapColumns: enableAutoMap = true,
  requiredFields = [],
  maxRows = 10000,
  showPreview = true,
  className,
}: BioTableImportProps<T>) {
  const [step, setStep] = React.useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = React.useState<File | null>(null);
  const [csvData, setCsvData] = React.useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [mappings, setMappings] = React.useState<ColumnMapping[]>([]);
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Introspect schema
  const schemaDefinition = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);

      if (parsed.rows.length > maxRows) {
        alert(`File contains ${parsed.rows.length} rows. Maximum allowed is ${maxRows}.`);
        setIsProcessing(false);
        return;
      }

      setCsvData(parsed);

      // Auto-map columns
      if (enableAutoMap) {
        const autoMappings = autoMapColumns(parsed.headers, schemaDefinition.fields);
        setMappings(autoMappings);
      } else {
        setMappings(parsed.headers.map(h => ({ csvHeader: h, schemaField: null, confidence: 0 })));
      }

      setStep('mapping');
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      alert('Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Update mapping
  const updateMapping = (csvHeader: string, schemaField: string | null) => {
    setMappings(prev => prev.map(m =>
      m.csvHeader === csvHeader ? { ...m, schemaField, confidence: schemaField ? 1 : 0 } : m
    ));
  };

  // Process data with current mappings
  const processData = React.useCallback(() => {
    if (!csvData) return;

    const rows: ParsedRow[] = csvData.rows.map(row => {
      const mapped: Record<string, unknown> = {};
      const errors: string[] = [];

      // Apply mappings
      mappings.forEach(mapping => {
        if (mapping.schemaField) {
          const field = schemaDefinition.fields.find(f => f.name === mapping.schemaField);
          let value: unknown = row[mapping.csvHeader];

          // Type conversion
          if (field) {
            try {
              switch (field.type) {
                case 'number':
                  value = value ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) : undefined;
                  if (isNaN(value as number)) value = undefined;
                  break;
                case 'boolean':
                  const lower = String(value).toLowerCase();
                  value = lower === 'true' || lower === 'yes' || lower === '1';
                  break;
                case 'date':
                  if (value) {
                    const date = new Date(String(value));
                    value = isNaN(date.getTime()) ? undefined : date.toISOString();
                  }
                  break;
                default:
                  value = value || undefined;
              }
            } catch {
              errors.push(`Invalid value for ${field.label}`);
            }
          }

          mapped[mapping.schemaField] = value;
        }
      });

      // Check required fields
      requiredFields.forEach(field => {
        if (mapped[field as string] === undefined || mapped[field as string] === '') {
          errors.push(`Missing required field: ${String(field)}`);
        }
      });

      // Validate against schema
      const result = schema.safeParse(mapped);
      if (!result.success) {
        result.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }

      return {
        original: row,
        mapped,
        errors,
        isValid: errors.length === 0,
      };
    });

    setParsedRows(rows);
    setStep('preview');
  }, [csvData, mappings, schemaDefinition, requiredFields, schema]);

  // Handle import
  const handleImport = () => {
    const validRows = parsedRows
      .filter(r => r.isValid)
      .map(r => r.mapped as z.infer<z.ZodObject<T>>);

    onImport(validRows);
    onClose?.();
  };

  // Check if all required fields are mapped
  const allRequiredMapped = requiredFields.every(field =>
    mappings.some(m => m.schemaField === field)
  );

  const validRowCount = parsedRows.filter(r => r.isValid).length;
  const invalidRowCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Surface padding="lg" className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Txt variant="heading" as="h2">
          Import Data
        </Txt>
        {onClose && (
          <Btn variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Btn>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        {['upload', 'mapping', 'preview'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              'flex items-center gap-2',
              step === s ? 'text-accent-primary' : 'text-text-tertiary'
            )}>
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-small',
                step === s ? 'bg-accent-primary text-white' :
                  ['upload', 'mapping', 'preview'].indexOf(step) > i ? 'bg-status-success text-white' : 'bg-surface-nested'
              )}>
                {['upload', 'mapping', 'preview'].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <Txt variant="small" color={step === s ? 'primary' : 'tertiary'}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Txt>
            </div>
            {i < 2 && (
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            dragOver ? 'border-accent-primary bg-accent-primary/5' : 'border-default hover:border-accent-primary/50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <Txt variant="body" color="primary" className="mb-2">
            Drop your CSV file here or click to browse
          </Txt>
          <Txt variant="small" color="tertiary">
            Supports .csv files up to {maxRows.toLocaleString()} rows
          </Txt>
        </div>
      )}

      {step === 'mapping' && csvData && (
        <div className="space-y-4">
          <Txt variant="body" color="secondary">
            Map CSV columns to data fields. Auto-mapped columns are highlighted.
          </Txt>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {mappings.map((mapping) => (
              <div
                key={mapping.csvHeader}
                className="flex items-center gap-4 p-3 bg-surface-subtle rounded-lg"
              >
                <div className="flex-1">
                  <Txt variant="label" color="primary">
                    {mapping.csvHeader}
                  </Txt>
                  <Txt variant="caption" color="tertiary">
                    Sample: {csvData.rows[0]?.[mapping.csvHeader] || '—'}
                  </Txt>
                </div>

                <ArrowRight className="h-4 w-4 text-text-tertiary" />

                <select
                  value={mapping.schemaField || ''}
                  onChange={(e) => updateMapping(mapping.csvHeader, e.target.value || null)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-body',
                    'bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/30',
                    mapping.confidence >= 0.8 ? 'border-status-success' :
                      mapping.confidence >= 0.5 ? 'border-status-warning' : 'border-default'
                  )}
                >
                  <option value="">— Skip this column —</option>
                  {schemaDefinition.fields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.label}
                      {requiredFields.includes(field.name as keyof T) ? ' *' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {!allRequiredMapped && (
            <div className="flex items-center gap-2 text-status-warning">
              <AlertTriangle className="h-4 w-4" />
              <Txt variant="small" color="inherit">
                Please map all required fields marked with *
              </Txt>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setStep('upload')}>
              Back
            </Btn>
            <Btn
              variant="primary"
              onClick={processData}
              disabled={!allRequiredMapped}
            >
              Preview Import
            </Btn>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-success" />
              <Txt variant="body">{validRowCount} valid rows</Txt>
            </div>
            {invalidRowCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-danger" />
                <Txt variant="body">{invalidRowCount} rows with errors (will be skipped)</Txt>
              </div>
            )}
          </div>

          {/* Preview Table */}
          {showPreview && (
            <div className="max-h-[250px] overflow-auto border border-default rounded-lg">
              <table className="w-full text-small">
                <thead className="bg-surface-subtle sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    {mappings.filter(m => m.schemaField).slice(0, 5).map(m => (
                      <th key={m.schemaField} className="px-3 py-2 text-left font-medium">
                        {schemaDefinition.fields.find(f => f.name === m.schemaField)?.label || m.schemaField}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {parsedRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className={row.isValid ? '' : 'bg-status-danger/5'}>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <Check className="h-4 w-4 text-status-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-status-danger" />
                        )}
                      </td>
                      {mappings.filter(m => m.schemaField).slice(0, 5).map(m => (
                        <td key={m.schemaField} className="px-3 py-2">
                          {String(row.mapped[m.schemaField!] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 10 && (
                <div className="px-3 py-2 text-center text-text-tertiary bg-surface-subtle border-t border-default">
                  ...and {parsedRows.length - 10} more rows
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setStep('mapping')}>
              Back
            </Btn>
            <Btn
              variant="primary"
              onClick={handleImport}
              disabled={validRowCount === 0}
            >
              Import {validRowCount} Rows
            </Btn>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-accent-primary" />
          <Txt variant="body" color="secondary" className="ml-2">
            Processing...
          </Txt>
        </div>
      )}
    </Surface>
  );
}

BioTableImport.displayName = 'BioTableImport';
