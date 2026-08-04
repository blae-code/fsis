import { Hammer, HandCoins, FileCheck2, Scale } from 'lucide-react';

/**
 * What a newly accepted comrade is owed before they are handed a board.
 *
 * Written as what the collective undertakes as much as what they do, because a walkthrough that
 * only lists obligations reads as a rota — and nobody here is rostered.
 */
export const CONTRACTOR_STEPS = [
  {
    key: 'board',
    tag: 'THE BOARD',
    title: 'Work is posted, never assigned',
    body: 'Every task on the labour board carries its price before you touch it. You take up what suits you, when it suits you, and nothing follows from leaving a task alone.',
    icon: Hammer,
    points: [
      ['NO ROTA', 'Nobody is scheduled here. An empty week costs you no standing.'],
      ['PRICED UP FRONT', 'The agreed sum is stated on the task, so you judge the offer before spending your evening on it.'],
      ['MUSTERS ARE ANSWERED', 'A called run asks for hands. You answer in, maybe or out — it is never an order.'],
    ],
  },
  {
    key: 'claim',
    tag: 'TAKING WORK UP',
    title: 'Claim it, and you may still step off',
    body: 'Taking a task puts your name on it and holds a place for you. Some work wants several hands, so a task can carry a crew rather than one person.',
    icon: HandCoins,
    points: [
      ['ASK FIRST IF UNSURE', 'Every task has a thread. Ask the council what the brief means before you commit.'],
      ['BLOCKED WORK WAITS', 'A task that depends on other work says so, and cannot be taken up early.'],
      ['STEP OFF CLEANLY', 'Release work you cannot finish. Saying so early costs nothing; going quiet is what hurts a run.'],
    ],
  },
  {
    key: 'proof',
    tag: 'FILING YOUR ACCOUNT',
    title: 'You file what you did, in your own words',
    body: 'When the work is done you file your own account of it — hours actually taken, notes, and a screenshot or manifest if you have one. That is your record, not a figure measured over you.',
    icon: FileCheck2,
    points: [
      ['HOURS CORRECT THE ESTIMATE', 'The posted estimate is what drifts; your figure is what fixes it.'],
      ['THE COUNCIL ANSWERS', 'Work is credited or sent back with reasons, and a review left too long is escalated over their heads.'],
      ['CREDITED IN FULL', 'The agreed sum settles to you directly and is never diluted into anyone else\u2019s pool.'],
    ],
  },
  {
    key: 'standing',
    tag: 'STANDING',
    title: 'Your record is yours, and appealable',
    body: 'Standing follows from work credited and musters stood. Marks against you are stated plainly, lapse of their own accord, and can be appealed — silence from the council is not a denial.',
    icon: Scale,
    points: [
      ['ALWAYS SHOWN BACK', 'Nothing is recorded about you that you cannot read under YOUR RECORD.'],
      ['NOTHING IS PERPETUAL', 'Every mark carries a date it lapses on.'],
      ['APPEALS ARE ANSWERED', 'File one and the council owes you a ruling by a stated date.'],
    ],
  },
];