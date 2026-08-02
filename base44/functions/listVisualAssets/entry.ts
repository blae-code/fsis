import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allSlots, bySlot, unfilledSlots } from '../../shared/assets.js';

/**
 * What visual work exists, and what the app still has room for.
 *
 * Readable without an account, because the storefront is a public front door and ordering never
 * requires signing in — an asset that only members can load would leave guests looking at a page
 * full of gaps.
 *
 * Returns the filled slots keyed for lookup, and by request the unfilled ones with their guidance.
 * That second list is the point of the whole thing: an artist should be able to ask what the app
 * wants and get an answer with a brief attached, rather than being handed a screenshot and asked to
 * make it nicer.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const theme = ['any', 'dark', 'light'].includes(String(body?.theme)) ? String(body.theme) : 'any';
    const wantGaps = body?.include_unfilled === true;
    const family = String(body?.family || '').trim();

    const assets = await base44.asServiceRole.entities.visual_asset.filter(
      { status: { $in: ['placeholder', 'live'] } }, '-version', 500,
    );

    const filled = bySlot(assets, { theme });
    const slots = family ? allSlots().filter((s: any) => s.family === family) : allSlots();

    const response: Record<string, unknown> = {
      theme,
      // Keyed so an interface can look a slot up as it renders and carry on when it finds nothing.
      assets: Object.fromEntries(Object.entries(filled).map(([key, asset]: [string, any]) => [key, {
        slot_key: asset.slot_key,
        kind: asset.kind,
        image_url: asset.image_url,
        alt_text: asset.alt_text || '',
        theme: asset.theme || 'any',
        artist_handle: asset.artist_handle || '',
        licence: asset.licence || '',
        status: asset.status,
        width: asset.width || null,
        height: asset.height || null,
      }])),
      filled_count: Object.keys(filled).length,
      slot_count: slots.length,
      note: 'Every slot is optional. A slot with no asset must render as its absence — nothing here is ever required for a screen to work, and no figure may be conveyed by an image alone.',
    };

    if (wantGaps) {
      const gaps = unfilledSlots(assets, { theme })
        .filter((slot: any) => !family || slot.family === family);
      response.unfilled = gaps;
      response.unfilled_count = gaps.length;
      // The credits list, so the people who made the work can be named somewhere they can see.
      response.credits = [...new Map(
        assets
          .filter((a: any) => a.artist_handle)
          .map((a: any) => [a.artist_handle, { artist_handle: a.artist_handle, artist_user_id: a.artist_user_id || '' }]),
      ).values()];
    }

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
