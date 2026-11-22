import { readdirSync, statSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * Decoded size of every file in public/data, for the loader's percentage: the server may gzip a
 * file, so its Content-Length is not the number of bytes the page reads.
 */
const DATA_SIZES = Object.fromEntries(
  readdirSync('public/data').filter((f) => statSync(`public/data/${f}`).isFile()).map((f) => [f, statSync(`public/data/${f}`).size]),
);

/**
 * Build id stamped into asset URLs that are not content-hashed by Vite (/data, /models).
 * Lets nginx/Cloudflare serve them with a one-year immutable cache while a new deploy
 * still busts the cache.
 */
const BUILD_ID = process.env.BUILD_ID ?? Date.now().toString(36);

export default defineConfig({
  // served from GitHub Pages under /deepfield/ (BASE=/ for a root deployment)
  base: process.env.BASE ?? '/deepfield/',
  server: {
    port: 5173,
    open: false,
  },
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __DATA_SIZES__: JSON.stringify(DATA_SIZES),
  },
  build: {
    target: 'es2022',
    // production: no source maps (smaller upload, no source disclosure)
    sourcemap: false,
    rollupOptions: {
      input: { main: 'index.html' },
    },
  },
  assetsInclude: ['**/*.glsl'],
});
