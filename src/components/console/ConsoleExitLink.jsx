import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

/** The way back out to the shop floor — always at the foot of the rail, never buried in a menu. */
export default function ConsoleExitLink() {
  return (
    <Link
      to="/"
      title="Back to the storefront"
      className="mt-auto mx-1 py-3 flex flex-col items-center gap-1 transition-colors"
      style={{ color: '#8A8F45', boxShadow: 'inset 0 1px 0 #2A2118' }}
    >
      <Store className="w-4 h-4" />
      <span className="text-[7px] font-mono font-bold tracking-[0.14em]">STORE</span>
      <span className="text-[6px] font-mono" style={{ color: '#3A3028' }}>EXIT</span>
    </Link>
  );
}