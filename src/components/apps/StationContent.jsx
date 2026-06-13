import React from 'react';
import ContractorStationDeck from '@/components/apps/station/ContractorStationDeck';

export default function StationContent() {
  return (
    <div className="h-full overflow-auto industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <ContractorStationDeck />
    </div>
  );
}