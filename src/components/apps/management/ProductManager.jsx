import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { PackagePlus, Trash2, Check, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { C, panel, plate, notch, actionBtn } from '@/components/console/theme';

const CATEGORIES = ['salvage_commodity','fabricated','service','fps_gear','weapon','ship_component','vehicle_component'];
const CONDITION_GRADES = ['new','refurb','used','worn'];
const SIZE_CLASSES = ['S1','S2','S3','S4','S5','M','L','XL','N/A'];

const inputStyle = { borderColor: '#3A2F20', background: '#0A0806', color: C.bone };

function ProductRow({ product }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(product.price_auec ?? ''));
  const [stock, setStock] = useState(String(product.stock ?? 0));

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.product.update(product.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mgmt_products'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.product.delete(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mgmt_products'] }),
  });

  const dirty = parseFloat(price) !== product.price_auec || parseFloat(stock) !== (product.stock ?? 0);

  return (
    <div className="p-2.5 border flex items-center gap-3 flex-wrap font-mono" style={panel}>
      <div className="flex-1 min-w-[10rem]">
        <div className="text-xs" style={{ color: C.parchment }}>{product.product_name} {product.code && <span style={{ color: C.amber }}>[{product.code}]</span>}</div>
        <div className="text-[9px]" style={{ color: C.dim }}>{product.category} • per {product.unit || 'SCU'}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] tracking-[0.14em]" style={{ color: C.faint }}>PRICE</span>
        <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="h-7 w-24 text-[10px] font-mono" style={inputStyle} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] tracking-[0.14em]" style={{ color: C.faint }}>STOCK</span>
        <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-7 w-20 text-[10px] font-mono" style={inputStyle} />
      </div>
      {dirty && (
        <button
          className="h-7 px-2.5 border text-[9px] font-bold tracking-[0.12em] flex items-center gap-1 hover:brightness-125 disabled:opacity-40"
          style={actionBtn}
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ price_auec: parseFloat(price) || 0, stock: parseFloat(stock) || 0 })}>
          {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} SAVE
        </button>
      )}
      <button onClick={() => updateMutation.mutate({ available: !product.available })} title="Toggle storefront visibility">
        <span
          className="text-[8px] font-bold tracking-[0.12em] px-2 py-0.5 border cursor-pointer"
          style={product.available
            ? { borderColor: `${C.green}55`, color: C.green, background: `${C.green}10` }
            : { borderColor: '#3A2F20', color: C.dim, background: '#0A0806' }}
        >
          {product.available ? '● LISTED' : '○ HIDDEN'}
        </span>
      </button>
      <button onClick={() => deleteMutation.mutate()} className="opacity-30 hover:opacity-70" style={{ color: C.red }}>
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

/** Storefront catalog management — pricing, stock, and listing visibility */
export default function ProductManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('salvage_commodity');
  const [newCondition, setNewCondition] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newMfr, setNewMfr] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['mgmt_products'],
    queryFn: () => base44.entities.product.list('sort_order'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.product.create({
        product_name: name,
        code: code.toUpperCase(),
        category: newCategory,
        price_auec: parseFloat(newPrice) || 0,
        stock: parseFloat(newStock) || 0,
        ...(newCondition && { condition_grade: newCondition }),
        ...(newSize && newSize !== 'N/A' && { size_class: newSize }),
        ...(newMfr && { manufacturer: newMfr }),
        available: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mgmt_products'] });
      setName(''); setCode(''); setNewPrice(''); setNewStock(''); setNewCondition(''); setNewSize(''); setNewMfr('');
    },
  });

  return (
    <div className="space-y-4 font-mono">
      <div className="p-3 border space-y-2" style={{ ...plate, ...notch(8) }}>
        <div className="text-[9px] tracking-[0.22em] flex items-center gap-2" style={{ color: C.amber }}>
          <PackagePlus className="w-3.5 h-3.5" /> ADD WARE TO CATALOG
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input placeholder="Product name *" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs col-span-2 md:col-span-1" style={inputStyle} />
          <Input placeholder="Code (RMC…)" value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <Input type="number" min="0" placeholder="Price aUEC *" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <Input type="number" min="0" placeholder="Stock" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="h-8 text-xs font-mono" style={inputStyle}><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs font-mono">{c.replace(/_/g,' ').toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newCondition} onValueChange={setNewCondition}>
            <SelectTrigger className="h-8 text-xs font-mono" style={inputStyle}><SelectValue placeholder="Condition grade" /></SelectTrigger>
            <SelectContent>{CONDITION_GRADES.map((g) => <SelectItem key={g} value={g} className="text-xs font-mono">{g.toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newSize} onValueChange={setNewSize}>
            <SelectTrigger className="h-8 text-xs font-mono" style={inputStyle}><SelectValue placeholder="Size class" /></SelectTrigger>
            <SelectContent>{SIZE_CLASSES.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Manufacturer" value={newMfr} onChange={(e) => setNewMfr(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <button
            className="h-8 border text-[9px] font-bold tracking-[0.14em] md:col-start-4 hover:brightness-125 disabled:opacity-40"
            style={actionBtn}
            disabled={!name || !newPrice || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'ADDING…' : 'ADD TO CATALOG'}
          </button>
        </div>
        <p className="text-[9px]" style={{ color: C.dim }}>Use "Reprice Store" in the Salvage app to anchor catalog prices to live UEX market data.</p>
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] tracking-[0.22em]" style={{ color: C.dim }}>CATALOG ({products.length})</div>
        {products.length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: C.dim }}>No wares in the catalog yet.</p>
        ) : products.map((p) => <ProductRow key={p.id} product={p} />)}
      </div>
    </div>
  );
}