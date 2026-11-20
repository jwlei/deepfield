/// <reference types="vite/client" />

/** Build id injected by vite.config.ts (`define`) – used for cache-busting static data URLs. */
declare const __BUILD_ID__: string;

/** Decoded byte size of each file in public/data, keyed by file name (vite.config.ts `define`). */
declare const __DATA_SIZES__: Record<string, number>;
