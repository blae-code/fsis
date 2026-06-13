import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI auditor: reviews recent ledger activity for anomalies, patterns, and recommendations
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const entries = await base44.entities.ledger_entry.list('-entry_date', 300);
    if (entries.length === 0) {
      return Response.json({ status: 'success', empty: true });
    }

    const compact = entries.map((e) => ({
      type: e.entry_type,
      cat: e.category,
      amt: e.amount_auec,
      desc: e.description,
      who: e.counterparty,
      date: e.entry_date,
      src: e.source,
      bal: e.balance_after || undefined,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a financial auditor for FSIS, a Star Citizen salvage & industrial business. All amounts are in aUEC (in-game currency). Below is the recent transaction ledger (newest first), as JSON.

Audit it and report:
1. health: one-sentence overall financial health assessment
2. anomalies: suspicious or unusual entries — duplicates, outlier amounts for their category, expense spikes, missing counterparties on large transactions. Reference the entry description and date. Empty array if clean.
3. patterns: 2-4 notable spending/earning patterns or trends (e.g. dominant income source, recurring costs, weekday patterns)
4. recommendations: 2-4 concrete, actionable suggestions to improve profitability or record hygiene
5. category_callout: the single category that most deserves management attention and why

Be specific with numbers. Keep each item to one short sentence.

LEDGER:
${JSON.stringify(compact)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          health: { type: 'string' },
          anomalies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entry: { type: 'string' },
                issue: { type: 'string' },
                severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['entry', 'issue', 'severity'],
            },
          },
          patterns: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          category_callout: { type: 'string' },
        },
        required: ['health', 'anomalies', 'patterns', 'recommendations'],
      },
    });

    return Response.json({ status: 'success', audited_count: entries.length, ...result });
  } catch (error) {
    console.error('auditLedger error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});