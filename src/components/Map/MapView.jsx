import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Check, PenTool, Undo2, X } from 'lucide-react';

import {
  MAPBOX_TOKEN, MAP_STYLES, LABEL_FONT, PHILLY_CENTER, DEFAULT_ZOOM, STATUS_COLORS, USE_MAPBOX,
} from '../../config';
import { OVERLAYS } from '../../data/overlays';
import { toFeatureCollection } from '../../utils/geo';
import { markerCategory } from '../../utils/format';
import PropertyPopup from './PropertyPopup';

if (USE_MAPBOX) mapboxgl.accessToken = MAPBOX_TOKEN;

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

/** Run getClusterExpansionZoom on both Mapbox (callback) and MapLibre (Promise). */
function clusterZoom(source, clusterId) {
  return new Promise((resolve) => {
    const r = source.getClusterExpansionZoom(clusterId, (err, z) => resolve(err ? null : z));
    if (r && typeof r.then === 'function') r.then(resolve).catch(() => resolve(null));
  });
}

export default function MapView({
  properties, refDate, theme, basemap, heatmap, overlays,
  hoveredId, selectedId, onHover, onSelect, onBoundsChange,
  flyTarget, drawMode, onDrawModeChange, drawnPolygon, onDrawComplete,
  popupActions,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const popupRootRef = useRef(null);
  const suppressCloseRef = useRef(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const [draft, setDraft] = useState([]); // in-progress draw vertices [lng, lat]

  // Keep latest props available to long-lived map event handlers.
  const live = useRef({});
  live.current = { onHover, onSelect, onBoundsChange, drawMode, draft, setDraft };

  const styleUrl = basemap === 'satellite' ? MAP_STYLES.satellite : MAP_STYLES[theme === 'dark' ? 'dark' : 'light'];

  /* ------------------------------------------------------------ init */
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: PHILLY_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 9,
      maxZoom: 19,
      projection: 'mercator',
      attributionControl: true,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial', maxWidth: 110 }), 'bottom-right');

    const emitBounds = () => {
      const b = map.getBounds();
      live.current.onBoundsChange?.({ west: b.getWest(), east: b.getEast(), south: b.getSouth(), north: b.getNorth() });
    };

    map.on('style.load', () => {
      if (map.getSource('listings')) return; // already initialised for this style
      addOverlayLayers(map);
      addListingLayers(map);
      addDrawLayers(map);
      setStyleVersion((v) => v + 1);
    });
    map.on('load', emitBounds);
    map.on('moveend', emitBounds);

    // Cluster click → zoom in
    map.on('click', 'clusters', async (e) => {
      if (live.current.drawMode) return;
      const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
      if (!f) return;
      const z = await clusterZoom(map.getSource('listings'), f.properties.cluster_id);
      if (z != null) map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.25 });
    });

    // Point interactions
    map.on('click', 'listing-points', (e) => {
      if (live.current.drawMode) return;
      const id = e.features?.[0]?.properties?.id;
      if (id != null) live.current.onSelect?.(Number(id));
    });
    map.on('mousemove', 'listing-points', (e) => {
      if (live.current.drawMode) return;
      map.getCanvas().style.cursor = 'pointer';
      const id = e.features?.[0]?.properties?.id;
      live.current.onHover?.(id != null ? Number(id) : null);
    });
    map.on('mouseleave', 'listing-points', () => {
      if (live.current.drawMode) return;
      map.getCanvas().style.cursor = '';
      live.current.onHover?.(null);
    });
    ['clusters'].forEach((l) => {
      map.on('mouseenter', l, () => { if (!live.current.drawMode) map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', l, () => { if (!live.current.drawMode) map.getCanvas().style.cursor = ''; });
    });

    // Overlay feature tooltips
    const tip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'cre-tooltip', offset: 10 });
    ['ov-dev-points', 'ov-rail-points', 'ov-septa-stations', 'ov-oz-fill', 'ov-qof-fill', 'ov-campus-fill'].forEach((layer) => {
      map.on('mousemove', layer, (e) => {
        if (live.current.drawMode) return;
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties;
        const sub = p.type ? `<div class="tt-sub">${p.type}</div>` : p.note ? `<div class="tt-sub">${p.note}</div>` : p.line ? `<div class="tt-sub">${p.line === 'L' ? 'Market-Frankford Line' : 'Broad Street Line'}</div>` : '';
        tip.setLngLat(e.lngLat).setHTML(`<div class="tt-title">${escapeHtml(p.name)}</div>${sub}`).addTo(map);
      });
      map.on('mouseleave', layer, () => tip.remove());
    });

    // Draw-on-map
    map.on('click', (e) => {
      const { drawMode: dm, setDraft: sd } = live.current;
      if (!dm) return;
      sd((d) => [...d, [e.lngLat.lng, e.lngLat.lat]]);
    });
    map.on('dblclick', (e) => {
      if (!live.current.drawMode) return;
      e.preventDefault();
      finishRef.current?.();
    });
    map.on('mousemove', (e) => {
      if (!live.current.drawMode) return;
      const d = live.current.draft;
      const src = map.getSource('draw-draft');
      if (src && d.length) src.setData(draftGeojson([...d, [e.lngLat.lng, e.lngLat.lat]]));
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); popupRef.current = null; map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------ basemap / theme */
  const appliedStyle = useRef(styleUrl);
  useEffect(() => {
    if (!mapRef.current || appliedStyle.current === styleUrl) return;
    appliedStyle.current = styleUrl;
    mapRef.current.setStyle(styleUrl, { diff: false });
  }, [styleUrl]);

  /* ------------------------------------------------------------ listing data */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const fc = toFeatureCollection(properties, (p) => ({ color: STATUS_COLORS[markerCategory(p, refDate)] }));
    map.getSource('listings')?.setData(fc);
    map.getSource('listings-heat')?.setData(fc);
  }, [properties, refDate, styleVersion]);

  /* ------------------------------------------------------------ heatmap & overlays visibility */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const vis = (layer, on) => map.getLayer(layer) && map.setLayoutProperty(layer, 'visibility', on ? 'visible' : 'none');
    vis('listings-heatmap', heatmap);
    vis('clusters', !heatmap);
    vis('cluster-count', !heatmap);
    OVERLAYS.forEach((o) => {
      overlayLayerIds(o).forEach((l) => vis(l, Boolean(overlays[o.id])));
    });
  }, [heatmap, overlays, styleVersion]);

  /* ------------------------------------------------------------ hover highlight */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const ids = [hoveredId, selectedId].filter((v) => v != null);
    const fc = toFeatureCollection(properties.filter((p) => ids.includes(p.id)), (p) => ({
      color: STATUS_COLORS[markerCategory(p, refDate)],
      role: p.id === hoveredId ? 'hover' : 'selected',
    }));
    map.getSource('highlight')?.setData(fc);
  }, [hoveredId, selectedId, properties, refDate, styleVersion]);

  /* ------------------------------------------------------------ popup */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const p = properties.find((x) => x.id === selectedId);
    if (!p) {
      if (popupRef.current) { suppressCloseRef.current = true; popupRef.current.remove(); popupRef.current = null; }
      return;
    }
    if (!popupRef.current) {
      const el = document.createElement('div');
      popupRootRef.current = createRoot(el);
      popupRef.current = new mapboxgl.Popup({ offset: 16, maxWidth: '360px', className: 'cre-popup', focusAfterOpen: false })
        .setDOMContent(el);
      popupRef.current.on('close', () => {
        const root = popupRootRef.current;
        setTimeout(() => root?.unmount(), 0); // unmount outside React's render cycle
        if (suppressCloseRef.current) { suppressCloseRef.current = false; return; }
        popupRef.current = null;
        live.current.onSelect?.(null);
      });
    }
    popupRootRef.current.render(<PropertyPopup property={p} refDate={refDate} {...popupActions} />);
    popupRef.current.setLngLat([p.longitude, p.latitude]);
    if (!popupRef.current.isOpen()) popupRef.current.addTo(map);
  }, [selectedId, properties, refDate, popupActions]);

  /* ------------------------------------------------------------ fly-to requests */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    if (flyTarget.bounds) map.fitBounds(flyTarget.bounds, { padding: 60, duration: 900, maxZoom: 15 });
    else map.flyTo({ center: flyTarget.center, zoom: flyTarget.zoom ?? 15.5, speed: 1.4, essential: true });
  }, [flyTarget]);

  /* ------------------------------------------------------------ draw mode */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawMode) { map.doubleClickZoom.disable(); map.getCanvas().style.cursor = 'crosshair'; }
    else { map.doubleClickZoom.enable(); map.getCanvas().style.cursor = ''; setDraft([]); }
  }, [drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    map.getSource('draw-draft')?.setData(draft.length ? draftGeojson(draft) : EMPTY_FC);
  }, [draft, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    map.getSource('draw-final')?.setData(drawnPolygon ? { type: 'Feature', properties: {}, geometry: drawnPolygon } : EMPTY_FC);
  }, [drawnPolygon, styleVersion]);

  const finishRef = useRef(null);
  finishRef.current = () => {
    // dblclick also fires two clicks; drop duplicate trailing vertices
    const pts = dedupe(draft);
    if (pts.length < 3) return;
    const ring = [...pts, pts[0]];
    onDrawComplete({ type: 'Polygon', coordinates: [ring] });
    onDrawModeChange(false);
  };

  return (
    <div className="map-canvas-wrap">
      <div ref={containerRef} className="map-canvas" aria-label="Map of Philadelphia commercial listings" />
      {drawMode && (
        <div className="draw-toolbar" role="toolbar" aria-label="Draw search area">
          <PenTool size={15} />
          <span>{draft.length < 3 ? `Click the map to add points (${draft.length}/3 min)` : 'Double-click or press Finish to search this area'}</span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setDraft((d) => d.slice(0, -1))} disabled={!draft.length}><Undo2 size={14} /> Undo</button>
          <button type="button" className="btn btn-primary btn-xs" onClick={() => finishRef.current()} disabled={dedupe(draft).length < 3}><Check size={14} /> Finish</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => onDrawModeChange(false)} aria-label="Cancel drawing"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

/* ================================================================ layers */

function overlayLayerIds(o) {
  switch (o.kind) {
    case 'boundary': return [`ov-${o.id}-fill`, `ov-${o.id}-line`, `ov-${o.id}-label`];
    case 'transit': return [`ov-${o.id}-casing`, `ov-${o.id}-line`, `ov-${o.id}-stations`];
    case 'points': return [`ov-${o.id}-points`];
    default: return [`ov-${o.id}-fill`, `ov-${o.id}-line`];
  }
}

function addOverlayLayers(map) {
  OVERLAYS.forEach((o) => {
    const src = `ov-${o.id}`;
    if (!map.getSource(src)) map.addSource(src, { type: 'geojson', data: o.data });
    const hidden = { visibility: 'none' };
    if (o.kind === 'boundary') {
      map.addLayer({ id: `${src}-fill`, type: 'fill', source: src, layout: hidden, paint: { 'fill-color': o.color, 'fill-opacity': 0.04 } });
      map.addLayer({ id: `${src}-line`, type: 'line', source: src, layout: hidden, paint: { 'line-color': o.color, 'line-width': 1.5, 'line-dasharray': [3, 2] } });
      map.addLayer({
        id: `${src}-label`, type: 'symbol', source: src,
        layout: { ...hidden, 'text-field': ['get', 'name'], 'text-font': LABEL_FONT, 'text-size': 12, 'text-transform': 'uppercase', 'text-letter-spacing': 0.08 },
        paint: { 'text-color': o.color, 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.5 },
      });
    } else if (o.kind === 'transit') {
      map.addLayer({ id: `${src}-casing`, type: 'line', source: src, layout: { ...hidden, 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 } });
      map.addLayer({ id: `${src}-line`, type: 'line', source: src, layout: { ...hidden, 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
      map.addSource('ov-septa-stations-src', { type: 'geojson', data: o.stations });
      map.addLayer({ id: `${src}-stations`, type: 'circle', source: 'ov-septa-stations-src', layout: hidden, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 15, 6], 'circle-color': '#ffffff', 'circle-stroke-color': ['get', 'color'], 'circle-stroke-width': 2 } });
    } else if (o.kind === 'points') {
      map.addLayer({ id: `${src}-points`, type: 'circle', source: src, layout: hidden, paint: { 'circle-radius': o.id === 'dev' ? 9 : 6, 'circle-color': o.color, 'circle-opacity': o.id === 'dev' ? 0.85 : 1, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
    } else {
      map.addLayer({ id: `${src}-fill`, type: 'fill', source: src, layout: hidden, paint: { 'fill-color': o.color, 'fill-opacity': 0.16 } });
      map.addLayer({ id: `${src}-line`, type: 'line', source: src, layout: hidden, paint: { 'line-color': o.color, 'line-width': 1.5 } });
    }
  });
}

function addListingLayers(map) {
  map.addSource('listings-heat', { type: 'geojson', data: EMPTY_FC });
  map.addLayer({
    id: 'listings-heatmap', type: 'heatmap', source: 'listings-heat', maxzoom: 16, layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 3],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 18, 15, 40],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.85, 16, 0.25],
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(37,99,235,0)', 0.2, 'rgba(37,99,235,0.55)', 0.45, '#22C55E', 0.65, '#FACC15', 0.85, '#F97316', 1, '#DC2626'],
    },
  });

  map.addSource('listings', { type: 'geojson', data: EMPTY_FC, cluster: true, clusterRadius: 48, clusterMaxZoom: 14 });
  map.addLayer({
    id: 'clusters', type: 'circle', source: 'listings', filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#0F2742', 10, '#123B66', 25, '#0B2036'],
      'circle-radius': ['step', ['get', 'point_count'], 16, 10, 21, 25, 27],
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255,255,255,0.9)',
    },
  });
  map.addLayer({
    id: 'cluster-count', type: 'symbol', source: 'listings', filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': LABEL_FONT, 'text-size': 13, 'text-allow-overlap': true },
    paint: { 'text-color': '#ffffff' },
  });
  map.addSource('highlight', { type: 'geojson', data: EMPTY_FC });
  map.addLayer({
    id: 'highlight-halo', type: 'circle', source: 'highlight',
    paint: {
      'circle-radius': ['match', ['get', 'role'], 'hover', 20, 16],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.25,
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: 'listing-points', type: 'circle', source: 'listings', filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 16, 10],
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#ffffff',
    },
  });
  map.addLayer({
    id: 'highlight-dot', type: 'circle', source: 'highlight',
    paint: { 'circle-radius': 7, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 },
  });
}

function addDrawLayers(map) {
  map.addSource('draw-final', { type: 'geojson', data: EMPTY_FC });
  map.addLayer({ id: 'draw-final-fill', type: 'fill', source: 'draw-final', paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.08 } }, 'clusters');
  map.addLayer({ id: 'draw-final-line', type: 'line', source: 'draw-final', paint: { 'line-color': '#2563EB', 'line-width': 2.5 } }, 'clusters');
  map.addSource('draw-draft', { type: 'geojson', data: EMPTY_FC });
  map.addLayer({ id: 'draw-draft-fill', type: 'fill', source: 'draw-draft', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.1 } });
  map.addLayer({ id: 'draw-draft-line', type: 'line', source: 'draw-draft', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#2563EB', 'line-width': 2, 'line-dasharray': [2, 1] } });
  map.addLayer({ id: 'draw-draft-pts', type: 'circle', source: 'draw-draft', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-color': '#2563EB', 'circle-stroke-width': 2 } });
}

function draftGeojson(pts) {
  const features = pts.map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } }));
  if (pts.length >= 2) features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [...pts, pts[0]] } });
  if (pts.length >= 3) features.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] } });
  return { type: 'FeatureCollection', features };
}

function dedupe(pts) {
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
