import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isProprietor } from '../../shared/roles.js';

/**
 * Owner standing is invitation-only and the proprietor alone may issue it.
 * Sends the platform invite at admin level and records the act in the collective's access log.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isProprietor(user)) {
      return Response.json({ error: 'Only the proprietor may invite owners.' }, { status: 403 });
    }

    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const notes = String(body?.notes || '').trim();
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    await base44.asServiceRole.users.inviteUser(email, 'admin');

    // If the comrade already holds an account, seat them immediately.
    const existing = await base44.asServiceRole.entities.User.filter({ email });
    const target = existing?.[0];
    if (target) {
      await base44.asServiceRole.entities.User.update(target.id, {
        fsis_role: 'owner',
        membership_status: 'active',
        role_granted_by: user.email,
        role_granted_at: new Date().toISOString(),
      });
    }

    await base44.asServiceRole.entities.access_grant.create({
      target_user_id: target?.id || '',
      target_email: email,
      target_handle: target?.handle || '',
      action: 'invited',
      previous_role: target ? fsisRole(target) : '',
      new_role: 'owner',
      granted_by_email: user.email,
      granted_by_role: 'proprietor',
      notes: notes || 'Owner seat extended by the proprietor.',
    });

    return Response.json({ ok: true, email, seated: Boolean(target) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}