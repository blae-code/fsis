import React from 'react';
import CollectionsPanel from '@/components/apps/management/hall/CollectionsPanel';
import HallDisputePanel from '@/components/apps/management/hall/HallDisputePanel';
import BuybackDesk from '@/components/apps/management/hall/BuybackDesk';
import AssetLibraryPanel from '@/components/apps/management/assets/AssetLibraryPanel';

/** Only the desk in hand is mounted — the rest of the hall costs nothing while it waits. */
export default function HallDesk({ desk }) {
  if (desk === 'collections') return <CollectionsPanel />;
  if (desk === 'disputes') return <HallDisputePanel />;
  if (desk === 'buyback') return <BuybackDesk />;
  return <AssetLibraryPanel />;
}