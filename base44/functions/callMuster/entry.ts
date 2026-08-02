import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { MUSTER_ROLES, roleSlots } from '../../shared/musters.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * "I am going out now, who is on?"
 *
 * The most-used flow in a yard that flies opportunistically, and the one that did not exist. Calling
 * a run has meant filling in a scheduled operation as though every flight were planned a week out,
 * which is not how anybody actually plays — so runs went uncalled and the hands who would have come
 * never heard about them.
 *
 * One call: the muster is made, everyone who could come is told, and the run may start immediately.
 * Everything else about it can be filled in later or never.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to call a muster.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // A standing muster written once and called again. Called THROUGH here rather than written
    // straight to crew_operation, so a templated run tells the yard like any other — a muster
    // nobody hears about is not a muster, however it was created.
    const templateId = String(body?.operation_template_id || '').trim();
    let template: any = null;
    if (templateId) {
      template = await base44.asServiceRole.entities.operation_template.get(templateId).catch(() => null);
      if (!template) return Response.json({ error: 'No such standing muster.' }, { status: 404 });
      if (template.active === false) {
        return Response.json({ error: 'That standing muster has been retired. Make it active again to call it.' }, { status: 409 });
      }
    }

    const opName = String(body?.op_name || template?.op_name || '').trim();
    const brief = String(body?.brief || template?.brief || '').trim();
    const opType = String(body?.op_type || template?.op_type || 'salvage').trim();
    const location = String(body?.muster_location || template?.muster_location || '').trim();
    const ship = String(body?.ship || template?.ship || '').trim();
    const startNow = body?.start_now === true;

    if (!opName) return Response.json({ error: 'Give the run a name — anything the yard will recognise.' }, { status: 400 });

    const slots = (Array.isArray(body?.role_slots) ? body.role_slots : (template?.role_slots || []))
      .filter((slot: any) => slot && MUSTER_ROLES.includes(slot.role))
      .map((slot: any) => ({ role: slot.role, wanted: Math.max(1, Math.floor(Number(slot.wanted) || 1)) }));

    const now = new Date();
    const startsAt = String(body?.starts_at || '').trim() || now.toISOString();

    const operation = await base44.asServiceRole.entities.crew_operation.create({
      op_name: opName,
      brief,
      op_type: opType,
      starts_at: startsAt,
      // Never zero: a run with no length breaks the calendar export, whose DTEND would equal its
      // DTSTART, and tells a comrade nothing about how much of their evening is being asked for.
      duration_hours: Number(body?.duration_hours) > 0
        ? Number(body.duration_hours)
        : (Number(template?.duration_hours) > 0 ? Number(template.duration_hours) : 2),
      muster_location: location,
      ship,
      crew_needed: slots.reduce((total: number, slot: any) => total + slot.wanted, 0)
        || Number(body?.crew_needed) || Number(template?.crew_needed) || 2,
      ...(slots.length > 0 ? { role_slots: slots } : {}),
      pay_basis: (body?.pay_basis || template?.pay_basis) === 'flat_credit' ? 'flat_credit' : 'shares',
      flat_credit_auec: Number(body?.flat_credit_auec) > 0
        ? Number(body.flat_credit_auec)
        : Math.max(0, Number(template?.flat_credit_auec) || 0),
      ...(templateId ? { operation_template_id: templateId } : {}),
      status: startNow ? 'mustering' : 'scheduled',
      rsvps: [],
      posted_by_email: user.email,
    });

    // Everyone who could come is told. A muster nobody hears about is not a muster.
    const members = await base44.asServiceRole.entities.User.filter({ fsis_role: 'contractor' });
    const owners = await base44.asServiceRole.entities.User.filter({ fsis_role: 'owner' });
    const audience = [...members, ...owners].filter((m) => m.id !== user.id && !m.standing_locked);

    const places = roleSlots(operation)
      .map((slot) => `${slot.wanted} ${slot.role}`)
      .join(', ');

    await notifyMany(base44, audience.map((member) => ({
      recipient_user_id: member.id,
      recipient_handle: member.handle,
      kind: 'muster_called',
      title: `Muster called: ${opName}`,
      body: [
        startNow
          ? 'Going out now. If you are free, you are wanted.'
          : `Called for ${startsAt}.`,
        brief,
        `Places: ${places}.`,
        location ? `Gathering at ${location}.` : '',
        ship ? `Hull: ${ship}.` : '',
        'Answer from the labour board. Nobody is rostered — say what you can do and when.',
      ].filter(Boolean).join('\n\n'),
      source_type: 'crew_operation',
      source_id: operation.id,
      source_name: opName,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    // Going out now means the run starts now; presence is recorded from this moment.
    let session = null;
    if (startNow) {
      session = await base44.asServiceRole.entities.operation_session.create({
        operation_id: operation.id,
        session_name: opName,
        op_type: opType,
        status: 'underway',
        started_at: now.toISOString(),
        started_by_email: user.email,
        attendance: [{
          user_id: user.id,
          handle: user.handle || user.full_name || user.email,
          email: user.email,
          joined_at: now.toISOString(),
          left_at: '',
          minutes: 0,
        }],
        attendance_user_ids: [user.id],
        costs: [],
        gross_auec: 0,
      });
      await base44.asServiceRole.entities.crew_operation.update(operation.id, { status: 'underway' });
    }

    // The standing muster records that it was called, so the council can see it is being used.
    if (templateId) {
      await base44.asServiceRole.entities.operation_template.update(templateId, {
        times_called: (Number(template?.times_called) || 0) + 1,
        last_called_at: now.toISOString(),
      });
    }

    await base44.asServiceRole.entities.ops_log.create({
      action: 'operation.muster_called',
      entity_type: 'crew_operation',
      entity_id: operation.id,
      entity_name: opName,
      actor: user.email,
      after: { starts_at: startsAt, told: audience.length, started_now: startNow },
      notes: `Muster called by ${fsisRole(user)}${startNow ? ' and started immediately' : ''}; ${audience.length} comrade(s) told.`,
    });

    return Response.json({ ok: true, operation, session, told: audience.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
