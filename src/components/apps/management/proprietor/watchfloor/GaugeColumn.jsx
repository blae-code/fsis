import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The yard's vital signs — read at a glance, never scrolled for. */
export default function GaugeColumn({ g }) {
  return (
    <DeckPanel glyph="◍" title="VITALS" meta="30D" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <DeckGauge label="TAKEN IN" value={`${fmtAuec(g.income)} ¤`} color="#E0A22E" />
        <DeckGauge label="PAID OUT" value={`${fmtAuec(g.expense)} ¤`} color="#C05050" />
        <DeckGauge label="NET" value={`${fmtAuec(g.net)} ¤`} color={g.net >= 0 ? '#8A8F45' : '#C05050'} />
        <DeckGauge label="MARGIN" value={`${g.margin.toFixed(1)}%`} color={g.margin >= 0 ? '#5FA0A0' : '#C05050'} fill={g.margin} />
        <DeckGauge label="OPEN ORDERS" value={g.openOrders} sub="not delivered" color="#EDE5D6" />
        <DeckGauge label="DELIVERED" value={g.deliveredToday} sub="today" color="#8A8F45" />
        <DeckGauge label="SHELF VALUE" value={`${fmtAuec(g.shelfValue)} ¤`} sub="listed stock" color="#C8893B" />
        <DeckGauge label="LOOT HELD" value={g.lootHeld} sub="unsold" color="#C8893B" />
        <div className="col-span-2">
          <DeckGauge label="INVOICES UNPAID" value={g.unpaidInvoices} sub="awaiting settlement" color={g.unpaidInvoices > 0 ? '#D08A6A' : '#5F6B33'} />
        </div>
      </div>
    </DeckPanel>
  );
}