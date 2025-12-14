'use client';

// ============================================================================
// META_03 - METADATA DETAIL PAGE // THE PRISM
// Route: /meta-registry/[id]
// Displays full forensic profile of a single metadata record
// ============================================================================

import { MetadataDetailPage } from '@/views/META_03_MetadataDetailPage';

export default function MetaRegistryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <MetadataDetailPage dictId={params.id} />;
}
