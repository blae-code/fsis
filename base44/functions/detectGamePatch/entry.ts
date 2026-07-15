import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Watches the UEX live game version. When a new patch appears, it records it in
// app_setting (live_patch_version) and logs a patch.detected ops event. The OPS
// DECK status bar compares this against the cached market data's patch_version
// to surface a "price list refresh required" alert until resync + reprice run.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const res = await fetch('https://api.uexcorp.space/2.0/game_versions');
    if (!res.ok) throw new Error(`UEX game_versions failed: ${res.status}`);
    const json = await res.json();
    const live = json?.data?.live || json?.data?.version;
    if (!live) throw new Error('UEX did not report a live game version');

    const svc = base44.asServiceRole.entities;
    const settings = await svc.app_setting.filter({ key: 'live_patch_version' });
    const known = settings[0]?.value || null;

    let changed = false;
    if (known !== live) {
      changed = true;
      if (settings[0]) {
        await svc.app_setting.update(settings[0].id, { value: live });
      } else {
        await svc.app_setting.create({ key: 'live_patch_version', value: live });
      }
      await svc.ops_log.create({
        action: 'patch.detected',
        entity_type: 'integration',
        entity_name: 'UEX Game Version',
        actor: 'FSIS.bot',
        before: { patch_version: known },
        after: { patch_version: live },
        notes: `New game patch ${live} detected — price list refresh required (resync UEX + re-anchor prices).`,
      }).catch(() => {});
    }

    const [latestPrice] = await svc.commodity_price.list('-synced_at', 1);
    const cachedPatch = latestPrice?.patch_version || null;

    return Response.json({
      live_patch: live,
      previous_known: known,
      changed,
      cached_patch: cachedPatch,
      refresh_required: !cachedPatch || cachedPatch !== live,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});