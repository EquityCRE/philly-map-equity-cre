import { fmtDate, pricePerSF, statusLabel } from './format';

const COLUMNS = [
  ['ID', (p) => p.id],
  ['Property Name', (p) => p.propertyName],
  ['Address', (p) => p.address],
  ['ZIP', (p) => p.zip],
  ['Neighborhood', (p) => p.neighborhood],
  ['Property Type', (p) => p.propertyType],
  ['Status', (p) => statusLabel(p.status)],
  ['Sale Price ($)', (p) => p.salePrice],
  ['Price / SF ($)', (p) => (pricePerSF(p) ? Math.round(pricePerSF(p)) : null)],
  ['Lease Rate ($/SF/yr)', (p) => p.leaseRate],
  ['Lease Type', (p) => p.leaseType],
  ['Cap Rate (%)', (p) => p.capRate],
  ['Building SF', (p) => p.buildingSF],
  ['Available SF', (p) => p.availableSF],
  ['Lot Size (AC)', (p) => p.lotSizeAcres],
  ['Year Built', (p) => p.yearBuilt],
  ['Zoning', (p) => p.zoning],
  ['Listed', (p) => fmtDate(p.listedDate)],
  ['Broker', (p) => p.broker],
  ['Company', (p) => p.company],
  ['Phone', (p) => p.phone],
  ['Email', (p) => p.email],
  ['Listing URL', (p) => p.listingUrl],
  ['Latitude', (p) => p.latitude],
  ['Longitude', (p) => p.longitude],
];

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

const csvCell = (v) => {
  if (v == null) return '';
  const s = String(v);
  // Guard against spreadsheet formula injection, then quote.
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function exportCSV(list) {
  const header = COLUMNS.map(([h]) => h).join(',');
  const rows = list.map((p) => COLUMNS.map(([, fn]) => csvCell(fn(p))).join(','));
  const blob = new Blob([`﻿${[header, ...rows].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  download(blob, `philly-cre-listings-${stamp()}.csv`);
}

export async function exportExcel(list) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Philadelphia CRE Map';
  const ws = wb.addWorksheet('Listings', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map(([h]) => ({ header: h, key: h, width: Math.max(12, h.length + 4) }));
  list.forEach((p) => ws.addRow(Object.fromEntries(COLUMNS.map(([h, fn]) => [h, fn(p)]))));

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2742' } };
  ['Sale Price ($)', 'Price / SF ($)'].forEach((k) => { ws.getColumn(k).numFmt = '$#,##0'; });
  ws.getColumn('Lease Rate ($/SF/yr)').numFmt = '$#,##0.00';
  ['Building SF', 'Available SF'].forEach((k) => { ws.getColumn(k).numFmt = '#,##0'; });
  ws.getColumn('Property Name').width = 34;
  ws.getColumn('Address').width = 44;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `philly-cre-listings-${stamp()}.xlsx`);
}
