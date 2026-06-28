import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07' };

export default function AdminRestockControls({ products = [] }) {
  const qc = useQueryClient();
  const [values, setValues] = useState({});
  const { data: requests = [] } = useQuery({
    queryKey: ['restock_notify_admin_controls'],
    queryFn: () => base44.entities.restock_notify.list('-created_date', 200),
  });
  const demandByProduct = useMemo(() => requests.reduce((map, r) => {
    if (r.request_type === 'reserve' && (r.reserve_status || 'open') === 'open') {
      map[r.product_id] = (map[r.product_id] || 0) + Math.max(1, Number(r.desired_quantity || 1));
    }
    return map;
  }, {}), [requests]);
  const restock = useMutation({
    mutationFn: ({ product, stock }) => base44.entities.product.update(product.id, { stock }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock_notify_admin_controls'] });
      qc.invalidateQueries({ queryKey: ['restock_notify'] });
    },
  });
  const watched = products.filter((p) => demandByProduct[p.id] || (p.stock || 0) < 50).slice(0, 6);
  if (watched.length === 0) return null;
  return (
    <section className="border p-3 space-y-2 font-mono" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}><PackagePlus className="w-3.5 h-3.5" /> PROPRIETOR RESTOCK CONTROLS</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        {watched.map((p) => (
          <div key={p.id} className="border p-2 space-y-2" style={box}>
            <div className="flex justify-between gap-2 text-[10px]"><span style={{ color: '#EDE5D6' }}>{p.code || p.product_name}</span><span style={{ color: '#8A8F45' }}>OPEN RESERVE: {demandByProduct[p.id] || 0}</span></div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={values[p.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))} placeholder={`Current ${p.stock || 0}`} className="h-9 flex-1 border px-2 text-[10px]" style={{ ...box, color: '#EDE5D6' }} />
              <button disabled={restock.isPending || values[p.id] === ''} onClick={() => restock.mutate({ product: p, stock: Math.max(0, Number(values[p.id]) || 0) })} className="h-9 px-3 border text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#8A6430', color: '#E0A22E', background: '#120D08' }}>RESTOCK</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px]" style={{ color: '#7A6E60' }}>Saving stock triggers reserve allocation oldest-first until the new stock is exhausted.</p>
    </section>
  );
}