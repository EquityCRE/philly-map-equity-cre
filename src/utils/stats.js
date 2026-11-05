import { PROPERTY_TYPES, MARKETS } from '../config';
import { daysOnMarket, pricePerSF } from './format';

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);

export function marketStats(list, refDate) {
  const forSale = list.filter((p) => p.status === 'Sale' || p.status === 'Sale / Lease');
  const forLease = list.filter((p) => p.status === 'Lease' || p.status === 'Sale / Lease');
  const rents = forLease.map((p) => p.leaseRate).filter((v) => v != null);
  const ppsf = forSale.map(pricePerSF).filter((v) => v != null);
  const caps = list.map((p) => p.capRate).filter((v) => v != null);

  return {
    total: list.length,
    forSale: forSale.length,
    forLease: forLease.length,
    avgRent: avg(rents),
    avgPricePerSF: avg(ppsf),
    avgCap: avg(caps),
    totalAvailableSF: forLease.reduce((s, p) => s + (p.availableSF || 0), 0),
    totalSaleVolume: forSale.reduce((s, p) => s + (p.salePrice || 0), 0),
    newLast30: list.filter((p) => daysOnMarket(p, refDate) <= 30).length,
  };
}

export function byPropertyType(list) {
  return PROPERTY_TYPES.map((t) => {
    const items = list.filter((p) => p.propertyType === t);
    return {
      name: t,
      count: items.length,
      sale: items.filter((p) => p.status !== 'Lease').length,
      lease: items.filter((p) => p.status !== 'Sale').length,
    };
  }).filter((r) => r.count > 0);
}

export function rentByMarket(list) {
  return MARKETS.map((m) => {
    const rents = list.filter((p) => p.neighborhood === m && p.leaseRate != null).map((p) => p.leaseRate);
    return { name: m.replace(' Philadelphia', ' Phila.').replace('Manayunk / Roxborough', 'Manayunk'), rent: rents.length ? +avg(rents).toFixed(2) : null, count: rents.length };
  }).filter((r) => r.rent != null).sort((a, b) => b.rent - a.rent);
}

export function transactionMix(list) {
  return ['Lease', 'Sale', 'Sale / Lease']
    .map((s) => ({ name: s, value: list.filter((p) => p.status === s).length }))
    .filter((r) => r.value > 0);
}

/** New listings per week for the last 12 weeks. */
export function listingsTrend(list, refDate) {
  const weeks = Array.from({ length: 12 }, (_, i) => ({ week: 11 - i, count: 0 }));
  list.forEach((p) => {
    const w = Math.floor(daysOnMarket(p, refDate) / 7);
    if (w < 12) weeks[11 - w].count += 1;
  });
  return weeks.map((w) => ({ name: w.week === 0 ? 'This wk' : `-${w.week}w`, count: w.count }));
}
