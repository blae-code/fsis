import React from 'react';
import ContractForm from '@/components/apps/contracts/ContractForm';
import ContractList from '@/components/apps/contracts/ContractList';

// EVE-style contract board: haul, sale, fabrication and service agreements.
export default function ContractsContent() {
  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <ContractForm />
          <div className="text-[10px] font-mono text-muted-foreground tracking-[0.2em]">CONTRACT BOARD</div>
          <ContractList />
        </div>
      </div>
      <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 6%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground">
          FSIS contract board — track agreements from posting through payout.
        </p>
      </div>
    </div>
  );
}