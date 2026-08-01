import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, canGrant, platformRoleFor, FSIS_ROLES, PROPRIETOR_EMAIL } from '../../shared/roles.js';

/**
 * Council-level standing changes. The proprietor may set any standing; owners may only
 * admit or release contractors and patrons. Every change is written to the access log.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const targetId = String(body?.user_id || '').trim();
    const newRole = String(body?.fsis_role || '').trim();
    const membershipStatus = body?.membership_status ? String(body.membership_status) : null;
    const notes = String(body?.notes || '').trim();

    if (!targetId) return Response.json({ error: 'user_id is required.' }, { status: 400 });
    if (newRole && !FSIS_ROLES.includes(newRole)) {
      return Response.json({ error: 'Unknown standing.' }, { status: 400 });
    }
    if (newRole === 'owner' && fsisRole(user) !== 'proprietor') {
      return Response.json({ error: 'Owner standing is invitation-only — proprietor authority required.' }, { status: 403 });
    }
    if (newRole && !canGrant(user, newRole)) {
      return Response.json({ error: 'Your standing does not permit this change.' }, { status: 403 });
    }
    if (!newRole && !canGrant(user, 'contractor')) {
      return Response.json({ error: 'Your standing does not permit this change.' }, { status: 403 });
    }

    const target = await base44.asServiceRole.entities.User.get(targetId);
    if (!target) return Response.json({ error: 'Member not found.' }, { status: 404 });
    if ((target.email || '').toLowerCase() === PROPRIETOR_EMAIL && newRole && newRole !== 'proprietor') {
      return Response.json({ error: 'The proprietor seat cannot be reassigned.' }, { status: 403 });
    }

    const previous = fsisRole(target);
    const patch: Record<string, unknown> = {
      role_granted_by: user.email,
      role_granted_at: new Date().toISOString(),
    };
    if (newRole) {
      patch.fsis_role = newRole;
      patch.role = platformRoleFor(newRole);
    }
    if (membershipStatus) patch.membership_status = membershipStatus;

    await base44.asServiceRole.entities.User.update(targetId, patch);

    const action = membershipStatus === 'suspended'
      ? 'suspended'
      : membershipStatus === 'active' && !newRole
        ? 'reinstated'
        : newRole === 'patron' && ['owner', 'contractor'].includes(previous)
          ? 'revoked'
          : 'granted';

    await base44.asServiceRole.entities.access_grant.create({
      target_user_id: targetId,
      target_email: target.email || '',
      target_handle: target.handle || '',
      action,
      previous_role: previous,
      new_role: newRole || previous,
      granted_by_email: user.email,
      granted_by_role: fsisRole(user),
      notes,
    });

    return Response.json({ ok: true, user_id: targetId, previous_role: previous, new_role: newRole || previous, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}