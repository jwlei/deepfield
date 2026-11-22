import { RATE_PRESETS, type TimeSystem } from '../core/TimeSystem';
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

/** what the info button and the progress bar show: the followed (or first) mission, and the camera */
export interface TimeStatus {
  mission: { progress: number; title: string; detail: string } | null;
  nav: string;
}

/**
 * The phone time sheet, kept compact: the date and time on one line with a Live button and an
 * info button, a ruler dragged sideways to move through time, the mission's progress, and
 * slower / play / faster, which step through the rate presets (backwards below real time).
 */
export class TimeSheet {
  readonly el = document.getElementById('sheet-time')!;
  private readonly ruler = document.getElementById('ts-ruler')!;
  private readonly canvas = document.getElementById('ts-canvas') as HTMLCanvasElement;
  private readonly ctx = this.canvas.getContext('2d')!;
  private readonly dateEl = document.getElementById('ts-date')!;
  private readonly liveBtn = document.getElementById('ts-live')!;
  private readonly infoBtn = document.getElementById('ts-info')!;
  private readonly detail = document.getElementById('ts-detail')!;
  private readonly missionBar = document.getElementById('ts-mission')!;
  private readonly missionFill = document.getElementById('ts-mission-fill')!;
  private readonly rateEl = document.getElementById('ts-rate')!;
  private readonly playBtn = document.getElementById('ts-play') as HTMLButtonElement;
  private readonly playIcon = document.getElementById('ts-play-icon')!;
  private readonly picker = document.getElementById('ts-picker') as HTMLInputElement;
  private dragX: number | null = null;
  private resumeAfterDrag = false;
  private textAt = -Infinity;

  constructor(private readonly time: TimeSystem, private readonly toast: (msg: string) => void, private readonly status: () => TimeStatus) {
    const t = time;
    this.playBtn.addEventListener('click', () => t.togglePause());
    document.getElementById('ts-slower')!.addEventListener('click', () => this.step(-1));
    document.getElementById('ts-faster')!.addEventListener('click', () => this.step(1));
    this.liveBtn.addEventListener('click', () => { t.setNow(); this.toast(_('Back to real time')); });
    this.infoBtn.addEventListener('click', () => {
      this.detail.hidden = !this.detail.hidden;
      this.infoBtn.setAttribute('aria-expanded', String(!this.detail.hidden));
      this.textAt = -Infinity;
    });
    this.dateEl.addEventListener('click', () => this.pickDate());
    this.picker.addEventListener('change', () => {
      if (!this.picker.value) return;
      const d = new Date(this.picker.value + 'Z');
      if (Number.isFinite(d.getTime())) t.setDate(d);
    });
    this.bindRuler();
  }

  get visible(): boolean { return !this.el.hidden; }

  /**
   * One step along the rate ladder, read as a signed line: … −1 day/s, −1 h/s, −1×, 1×, 1 h/s,
   * 1 day/s … — slower from real time runs the clock backwards. From a pause, either button
   * starts the clock at real time in its direction.
   */
  private step(delta: 1 | -1): void {
    const t = this.time;
    const n = RATE_PRESETS.length;
    let i = 0;
    for (let k = 1; k < n; k++) if (Math.abs(Math.log(RATE_PRESETS[k].rate / t.rate)) < Math.abs(Math.log(RATE_PRESETS[i].rate / t.rate))) i = k;
    let pos: number;
    if (t.paused) pos = delta;
    else {
      pos = (t.dir < 0 ? -1 : 1) * (i + 1) + delta;
      if (pos === 0) pos = delta;
    }
    pos = Math.max(-n, Math.min(n, pos));
    t.setRate(RATE_PRESETS[Math.abs(pos) - 1].rate, pos < 0 ? -1 : 1);
  }

  private rateText(): string {
    const t = this.time;
    if (t.paused) return _('Paused');
    const p = RATE_PRESETS.find((x) => Math.abs(Math.log(x.rate / t.rate)) < 0.01);
    if (!p) return t.rateLabel();
    return (t.dir < 0 ? '−' : '') + (p.rate === 1 ? '1×' : p.label());
  }

  /** the date: the system picker where there is one, a typed date otherwise (UTC either way) */
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
    const y = d.getUTCFullYear();
    const day = y > 0
      ? d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      : `${d.getUTCDate()} ${d.toLocaleDateString(localeTag(), { month: 'short', timeZone: 'UTC' })} ${yearText(y)}`;
    const when = `${day}  ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    if (this.dateEl.textContent !== when) this.dateEl.textContent = when;
    // live: real time, running forwards, within a minute of the wall clock
    const live = !t.paused && t.rate === 1 && t.dir > 0 && Math.abs(d.getTime() - Date.now()) < 60_000;
    this.liveBtn.classList.toggle('on', live);
    const icon = t.paused ? PLAY_ICON : PAUSE_ICON;
    if (this.playIcon.getAttribute('d') !== icon) {
      this.playIcon.setAttribute('d', icon);
      this.playBtn.setAttribute('aria-label', t.paused ? _('Play') : _('Pause'));
    }
    const rate = this.rateText();
    if (this.rateEl.textContent !== rate) this.rateEl.textContent = rate;
    // the mission's progress every frame, the info text a few times a second
    const st = this.status();
    const m = st.mission;
    this.missionBar.hidden = !m;
    if (m) {
      const pct = Math.max(0, Math.min(1, m.progress)) * 100;
      this.missionFill.style.width = `${pct}%`;
      this.missionBar.setAttribute('aria-valuenow', pct.toFixed(0));
      this.missionBar.setAttribute('aria-label', m.title);
    }
    const now = performance.now();
    if (!this.detail.hidden && now - this.textAt > 250) {
      this.textAt = now;
      this.detail.replaceChildren();
      const line = (text: string, cls: string) => this.detail.appendChild(Object.assign(document.createElement('div'), { className: cls, textContent: text }));
      if (m) { line(m.title, 'ts-d-title'); line(m.detail, 'ts-d-text'); }
      line(st.nav, 'ts-d-text');
    }
    this.ruler.setAttribute('aria-valuetext', when);
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
    ctx.font = `600 10.5px ${css.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let n = 0;
    for (let ms = floorTo(s.minor, nowMs - half); ms <= end && n < 600; ms = nextOf(s.minor, ms), n++) {
      const x = w / 2 + (ms - nowMs) * pxPerMs;
      const major = floorTo(s.major, ms) === ms;
      ctx.fillStyle = major ? ink : dim;
      ctx.globalAlpha = major ? 0.9 : 0.55;
      ctx.fillRect(Math.round(x) - (major ? 1 : 0.5), 4, major ? 2 : 1, major ? 16 : 9);
      if (major) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = dim;
        ctx.fillText(majorLabel(s.major, ms), x, 24);
      }
    }
    ctx.globalAlpha = 1;
  }
}
