import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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
        <div className="flex justify-between border-t pt-2 text-[11px] font-bold" style={{ borderColor: '#3A2F20' }}>
          <span style={{ color: '#D8CFC0' }}>TOTAL</span>
          <span style={{ color: '#E0A22E' }}>{(order.total || 0).toLocaleString()} aUEC</span>
        </div>
        <SerialStrip seed={order.tracking_code} label={`ISSUED ${new Date().toLocaleDateString()}`} />
        <p className="text-[8px]" style={{ color: '#6B6155' }}>
          Saved on this device — track anytime under MY ORDERS. "{FSIS.motto}"
        </p>
      </div>
    </div>
  );
}