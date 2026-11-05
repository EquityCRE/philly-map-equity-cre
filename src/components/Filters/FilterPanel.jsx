import { RotateCcw, X } from 'lucide-react';
import { MARKETS, PROPERTY_TYPES, STATUS_COLORS, TRANSACTION_TYPES, STATUS_LABELS } from '../../config';
import { EMPTY_FILTERS } from '../../utils/filters';
import RangeInput from './RangeInput';

function ChipGroup({ options, selected, onChange, colors }) {
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={`chip ${selected.includes(o) ? 'is-on' : ''}`}
          onClick={() => toggle(o)}
          aria-pressed={selected.includes(o)}
        >
          {colors && <span className="dot" style={{ background: colors[o] }} />}
          {colors ? STATUS_LABELS[o] : o}
        </button>
      ))}
    </div>
  );
}

export default function FilterPanel({ filters, onChange, onClose, resultCount, zips }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <section className="filter-panel" aria-label="Filters">
      <header className="filter-head">
        <h2>Filters</h2>
        <div className="filter-head-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close filters"><X size={16} /></button>
        </div>
      </header>

      <div className="filter-scroll">
        <fieldset>
          <legend>Transaction Type</legend>
          <ChipGroup options={TRANSACTION_TYPES} selected={filters.transactionTypes} onChange={(v) => set({ transactionTypes: v })} colors={STATUS_COLORS} />
          <label className="check-row mt-8">
            <input type="checkbox" checked={filters.recentOnly} onChange={(e) => set({ recentOnly: e.target.checked })} />
            <span className="dot" style={{ background: STATUS_COLORS.New }} /> Recently added only
          </label>
          <label className="check-row">
            <input type="checkbox" checked={filters.favoritesOnly} onChange={(e) => set({ favoritesOnly: e.target.checked })} />
            Saved properties only
          </label>
        </fieldset>

        <fieldset>
          <legend>Property Type</legend>
          <ChipGroup options={PROPERTY_TYPES} selected={filters.propertyTypes} onChange={(v) => set({ propertyTypes: v })} />
        </fieldset>

        <fieldset>
          <legend>Market</legend>
          <ChipGroup options={MARKETS} selected={filters.markets} onChange={(v) => set({ markets: v })} />
          <label className="field mt-8">
            <span>ZIP Code</span>
            <select value={filters.zip} onChange={(e) => set({ zip: e.target.value })}>
              <option value="">Any ZIP</option>
              {zips.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Financials</legend>
          <RangeInput label="Sale Price" prefix="$" step={50000} min={filters.priceMin} max={filters.priceMax}
            onChange={(a, b) => set({ priceMin: a, priceMax: b })} />
          <RangeInput label="Lease Rate ($/SF/yr)" prefix="$" step={1} min={filters.rateMin} max={filters.rateMax}
            onChange={(a, b) => set({ rateMin: a, rateMax: b })} />
          <RangeInput label="Cap Rate" suffix="%" step={0.25} min={filters.capMin} max={filters.capMax}
            onChange={(a, b) => set({ capMin: a, capMax: b })} />
        </fieldset>

        <fieldset>
          <legend>Size</legend>
          <RangeInput label="Building Size" suffix="SF" step={1000} min={filters.sfMin} max={filters.sfMax}
            onChange={(a, b) => set({ sfMin: a, sfMax: b })} />
          <RangeInput label="Lot Size" suffix="AC" step={0.25} min={filters.lotMin} max={filters.lotMax}
            onChange={(a, b) => set({ lotMin: a, lotMax: b })} />
        </fieldset>
        <p className="filter-note">Setting a price, rate or cap range hides listings that don’t report that figure.</p>
      </div>

      <footer className="filter-foot">
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Show {resultCount} {resultCount === 1 ? 'property' : 'properties'}
        </button>
      </footer>
    </section>
  );
}
