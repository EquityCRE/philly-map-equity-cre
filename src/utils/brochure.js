import { STATUS_COLORS } from '../config';
import {
  fmtAcres, fmtCurrency, fmtDate, fmtNum, fmtPct, fmtRate, fmtSF, pricePerSF, statusLabel,
} from './format';

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Try to load a listing photo as a data URL so jsPDF can embed it. */
async function loadImage(src) {
  if (!src) return null;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** One-page marketing brochure for a single listing. */
export async function generateBrochure(p, { mapImageUrl } = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  const navy = [15, 39, 66];
  const accent = hexToRgb(STATUS_COLORS[p.status] || '#2563EB');

  // Header band
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 92, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(p.propertyName, M, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(p.address, M, 64);
  doc.setFillColor(...accent);
  const badge = statusLabel(p.status).toUpperCase();
  const bw = doc.getTextWidth(badge) + 20;
  doc.roundedRect(W - M - bw, 30, bw, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(badge, W - M - bw + 10, 45);

  // Hero image (photo if available, else branded block)
  const heroY = 108;
  const heroH = 200;
  const img = await loadImage(p.image || mapImageUrl);
  if (img) {
    doc.addImage(img, 'JPEG', M, heroY, W - 2 * M, heroH, undefined, 'FAST');
  } else {
    doc.setFillColor(232, 237, 244);
    doc.rect(M, heroY, W - 2 * M, heroH, 'F');
    doc.setTextColor(...navy);
    doc.setFontSize(16);
    doc.text(p.propertyType.toUpperCase(), W / 2, heroY + heroH / 2 - 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${p.neighborhood} · Philadelphia, PA`, W / 2, heroY + heroH / 2 + 14, { align: 'center' });
  }

  // Key metrics strip
  const metrics = [
    ['Sale Price', fmtCurrency(p.salePrice)],
    ['Lease Rate', p.leaseRate ? `$${p.leaseRate.toFixed(2)}/SF` : '—'],
    ['Available', fmtSF(p.availableSF)],
    ['Cap Rate', fmtPct(p.capRate)],
  ];
  const mY = heroY + heroH + 18;
  const mW = (W - 2 * M) / metrics.length;
  metrics.forEach(([label, value], i) => {
    const x = M + i * mW;
    doc.setDrawColor(220, 226, 234);
    doc.rect(x, mY, mW - 6, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 10, mY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...navy);
    doc.text(value, x + 10, mY + 38);
  });

  // Details table
  autoTable(doc, {
    startY: mY + 68,
    margin: { left: M, right: W / 2 + 6 },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { textColor: [100, 116, 139], cellWidth: 95 }, 1: { fontStyle: 'bold', textColor: navy } },
    head: [['Property Details', '']],
    headStyles: { textColor: navy, fontStyle: 'bold', fontSize: 11 },
    body: [
      ['Property Type', p.propertyType],
      ['Neighborhood', p.neighborhood],
      ['Building Size', fmtSF(p.buildingSF)],
      ['Available Space', fmtSF(p.availableSF)],
      ['Lot Size', fmtAcres(p.lotSizeAcres)],
      ['Year Built', p.yearBuilt ? String(p.yearBuilt) : '—'],
      ['Zoning', p.zoning || '—'],
      ['Lease Rate', fmtRate(p.leaseRate, p.leaseType)],
      ['Price / SF', pricePerSF(p) ? `$${fmtNum(Math.round(pricePerSF(p)))}` : '—'],
      ['Listed', fmtDate(p.listedDate)],
    ],
  });
  const leftEnd = doc.lastAutoTable.finalY;

  // Highlights + broker (right column)
  let ry = mY + 68 + 16;
  const rx = W / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  doc.text('Highlights', rx, ry);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  (p.highlights || []).forEach((h) => { ry += 18; doc.text(`•  ${h}`, rx, ry); });

  ry += 34;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(rx - 6, ry - 18, W - M - rx + 6, 96, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  doc.text('Listing Contact', rx + 6, ry);
  doc.setFontSize(12);
  doc.text(p.broker, rx + 6, ry + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(p.company, rx + 6, ry + 36);
  doc.text(p.phone || '', rx + 6, ry + 52);
  doc.text(p.email || '', rx + 6, ry + 68);

  // Footer
  const fy = Math.max(leftEnd, ry + 90) + 30;
  doc.setDrawColor(220, 226, 234);
  doc.line(M, fy, W - M, fy);
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 145);
  doc.text(
    'The information above has been obtained from sources believed reliable but is not guaranteed. Prospective buyers and tenants should verify all information independently.',
    M, fy + 14, { maxWidth: W - 2 * M },
  );
  if (p.listingUrl) {
    doc.setTextColor(...accent);
    doc.textWithLink('View full listing online', M, fy + 36, { url: p.listingUrl });
  }

  doc.save(`${p.propertyName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-brochure.pdf`);
}
