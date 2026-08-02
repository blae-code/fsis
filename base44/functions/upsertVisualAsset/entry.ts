import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { ASSET_KINDS, ASSET_THEMES, isKnownSlot, allSlots } from '../../shared/assets.js';

/**
 * Putting a piece of visual work into a slot, or retiring one.
 *
 * The slot must be one the app actually has room for. An asset filed against a key nothing renders
 * is work that was made and then quietly lost, which is worse than not commissioning it — so an
 * unknown key is refused with the nearest real ones named.
 *
 * Alt text is required. An image with none is decoration that has become information for everybody
 * except the comrades it excludes, and this outfit does not build that.
 *
 * Replacing a slot does not overwrite what was there: the previous asset is retired and the new one
 * takes the next version. A record of what the app used to look like, and whose work it was, is
 * worth more than a tidy table.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const slotKey = String(body?.slot_key || '').trim();
    const imageUrl = String(body?.image_url || '').trim();
    const altText = String(body?.alt_text || '').trim();
    const retire = body?.retire === true;

    if (!slotKey) return Response.json({ error: 'slot_key is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const existing = await svc.visual_asset.filter({ slot_key: slotKey }, '-version', 20);
    const live = existing.filter((a: any) => a.status !== 'retired');

    if (retire) {
      if (live.length === 0) {
        return Response.json({ error: 'Nothing is in that slot to retire.' }, { status: 404 });
      }
      await svc.visual_asset.bulkUpdate(live.map((a: any) => ({ id: a.id, status: 'retired' })));
      await svc.ops_log.create({
        action: 'asset.retired',
        entity_type: 'visual_asset',
        entity_name: slotKey,
        actor: user.email,
        after: { retired: live.length },
        notes: `Slot ${slotKey} emptied by ${fsisRole(user)}. It renders as absence again.`,
      });
      return Response.json({ ok: true, retired: live.length, slot_key: slotKey });
    }

    if (!isKnownSlot(slotKey)) {
      const family = slotKey.split('.')[0];
      const near = allSlots().filter((s: any) => s.family === family || s.key.startsWith(family)).slice(0, 8);
      return Response.json({
        error: `Nothing renders '${slotKey}'. Work filed against a slot the app does not have is work quietly lost.`,
        did_you_mean: near.map((s: any) => s.key),
      }, { status: 400 });
    }
    if (!imageUrl) return Response.json({ error: 'image_url is required.' }, { status: 400 });
    if (!altText) {
      return Response.json({
        error: 'Give alt text. An image without it is decoration that has become information for everyone except the comrades it excludes.',
      }, { status: 400 });
    }

    const kind = ASSET_KINDS.includes(String(body?.kind)) ? String(body.kind) : null;
    const slot = allSlots().find((s: any) => s.key === slotKey);
    const theme = ASSET_THEMES.includes(String(body?.theme)) ? String(body.theme) : 'any';

    // The one being replaced is retired rather than overwritten.
    const replacing = live.filter((a: any) => (a.theme || 'any') === theme);
    if (replacing.length > 0) {
      await svc.visual_asset.bulkUpdate(replacing.map((a: any) => ({ id: a.id, status: 'retired' })));
    }
    const nextVersion = existing.reduce((top: number, a: any) => Math.max(top, Number(a.version) || 1), 0) + 1;

    const asset = await svc.visual_asset.create({
      slot_key: slotKey,
      family: slot?.family || '',
      kind: kind || slot?.kind || 'icon',
      image_url: imageUrl,
      alt_text: altText,
      theme,
      artist_handle: String(body?.artist_handle || '').trim(),
      artist_user_id: String(body?.artist_user_id || '').trim(),
      licence: String(body?.licence || '').trim(),
      status: body?.status === 'live' ? 'live' : 'placeholder',
      width: Number(body?.width) || 0,
      height: Number(body?.height) || 0,
      version: nextVersion,
      added_by_email: user.email,
      notes: String(body?.notes || '').trim(),
    });

    await svc.ops_log.create({
      action: 'asset.placed',
      entity_type: 'visual_asset',
      entity_id: asset.id,
      entity_name: slotKey,
      actor: user.email,
      before: { replaced: replacing.length },
      after: { version: nextVersion, status: asset.status, artist: asset.artist_handle },
      notes: asset.artist_handle
        ? `Made by ${asset.artist_handle}.`
        : 'No maker recorded — worth chasing; an asset is labour like any other.',
    });

    return Response.json({
      ok: true,
      asset,
      replaced: replacing.length,
      guidance: slot?.guidance || '',
      note: asset.artist_handle
        ? ''
        : 'No artist recorded. Credit is a field here rather than a courtesy — put the maker\'s name on it.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
