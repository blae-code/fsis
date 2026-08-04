/**
 * What a buyer is called on any screen.
 *
 * Never `customer_handle` — that is whatever the person typed into a checkout box, and people put
 * their real names in those. We show the guest number we assigned, or the callsign on a profile they
 * deliberately created.
 */
export function buyerLabel(order) {
  if (!order) return 'GUEST';
  return order.guest_number || order.customer_profile_handle || 'GUEST';
}