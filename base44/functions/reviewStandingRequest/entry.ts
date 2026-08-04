import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, canGrant, fsisRole, platformRoleFor } from '../../shared/roles.js';
import { parseSkills } from '../../shared/skills.js';
import { knownZone } from '../../shared/timekeeping.js';
import { REAPPLY_AFTER_DAYS } from '../../shared/onboarding.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The council answers somebody who asked to work with us.
 *
 * This is the half that was never built. `requestStanding` wrote a request and the council admitted
 * people through `setMemberStanding`, which changes a role and never touches the request — so every
 * request ever filed is still marked `pending`, `declined` was unreachable, and nobody was ever told
 * they had been accepted. A person applied, waited, and either found out by noticing the app behaved
 * differently, or never found out at all.
 *
 * Worse, the stale `pending` row blocks a second request forever, so anybody turned down could never
 * ask again. Answering here closes that: a declined applicant may ask again after a stated wait,
 * because being turned down once is not a verdict for life and a collective that never reconsiders
 * is one that shrinks.
 *
 * Declining requires a reason, and the reason is shown to them in full. A rejection with no account
 * of itself is the thing this whole app is built not to do.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const requestId = String(body?.request_id || '').trim();
    const decision = String(body?.decision || '').trim();
    const notes = String(body?.review_notes || '').trim();
    if (!requestId) return Response.json({ error: 'request_id is required.' }, { status: 400 });
    if (!['accept', 'decline'].includes(decision)) {
      return Response.json({ error: "decision must be 'accept' or 'decline'." }, { status: 400 });
    }
    if (decision === 'decline' && !notes) {
      return Response.json({
        error: 'Give a reason. They will read it in full, and a rejection with no account of itself is the one thing this collective does not do.',
      }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const request = await svc.standing_request.get(requestId);
    if (!request) return Response.json({ error: 'No such request.' }, { status: 404 });
    if (request.status !== 'pending') {
      return Response.json({ error: `That request was already ${request.status}.` }, { status: 409 });
    }

    const granting = request.requested_role || 'contractor';
    if (decision === 'accept' && !canGrant(user, granting)) {
      return Response.json({ error: 'Your standing does not permit granting that.' }, { status: 403 });
    }

    const now = new Date();
    // Claim the request before granting anything, so two council members answering at once cannot
    // both admit the same person and write two access grants.
    const claim = await svc.standing_request.updateMany(
      { id: requestId, status: 'pending' },
      {
        $set: {
          status: decision === 'accept' ? 'accepted' : 'declined',
          reviewed_by_email: user.email,
          reviewed_at: now.toISOString(),
          review_notes: notes,
        },
      },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'Another council member answered that a moment ago.' }, { status: 409 });
    }

    const applicant = request.applicant_user_id
      ? await svc.User.get(request.applicant_user_id).catch(() => null)
      : null;

    if (decision === 'accept' && applicant) {
      const patch: Record<string, unknown> = {
        fsis_role: granting,
        role: platformRoleFor(granting),
        role_granted_by: user.email,
        role_granted_at: now.toISOString(),
        membership_status: 'active',
      };
      // What they wrote about themselves, carried onto the record so the board can put likely work
      // in front of them and musters can read in their own clock.
      if (!(Array.isArray(applicant.skills) && applicant.skills.length > 0)) {
        const declared = parseSkills(request.skills || '');
        if (declared.length > 0) patch.skills = declared;
      }
      const zone = String(request.timezone || '').trim();
      if (zone && !applicant.timezone && knownZone(zone)) patch.timezone = zone;
      if (request.handle && !applicant.handle) patch.handle = request.handle;

      await svc.User.update(applicant.id, patch);

      await svc.access_grant.create({
        target_email: applicant.email,
        target_handle: applicant.handle || request.handle || '',
        action: 'granted',
        new_role: granting,
        previous_role: 'patron',
        actor_email: user.email,
        actor_role: fsisRole(user),
        reason: notes || 'Admitted from a standing request.',
      }).catch(() => null);
    }

    if (applicant) {
      await notify(base44, {
        recipient_user_id: applicant.id,
        recipient_handle: applicant.handle || request.handle,
        kind: 'council_message',
        title: decision === 'accept'
          ? 'You are in — welcome to the yard'
          : 'The council has answered your request',
        body: decision === 'accept'
          ? [
            `You hold ${granting} standing with FSIS from now.`,
            'The labour board is open to you: take work that suits you, answer a muster, or say nothing at all. Nobody is rostered here, and no obligation follows from having joined.',
            'Your pay for task work is settled in full and directly at the agreed sum — it is never drawn from anybody else\'s share. Standing you earn is a record of labour given, shown to you in full, and every mark carries a reason and a way to answer it.',
            notes,
          ].filter(Boolean).join('\n\n')
          : [
            'The council has not taken up your request this time.',
            `Their reason, in full: ${notes}`,
            `You may ask again after ${REAPPLY_AFTER_DAYS} days. Being turned down once is not a verdict for life, and nothing is recorded against you.`,
            'You keep your account and can carry on buying at the storefront exactly as before.',
          ].join('\n\n'),
        source_type: 'standing_request',
        source_id: requestId,
        source_name: request.handle || '',
        actor_email: user.email,
        actor_role: fsisRole(user),
      });
    }

    await svc.ops_log.create({
      action: `standing_request.${decision}ed`,
      entity_type: 'standing_request',
      entity_id: requestId,
      entity_name: request.handle || request.applicant_email || '',
      actor: user.email,
      before: { status: 'pending' },
      after: { status: decision === 'accept' ? 'accepted' : 'declined', granted: decision === 'accept' ? granting : '' },
      notes: notes || `Answered by ${fsisRole(user)}.`,
    });

    return Response.json({
      ok: true,
      decision,
      granted: decision === 'accept' ? granting : '',
      told: !!applicant,
      note: applicant
        ? ''
        : 'The request carried no account, so nobody could be told. That request was filed before applicants were linked to accounts.',
    });
  } catch (error) {
    await reportError(base44, { source: 'reviewStandingRequest', error, route: 'reviewStandingRequest' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
