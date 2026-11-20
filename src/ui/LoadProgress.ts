/**
 * The loading screen's percentage. Downloads of the start-up data (`<base>data/…`) fill the first
 * DOWNLOAD_SHARE of the bar byte by byte; after them the start's later steps (building the
 * universe, warming up the first scene) move it on in fixed steps. The number never goes back.
 *
 * Sizes come from the build (`__DATA_SIZES__`): the server may gzip a file, so the Content-Length
 * header is not the number of bytes the page reads.
 */

/** share of the bar (0…100) that the data downloads fill */
const DOWNLOAD_SHARE = 85;

interface Download { loaded: number; total: number }

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

export class LoadProgress {
  private readonly downloads: Download[] = [];
  private floor = 0;
  private shown = -1;
  private restoreFetch: (() => void) | null = null;
  private readonly fill: HTMLElement | null;
  private readonly label: HTMLElement | null;

  constructor(fill: HTMLElement | null, label: HTMLElement | null) {
    this.fill = fill;
    this.label = label;
    this.render();
  }

  /** Count the bytes of every download from `<base>data/` until `stopTracking()`. */
  trackDownloads(base: string): void {
    if (this.restoreFetch) return;
    const original = window.fetch;
    const call = original.bind(window);
    const prefix = `${base}data/`;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let size: number | undefined;
      try {
        const path = new URL(urlOf(input), location.href).pathname;
        if (path.startsWith(prefix)) size = __DATA_SIZES__[decodeURIComponent(path.slice(prefix.length))];
      } catch { /* not a URL we count */ }
      if (!size) return call(input, init);
      const d: Download = { loaded: 0, total: size };
      this.downloads.push(d);
      this.render();
      const finish = () => { d.loaded = d.total; this.render(); };
      return call(input, init).then((res) => {
        if (!res.body || !res.ok) { finish(); return res; }
        const counter = new TransformStream<Uint8Array, Uint8Array>({
          transform: (chunk, out) => {
            d.loaded = Math.min(d.total, d.loaded + chunk.byteLength);
            this.render();
            out.enqueue(chunk);
          },
          flush: finish,
        });
        return new Response(res.body.pipeThrough(counter), { status: res.status, statusText: res.statusText, headers: res.headers });
      }, (err: unknown) => { finish(); throw err; });
    };
    this.restoreFetch = () => { window.fetch = original; };
  }

  /** Stop counting downloads: later fetches (the star tiers, imagery) go straight through. */
  stopTracking(): void {
    this.restoreFetch?.();
    this.restoreFetch = null;
  }

  /** The start has reached a later step: show at least `pct` (0…100). */
  step(pct: number): void {
    this.floor = Math.max(this.floor, Math.min(100, pct));
    this.render();
  }

  done(): void {
    this.stopTracking();
    this.step(100);
  }

  private render(): void {
    let total = 0;
    let loaded = 0;
    for (const d of this.downloads) { total += d.total; loaded += d.loaded; }
    const fromDownloads = total > 0 ? (loaded / total) * DOWNLOAD_SHARE : 0;
    const pct = Math.floor(Math.max(this.floor, fromDownloads, this.shown));
    if (pct === this.shown) return;
    this.shown = pct;
    if (this.fill) this.fill.style.transform = `scaleX(${pct / 100})`;
    if (this.label) this.label.textContent = `${pct}%`;
  }
}
