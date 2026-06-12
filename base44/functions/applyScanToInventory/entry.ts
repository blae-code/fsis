import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// OD3ICA background agent: triggered by entity automation when a new salvage_scan
// is created. Dispatches by scan type:
//   ship-hud / manifest -> sync RMC/CMR/CMS quantities to the active salvage session
//   terminal            -> record OCR'd sell prices as price history snapshots
//   contract            -> auto-draft a contract on the Contracts board

const CODE_FIELDS = { RMC: 'rmc_scu', CMR: 'cmr_scu', CMS: 'cms_scu' };
const SALVAGE_CODES = Object.keys(CODE_FIELDS);
const ACTIVE_STATUS_PRIORITY = ['in-progress', 'hauling', 'planning'];

async function handleCargoScan(base44, scan) {
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
    return { skipped: true, reason: 'No salvage quantities detected' };
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
      applied_changes: 'OD3ICA: no active salvage session found — start a session and re-run this scan.',
    });
    return { skipped: true, reason: 'No active session' };
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

  console.log(`Applied cargo scan ${scan.id} to session ${session.id}: ${changeParts.join(', ')}`);
  return { applied: true, session_id: session.id, changes: changeParts };
}

async function handleTerminalScan(base44, scan) {
  // Record OCR'd terminal sell prices as price history snapshots
  const now = new Date().toISOString();
  const snapshots = [];
  for (const c of scan.detected_commodities || []) {
    const code = (c.code || '').toUpperCase();
    if (SALVAGE_CODES.includes(code) && typeof c.price_sell === 'number' && c.price_sell > 0) {
      snapshots.push({
        commodity_code: code,
        best_sell: c.price_sell,
        best_terminal: c.terminal_name || 'OCR terminal scan',
        captured_at: now,
      });
    }
  }

  if (snapshots.length === 0) {
    await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
      applied_changes: 'OD3ICA: no RMC/CMR/CMS sell prices readable in this terminal scan.',
    });
    return { skipped: true, reason: 'No prices detected' };
  }

  await base44.asServiceRole.entities.price_snapshot.bulkCreate(snapshots);
  const parts = snapshots.map((s) => `${s.commodity_code} @ ${s.best_sell} aUEC`);
  await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
    auto_applied: true,
    applied_changes: `OD3ICA logged ${snapshots.length} price snapshot${snapshots.length === 1 ? '' : 's'} to market history — ${parts.join(', ')}`,
  });

  console.log(`Terminal scan ${scan.id}: recorded ${snapshots.length} price snapshots`);
  return { applied: true, snapshots: snapshots.length };
}

async function handleContractScan(base44, scan) {
  // Auto-draft a contract record from the OCR'd mission screen
  const x = scan.extracted_data || {};
  const title = x.contract_title || x.title || (scan.summary || '').slice(0, 90) || 'OCR-scanned contract';
  const payout = typeof x.reward_auec === 'number' ? x.reward_auec : (typeof x.reward === 'number' ? x.reward : 0);

  const contract = await base44.asServiceRole.entities.contract.create({
    title,
    contract_type: 'salvage_op',
    payout_auec: payout,
    destination: x.location || '',
    cargo: x.objective || '',
    status: 'open',
    notes: `Auto-drafted by OD3ICA from a contract scan. ${scan.summary || ''}`.trim(),
  });

  await base44.asServiceRole.entities.salvage_scan.update(scan.id, {
    auto_applied: true,
    applied_changes: `OD3ICA drafted contract "${title}"${payout ? ` (${payout.toLocaleString()} aUEC)` : ''} — review it on the Contracts board.`,
  });

  console.log(`Contract scan ${scan.id}: drafted contract ${contract.id}`);
  return { applied: true, contract_id: contract.id };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let scan = payload.data;
    if (payload_too_large || !scan) {
      scan = await base44.asServiceRole.entities.salvage_scan.get(event.entity_id);
    }

    if (scan.auto_applied) {
      return Response.json({ skipped: true, reason: 'Already applied' });
    }

    if (['ship-hud', 'manifest'].includes(scan.scan_type)) {
      return Response.json(await handleCargoScan(base44, scan));
    }
    if (scan.scan_type === 'terminal') {
      return Response.json(await handleTerminalScan(base44, scan));
    }
    if (scan.scan_type === 'contract') {
      return Response.json(await handleContractScan(base44, scan));
    }

    return Response.json({ skipped: true, reason: `No handler for scan type "${scan.scan_type}"` });
  } catch (error) {
    console.error('applyScanToInventory error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});