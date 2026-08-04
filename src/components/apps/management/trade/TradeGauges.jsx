import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The shop's vital signs — read at a glance, never scrolled for. */
export default function TradeGauges({ g }) {
  const stocked = g.listed - g.outOfStock;
  return (
    <DeckPanel glyph="◍" title="SHOP VITALS" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <DeckGauge label="OPEN ORDERS" value={g.openOrders} sub="not delivered" color="#EDE5D6" />
        <DeckGauge label="UNANSWERED" value={g.newOrders} sub="awaiting a word" color={g.newOrders > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="OPEN VALUE" value={`${fmtAuec(g.openValue)} ¤`} sub="owed on the books" color="#E0A22E" />
        <DeckGauge label="DELIVERED" value={g.deliveredToday} sub="today" color="#8A8F45" />
        <DeckGauge label="SHELF VALUE" value={`${fmtAuec(g.shelfValue)} ¤`} sub="listed stock" color="#C8893B" />
        <DeckGauge label="ON THE SHELF" value={`${stocked}/${g.listed}` } sub="stocked of listed" color="#5FA0A0" fill={g.listed ? (stocked / g.listed) * 100 : 0} />
        <DeckGauge label="BUYERS WAITING" value={g.waiting} sub="notices & reserves" color={g.waiting > 0 ? '#E0A22E' : '#5F6B33'} />
        <DeckGauge label="CODES STANDING" value={g.activeCodes} sub="active discounts" color="#EDE5D6" />
      </div>
    </DeckPanel>
  );
}