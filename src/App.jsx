import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, List, Map as MapIcon, Minimize2, PenTool, SlidersHorizontal, X,
} from 'lucide-react';

import Header from './components/Layout/Header';
import MapView from './components/Map/MapView';
import LayerPanel from './components/Map/LayerPanel';
import MapLegend from './components/Map/MapLegend';
import FilterPanel from './components/Filters/FilterPanel';
import ResultsList from './components/Results/ResultsList';
import AnalyticsPanel from './components/Analytics/AnalyticsPanel';
import CompareDrawer from './components/Compare/CompareDrawer';

import useLocalStorage from './hooks/useLocalStorage';
import { fetchListings } from './services/listingsService';
import {
  EMPTY_FILTERS, applyFilters, applySpatial, countActiveFilters, SORTS,
} from './utils/filters';
import { bboxOfCoords } from './utils/geo';
import { exportCSV, exportExcel } from './utils/exporters';
import { generateBrochure } from './utils/brochure';
import { neighborhoods } from './data/overlays';
import { MAX_COMPARE } from './config';

const prefersDark = () => {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
};

export default function App() {
  /* ---------------- data */
  const [listings, setListings] = useState([]);
  const [asOf, setAsOf] = useState(null);
  const [dataSource, setDataSource] = useState('sample');
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchListings()
      .then(({ listings: l, asOf: a, source }) => { setListings(l); setAsOf(a); setDataSource(source); })
      .catch((e) => setLoadError(e.message));
  }, []);

  /* ---------------- UI state */
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useLocalStorage('cre.sort', 'newest');
  const [limitToView, setLimitToView] = useLocalStorage('cre.limitToView', true);
  const [bounds, setBounds] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [tab, setTab] = useState('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState('map');
  const [mapOnly, setMapOnly] = useState(false);
  const [theme, setTheme] = useLocalStorage('cre.theme', prefersDark);
  const [basemap, setBasemap] = useState('streets');
  const [heatmap, setHeatmap] = useState(false);
  const [overlays, setOverlays] = useLocalStorage('cre.overlays', { septa: true });
  const [favorites, setFavorites] = useLocalStorage('cre.favorites', []);
  const [compareIds, setCompareIds] = useLocalStorage('cre.compare', []);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------------- derived data */
  const refDate = asOf;
  const attrFiltered = useMemo(() => applyFilters(listings, filters, { favorites, refDate }), [listings, filters, favorites, refDate]);
  const mapListings = useMemo(() => applySpatial(attrFiltered, { polygon }), [attrFiltered, polygon]);
  const results = useMemo(
    () => applySpatial(mapListings, { bounds, limitToView }).sort(SORTS[sort]?.fn || SORTS.newest.fn),
    [mapListings, bounds, limitToView, sort],
  );
  const zips = useMemo(() => [...new Set(listings.map((p) => p.zip))].sort(), [listings]);
  const compareItems = useMemo(() => compareIds.map((id) => listings.find((p) => p.id === id)).filter(Boolean), [compareIds, listings]);
  const activeFilterCount = countActiveFilters(filters);
  const scopeLabel = polygon ? 'drawn search area' : limitToView ? 'current map view' : 'all Philadelphia';

  /* ---------------- actions */
  const handleSelect = useCallback((id, { fly } = {}) => {
    setSelectedId(id);
    if (id == null) return;
    const p = listings.find((x) => x.id === id);
    if (fly && p) {
      setFlyTarget({ center: [p.longitude, p.latitude], zoom: 15.5, key: Date.now() });
      setMobileView('map');
    }
  }, [listings]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, [setFavorites]);

  const toggleCompare = useCallback((id) => {
    setCompareIds((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= MAX_COMPARE) { setToast(`You can compare up to ${MAX_COMPARE} properties.`); return c; }
      return [...c, id];
    });
  }, [setCompareIds]);

  const handleBrochure = useCallback((p) => {
    setToast(`Generating brochure for ${p.propertyName}…`);
    generateBrochure(p).catch(() => setToast('Could not generate the brochure. Please try again.'));
  }, []);

  const popupActions = useMemo(() => ({
    favorites, compareIds, onToggleFavorite: toggleFavorite, onToggleCompare: toggleCompare, onBrochure: handleBrochure,
  }), [favorites, compareIds, toggleFavorite, toggleCompare, handleBrochure]);

  const handlePick = (s) => {
    if (s.kind === 'property') {
      setFilters((f) => ({ ...f, query: '' }));
      handleSelect(s.value, { fly: true });
    } else if (s.kind === 'neighborhood') {
      setFilters((f) => ({ ...f, query: '', markets: [s.value] }));
      const feat = neighborhoods.features.find((n) => n.properties.name === s.value);
      if (feat) setFlyTarget({ bounds: bboxOfCoords(feat.geometry.coordinates[0]), key: Date.now() });
      setToast(`Filtered to ${s.value}`);
    } else if (s.kind === 'zip') {
      setFilters((f) => ({ ...f, query: '', zip: s.value }));
      const pts = listings.filter((p) => p.zip === s.value).map((p) => [p.longitude, p.latitude]);
      if (pts.length) setFlyTarget({ bounds: bboxOfCoords(pts), key: Date.now() });
    } else if (s.kind === 'place') {
      setFlyTarget({ center: s.value, zoom: 16, key: Date.now() });
    }
  };

  const handleDrawComplete = (geom) => {
    setPolygon(geom);
    setFlyTarget({ bounds: bboxOfCoords(geom.coordinates[0]), key: Date.now() });
    setLimitToView(false);
  };

  const toggleMapOnly = async () => {
    const next = !mapOnly;
    setMapOnly(next);
    try {
      if (next && !document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      if (!next && document.fullscreenElement) await document.exitFullscreen?.();
    } catch { /* fullscreen API unavailable (e.g. iOS Safari); in-app map-only mode still applies */ }
  };
  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setMapOnly(false); };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const clearAll = () => { setFilters(EMPTY_FILTERS); setPolygon(null); };

  /* ---------------- render */
  return (
    <div className={`app ${mapOnly ? 'is-map-only' : ''} mobile-${mobileView}`}>
      <Header
        properties={listings}
        query={filters.query}
        onQuery={(q) => setFilters((f) => ({ ...f, query: q }))}
        onPick={handlePick}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        drawMode={drawMode}
        onToggleDraw={() => { setDrawMode((d) => !d); setMobileView('map'); }}
        mapOnly={mapOnly}
        onToggleMapOnly={toggleMapOnly}
        favoritesCount={favorites.length}
        favoritesOnly={filters.favoritesOnly}
        onToggleFavoritesOnly={() => setFilters((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
      />

      {dataSource === 'sample' && (
        <div className="sample-banner" role="note">
          Demo mode: fictional sample listings for illustration.<span className="hide-sm"> Connect a live feed in <code>src/services/listingsService.js</code>.</span>
        </div>
      )}
      {loadError && <div className="sample-banner is-error" role="alert">Couldn’t load listings: {loadError}</div>}

      <div className="main">
        <aside className="sidebar" aria-label="Listings and analytics">
          <div className="sidebar-head">
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'is-on' : ''} onClick={() => setTab('list')}>
                <List size={15} /> Listings
              </button>
              <button type="button" role="tab" aria-selected={tab === 'stats'} className={tab === 'stats' ? 'is-on' : ''} onClick={() => setTab('stats')}>
                <BarChart3 size={15} /> Analytics
              </button>
            </div>
            <button type="button" className={`btn btn-outline btn-sm ${activeFilterCount ? 'has-count' : ''}`} onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
            </button>
          </div>

          {(polygon || filters.query) && (
            <div className="active-chips">
              {polygon && (
                <span className="active-chip"><PenTool size={12} /> Drawn area
                  <button type="button" onClick={() => setPolygon(null)} aria-label="Remove drawn area"><X size={12} /></button>
                </span>
              )}
              {filters.query && (
                <span className="active-chip">“{filters.query}”
                  <button type="button" onClick={() => setFilters((f) => ({ ...f, query: '' }))} aria-label="Clear keyword"><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          <div className="sidebar-body">
            {tab === 'list' ? (
              <ResultsList
                results={results}
                total={listings.length}
                refDate={refDate}
                sort={sort}
                onSort={setSort}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onSelect={handleSelect}
                favorites={favorites}
                compareIds={compareIds}
                onToggleFavorite={toggleFavorite}
                onToggleCompare={toggleCompare}
                limitToView={limitToView}
                onLimitToView={setLimitToView}
                onExportCSV={() => { exportCSV(results); setToast(`Exported ${results.length} listings to CSV`); }}
                onExportExcel={() => exportExcel(results).then(() => setToast(`Exported ${results.length} listings to Excel`))}
                onClearAll={clearAll}
              />
            ) : (
              <AnalyticsPanel listings={results} scopeLabel={scopeLabel} refDate={refDate} />
            )}
          </div>

          {filtersOpen && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setFiltersOpen(false)}
              resultCount={results.length}
              zips={zips}
            />
          )}
        </aside>

        <div className="map-area">
          <MapView
            properties={mapListings}
            refDate={refDate}
            theme={theme}
            basemap={basemap}
            heatmap={heatmap}
            overlays={overlays}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={setHoveredId}
            onSelect={handleSelect}
            onBoundsChange={setBounds}
            flyTarget={flyTarget}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            drawnPolygon={polygon}
            onDrawComplete={handleDrawComplete}
            popupActions={popupActions}
          />
          <div className="map-top-right">
            <LayerPanel
              overlays={overlays}
              onToggleOverlay={(id) => setOverlays((o) => ({ ...o, [id]: !o[id] }))}
              heatmap={heatmap}
              onToggleHeatmap={() => setHeatmap((h) => !h)}
              basemap={basemap}
              onBasemap={setBasemap}
            />
          </div>
          <div className="map-bottom-left"><MapLegend heatmap={heatmap} /></div>
          {mapOnly && (
            <button type="button" className="map-btn exit-full" onClick={toggleMapOnly}><Minimize2 size={15} /> Exit full screen</button>
          )}
        </div>
      </div>

      <button type="button" className="mobile-switch" onClick={() => setMobileView((v) => (v === 'map' ? 'list' : 'map'))}>
        {mobileView === 'map' ? <><List size={16} /> List ({results.length})</> : <><MapIcon size={16} /> Map</>}
      </button>

      <CompareDrawer
        items={compareItems}
        refDate={refDate}
        onRemove={toggleCompare}
        onClear={() => setCompareIds([])}
        onSelect={handleSelect}
        onBrochure={handleBrochure}
      />

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
