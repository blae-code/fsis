export const PRICE_ROUNDING_AUEC = 100;

export function roundPrice(value) {
  const number = Number(value) || 0;
  return Math.round(number / PRICE_ROUNDING_AUEC) * PRICE_ROUNDING_AUEC;
}

export function formatAuec(value) {
  return roundPrice(value).toLocaleString();
}