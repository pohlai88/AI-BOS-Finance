/**
 * BioTimelineComment - Comment/thread component for timeline
 *
 * Features:
 * - Threaded replies
 * - Edit/delete comments
 * - Mentions
 * - Reactions
 */

'use client';

import * as React from 'react';
import {
  MessageSquare,
  Reply,
  Edit2,
  Trash2,
  MoreHorizontal,
  Send,
  X,
  ThumbsUp,
  Heart,
  Smile,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { useLocale } from '../../providers';

// ============================================================
// Types
// ============================================================

export interface TimelineComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
  parentId?: string;
  reactions?: CommentReaction[];
  mentions?: string[];
}

export interface CommentReaction {
  type: 'like' | 'love' | 'smile';
  userId: string;
  userName: string;
}

export interface BioTimelineCommentProps {
  /** Comment data */
  comment: TimelineComment;
  /** Current user ID */
  currentUserId?: string;
  /** Child comments (replies) */
  replies?: TimelineComment[];
  /** Called when reply is submitted */
  onReply?: (parentId: string, content: string) => void;
  /** Called when comment is edited */
  onEdit?: (commentId: string, content: string) => void;
  /** Called when comment is deleted */
  onDelete?: (commentId: string) => void;
  /** Called when reaction is added */
  onReact?: (commentId: string, type: CommentReaction['type']) => void;
  /** Max nesting depth */
  maxDepth?: number;
  /** Current depth */
  depth?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTimelineComment({
  comment,
  currentUserId,
  replies = [],
  onReply,
  onEdit,
  onDelete,
  onReact,
  maxDepth = 3,
  depth = 0,
  className,
}: BioTimelineCommentProps) {
  const locale = useLocale();
  const [isReplying, setIsReplying] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [replyContent, setReplyContent] = React.useState('');
  const [editContent, setEditContent] = React.useState(comment.content);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);

  const isOwner = currentUserId === comment.author.id;
  const canReply = depth < maxDepth;

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !onReply) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  const handleSubmitEdit = () => {
    if (!editContent.trim() || !onEdit) return;
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      onDelete?.(comment.id);
    }
    setShowMenu(false);
  };

  // Group reactions by type
  const reactionCounts = React.useMemo(() => {
    const counts: Record<string, { count: number; users: string[] }> = {};
    comment.reactions?.forEach(r => {
      if (!counts[r.type]) counts[r.type] = { count: 0, users: [] };
      counts[r.type].count++;
      counts[r.type].users.push(r.userName);
    });
    return counts;
  }, [comment.reactions]);

  const reactionIcons: Record<CommentReaction['type'], typeof ThumbsUp> = {
    like: ThumbsUp,
    love: Heart,
    smile: Smile,
  };

  return (
    <div className={cn('group', className)}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center">
              <Txt variant="small" weight="medium">
                {comment.author.name.charAt(0).toUpperCase()}
              </Txt>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Txt variant="small" weight="medium">
              {comment.author.name}
            </Txt>
            <Txt variant="micro" color="tertiary">
              {locale.formatRelativeTime(comment.createdAt)}
            </Txt>
            {comment.updatedAt && (
              <Txt variant="micro" color="tertiary">
                (edited)
              </Txt>
            )}
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-default bg-surface-base text-body resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Btn variant="primary" onClick={handleSubmitEdit}>
                  Save
                </Btn>
                <Btn variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Btn>
              </div>
            </div>
          ) : (
            <Txt variant="body" color="secondary" className="whitespace-pre-wrap">
              {comment.content}
            </Txt>
          )}

          {/* Reactions */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {Object.entries(reactionCounts).map(([type, data]) => {
                const Icon = reactionIcons[type as CommentReaction['type']];
                return (
                  <button
                    key={type}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-subtle hover:bg-surface-nested text-small"
                    title={data.users.join(', ')}
                  >
                    <Icon className="h-3 w-3" />
                    {data.count}
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* React */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="text-small text-text-tertiary hover:text-text-primary transition-colors"
                >
                  React
                </button>
                {showReactions && (
                  <div className="absolute left-0 top-full mt-1 flex gap-1 p-1 bg-surface-base border border-default rounded-lg shadow-lg z-10">
                    {(['like', 'love', 'smile'] as const).map(type => {
                      const Icon = reactionIcons[type];
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            onReact?.(comment.id, type);
                            setShowReactions(false);
                          }}
                          className="p-1.5 rounded hover:bg-surface-nested transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply */}
              {canReply && onReply && (
                <button
                  onClick={() => setIsReplying(true)}
                  className="text-small text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Menu */}
              {isOwner && (onEdit || onDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute left-0 top-full mt-1 py-1 bg-surface-base border border-default rounded-lg shadow-lg z-10 min-w-[100px]">
                      {onEdit && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-small hover:bg-surface-hover flex items-center gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-1.5 text-left text-small hover:bg-surface-hover flex items-center gap-2 text-status-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 rounded-lg border border-default bg-surface-base text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                  if (e.key === 'Escape') {
                    setIsReplying(false);
                  }
                }}
              />
              <Btn variant="primary" onClick={handleSubmitReply}>
                <Send className="h-4 w-4" />
              </Btn>
              <Btn variant="ghost" onClick={() => setIsReplying(false)}>
                <X className="h-4 w-4" />
              </Btn>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-default space-y-4">
              {replies.map((reply) => (
                <BioTimelineComment
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  replies={[]}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReact={onReact}
                  maxDepth={maxDepth}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

BioTimelineComment.displayName = 'BioTimelineComment';
