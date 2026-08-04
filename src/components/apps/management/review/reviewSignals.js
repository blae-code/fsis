/**
 * The bench's judgement: everything the council owes an answer on, ranked by how long
 * the comrade has been waiting. Silence is not a decision, so age is the loudest signal.
 */

const HOUR = 3600 * 1000;
const RANK = { critical: 0, warning: 1, notice: 2 };

const waitedAt = (r) => new Date(r.submitted_at || r.raised_at || r.created_date).getTime();
export const ageHours = (r) => (Date.now() - waitedAt(r)) / HOUR;

export function buildDocket({ submitted = [], requests = [], disputes = [] }) {
  const out = [];
  const push = (s) => { if (s.count > 0) out.push(s); };

  const staleWork = submitted.filter((t) => ageHours(t) > 72);
  const escalated = submitted.filter((t) => t.review_escalated_at);
  const staleOffers = requests.filter((r) => ageHours(r) > 168);
  const staleDisputes = disputes.filter((d) => ageHours(d) > 48);

  push({ id: 'escalated', severity: 'critical', count: escalated.length, label: 'PUT OVER OUR HEADS', detail: 'Filed work escalated past a quiet reviewer.', stage: 'work' });
  push({ id: 'stalework', severity: 'critical', count: staleWork.length, label: 'WORK FILED PAST 72H', detail: 'Labour done and still uncredited.', stage: 'work' });
  push({ id: 'work', severity: 'warning', count: submitted.length - staleWork.length, label: 'WORK AWAITING CREDIT', detail: 'Proof filed, within the promised window.', stage: 'work' });
  push({ id: 'staleoffers', severity: 'critical', count: staleOffers.length, label: 'OFFERS UNANSWERED A WEEK', detail: 'A comrade asked to work and heard nothing.', stage: 'standing' });
  push({ id: 'offers', severity: 'warning', count: requests.length - staleOffers.length, label: 'LABOUR OFFERED', detail: 'Standing requests waiting on the council.', stage: 'standing' });
  push({ id: 'staledisputes', severity: 'critical', count: staleDisputes.length, label: 'DISPUTES PAST 48H', detail: 'Two comrades still without a ruling.', stage: 'disputes' });
  push({ id: 'disputes', severity: 'warning', count: disputes.length - staleDisputes.length, label: 'DISPUTES OPEN', detail: 'Raised and awaiting a hearing.', stage: 'disputes' });

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count);
}

export function benchModel({ submitted = [], requests = [], disputes = [], answered = [] }) {
  const all = [...submitted, ...requests, ...disputes];
  const oldest = all.length ? Math.max(...all.map(ageHours)) : 0;
  const week = Date.now() - 7 * 24 * HOUR;
  const answeredWeek = answered.filter((t) => new Date(t.reviewed_at || t.updated_date).getTime() >= week);
  const credited = answeredWeek.reduce((s, t) => s + (t.credited_auec || 0), 0);
  return {
    owing: all.length,
    oldestDays: oldest / 24,
    work: submitted.length,
    offers: requests.length,
    disputes: disputes.length,
    escalated: submitted.filter((t) => t.review_escalated_at).length,
    answeredWeek: answeredWeek.length,
    creditedWeek: credited,
  };
}