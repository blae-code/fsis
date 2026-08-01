import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus } from 'lucide-react';
import RestockRequestDetails from '@/components/store/RestockRequestDetails';

const box = { borderColor: '#3A2F20', background: '#0C0A07' };

export default function AdminRestockControls({ products: productsProp }) {
  const qc = useQueryClient();
  const [values, setValues] = useState({});
  // Standalone mode (e.g. Management Console tab): fetch the catalog itself
  const { data: fetchedProducts = [] } = useQuery({
    queryKey: ['restock_controls_products'],
    queryFn: () => base44.entities.product.list('sort_order', 300),
    enabled: !productsProp,
  });
  const products = productsProp ?? fetchedProducts;
  const { data: requests = [] } = useQuery({
    queryKey: ['restock_notify_admin_controls'],
    queryFn: () => base44.entities.restock_notify.list('-created_date', 200),
    refetchInterval: 30000,
  });
  // All requests belonging to a product (by id, or by name after a reseed)
  const requestsByProduct = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.id] = requests
        .filter((r) => r.product_id === p.id || (r.product_name && r.product_name === p.product_name))
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
    return map;
  }, [requests, products]);
  const demandByProduct = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.id] = (requestsByProduct[p.id] || [])
        .filter((r) => r.request_type === 'reserve' && (r.reserve_status || 'open') === 'open')
        .reduce((sum, r) => sum + Math.max(1, Number(r.desired_quantity || 1)), 0);
    }
    return map;
  }, [requestsByProduct, products]);
  const restock = useMutation({
    mutationFn: ({ product, stock }) => base44.entities.product.update(product.id, { stock }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock_notify_admin_controls'] });
      qc.invalidateQueries({ queryKey: ['restock_notify'] });
      // Allocation runs server-side after the stock write — re-read shortly after
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['restock_notify_admin_controls'] });
        qc.invalidateQueries({ queryKey: ['restock_controls_products'] });
      }, 2500);
    },
  });
  const watched = products
    .filter((p) => demandByProduct[p.id] || (requestsByProduct[p.id] || []).length > 0 || (p.stock || 0) < 50)
    .sort((a, b) => (demandByProduct[b.id] || 0) - (demandByProduct[a.id] || 0))
    .slice(0, 12);
  // Embedded in the storefront catalog: stay hidden when nothing needs attention.
  if (watched.length === 0 && productsProp) return null;
  return (
    <section className="border p-3 space-y-2 font-mono" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}><PackagePlus className="w-3.5 h-3.5" /> PROPRIETOR RESTOCK CONTROLS</div>
      {watched.length === 0 && (
        <p className="text-[9px] py-4 text-center" style={{ color: '#7A6E60' }}>No watched products — nothing has open reserve demand or stock below 50.</p>
      )}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        {watched.map((p) => (
          <div key={p.id} className="border p-2 space-y-2" style={box}>
            <div className="flex justify-between gap-2 text-[10px]"><span style={{ color: '#EDE5D6' }}>{p.code || p.product_name}</span><span style={{ color: '#8A8F45' }}>OPEN RESERVE: {demandByProduct[p.id] || 0}</span></div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={values[p.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))} placeholder={`Current ${p.stock || 0}`} className="h-9 flex-1 border px-2 text-[10px]" style={{ ...box, color: '#EDE5D6' }} />
              <button disabled={restock.isPending || values[p.id] === ''} onClick={() => restock.mutate({ product: p, stock: Math.max(0, Number(values[p.id]) || 0) })} className="h-9 px-3 border text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#8A6430', color: '#E0A22E', background: '#120D08' }}>RESTOCK</button>
            </div>
            <div className="flex items-center justify-between text-[8px]" style={{ color: '#7A6E60' }}>
              <span>STOCK {p.stock || 0} {p.unit || 'SCU'}</span>
              <span>{(requestsByProduct[p.id] || []).length} REQUEST(S)</span>
            </div>
            <RestockRequestDetails requests={requestsByProduct[p.id] || []} />
          </div>
        ))}
      </div>
      <p className="text-[9px]" style={{ color: '#7A6E60' }}>Saving stock triggers reserve allocation oldest-first until the new stock is exhausted.</p>
    </section>
  );
}