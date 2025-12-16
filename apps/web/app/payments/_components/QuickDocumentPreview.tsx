'use client';

/**
 * QuickDocumentPreview - Inline document preview component
 * 
 * Phase 6c Enhancement: Evidence UX
 * 
 * Shows document thumbnail with quick preview modal capability.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Eye,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  File,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'tax'
  | 'bank_statement'
  | 'other';

export interface DocumentInfo {
  id: string;
  type: DocumentType;
  name?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

export interface QuickDocumentPreviewProps {
  documentId: string;
  documentType?: string;
  variant?: 'card' | 'inline' | 'button';
  showPreviewModal?: boolean;
  onPreview?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
}

// ============================================================================
// DOCUMENT TYPE CONFIG
// ============================================================================

interface DocTypeConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

const DOC_TYPE_CONFIG: Record<string, DocTypeConfig> = {
  invoice: { icon: FileText, label: 'Invoice', color: 'text-blue-600' },
  receipt: { icon: FileText, label: 'Receipt', color: 'text-green-600' },
  contract: { icon: FileText, label: 'Contract', color: 'text-purple-600' },
  tax: { icon: FileSpreadsheet, label: 'Tax Document', color: 'text-orange-600' },
  bank_statement: { icon: FileSpreadsheet, label: 'Bank Statement', color: 'text-cyan-600' },
  image: { icon: FileImage, label: 'Image', color: 'text-pink-600' },
  other: { icon: File, label: 'Document', color: 'text-gray-600' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuickDocumentPreview({
  documentId,
  documentType = 'other',
  variant = 'card',
  showPreviewModal = true,
  onPreview,
  onDownload,
}: QuickDocumentPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const config = DOC_TYPE_CONFIG[documentType] || DOC_TYPE_CONFIG.other;
  const Icon = config.icon;
  const shortId = documentId.slice(0, 8);

  const handlePreview = () => {
    if (onPreview) {
      onPreview(documentId);
    } else if (showPreviewModal) {
      setIsOpen(true);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(documentId);
    }
  };

  // Inline variant (just an icon + link)
  if (variant === 'inline') {
    return (
      <button
        onClick={handlePreview}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Icon className={cn('h-3 w-3', config.color)} />
        <span>{config.label}</span>
      </button>
    );
  }

  // Button variant (compact button)
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 h-7"
        onClick={handlePreview}
      >
        <Icon className={cn('h-3.5 w-3.5', config.color)} />
        <span className="text-xs">{config.label}</span>
        <Eye className="h-3 w-3 text-muted-foreground" />
      </Button>
    );
  }

  // Card variant (default - thumbnail card)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-auto py-2 hover:bg-muted/50"
          >
            {/* Thumbnail */}
            <div className={cn(
              'h-8 w-8 rounded flex items-center justify-center flex-shrink-0',
              'bg-muted'
            )}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>

            {/* Info */}
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs font-medium truncate">
                {config.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {shortId}...
              </p>
            </div>

            {/* Action hint */}
            <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={cn('h-5 w-5', config.color)} />
              {config.label}
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                {shortId}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <DocumentPreviewContent
            documentId={documentId}
            documentType={documentType}
            onDownload={handleDownload}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// PREVIEW CONTENT
// ============================================================================

interface DocumentPreviewContentProps {
  documentId: string;
  documentType: string;
  onDownload?: () => void;
}

function DocumentPreviewContent({
  documentId,
  documentType,
  onDownload,
}: DocumentPreviewContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const config = DOC_TYPE_CONFIG[documentType] || DOC_TYPE_CONFIG.other;
  const Icon = config.icon;

  // Simulated loading
  setTimeout(() => setIsLoading(false), 500);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="border rounded-lg bg-muted/30 min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className={cn(
            'mx-auto h-16 w-16 rounded-lg flex items-center justify-center',
            'bg-muted'
          )}>
            <Icon className={cn('h-8 w-8', config.color)} />
          </div>
          <div>
            <p className="font-medium">{config.label}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {documentId}
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Document preview would be displayed here.
            Connect to document service to enable previews.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/api/documents/${documentId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </a>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// DOCUMENT LIST
// ============================================================================

export interface DocumentListProps {
  documents: Array<{
    id: string;
    type: string;
    name?: string;
  }>;
  onPreview?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
}

export function DocumentList({
  documents,
  onPreview,
  onDownload
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No documents attached
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <QuickDocumentPreview
          key={doc.id}
          documentId={doc.id}
          documentType={doc.type}
          variant="card"
          onPreview={onPreview}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}

// ============================================================================
// COMPACT BADGE
// ============================================================================

export function DocumentBadge({
  documentType,
  documentId,
  onClick,
}: {
  documentType: string;
  documentId?: string;
  onClick?: () => void;
}) {
  const config = DOC_TYPE_CONFIG[documentType] || DOC_TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 cursor-pointer hover:bg-muted',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <Icon className={cn('h-3 w-3', config.color)} />
      <span>{config.label}</span>
    </Badge>
  );
}
