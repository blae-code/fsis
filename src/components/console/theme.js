/**
 * The console's earth-tone design language, lifted from the storefront.
 * Every management panel draws from here so the whole OS reads as one deck.
 */
export const C = {
  amber: '#E0A22E',
  bronze: '#8A6430',
  bronzeDim: '#5C4424',
  olive: '#8A8F45',
  bone: '#EDE5D6',
  parchment: '#D8CFC0',
  dim: '#7A6E60',
  dimmer: '#3A3028',
  faint: '#5F564A',
  red: '#C05050',
  green: '#7BA05B',
  teal: '#6FA08F',
};

/** Standard panel face — dark plate, bronze-dim border. */
export const panel = { borderColor: '#3A2F20', background: '#0C0A07' };

/** Raised panel with the storefront's gradient plate, for section headers. */
export const plate = {
  borderColor: '#5C4424',
  background: 'linear-gradient(180deg, #14100B, #0B0906)',
};

/** Notched corner treatment used on storefront chrome. */
export const notch = (px = 6) => ({
  clipPath: `polygon(${px}px 0, 100% 0, 100% calc(100% - ${px}px), calc(100% - ${px}px) 100%, 0 100%, 0 ${px}px)`,
});

/** Primary action button — bronze border, amber text. */
export const actionBtn = { borderColor: '#8A6430', color: '#E0A22E', background: '#120D08' };

/** Quiet secondary button. */
export const quietBtn = { borderColor: '#3A2F20', color: '#7A6E60', background: '#0A0806' };

/** Micro section label row style helper. */
export const sectionLabel = 'text-[9px] font-mono tracking-[0.22em] flex items-center gap-2';