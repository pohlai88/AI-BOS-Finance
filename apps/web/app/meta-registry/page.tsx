'use client';

/**
 * META_02 - Registry / God View Route
 * Thin route - delegates to feature module
 * @see FRONTEND_CLEAN_STATE_REVIEW.md
 */

import { META_02_MetadataGodView } from '@/features/metadata';

export default function MetaRegistryRoute() {
  return <META_02_MetadataGodView />;
}
