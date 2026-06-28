import React from 'react';
import { FileDown, ReceiptText } from 'lucide-react';
import { downloadInvoice } from '@/lib/invoicePdf';

const money = (n) => `${Math.round(Number(n || 0)).toLocaleString()} aUEC`;
const compactItems = (items = []) => items.slice(0, 3).map((i) => `${i.quantity}× ${i.code || i.product_name}`).join(', ') + (items.length > 3 ? ` +${items.length - 3}` : '');

export default function InvoiceLedgerPanel({ invoices = [] }) {
  const recent = invoices.slice(0, 8);
  const totalIssued = invoices.reduce((sum, inv) => sum + Number(inv.total_auec || 0), 0);

  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>BRANDED INVOICE LEDGER</div>
          <p className="text-[10px] mt-1" style={{ color: '#7A6E60' }}>Stored transaction records for FSIS and each buyer/counterparty.</p>
        </div>
        <div className="text-right">
          <div className="text-base font-bold" style={{ color: '#E0A22E' }}>{money(totalIssued)}</div>
          <div className="text-[8px] tracking-[0.16em]" style={{ color: '#7A6E60' }}>{invoices.length} ISSUED</div>
        </div>
      </div>
      {recent.length === 0 ? (
        <div className="border p-3 text-[10px]" style={{ borderColor: '#3A2F20', color: '#7A6E60', background: '#0C0A07' }}>No invoices issued yet. New storefront orders will generate one automatically.</div>
      ) : recent.map((inv) => (
        <div key={inv.id} className="border p-2 space-y-1" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#EDE5D6' }}><ReceiptText className="w-3 h-3" /> {inv.invoice_number}</div>
              <div className="text-[9px] truncate" style={{ color: '#9C9080' }}>{inv.buyer?.handle || 'Unknown buyer'} → {compactItems(inv.line_items)}</div>
              <div className="text-[8px] tracking-[0.12em]" style={{ color: '#8A8F45' }}>{(inv.status || 'issued').toUpperCase()} • {inv.order_tracking_code || inv.transaction_type}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold" style={{ color: '#E0A22E' }}>{money(inv.total_auec)}</div>
              <button onClick={() => downloadInvoice({ invoice_number: inv.invoice_number, tracking_code: inv.order_tracking_code, handle: inv.buyer?.handle, location: inv.buyer?.delivery_location, items: inv.line_items, total: inv.total_auec, discount_auec: inv.discount_auec, discount_percent: inv.discount_percent, discount_code: inv.discount_code, passphrase: inv.handoff_passphrase, placed_date: inv.issued_at })} className="mt-1 border px-2 py-1 text-[8px] font-bold inline-flex items-center gap-1 hover:brightness-125" style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}><FileDown className="w-2.5 h-2.5" /> PDF</button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}