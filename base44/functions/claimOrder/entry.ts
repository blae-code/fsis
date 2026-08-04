import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { boundCodes, checkLimit, recordFailure, MAX_CODES_PER_REQUEST } from '../../shared/ratelimit.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * A patron links a guest order to their account using the receipt they were given.
 *
 * Buying never required an account, so this is the bridge for those who choose to make one.
 *
 * It is also the most attackable thing in the app, and used to be wide open. A claimed order is not
 * a trinket: `recordTradeConduct` reads `claimed_by_user_id` to decide whose trade standing a
 * handoff belongs to, so claiming a stranger's order harvests their purchase history AND lets the
 * claimer accrue trade standing — which moves storefront prices — from handoffs they never attended.
 *
 * It was protected by the tracking code alone: six hex characters, about sixteen million
 * possibilities. This function accepted an ARRAY of them and nothing counted how often anybody was
 * wrong, so a thousand guesses a request swept the whole space in a few thousand requests.
 *
 * Three things close that, and none of them inconveniences somebody holding their own receipt:
 *
 *   1. BOTH halves of the receipt are required — the tracking code and the handoff passphrase. The
 *      buyer has both on the manifest they were given; a guesser has to find two secrets at once.
 *   2. The batch is bounded, so one request cannot be a dictionary.
 *   3. Wrong guesses are counted against the account and cut off after a few. You must be signed in
 *      to claim, which means an attacker cannot be anonymous — and that is exactly what makes
 *      throttling per account the right control here.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first so the order can be linked to your account.' }, { status: 401 });

    const body = await req.json();
    const codes = boundCodes(
      Array.isArray(body?.tracking_codes) ? body.tracking_codes : [body?.tracking_code],
    );
    if (codes.length === 0) return Response.json({ error: 'Give at least one tracking code.' }, { status: 400 });

    // The other half of the receipt. One passphrase per request, because these are claimed one
    // order at a time by somebody reading a manifest — not swept in bulk.
    const passphrase = String(body?.handoff_passphrase || '').trim().toUpperCase();
    if (!passphrase) {
      return Response.json({
        error: 'Give the handoff passphrase from your manifest as well as the tracking code. Both are on the receipt you were sent — the code alone is not enough to bind an order to an account.',
      }, { status: 400 });
    }
    if (codes.length > 1) {
      return Response.json({
        error: `Claim orders one at a time — each has its own passphrase. At most ${MAX_CODES_PER_REQUEST} codes are ever accepted in a request, and each needs its own, so send them singly.`,
      }, { status: 400 });
    }

    const gate = await checkLimit(base44, { action: 'claim_order', subject: user.id });
    if (!gate.allowed) {
      return Response.json({ error: gate.reason, retry_after_seconds: gate.retry_after_seconds }, { status: 429 });
    }

    const svc = base44.asServiceRole.entities;
    const code = codes[0];
    const matches = await svc.order.filter({ tracking_code: code }, '-created_date', 5);
    const order = matches[0];

    // One message for "no such order" and "wrong passphrase" alike. Telling a guesser which half
    // they got right halves the work of finding the other.
    const wrong = !order
      || String(order.handoff_passphrase || '').trim().toUpperCase() !== passphrase;
    if (wrong) {
      await recordFailure(base44, {
        action: 'claim_order', subject: user.id, detail: `code ${code.slice(0, 5)}…`,
      });
      return Response.json({
        error: 'That tracking code and passphrase do not match an order. Check both against your manifest.',
        attempts_remaining: Math.max(0, (gate.remaining === Infinity ? 5 : gate.remaining) - 1),
      }, { status: 404 });
    }

    if (order.claimed_by_user_id && order.claimed_by_user_id !== user.id) {
      return Response.json({
        error: 'That order is already linked to another account. If it is yours, ask the council — it is not something to work around.',
      }, { status: 409 });
    }
    if (order.claimed_by_user_id === user.id) {
      return Response.json({ ok: true, claimed: [code], already_yours: true, skipped: [] });
    }

    // Claimed atomically, so two accounts racing the same receipt cannot both take it.
    const claim = await svc.order.updateMany(
      { id: order.id, claimed_by_user_id: null },
      { $set: { claimed_by_user_id: user.id, claimed_by_email: user.email || '', claimed_at: new Date().toISOString() } },
    );
    if (!claim || claim.updated === 0) {
      const fresh = await svc.order.get(order.id).catch(() => null);
      if (fresh?.claimed_by_user_id === user.id) {
        return Response.json({ ok: true, claimed: [code], already_yours: true, skipped: [] });
      }
      return Response.json({ error: 'That order was claimed a moment ago.' }, { status: 409 });
    }

    await svc.ops_log.create({
      action: 'order.claimed',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: code,
      actor: user.email,
      after: { claimed_by_user_id: user.id },
      notes: 'Guest order linked to an account with both halves of the receipt.',
    }).catch(() => null);

    return Response.json({ ok: true, claimed: [code], skipped: [] });
  } catch (error) {
    await reportError(base44, { source: 'claimOrder', error, route: 'claimOrder' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
