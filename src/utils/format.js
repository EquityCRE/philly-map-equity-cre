import { RECENT_DAYS, STATUS_LABELS } from '../config';

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('en-US');

export const fmtCurrency = (v) => (v == null ? '—' : usd0.format(v));

export const fmtCompactCurrency = (v) => {
  if (v == null) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return usd0.format(v);
};

export const fmtRate = (v, leaseType) => (v == null ? '—' : `${usd2.format(v)}/SF/yr${leaseType ? ` ${abbrevLease(leaseType)}` : ''}`);
export const fmtSF = (v) => (v == null ? '—' : `${num.format(v)} SF`);
export const fmtNum = (v) => (v == null ? '—' : num.format(v));
export const fmtAcres = (v) => (v == null ? '—' : `${v.toFixed(2)} AC`);
export const fmtPct = (v) => (v == null ? '—' : `${v.toFixed(2)}%`);
export const fmtDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

function abbrevLease(t) {
  return { 'Full Service': 'FSG', 'Modified Gross': 'MG', NNN: 'NNN' }[t] || t;
}

/** Days between a listing date and the reference ("as of") date. */
export function daysOnMarket(p, refDate) {
  const ref = refDate ? new Date(refDate) : new Date();
  return Math.max(0, Math.round((ref - new Date(p.listedDate)) / 86400000));
}

export const isRecent = (p, refDate) => daysOnMarket(p, refDate) <= RECENT_DAYS;

/** Marker category: recently added overrides transaction type. */
export const markerCategory = (p, refDate) => (isRecent(p, refDate) ? 'New' : p.status);

export const statusLabel = (status) => STATUS_LABELS[status] || status;

/** Headline price shown in result cards. */
export function headlinePrice(p) {
  if (p.status === 'Sale') return fmtCompactCurrency(p.salePrice) || 'Price Upon Request';
  if (p.status === 'Lease') return p.leaseRate ? `$${p.leaseRate.toFixed(2)}/SF/yr` : 'Rate Upon Request';
  const parts = [];
  if (p.salePrice) parts.push(fmtCompactCurrency(p.salePrice));
  if (p.leaseRate) parts.push(`$${p.leaseRate.toFixed(2)}/SF`);
  return parts.join(' · ') || 'Upon Request';
}

export const pricePerSF = (p) => (p.salePrice && p.buildingSF ? p.salePrice / p.buildingSF : null);
