import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { vocabularies } from '../../shared/taxonomy.js';
import { listBounded, CAPS } from '../../shared/paging.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * Every dropdown the app needs, in one call.
 *
 * Written because the alternative is what happened: each list was typed out where it was first
 * needed, and the same idea ended up with several vocabularies that did not agree. A frontend that
 * hand-writes `['new','refurb','used','worn']` in one component and `['new','refurbished',…]` in
 * another has already created the bug, and no amount of care in the backend will find it.
 *
 * So the lists live in shared/taxonomy.js and are served from here. Reference data that is a TABLE
 * rather than a constant — ships, terminals, materials — comes back too, because a dropdown of
 * hulls should be the hulls the yard actually flies, not a guess.
 *
 * Readable by any signed-in member: none of it is sensitive, and a picker that fails for a
 * contractor is a picker somebody works around by typing free text, which is the problem this
 * exists to end.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole.entities;
    const [ships, terminals, materials] = await Promise.all([
      listBounded(svc.ship_spec, 'ship_name', CAPS.general).catch(() => ({ rows: [] })),
      listBounded(svc.terminal, 'terminal_name', CAPS.general).catch(() => ({ rows: [] })),
      listBounded(svc.material, 'material_name', CAPS.general).catch(() => ({ rows: [] })),
    ]);

    return Response.json({
      ...vocabularies(),
      // Tables, not constants — these are the things the yard actually deals in.
      ships: (ships.rows || [])
        .filter((s: any) => s.active !== false)
        .map((s: any) => ({
          ship_name: s.ship_name,
          manufacturer: s.manufacturer || '',
          cargo_scu: Number(s.cargo_scu) || 0,
          primary_role: s.primary_role || 'other',
          crew_min: Number(s.crew_min) || 1,
          crew_max: Number(s.crew_max) || 1,
          size_class: s.size_class || 'unknown',
          // A capacity nobody has checked against the current patch plans a run wrong.
          verified_patch: s.verified_patch || '',
          verified: !!s.verified_patch,
        })),
      terminals: (terminals.rows || []).map((t: any) => ({
        terminal_name: t.terminal_name,
        terminal_code: t.terminal_code || '',
        star_system: t.star_system || '',
        planet: t.planet || '',
        terminal_type: t.terminal_type || '',
      })),
      materials: (materials.rows || []).map((m: any) => ({
        material_name: m.material_name, code: m.code || '', category: m.category || '',
      })),
      note: (ships.rows || []).length === 0
        ? 'No hulls are on record yet, so any ship picker will be empty. Until ship_spec is filled, ship fields stay free text — which is what let "Reclaimer" and "Relcaimer" be different ships with no capacity between them.'
        : '',
    });
  } catch (error) {
    await reportError(base44, { source: 'getVocabularies', error, route: 'getVocabularies' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
