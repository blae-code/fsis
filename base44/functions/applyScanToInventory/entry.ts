import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// OD3ICA background agent: triggered by entity automation when a new salvage_scan
// is created. If the scan is a cargo readout (ship-hud / manifest), it extracts
// RMC/CMR/CMS quantities and applies them to the operator's most recent active
// salvage session — keeping inventory in sync without manual entry.

const CODE_FIELDS = { RMC: 'rmc_scu', CMR: 'cmr_scu', CMS: 'cms_scu' };
const ACTIVE_STATUS_PRIORITY = ['in-progress', 'hauling', 'planning'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let scan = payload.data;
    if (payload_too_large || !scan) {
      scan = await base44.asServiceRole.entities.salvage_scan.get(event.entity_id);
    }

    if (!['ship-hud', 'manifest'].includes(scan.scan_type)) {
      return Response.json({ skipped: true, reason: 'Not a cargo scan' });
    }
    if (scan.auto_applied) {
      return Response.json({ skipped: true, reason: 'Already applied' });
    }

    // Extract RMC/CMR/CMS quantities from the OCR result
    const quantities = {};
    for (const c of scan.detected_commodities || []) {
      const code = (c.code || '').toUpperCase();
      if (CODE_FIELDS[code] && typeof c.quantity_scu === 'number' && c.quantity_scu >= 0) {
        quantities[code] = (quantities[code] || 0) + c.quantity_scu;
      }
    }

    if (Object.keys(quantities).length === 0) {
      await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
        applied_changes: 'OD3ICA: no RMC/CMR/CMS quantities readable in this scan — inventory unchanged.',
      });
      return Response.json({ skipped: true, reason: 'No salvage quantities detected' });
    }

    // Find the scan owner's most recent active salvage session
    const sessions = await base44.asServiceRole.entities.salvage_session.filter(
      { created_by: scan.created_by },
      '-updated_date',
      50
    );
    let session = null;
    for (const status of ACTIVE_STATUS_PRIORITY) {
      session = sessions.find((s) => s.status === status);
      if (session) break;
    }

    if (!session) {
      await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
        applied_changes: 'OD3ICA: no active salvage session found — start a session to enable auto-sync.',
      });
      return Response.json({ skipped: true, reason: 'No active session' });
    }

    // Apply readout as the new cargo snapshot for detected commodities
    const update = {};
    const changeParts = [];
    for (const [code, scu] of Object.entries(quantities)) {
      const field = CODE_FIELDS[code];
      const prev = session[field] || 0;
      update[field] = scu;
      changeParts.push(`${code}: ${prev} → ${scu} SCU`);
    }

    await base44.asServiceRole.entities.salvage_session.update(session.id, update);
    await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
      auto_applied: true,
      applied_session_id: session.id,
      applied_session_name: session.session_name,
      applied_changes: `OD3ICA synced "${session.session_name}" — ${changeParts.join(', ')}`,
    });

    console.log(`Applied scan ${scan.id} to session ${session.id}: ${changeParts.join(', ')}`);
    return Response.json({ applied: true, session_id: session.id, changes: changeParts });
  } catch (error) {
    console.error('applyScanToInventory error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});