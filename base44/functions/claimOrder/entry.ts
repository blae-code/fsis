import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * A patron links a guest order to their account using the tracking code from their receipt.
 * Buying never required an account, so this is the bridge for those who choose to make one.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first so the order can be linked to your account.' }, { status: 401 });

    const body = await req.json();
    const codes: string[] = Array.isArray(body?.tracking_codes)
      ? body.tracking_codes.map((c: unknown) => String(c || '').trim().toUpperCase()).filter(Boolean)
      : [String(body?.tracking_code || '').trim().toUpperCase()].filter(Boolean);

    if (codes.length === 0) return Response.json({ error: 'Give at least one tracking code.' }, { status: 400 });

    const claimed: string[] = [];
    const skipped: { code: string; reason: string }[] = [];

    for (const code of codes) {
      const matches = await base44.asServiceRole.entities.order.filter({ tracking_code: code });
      const order = matches[0];
      if (!order) { skipped.push({ code, reason: 'no order found' }); continue; }
      if (order.claimed_by_user_id && order.claimed_by_user_id !== user.id) {
        skipped.push({ code, reason: 'already claimed by another account' });
        continue;
      }
      if (order.claimed_by_user_id === user.id) { claimed.push(code); continue; }

      await base44.asServiceRole.entities.order.update(order.id, {
        claimed_by_user_id: user.id,
        claimed_by_email: user.email || '',
        claimed_at: new Date().toISOString(),
      });
      claimed.push(code);
    }

    return Response.json({ ok: true, claimed, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}