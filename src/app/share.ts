import { currentLocale } from '../i18n';

/**
 * Shareable view links.
 *
 *   ?target=<bodyId>[&t=<ISO>][&cam=dx,dy,dz,r][&rate=…]      a view of a body (cam: unit direction
 *                                                            from the body in scene axes, r in radii)
 *
 *   ?open=<ref>                                              any object (see `open`)
 *
 * Links are built from `location.origin` so previews and staging deployments link to themselves.
 */

export interface LaunchParams {
  target: string | null;
  /** simulation clock (valid Date) */
  time: Date | null;
  /** simulation rate, s/s */
  rate: number | null;
  /** camera: unit direction from the target (scene axes) and distance in radii */
  cam: { dir: [number, number, number]; radii: number } | null;
  /**
   * any object of the universe: `star:c<index>`,
   * `planet:c<index>/<planet name>`, `landmark:<id>`, `bh:<id>`, `galaxy:<name>`, `find:<designation>`
   */
  open: string | null;
}

export function parseLaunch(search = location.search): LaunchParams {
  const q = new URLSearchParams(search);
  const safeId = (s: string | null) => (s && /^[a-z0-9-]{1,64}$/i.test(s) ? s : null);
  let time: Date | null = null;
  const t = q.get('t');
  if (t) {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) time = d;
  }
  let rate: number | null = null;
  const r = q.get('rate');
  if (r !== null) {
    const v = parseFloat(r);
    if (Number.isFinite(v) && v >= 0 && v <= 1e12) rate = v;
  }
  let cam: LaunchParams['cam'] = null;
  const c = q.get('cam');
  if (c) {
    const p = c.split(',').map(parseFloat);
    if (p.length === 4 && p.every(Number.isFinite) && p[3] > 1.001 && p[3] < 1e9) {
      const n = Math.hypot(p[0], p[1], p[2]);
      if (n > 1e-6) cam = { dir: [p[0] / n, p[1] / n, p[2] / n], radii: p[3] };
    }
  }
  return {
    target: safeId(q.get('target')),
    time, rate, cam,
    open: ((s) => (s && s.length <= 160 && /^(star|planet|landmark|bh|galaxy|find):[^<>"'`]+$/.test(s) ? s : null))(q.get('open')),
  };
}

export function viewUrl(targetId: string, time: Date, cam: { dir: [number, number, number]; radii: number } | null, rate: number): string {
  const u = new URL(location.origin);
  u.pathname = import.meta.env.BASE_URL;
  u.searchParams.set('target', targetId);
  u.searchParams.set('t', time.toISOString().replace(/\.\d{3}Z$/, 'Z'));
  if (cam) u.searchParams.set('cam', `${cam.dir.map((x) => x.toFixed(4)).join(',')},${cam.radii >= 100 ? Math.round(cam.radii) : cam.radii.toFixed(2)}`);
  if (rate !== 1) u.searchParams.set('rate', String(rate));
  const lang = currentLocale();
  if (lang !== 'en') u.searchParams.set('lang', lang);
  return u.toString();
}

/** Copy text to the clipboard; resolves false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
