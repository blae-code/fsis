import React from 'react';

const steps = ['Buyer browses storefront', 'Buyer places order', 'Receipt shows tracking/passphrase', 'Order enters proprietor queue', 'Proprietor confirms fulfillment', 'Buyer tracks and messages', 'Handoff is updated', 'Order is delivered', 'Inventory and ledger are checked'];

export default function AcceptanceRunPanel() {
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASE 7 · FINAL ACCEPTANCE RUN</p>
      <div className="grid md:grid-cols-3 gap-2 mt-3">
        {steps.map((s, i) => <div key={s} className="border p-2 flex gap-2" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><span className="text-[9px]" style={{ color: '#E0A22E' }}>{String(i + 1).padStart(2, '0')}</span><p className="text-[9px]" style={{ color: '#A89C8A' }}>{s}</p></div>)}
      </div>
    </div>
  );
}