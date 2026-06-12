import { jsPDF } from 'jspdf';
import { FSIS } from '@/lib/fsisLore';
import { CATEGORIES } from '@/components/apps/ledger/LedgerEntryForm';

// Bronze command-deck palette (RGB)
const BRONZE = [212, 146, 11];
const COPPER = [176, 121, 58];
const CREAM = [229, 221, 208];
const MUTED = [138, 126, 108];
const DARK = [18, 17, 16];
const PANEL = [24, 21, 17];
const GREEN = [123, 160, 91];
const RED = [192, 80, 80];

function paintBackground(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, 'F');
}

/**
 * Generates and downloads a stylized FSIS monthly financial summary PDF.
 * @param {string} monthKey - "YYYY-MM"
 * @param {Array} entries - ledger_entry records for that month
 */
export function downloadMonthlyReport(monthKey, entries) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;

  const [yr, mo] = monthKey.split('-');
  const monthLabel = new Date(Number(yr), Number(mo) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const income = entries.filter((e) => e.entry_type === 'income');
  const expenses = entries.filter((e) => e.entry_type === 'expense');
  const totalIncome = income.reduce((s, e) => s + (e.amount_auec || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = totalIncome - totalExpenses;

  paintBackground(doc);

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
  doc.text('MONTHLY SUMMARY', W - M, 16, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...CREAM);
  doc.text(monthLabel, W - M, 22, { align: 'right' });

  // Totals panel — income / expenses / net
  let y = 50;
  const colW = (W - 2 * M - 12) / 3;
  const totals = [
    ['TOTAL INCOME', totalIncome, GREEN],
    ['BUSINESS EXPENSES', totalExpenses, RED],
    ['NET PROFIT', net, net >= 0 ? BRONZE : RED],
  ];
  totals.forEach(([label, value, color], i) => {
    const x = M + i * (colW + 6);
    doc.setFillColor(...PANEL);
    doc.setDrawColor(...COPPER);
    doc.setLineWidth(0.5);
    doc.rect(x, y, colW, 24, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(11);
    doc.setTextColor(...color);
    doc.text(`${value.toLocaleString()} aUEC`, x + 5, y + 18);
  });
  y += 36;

  // Category breakdown
  const byCategory = {};
  entries.forEach((e) => {
    const key = `${e.entry_type}|${e.category || 'other'}`;
    byCategory[key] = (byCategory[key] || 0) + (e.amount_auec || 0);
  });
  const catRows = Object.entries(byCategory)
    .map(([key, amount]) => {
      const [type, cat] = key.split('|');
      return { type, label: CATEGORIES[cat] || cat, amount };
    })
    .sort((a, b) => b.amount - a.amount);

  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(...BRONZE);
  doc.text('BREAKDOWN BY CATEGORY', M, y);
  doc.text('TYPE', W - M - 40, y, { align: 'right' });
  doc.text('AMOUNT', W - M, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(60, 50, 38);
  doc.line(M, y, W - M, y);
  y += 7;

  doc.setFontSize(8);
  catRows.forEach((row) => {
    doc.setTextColor(...CREAM);
    doc.text(row.label, M, y);
    doc.setTextColor(...(row.type === 'income' ? GREEN : RED));
    doc.text(row.type.toUpperCase(), W - M - 40, y, { align: 'right' });
    doc.setTextColor(...CREAM);
    doc.text(`${row.amount.toLocaleString()} aUEC`, W - M, y, { align: 'right' });
    y += 7;
  });
  y += 6;

  // Transaction log
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(...BRONZE);
  doc.text(`TRANSACTION LOG — ${entries.length} ENTRIES`, M, y);
  doc.text('AMOUNT', W - M, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(60, 50, 38);
  doc.line(M, y, W - M, y);
  y += 7;

  doc.setFontSize(7.5);
  const sorted = [...entries].sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));
  sorted.forEach((e) => {
    if (y > H - 30) {
      doc.addPage();
      paintBackground(doc);
      y = 20;
    }
    const isIncome = e.entry_type === 'income';
    doc.setTextColor(...MUTED);
    doc.text(e.entry_date || '—', M, y);
    doc.setTextColor(...CREAM);
    const desc = `${e.description || CATEGORIES[e.category] || 'Entry'}${e.counterparty ? ` — ${e.counterparty}` : ''}`;
    doc.text(desc.length > 64 ? desc.slice(0, 61) + '…' : desc, M + 22, y);
    doc.setTextColor(...(isIncome ? GREEN : RED));
    doc.text(`${isIncome ? '+' : '-'}${(e.amount_auec || 0).toLocaleString()}`, W - M, y, { align: 'right' });
    y += 6;
  });

  // Footer on last page
  const fy = H - 18;
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(M, fy - 6, W - M, fy - 6);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(`${FSIS.name} • Internal financial record • Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, M, fy);
  doc.text('Unofficial fan project — not affiliated with Cloud Imperium Games.', M, fy + 4);

  doc.save(`FSIS-Monthly-Summary-${monthKey}.pdf`);
}