import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Trash2, Search, Camera, ScanLine, Bot, Wallet } from 'lucide-react';
import { CATEGORIES } from '@/components/apps/ledger/LedgerEntryForm';
import MonthlyReport from '@/components/apps/ledger/MonthlyReport';

const SOURCE_META = {
  ocr_scan: { icon: ScanLine, label: 'OCR' },
  automation: { icon: Bot, label: 'AUTO' },
};

/** Detailed, searchable aUEC transaction history with screenshot evidence */
export default function TransactionLog({ entries, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    if (filter !== 'all' && e.entry_type !== filter) return false;
    if (category !== 'all' && e.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${e.description || ''} ${e.counterparty || ''} ${CATEGORIES[e.category] || ''} ${e.amount_auec || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b flex-wrap" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] shrink-0">
          TRANSACTION HISTORY — {filtered.length} ENTRIES
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search log…"
              className="h-7 w-36 pl-6 text-[10px] font-mono"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-7 w-32 text-[10px] font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {Object.entries(CATEGORIES).map(([k, label]) => (
                <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-7 w-24 text-[10px] font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="income" className="text-xs">Income</SelectItem>
              <SelectItem value="expense" className="text-xs">Expenses</SelectItem>
            </SelectContent>
          </Select>
          <MonthlyReport entries={entries} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No entries match — log a movement above or scan a screenshot.</p>
          </div>
        ) : (
          filtered.map((e) => {
            const isIncome = e.entry_type === 'income';
            const src = SOURCE_META[e.source];
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded border px-3 py-2"
                style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}
              >
                <span
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: isIncome ? 'hsl(140, 50%, 45%)' : 'hsl(0, 55%, 50%)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-foreground truncate">{e.description || CATEGORIES[e.category] || 'Entry'}</span>
                    <Badge variant="outline" className="text-[8px] h-4 text-muted-foreground">
                      {CATEGORIES[e.category] || e.category}
                    </Badge>
                    {src && (
                      <Badge variant="outline" className="text-[8px] h-4 gap-0.5 text-primary border-primary/40">
                        <src.icon className="w-2 h-2" /> {src.label}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{e.entry_date || ''} {e.counterparty && `• ${e.counterparty}`}</span>
                    {e.balance_after > 0 && (
                      <span className="inline-flex items-center gap-0.5" style={{ color: 'hsl(42, 60%, 50%)' }}>
                        <Wallet className="w-2.5 h-2.5" /> BAL {e.balance_after.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {e.screenshot_url && (
                  <a
                    href={e.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View attached screenshot evidence"
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </a>
                )}
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ color: isIncome ? 'hsl(140, 50%, 50%)' : 'hsl(0, 55%, 55%)' }}
                >
                  {isIncome ? '+' : '−'}{(e.amount_auec || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}