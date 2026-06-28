import { jsPDF } from 'jspdf';
import { FSIS } from '@/lib/fsisLore';

const BRONZE = [212, 146, 11];
const COPPER = [176, 121, 58];
const CREAM = [229, 221, 208];
const MUTED = [138, 126, 108];
const DARK = [18, 17, 16];
const PANEL = [24, 21, 17];
const GREEN = [123, 160, 91];
const RED = [192, 80, 80];

function bg(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, w, h, 'F');
}

function line(doc, y) {
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.4);
  doc.line(16, y, w - 16, y);
}

function stat(doc, x, y, label, value, color = BRONZE) {
  doc.setFillColor(...PANEL);
  doc.setDrawColor(...COPPER);
  doc.rect(x, y, 55, 22, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(label, x + 4, y + 7);
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(String(value), x + 4, y + 17);
}

function row(doc, y, left, right, color = CREAM) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...CREAM);
  doc.text(String(left).slice(0, 72), 16, y);
  doc.setTextColor(...color);
  doc.text(String(right), w - 16, y, { align: 'right' });
}

export function downloadWeeklyPerformanceSummary(summary) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = 48;

  bg(doc);
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, w, 36, 'F');
  doc.setDrawColor(...COPPER);
  doc.line(0, 36, w, 36);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...CREAM);
  doc.text('FAIRSHARE INDUSTRIAL SOLUTIONS', 16, 15);
  doc.setFontSize(7);
  doc.setTextColor(...BRONZE);
  doc.text(`${FSIS.license} • ${FSIS.hq.toUpperCase()}`, 16, 22);
  doc.setTextColor(...MUTED);
  doc.text('WEEKLY SALVAGE + FREIGHT PERFORMANCE SUMMARY', 16, 28);

  doc.setFontSize(10);
  doc.setTextColor(...BRONZE);
  doc.text('ARCHIVE REPORT', w - 16, 15, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(...CREAM);
  doc.text(summary.periodLabel, w - 16, 22, { align: 'right' });

  stat(doc, 16, y, 'INCOME', `${summary.income.toLocaleString()} aUEC`, GREEN);
  stat(doc, 77, y, 'EXPENSES', `${summary.expenses.toLocaleString()} aUEC`, RED);
  stat(doc, 138, y, 'NET', `${summary.net.toLocaleString()} aUEC`, summary.net >= 0 ? BRONZE : RED);
  y += 34;

  line(doc, y); y += 7;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRONZE);
  doc.text('OPERATION SNAPSHOT', 16, y); y += 8;
  row(doc, y, 'Orders completed / active', `${summary.deliveredOrders} delivered • ${summary.activeOrders} active`); y += 6;
  row(doc, y, 'Salvage work orders settled', `${summary.salvageRuns} runs • ${summary.salvageGross.toLocaleString()} aUEC gross`); y += 6;
  row(doc, y, 'Cargo lots moved', `${summary.cargoLots} lots • ${summary.cargoScu.toLocaleString()} SCU • ${summary.cargoValue.toLocaleString()} aUEC est.`); y += 6;
  row(doc, y, 'Freight missions', `${summary.freightMissions} missions • ${summary.freightRewards.toLocaleString()} aUEC rewards`); y += 6;
  row(doc, y, 'Freight plans', `${summary.freightPlans} plans • ${summary.freightProfit.toLocaleString()} aUEC profit`, summary.freightProfit >= 0 ? GREEN : RED); y += 10;

  line(doc, y); y += 7;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRONZE);
  doc.text('LEDGER BREAKDOWN', 16, y); y += 8;
  summary.categoryRows.forEach((r) => { row(doc, y, r.label, `${r.net.toLocaleString()} aUEC`, r.net >= 0 ? GREEN : RED); y += 6; });
  if (summary.categoryRows.length === 0) { row(doc, y, 'No ledger entries recorded this week', '—', MUTED); y += 6; }
  y += 4;

  line(doc, y); y += 7;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRONZE);
  doc.text('ARCHIVE NOTES', 16, y); y += 8;
  const notes = [
    `Generated ${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
    'Use this report for weekly review, payout reconciliation, and long-term FSIS archive records.',
    'Freight plan profit uses final sale minus commodity and handling costs when those values are logged.'
  ];
  notes.forEach((n) => { row(doc, y, n, ''); y += 6; });

  const fy = h - 16;
  line(doc, fy - 6);
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(`${FSIS.name} • Internal operations archive • Unofficial fan project`, 16, fy);

  doc.save(`FSIS-Weekly-Performance-${summary.periodKey}.pdf`);
}