/**
 * BioDropzone - File upload dropzone component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade file upload with drag-drop, preview.
 *
 * @example
 * // Basic usage
 * <BioDropzone onFilesSelected={handleFiles} />
 *
 * @example
 * // Full featured
 * <BioDropzone
 *   onFilesSelected={handleFiles}
 *   accept={{ 'image/*': ['.png', '.jpg'] }}
 *   maxFiles={5}
 *   maxSize={5 * 1024 * 1024}
 * />
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';

// ============================================================
// Types
// ============================================================

export type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadedFile {
  /** Unique identifier */
  id: string;
  /** File object */
  file: File;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: FileStatus;
  /** Error message if failed */
  error?: string;
  /** Preview URL for images */
  preview?: string;
}

export interface BioDropzoneProps {
  /** Called when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Called when file is removed */
  onFileRemove?: (fileId: string) => void;
  /** Accepted file types */
  accept?: Record<string, string[]>;
  /** Max number of files */
  maxFiles?: number;
  /** Max file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Show file previews */
  showPreviews?: boolean;
  /** Current uploaded files (controlled) */
  files?: UploadedFile[];
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Helper text */
  helperText?: string;
  /** Custom label */
  label?: string;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'DROP01',
  version: '1.0.0',
  name: 'BioDropzone',
  family: 'UPLOAD',
  purpose: 'INPUT',
  poweredBy: 'native',
  status: 'active',
} as const;

// ============================================================
// Helper Functions
// ============================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return File;
}

function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================
// FilePreview Component
// ============================================================

interface FilePreviewProps {
  file: UploadedFile;
  onRemove?: (id: string) => void;
  showProgress?: boolean;
}

function FilePreview({ file, onRemove, showProgress = true }: FilePreviewProps) {
  const FileIcon = getFileIcon(file.file.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-lg',
        'bg-surface-subtle border border-default',
        file.status === 'error' && 'border-status-danger bg-status-danger/5'
      )}
      data-testid="file-preview"
    >
      {/* Preview/Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-surface-card flex items-center justify-center">
        {file.preview ? (
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className="w-5 h-5 text-text-secondary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Txt variant="body" weight="medium" className="truncate">
          {file.file.name}
        </Txt>
        <div className="flex items-center gap-2 mt-0.5">
          <Txt variant="caption" color="tertiary">
            {formatFileSize(file.file.size)}
          </Txt>
          {file.error && (
            <Txt variant="caption" color="danger">
              {file.error}
            </Txt>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && file.status === 'uploading' && (
          <div className="mt-2 h-1 bg-surface-card rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Status/Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {file.status === 'uploading' && (
          <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
        )}
        {file.status === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-status-success" />
        )}
        {file.status === 'error' && (
          <AlertCircle className="w-4 h-4 text-status-danger" />
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(file.id)}
            className="p-1 rounded hover:bg-surface-hover transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Component
// ============================================================

export function BioDropzone({
  onFilesSelected,
  onFileRemove,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  showPreviews = true,
  files = [],
  disabled = false,
  className,
  helperText,
  label = 'Drag & drop files here, or click to select',
}: BioDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [internalFiles, setInternalFiles] = React.useState<UploadedFile[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Use controlled or internal files
  const displayFiles = files.length > 0 ? files : internalFiles;

  // Build accept string
  const acceptString = accept
    ? Object.entries(accept)
        .flatMap(([mime, exts]) => [mime, ...exts])
        .join(',')
    : undefined;

  // Validate files
  const validateFiles = React.useCallback(
    (fileList: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of fileList) {
        // Check max files
        if (valid.length + displayFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Check file size
        if (file.size > maxSize) {
          errors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
          continue;
        }

        // Check file type
        if (accept) {
          const isValid = Object.entries(accept).some(([mime, exts]) => {
            if (mime.endsWith('/*')) {
              return file.type.startsWith(mime.slice(0, -2));
            }
            return file.type === mime || exts.some(ext => file.name.endsWith(ext));
          });

          if (!isValid) {
            errors.push(`${file.name} is not an accepted file type`);
            continue;
          }
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [accept, maxFiles, maxSize, displayFiles.length]
  );

  // Handle file selection
  const handleFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      const { valid } = validateFiles(Array.from(fileList));

      if (valid.length > 0) {
        // Create preview URLs for images
        const newFiles: UploadedFile[] = valid.map(file => ({
          id: generateId(),
          file,
          progress: 0,
          status: 'pending' as FileStatus,
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
        }));

        setInternalFiles(prev => [...prev, ...newFiles]);
        onFilesSelected(valid);
      }
    },
    [disabled, validateFiles, onFilesSelected]
  );

  // Handle remove
  const handleRemove = React.useCallback(
    (id: string) => {
      setInternalFiles(prev => {
        const file = prev.find(f => f.id === id);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return prev.filter(f => f.id !== id);
      });
      onFileRemove?.(id);
    },
    [onFileRemove]
  );

  // Drag handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // Click handler
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  // Cleanup previews
  React.useEffect(() => {
    return () => {
      internalFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-dropzone">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative p-8 border-2 border-dashed rounded-lg transition-all duration-200',
          'flex flex-col items-center justify-center gap-3 cursor-pointer',
          'hover:border-accent-primary/50 hover:bg-accent-primary/5',
          isDragOver && 'border-accent-primary bg-accent-primary/10 scale-[1.01]',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border-default hover:bg-transparent'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptString}
          onChange={e => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <motion.div
          animate={{ y: isDragOver ? -5 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Upload
            className={cn(
              'w-10 h-10',
              isDragOver ? 'text-accent-primary' : 'text-text-muted'
            )}
          />
        </motion.div>

        <div className="text-center">
          <Txt
            variant="body"
            weight="medium"
            color={isDragOver ? 'brand' : 'secondary'}
          >
            {label}
          </Txt>
          {helperText && (
            <Txt variant="caption" color="tertiary" className="mt-1">
              {helperText}
            </Txt>
          )}
          {accept && (
            <Txt variant="micro" color="tertiary" className="mt-2">
              Accepted: {Object.values(accept).flat().join(', ')}
            </Txt>
          )}
          <Txt variant="micro" color="tertiary" className="mt-1">
            Max size: {formatFileSize(maxSize)} · Max files: {maxFiles}
          </Txt>
        </div>
      </div>

      {/* File previews */}
      {showPreviews && displayFiles.length > 0 && (
        <div className="p-4 border-t border-default space-y-2">
          <AnimatePresence>
            {displayFiles.map(file => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </Surface>
  );
}

BioDropzone.displayName = 'BioDropzone';
