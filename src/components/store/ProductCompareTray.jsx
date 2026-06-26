import React from 'react';

const REDSCAR_DISCOUNT_PERCENT = 10;

export default function ProductCompareTray({ products = [], onClear, onView }) {
  if (products.length === 0) return null;

  return (
    <div className="border p-3 font-mono space-y-2" style={{ borderColor: '#5C4424', background: '#100D09' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em]" style={{ color: '#E0A22E' }}>COMPARE WARES</div>
          <p className="text-[9px]" style={{ color: '#8A7E6C' }}>Select up to 3 products to compare price, member rate, stock, and condition.</p>
        </div>
        <button onClick={onClear} className="text-[9px] font-bold tracking-[0.14em] border px-2 py-1 hover:brightness-125" style={{ borderColor: '#3A2F20', color: '#8A7E6C' }}>CLEAR</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {products.map((p) => {
          const member = Math.round((p.price_auec || 0) * (100 - REDSCAR_DISCOUNT_PERCENT) / 100);
          return (
            <button key={p.id} onClick={() => onView?.(p)} className="text-left border p-2 hover:brightness-110" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
              <div className="text-[10px] font-bold truncate" style={{ color: '#F2EADC' }}>{p.code || p.product_name}</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[9px]">
                <span style={{ color: '#6B6155' }}>STANDARD</span><span style={{ color: '#E0A22E' }}>{(p.price_auec || 0).toLocaleString()}</span>
                <span style={{ color: '#6FA08F' }}>REDSCAR</span><span style={{ color: '#9ED0BD' }}>{member.toLocaleString()}</span>
                <span style={{ color: '#6B6155' }}>STOCK</span><span style={{ color: '#D8CFC0' }}>{p.category === 'service' ? 'REQUEST' : `${p.stock || 0} ${p.unit || 'SCU'}`}</span>
                <span style={{ color: '#6B6155' }}>STATE</span><span style={{ color: '#D8CFC0' }}>{(p.condition_grade || 'standard').toUpperCase()}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}