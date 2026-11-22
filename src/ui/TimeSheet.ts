import type { TimeSystem } from '../core/TimeSystem';
import { DAY_S } from '../core/constants';
import { _, localeTag } from '../i18n';

const YEAR_S = DAY_S * 365.25;
const PLAY_ICON = 'M7 5v14l12-7z';
const PAUSE_ICON = 'M6 5h4v14H6zM14 5h4v14h-4z';

type Unit = 'min15' | 'hour' | 'hour6' | 'day' | 'day10' | 'month' | 'year' | 'decade' | 'century' | 'millennium';

/** a ruler zoom: labelled major ticks, unlabelled minor ones between them */
interface Scale { major: Unit; minor: Unit; pxPerSec: number }

/** nominal length of a major unit, for the ruler's pixels per second */
const NOMINAL_S: Partial<Record<Unit, number>> = {
  hour: 3600, day: DAY_S, month: YEAR_S / 12, year: YEAR_S, decade: YEAR_S * 10, century: YEAR_S * 100, millennium: YEAR_S * 1000,
};

/** the ruler zooms out as the clock runs faster, so a drag always covers a sensible span */
function scaleFor(rate: number): Scale {
  const s = (major: Unit, minor: Unit, px = 90): Scale => ({ major, minor, pxPerSec: px / NOMINAL_S[major]! });
  if (rate < 3600) return s('hour', 'min15');
  if (rate < DAY_S * 7) return s('day', 'hour6');
  if (rate < YEAR_S) return s('month', 'day10');
  if (rate < YEAR_S * 10) return s('year', 'month', 96);
  if (rate < YEAR_S * 100) return s('decade', 'year');
  if (rate < YEAR_S * 1000) return s('century', 'decade');
  return s('millennium', 'century');
}

/** a UTC date from parts (years 0–99 included, which Date.UTC would move to the 1900s) */
function utc(y: number, mo = 0, d = 1, h = 0, mi = 0): number {
  const t = new Date(0);
  t.setUTCFullYear(y, mo, d);
  t.setUTCHours(h, mi, 0, 0);
  return t.getTime();
}

/** the start of the unit that holds `ms` */
function floorTo(u: Unit, ms: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate(), h = d.getUTCHours();
  switch (u) {
    case 'min15': return utc(y, mo, day, h, Math.floor(d.getUTCMinutes() / 15) * 15);
    case 'hour': return utc(y, mo, day, h);
    case 'hour6': return utc(y, mo, day, Math.floor(h / 6) * 6);
    case 'day': return utc(y, mo, day);
    case 'day10': return utc(y, mo, day >= 21 ? 21 : day >= 11 ? 11 : 1);
    case 'month': return utc(y, mo);
    case 'year': return utc(y);
    case 'decade': return utc(Math.floor(y / 10) * 10);
    case 'century': return utc(Math.floor(y / 100) * 100);
    case 'millennium': return utc(Math.floor(y / 1000) * 1000);
  }
}

/** the start of the next unit after `ms` (which is the start of one) */
function nextOf(u: Unit, ms: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate();
  switch (u) {
    case 'min15': return ms + 900_000;
    case 'hour': return ms + 3_600_000;
    case 'hour6': return ms + 21_600_000;
    case 'day': return utc(y, mo, day + 1);
    case 'day10': return day >= 21 ? utc(y, mo + 1) : utc(y, mo, day + 10);
    case 'month': return utc(y, mo + 1);
    case 'year': return utc(y + 1);
    case 'decade': return utc(y + 10);
    case 'century': return utc(y + 100);
    case 'millennium': return utc(y + 1000);
  }
}

function yearText(y: number): string {
  return y <= 0 ? `${1 - y} BCE` : String(y);
}

function majorLabel(u: Unit, ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  switch (u) {
    case 'hour': return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
    case 'day': return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
    case 'month': {
      const m = d.toLocaleDateString(localeTag(), { month: 'short', timeZone: 'UTC' });
      return d.getUTCMonth() === 0 ? `${m} ${yearText(y)}` : m;
    }
    default: return yearText(y);
  }
}

/**
 * The phone time sheet: the date, a ruler dragged sideways to move through time, a few rates as
 * chips, and play / faster backwards / faster forwards / now.
 */
export class TimeSheet {
  readonly el = document.getElementById('sheet-time')!;
  private readonly ruler = document.getElementById('ts-ruler')!;
  private readonly canvas = document.getElementById('ts-canvas') as HTMLCanvasElement;
  private readonly ctx = this.canvas.getContext('2d')!;
  private readonly dayEl = document.getElementById('ts-day')!;
  private readonly ymdEl = document.getElementById('ts-ymd')!;
  private readonly clockEl = document.getElementById('ts-clock')!;
  private readonly playBtn = document.getElementById('ts-play') as HTMLButtonElement;
  private readonly playIcon = document.getElementById('ts-play-icon')!;
  private readonly picker = document.getElementById('ts-picker') as HTMLInputElement;
  private readonly rateBtns: Array<{ rate: number; el: HTMLButtonElement }> = [];
  private dateKey = '';
  private dragX: number | null = null;
  private resumeAfterDrag = false;

  constructor(private readonly time: TimeSystem, private readonly toast: (msg: string) => void) {
    const t = time;
    const rates: Array<[number, string]> = [[1, '1×'], [3600, _('1 h/s')], [DAY_S, _('1 day/s')], [DAY_S * 30, _('1 month/s')], [YEAR_S, _('1 year/s')]];
    const box = document.getElementById('ts-rates')!;
    for (const [rate, label] of rates) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ts-rate';
      b.setAttribute('role', 'radio');
      b.textContent = label;
      b.addEventListener('click', () => t.setRate(rate, t.dir < 0 ? -1 : 1));
      box.appendChild(b);
      this.rateBtns.push({ rate, el: b });
    }
    this.playBtn.addEventListener('click', () => t.togglePause());
    document.getElementById('ts-rev')!.addEventListener('click', () => t.reverseWarp());
    document.getElementById('ts-fwd')!.addEventListener('click', () => t.forwardWarp());
    document.getElementById('ts-now')!.addEventListener('click', () => { t.setNow(); this.toast(_('Back to real time')); });
    const pick = () => this.pickDate();
    document.getElementById('ts-cal')!.addEventListener('click', pick);
    document.getElementById('ts-date')!.addEventListener('click', pick);
    this.picker.addEventListener('change', () => {
      if (!this.picker.value) return;
      const d = new Date(this.picker.value + 'Z');
      if (Number.isFinite(d.getTime())) t.setDate(d);
    });
    this.bindRuler();
  }

  get visible(): boolean { return !this.el.hidden; }

  /** the date field: the system picker where there is one, a typed date otherwise (UTC either way) */
  private pickDate(): void {
    const t = this.time;
    const iso = t.date.toISOString().slice(0, 16);
    this.picker.value = iso;
    const p = this.picker as HTMLInputElement & { showPicker?: () => void };
    try {
      if (p.showPicker) { p.showPicker(); return; }
    } catch { /* not allowed here: fall back to typing */ }
    const v = window.prompt(_('Date/time (UTC, ISO 8601):'), iso);
    if (!v) return;
    const d = new Date(v.endsWith('Z') ? v : v + 'Z');
    if (Number.isFinite(d.getTime())) t.setDate(d);
    else this.toast(_('Invalid date'));
  }

  private bindRuler(): void {
    const r = this.ruler, t = this.time;
    r.addEventListener('pointerdown', (e) => {
      r.setPointerCapture(e.pointerId);
      this.dragX = e.clientX;
      // the clock holds still under the finger, and runs on again when it lets go
      this.resumeAfterDrag = !t.paused;
      if (!t.paused) t.togglePause();
    });
    r.addEventListener('pointermove', (e) => {
      if (this.dragX === null) return;
      const dx = e.clientX - this.dragX;
      this.dragX = e.clientX;
      // dragging the ruler left brings later times under the needle
      t.jump(-dx / scaleFor(t.rate).pxPerSec);
    });
    const end = () => {
      if (this.dragX === null) return;
      this.dragX = null;
      if (this.resumeAfterDrag && t.paused) t.togglePause();
    };
    r.addEventListener('pointerup', end);
    r.addEventListener('pointercancel', end);
    r.addEventListener('keydown', (e) => {
      const s = scaleFor(t.rate);
      const minorS = (nextOf(s.minor, floorTo(s.minor, t.date.getTime())) - floorTo(s.minor, t.date.getTime())) / 1000;
      const step = e.key === 'PageUp' || e.key === 'PageDown' ? NOMINAL_S[s.major]! : minorS;
      if (e.key === 'ArrowRight' || e.key === 'PageUp') t.jump(step);
      else if (e.key === 'ArrowLeft' || e.key === 'PageDown') t.jump(-step);
      else return;
      e.preventDefault();
    });
  }

  /** per frame while the sheet is open */
  update(): void {
    if (this.el.hidden) return;
    const t = this.time;
    const d = t.date;
    if (!Number.isFinite(d.getTime())) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (key !== this.dateKey) {
      this.dateKey = key;
      const y = d.getUTCFullYear();
      this.dayEl.textContent = d.toLocaleDateString(localeTag(), { weekday: 'long', timeZone: 'UTC' });
      this.ymdEl.textContent = y > 0
        ? d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        : `${d.getUTCDate()} ${d.toLocaleDateString(localeTag(), { month: 'short', timeZone: 'UTC' })} ${yearText(y)}`;
    }
    this.clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    const paused = t.paused;
    const icon = paused ? PLAY_ICON : PAUSE_ICON;
    if (this.playIcon.getAttribute('d') !== icon) {
      this.playIcon.setAttribute('d', icon);
      this.playBtn.setAttribute('aria-label', paused ? _('Play') : _('Pause'));
    }
    for (const b of this.rateBtns) {
      const on = !paused && Math.abs(Math.log(b.rate / t.rate)) < 0.01;
      b.el.setAttribute('aria-checked', String(on));
    }
    this.ruler.setAttribute('aria-valuetext', `${this.ymdEl.textContent} ${this.clockEl.textContent}`);
    this.draw(d.getTime());
  }

  private draw(nowMs: number): void {
    const c = this.canvas, ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const s = scaleFor(this.time.rate);
    const pxPerMs = s.pxPerSec / 1000;
    const half = w / 2 / pxPerMs;
    const end = nowMs + half;
    const css = getComputedStyle(this.ruler);
    const ink = css.getPropertyValue('--ts-ink').trim() || '#e6edf3';
    const dim = css.getPropertyValue('--ts-dim').trim() || '#8b949e';
    ctx.font = `600 11px ${css.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let n = 0;
    for (let ms = floorTo(s.minor, nowMs - half); ms <= end && n < 600; ms = nextOf(s.minor, ms), n++) {
      const x = w / 2 + (ms - nowMs) * pxPerMs;
      const major = floorTo(s.major, ms) === ms;
      ctx.fillStyle = major ? ink : dim;
      ctx.globalAlpha = major ? 0.9 : 0.55;
      ctx.fillRect(Math.round(x) - (major ? 1 : 0.5), 6, major ? 2 : 1, major ? 22 : 12);
      if (major) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = dim;
        ctx.fillText(majorLabel(s.major, ms), x, 34);
      }
    }
    ctx.globalAlpha = 1;
  }
}
