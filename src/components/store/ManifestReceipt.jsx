import React from 'react';
import { CheckCircle2, KeyRound, FileDown } from 'lucide-react';
import { downloadInvoice } from '@/lib/invoicePdf';
import FsisLogo from '@/components/brand/FsisLogo';
import SerialStrip from '@/components/brand/SerialStrip';
import { FSIS } from '@/lib/fsisLore';
import { etaFor } from '@/lib/storeLocations';

/** Stylized cargo manifest "document" shown after a successful checkout */
export default function ManifestReceipt({ order }) {
  if (!order) return null;
  const eta = etaFor(order.location);
  return (
    <div className="border font-mono" style={{ borderColor: '#8A6430', background: '#100E0B' }}>
      {/* Doc header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#3A2F20', background: 'linear-gradient(160deg, #1C1610, #14110D)' }}>
        <div className="flex items-center gap-2">
          <FsisLogo size={18} />
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em]" style={{ color: '#D8CFC0' }}>CARGO MANIFEST — RECEIPT</div>
            <div className="text-[8px]" style={{ color: '#8A7E6C' }}>{FSIS.license}</div>
          </div>
        </div>
        <CheckCircle2 className="w-4 h-4" style={{ color: '#7BA05B' }} />
      </div>

      <div className="p-3 space-y-2 text-[10px]">
        <div className="flex justify-between">
          <span style={{ color: '#8A7E6C' }}>TRACKING</span>
          <span className="font-bold" style={{ color: '#E0A22E' }}>{order.tracking_code}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#8A7E6C' }}>CONSIGNEE</span>
          <span style={{ color: '#D8CFC0' }}>{order.handle}</span>
        </div>
        {order.location && (
          <div className="flex justify-between">
            <span style={{ color: '#8A7E6C' }}>DESTINATION</span>
            <span style={{ color: '#D8CFC0' }}>{order.location}{eta ? ` • EST ${eta} after confirmation` : ''}</span>
          </div>
        )}
        <div className="border-t pt-2 space-y-1" style={{ borderColor: '#2A2118' }}>
          {(order.items || []).map((i) => (
            <div key={i.product_id} className="flex justify-between">
              <span style={{ color: '#9C9080' }}>{i.quantity}× {i.code || i.product_name}</span>
              <span style={{ color: '#D8CFC0' }}>{(i.unit_price * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {order.discount_auec > 0 && (
          <div className="flex justify-between" style={{ color: '#7BA05B' }}>
            <span>DISCOUNT ({order.discount_percent}%)</span>
            <span>−{order.discount_auec.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-[11px] font-bold" style={{ borderColor: '#3A2F20' }}>
          <span style={{ color: '#D8CFC0' }}>TOTAL</span>
          <span style={{ color: '#E0A22E' }}>{(order.total || 0).toLocaleString()} aUEC</span>
        </div>
        {order.passphrase && (
          <div className="border p-2.5 space-y-1" style={{ borderColor: '#5C4424', background: '#161310' }}>
            <div className="flex items-center gap-1.5 text-[8px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>
              <KeyRound className="w-3 h-3" /> HANDOFF PASSPHRASE
            </div>
            <div className="text-sm font-bold tracking-[0.15em]" style={{ color: '#E0A22E' }}>{order.passphrase}</div>
            <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              For in-person delivery: the FSIS representative will state this passphrase to confirm their identity — and may ask you (or your representative) for it in return. Never share it before the meet.
            </p>
          </div>
        )}
        <button
          onClick={() => downloadInvoice(order)}
          className="w-full h-8 font-mono text-[10px] font-bold inline-flex items-center justify-center gap-1.5 border hover:brightness-125 transition-all"
          style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#161310' }}
        >
          <FileDown className="w-3 h-3" /> DOWNLOAD INVOICE (PDF)
        </button>
        <SerialStrip seed={order.tracking_code} label={`ISSUED ${new Date().toLocaleDateString()}`} />
        <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
          Saved on this device — track anytime under MY ORDERS. FSIS confirms stock and route before fulfillment; pay only in the in-game trade window at handoff. "{FSIS.motto}"
        </p>
      </div>
    </div>
  );
}