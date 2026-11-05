import { useState } from 'react';
import { ChevronDown, ChevronUp, FileDown, Trash2, X } from 'lucide-react';
import PropertyImage from '../common/PropertyImage';
import StatusBadge from '../common/StatusBadge';
import {
  fmtAcres, fmtCurrency, fmtNum, fmtPct, fmtRate, fmtSF, pricePerSF, daysOnMarket,
} from '../../utils/format';

const ROWS = [
  ['Property Type', (p) => p.propertyType],
  ['Neighborhood', (p) => p.neighborhood],
  ['Sale Price', (p) => fmtCurrency(p.salePrice), (p) => p.salePrice, 'low'],
  ['Price / SF', (p) => (pricePerSF(p) ? `$${fmtNum(Math.round(pricePerSF(p)))}` : '—'), pricePerSF, 'low'],
  ['Lease Rate', (p) => fmtRate(p.leaseRate, p.leaseType), (p) => p.leaseRate, 'low'],
  ['Cap Rate', (p) => fmtPct(p.capRate), (p) => p.capRate, 'high'],
  ['Building Size', (p) => fmtSF(p.buildingSF), (p) => p.buildingSF, 'high'],
  ['Available SF', (p) => fmtSF(p.availableSF), (p) => p.availableSF, 'high'],
  ['Lot Size', (p) => fmtAcres(p.lotSizeAcres), (p) => p.lotSizeAcres, 'high'],
  ['Year Built', (p) => p.yearBuilt ?? '—', (p) => p.yearBuilt, 'high'],
  ['Zoning', (p) => p.zoning ?? '—'],
  ['Days on Market', (p, ref) => daysOnMarket(p, ref)],
  ['Broker', (p) => `${p.broker} · ${p.company}`],
];

/** Index of the "best" value in a row (for subtle highlighting). */
function bestIndex(items, getter, dir) {
  if (!getter || items.length < 2) return -1;
  let best = -1, bestVal = null;
  items.forEach((p, i) => {
    const v = getter(p);
    if (v == null) return;
    if (bestVal == null || (dir === 'low' ? v < bestVal : v > bestVal)) { bestVal = v; best = i; }
  });
  return best;
}

export default function CompareDrawer({ items, refDate, onRemove, onClear, onSelect, onBrochure }) {
  const [expanded, setExpanded] = useState(true);
  if (!items.length) return null;

  return (
    <section className={`compare ${expanded ? 'is-open' : ''}`} aria-label="Compare properties">
      <header className="compare-head">
        <button type="button" className="compare-toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          Compare <span className="count-pill">{items.length}</span>
        </button>
        {!expanded && (
          <div className="compare-chips">
            {items.map((p) => <span key={p.id} className="compare-chip">{p.propertyName}</span>)}
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}><Trash2 size={14} /> Clear</button>
      </header>
      {expanded && (
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" className="compare-rowhead" />
                {items.map((p) => (
                  <th key={p.id} scope="col">
                    <div className="compare-col-head">
                      <button type="button" className="compare-remove" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.propertyName}`}><X size={14} /></button>
                      <button type="button" className="compare-thumb" onClick={() => onSelect(p.id, { fly: true })}><PropertyImage property={p} iconSize={20} /></button>
                      <button type="button" className="compare-name" onClick={() => onSelect(p.id, { fly: true })}>{p.propertyName}</button>
                      <div className="compare-addr">{p.street}</div>
                      <StatusBadge property={p} refDate={refDate} compact />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fmt, getter, dir]) => {
                const best = bestIndex(items, getter, dir);
                return (
                  <tr key={label}>
                    <th scope="row" className="compare-rowhead">{label}</th>
                    {items.map((p, i) => <td key={p.id} className={i === best ? 'is-best' : ''}>{fmt(p, refDate)}</td>)}
                  </tr>
                );
              })}
              <tr>
                <th scope="row" className="compare-rowhead">Brochure</th>
                {items.map((p) => (
                  <td key={p.id}><button type="button" className="btn btn-ghost btn-xs" onClick={() => onBrochure(p)}><FileDown size={13} /> PDF</button></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
