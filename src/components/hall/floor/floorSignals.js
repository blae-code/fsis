import { closingSoon } from '@/components/hall/hallMeta';

/** What the floor owes a comrade an answer on, and the state of the lots in view. */
export function floorModel({ lots = [], scope = 'open' }) {
  const now = Date.now();
  const live = lots.filter((l) => ['listed', 'bidding'].includes(l.status));
  const soon = live.filter((l) => closingSoon(l.closes_at));
  const leading = lots.filter((l) => l.you_are_leading);
  const outbid = lots.filter((l) => l.you_have_bid && !l.you_are_leading && ['listed', 'bidding'].includes(l.status));
  const quiet = live.filter((l) => (l.bid_count || 0) === 0);
  const closed = lots.filter((l) => ['won', 'settled', 'reserve_not_met', 'no_bids', 'expired'].includes(l.status));
  const standing = live.reduce((s, l) => s + Number((l.bid_count > 0 ? l.current_bid_auec : l.start_auec) || 0), 0);
  const watching = lots.filter((l) => l.you_are_watching);
  const withinDay = live.filter((l) => l.closes_at && new Date(l.closes_at).getTime() < now + 86400e3);

  const signals = [
    outbid.length && { desk: scope, severity: 'critical', count: outbid.length, label: 'YOU HAVE BEEN OUTBID', detail: 'Somebody bid over you and the lot is still open.' },
    soon.length && { desk: scope, severity: 'critical', count: soon.length, label: 'CLOSING INSIDE THE HOUR', detail: 'Last chance to bid before the hammer falls.' },
    withinDay.length && { desk: scope, severity: 'warning', count: withinDay.length, label: 'CLOSING TODAY', detail: 'Open now, gone within the day.' },
    leading.length && { desk: scope, severity: 'notice', count: leading.length, label: 'YOURS AT PRESENT', detail: 'Your bid leads. A reserve may still stand above it.' },
    quiet.length && { desk: scope, severity: 'notice', count: quiet.length, label: 'NO BIDS YET', detail: 'Nobody has opened these. They go at the opening figure.' },
  ].filter(Boolean);

  return {
    signals,
    gauges: {
      live: live.length,
      soon: soon.length,
      leading: leading.length,
      outbid: outbid.length,
      quiet: quiet.length,
      closed: closed.length,
      watching: watching.length,
      standing,
    },
  };
}