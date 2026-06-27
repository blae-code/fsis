import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONTACT_METHODS = ['spectrum', 'discord', 'in_game', 'other', 'none'];

function cleanText(value, max = 120) {
  return String(value || '').trim().slice(0, max);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const handle = cleanText(body.handle, 60);

    if (!handle) {
      return Response.json({ error: 'Handle is required' }, { status: 400 });
    }

    let profileKey = cleanText(body.profile_key, 160);
    if (profileKey.length < 24) {
      profileKey = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    }

    const now = new Date().toISOString();
    const contactMethod = CONTACT_METHODS.includes(body.contact_method) ? body.contact_method : 'spectrum';
    const payload = {
      profile_key: profileKey,
      handle,
      display_name: cleanText(body.display_name, 80),
      contact_method: contactMethod,
      contact_handle: cleanText(body.contact_handle, 120),
      preferred_location: cleanText(body.preferred_location, 120),
      status: 'active',
      source: 'storefront_pwa',
      last_seen_at: now,
    };

    const svc = base44.asServiceRole.entities;
    const existing = await svc.fsis_profile.filter({ profile_key: profileKey });
    const profile = existing[0]
      ? await svc.fsis_profile.update(existing[0].id, payload)
      : await svc.fsis_profile.create({ ...payload, first_seen_at: now });

    await svc.ops_log.create({
      action: existing[0] ? 'profile.updated' : 'profile.created',
      entity_type: 'fsis_profile',
      entity_id: profile.id,
      entity_name: handle,
      actor: handle,
      notes: 'Buyer-created optional FSIS profile; separate from Base44 user authentication.',
    }).catch(() => null);

    return Response.json({
      ok: true,
      profile: {
        id: profile.id,
        profile_key: profileKey,
        handle: profile.handle,
        display_name: profile.display_name || '',
        contact_method: profile.contact_method || 'spectrum',
        contact_handle: profile.contact_handle || '',
        preferred_location: profile.preferred_location || '',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});