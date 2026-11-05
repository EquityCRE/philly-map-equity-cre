# PHL Commercial — Philadelphia CRE Map

An interactive commercial real estate map for Philadelphia: properties for sale and lease, clustered pins, a synced results list, filters, autocomplete search, Philadelphia overlays (SEPTA, Regional Rail, Opportunity Zones, campuses, major projects, neighborhoods), a market analytics dashboard, draw-to-search, favorites, side-by-side compare, PDF brochures, CSV/Excel export, dark mode and a full-screen map.

Built with **React 18 + Vite** and **Mapbox GL JS v3**. If no Mapbox token is configured, the build transparently swaps in **MapLibre GL** (the open-source, API-compatible fork) with free CARTO basemaps, so the app runs out of the box with no account.

> **Sample data.** The 61 bundled listings are fictional (names, brokers, prices, contacts) and placed on real Philadelphia corridors for realism. A banner says so in the UI. Overlay geometries for Opportunity Zones, QOF areas, campuses and neighborhood outlines are simplified approximations, labelled "approx." where it matters. See *Overlay data sources* below to swap in authoritative files.

---

## Quick start

```bash
npm install
cp .env.example .env          # optional: add VITE_MAPBOX_TOKEN=pk.xxx
npm run dev                   # http://localhost:5173
npm test                      # filter / search / stats / geometry tests
npm run build && npm run preview
```

Requires Node 18+ (20 LTS recommended).

| Variable | Purpose |
|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox public token (`pk.*`). Blank → MapLibre + CARTO basemaps. Restrict it to your domains in the Mapbox dashboard. |
| `VITE_DATA_SOURCE` | `sample` (bundled data) or `api` |
| `VITE_LISTINGS_API_URL` | Endpoint returning `{ asOf, listings: Property[] }` when `VITE_DATA_SOURCE=api` |

---

## Feature map

| Requirement | Where it lives |
|---|---|
| Pins colored Lease / Sale / Sale-Lease / Recently Added | `MapView.jsx` (`listing-points` layer, color from `utils/format.markerCategory`) |
| Clustering when zoomed out, click to expand | GeoJSON source `cluster: true`, `clusters` + `cluster-count` layers |
| Property popup (all 15 fields + brochure/save/compare) | `components/Map/PropertyPopup.jsx` rendered into a Mapbox `Popup` via React root |
| Filters: transaction, type, market, ZIP, price, rent, cap, SF, lot | `components/Filters/FilterPanel.jsx`, logic in `utils/filters.js` |
| Address / neighborhood / ZIP search + autocomplete | `components/Search/SearchBar.jsx`, `utils/search.js` (+ Mapbox Geocoding v6 when a token is present) |
| Synced results list, hover → map highlight, click → fly + popup | `components/Results/*`, `highlight` source in `MapView.jsx` |
| "Only show properties in map view" | `applySpatial` with viewport bounds from `moveend` |
| SEPTA L & B lines, Regional Rail, OZs, QOF areas, projects, campuses, neighborhoods | `data/overlays.js`, toggled in `Map/LayerPanel.jsx` |
| Analytics: for sale, for lease, avg rent, avg $/SF, available SF, new in 30 days + charts | `components/Analytics/AnalyticsPanel.jsx`, `utils/stats.js` |
| Heatmap | `listings-heatmap` layer (Layers → Listing heatmap) |
| Draw-on-map search | Draw button → click vertices → double-click / Finish (`MapView.jsx`, `utils/geo.pointInPolygon`) |
| Favorites | Heart on cards/popups, persisted to `localStorage`; "Saved" filter in header |
| Compare up to 4 side by side | `components/Compare/CompareDrawer.jsx` (best value per row highlighted) |
| PDF brochure | `utils/brochure.js` (jsPDF + autotable, lazy-loaded) |
| Export filtered results to CSV / Excel | `utils/exporters.js` (CSV with formula-injection guard; `.xlsx` via ExcelJS, lazy-loaded) |
| Dark mode | CSS tokens in `styles/app.css`, map style swaps light-v11 ↔ dark-v11 |
| Full-screen map | Header button: hides chrome + Fullscreen API |
| Responsive | ≥1280 full layout · ≤960 compact sidebar · ≤720 map-first with list sheet + floating toggle |

---

## Folder structure

```
philly-cre-map/
├── index.html
├── vite.config.js            # mapbox-gl ↔ maplibre-gl alias, chunking
├── .env.example
├── public/
│   ├── favicon.svg
│   └── data/sample-properties.json   # same dataset as JSON (for API mocks / imports)
├── scripts/test.mjs
├── tests/logic.test.js
└── src/
    ├── main.jsx
    ├── App.jsx                # state, derived data, layout
    ├── config.js              # tokens, styles, colors, enums
    ├── data/
    │   ├── properties.js      # 61 sample listings
    │   └── overlays.js        # SEPTA, rail, OZ, QOF, projects, campuses, neighborhoods
    ├── services/
    │   └── listingsService.js # single seam to sample data or your API + normalizer
    ├── hooks/useLocalStorage.js
    ├── utils/
    │   ├── filters.js  search.js  stats.js  geo.js  format.js
    │   ├── exporters.js       # CSV / XLSX
    │   └── brochure.js        # PDF
    ├── components/
    │   ├── Layout/Header.jsx
    │   ├── Search/SearchBar.jsx
    │   ├── Filters/FilterPanel.jsx, RangeInput.jsx
    │   ├── Results/ResultsList.jsx, PropertyCard.jsx
    │   ├── Map/MapView.jsx, PropertyPopup.jsx, LayerPanel.jsx, MapLegend.jsx
    │   ├── Analytics/AnalyticsPanel.jsx
    │   ├── Compare/CompareDrawer.jsx
    │   └── common/PropertyImage.jsx, StatusBadge.jsx
    └── styles/app.css
```

### Component tree

```
App
├── Header ─ SearchBar
├── Sidebar
│   ├── Tabs (Listings | Analytics) + Filters button + active chips
│   ├── ResultsList ─ PropertyCard × n
│   ├── AnalyticsPanel (KPIs + 4 charts)
│   └── FilterPanel (overlay) ─ RangeInput × 5
├── MapArea
│   ├── MapView ─ PropertyPopup (portal into map popup) + draw toolbar
│   ├── LayerPanel
│   └── MapLegend
├── CompareDrawer
└── Toast
```

### Data flow

```
listings ──applyFilters(filters, favorites)──► attrFiltered
attrFiltered ──applySpatial(drawn polygon)──► mapListings   → map pins, clusters, heatmap
mapListings ──applySpatial(viewport, if "in view")──► results → list, analytics, exports
```

---

## Data model

```jsonc
{
  "id": 11,
  "propertyName": "Liberty Lofts",
  "address": "123 Market St, Philadelphia, PA 19106",
  "street": "123 Market St",
  "zip": "19106",
  "neighborhood": "Old City",
  "propertyType": "Mixed Use",          // one of config.PROPERTY_TYPES
  "status": "Lease",                    // "Lease" | "Sale" | "Sale / Lease"
  "salePrice": null,                    // USD
  "leaseRate": 32.5,                    // USD / SF / year
  "leaseType": "Modified Gross",        // NNN | Full Service | Modified Gross
  "capRate": null,                      // %
  "buildingSF": 45000,
  "availableSF": 8500,
  "lotSizeAcres": 0.42,
  "yearBuilt": 1912,
  "zoning": "CMX-4",
  "listedDate": "2026-10-28",           // drives "Recently Added" (≤ 14 days) and 30-day stats
  "latitude": 39.9497,
  "longitude": -75.1438,
  "broker": "John Smith",
  "company": "Example Commercial",
  "phone": "(215) 555-0100",
  "email": "john@example.com",
  "listingUrl": "https://…",
  "image": "https://…/photo.jpg",       // optional; branded fallback by type when null
  "highlights": ["Walk to SEPTA", "Corner visibility"]
}
```

"Recently Added" is computed relative to the dataset's `asOf` date (from the API, or `DATA_AS_OF` for sample data) so the demo stays meaningful; with a live feed, return today's date.

---

## Mapbox implementation notes

- **One code path, two engines.** Code imports `mapbox-gl`. `vite.config.js` aliases it to `maplibre-gl` only when `VITE_MAPBOX_TOKEN` is empty. The one API difference used here (`getClusterExpansionZoom` callback vs. Promise) is wrapped in `clusterZoom()`.
- **GPU layers, not DOM markers.** Pins are a `circle` layer on a clustered GeoJSON source, so thousands of listings stay smooth. Hover/selection use a separate tiny `highlight` source instead of re-rendering everything.
- **Style switches** (dark mode, satellite) call `setStyle` and re-add all sources/layers on `style.load`.
- **Glyphs.** Cluster counts and neighborhood labels use `LABEL_FONT` from `config.js`; if you use a custom Mapbox Studio style, set it to a font that style serves.
- **Popups** render a React component into the map popup's DOM node, so it shares the app's styling and actions.
- **Mapbox billing** is per map load on the web. Keep the token URL-restricted.

---

## Deployment

The build is a static site (`dist/`). Set environment variables in your host *before* building (Vite inlines them).

**Vercel**
```bash
npm i -g vercel
vercel                      # framework: Vite, build: npm run build, output: dist
vercel env add VITE_MAPBOX_TOKEN
vercel --prod
```

**Netlify** — Build command `npm run build`, publish directory `dist`, add `VITE_MAPBOX_TOKEN` under Site settings → Environment.

**AWS S3 + CloudFront**
```bash
npm run build
aws s3 sync dist/ s3://your-bucket --delete
aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
```

**Docker / Nginx**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

**Production checklist**
- Restrict the Mapbox token to your domains; never ship a secret (`sk.*`) token.
- Add a Content-Security-Policy that allows `api.mapbox.com`, `events.mapbox.com`, `*.tiles.mapbox.com` (or `basemaps.cartocdn.com` for the MapLibre fallback) and `blob:` workers.
- Switch `VITE_DATA_SOURCE=api` and serve listings from your backend (below).
- Replace approximate overlays with official files (below).
- Add analytics/monitoring (e.g. Sentry) and an error boundary around `MapView` if desired.

---

## Connecting live data feeds

**Architecture.** Never call data vendors from the browser. Run a backend ingestion job (cron, every 1–24h) that pulls each source, normalizes records to the Property shape (`normalizeListing()` in `services/listingsService.js` shows the mapping), de-duplicates across sources (normalized address + parcel ID), geocodes anything missing coordinates, stores it in Postgres/PostGIS, and serves one endpoint (`GET /api/listings`, optionally with bbox and filter params). Point `VITE_LISTINGS_API_URL` at it.

| Source | Realistic access path (as of late 2026) | What it gives you |
|---|---|---|
| **CREXi** | CREXi's official Listing API is a one-way feed for *pushing* listings onto CREXi, available to MLSs, large brokerages and data providers by agreement (integrations@crexi.com). There is no sanctioned public API for *pulling* other brokers' listings. | Syndicate **your own** listings out. To display CREXi inventory, pursue a data partnership; don't scrape (their terms prohibit it). |
| **LoopNet / CoStar** | No public API. The only sanctioned integration is LoopLink, an embeddable widget for a broker's own listings. CoStar data licensing is enterprise-contract only, and CoStar actively litigates scraping. | Embed your LoopLink inventory, or license CoStar data under contract. |
| **CommercialEdge (Yardi)** | Free listing management with syndication across its network (CommercialCafe, CommercialSearch, PropertyShark, Point2); integrations exist via marketing platforms such as Buildout and SharpLaunch. Contact CommercialEdge for data/API terms. | Syndication outlet for your listings; research data under agreement. |
| **Reonomy** | Documented REST API (enterprise customers): resolve address → property ID, `GET /property/{id}`, `POST /property/bulk` (up to 250 IDs), plus scheduled bulk feeds (CSV/NDJSON to S3/Azure/SFTP). Rate-limited; credit-based. | Ownership, sales, debt, tax and tenant enrichment for each listing. |
| **PropertyShark** | Part of Yardi's network; no public developer API. Access via subscription/export or a Yardi data agreement. | Ownership and comps research. |
| **Philadelphia Open Data** | Free, no key. Carto SQL API at `https://phl.carto.com/api/v2/sql?q=…`. OPA properties (`opa_properties_public`, updated nightly), DOR parcels, L&I permits, zoning. | Parcel geometry, assessed value, year built, lot size, zoning, owner, last sale; permits as development signals. |

**Recommended stack for a brokerage:** your own listings (from your CRM/Buildout/SharpLaunch) → enriched by **OPA + DOR parcels** (free) → optionally enriched by **Reonomy** (ownership/debt) → syndicated outward to CREXi/LoopNet/CommercialEdge.

Example: enrich a listing from OPA (server-side):
```js
const sql = `SELECT parcel_number, location, zip_code, year_built, total_area, total_livable_area,
             zoning, market_value, sale_date, sale_price, owner_1,
             ST_Y(the_geom) AS lat, ST_X(the_geom) AS lng
             FROM opa_properties_public
             WHERE location ILIKE '${street.toUpperCase().replace(/'/g, "''")}%' LIMIT 5`;
const r = await fetch(`https://phl.carto.com/api/v2/sql?q=${encodeURIComponent(sql)}`);
const { rows } = await r.json();
```
(Use parameter sanitization in production; Carto does not support bind parameters.)

---

## Overlay data sources (replace the approximations)

| Layer | Authoritative source |
|---|---|
| SEPTA Metro lines & stations | SEPTA GTFS (`google_bus.zip` / `google_rail.zip`) or SEPTA's open data portal |
| Regional Rail stations | SEPTA GTFS rail feed |
| Opportunity Zones | U.S. CDFI Fund designated OZ census tracts (filter county FIPS 42101) |
| QOF activity areas | No official geography — QOFs invest inside OZs. Build from your deal database or published QOF investments. |
| Major development projects | Philadelphia City Planning Commission data, L&I permits (Carto), your own pipeline tracker |
| University campuses | OpenStreetMap `amenity=university` polygons |
| Neighborhood boundaries | OpenDataPhilly "Philadelphia Neighborhoods" GeoJSON (dissolve into the market areas used by filters) |

Each overlay in `src/data/overlays.js` is plain GeoJSON; replace the export with an imported file or a `fetch` and nothing else changes. If you replace neighborhoods, keep the `name` values aligned with `MARKETS` in `config.js` (the search "jump to neighborhood" uses them).

---

## Customizing

- **Branding:** colors are CSS variables at the top of `styles/app.css`; logo/name in `Layout/Header.jsx`.
- **Pin colors / labels:** `STATUS_COLORS`, `STATUS_LABELS` in `config.js`.
- **Recently-added window:** `RECENT_DAYS` in `config.js`.
- **Markets / property types:** `MARKETS`, `PROPERTY_TYPES` in `config.js`.
