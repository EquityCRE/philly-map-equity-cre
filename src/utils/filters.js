import { inBounds, pointInPolygon } from './geo';
import { isRecent } from './format';

export const EMPTY_FILTERS = {
  query: '',
  zip: '',
  transactionTypes: [], // 'Lease' | 'Sale' | 'Sale / Lease'
  propertyTypes: [],
  markets: [],
  priceMin: '', priceMax: '',
  rateMin: '', rateMax: '',
  capMin: '', capMax: '',
  sfMin: '', sfMax: '',
  lotMin: '', lotMax: '',
  recentOnly: false,
  favoritesOnly: false,
};

const n = (v) => (v === '' || v == null ? null : Number(v));

/** Does a numeric value satisfy an optional [min, max] range?
 *  When a bound is set, listings missing the value are excluded
 *  (e.g. setting a sale-price range hides lease-only listings). */
function inRange(value, min, max) {
  const lo = n(min), hi = n(max);
  if (lo == null && hi == null) return true;
  if (value == null) return false;
  if (lo != null && value < lo) return false;
  if (hi != null && value > hi) return false;
  return true;
}

/**
 * Transaction matching:
 *  - "Lease" matches listings For Lease and Sale/Lease
 *  - "Sale"  matches listings For Sale  and Sale/Lease
 *  - "Sale / Lease" matches only dual-offered listings
 */
function matchesTransaction(p, types) {
  if (!types.length) return true;
  return types.some((t) => (t === 'Sale / Lease' ? p.status === 'Sale / Lease' : p.status === t || p.status === 'Sale / Lease'));
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = `${p.propertyName} ${p.address} ${p.neighborhood} ${p.zip} ${p.propertyType} ${p.broker} ${p.company}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}

/** Attribute filters only (no map geometry). Used for the map + analytics. */
export function applyFilters(list, f, { favorites = [], refDate } = {}) {
  return list.filter((p) =>
    matchesQuery(p, f.query) &&
    (!f.zip || p.zip === f.zip) &&
    matchesTransaction(p, f.transactionTypes) &&
    (!f.propertyTypes.length || f.propertyTypes.includes(p.propertyType)) &&
    (!f.markets.length || f.markets.includes(p.neighborhood)) &&
    inRange(p.salePrice, f.priceMin, f.priceMax) &&
    inRange(p.leaseRate, f.rateMin, f.rateMax) &&
    inRange(p.capRate, f.capMin, f.capMax) &&
    inRange(p.buildingSF, f.sfMin, f.sfMax) &&
    inRange(p.lotSizeAcres, f.lotMin, f.lotMax) &&
    (!f.recentOnly || isRecent(p, refDate)) &&
    (!f.favoritesOnly || favorites.includes(p.id)),
  );
}

/** Spatial filters: drawn polygon and (optionally) current map viewport. */
export function applySpatial(list, { polygon, bounds, limitToView }) {
  return list.filter((p) => {
    const pt = [p.longitude, p.latitude];
    if (polygon && !pointInPolygon(pt, polygon.coordinates)) return false;
    if (limitToView && bounds && !inBounds(pt, bounds)) return false;
    return true;
  });
}

export function countActiveFilters(f) {
  let c = 0;
  ['transactionTypes', 'propertyTypes', 'markets'].forEach((k) => { c += f[k].length; });
  [['priceMin', 'priceMax'], ['rateMin', 'rateMax'], ['capMin', 'capMax'], ['sfMin', 'sfMax'], ['lotMin', 'lotMax']]
    .forEach(([a, b]) => { if (f[a] !== '' || f[b] !== '') c += 1; });
  if (f.zip) c += 1;
  if (f.recentOnly) c += 1;
  if (f.favoritesOnly) c += 1;
  return c;
}

export const SORTS = {
  newest: { label: 'Newest', fn: (a, b) => b.listedDate.localeCompare(a.listedDate) },
  priceHigh: { label: 'Price: High to Low', fn: (a, b) => (b.salePrice ?? -1) - (a.salePrice ?? -1) },
  priceLow: { label: 'Price: Low to High', fn: (a, b) => (a.salePrice ?? Infinity) - (b.salePrice ?? Infinity) },
  rateLow: { label: 'Lease Rate: Low to High', fn: (a, b) => (a.leaseRate ?? Infinity) - (b.leaseRate ?? Infinity) },
  sfHigh: { label: 'Available SF: Largest', fn: (a, b) => (b.availableSF ?? 0) - (a.availableSF ?? 0) },
  cap: { label: 'Cap Rate: Highest', fn: (a, b) => (b.capRate ?? -1) - (a.capRate ?? -1) },
};
