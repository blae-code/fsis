import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { onboardingState } from '../../shared/onboarding.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * Where does this person stand, and what is the one thing to do next?
 *
 * Built as ONE call because the alternative is every screen assembling this from the user record,
 * their requests, the charter and their signatures — and assembling it slightly differently each
 * time, so a comrade is told they are settled on one page and prompted on another.
 *
 * Works without an account. A guest is a first-class state here rather than an error: ordering has
 * never required signing in, and the app should be able to say so plainly to somebody who has not.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    // A guest is expected, not a failure.
    const user = await base44.auth.me().catch(() => null);
    const svc = base44.asServiceRole.entities;

    if (!user) {
      return Response.json(onboardingState({ user: null }, new Date()));
    }

    const [requests, instruments, signatures] = await Promise.all([
      svc.standing_request.filter({ applicant_user_id: user.id }, '-created_date', 20),
      svc.instrument.filter({ active: true }, '-effective_from', 50),
      svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 50),
    ]);

    // Guest orders this comrade could still claim, which is the most concrete reason to have an
    // account at all — so it is counted rather than asserted.
    const orders = user.email
      ? await svc.order.filter({ customer_email: user.email }, '-created_date', 50).catch(() => [])
      : [];

    return Response.json(onboardingState({ user, requests, instruments, signatures, orders }, new Date()));
  } catch (error) {
    await reportError(base44, { source: 'getOnboardingState', error, route: 'getOnboardingState' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
