/**
 * @aibos/bioskin - Hooks
 *
 * Shared hooks for component functionality.
 */

export {
  useKeyboardNavigation,
  useRovingTabIndex,
  type UseKeyboardNavigationOptions,
  type UseKeyboardNavigationReturn,
  type UseRovingTabIndexOptions,
} from './useKeyboardNavigation';

export { useDebounce } from './useDebounce';

export {
  useSmartDefaults,
  type UseSmartDefaultsOptions,
  type UseSmartDefaultsReturn,
  type SmartDefaultConfig,
  type SmartDefaultContext,
} from './useSmartDefaults';

export {
  useOptimisticMutation,
  type UseOptimisticMutationOptions,
  type UseOptimisticMutationReturn,
} from './useOptimisticMutation';

export {
  useUrlSyncedFilters,
  type UseUrlSyncedFiltersOptions,
  type UseUrlSyncedFiltersReturn,
  type Filters,
  type FilterValue,
} from './useUrlSyncedFilters';

export {
  useNavigationHistory,
  type UseNavigationHistoryOptions,
  type UseNavigationHistoryReturn,
  type NavigationEntry,
} from './useNavigationHistory';

export {
  useListState,
  type UseListStateOptions,
  type UseListStateReturn,
  type ListState,
} from './useListState';

export {
  useRoleBasedSuggestions,
  type UseRoleBasedSuggestionsOptions,
  type UseRoleBasedSuggestionsReturn,
  type Suggestion,
  type SuggestionConfig,
  type UserRole,
} from './useRoleBasedSuggestions';
