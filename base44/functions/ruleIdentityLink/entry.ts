import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { MARK_LIFETIME_DAYS, APPEAL_WINDOW_DAYS, recomputeStanding } from '../../shared/reputation.js';

/**
 * The council rules on a suspected pair of accounts.
 *
 * Ruled linked, the standing of the marked account is carried across: the second account is locked
 * on the same grounds and carries the same weight of mark, so a dismissal cannot be shed by
 * registering again. The comrade keeps every ordinary protection — the reasons are stated, the
 * event appears in their own record, and the appeal route is the same one open to any mark.
 * Ruled cleared, the pair is left alone and never raised again by the sweep.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to rule on linked identities.' }, { status: 403 });
    }

    const body = await req.json();
    const linkId = String(body?.link_id || '').trim();
    const action = String(body?.action || '').trim();
    const ruling = String(body?.ruling || '').trim();
    if (!linkId) return Response.json({ error: 'link_id is required.' }, { status: 400 });
    if (!['linked', 'cleared'].includes(action)) {
      return Response.json({ error: "action must be 'linked' or 'cleared'." }, { status: 400 });
    }
    if (!ruling) return Response.json({ error: 'A ruling must be stated — both comrades may read it.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const link = await svc.identity_link.get(linkId);
    if (!link) return Response.json({ error: 'Suspected link not found.' }, { status: 404 });
    if (link.status !== 'suspected') return Response.json({ error: 'This pair has already been ruled on.' }, { status: 400 });

    const now = new Date();
    await svc.identity_link.update(linkId, {
      status: action,
      ruling,
      ruled_by_email: user.email,
      ruled_at: now.toISOString(),
    });

    let carried = null;
    if (action === 'linked') {
      const flaggedAccount = await svc.User.get(link.flagged_user_id);
      const other = await svc.User.get(link.other_user_id);
      if (other) {
        const reason = `Ruled the same comrade as ${link.flagged_handle}: ${ruling}`;
        const delta = -Math.abs(Number(flaggedAccount?.reputation) < 0 ? Number(flaggedAccount.reputation) : 25);

        await svc.User.update(other.id, {
          standing_locked: true,
          standing_locked_reason: reason,
        });
        await svc.standing_event.create({
          member_user_id: other.id,
          member_email: other.email,
          member_handle: other.handle || other.full_name || other.email,
          kind: 'dismissed',
          delta,
          effective_delta: delta,
          reason,
          source_type: 'identity_link',
          source_id: linkId,
          source_name: `Standing carried from ${link.flagged_handle}`,
          actor_email: user.email,
          actor_role: fsisRole(user),
          appeal_due_by: new Date(now.getTime() + APPEAL_WINDOW_DAYS * 86400000).toISOString(),
          expires_at: new Date(now.getTime() + MARK_LIFETIME_DAYS * 86400000).toISOString(),
        });
        carried = await recomputeStanding(base44, other.id);
      }
    }

    await svc.ops_log.create({
      action: `identity_link.${action}`,
      entity_type: 'identity_link',
      entity_id: linkId,
      entity_name: `${link.flagged_handle} ↔ ${link.other_handle}`,
      actor: user.email,
      after: { status: action, carried_standing: carried },
      notes: ruling,
    });

    return Response.json({ ok: true, status: action, carried_standing: carried });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}