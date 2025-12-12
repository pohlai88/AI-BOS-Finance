/**
 * MetadataFieldSidebar - Wrapper for FieldContextSidebar
 * 
 * This component can be used in metadata views to display field context.
 * It accepts a dictId and automatically fetches and displays the field context.
 */

'use client';

import { FieldContextSidebar } from './FieldContextSidebar';

interface MetadataFieldSidebarProps {
  dictId: string | null;
  onClose?: () => void;
}

export function MetadataFieldSidebar({ dictId, onClose }: MetadataFieldSidebarProps) {
  return <FieldContextSidebar dictId={dictId} onClose={onClose} />;
}

export default MetadataFieldSidebar;
