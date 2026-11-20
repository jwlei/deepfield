import { readdirSync, statSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

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

/** Streamer-mode prototype: relays cockpit ↔ crew messages over the dev server's websocket. */
function expeditionRelay(): Plugin {
  return {
    name: 'expedition-relay',
    apply: 'serve',
    configureServer(server) {
      server.ws.on('xp:wire', (data: unknown) => server.ws.send('xp:wire', data));
      // the cockpit's QR code points phones at the LAN address when the server is exposed (--host)
      server.middlewares.use('/__xp/lan', (_req, res) => {
        const urls = (server.resolvedUrls?.network ?? []).map((u) => u.replace(/\/$/, ''));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ urls }));
      });
      // mirrors the nginx rule: /join and /join/CODE serve the crew page
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/join(\/[A-Za-z0-9]{0,8})?\/?(\?.*)?$/.test(req.url)) req.url = '/crew.html';
        next();
      });
    },
  };
}

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
  plugins: [expeditionRelay()],
  build: {
    target: 'es2022',
    // production: no source maps (smaller upload, no source disclosure)
    sourcemap: false,
    rollupOptions: {
      // streamer mode's crew page needs the upstream relay server: not built in this fork
      input: { main: 'index.html' },
    },
  },
  assetsInclude: ['**/*.glsl'],
});
