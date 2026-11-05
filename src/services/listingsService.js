import { DATA_SOURCE, LISTINGS_API_URL } from '../config';
import sampleProperties, { DATA_AS_OF } from '../data/properties';

/**
 * Single seam between the UI and wherever listings live.
 *
 * - 'sample': bundled demo data (src/data/properties.js)
 * - 'api':    GET LISTINGS_API_URL -> { asOf, listings: Property[] }
 *
 * Production pattern: never call CREXi / Reonomy / etc. from the browser.
 * A backend job ingests each feed on a schedule, normalizes records to the
 * Property shape (see normalizeListing), stores them (Postgres + PostGIS),
 * and exposes this one endpoint. Keys stay server-side.
 */
export async function fetchListings() {
  if (DATA_SOURCE === 'api') {
    const res = await fetch(LISTINGS_API_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Listings API returned ${res.status}`);
    const json = await res.json();
    const listings = (json.listings || json).map(normalizeListing).filter(Boolean);
    return { listings, asOf: json.asOf || new Date().toISOString().slice(0, 10), source: 'api' };
  }
  return { listings: sampleProperties, asOf: DATA_AS_OF, source: 'sample' };
}

/** Coerce a record from any feed into the app's Property shape. */
export function normalizeListing(r) {
  const lat = Number(r.latitude ?? r.lat);
  const lng = Number(r.longitude ?? r.lng ?? r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    id: r.id,
    propertyName: r.propertyName || r.name || r.address,
    address: r.address,
    street: r.street || r.address?.split(',')[0],
    zip: String(r.zip || r.postalCode || '').slice(0, 5),
    neighborhood: r.neighborhood || 'Other',
    propertyType: r.propertyType,
    status: r.status, // 'Lease' | 'Sale' | 'Sale / Lease'
    salePrice: num(r.salePrice),
    leaseRate: num(r.leaseRate),
    leaseType: r.leaseType || null,
    capRate: num(r.capRate),
    buildingSF: num(r.buildingSF),
    availableSF: num(r.availableSF),
    lotSizeAcres: num(r.lotSizeAcres),
    yearBuilt: num(r.yearBuilt),
    zoning: r.zoning || null,
    listedDate: (r.listedDate || new Date().toISOString()).slice(0, 10),
    latitude: lat,
    longitude: lng,
    broker: r.broker || '',
    company: r.company || '',
    phone: r.phone || '',
    email: r.email || '',
    listingUrl: r.listingUrl || null,
    image: r.image || null,
    highlights: r.highlights || [],
  };
}
