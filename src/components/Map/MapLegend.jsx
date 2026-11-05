import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../../config';

export default function MapLegend({ heatmap }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`map-card legend ${open ? '' : 'is-collapsed'}`}>
      <button type="button" className="legend-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Legend <ChevronDown size={14} />
      </button>
      {open && (
        <ul>
          {['Lease', 'Sale', 'Sale / Lease', 'New'].map((k) => (
            <li key={k}><span className="dot" style={{ background: STATUS_COLORS[k] }} /> {STATUS_LABELS[k]}</li>
          ))}
          <li><span className="dot dot-cluster">5</span> Listing cluster</li>
          {heatmap && <li><span className="heat-swatch" /> Listing density</li>}
        </ul>
      )}
    </div>
  );
}
