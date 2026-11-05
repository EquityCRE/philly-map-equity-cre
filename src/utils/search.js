import { MARKETS, PHILLY_BOUNDS, MAPBOX_TOKEN, PHILLY_CENTER } from '../config';

/**
 * Build autocomplete suggestions from the listing set:
 * properties (name/address), neighborhoods, and ZIP codes.
 */
export function buildSuggestions(query, properties, limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out = [];

  MARKETS.filter((m) => m.toLowerCase().includes(q)).forEach((m) => {
    const count = properties.filter((p) => p.neighborhood === m).length;
    out.push({ kind: 'neighborhood', key: `n-${m}`, label: m, sub: `Neighborhood · ${count} listings`, value: m });
  });

  const zips = [...new Set(properties.map((p) => p.zip))].sort();
  zips.filter((z) => z.startsWith(q.replace(/\D/g, '')) && /\d/.test(q)).forEach((z) => {
    const count = properties.filter((p) => p.zip === z).length;
    out.push({ kind: 'zip', key: `z-${z}`, label: z, sub: `ZIP code · ${count} listings`, value: z });
  });

  const scored = properties
    .map((p) => {
      const name = p.propertyName.toLowerCase();
      const addr = p.address.toLowerCase();
      let score = -1;
      if (name.startsWith(q) || addr.startsWith(q)) score = 3;
      else if (name.includes(q)) score = 2;
      else if (addr.includes(q)) score = 1;
      return { p, score };
    })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  scored.forEach(({ p }) =>
    out.push({ kind: 'property', key: `p-${p.id}`, label: p.propertyName, sub: p.address, value: p.id }),
  );

  return out.slice(0, limit);
}

/**
 * Optional free-form address geocoding (only with a Mapbox token).
 * Restricted to the Philadelphia bounding box.
 */
export async function geocodeAddress(query, signal) {
  if (!MAPBOX_TOKEN || query.trim().length < 4) return [];
  const bbox = [PHILLY_BOUNDS[0][0], PHILLY_BOUNDS[0][1], PHILLY_BOUNDS[1][0], PHILLY_BOUNDS[1][1]].join(',');
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&bbox=${bbox}&proximity=${PHILLY_CENTER.join(',')}&types=address,street,postcode&limit=3&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.features || []).map((f) => ({
      kind: 'place',
      key: `g-${f.id}`,
      label: f.properties?.name || f.properties?.full_address,
      sub: f.properties?.place_formatted || 'Address',
      value: f.geometry.coordinates,
    }));
  } catch {
    return [];
  }
}
