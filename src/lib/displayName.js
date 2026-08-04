/**
 * What a comrade is called anywhere in this app.
 *
 * Only the name they chose. Never their legal name, never their email address — people put their
 * real names into account fields they did not expect to see published, and a console read over a
 * stream or shown to a third party must not be the thing that publishes it. Where no handle has
 * been set we say so and fall back to a short account reference, which identifies without exposing.
 */
export function displayHandle(person, fallback = 'NO HANDLE SET') {
  if (!person) return fallback;
  const handle = (person.handle || person.display_name || person.callsign || '').trim();
  if (handle) return handle;
  return person.id ? `${fallback} · ${String(person.id).slice(-6).toUpperCase()}` : fallback;
}