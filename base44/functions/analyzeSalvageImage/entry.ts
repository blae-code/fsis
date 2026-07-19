import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// AI vision + OCR analysis of in-game Star Citizen screenshots for salvage operations.
// Supports: commodity terminal screens, salvage contracts, ship HUD/cargo, wreck signatures.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, scan_type = 'terminal' } = await req.json();
    if (!image_url) {
      return Response.json({ error: 'image_url is required' }, { status: 400 });
    }
    // Normalize to the salvage_scan enum so a bad/oversized value isn't persisted.
    const ALLOWED_SCAN_TYPES = ['terminal', 'contract', 'ship-hud', 'signature', 'manifest', 'other'];
    const scanType = ALLOWED_SCAN_TYPES.includes(scan_type) ? scan_type : 'other';

    const prompts = {
      terminal: 'This is a screenshot of a Star Citizen commodity trade terminal. Extract every commodity row you can read: the commodity name, its short code (RMC, CMR, CMS, etc.), the sell price per unit in aUEC, and the terminal/location name if visible. Focus on salvage outputs (RMC = Recycled Material Composite, CMR = Construction Materials Reclaimed, CMS = Construction Materials Salvaged).',
      contract: 'This is a Star Citizen contract/mission screen. Extract the contract title, reward in aUEC, location, and any salvage objectives (number of panels, hulls, or SCU required). In the "extra" object, return: contract_title (string), reward_auec (number), location (string), objective (string summary of the deliverable).',
      'ship-hud': 'This is a Star Citizen ship HUD or cargo/inventory screen. Read the cargo manifest: list each commodity, its short code, and quantity in SCU.',
      signature: 'This is a Star Citizen ship/wreck or scanning screen. Identify the ship hull or wreck type if visible, estimate its salvage potential (rough RMC/CMR yield in SCU for that hull class), and read any signature/scan numbers shown.',
      manifest: 'This is a Star Citizen cargo manifest. List each commodity, short code, and SCU quantity.',
      other: 'This is a Star Citizen game screen related to salvage. Read and extract any useful numbers, commodity codes, prices, quantities, and locations you can identify.',
    };

    const instruction = prompts[scanType] || prompts.other;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an OCR and data-extraction engine for Star Citizen salvage operators. ${instruction}\n\nReturn a concise human-readable summary, a confidence rating, and structured detected commodities. If you cannot read a value, omit it rather than guessing.`,
      file_urls: [image_url],
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          detected_commodities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                name: { type: 'string' },
                quantity_scu: { type: 'number' },
                price_sell: { type: 'number' },
                terminal_name: { type: 'string' },
              },
            },
          },
          extra: { type: 'object', additionalProperties: true },
        },
        required: ['summary', 'confidence'],
      },
    });

    // Persist the scan for the operator's history (best-effort)
    let savedId = null;
    try {
      const saved = await base44.entities.salvage_scan.create({
        scan_type: scanType,
        image_url,
        summary: result.summary,
        confidence: result.confidence,
        detected_commodities: result.detected_commodities || [],
        extracted_data: result.extra || {},
      });
      savedId = saved.id;
    } catch (e) {
      console.log('Could not persist scan:', e.message);
    }

    return Response.json({ status: 'success', scan_id: savedId, ...result });
  } catch (error) {
    console.error('analyzeSalvageImage error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});