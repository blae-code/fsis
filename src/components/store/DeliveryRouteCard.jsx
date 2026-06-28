import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { DELIVERY_LOCATIONS, etaFor } from '@/lib/storeLocations';
import LocationMarker from '@/components/brand/glyphs/LocationMarker';

export default function DeliveryRouteCard({ location }) {
  if (!location) return null;
  const meta = DELIVERY_LOCATIONS.find((l) => l.name === location);
  const highRisk = /grimhex|grim hex/i.test(location) || /risk|escort|review/i.test(meta?.note || '');

  return (
    <div className="border p-2.5 font-mono" style={{ borderColor: highRisk ? '#8A4A2A' : '#2E4A3D', background: highRisk ? 'rgba(138,74,42,0.08)' : 'rgba(46,74,61,0.08)' }}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] sm:tracking-[0.14em] min-w-0" style={{ color: highRisk ? '#C8893B' : '#6FA08F' }}>
          <LocationMarker name={location} className="w-3.5 h-3.5" /> ROUTE LOCK
        </span>
        <span className="text-[8px] tracking-[0.14em]" style={{ color: highRisk ? '#C8893B' : '#7BA05B' }}>{highRisk ? 'OPERATOR REVIEW' : 'STANDARD'}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-2 text-[9px]">
        <span style={{ color: '#8A7E6C' }}><MapPin className="w-3 h-3 inline mr-1" />{meta?.region || 'Stanton'}</span>
        <span style={{ color: '#D8CFC0' }}>ETA {etaFor(location)}</span>
      </div>
      {meta?.note && <p className="text-[8px] mt-2 leading-relaxed" style={{ color: highRisk ? '#C8893B' : '#8A7E6C' }}>{highRisk && <AlertTriangle className="w-3 h-3 inline mr-1" />}{meta.note}</p>}
    </div>
  );
}