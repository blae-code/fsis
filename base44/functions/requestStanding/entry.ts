import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';

/**
 * A comrade asks to take up work as a contractor. Anyone with an account may ask;
 * only the council may answer. Owner standing is never applied for.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first so the council knows who is offering their labour.' }, { status: 401 });

    const standing = fsisRole(user);
    if (standing !== 'patron') {
      return Response.json({ error: `You already hold ${standing} standing — no request is needed.` }, { status: 400 });
    }

    const body = await req.json();
    const handle = String(body?.handle || '').trim();
    if (!handle) return Response.json({ error: 'Give the handle you work under.' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.standing_request.filter({
      applicant_user_id: user.id,
      status: 'pending',
    });
    if (existing.length > 0) {
      return Response.json({ error: 'Your request is already before the council.' }, { status: 400 });
    }

    const created = await base44.asServiceRole.entities.standing_request.create({
      applicant_user_id: user.id,
      applicant_email: user.email || '',
      handle,
      requested_role: 'contractor',
      skills: String(body?.skills || '').trim(),
      availability: String(body?.availability || '').trim(),
      timezone: String(body?.timezone || '').trim(),
      note: String(body?.note || '').trim(),
      status: 'pending',
    });

    // Keep the handle on the account so musters and task credit find the right comrade.
    if (!user.handle) await base44.asServiceRole.entities.User.update(user.id, { handle });

    return Response.json({ ok: true, request_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}