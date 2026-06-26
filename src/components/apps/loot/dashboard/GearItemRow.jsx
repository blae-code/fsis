import React from 'react';
import { conditionGrade, formatAuec } from '@/components/apps/loot/dashboard/lootGearUtils';

const gradeColor = { new: '#7BA05B', refurb: '#8A8F45', used: '#C8893B', worn: '#C05050' };

export default function GearItemRow({ item, onPublish, publishing }) {
  const grade = item.condition_grade || conditionGrade(item.condition_pct);
  const canPublish = !['listed', 'sold', 'scrapped'].includes(item.status) && Number(item.est_sell_auec || 0) > 0;
  return (
    <div className="grid grid-cols-[1fr_7rem_6rem_7rem_8rem] gap-3 items-center border px-3 py-2 font-mono" style={{ borderColor: '#2A2118', background: '#0E0C09' }}>
      <div className="min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: '#D8CFC0' }}>{item.item_name}</div>
        <div className="text-[8px] truncate" style={{ color: '#7A6E60' }}>{item.manufacturer || 'Unknown maker'} • {item.item_type?.replace(/_/g, ' ') || 'item'} • {item.size_class || 'N/A'}</div>
      </div>
      <div className="text-[10px]" style={{ color: gradeColor[grade] }}>{grade.toUpperCase()} {item.condition_pct ?? 0}%</div>
      <div className="text-[10px]" style={{ color: '#C8A05B' }}>×{item.quantity || 1}</div>
      <div className="text-[10px] font-bold" style={{ color: '#E0A22E' }}>{formatAuec(item.est_sell_auec)}</div>
      {canPublish ? (
        <button disabled={publishing} onClick={() => onPublish(item)} className="border px-2 py-1 text-[8px] font-bold tracking-[0.12em] disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45', background: '#12130C' }}>LIST FOR SALE</button>
      ) : (
        <span className="text-[8px] tracking-[0.12em]" style={{ color: '#7A6E60' }}>{(item.status || 'raw').toUpperCase()}</span>
      )}
    </div>
  );
}