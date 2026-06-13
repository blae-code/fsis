import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, Trash2, Check, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['salvage_commodity','fabricated','service','fps_gear','weapon','ship_component','vehicle_component'];
const CONDITION_GRADES = ['new','refurb','used','worn'];
const SIZE_CLASSES = ['S1','S2','S3','S4','S5','M','L','XL','N/A'];

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

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
    <div className="p-2.5 rounded border flex items-center gap-3 flex-wrap" style={panel}>
      <div className="flex-1 min-w-[10rem]">
        <div className="text-xs text-foreground">{product.product_name} {product.code && <span className="text-primary">[{product.code}]</span>}</div>
        <div className="text-[9px] text-muted-foreground">{product.category} • per {product.unit || 'SCU'}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground">PRICE</span>
        <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="h-7 w-24 text-[10px] font-mono" style={border} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground">STOCK</span>
        <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-7 w-20 text-[10px] font-mono" style={border} />
      </div>
      {dirty && (
        <Button size="sm" className="h-7 px-2 text-[9px] font-mono gap-1"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ price_auec: parseFloat(price) || 0, stock: parseFloat(stock) || 0 })}>
          {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} SAVE
        </Button>
      )}
      <button onClick={() => updateMutation.mutate({ available: !product.available })} title="Toggle storefront visibility">
        <Badge variant="outline" className={`text-[9px] h-4 cursor-pointer ${product.available ? 'border-primary/40 text-primary' : 'border-muted text-muted-foreground'}`}>
          {product.available ? 'LISTED' : 'HIDDEN'}
        </Badge>
      </button>
      <button onClick={() => deleteMutation.mutate()} className="text-muted-foreground hover:text-destructive">
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
    <div className="space-y-4">
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <PackagePlus className="w-3 h-3" /> ADD WARE TO CATALOG
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input placeholder="Product name *" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs col-span-2 md:col-span-1" style={border} />
          <Input placeholder="Code (RMC…)" value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs" style={border} />
          <Input type="number" min="0" placeholder="Price aUEC *" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="h-8 text-xs" style={border} />
          <Input type="number" min="0" placeholder="Stock" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="h-8 text-xs" style={border} />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="h-8 text-xs font-mono" style={border}><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs font-mono">{c.replace(/_/g,' ').toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newCondition} onValueChange={setNewCondition}>
            <SelectTrigger className="h-8 text-xs font-mono" style={border}><SelectValue placeholder="Condition grade" /></SelectTrigger>
            <SelectContent>{CONDITION_GRADES.map((g) => <SelectItem key={g} value={g} className="text-xs font-mono">{g.toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newSize} onValueChange={setNewSize}>
            <SelectTrigger className="h-8 text-xs font-mono" style={border}><SelectValue placeholder="Size class" /></SelectTrigger>
            <SelectContent>{SIZE_CLASSES.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Manufacturer" value={newMfr} onChange={(e) => setNewMfr(e.target.value)} className="h-8 text-xs" style={border} />
          <Button size="sm" className="h-8 text-[10px] md:col-start-4" disabled={!name || !newPrice || createMutation.isPending} onClick={() => createMutation.mutate()}>
            ADD
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground">Use "Reprice Store" in the Salvage app to anchor catalog prices to live UEX market data.</p>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">CATALOG ({products.length})</div>
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No wares in the catalog yet.</p>
        ) : products.map((p) => <ProductRow key={p.id} product={p} />)}
      </div>
    </div>
  );
}