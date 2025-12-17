/**
 * BioTimelineAttachment - Attachment display for timeline items
 *
 * Features:
 * - File type icons
 * - Image thumbnails
 * - Download links
 * - File size display
 * - Preview modal
 */

'use client';

import * as React from 'react';
import {
  FileText,
  Image,
  File,
  FileSpreadsheet,
  FileCode,
  Film,
  Music,
  Archive,
  Download,
  ExternalLink,
  Eye,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface TimelineAttachment {
  /** Unique ID */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** URL to file */
  url: string;
  /** Thumbnail URL (for images) */
  thumbnailUrl?: string;
  /** Upload date */
  uploadedAt?: Date | string;
  /** Uploader info */
  uploadedBy?: {
    name: string;
    avatar?: string;
  };
}

export interface BioTimelineAttachmentProps {
  /** Attachment data */
  attachment: TimelineAttachment;
  /** Show preview on click (for images) */
  enablePreview?: boolean;
  /** Called when download is clicked */
  onDownload?: (attachment: TimelineAttachment) => void;
  /** Called when preview is opened */
  onPreview?: (attachment: TimelineAttachment) => void;
  /** Variant: list or grid */
  variant?: 'list' | 'grid' | 'compact';
  /** Additional className */
  className?: string;
}

export interface BioTimelineAttachmentsProps {
  /** Attachments array */
  attachments: TimelineAttachment[];
  /** Display variant */
  variant?: 'list' | 'grid' | 'compact';
  /** Max to show before collapse */
  maxVisible?: number;
  /** Called when download is clicked */
  onDownload?: (attachment: TimelineAttachment) => void;
  /** Called when preview is opened */
  onPreview?: (attachment: TimelineAttachment) => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function getFileIcon(mimeType?: string, fileName?: string): LucideIcon {
  const ext = fileName?.split('.').pop()?.toLowerCase();

  // Check by extension first
  if (ext) {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return Image;
    if (['pdf'].includes(ext)) return FileText;
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return FileText;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
    if (['js', 'ts', 'json', 'html', 'css', 'xml'].includes(ext)) return FileCode;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return Film;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return Music;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive;
  }

  // Check by MIME type
  if (mimeType) {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('document') || mimeType.includes('word')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return Archive;
  }

  return File;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function isImage(mimeType?: string, fileName?: string): boolean {
  if (mimeType?.startsWith('image/')) return true;
  const ext = fileName?.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
}

// ============================================================
// Single Attachment Component
// ============================================================

export function BioTimelineAttachment({
  attachment,
  enablePreview = true,
  onDownload,
  onPreview,
  variant = 'list',
  className,
}: BioTimelineAttachmentProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  const Icon = getFileIcon(attachment.mimeType, attachment.name);
  const isImageFile = isImage(attachment.mimeType, attachment.name);

  const handleClick = () => {
    if (isImageFile && enablePreview) {
      setShowPreview(true);
      onPreview?.(attachment);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(attachment);
    } else {
      window.open(attachment.url, '_blank');
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-small',
          'bg-surface-subtle hover:bg-surface-nested transition-colors',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon className="h-3 w-3 text-text-muted" />
        <span className="truncate max-w-[120px]">{attachment.name}</span>
      </a>
    );
  }

  // Grid variant
  if (variant === 'grid') {
    return (
      <>
        <div
          onClick={handleClick}
          className={cn(
            'relative group rounded-lg border border-default overflow-hidden',
            'hover:border-accent-primary transition-colors',
            isImageFile && enablePreview && 'cursor-pointer',
            className
          )}
        >
          {/* Thumbnail or icon */}
          <div className="aspect-square bg-surface-subtle flex items-center justify-center">
            {isImageFile && (attachment.thumbnailUrl || attachment.url) ? (
              <img
                src={attachment.thumbnailUrl || attachment.url}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="h-8 w-8 text-text-tertiary" />
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              {isImageFile && enablePreview && (
                <button className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
                  <Eye className="h-4 w-4 text-text-primary" />
                </button>
              )}
              <button
                onClick={handleDownload}
                className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              >
                <Download className="h-4 w-4 text-text-primary" />
              </button>
            </div>
          </div>

          {/* File name */}
          <div className="p-2 border-t border-default">
            <Txt variant="small" className="truncate" title={attachment.name}>
              {attachment.name}
            </Txt>
            {attachment.size && (
              <Txt variant="micro" color="tertiary">
                {formatFileSize(attachment.size)}
              </Txt>
            )}
          </div>
        </div>

        {/* Preview modal */}
        {showPreview && isImageFile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowPreview(false)}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // List variant (default)
  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg border border-default',
          'hover:border-accent-primary/50 hover:bg-surface-hover transition-colors',
          isImageFile && enablePreview && 'cursor-pointer',
          className
        )}
      >
        {/* Icon/Thumbnail */}
        <div className="flex-shrink-0 w-10 h-10 rounded bg-surface-subtle flex items-center justify-center overflow-hidden">
          {isImageFile && (attachment.thumbnailUrl || attachment.url) ? (
            <img
              src={attachment.thumbnailUrl || attachment.url}
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon className="h-5 w-5 text-text-tertiary" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Txt variant="small" weight="medium" className="truncate">
            {attachment.name}
          </Txt>
          <Txt variant="micro" color="tertiary">
            {formatFileSize(attachment.size)}
          </Txt>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isImageFile && enablePreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
                onPreview?.(attachment);
              }}
              className="p-1.5 rounded hover:bg-surface-nested transition-colors"
              title="Preview"
            >
              <Eye className="h-4 w-4 text-text-muted" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-surface-nested transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && isImageFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

BioTimelineAttachment.displayName = 'BioTimelineAttachment';

// ============================================================
// Multiple Attachments Component
// ============================================================

export function BioTimelineAttachments({
  attachments,
  variant = 'list',
  maxVisible = 3,
  onDownload,
  onPreview,
  className,
}: BioTimelineAttachmentsProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (attachments.length === 0) return null;

  const visibleAttachments = expanded ? attachments : attachments.slice(0, maxVisible);
  const hiddenCount = attachments.length - maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Attachments label */}
      <div className="flex items-center gap-2">
        <Txt variant="micro" color="tertiary" weight="medium">
          {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
        </Txt>
      </div>

      {/* Attachment list/grid */}
      <div className={cn(
        variant === 'grid' && 'grid grid-cols-2 sm:grid-cols-3 gap-2',
        variant === 'list' && 'space-y-2',
        variant === 'compact' && 'flex flex-wrap gap-1',
      )}>
        {visibleAttachments.map((attachment) => (
          <BioTimelineAttachment
            key={attachment.id}
            attachment={attachment}
            variant={variant}
            onDownload={onDownload}
            onPreview={onPreview}
          />
        ))}
      </div>

      {/* Show more/less */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-small text-accent-primary hover:underline"
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

BioTimelineAttachments.displayName = 'BioTimelineAttachments';
