import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { identityNames, compareIdentities, pairKey, THRESHOLD } from '../../shared/identity.js';

/**
 * Gathers grounds where an account carrying a mark or a dismissal appears to be the same comrade as
 * another account. Nothing is decided here: each pair is put before the council with its reasons
 * stated, and pairs the council has already ruled on are left untouched.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to review linked identities.' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const [users, requests, orders, existing] = await Promise.all([
      svc.User.list('-created_date', 300),
      svc.standing_request.list('-created_date', 300),
      svc.order.list('-created_date', 400),
      svc.identity_link.list('-created_date', 300),
    ]);

    const requestsBy = new Map();
    requests.forEach((r) => {
      const key = String(r.applicant_email || '').toLowerCase();
      if (!requestsBy.has(key)) requestsBy.set(key, []);
      requestsBy.get(key).push(r);
    });
    const ordersBy = new Map();
    orders.forEach((o) => {
      const key = String(o.claimed_by_email || '').toLowerCase();
      if (!key) return;
      if (!ordersBy.has(key)) ordersBy.set(key, []);
      ordersBy.get(key).push(o);
    });

    const profiles = users.map((u) => {
      const email = String(u.email || '').toLowerCase();
      const reqs = requestsBy.get(email) || [];
      return {
        user: u,
        contact: reqs.find((r) => r.note || r.handle)?.handle || '',
        names: identityNames(u, { requests: reqs, orders: ordersBy.get(email) || [] }),
      };
    });

    const flagged = profiles.filter((p) => p.user.standing_locked || (Number(p.user.reputation) || 0) < 0);
    const ruled = new Map(existing.map((l) => [l.pair_key, l]));
    const now = new Date().toISOString();
    const toCreate = [];
    const toUpdate = [];

    for (const a of flagged) {
      for (const b of profiles) {
        if (b.user.id === a.user.id) continue;
        const key = pairKey(a.user.id, b.user.id);
        const seen = ruled.get(key);
        if (seen && seen.status !== 'suspected') continue;

        const { score, signals } = compareIdentities(a, b);
        if (score < THRESHOLD) continue;

        const record = {
          pair_key: key,
          flagged_user_id: a.user.id,
          flagged_email: a.user.email,
          flagged_handle: a.user.handle || a.user.full_name || a.user.email,
          other_user_id: b.user.id,
          other_email: b.user.email,
          other_handle: b.user.handle || b.user.full_name || b.user.email,
          signals,
          score,
          status: 'suspected',
          last_scanned_at: now,
        };
        if (seen) toUpdate.push({ id: seen.id, ...record });
        else { toCreate.push(record); ruled.set(key, { pair_key: key, status: 'suspected' }); }
      }
    }

    if (toCreate.length > 0) await svc.identity_link.bulkCreate(toCreate);
    if (toUpdate.length > 0) await svc.identity_link.bulkUpdate(toUpdate);

    return Response.json({
      ok: true,
      accounts_examined: profiles.length,
      flagged_accounts: flagged.length,
      new_suspicions: toCreate.length,
      refreshed: toUpdate.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}