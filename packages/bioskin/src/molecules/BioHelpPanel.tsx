/**
 * BioHelpPanel - Contextual help sidebar/panel
 *
 * Features:
 * - Context-aware help content
 * - Search within help
 * - Related articles
 * - Video tutorials
 * - Contact support
 */

'use client';

import * as React from 'react';
import {
  HelpCircle,
  X,
  Search,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { Surface } from '../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface HelpArticle {
  id: string;
  title: string;
  summary?: string;
  content?: React.ReactNode;
  url?: string;
  category?: string;
  tags?: string[];
}

export interface HelpVideo {
  id: string;
  title: string;
  duration?: string;
  thumbnailUrl?: string;
  videoUrl: string;
}

export interface BioHelpPanelProps {
  /** Is panel open */
  isOpen: boolean;
  /** Called when panel should close */
  onClose: () => void;
  /** Current context (page/section) */
  context?: string;
  /** Help articles */
  articles?: HelpArticle[];
  /** Video tutorials */
  videos?: HelpVideo[];
  /** Quick tips */
  tips?: string[];
  /** Support contact info */
  supportEmail?: string;
  /** Support URL */
  supportUrl?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Position */
  position?: 'right' | 'left';
  /** Width */
  width?: number | string;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioHelpPanel({
  isOpen,
  onClose,
  context,
  articles = [],
  videos = [],
  tips = [],
  supportEmail,
  supportUrl,
  searchPlaceholder = 'Search help...',
  position = 'right',
  width = 360,
  className,
}: BioHelpPanelProps) {
  // Stable IDs for accessibility
  const panelId = React.useId();
  const searchId = `${panelId}-search`;
  const titleId = `${panelId}-title`;

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedArticle, setSelectedArticle] = React.useState<HelpArticle | null>(null);

  // Filter articles by search
  const filteredArticles = React.useMemo(() => {
    if (!searchQuery.trim()) return articles;

    const query = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary?.toLowerCase().includes(query) ||
        a.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [articles, searchQuery]);

  // Filter by context
  const contextArticles = React.useMemo(() => {
    if (!context) return filteredArticles;
    return filteredArticles.filter(
      (a) => a.category === context || a.tags?.includes(context)
    );
  }, [filteredArticles, context]);

  // Other articles (not matching context)
  const otherArticles = React.useMemo(() => {
    if (!context) return [];
    return filteredArticles.filter(
      (a) => a.category !== context && !a.tags?.includes(context)
    );
  }, [filteredArticles, context]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'fixed top-0 bottom-0 z-50 bg-surface-base border-l border-default shadow-xl overflow-hidden flex flex-col',
          position === 'right' ? 'right-0' : 'left-0',
          position === 'left' && 'border-l-0 border-r',
          className
        )}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent-primary" aria-hidden="true" />
            <Txt id={titleId} variant="label" weight="medium">
              Help & Support
            </Txt>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover transition-colors"
            aria-label="Close help panel"
          >
            <X className="h-5 w-5 text-text-muted" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-default">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search help articles"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-default bg-surface-base text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            // Article Detail View
            <div className="p-4">
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-1 text-small text-accent-primary hover:underline mb-4"
              >
                ← Back to help
              </button>
              <Txt variant="heading" as="h2" className="mb-4">
                {selectedArticle.title}
              </Txt>
              <div className="prose prose-sm text-text-secondary">
                {selectedArticle.content || selectedArticle.summary}
              </div>
              {selectedArticle.url && (
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-accent-primary hover:underline"
                >
                  Read full article
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Quick Tips */}
              {tips.length > 0 && (
                <div className="p-4 border-b border-default">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-status-warning" />
                    <Txt variant="label" weight="medium">
                      Quick Tips
                    </Txt>
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded bg-status-warning/5 border border-status-warning/20"
                      >
                        <span className="text-status-warning">💡</span>
                        <Txt variant="small" color="secondary">
                          {tip}
                        </Txt>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Articles */}
              {contextArticles.length > 0 && (
                <div className="p-4 border-b border-default">
                  <div className="flex items-center gap-2 mb-3">
                    <Book className="h-4 w-4 text-text-tertiary" />
                    <Txt variant="label" weight="medium">
                      {context ? `Help for ${context}` : 'Help Articles'}
                    </Txt>
                  </div>
                  <div className="space-y-1">
                    {contextArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <Txt variant="small" weight="medium" className="truncate">
                            {article.title}
                          </Txt>
                          {article.summary && (
                            <Txt variant="caption" color="tertiary" className="truncate">
                              {article.summary}
                            </Txt>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-muted flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Articles */}
              {otherArticles.length > 0 && (
                <div className="p-4 border-b border-default">
                  <Txt variant="label" weight="medium" className="mb-3">
                    Other Topics
                  </Txt>
                  <div className="space-y-1">
                    {otherArticles.slice(0, 5).map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover transition-colors text-left"
                      >
                        <Txt variant="small" className="truncate">
                          {article.title}
                        </Txt>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="p-4 border-b border-default">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-4 w-4 text-text-tertiary" />
                    <Txt variant="label" weight="medium">
                      Video Tutorials
                    </Txt>
                  </div>
                  <div className="space-y-2">
                    {videos.map((video) => (
                      <a
                        key={video.id}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded hover:bg-surface-hover transition-colors"
                      >
                        <div className="w-16 h-10 rounded bg-surface-nested flex items-center justify-center flex-shrink-0">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Video className="h-5 w-5 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Txt variant="small" weight="medium" className="truncate">
                            {video.title}
                          </Txt>
                          {video.duration && (
                            <Txt variant="caption" color="tertiary">
                              {video.duration}
                            </Txt>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-text-muted flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {contextArticles.length === 0 && otherArticles.length === 0 && videos.length === 0 && (
                <div className="p-8 text-center">
                  <HelpCircle className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <Txt variant="body" color="tertiary">
                    {searchQuery ? 'No results found' : 'No help content available'}
                  </Txt>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Support */}
        {(supportEmail || supportUrl) && (
          <div className="p-4 border-t border-default bg-surface-subtle">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-text-tertiary" />
              <Txt variant="label" weight="medium">
                Still need help?
              </Txt>
            </div>
            <div className="flex gap-2">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex-1"
                >
                  <Btn variant="secondary" className="w-full">
                    Email Support
                  </Btn>
                </a>
              )}
              {supportUrl && (
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Btn variant="primary" className="w-full">
                    Contact Us
                  </Btn>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

BioHelpPanel.displayName = 'BioHelpPanel';
