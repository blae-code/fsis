import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LedgerEntryForm from '@/components/apps/ledger/LedgerEntryForm';
import LedgerSummary from '@/components/apps/ledger/LedgerSummary';
import TransactionLog from '@/components/apps/ledger/TransactionLog';
import LedgerScan from '@/components/apps/ledger/LedgerScan';

export default function LedgerContent() {
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['ledger_entries'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ledger_entry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ledger_entries'] }),
  });

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <LedgerSummary entries={entries} />

      <Tabs defaultValue="log" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 shrink-0" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <TabsTrigger
            value="log"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            LEDGER
          </TabsTrigger>
          <TabsTrigger
            value="scan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            OCR SCAN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="flex-1 flex flex-col min-h-0 m-0">
          <LedgerEntryForm />
          <TransactionLog entries={entries} onDelete={(id) => deleteMutation.mutate(id)} />
        </TabsContent>

        <TabsContent value="scan" className="flex-1 overflow-auto m-0">
          <LedgerScan />
        </TabsContent>
      </Tabs>
    </div>
  );
}