import React from 'react';

export default function StoreMaintenanceBanner({ status }) {
  const active = status?.maintenance_mode || status?.orders_paused;
  if (!active && !status?.public_message) return null;
  return (
    <div className="shrink-0 border-b px-3 sm:px-4 py-2 font-mono text-center" style={{ borderColor: active ? '#8A3A2E' : '#5C4424', background: active ? '#1A0D08' : '#120D08' }}>
      <p className="text-[10px] tracking-[0.18em]" style={{ color: active ? '#C05050' : '#E0A22E' }}>{active ? 'STORE MAINTENANCE MODE — ORDERS PAUSED' : 'STORE STATUS'}</p>
      <p className="text-[10px] mt-1" style={{ color: '#D8CFC0' }}>{status?.public_message || 'Catalog remains visible while FSIS performs operations maintenance.'}</p>
    </div>
  );
}