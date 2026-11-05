// Bundles tests with esbuild (ships with Vite) so they can import Vite-style modules, then runs node:test.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({
  entryPoints: ['tests/logic.test.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'node_modules/.cache/tests/logic.test.mjs',
  define: {
    'import.meta.env.VITE_MAPBOX_TOKEN': '""',
    'import.meta.env.VITE_DATA_SOURCE': '"sample"',
    'import.meta.env.VITE_LISTINGS_API_URL': '""',
  },
  logLevel: 'warning',
});
const r = spawnSync(process.execPath, ['--test', 'node_modules/.cache/tests/logic.test.mjs'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
