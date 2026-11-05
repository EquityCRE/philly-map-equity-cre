import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * With VITE_MAPBOX_TOKEN set, the app bundles Mapbox GL JS.
 * Without it, `mapbox-gl` is aliased to `maplibre-gl` (open-source,
 * API-compatible) and free CARTO basemaps are used — no token required.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useMapbox = Boolean(env.VITE_MAPBOX_TOKEN);
  return {
    plugins: [react()],
    resolve: {
      alias: useMapbox
        ? []
        : [
            { find: /^mapbox-gl\/dist\/mapbox-gl\.css$/, replacement: 'maplibre-gl/dist/maplibre-gl.css' },
            { find: /^mapbox-gl$/, replacement: 'maplibre-gl' },
          ],
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks: {
            map: [useMapbox ? 'mapbox-gl' : 'maplibre-gl'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
