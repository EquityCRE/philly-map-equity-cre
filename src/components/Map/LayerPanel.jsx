import { useEffect, useRef, useState } from 'react';
import { Layers, Flame, Map as MapIcon, Satellite } from 'lucide-react';
import { OVERLAYS } from '../../data/overlays';

export default function LayerPanel({ overlays, onToggleOverlay, heatmap, onToggleHeatmap, basemap, onBasemap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeCount = Object.values(overlays).filter(Boolean).length + (heatmap ? 1 : 0);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="layer-panel" ref={ref}>
      <button type="button" className="map-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Map layers">
        <Layers size={16} /> <span className="hide-sm">Layers</span>
        {activeCount > 0 && <span className="count-pill">{activeCount}</span>}
      </button>
      {open && (
        <div className="map-card layer-menu" role="menu">
          <div className="layer-section">
            <div className="layer-title">Basemap</div>
            <div className="seg">
              <button type="button" className={basemap === 'streets' ? 'is-on' : ''} onClick={() => onBasemap('streets')}><MapIcon size={14} /> Streets</button>
              <button type="button" className={basemap === 'satellite' ? 'is-on' : ''} onClick={() => onBasemap('satellite')}><Satellite size={14} /> Satellite</button>
            </div>
          </div>
          <div className="layer-section">
            <div className="layer-title">Analysis</div>
            <label className="check-row">
              <input type="checkbox" checked={heatmap} onChange={onToggleHeatmap} />
              <Flame size={14} className="heat-icon" /> Listing heatmap
            </label>
          </div>
          <div className="layer-section">
            <div className="layer-title">Philadelphia overlays</div>
            {OVERLAYS.map((o) => (
              <label key={o.id} className="check-row">
                <input type="checkbox" checked={Boolean(overlays[o.id])} onChange={() => onToggleOverlay(o.id)} />
                <span className="swatch" style={{ background: o.color }} />
                {o.label}
                {o.approximate && <span className="approx" title="Illustrative geometry — replace with official source">approx.</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
