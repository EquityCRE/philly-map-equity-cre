/**
 * Central app configuration.
 *
 * Map provider:
 *  - If VITE_MAPBOX_TOKEN is set, the app runs on Mapbox GL JS with Mapbox styles.
 *  - If it is NOT set, vite.config.js aliases `mapbox-gl` -> `maplibre-gl`
 *    (the open-source, API-compatible fork) and the app uses free CARTO
 *    basemaps. Same code path, zero token needed for local demos.
 */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const USE_MAPBOX = Boolean(MAPBOX_TOKEN);

export const MAP_STYLES = USE_MAPBOX
  ? {
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    }
  : {
      light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    };

/** Font stack for cluster count labels — must exist in the basemap's glyphs. */
export const LABEL_FONT = USE_MAPBOX ? ['DIN Pro Medium', 'Arial Unicode MS Bold'] : ['Open Sans Bold'];

export const PHILLY_CENTER = [-75.1652, 39.9726];
export const PHILLY_BOUNDS = [[-75.2803, 39.8670], [-74.9558, 40.1379]];
export const DEFAULT_ZOOM = 11.2;

/** Listings newer than this many days render as "Recently Added" (red). */
export const RECENT_DAYS = 14;

/** Where listings come from: 'sample' | 'api'. See src/services/listingsService.js */
export const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || 'sample';
export const LISTINGS_API_URL = import.meta.env.VITE_LISTINGS_API_URL || '/api/listings';

export const STATUS_COLORS = {
  Lease: '#16A34A',
  Sale: '#2563EB',
  'Sale / Lease': '#7C3AED',
  New: '#DC2626',
};

export const STATUS_LABELS = {
  Lease: 'For Lease',
  Sale: 'For Sale',
  'Sale / Lease': 'Sale / Lease',
  New: 'Recently Added',
};

export const TRANSACTION_TYPES = ['Lease', 'Sale', 'Sale / Lease'];

export const PROPERTY_TYPES = [
  'Multifamily', 'Office', 'Retail', 'Industrial', 'Land',
  'Mixed Use', 'Medical Office', 'Flex Space', 'Hospitality',
];

export const MARKETS = [
  'Fishtown', 'Northern Liberties', 'Center City', 'Old City', 'University City',
  'South Philadelphia', 'Northeast Philadelphia', 'Kensington', 'Port Richmond',
  'Manayunk / Roxborough',
];

export const MAX_COMPARE = 4;
