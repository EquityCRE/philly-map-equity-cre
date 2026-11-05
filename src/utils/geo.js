/** Ray-casting point-in-polygon. point: [lng, lat]; ring: [[lng, lat], ...] */
export function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Supports Polygon (outer ring minus holes). */
export function pointInPolygon(point, polygonCoords) {
  if (!polygonCoords?.length || !pointInRing(point, polygonCoords[0])) return false;
  for (let h = 1; h < polygonCoords.length; h++) if (pointInRing(point, polygonCoords[h])) return false;
  return true;
}

export function inBounds([lng, lat], b) {
  if (!b) return true;
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

export function bboxOfCoords(coords) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  coords.forEach(([x, y]) => { w = Math.min(w, x); s = Math.min(s, y); e = Math.max(e, x); n = Math.max(n, y); });
  return [[w, s], [e, n]];
}

export function toFeatureCollection(properties, extra = () => ({})) {
  return {
    type: 'FeatureCollection',
    features: properties.map((p) => ({
      type: 'Feature',
      id: p.id,
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      properties: { id: p.id, name: p.propertyName, status: p.status, type: p.propertyType, ...extra(p) },
    })),
  };
}
