/**
 * BioTimelineFilters - Filter controls for timeline
 *
 * Features:
 * - Filter by user
 * - Filter by action type
 * - Filter by date range
 * - Search within timeline
 */

'use client';

import * as React from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { Surface } from '../../atoms/Surface';
import { type TimelineItemType } from './BioTimeline';

// ============================================================
// Types
// ============================================================

export interface TimelineFilters {
  search?: string;
  users?: string[];
  types?: TimelineItemType[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TimelineUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface BioTimelineFiltersProps {
  /** Current filters */
  filters: TimelineFilters;
  /** Called when filters change */
  onFiltersChange: (filters: TimelineFilters) => void;
  /** Available users for filtering */
  users?: TimelineUser[];
  /** Available types for filtering */
  types?: { value: TimelineItemType; label: string }[];
  /** Show search input */
  showSearch?: boolean;
  /** Show user filter */
  showUserFilter?: boolean;
  /** Show type filter */
  showTypeFilter?: boolean;
  /** Show date range filter */
  showDateFilter?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Default types
// ============================================================

const defaultTypes: { value: TimelineItemType; label: string }[] = [
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'comment', label: 'Comments' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warnings' },
  { value: 'danger', label: 'Errors' },
];

// ============================================================
// Component
// ============================================================

export function BioTimelineFilters({
  filters,
  onFiltersChange,
  users = [],
  types = defaultTypes,
  showSearch = true,
  showUserFilter = true,
  showTypeFilter = true,
  showDateFilter = true,
  className,
}: BioTimelineFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.users?.length) count++;
    if (filters.types?.length) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  // Update filter
  const updateFilter = <K extends keyof TimelineFilters>(
    key: K,
    value: TimelineFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Toggle user selection
  const toggleUser = (userId: string) => {
    const current = filters.users || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    updateFilter('users', updated.length ? updated : undefined);
  };

  // Toggle type selection
  const toggleType = (type: TimelineItemType) => {
    const current = filters.types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('types', updated.length ? updated : undefined);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-default bg-surface-base text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter('search', undefined)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <Btn
          variant={showFilters || activeFilterCount > 0 ? 'primary' : 'secondary'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Btn>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <Surface variant="subtle" padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <Txt variant="label" weight="medium">
              Filters
            </Txt>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-small text-accent-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* User Filter */}
            {showUserFilter && users.length > 0 && (
              <div className="relative">
                <Btn
                  variant="secondary"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Users
                  {filters.users?.length && (
                    <span className="text-xs bg-accent-primary text-white px-1.5 rounded-full">
                      {filters.users.length}
                    </span>
                  )}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showUserDropdown && 'rotate-180')} />
                </Btn>

                {showUserDropdown && (
                  <div className="absolute left-0 top-full mt-1 z-10 w-64 py-2 bg-surface-base border border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={cn(
                          'w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-hover transition-colors',
                          filters.users?.includes(user.id) && 'bg-accent-primary/5'
                        )}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-xs">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-small flex-1 text-left">{user.name}</span>
                        {filters.users?.includes(user.id) && (
                          <div className="w-4 h-4 rounded bg-accent-primary text-white flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type Filter */}
            {showTypeFilter && (
              <div className="relative">
                <Btn
                  variant="secondary"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Types
                  {filters.types?.length && (
                    <span className="text-xs bg-accent-primary text-white px-1.5 rounded-full">
                      {filters.types.length}
                    </span>
                  )}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showTypeDropdown && 'rotate-180')} />
                </Btn>

                {showTypeDropdown && (
                  <div className="absolute left-0 top-full mt-1 z-10 w-48 py-2 bg-surface-base border border-default rounded-lg shadow-lg">
                    {types.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleType(type.value)}
                        className={cn(
                          'w-full px-3 py-2 flex items-center justify-between hover:bg-surface-hover transition-colors',
                          filters.types?.includes(type.value) && 'bg-accent-primary/5'
                        )}
                      >
                        <span className="text-small">{type.label}</span>
                        {filters.types?.includes(type.value) && (
                          <div className="w-4 h-4 rounded bg-accent-primary text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Filter */}
            {showDateFilter && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                <input
                  type="date"
                  value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                  className="px-2 py-1.5 rounded border border-default bg-surface-base text-small focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  placeholder="From"
                />
                <span className="text-text-muted">to</span>
                <input
                  type="date"
                  value={filters.dateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                  className="px-2 py-1.5 rounded border border-default bg-surface-base text-small focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  placeholder="To"
                />
              </div>
            )}
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.users?.map((userId) => {
                const user = users.find(u => u.id === userId);
                return user ? (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-small"
                  >
                    {user.name}
                    <button onClick={() => toggleUser(userId)} className="hover:bg-accent-primary/20 rounded-full">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
              {filters.types?.map((type) => {
                const typeInfo = types.find(t => t.value === type);
                return typeInfo ? (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-small"
                  >
                    {typeInfo.label}
                    <button onClick={() => toggleType(type)} className="hover:bg-accent-primary/20 rounded-full">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </Surface>
      )}
    </div>
  );
}

BioTimelineFilters.displayName = 'BioTimelineFilters';
