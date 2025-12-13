'use client'

import { EntityMasterPage } from '@/modules/system'

/**
 * Entity Master Page Route
 *
 * Deep form for enterprise entity governance
 * 4-Tab Architecture: Profile, Ownership, Officers, Documents
 * IFRS/MFRS Compliant Consolidation & Validation
 *
 * @route /entity-master/[entityId]
 * @see EntityMasterPage.tsx
 */

export default function EntityMasterRoute() {
  return <EntityMasterPage />
}
