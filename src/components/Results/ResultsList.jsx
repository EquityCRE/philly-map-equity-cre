import { useEffect, useRef } from 'react';
import { ArrowUpDown, Download, FileSpreadsheet, SearchX } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { SORTS } from '../../utils/filters';

export default function ResultsList({
  results, total, refDate, sort, onSort, hoveredId, selectedId, onHover, onSelect,
  favorites, compareIds, onToggleFavorite, onToggleCompare, limitToView, onLimitToView,
  onExportCSV, onExportExcel, onClearAll,
}) {
  const listRef = useRef(null);

  // Keep the selected card in view when chosen from the map.
  useEffect(() => {
    if (selectedId == null || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <div className="results">
      <div className="results-toolbar">
        <div className="results-count">
          <strong>{results.length}</strong> of {total} properties
        </div>
        <div className="results-tools">
          <label className="sort">
            <ArrowUpDown size={14} aria-hidden="true" />
            <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort results">
              {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
          <button type="button" className="icon-btn" onClick={onExportCSV} title="Export CSV" disabled={!results.length}><Download size={16} /></button>
          <button type="button" className="icon-btn" onClick={onExportExcel} title="Export Excel" disabled={!results.length}><FileSpreadsheet size={16} /></button>
        </div>
      </div>
      <label className="check-row view-toggle">
        <input type="checkbox" checked={limitToView} onChange={(e) => onLimitToView(e.target.checked)} />
        Only show properties in map view
      </label>

      <div className="results-list" ref={listRef} role="list">
        {results.length === 0 ? (
          <div className="empty">
            <SearchX size={28} />
            <p>No properties match these criteria.</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClearAll}>Clear filters & search area</button>
          </div>
        ) : (
          results.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              refDate={refDate}
              hovered={hoveredId === p.id}
              selected={selectedId === p.id}
              favorite={favorites.includes(p.id)}
              comparing={compareIds.includes(p.id)}
              onHover={onHover}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
              onToggleCompare={onToggleCompare}
            />
          ))
        )}
      </div>
    </div>
  );
}
