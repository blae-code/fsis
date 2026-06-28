import { jsPDF } from 'jspdf';
import { FSIS } from '@/lib/fsisLore';

// Bronze command-deck palette (RGB)
const BRONZE = [212, 146, 11];
const COPPER = [176, 121, 58];
const CREAM = [229, 221, 208];
const MUTED = [138, 126, 108];
const DARK = [18, 17, 16];
const PANEL = [24, 21, 17];

/**
 * Generates and downloads a stylized FSIS invoice PDF for an order.
 * Accepts a normalized order: { invoice_number, tracking_code, handle, location,
  * items, total, discount_auec, discount_percent, discount_code, passphrase, placed_date }
 */
export function downloadInvoice(order) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const M = 16; // margin

  // Full-page dark background
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  // Header band
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, W, 38, 'F');
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.8);
  doc.line(0, 38, W, 38);

  // Logomark — hexagon
  doc.setDrawColor(...BRONZE);
  doc.setLineWidth(0.9);
  const hx = M + 7, hy = 19, r = 8;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push([hx + r * Math.cos(a), hy + r * Math.sin(a)]);
  }
  pts.forEach((p, i) => {
    const n = pts[(i + 1) % 6];
    doc.line(p[0], p[1], n[0], n[1]);
  });
  doc.line(hx - 4, hy + 2, hx, hy - 3);
  doc.line(hx, hy - 3, hx + 4, hy + 2);

  doc.setFont('courier', 'bold');
  doc.setTextColor(...CREAM);
  doc.setFontSize(13);
  doc.text('FAIRSHARE INDUSTRIAL SOLUTIONS', M + 20, 16);
  doc.setFontSize(7);
  doc.setTextColor(...BRONZE);
  doc.text(`${FSIS.license}  •  ${FSIS.hq.toUpperCase()}`, M + 20, 22);
  doc.setTextColor(...MUTED);
  doc.text(`"${FSIS.motto.toUpperCase()}"  —  EST. ${FSIS.founded}`, M + 20, 27);

  doc.setFontSize(11);
  doc.setTextColor(...BRONZE);
  doc.text('INVOICE', W - M, 16, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...CREAM);
  doc.text(order.invoice_number || order.tracking_code || '', W - M, 22, { align: 'right' });
  if (order.invoice_number && order.tracking_code) {
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(`TRACKING ${order.tracking_code}`, W - M, 27, { align: 'right' });
  }

  // Party + meta block
  let y = 50;
  doc.setFontSize(7);
  const meta = [
    ['SELLER', FSIS.name],
    ['BUYER / CONSIGNEE', order.handle || '—'],
    ['INVOICE NO.', order.invoice_number || order.tracking_code || '—'],
    ['TRACKING CODE', order.tracking_code || '—'],
    ['DELIVERY', order.location || 'TBD'],
    ['DATE ISSUED', new Date(order.placed_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
  ];
  meta.forEach(([label, value], i) => {
    const x = M + (i % 2) * ((W - 2 * M) / 2);
    const yy = y + Math.floor(i / 2) * 12;
    doc.setTextColor(...MUTED);
    doc.text(label, x, yy);
    doc.setTextColor(...CREAM);
    doc.setFontSize(9);
    doc.text(String(value).slice(0, 42), x, yy + 5);
    doc.setFontSize(7);
  });
  y += 42;

  // Line items table
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setTextColor(...BRONZE);
  doc.text('ITEM', M, y);
  doc.text('QTY', W - M - 60, y, { align: 'right' });
  doc.text('UNIT PRICE', W - M - 30, y, { align: 'right' });
  doc.text('SUBTOTAL', W - M, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(60, 50, 38);
  doc.line(M, y, W - M, y);
  y += 7;

  doc.setFontSize(8);
  (order.items || []).forEach((item) => {
    const sub = (item.unit_price || 0) * (item.quantity || 0);
    doc.setTextColor(...CREAM);
    doc.text(`${item.product_name || item.code}${item.code && item.product_name ? ` (${item.code})` : ''}`, M, y);
    doc.setTextColor(...MUTED);
    doc.text(`${item.quantity} ${item.unit || 'SCU'}`, W - M - 60, y, { align: 'right' });
    doc.text(`${(item.unit_price || 0).toLocaleString()}`, W - M - 30, y, { align: 'right' });
    doc.setTextColor(...CREAM);
    doc.text(`${sub.toLocaleString()}`, W - M, y, { align: 'right' });
    y += 7;
  });

  y += 2;
  doc.setDrawColor(60, 50, 38);
  doc.line(W / 2, y, W - M, y);
  y += 7;

  // Discount + total — show the math, per FairShare principle
  const subtotal = (order.items || []).reduce((s, i) => s + (i.unit_price || 0) * (i.quantity || 0), 0);
  doc.setTextColor(...MUTED);
  doc.text('SUBTOTAL', W - M - 50, y);
  doc.setTextColor(...CREAM);
  doc.text(`${subtotal.toLocaleString()} aUEC`, W - M, y, { align: 'right' });
  y += 7;
  if (order.discount_auec > 0) {
    doc.setTextColor(...MUTED);
    doc.text(`DISCOUNT${order.discount_code ? ` (${order.discount_code})` : ''}${order.discount_percent ? ` — ${order.discount_percent}%` : ''}`, W - M - 90, y);
    doc.setTextColor(123, 160, 91);
    doc.text(`-${order.discount_auec.toLocaleString()} aUEC`, W - M, y, { align: 'right' });
    y += 7;
  }
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRONZE);
  doc.text('TOTAL DUE', W - M - 50, y);
  doc.text(`${(order.total ?? subtotal).toLocaleString()} aUEC`, W - M, y, { align: 'right' });
  y += 14;

  // Handoff passphrase block
  if (order.passphrase) {
    doc.setFillColor(...PANEL);
    doc.setDrawColor(...COPPER);
    doc.setLineWidth(0.6);
    doc.rect(M, y, W - 2 * M, 24, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text('IN-GAME HANDOFF VERIFICATION — SPOKEN AT DELIVERY BY BOTH PARTIES', M + 6, y + 8);
    doc.setFontSize(13);
    doc.setTextColor(...BRONZE);
    doc.text(order.passphrase, M + 6, y + 18);
    y += 32;
  }

  // Footer
  const fy = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(M, fy - 6, W - M, fy - 6);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(`${FSIS.name} • ${FSIS.divisionCodes.join(' / ')} • Payment due in aUEC on delivery.`, M, fy);
  doc.text('Unofficial fan project — not affiliated with Cloud Imperium Games.', M, fy + 4);

  doc.save(`FSIS-Invoice-${order.tracking_code || 'order'}.pdf`);
}