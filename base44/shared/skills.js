/**
 * Matching posted work to the skills a comrade said they have.
 *
 * Skills were asked for on every application and then never read again — collected and ignored,
 * which is worse than not asking, because it takes someone's account of their own trade and files
 * it where nobody will look.
 *
 * The one rule that governs everything here: **matching surfaces work, it never restricts it.**
 * Nothing in this module filters a task off the board, gates a claim, or ranks one comrade above
 * another. It puts likely work nearer the top of a list, states plainly why it did so, and leaves
 * every task claimable by anyone entitled to claim it. A comrade who has never scraped a hull and
 * wants to learn is not to be told the board is not for them — that would turn a convenience into
 * a gate, and a gate is how a collective quietly becomes an employer.
 *
 * Skills are also SELF-DECLARED. They come from what the comrade wrote on their own application,
 * not from an assessment made over them, and nothing here scores how well anyone did their work.
 */

/** The trades the yard actually posts work in. These mirror labour_task categories. */
export const SKILL_TAGS = ['salvage', 'hauling', 'escort', 'repair', 'intake', 'delivery', 'admin'];

/**
 * How comrades actually write about what they do — trade names, jobs and the hulls that imply
 * them. A Vulture in the application means salvage whether or not the word appears.
 */
export const SKILL_WORDS = {
  salvage: ['salvage', 'salvaging', 'scrap', 'scraping', 'scraper', 'wreck', 'hull strip', 'stripping', 'vulture', 'reclaimer', 'srv'],
  hauling: ['haul', 'hauling', 'hauler', 'freight', 'cargo', 'transport', 'logistics', 'hull c', 'hull d', 'caterpillar', 'c2', 'm2'],
  escort: ['escort', 'security', 'combat', 'fighter', 'gunner', 'turret', 'defence', 'defense', 'protection', 'pilot', 'arrow', 'gladius'],
  repair: ['repair', 'engineer', 'engineering', 'maintenance', 'fix', 'mechanic', 'refuel', 'rearm', 'crucible'],
  intake: ['intake', 'inventory', 'sorting', 'appraisal', 'appraise', 'cataloguing', 'cataloging', 'stock'],
  delivery: ['delivery', 'courier', 'handoff', 'drop off', 'dropoff', 'runner'],
  admin: ['admin', 'administration', 'clerical', 'records', 'bookkeeping', 'ledger', 'organising', 'organizing', 'spreadsheet'],
};

const normalise = (text) => String(text || '').toLowerCase();

/**
 * Read a comrade's own words and pick out the trades they name.
 *
 * Free text, because that is how it was collected — nobody is made to choose from a list after
 * the fact. Anything unrecognised is simply not matched on; it is never held against them.
 */
export function parseSkills(freeText) {
  const text = normalise(freeText);
  if (!text) return [];
  return SKILL_TAGS.filter((tag) => SKILL_WORDS[tag].some((word) => text.includes(word)));
}

/** Skills a comrade carries, from the list on their record or their own written application. */
export function skillsOf(user, request) {
  const declared = Array.isArray(user?.skills) ? user.skills.filter((s) => SKILL_TAGS.includes(s)) : [];
  if (declared.length > 0) return declared;
  return parseSkills(request?.skills || user?.skills_text || '');
}

/**
 * How well a posting sits with what a comrade says they do, and WHY.
 *
 * The reasons are the point. A number on its own tells a comrade nothing they can act on or argue
 * with; "you said you scrape, and this is salvage" is something they can agree or disagree with.
 */
export function matchTask(task, skills) {
  const held = (skills || []).filter((s) => SKILL_TAGS.includes(s));
  if (held.length === 0) return { score: 0, reasons: [] };

  const reasons = [];
  let score = 0;

  if (held.includes(task?.category)) {
    score += 5;
    reasons.push(`This is ${task.category} work, which you named as your trade`);
  }

  // The brief may call for a trade the category does not capture — an escort on a hauling run.
  const text = `${normalise(task?.title)} ${normalise(task?.brief)}`;
  for (const tag of held) {
    if (tag === task?.category) continue;
    const hit = SKILL_WORDS[tag].find((word) => text.includes(word));
    if (hit) {
      score += 2;
      reasons.push(`The brief mentions ${hit}, and you named ${tag}`);
    }
  }

  return { score, reasons };
}

/**
 * Posted work, likely first.
 *
 * EVERY task passed in comes back. Ordering changes; the board does not shrink. Work a comrade has
 * no declared skill for sits lower and is still there to be taken, because the decision about what
 * a comrade can turn their hand to belongs to them.
 *
 * @param {any[]} tasks
 * @param {string[]} skills
 * @returns {any[]}
 */
export function rankTasks(tasks, skills) {
  return (tasks || [])
    .map((task, index) => ({ task, index, ...matchTask(task, skills) }))
    // Stable: equal scores keep the order they arrived in, so the board does not shuffle
    // underneath somebody between one look and the next.
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map(({ task, score, reasons }) => ({ ...task, match_score: score, match_reasons: reasons }));
}
