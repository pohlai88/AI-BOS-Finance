'use client';

/**
 * META_03 - Metadata Detail Page Route (Thin)
 * Route: /meta-registry/[id]
 * @see FRONTEND_CLEAN_STATE_REVIEW.md
 */

import { META_03_MetadataDetailPage } from '@/features/metadata';

export default function MetaRegistryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <META_03_MetadataDetailPage dictId={params.id} />;
}
