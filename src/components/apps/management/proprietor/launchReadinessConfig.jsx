export const QA_CHECKS = [
  ['role-public-buyer', '1 Roles', 'Access', 'Public buyer can browse, order, track, message, and request cancellation without seeing admin data.', 'Public buyer', 'blocker'],
  ['role-admin', '1 Roles', 'Access', 'Proprietor/admin can reach command tools and protected business data.', 'Proprietor', 'blocker'],
  ['role-contractor', '1 Roles', 'Access', 'Contractor can use crew/payday tools without accessing proprietor controls.', 'Contractor', 'important'],
  ['storefront-order', '2 QA Checklist', 'Storefront', 'Buyer can browse catalog, add stock-valid quantities, place order, and receive receipt.', 'Public buyer', 'blocker'],
  ['storefront-track', '2 QA Checklist', 'Storefront', 'Tracking code lookup, buyer messages, handoff details, and cancel request work.', 'Public buyer', 'blocker'],
  ['proprietor-fulfill', '2 QA Checklist', 'Proprietor', 'Order appears in fulfillment queue and moves through status lifecycle.', 'Proprietor', 'blocker'],
  ['loot-lifecycle', '2 QA Checklist', 'Loot', 'Loot can be intaked, appraised, published, listed, and marked sold.', 'Proprietor', 'important'],
  ['qa-data', '3 Test Data', 'Data', 'Controlled QA data exists for products, orders, loot, ledger, discounts, and restock demand.', 'Proprietor', 'important'],
  ['scenario-buyer', '4 User Flow', 'Scenario', 'Testing Agent completes public buyer order and tracking scenario.', 'Testing Agent', 'blocker'],
  ['scenario-admin', '4 User Flow', 'Scenario', 'Testing Agent completes proprietor fulfillment and handoff scenario.', 'Testing Agent', 'blocker'],
  ['scenario-mobile', '4 User Flow', 'Scenario', 'Testing Agent completes mobile storefront and quick-action review.', 'Mobile user', 'important'],
  ['blockers-triaged', '5 Triage', 'Risk', 'Launch blockers are reviewed, assigned, and cleared or accepted.', 'Proprietor', 'blocker'],
  ['dashboard-reviewed', '6 Dashboard', 'Readiness', 'Launch Readiness dashboard shows no critical unresolved signals.', 'Proprietor', 'blocker'],
  ['acceptance-run', '7 Acceptance', 'Signoff', 'Full buyer-to-delivery lifecycle has been completed and signed off.', 'Proprietor', 'blocker'],
];

export const ROLE_COVERAGE = [
  ['Public buyer', 'Browse, order, track, message, request restock', 'No proprietor data, no ledger, no discount console'],
  ['Returning buyer', 'Track existing order, reorder, request handoff update', 'No admin workflow access'],
  ['Proprietor/admin', 'Inventory, orders, loot, ledger, pricing, automations', 'Must remain authenticated/admin-only'],
  ['Contractor/crew', 'Payday, time logs, station tools', 'No private storefront or proprietor controls'],
  ['Mobile field user', 'Quick order status, handoff, urgent stock checks', 'Avoid dense desktop-only workflows'],
];

export const TEST_SCENARIOS = [
  ['Public order', 'Place a storefront order as a public buyer, then track it using the receipt code.'],
  ['Admin fulfillment', 'As an admin, process a new order through fulfillment and mark it delivered.'],
  ['Loot listing', 'As an admin, intake loot, appraise it, publish it to the storefront, then verify buyers can see it.'],
  ['Access control', 'As a non-admin user, confirm proprietor tools and private business data are not accessible.'],
  ['Mobile checkout', 'Use the app on mobile and complete the buyer checkout flow.'],
];