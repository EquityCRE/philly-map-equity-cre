export default function RangeInput({ label, min, max, onChange, prefix, suffix, step = 1 }) {
  const clean = (v) => (v === '' ? '' : v.replace(/[^0-9.]/g, ''));
  return (
    <div className="range">
      <span className="range-label">{label}</span>
      <div className="range-inputs">
        <label className="affix">
          {prefix && <span>{prefix}</span>}
          <input inputMode="decimal" type="number" min="0" step={step} placeholder="Min" value={min}
            onChange={(e) => onChange(clean(e.target.value), max)} aria-label={`${label} minimum`} />
          {suffix && <span>{suffix}</span>}
        </label>
        <span className="range-dash">–</span>
        <label className="affix">
          {prefix && <span>{prefix}</span>}
          <input inputMode="decimal" type="number" min="0" step={step} placeholder="Max" value={max}
            onChange={(e) => onChange(min, clean(e.target.value))} aria-label={`${label} maximum`} />
          {suffix && <span>{suffix}</span>}
        </label>
      </div>
    </div>
  );
}
