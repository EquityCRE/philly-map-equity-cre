/**
 * Philadelphia reference overlays.
 *
 * IMPORTANT: Geometries here are SIMPLIFIED / APPROXIMATE so the app runs with
 * zero external dependencies. For production, swap each export for the
 * authoritative source listed beside it (see README "Overlay data sources").
 * The map code reads plain GeoJSON, so a swap is a one-line change in
 * src/config.js (OVERLAY_SOURCES) to point at a URL instead of these objects.
 */

const fc = (features) => ({ type: 'FeatureCollection', features });
const line = (props, coords) => ({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } });
const pt = (props, [lat, lng]) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lng, lat] } });
const poly = (props, latlngs) => {
  const ring = latlngs.map(([lat, lng]) => [lng, lat]);
  ring.push(ring[0]);
  return { type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [ring] } };
};
/** Rectangle helper: south, west, north, east */
const box = (props, s, w, n, e) => poly(props, [[s, w], [s, e], [n, e], [n, w]]);

/* ------------------------------------------------------------------ SEPTA Metro
 * Source for production: SEPTA GTFS / SEPTA open data (septa-septa.opendata.arcgis.com)
 */
const MFL = [
  ['69th St Transportation Center', 39.9621, -75.2586], ['Millbourne', 39.9643, -75.2524], ['63rd St', 39.9628, -75.2468],
  ['60th St', 39.9622, -75.2414], ['56th St', 39.9612, -75.2324], ['52nd St', 39.9601, -75.2242], ['46th St', 39.959, -75.2142],
  ['40th St', 39.9571, -75.2018], ['34th St', 39.9558, -75.1922], ['30th St', 39.9549, -75.183], ['15th St', 39.9525, -75.1652],
  ['13th St', 39.9522, -75.1615], ['11th St', 39.9514, -75.1582], ['8th St', 39.9511, -75.1538], ['5th St / Independence Hall', 39.9502, -75.1489],
  ['2nd St', 39.95, -75.144], ['Spring Garden', 39.9605, -75.1405], ['Girard', 39.969, -75.136], ['Berks', 39.9785, -75.1335],
  ['York-Dauphin', 39.9855, -75.1315], ['Huntingdon', 39.9887, -75.1272], ['Somerset', 39.9915, -75.1225], ['Allegheny', 39.9965, -75.1145],
  ['Tioga', 40.0003, -75.1065], ['Erie-Torresdale', 40.0056, -75.0961], ['Church', 40.011, -75.0885], ['Margaret-Orthodox', 40.0165, -75.084],
  ['Frankford Transportation Center', 40.023, -75.0775],
];
const BSL = [
  ['Fern Rock Transportation Center', 40.042, -75.137], ['Olney', 40.039, -75.1445], ['Logan', 40.0305, -75.1465], ['Wyoming', 40.0245, -75.1478],
  ['Hunting Park', 40.0168, -75.1495], ['Erie', 40.0094, -75.151], ['Allegheny', 40.0018, -75.1528], ['North Philadelphia', 39.994, -75.1545],
  ['Susquehanna-Dauphin', 39.9874, -75.1559], ['Cecil B. Moore', 39.9787, -75.158], ['Girard', 39.9714, -75.1595], ['Fairmount', 39.9667, -75.1607],
  ['Spring Garden', 39.9625, -75.1616], ['Race-Vine', 39.9561, -75.1628], ['City Hall', 39.9524, -75.1636], ['Walnut-Locust', 39.949, -75.1644],
  ['Lombard-South', 39.9445, -75.1655], ['Ellsworth-Federal', 39.9363, -75.1673], ['Tasker-Morris', 39.9305, -75.1686], ['Snyder', 39.9245, -75.17],
  ['Oregon', 39.9166, -75.1714], ['NRG', 39.905, -75.1735],
];
const toLine = (stops) => stops.map(([, lat, lng]) => [lng, lat]);

export const septaLines = fc([
  line({ name: 'Market-Frankford Line (L)', color: '#1F6FD1', code: 'L' }, toLine(MFL)),
  line({ name: 'Broad Street Line (B)', color: '#F47B20', code: 'B' }, toLine(BSL)),
]);

export const septaStations = fc([
  ...MFL.map(([name, lat, lng]) => pt({ name, line: 'L', color: '#1F6FD1' }, [lat, lng])),
  ...BSL.map(([name, lat, lng]) => pt({ name, line: 'B', color: '#F47B20' }, [lat, lng])),
]);

/* ------------------------------------------------------------------ Regional Rail
 * Production: SEPTA GTFS rail stops (google_rail.zip) or SEPTA open data portal.
 */
export const regionalRailStations = fc([
  ['30th Street Station', 39.9557, -75.182], ['Suburban Station', 39.9539, -75.1679], ['Jefferson Station', 39.9525, -75.158],
  ['Penn Medicine Station', 39.948, -75.1903], ['Temple University', 39.9813, -75.1494], ['North Broad', 39.9925, -75.155],
  ['North Philadelphia', 39.9968, -75.155], ['Wayne Junction', 40.0222, -75.16], ['Manayunk', 40.0268, -75.2253],
  ['Ivy Ridge', 40.034, -75.2353], ['East Falls', 40.0113, -75.1919], ['Fox Chase', 40.0763, -75.0833],
  ['Holmesburg Junction', 40.0329, -75.0237], ['Torresdale', 40.0545, -74.9842], ['Bridesburg', 40.0107, -75.0697],
  ['Eastwick', 39.8936, -75.2443], ['Chestnut Hill East', 40.0812, -75.2072], ['Mount Airy', 40.0653, -75.191],
  ['Somerton', 40.1307, -75.0122], ['Forest Hills', 40.1278, -75.0206],
].map(([name, lat, lng]) => pt({ name }, [lat, lng])));

/* ------------------------------------------------------------------ Opportunity Zones
 * ILLUSTRATIVE ONLY. Production: CDFI Fund "Opportunity Zones" census tract
 * shapefile (8764 designated tracts) filtered to Philadelphia County (FIPS 42101),
 * or the City's OZ layer on OpenDataPhilly.
 */
export const opportunityZones = fc([
  poly({ name: 'Kensington / Fairhill OZ tracts', note: 'Approximate' }, [[39.982, -75.140], [39.984, -75.120], [39.999, -75.108], [40.004, -75.128], [39.996, -75.145]]),
  poly({ name: 'North Philadelphia (Temple area) OZ tracts', note: 'Approximate' }, [[39.972, -75.172], [39.973, -75.150], [39.992, -75.150], [39.993, -75.172]]),
  poly({ name: 'Port Richmond Waterfront OZ tracts', note: 'Approximate' }, [[39.972, -75.112], [39.978, -75.090], [39.992, -75.085], [39.990, -75.108]]),
  poly({ name: 'Navy Yard / Lower South OZ tracts', note: 'Approximate' }, [[39.885, -75.200], [39.887, -75.150], [39.905, -75.145], [39.906, -75.195]]),
  poly({ name: 'Mantua / Belmont OZ tracts', note: 'Approximate' }, [[39.960, -75.205], [39.960, -75.188], [39.973, -75.188], [39.973, -75.208]]),
  poly({ name: 'Eastwick OZ tracts', note: 'Approximate' }, [[39.880, -75.262], [39.886, -75.228], [39.904, -75.226], [39.900, -75.260]]),
]);

/* ------------------------------------------------------------------ QOF activity areas
 * There is no official "QOF area" geography: Qualified Opportunity Funds invest
 * INSIDE Opportunity Zones. This layer marks illustrative clusters of known
 * QOF-style investment activity so users can see where capital is flowing.
 * Production: build from your own deal database / Novogradac QOF listings.
 */
export const qofAreas = fc([
  poly({ name: 'Navy Yard QOF activity', note: 'Illustrative' }, [[39.888, -75.188], [39.889, -75.162], [39.900, -75.160], [39.900, -75.186]]),
  poly({ name: 'Kensington Ave corridor QOF activity', note: 'Illustrative' }, [[39.986, -75.132], [39.988, -75.118], [39.996, -75.115], [39.995, -75.130]]),
  poly({ name: 'North Broad QOF activity', note: 'Illustrative' }, [[39.975, -75.163], [39.975, -75.153], [39.988, -75.153], [39.988, -75.163]]),
]);

/* ------------------------------------------------------------------ Major development projects
 * Production: City Planning Commission development tracker, L&I permits (Carto), news feeds.
 */
export const developmentProjects = fc([
  pt({ name: 'Schuylkill Yards', type: 'Mixed-use / Life Science', detail: 'Multi-phase innovation district around 30th Street Station' }, [39.9575, -75.1855]),
  pt({ name: 'uCity Square', type: 'Life Science / Office', detail: 'Research & lab campus in University City' }, [39.9605, -75.1960]),
  pt({ name: 'Pennovation Works', type: 'Innovation Campus', detail: "Penn's business incubator & lab campus on the Schuylkill" }, [39.9395, -75.1985]),
  pt({ name: 'The Navy Yard', type: 'Master-planned District', detail: 'Office, industrial, life science and residential expansion' }, [39.8950, -75.1745]),
  pt({ name: 'Bellwether District', type: 'Industrial / Logistics', detail: 'Redevelopment of the former refinery site in SW Philadelphia' }, [39.9010, -75.2110]),
  pt({ name: "Park at Penn's Landing", type: 'Civic / Public Realm', detail: 'Park cap over I-95 reconnecting Old City to the waterfront' }, [39.9482, -75.1418]),
  pt({ name: 'Market East Redevelopment', type: 'Mixed-use', detail: 'Ongoing repositioning of the East Market corridor' }, [39.9518, -75.1555]),
]);

/* ------------------------------------------------------------------ University campuses
 * Production: OpenStreetMap (amenity=university) or each institution's GIS.
 */
export const universityCampuses = fc([
  poly({ name: 'University of Pennsylvania' }, [[39.9478, -75.2040], [39.9468, -75.1905], [39.9545, -75.1885], [39.9540, -75.1955], [39.9530, -75.2040]]),
  box({ name: 'Drexel University' }, 39.9530, -75.1925, 39.9600, -75.1830),
  box({ name: 'Temple University' }, 39.9770, -75.1610, 39.9855, -75.1490),
  box({ name: "Saint Joseph's University" }, 39.9915, -75.2440, 39.9975, -75.2350),
  box({ name: 'La Salle University' }, 40.0350, -75.1600, 40.0410, -75.1520),
  box({ name: 'Thomas Jefferson University (Center City)' }, 39.9475, -75.1600, 39.9515, -75.1550),
  box({ name: 'Jefferson East Falls Campus' }, 40.0150, -75.1965, 40.0215, -75.1885),
  box({ name: 'Community College of Philadelphia' }, 39.9605, -75.1665, 39.9640, -75.1610),
]);

/* ------------------------------------------------------------------ Neighborhoods / market areas
 * Simplified market-area outlines matching the app's market filter.
 * Production: OpenDataPhilly "Philadelphia Neighborhoods" (Azavea) GeoJSON,
 * dissolved into these market areas.
 */
export const neighborhoods = fc([
  poly({ name: 'Center City' }, [[39.9415, -75.1810], [39.9415, -75.1505], [39.9575, -75.1505], [39.9620, -75.1720], [39.9580, -75.1810]]),
  poly({ name: 'Old City' }, [[39.9470, -75.1505], [39.9470, -75.1405], [39.9575, -75.1395], [39.9575, -75.1505]]),
  poly({ name: 'Northern Liberties' }, [[39.9575, -75.1505], [39.9575, -75.1395], [39.9655, -75.1370], [39.9725, -75.1395], [39.9725, -75.1505]]),
  poly({ name: 'Fishtown' }, [[39.9655, -75.1370], [39.9620, -75.1280], [39.9700, -75.1200], [39.9800, -75.1240], [39.9790, -75.1360], [39.9725, -75.1395]]),
  poly({ name: 'Kensington' }, [[39.9790, -75.1360], [39.9800, -75.1240], [39.9950, -75.1150], [40.0010, -75.1300], [39.9930, -75.1430], [39.9790, -75.1430]]),
  poly({ name: 'Port Richmond' }, [[39.9700, -75.1200], [39.9740, -75.0950], [39.9930, -75.0850], [39.9950, -75.1150], [39.9800, -75.1240]]),
  poly({ name: 'University City' }, [[39.9440, -75.2120], [39.9440, -75.1830], [39.9620, -75.1800], [39.9640, -75.2120]]),
  poly({ name: 'South Philadelphia' }, [[39.8850, -75.2000], [39.8870, -75.1380], [39.9300, -75.1370], [39.9415, -75.1440], [39.9415, -75.1880], [39.9200, -75.2000]]),
  poly({ name: 'Manayunk / Roxborough' }, [[40.0170, -75.2350], [40.0200, -75.2120], [40.0450, -75.2080], [40.0600, -75.2250], [40.0450, -75.2420]]),
  poly({ name: 'Northeast Philadelphia' }, [[40.0300, -75.0900], [40.0300, -75.0100], [40.0700, -74.9700], [40.1350, -74.9600], [40.1380, -75.0300], [40.0800, -75.0900]]),
]);

export const OVERLAYS = [
  { id: 'neighborhoods', label: 'Neighborhood Boundaries', color: '#64748B', kind: 'boundary', data: neighborhoods },
  { id: 'septa', label: 'SEPTA Subway Lines', color: '#1F6FD1', kind: 'transit', data: septaLines, stations: septaStations },
  { id: 'rail', label: 'Regional Rail Stations', color: '#7C3AED', kind: 'points', data: regionalRailStations },
  { id: 'oz', label: 'Opportunity Zones', color: '#D97706', kind: 'fill', data: opportunityZones, approximate: true },
  { id: 'qof', label: 'QOF Activity Areas', color: '#DB2777', kind: 'fill', data: qofAreas, approximate: true },
  { id: 'dev', label: 'Major Development Projects', color: '#0F766E', kind: 'points', data: developmentProjects },
  { id: 'campus', label: 'University Campuses', color: '#2563EB', kind: 'fill', data: universityCampuses },
];
