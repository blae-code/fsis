/**
 * Turn pasted lines into draft rows.
 *
 * Pipe-separated, because a hold full of gear is usually already written down somewhere and retyping
 * it into forty forms is how the care goes out of it:
 *   title | item type | qty | grade | opens at | reserve
 * Only the title is required. Blank lines and a leading header row are ignored.
 */
export function parseBulkLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^title\s*\|/i.test(line))
    .map((line) => {
      const [title, itemType, qty, grade, start, reserve] = line.split('|').map((c) => (c || '').trim());
      return {
        title,
        item_type: itemType || 'other',
        quantity: Number(qty) || 1,
        condition_grade: grade || '',
        start_auec: Number(start) || 0,
        reserve_auec: Number(reserve) || 0,
      };
    });
}