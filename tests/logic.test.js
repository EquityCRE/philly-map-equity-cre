// Run: npm test  (node --test on an esbuild bundle; see package.json)
import test from 'node:test';
import assert from 'node:assert/strict';
import properties from '../src/data/properties';
import { applyFilters, applySpatial, EMPTY_FILTERS, countActiveFilters } from '../src/utils/filters';
import { buildSuggestions } from '../src/utils/search';
import { marketStats, byPropertyType, rentByMarket } from '../src/utils/stats';
import { pointInPolygon } from '../src/utils/geo';
import { markerCategory } from '../src/utils/format';
import { neighborhoods } from '../src/data/overlays';

const ref = '2026-11-05';

test('dataset has 50+ well-formed listings', () => {
  assert.ok(properties.length >= 50);
  for (const p of properties) {
    assert.ok(['Lease', 'Sale', 'Sale / Lease'].includes(p.status), p.propertyName);
    assert.ok(p.latitude > 39.86 && p.latitude < 40.14 && p.longitude > -75.29 && p.longitude < -74.95, `${p.propertyName} outside Philly`);
    if (p.status === 'Sale') assert.ok(p.salePrice > 0, `${p.propertyName} sale w/o price`);
    if (p.status === 'Lease' && p.propertyType !== 'Land') assert.ok(p.leaseRate > 0, `${p.propertyName} lease w/o rate`);
  }
  assert.equal(new Set(properties.map((p) => p.id)).size, properties.length);
});

test('listings fall inside their market polygon', () => {
  const misses = properties.filter((p) => {
    const f = neighborhoods.features.find((n) => n.properties.name === p.neighborhood);
    return !pointInPolygon([p.longitude, p.latitude], f.geometry.coordinates);
  }).map((p) => `${p.propertyName} (${p.neighborhood})`);
  assert.deepEqual(misses, []);
});

test('transaction filter: Sale includes dual listings', () => {
  const r = applyFilters(properties, { ...EMPTY_FILTERS, transactionTypes: ['Sale'] }, { refDate: ref });
  assert.ok(r.every((p) => p.status !== 'Lease'));
  assert.ok(r.some((p) => p.status === 'Sale / Lease'));
});

test('combined filters', () => {
  const f = { ...EMPTY_FILTERS, propertyTypes: ['Industrial'], markets: ['Port Richmond', 'South Philadelphia'] };
  const r = applyFilters(properties, f, { refDate: ref });
  assert.ok(r.length > 0 && r.every((p) => p.propertyType === 'Industrial'));
  assert.equal(countActiveFilters(f), 3);
});

test('price range excludes listings without a price', () => {
  const r = applyFilters(properties, { ...EMPTY_FILTERS, priceMin: '1000000', priceMax: '5000000' }, { refDate: ref });
  assert.ok(r.every((p) => p.salePrice >= 1e6 && p.salePrice <= 5e6));
});

test('keyword & zip search', () => {
  assert.ok(applyFilters(properties, { ...EMPTY_FILTERS, query: 'frankford ave' }, {}).length >= 2);
  const z = applyFilters(properties, { ...EMPTY_FILTERS, zip: '19125' }, {});
  assert.ok(z.length > 0 && z.every((p) => p.zip === '19125'));
});

test('autocomplete returns neighborhoods, zips and properties', () => {
  assert.equal(buildSuggestions('fish', properties)[0].kind, 'neighborhood');
  assert.ok(buildSuggestions('1910', properties).some((s) => s.kind === 'zip'));
  assert.ok(buildSuggestions('liberty lo', properties).some((s) => s.kind === 'property'));
});

test('draw polygon spatial filter', () => {
  const cc = neighborhoods.features.find((n) => n.properties.name === 'Center City').geometry;
  const r = applySpatial(properties, { polygon: cc });
  assert.ok(r.length >= 8 && r.every((p) => p.neighborhood === 'Center City'));
});

test('stats & recent marker category', () => {
  const s = marketStats(properties, ref);
  assert.equal(s.total, properties.length);
  assert.ok(s.avgRent > 10 && s.avgRent < 80);
  assert.ok(byPropertyType(properties).length === 9);
  assert.ok(rentByMarket(properties).length >= 8);
  assert.ok(properties.some((p) => markerCategory(p, ref) === 'New'));
});
