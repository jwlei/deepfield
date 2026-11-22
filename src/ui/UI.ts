import type { CelestialBody } from '../core/CelestialBody';
import { MissionPanel, type MissionPanelHost } from './MissionPanel';
import { SystemStrip } from './SystemStrip';
import { TimeSheet } from './TimeSheet';
import type { SmallBodyCatalog } from '../data/SmallBodies';
import { copyText, viewUrl } from '../app/share';
import { ScopeCard, scopeTargetFor } from './ScopeCard';
import { phaseLabel } from '../astro/mission';
import { binaryPartner } from '../astro/binary';
import { _, fixed, fmtNum, LOCALES, currentLocale, localeTag, setLocale, type Locale } from '../i18n';
import { RATE_PRESETS, type TimeSystem } from '../core/TimeSystem';
import type { Universe } from '../core/Universe';
import type { CameraController } from '../camera/CameraController';
import type { StarPoints } from '../render/StarPoints';
import type { GalaxySprites } from '../render/GalaxySprites';
import type { LandmarkSprites } from '../render/LandmarkSprites';
import { LANDMARK_KIND_LABEL } from '../data/landmarks';
import { HYDROGEN_BURNING_LIMIT } from '../data/BrownDwarfs';
import { colouredDwarf } from '../data/colouredDwarfs';
import { AU_KM, LIGHT_YEAR_KM, PARSEC_KM, RAD } from '../core/constants';
import { LUM_CLASS_DESC, SUN_MASS_KG } from '../astro/stellar';
import { GALAXY_TYPE_LABEL } from '../galaxy/GalaxyModel';
import { farKey, type FarRef } from '../galaxy/FarClusters';
import { TYPE_BY_CODE } from '../galaxy/galaxies';
import { catalogIndexOf, type StarId } from '../core/Universe';
import { GRAPHICS_PRESET_ORDER, GRAPHICS_PRESETS, matchPreset, type GraphicsPreset, type Settings } from './Settings';
import {
  fmtDeg, fmtDistance, fmtSolarMass, fmtDuration, fmtLightYears, fmtMass, fmtRadius, fmtScaleDistance, fmtSci, fmtSpeed, fmtTemp, TYPE_LABELS, typeLabel,
} from './format';
import { PLACES } from './places';
import { exoBodyId } from '../gen/RealSystem';
import { Vector3 } from 'three';
import { fmtGalactic, fmtRaDec, parseSkyQuery, sceneToGalactic, sceneToRaDec } from './coords';

/** the phone tab bar: Explore is the scene itself, the others open a sheet over it */
type Tab = 'explore' | 'search' | 'time' | 'missions' | 'more';

/** search result filters (phones); 'any' rows (coordinates, ids) show under every filter */
type SearchCat = 'all' | 'bodies' | 'stars' | 'galaxies' | 'nebulae' | 'blackholes';
const SEARCH_CATS: Array<[SearchCat, string]> = [
  ['all', 'All'], ['bodies', 'Planets and moons'], ['stars', 'Stars'], ['galaxies', 'Galaxies'], ['nebulae', 'Nebulae and clusters'], ['blackholes', 'Black holes'],
];
/** which filter each places group belongs to */
const PLACE_GROUP_CAT: Record<string, SearchCat> = {
  'Spacecraft': 'bodies', 'Black holes': 'blackholes', 'Pulsars': 'stars', 'Nebulae, clusters and record stars': 'nebulae',
  'Planets and moons': 'bodies', 'Exoplanets': 'bodies', 'Stars': 'stars', 'Galaxies': 'galaxies', 'Peculiar galaxies': 'galaxies',
};
const RECENT_KEY = 'deepfield.recent.v1';

function catOfType(t: string): SearchCat {
  if (t === 'star' || t === 'pulsar') return 'stars';
  if (t === 'blackhole') return 'blackholes';
  return 'bodies';
}

/** body types that act as the light source / primary of a system */
function isPrimaryType(t: string): boolean {
  return t === 'star' || t === 'pulsar' || t === 'blackhole' || t === 'barycenter';
}

export interface DiscoveryEntry {
  id: string;
  name: string;
  /** kind label (source string) */
  kind: string;
  /** discovery time (ms since epoch) */
  t: number;
}

export interface UIHost extends MissionPanelHost {
  universe: Universe;
  time: TimeSystem;
  camera: CameraController;
  settings: Settings;
  /** size of the frame actually rendered, in pixels (after the resolution scale and the automatic drop) */
  renderSize(): [number, number];
  starPoints: StarPoints;
  galaxySprites: GalaxySprites;
  landmarkSprites: LandmarkSprites;
  readonly selected: CelestialBody | null;
  /** selected star (universal id) when no body is selected */
  readonly selectedStar: StarId | null;
  /** selected galaxy (index) when nothing else is selected */
  readonly selectedGalaxy: number | null;
  /** selected deep-sky landmark (index) when nothing else is selected */
  readonly selectedLandmark: number | null;
  /** selected far-universe knot / member galaxy when nothing else is selected */
  readonly selectedFar: FarRef | null;
  goToFar(ref: FarRef): void;
  centerFar(ref: FarRef): void;
  farInfo(ref: FarRef): { name: string; kind: string; distKm: number; distSunPc: number; radiusPc: number; absMag: number; luminosity: number; massSolar: number; richness: number; typeCode: number | null; resolved: boolean; apparentMag: number; coreMassSolar: number };
  /** far-universe clusters / member galaxies by id (`f…`) or name code (`YE-…`) */
  findFar(query: string, limit?: number): FarRef[];
  farPositionPc(ref: FarRef, out?: Vector3): Vector3;
  select(b: CelestialBody | null): void;
  selectStar(id: StarId | null): void;
  selectGalaxy(i: number | null): void;
  selectLandmark(i: number | null): void;
  goToLandmark(i: number): void;
  centerLandmark(i: number): void;
  goTo(b: CelestialBody): void;
  goToStar(id: StarId): void;
  goToGalaxy(i: number): void;
  center(b: CelestialBody): void;
  centerStar(id: StarId): void;
  centerGalaxy(i: number): void;
  /** apparent magnitude of a star from the camera (null if not currently generated) */
  starApparentMag(id: StarId): number | null;
  toggleFollow(): void;
  /** landing: solid worlds the visitor can stand on, descend to the selection, climb back up */
  canLand(b: CelestialBody | null): boolean;
  land(b?: CelestialBody | null): void;
  takeOff(): void;
  readonly landedOn: CelestialBody | null;
  surfaceStatus(): { place: string; clock: string } | null;
  /** fly to a Solar-System body by id (switching back to the Solar System frame if needed) */
  goToBodyId(id: string): void;
  /** fly to a body of any system (switching the reference frame to that system first) */
  goToSystemBody(starId: StarId, bodyId: string): void;
  /** real asteroids and comets (JPL SBDB), once loaded */
  readonly smallBodies: SmallBodyCatalog | null;
  goToSmallBody(k: number): void;
  /** fly to a black hole by universal id (`b0`, `cygx1`, …), switching frames if needed */
  goToBlackHole(id: string): void;
  centerBlackHole(id: string): void;
  /** turn the camera toward a sky direction (scene frame, unit) */
  lookToward(dir: Vector3): void;
  /** fly to a point given in parsecs from the Sun (scene frame) */
  goToSkyPoint(positionPc: Vector3, label: string): void;
  /** free roam: pointer-locked mouse look + WASD flight */
  toggleFreeRoam(): void;
  /** the Solar System catalogue has this body */
  hasBody(id: string): boolean;
  /** camera direction from the selected body (scene axes, unit) and distance in radii, for share links */
  viewOf(b: CelestialBody): { dir: [number, number, number]; radii: number };
  readonly freeRoam: boolean;
  /** the visitor's discoveries (generated objects approached, asteroids found), newest first */
  discoveryLog(): DiscoveryEntry[];
  /** nearest generated object not discovered yet */
  nextDiscovery(): { name: string; distKm: number } | null;
  goToDiscovery(id: string): void;
  /** @param byUser  changed in the settings panel (the visitor's choice wins over the startup probe) */
  applySettings(byUser?: boolean): void;
  screenshot(): void;
  toggleUI(): void;
  /** stars shown in extreme ultraviolet (SDO/AIA 304 Å) */
  readonly euv: boolean;
  toggleEUV(): void;
}

/** RA/Dec, galactic l/b and (for generated objects) the id to search for, of a position in parsecs from the Sun */
function coordRows(posPc: Vector3, id: string | null): Array<[string, string]> {
  if (posPc.lengthSq() === 0) return [];
  const [ra, dec] = sceneToRaDec(posPc), [l, b] = sceneToGalactic(posPc);
  const rows: Array<[string, string]> = [['Coordinates (J2000)', fmtRaDec(ra, dec)], ['Galactic coordinates', fmtGalactic(l, b)]];
  if (id) rows.push(['ID (searchable)', id]);
  return rows;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

interface SettingDef {
  key: keyof Settings;
  label: string;
  kind: 'bool' | 'range';
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  /** readout beside a range slider (default: the raw value) */
  format?: (v: number, host: UIHost) => string;
}

const SETTING_DEFS: SettingDef[] = [
  { key: 'cleanView', label: 'Clean view: hide all markers and names (N)', kind: 'bool', group: 'Display' },
  { key: 'autoHideUI', label: 'Hide the controls while you look around (tap the scene to show them)', kind: 'bool' },
  { key: 'orbits', label: 'Orbits', kind: 'bool' },
  { key: 'moonOrbits', label: 'Moon orbits', kind: 'bool' },
  { key: 'labels', label: 'Labels', kind: 'bool' },
  { key: 'markers', label: 'Markers', kind: 'bool' },
  { key: 'sunMarker', label: 'Sun marker and compass', kind: 'bool' },
  { key: 'starNames', label: 'Star names', kind: 'bool' },
  { key: 'galaxyNames', label: 'Galaxy names', kind: 'bool' },
  { key: 'distances', label: 'Distances in labels', kind: 'bool' },
  { key: 'eclipticGrid', label: 'Ecliptic grid', kind: 'bool' },
  { key: 'equatorialGrid', label: 'Equatorial grid', kind: 'bool' },
  { key: 'dwarfs', label: 'Dwarf planets', kind: 'bool' },
  { key: 'minorBodies', label: 'Asteroids and comets', kind: 'bool' },
  { key: 'spacecraft', label: 'Human-made objects (spacecraft)', kind: 'bool' },
  { key: 'belts', label: 'Asteroid / Kuiper belt', kind: 'bool' },
  { key: 'deepCatalog', label: 'Deep star catalogue (Gaia + Tycho-2, ~2.8 million stars; ~60 MB download)', kind: 'bool' },
  { key: 'milkyWay', label: 'Galactic star clouds', kind: 'bool' },
  { key: 'volumetrics', label: 'Volumetric galaxies and nebulae (dust, glowing gas)', kind: 'bool' },
  { key: 'galaxies', label: 'Distant galaxies', kind: 'bool' },
  { key: 'procedural', label: 'Procedural objects (generated stars, galaxies, cosmic web)', kind: 'bool' },
  { key: 'proceduralNames', label: 'Procedural star names (YE …)', kind: 'bool' },
  { key: 'highlightProcedural', label: 'Tint procedural objects green', kind: 'bool' },
  { key: 'atmospheres', label: 'Atmospheres', kind: 'bool', group: 'Render' },
  { key: 'clouds', label: 'Clouds', kind: 'bool' },
  { key: 'rings', label: 'Rings', kind: 'bool' },
  { key: 'ringParticles', label: 'Ring particles', kind: 'bool' },
  { key: 'shadows', label: 'Eclipse / ring shadows', kind: 'bool' },
  { key: 'nightLight', label: 'Night-side fill light (when close)', kind: 'range', min: 0, max: 1, step: 0.05 },
  { key: 'lensFlare', label: 'Star glare (lens flare)', kind: 'bool' },
  { key: 'starTrails', label: 'Star trails (stars stretch into streaks at high speed)', kind: 'bool' },
  { key: 'objectSize', label: 'Object size (draw stars, planets and asteroids larger)', kind: 'range', min: 1, max: 10, step: 0.1, format: (v) => `${fixed(v, 1)}×` },
  { key: 'lightShafts', label: 'Light shafts (sun rays in an atmosphere)', kind: 'bool' },
  { key: 'imagery', label: 'Satellite imagery (NASA)', kind: 'bool' },
  { key: 'bloom', label: 'Bloom (glow)', kind: 'bool' },
  { key: 'autoExposure', label: 'Eye adaptation (auto exposure under a bright sky)', kind: 'bool' },
  { key: 'exposure', label: 'Exposure', kind: 'range', min: 0.3, max: 2.5, step: 0.05 },
  { key: 'renderScale', label: 'Render resolution', kind: 'range', min: 0.25, max: 1, step: 0.05, format: (_v, h) => h.renderSize().join('×') },
  { key: 'autoResolution', label: 'Automatic resolution (lower when stuttering)', kind: 'bool' },
  { key: 'fov', label: 'Field of view', kind: 'range', min: 20, max: 110, step: 1, group: 'Camera' },
  { key: 'mouseSensitivity', label: 'Mouse sensitivity', kind: 'range', min: 0.2, max: 3, step: 0.1 },
  { key: 'invertY', label: 'Invert Y axis', kind: 'bool' },
];

/** setting groups shown under the "Advanced" fold */
const ADVANCED_GROUPS = new Set(['Render', 'Camera']);

/** Info-grid rows → HTML; labels and plain-text values are run through the dictionary */
function rowsHtml(rows: Array<[string, string] | 'sep'>): string {
  return rows
    .map((r) => (r === 'sep' ? '<div class="sep"></div>' : `<dt>${_(r[0])}</dt><dd>${_(r[1])}</dd>`))
    .join('');
}

/** A time-warp multiplier as a short figure: 60, 3.6k, 86k, 31.6M … */
function fmtRateMult(r: number): string {
  if (r < 1e3) return `${Math.round(r)}`;
  if (r < 1e6) return `${(r / 1e3).toPrecision(r < 1e4 ? 2 : 3).replace(/\.0+$/, '')}k`;
  if (r < 1e9) return `${(r / 1e6).toPrecision(3).replace(/\.0+$/, '')}M`;
  return `${(r / 1e9).toPrecision(3).replace(/\.0+$/, '')}G`;
}

export class UI {
  /** the selected object's details card (grows up from the pill) */
  private readonly info = $('info');
  /** one line in the bottom dock: the selected object's name and an expand chevron */
  private readonly infoPill = $('info-pill');
  private readonly infoToggle = $<HTMLButtonElement>('info-toggle');
  private readonly bottombar = $('bottombar');
  private readonly timeBtn = $<HTMLButtonElement>('btn-time');
  private readonly menuBtn = $<HTMLButtonElement>('btn-menu');
  private readonly menuList = $('menu-list');
  /** something is selected (the pill shows) */
  private infoShown = false;
  /** the details card is unfolded */
  private infoOpen = false;
  private readonly infoName = $('info-name');
  private readonly infoType = $('info-type');
  private readonly infoParent = $('info-parent');
  private readonly infoBody = $('info-body');
  private readonly infoDesc = $('info-desc');
  private readonly scope = new ScopeCard($('info-scope'), $<HTMLButtonElement>('info-scope-btn'), $('info-scope-view'));
  private readonly settingsPanel = $('settings');
  private readonly help = $('help');
  private readonly about = $('about');
  private readonly toast = $('toast');
  private readonly searchInput = $<HTMLInputElement>('search-input');
  private readonly searchResults = $<HTMLUListElement>('search-results');
  private readonly followBtn = $<HTMLButtonElement>('act-follow');
  private readonly landBtn = $<HTMLButtonElement>('act-land');
  private readonly shareBtn = $<HTMLButtonElement>('act-share');
  private readonly euvBtn = $<HTMLButtonElement>('info-euv');
  private readonly coreBtn = $<HTMLButtonElement>('info-core');
  private readonly brandSub = $('brand-sub');
  private readonly pauseBtn = $<HTMLButtonElement>('t-pause');
  private readonly roamBtn = $<HTMLButtonElement>('btn-roam');
  private readonly placesBtn = $<HTMLButtonElement>('btn-places');
  private readonly placesMenu = $('places-menu');
  readonly missionPanel: MissionPanel;
  private readonly systemStrip: SystemStrip;
  private lastInfoUpdate = 0;
  private toastTimer = 0;
  private searchIndex = -1;
  private fpsAcc = 0;
  private fpsCount = 0;
  private hudAt = -Infinity;
  private discAt = -Infinity;
  private fps = 0;

  constructor(private readonly host: UIHost) {
    this.bindTime();
    this.bindActions();
    this.bindSearch();
    this.buildSettings();
    this.buildPlaces();
    this.roamBtn.addEventListener('click', () => host.toggleFreeRoam());
    $('btn-help').addEventListener('click', () => this.toggleHelp());
    $('help-close').addEventListener('click', () => this.toggleHelp(false));
    this.help.addEventListener('click', (e) => { if (e.target === this.help) this.toggleHelp(false); });
    this.bindMenu();
    $('about-close').addEventListener('click', () => this.toggleAbout(false));
    $('about-help').addEventListener('click', () => { this.toggleAbout(false); this.toggleHelp(true); });
    this.about.addEventListener('click', (e) => { if (e.target === this.about) this.toggleAbout(false); });
    $('settings-close').addEventListener('click', () => this.toggleSettings(false));
    this.missionPanel = new MissionPanel(host);
    this.systemStrip = new SystemStrip(host);
    // the bottom dock: the info pill unfolds its card upward; on phones "Time control" pops the
    // time controls out above the line (either or both can be open; the time controls stay lowest)
    this.infoToggle.addEventListener('click', () => this.setInfoOpen(!this.infoOpen));
    $('info-collapse').addEventListener('click', () => this.setInfoOpen(false));
    $('info-close').addEventListener('click', () => { host.select(null); host.selectStar(null); host.selectGalaxy(null); host.selectLandmark(null); });
    this.timeBtn.addEventListener('click', () => this.setTimeOpen(!this.bottombar.classList.contains('time-open')));
    $('time-pop-close').addEventListener('click', () => this.setTimeOpen(false));
    this.timeSheet = new TimeSheet(host.time, (msg) => this.showToast(msg));
    this.missionPanel.onClose = () => this.syncTabs();
    this.bindTabs();
    this.bindContextBar();
    this.bindMore();
    this.bindAutoHide();
    this.phoneMq.addEventListener('change', () => this.placeSearch());
    this.placeSearch();
  }

  /* ---------------- Phones: tab bar and sheets ---------------- */
  private readonly phoneMq = window.matchMedia('(max-width: 700px)');
  private readonly uiEl = $('ui');
  private readonly tabbar = $('tabbar');
  private readonly searchSheet = $('sheet-search');
  private readonly moreSheet = $('sheet-more');
  private readonly searchHome = $('search-home');
  private readonly timeSheet: TimeSheet;

  private bindTabs(): void {
    this.tabbar.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => {
      const tab = b.dataset.tab as Tab;
      // a second tap on the open tab closes its sheet
      this.setTab(tab !== 'explore' && this.currentTab() === tab ? 'explore' : tab);
    }));
    $('search-cancel').addEventListener('click', () => { this.closeSearch(); this.setTab('explore'); });
  }

  /** the sheets the tab bar opens (on phones); the settings panel counts as part of More */
  private hideSheets(): void {
    this.searchSheet.hidden = true;
    this.timeSheet.el.hidden = true;
    this.moreSheet.hidden = true;
  }

  /** Explore is the scene itself: every sheet closed */
  setTab(tab: Tab): void {
    if (tab !== 'search' && !this.searchSheet.hidden) { this.searchInput.value = ''; this.searchResults.hidden = true; this.searchInput.blur(); }
    this.hideSheets();
    this.toggleSettings(false);
    this.missionPanel.toggle(false);
    this.togglePlaces(false);
    if (tab === 'search') {
      this.searchSheet.hidden = false;
      this.renderSearchHome();
      this.searchInput.focus();
    } else if (tab === 'time') this.timeSheet.el.hidden = false;
    else if (tab === 'missions') this.missionPanel.toggle(true);
    else if (tab === 'more') { this.moreSheet.hidden = false; this.syncTiles(); }
    if (tab !== 'explore') this.setChrome(true);
    this.syncTabs();
  }

  private currentTab(): Tab {
    if (!this.searchSheet.hidden) return 'search';
    if (this.timeSheet.visible) return 'time';
    if (this.missionPanel.visible) return 'missions';
    if (!this.moreSheet.hidden || !this.settingsPanel.hidden) return 'more';
    return 'explore';
  }

  private syncTabs(): void {
    const cur = this.currentTab();
    this.tabbar.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      if (b.dataset.tab === cur) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    this.uiEl.classList.toggle('sheet-open', cur !== 'explore');
  }

  /** the search field lives in the top bar on wide screens and in the search sheet on phones */
  private placeSearch(): void {
    const s = $('search');
    if (this.phoneMq.matches) {
      if (s.parentElement !== $('search-slot')) $('search-slot').appendChild(s);
    } else {
      if (s.parentElement !== $('places').parentElement) $('places').before(s);
      this.hideSheets();
      this.syncTabs();
    }
  }

  /* ---------------- Phones: the selection's bar ---------------- */
  private readonly cbFollow = $<HTMLButtonElement>('cb-follow');
  private readonly cbLand = $<HTMLButtonElement>('cb-land');
  private readonly cbCenter = $<HTMLButtonElement>('cb-center');
  private readonly infoSub = $('info-sub');

  private bindContextBar(): void {
    $('cb-go').addEventListener('click', () => $('act-goto').click());
    this.cbFollow.addEventListener('click', () => this.followBtn.click());
    this.cbLand.addEventListener('click', () => this.landBtn.click());
    this.cbCenter.addEventListener('click', () => $('act-center').click());
  }

  /* ---------------- Phones: More (view switches, settings, help, about) ---------------- */
  private bindMore(): void {
    const h = this.host, s = h.settings;
    this.moreSheet.querySelectorAll<HTMLButtonElement>('[data-tile]').forEach((b) => b.addEventListener('click', () => {
      switch (b.dataset.tile) {
        case 'orbits': s.orbits = !s.orbits; s.moonOrbits = s.orbits; h.applySettings(true); break;
        case 'names': s.cleanView = !s.cleanView; h.applySettings(true); break;
        case 'grid': s.eclipticGrid = !s.eclipticGrid; h.applySettings(true); break;
        case 'euv': h.toggleEUV(); break;
        case 'autohide': s.autoHideUI = !s.autoHideUI; h.applySettings(true); break;
        case 'shot': this.setTab('explore'); requestAnimationFrame(() => h.screenshot()); break;
      }
      this.syncTiles();
    }));
    this.moreSheet.querySelectorAll<HTMLButtonElement>('[data-more]').forEach((b) => b.addEventListener('click', () => {
      const what = b.dataset.more;
      if (what === 'settings') { this.moreSheet.hidden = true; this.toggleSettings(true); }
      else if (what === 'help') { this.setTab('explore'); this.toggleHelp(true); }
      else if (what === 'about') { this.setTab('explore'); this.toggleAbout(true); }
    }));
  }

  private syncTiles(): void {
    const s = this.host.settings;
    const on: Record<string, boolean> = { orbits: s.orbits, names: !s.cleanView, grid: s.eclipticGrid, euv: this.host.euv, autohide: s.autoHideUI };
    this.moreSheet.querySelectorAll<HTMLButtonElement>('[data-tile]').forEach((b) => {
      const k = b.dataset.tile!;
      if (k in on) b.setAttribute('aria-pressed', String(on[k]));
    });
  }

  /* ---------------- Auto-hide: the controls fade while the scene is dragged ---------------- */
  private chromeOff = false;
  private autoHideWas = false;
  private idleTimer = 0;

  private bindAutoHide(): void {
    const scene = document.getElementById('scene');
    if (!scene) return;
    let down: { x: number; y: number; t: number } | null = null;
    scene.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    scene.addEventListener('pointermove', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) this.setChrome(false);
    });
    window.addEventListener('pointerup', (e) => {
      if (!down) return;
      const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 12 && performance.now() - down.t < 400;
      down = null;
      // a tap on the scene brings the controls back
      if (tap && this.chromeOff) this.setChrome(true);
      else this.armIdle();
    });
    // using the controls keeps them up
    this.uiEl.addEventListener('pointerdown', () => this.armIdle());
    this.autoHideWas = this.host.settings.autoHideUI;
    this.armIdle();
  }

  private armIdle(): void {
    window.clearTimeout(this.idleTimer);
    if (!this.host.settings.autoHideUI) return;
    this.idleTimer = window.setTimeout(() => this.setChrome(false), 6000);
  }

  /** show (true) or fade (false) the controls; nothing fades while a sheet or the details card is open */
  private setChrome(on: boolean): void {
    if (!on && (!this.host.settings.autoHideUI || this.currentTab() !== 'explore' || this.infoOpen
      || !this.help.hidden || !this.about.hidden || document.activeElement === this.searchInput)) return;
    if (on) this.armIdle();
    if (this.chromeOff === !on) return;
    this.chromeOff = !on;
    this.uiEl.classList.toggle('chrome-off', !on);
  }

  /* ---------------- Menu (top left) and the bottom dock ---------------- */
  private bindMenu(): void {
    const btn = this.menuBtn, list = this.menuList;
    btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMenu(); });
    list.querySelectorAll<HTMLButtonElement>('[data-menu]').forEach((item) => item.addEventListener('click', () => {
      this.toggleMenu(false);
      const what = item.dataset.menu;
      if (what === 'settings') this.toggleSettings();
      else if (what === 'mission') this.toggleMission();
      else if (what === 'about') this.toggleAbout();
    }));
    document.addEventListener('pointerdown', (e) => {
      if (!list.hidden && !list.contains(e.target as Node) && !btn.contains(e.target as Node)) this.toggleMenu(false);
    });
  }

  toggleMenu(force?: boolean): void {
    const show = force ?? this.menuList.hidden === true;
    if (show) this.togglePlaces(false);
    this.menuList.hidden = !show;
    this.menuBtn.classList.toggle('active', show);
    this.menuBtn.setAttribute('aria-expanded', String(show));
  }

  /** the right-hand panels the places menu and the search field make way for */
  private closeSidePanels(): void {
    this.toggleSettings(false);
    this.toggleMission(false);
  }

  private setInfoOpen(open: boolean): void {
    this.infoOpen = open;
    this.infoToggle.setAttribute('aria-expanded', String(open));
    this.infoPill.classList.toggle('open', open);
    this.info.hidden = !(this.infoShown && open);
  }

  private setInfoShown(shown: boolean): void {
    if (shown === this.infoShown) return;
    this.infoShown = shown;
    this.infoPill.hidden = !shown;
    this.info.hidden = !(shown && this.infoOpen);
  }

  private setTimeOpen(open: boolean): void {
    this.bottombar.classList.toggle('time-open', open);
    this.timeBtn.setAttribute('aria-expanded', String(open));
  }

  /* ---------------- Time ---------------- */
  private bindTime(): void {
    const t = this.host.time;
    $('t-rev').addEventListener('click', () => t.reverseWarp());
    $('t-slow').addEventListener('click', () => t.slower());
    $('t-pause').addEventListener('click', () => t.togglePause());
    $('t-fast').addEventListener('click', () => t.faster());
    $('t-fwd').addEventListener('click', () => t.forwardWarp());
    $('t-now').addEventListener('click', () => { t.setNow(); this.showToast(_('Back to real time')); });
    $('time-date').addEventListener('click', () => {
      const cur = t.date.toISOString().slice(0, 16);
      const v = window.prompt(_('Date/time (UTC, ISO 8601):'), cur);
      if (!v) return;
      const d = new Date(v.endsWith('Z') ? v : v + 'Z');
      if (Number.isFinite(d.getTime())) t.setDate(d);
      else this.showToast(_('Invalid date'));
    });
    $('time-date').style.cursor = 'pointer';
    $('time-date').title = _('Click to set the date');
    this.buildTimeMenu();
  }

  private readonly timeMenu = $('time-menu');
  private readonly timeRateBtn = $<HTMLButtonElement>('time-rate');
  private timeItems: Array<{ rate: number; el: HTMLElement }> = [];
  private timeDirBtns: HTMLButtonElement[] = [];

  /** The preset ladder behind the rate readout (direction, then one row per preset) */
  private buildTimeMenu(): void {
    const t = this.host.time;
    const menu = this.timeMenu;
    menu.innerHTML = '';
    const dir = document.createElement('div');
    dir.className = 'time-dir';
    this.timeDirBtns = ([[-1, '◀\uFE0E ' + _('Back')], [1, _('Forward') + ' ▶\uFE0E']] as Array<[1 | -1, string]>).map(([d, label]) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.dataset.dir = String(d);
      b.addEventListener('click', (e) => { e.stopPropagation(); t.setDirection(d); this.refreshTimeMenu(); });
      dir.appendChild(b);
      return b;
    });
    menu.appendChild(dir);
    this.timeItems = RATE_PRESETS.map((p) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('role', 'option');
      const name = document.createElement('span');
      name.textContent = p.label();
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = p.rate === 1 ? '1×' : `${fmtRateMult(p.rate)}×`;
      item.append(name, n);
      item.addEventListener('click', () => { t.setRate(p.rate, t.dir < 0 ? -1 : 1); this.toggleTimeMenu(false); });
      menu.appendChild(item);
      return { rate: p.rate, el: item };
    });
    this.timeRateBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleTimeMenu(); });
    document.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !menu.contains(e.target as Node) && !this.timeRateBtn.contains(e.target as Node)) this.toggleTimeMenu(false);
    });
  }

  private toggleTimeMenu(show = this.timeMenu.hidden): void {
    this.timeMenu.hidden = !show;
    this.timeRateBtn.setAttribute('aria-expanded', String(show));
    if (show) this.refreshTimeMenu();
  }

  private refreshTimeMenu(): void {
    const t = this.host.time;
    for (const b of this.timeDirBtns) b.classList.toggle('active', Number(b.dataset.dir) === t.dir);
    for (const it of this.timeItems) it.el.classList.toggle('active', !t.paused && Math.abs(Math.log(it.rate / t.rate)) < 0.01);
  }

  /* ---------------- Actions ---------------- */
  private bindActions(): void {
    const h = this.host;
    $('act-goto').addEventListener('click', () => {
      if (h.selected) h.goTo(h.selected);
      else if (h.selectedStar !== null) h.goToStar(h.selectedStar);
      else if (h.selectedGalaxy !== null) h.goToGalaxy(h.selectedGalaxy);
      else if (h.selectedLandmark !== null) h.goToLandmark(h.selectedLandmark);
      else if (h.selectedFar !== null) h.goToFar(h.selectedFar);
    });
    this.euvBtn.addEventListener('click', () => this.host.toggleEUV());
    this.coreBtn.addEventListener('click', () => {
      const g = this.host.selectedGalaxy;
      const bh = g !== null ? this.host.universe.galaxyCore(g) : undefined;
      if (bh) this.host.goToBlackHole(bh.entry.id);
    });
    $('act-share').addEventListener('click', () => {
      const b = this.host.selected;
      if (!b) return;
      const url = viewUrl(b.id, this.host.time.date, this.host.viewOf(b), this.host.time.rate);
      void copyText(url).then((ok) => this.showToast(ok ? _('View link copied') : url, ok ? 1800 : 5000));
    });
    $('act-center').addEventListener('click', () => {
      if (h.selected) h.center(h.selected);
      else if (h.selectedStar !== null) h.centerStar(h.selectedStar);
      else if (h.selectedGalaxy !== null) h.centerGalaxy(h.selectedGalaxy);
      else if (h.selectedLandmark !== null) h.centerLandmark(h.selectedLandmark);
      else if (h.selectedFar !== null) h.centerFar(h.selectedFar);
    });
    this.followBtn.addEventListener('click', () => h.toggleFollow());
    this.landBtn.addEventListener('click', () => { if (h.landedOn) h.takeOff(); else h.land(h.selected); });
    $('sf-takeoff').addEventListener('click', () => h.takeOff());
    // hold to climb / descend (mouse or touch)
    for (const [id, dir] of [['sf-up', 1], ['sf-down', -1]] as const) {
      const el = $(id);
      const start = (e: Event) => { e.preventDefault(); h.camera.liftInput = dir; };
      const stop = () => { if (h.camera.liftInput === dir) h.camera.liftInput = 0; };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', stop);
      el.addEventListener('pointerleave', stop);
      el.addEventListener('pointercancel', stop);
    }
  }

  /* ---------------- "Görmeye değecek yerler" ---------------- */
  private buildPlaces(): void {
    const h = this.host;
    const u = h.universe;
    const menu = this.placesMenu;
    menu.innerHTML = '';
    this.discoveriesGroup = document.createElement('div');
    this.discoveriesGroup.className = 'dropdown-discoveries';
    menu.appendChild(this.discoveriesGroup);
    const resolveGalaxy = (ref: string): number | null => {
      if (ref.startsWith('#')) return parseInt(ref.slice(1), 10);
      const i = u.galaxies.findHandmade(ref);
      return i < 0 ? null : i;
    };
    for (const group of PLACES) {
      const head = document.createElement('div');
      head.className = 'dropdown-group';
      head.textContent = _(group.title);
      menu.appendChild(head);
      for (const p of group.items) {
        // skip destinations this build cannot resolve
        if (p.kind === 'galaxy' && resolveGalaxy(p.ref) === null) continue;
        // the colourful white dwarfs live in the background-loaded Gaia tier
        if (p.kind === 'star' && !colouredDwarf(p.ref) && u.catalog.search(p.ref, 1).length === 0) continue;
        if (p.kind === 'blackhole' && !u.blackHole(p.ref)) continue;
        if (p.kind === 'landmark' && !u.landmark(p.ref)) continue;
        if (p.kind === 'exoplanet' && !u.exoplanets.byName(p.ref)) continue;
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('role', 'option');
        item.innerHTML = `<span>${_(p.label)}</span>${p.note ? `<span class="n">${_(p.note)}</span>` : ''}`;
        const go = (): void => {
          if (p.kind === 'body') h.goToBodyId(p.ref);
          else if (p.kind === 'blackhole') h.goToBlackHole(p.ref);
          else if (p.kind === 'landmark') h.goToLandmark(u.landmarks.indexOf(u.landmark(p.ref)!));
          else if (p.kind === 'exoplanet') {
            const hit = u.exoplanets.byName(p.ref)!;
            h.goToSystemBody(`c${hit.host.i}`, exoBodyId(hit.host.i, hit.planet.name));
          } else if (p.kind === 'star') {
            const go = (): void => { const hits = u.catalog.search(p.ref, 1); if (hits.length) h.goToStar(`c${hits[0]}`); };
            if (colouredDwarf(p.ref)) void u.catalog.loadTiers().then(go);
            else go();
          } else {
            const gi = resolveGalaxy(p.ref);
            if (gi !== null) h.goToGalaxy(gi);
          }
        };
        item.addEventListener('click', () => { this.togglePlaces(false); go(); });
        menu.appendChild(item);
        this.placeItems.push({ group: group.title, label: p.label, note: p.note ?? '', go });
      }
    }
    this.placesBtn.addEventListener('click', (e) => { e.stopPropagation(); this.togglePlaces(); });
    document.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !menu.contains(e.target as Node) && !this.placesBtn.contains(e.target as Node)) this.togglePlaces(false);
    });
  }

  private discoveriesGroup!: HTMLElement;
  /** the places, resolved, with what a tap on each does (the phone search screen lists them as cards) */
  private readonly placeItems: Array<{ group: string; label: string; note: string; go: () => void }> = [];
  private searchCat: SearchCat = 'all';
  private searchRender: () => void = () => {};

  /* ---------------- Phones: the search screen's home (filters, recent, places) ---------------- */
  private buildSearchCats(): void {
    const box = $('search-cats');
    box.innerHTML = '';
    for (const [cat, label] of SEARCH_CATS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(cat === this.searchCat));
      b.textContent = _(label);
      b.addEventListener('click', () => {
        this.searchCat = cat;
        box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b)));
        this.searchRender();
        this.renderSearchHome();
      });
      box.appendChild(b);
    }
  }

  private loadRecent(): Array<{ name: string; tag: string }> {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Array<{ name: string; tag: string }>;
      return Array.isArray(v) ? v.filter((r) => typeof r?.name === 'string').slice(0, 6) : [];
    } catch { return []; }
  }

  private remember(name: string, tag: string): void {
    const list = [{ name, tag }, ...this.loadRecent().filter((r) => r.name !== name)].slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* private mode */ }
  }

  /** a recent search runs again: the same name, and its row is taken when it comes up first */
  private replayRecent(name: string): void {
    this.searchInput.value = name;
    this.searchRender();
    const hit = Array.from(this.searchResults.children).find((li) => li.firstElementChild?.textContent === name) as HTMLElement | undefined;
    if (hit) hit.click();
  }

  private renderSearchHome(): void {
    const home = this.searchHome;
    home.innerHTML = '';
    home.hidden = this.searchInput.value.trim() !== '';
    const section = (title: string, extra?: HTMLElement): HTMLElement => {
      const sec = document.createElement('section');
      sec.className = 'sh-sec';
      const head = document.createElement('div');
      head.className = 'sh-head';
      const h = document.createElement('h2');
      h.textContent = title;
      head.appendChild(h);
      if (extra) head.appendChild(extra);
      sec.appendChild(head);
      home.appendChild(sec);
      return sec;
    };
    const recent = this.searchCat === 'all' ? this.loadRecent() : [];
    if (recent.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'link-btn';
      clear.textContent = _('Clear');
      clear.addEventListener('click', () => { try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } this.renderSearchHome(); });
      const sec = section(_('Recent'), clear);
      for (const r of recent) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sh-row';
        b.innerHTML = `<span class="sh-name">${escapeHtml(r.name)}</span><span class="sh-tag">${escapeHtml(r.tag)}</span>`;
        b.addEventListener('click', () => this.replayRecent(r.name));
        sec.appendChild(b);
      }
    }
    const log = this.searchCat === 'all' ? this.host.discoveryLog().slice(0, 10) : [];
    if (log.length) {
      const row = document.createElement('div');
      row.className = 'sh-cards';
      for (const d of log) row.appendChild(this.placeCard(d.name, _(d.kind), () => this.host.goToDiscovery(d.id)));
      section(`${_('My discoveries')} (${this.host.discoveryLog().length})`).appendChild(row);
    }
    let group = '';
    let row: HTMLElement | null = null;
    for (const p of this.placeItems) {
      if (this.searchCat !== 'all' && PLACE_GROUP_CAT[p.group] !== this.searchCat) continue;
      if (p.group !== group) {
        group = p.group;
        row = document.createElement('div');
        row.className = 'sh-cards';
        section(_(p.group)).appendChild(row);
      }
      row!.appendChild(this.placeCard(_(p.label), p.note ? _(p.note) : '', p.go));
    }
  }

  private placeCard(name: string, note: string, go: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-card';
    b.innerHTML = `<span class="sh-name">${escapeHtml(name)}</span>${note ? `<span class="sh-tag">${escapeHtml(note)}</span>` : ''}`;
    b.addEventListener('click', () => { go(); this.closeSearch(); });
    return b;
  }

  /** "Keşiflerim": the visitor's own finds, rebuilt every time the menu opens */
  private fillDiscoveries(): void {
    const h = this.host;
    const box = this.discoveriesGroup;
    box.innerHTML = '';
    const log = h.discoveryLog();
    const head = document.createElement('div');
    head.className = 'dropdown-group';
    head.textContent = log.length ? `${_('My discoveries')} (${log.length})` : _('My discoveries');
    box.appendChild(head);
    if (!log.length) {
      const empty = document.createElement('div');
      empty.className = 'dropdown-item muted';
      empty.innerHTML = `<span>${_('No discoveries yet · approach objects marked ◇, click rocks in the belts')}</span>`;
      box.appendChild(empty);
      return;
    }
    for (const d of log.slice(0, 14)) {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('role', 'option');
      item.innerHTML = `<span>${d.name}</span><span class="n">${_(d.kind)}</span>`;
      item.addEventListener('click', () => { this.togglePlaces(false); h.goToDiscovery(d.id); });
      box.appendChild(item);
    }
  }

  togglePlaces(force?: boolean): void {
    const show = force ?? this.placesMenu.hidden === true;
    if (show) { this.fillDiscoveries(); this.closeSidePanels(); this.toggleMenu(false); }
    this.placesMenu.hidden = !show;
    this.placesBtn.classList.toggle('active', show);
    this.placesBtn.setAttribute('aria-expanded', String(show));
  }

  /* ---------------- Search ---------------- */
  private bindSearch(): void {
    const input = this.searchInput;
    const list = this.searchResults;
    // the search field makes way the same as the places menu
    input.addEventListener('focus', () => this.closeSidePanels());
    const render = () => {
      const q = input.value.trim().toLowerCase();
      list.innerHTML = '';
      this.searchIndex = -1;
      this.searchHome.hidden = q !== '' || this.searchSheet.hidden;
      if (!q) { list.hidden = true; return; }
      const norm = (s: string) => s.toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const nq = norm(q);
      const u = this.host.universe;
      const add = (name: string, tag: string, onClick: () => void, cat = 'any') => {
        const li = document.createElement('li');
        li.dataset.cat = cat;
        li.innerHTML = `<span>${escapeHtml(name)}</span><span class="t">${escapeHtml(tag)}</span>`;
        li.addEventListener('click', onClick);
        list.appendChild(li);
      };
      const extra = this.searchIdsAndCoords(input.value.trim(), add);
      const hits = u.bodies
        .filter((b) => norm(b.name).includes(nq) || norm(b.data.name).includes(nq) || b.id.includes(nq) || norm(typeLabel(b.data.type)).includes(nq) || (TYPE_LABELS[b.data.type] ?? '').toLowerCase().includes(q))
        .slice(0, 8);
      for (const b of hits) {
        const li = document.createElement('li');
        li.dataset.cat = catOfType(b.data.type);
        li.innerHTML = `<span>${b.name}</span><span class="t">${typeLabel(b.data.type)}${b.parent ? ' · ' + b.parent.name : ''}</span>`;
        li.addEventListener('click', () => { this.pick(b); });
        list.appendChild(li);
      }
      // Real asteroids and comets not turned into bodies yet (the hand-made ones are bodies already)
      const sb = this.host.smallBodies;
      const small = (sb?.search(q, 8) ?? []).filter((k) => !(sb!.flags[k] & 4) && !(u.current.catalogIndex === 0 && u.get(sb!.bodyId(k)))).slice(0, 6);
      for (const k of small) {
        const li = document.createElement('li');
        li.dataset.cat = 'bodies';
        li.innerHTML = `<span>${sb!.label(k)}</span><span class="t">${_(sb!.className(k))} · ${fixed(sb!.a[k], sb!.a[k] < 10 ? 2 : 0)} AU</span>`;
        li.addEventListener('click', () => { this.host.goToSmallBody(k); this.closeSearch(); });
        list.appendChild(li);
      }
      // Bodies of other systems (the Solar System from elsewhere, companion stars, pulsar planets …)
      const foreign = u.searchForeignBodies(q, 6);
      for (const f of foreign) {
        const li = document.createElement('li');
        li.dataset.cat = catOfType(f.body.type);
        li.innerHTML = `<span>${f.name}</span><span class="t">${typeLabel(f.body.type)} · ${f.systemName}</span>`;
        li.addEventListener('click', () => { this.host.goToSystemBody(f.starId, f.body.id); this.closeSearch(); });
        list.appendChild(li);
      }
      // Confirmed exoplanets of other systems
      const exo = u.exoplanets.search(q, 6).filter((x) => x.host.i !== u.current.catalogIndex);
      for (const { host, planet } of exo) {
        const li = document.createElement('li');
        const ly = u.catalog.distancePc(host.i) * 3.26156;
        li.dataset.cat = 'bodies';
        li.innerHTML = `<span>${planet.name}</span><span class="t">${_('Exoplanet')} · ${u.catalog.nameOf(host.i)} · ${fixed(ly, ly < 100 ? 1 : 0)} ly</span>`;
        li.addEventListener('click', () => { this.host.goToSystemBody(`c${host.i}`, exoBodyId(host.i, planet.name)); this.closeSearch(); });
        list.appendChild(li);
      }
      // Catalogue stars (other systems)
      const stars = u.catalog.search(q, 8).filter((i) => i !== u.current.catalogIndex);
      for (const i of stars) {
        const li = document.createElement('li');
        const spect = u.catalog.catalogSpectral(i);
        const ly = u.catalog.distancePc(i) * 3.26156;
        li.dataset.cat = 'stars';
        li.innerHTML = `<span>${u.catalog.nameOf(i)}</span><span class="t">${_('Star')}${spect ? ' · ' + spect : ''} · ${fixed(ly, 1)} ly</span>`;
        li.addEventListener('click', () => { this.pickStar(`c${i}`); });
        list.appendChild(li);
      }
      // Black holes (other systems)
      const bhs = u.searchBlackHoles(q, 5).filter((b) => b.systemStarId !== u.current.starId);
      for (const b of bhs) {
        const li = document.createElement('li');
        const dist = fmtLightYears(b.positionPc.length() * PARSEC_KM);
        li.dataset.cat = 'blackholes';
        li.innerHTML = `<span>${b.entry.name}</span><span class="t">${_('Black Hole')} · ${fmtSolarMass(b.entry.massSolar)} · ${dist}</span>`;
        li.addEventListener('click', () => { this.host.goToBlackHole(b.entry.id); this.closeSearch(); });
        list.appendChild(li);
      }
      // Deep-sky landmarks
      const lms = u.searchLandmarks(q, 8);
      for (const i of lms) {
        const l = u.landmarks[i];
        const li = document.createElement('li');
        const where = u.galaxies.name(l.galaxy);
        li.dataset.cat = l.def.kind === 'pulsar' ? 'stars' : 'nebulae';
        li.innerHTML = `<span>${l.def.name}</span><span class="t">${_(LANDMARK_KIND_LABEL[l.def.kind]).split(' /')[0]} · ${where} · ${fmtLightYears(l.positionPc.length() * PARSEC_KM)}</span>`;
        li.addEventListener('click', () => { this.host.goToLandmark(i); this.closeSearch(); });
        list.appendChild(li);
      }
      // Galaxies
      const gals = u.galaxies.search(q, 6);
      for (const i of gals) {
        const li = document.createElement('li');
        const dist = fmtLightYears(u.galaxies.distancePc(i) * PARSEC_KM);
        li.dataset.cat = 'galaxies';
        li.innerHTML = `<span>${u.galaxies.name(i)}</span><span class="t">${_('Galaxy')} · ${_(u.galaxies.typeLabel(i))} · ${dist}</span>`;
        li.addEventListener('click', () => { this.host.selectGalaxy(i); this.host.goToGalaxy(i); this.closeSearch(); });
        list.appendChild(li);
      }
      void extra;
      // the phone filter chips: rows of other kinds step aside
      let shown = 0;
      for (const li of Array.from(list.children) as HTMLElement[]) {
        const ok = this.searchCat === 'all' || li.dataset.cat === 'any' || li.dataset.cat === this.searchCat;
        li.hidden = !ok;
        if (ok) shown++;
      }
      list.hidden = shown === 0;
    };
    this.searchRender = render;
    this.buildSearchCats();
    // a pick is remembered for the phone search screen's "Recent" (not coordinates or raw ids)
    list.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest('li');
      if (!li || li.dataset.cat === 'any') return;
      this.remember(li.firstElementChild?.textContent ?? '', li.querySelector('.t')?.textContent ?? '');
    }, true);
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (e) => {
      const items = Array.from(list.children) as HTMLLIElement[];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        this.searchIndex = (this.searchIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((li, i) => li.classList.toggle('active', i === this.searchIndex));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const li = items[this.searchIndex >= 0 ? this.searchIndex : 0];
        li?.click();
      } else if (e.key === 'Escape') {
        input.blur();
        list.hidden = true;
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (!(e.target as HTMLElement).closest('#search, #search-cats')) list.hidden = true;
    });
  }

  private pick(b: CelestialBody): void {
    this.host.select(b);
    this.host.goTo(b);
    this.closeSearch();
  }

  /**
   * Generated objects by id (`q…` nebulae and clusters, `p…` stars, `bg…` galactic nuclei, `c…`
   * catalogue stars) and sky positions (RA/Dec, galactic l/b, optionally a distance): what lies in
   * that direction, a "look there" and, with a distance, a "fly there". Returns the rows added.
   */
  /**
   * Fly to a landmark by id, resolved when clicked: the generated neighbourhood is rebuilt as the
   * camera moves, and an object restored from its id (another galaxy's) drops out of the list
   * again unless it is selected, so an index taken while the list was drawn may be stale.
   */
  private goLandmarkById(id: string): void {
    const u = this.host.universe;
    const l = u.landmark(id);
    const i = l ? u.landmarks.indexOf(l) : -1;
    if (i >= 0) { this.host.selectLandmark(i); this.host.goToLandmark(i); }
    this.closeSearch();
  }

  private searchIdsAndCoords(raw: string, add: (name: string, tag: string, onClick: () => void) => void): number {
    const u = this.host.universe;
    let n = 0;
    const id = raw.replace(/\s+/g, '');
    if (/^q(g?)\d+:-?\d+:-?\d+:-?\d+:\d+$/i.test(id)) {
      const l = u.landmark(id.toLowerCase());
      const i = l ? u.landmarks.indexOf(l) : -1;
      if (l && i >= 0) { add(l.def.name, `${_(LANDMARK_KIND_LABEL[l.def.kind]).split(' /')[0]} · ${id}`, () => this.goLandmarkById(l.def.id)); n++; }
    } else if (/^bg\d+$/i.test(id)) {
      const bh = u.blackHole(id.toLowerCase());
      if (bh) { add(bh.entry.name, `${_('Black Hole')} · ${fmtSolarMass(bh.entry.massSolar)}`, () => { this.host.goToBlackHole(bh.entry.id); this.closeSearch(); }); n++; }
    } else if (/^(p\d+(:-?\d+){5}|c\d+)$/i.test(id)) {
      try {
        const sid = id.toLowerCase() as StarId;
        const info = u.starInfo(sid);
        if (info && Number.isFinite(info.distancePc)) { add(info.name, `${_('Star')} · ${info.spectral} · ${fmtLightYears(info.distancePc * PARSEC_KM)}`, () => this.pickStar(sid)); n++; }
      } catch { /* not a star id after all */ }
    }
    // a world of another system: `{star id}/{body id}`, as its card shows it
    const path = /^(.+)\/([a-z0-9:_-]+)$/i.exec(id);
    if (path) {
      const sid = path[1].toLowerCase() as StarId, bid = path[2];
      try {
        const info = u.starInfo(sid);
        if (info) { add(bid, `${info.name} · ${sid}`, () => { this.host.goToSystemBody(sid, bid); this.closeSearch(); }); n++; }
      } catch { /* not a system id */ }
    }
    // the far universe: galaxy clusters and their member galaxies
    for (const ref of this.host.findFar(raw)) {
      const f = this.host.farInfo(ref);
      add(f.name, `${f.kind} · ${fmtLightYears(f.distSunPc * PARSEC_KM)} · ${farKey(ref)}`, () => { this.host.goToFar(ref); this.closeSearch(); });
      n++;
    }
    const sky = parseSkyQuery(raw);
    if (!sky) return n;
    const where = `${fmtRaDec(sky.ra, sky.dec)} · ${fmtGalactic(sky.l, sky.b)}`;
    add(_('Look in this direction'), where, () => { this.host.lookToward(sky.dir.clone()); this.closeSearch(); }); n++;
    if (sky.distPc !== null) {
      const p = sky.dir.clone().multiplyScalar(sky.distPc);
      add(_('Fly to this point'), `${fmtLightYears(sky.distPc * PARSEC_KM)} · ${where}`, () => { this.host.goToSkyPoint(p, _('Coordinates')); this.closeSearch(); }); n++;
    }
    // what lies along that sightline: deep-sky objects (real and the generated neighbourhood),
    // black holes and galaxies, nearest in angle first (and in distance, when one was given)
    type Hit = { score: number; name: string; tag: string; go: () => void };
    const found: Hit[] = [];
    const tol = 1.5 * Math.PI / 180;
    const consider = (pos: Vector3, radiusPc: number, name: string, tag: string, go: () => void) => {
      const d = pos.length();
      if (d <= 0) return;
      const sep = Math.acos(Math.max(-1, Math.min(1, pos.dot(sky.dir) / d)));
      const reach = Math.max(tol, Math.atan(radiusPc / d));
      if (sep > reach) return;
      let score = sep / reach;
      if (sky.distPc !== null) score += Math.abs(Math.log(d / sky.distPc)) * 2;
      found.push({ score, name, tag, go });
    };
    for (let i = 0; i < u.landmarks.length; i++) {
      const l = u.landmarks[i];
      consider(l.positionPc, l.def.radiusPc, l.def.name, `${_(LANDMARK_KIND_LABEL[l.def.kind]).split(' /')[0]} · ${fmtLightYears(l.positionPc.length() * PARSEC_KM)}`, () => this.goLandmarkById(l.def.id));
    }
    for (const b of u.blackHoles) {
      consider(b.positionPc, 0, b.entry.name, `${_('Black Hole')} · ${fmtLightYears(b.positionPc.length() * PARSEC_KM)}`, () => { this.host.goToBlackHole(b.entry.id); this.closeSearch(); });
    }
    const g = u.galaxies, gp = new Vector3();
    for (let i = 1; i < g.count; i++) {
      g.position(i, gp);
      consider(gp.clone(), g.radius[i], g.name(i), `${_('Galaxy')} · ${fmtLightYears(g.distancePc(i) * PARSEC_KM)}`, () => { this.host.selectGalaxy(i); this.host.goToGalaxy(i); this.closeSearch(); });
    }
    found.sort((a, b) => a.score - b.score);
    for (const h of found.slice(0, 8)) { add(h.name, h.tag, h.go); n++; }
    return n;
  }

  private pickStar(id: StarId): void {
    this.host.selectStar(id);
    this.host.goToStar(id);
    this.closeSearch();
  }

  private closeSearch(): void {
    this.searchInput.value = '';
    this.searchResults.hidden = true;
    this.searchInput.blur();
    if (!this.searchSheet.hidden) this.setTab('explore');
  }

  /* ---------------- Settings ---------------- */
  private buildSettings(): void {
    const body = $('settings-body');
    body.innerHTML = '';
    const s = this.host.settings;
    // graphics level: sets every display / render switch below at once
    const presetRow = document.createElement('div');
    presetRow.className = 'setting-row';
    const presetLabel = document.createElement('span');
    presetLabel.textContent = _('Graphics');
    presetLabel.style.flex = '1';
    const seg = document.createElement('div');
    seg.className = 'seg';
    this.presetButtons.clear();
    // "Orta" alone is already the key of an unrelated "moderate"
    const names: Record<GraphicsPreset, string> = { low: _('Lowest'), medium: _('Medium'), high: _('Highest') };
    for (const p of GRAPHICS_PRESET_ORDER) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = names[p];
      b.addEventListener('click', () => {
        Object.assign(s, GRAPHICS_PRESETS[p]);
        this.host.applySettings(true);
      });
      this.presetButtons.set(p, b);
      seg.appendChild(b);
    }
    presetRow.append(presetLabel, seg);
    body.appendChild(presetRow);
    this.syncPreset();
    // language
    const langRow = document.createElement('div');
    langRow.className = 'setting-row';
    const langLabel = document.createElement('label');
    langLabel.textContent = _('Language');
    langLabel.htmlFor = 'set-lang';
    const langSel = document.createElement('select');
    langSel.id = 'set-lang';
    langSel.className = 'lang-select';
    for (const l of LOCALES) {
      const o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.label;
      o.selected = l.code === currentLocale();
      langSel.appendChild(o);
    }
    langSel.addEventListener('change', () => setLocale(langSel.value as Locale));
    langRow.append(langLabel, langSel);
    body.appendChild(langRow);
    // everyday switches first; the render and camera details fold under "Advanced"
    let parent: HTMLElement = body;
    for (const def of SETTING_DEFS) {
      if (def.group && ADVANCED_GROUPS.has(def.group) && parent === body) {
        const adv = document.createElement('details');
        adv.className = 'setting-advanced';
        const sum = document.createElement('summary');
        sum.textContent = _('Advanced');
        adv.appendChild(sum);
        body.appendChild(adv);
        parent = adv;
      }
      if (def.group) {
        const g = document.createElement('div');
        g.className = 'setting-group';
        g.textContent = _(def.group);
        parent.appendChild(g);
      }
      const row = document.createElement('div');
      row.className = 'setting-row';
      const label = document.createElement('label');
      label.textContent = _(def.label);
      const id = `set-${def.key}`;
      label.htmlFor = id;
      row.appendChild(label);
      if (def.kind === 'bool') {
        // a <label> wrapping the input so clicking the knob itself toggles it
        const sw = document.createElement('label');
        sw.className = 'switch';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = s[def.key] as boolean;
        input.addEventListener('change', () => {
          (s as unknown as Record<string, unknown>)[def.key] = input.checked;
          this.host.applySettings(true);
        });
        const knob = document.createElement('span');
        sw.appendChild(input);
        sw.appendChild(knob);
        row.appendChild(sw);
      } else {
        const input = document.createElement('input');
        input.type = 'range';
        input.id = id;
        input.min = String(def.min);
        input.max = String(def.max);
        input.step = String(def.step);
        input.value = String(s[def.key]);
        const val = document.createElement('span');
        val.style.fontFamily = 'var(--mono)';
        val.style.fontSize = '11px';
        val.style.minWidth = '34px';
        val.style.textAlign = 'right';
        const show = (v: number): string => (def.format ? def.format(v, this.host) : String(v));
        val.textContent = show(s[def.key] as number);
        input.addEventListener('input', () => {
          (s as unknown as Record<string, unknown>)[def.key] = parseFloat(input.value);
          val.textContent = show(parseFloat(input.value));
          this.host.applySettings(true);
        });
        row.appendChild(input);
        row.appendChild(val);
        this.rangeReadouts.set(def.key, () => { val.textContent = show(s[def.key] as number); });
      }
      parent.appendChild(row);
    }
  }

  /** value readouts of the range rows, re-rendered on sync (the resolution one depends on live state) */
  private readonly rangeReadouts = new Map<keyof Settings, () => void>();

  private readonly presetButtons = new Map<GraphicsPreset, HTMLButtonElement>();
  private syncPreset(): void {
    const active = matchPreset(this.host.settings);
    for (const [p, b] of this.presetButtons) b.classList.toggle('active', p === active);
  }

  /** Reflect programmatic setting changes (hotkeys) into the panel */
  syncSettings(): void {
    this.syncPreset();
    const s = this.host.settings;
    for (const def of SETTING_DEFS) {
      const el = document.getElementById(`set-${def.key}`) as HTMLInputElement | null;
      if (!el) continue;
      if (def.kind === 'bool') el.checked = s[def.key] as boolean;
      else { el.value = String(s[def.key]); this.rangeReadouts.get(def.key)?.(); }
    }
  }

  private creditText: string | null = null;
  private readonly creditEl = $('imagery-credit');

  /** Bottom-left credit for streamed imagery (null hides it) */
  setImageryCredit(text: string | null, translated = false): void {
    if (text === this.creditText) return;
    this.creditText = text;
    this.creditEl.hidden = text === null;
    if (text !== null) this.creditEl.textContent = translated ? text : _(text);
  }

  toggleMission(force?: boolean): void {
    const show = force ?? this.missionPanel.panel.hidden === true;
    if (show) { this.toggleSettings(false); this.hideSheets(); }
    this.missionPanel.toggle(show);
    this.syncTabs();
  }

  toggleSettings(force?: boolean): void {
    const show = force ?? this.settingsPanel.hidden === true;
    if (show) { this.missionPanel.toggle(false); this.hideSheets(); }
    this.settingsPanel.hidden = !show;
    this.syncTabs();
  }

  toggleHelp(force?: boolean): void {
    const show = force ?? this.help.hidden === true;
    this.help.hidden = !show;
    if (show) this.about.hidden = true;
  }

  toggleAbout(force?: boolean): void {
    const show = force ?? this.about.hidden === true;
    this.about.hidden = !show;
    if (show) { this.help.hidden = true; void this.loadAboutStats(); }
  }

  private aboutStatsLoaded = false;
  /** "N visits since launch" line in the About panel, from /stats.json (regenerated daily). */
  private async loadAboutStats(): Promise<void> {
    if (this.aboutStatsLoaded) return;
    this.aboutStatsLoaded = true;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}stats.json`);
      if (!res.ok) return;
      const s = (await res.json()) as { since: string; updatedAt: string; visits: number };
      if (!(s.visits > 0)) return;
      const el = $('about-stats');
      const since = new Date(s.since + 'T00:00:00Z').toLocaleDateString(localeTag(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      el.textContent = _('{n} visits since {date}', { n: fmtNum(s.visits), date: since });
      el.hidden = false;
    } catch { /* offline or blocked: the line simply stays hidden */ }
  }

  showToast(msg: string, ms = 1800, link?: { label: string; href: string; action?: () => void }): void {
    this.toast.textContent = msg;
    if (link) {
      const a = document.createElement('a');
      a.className = 'toast-link';
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      if (link.action) a.addEventListener('click', (e) => { e.preventDefault(); link.action!(); });
      this.toast.append(' · ', a);
    }
    this.toast.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => { this.toast.hidden = true; }, ms);
  }

  /* ---------------- Per-frame ---------------- */
  update(now: number, dt: number, camDistanceToSelected: number): void {
    const { time, camera, selected } = this.host;
    this.fpsAcc += dt;
    this.fpsCount++;
    if (this.fpsAcc >= 0.5) {
      this.fps = this.fpsCount / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsCount = 0;
    }

    // the readouts: text set into the DOM is a style / layout pass whether it changed or not, and
    // the locale number formatting is not free either — 15 Hz reads as live
    if (now - this.hudAt >= 66) {
      this.hudAt = now;
      $('time-date').textContent = time.formatDate();
      const rateText = time.rateLabel();
      if (this.timeRateBtn.firstChild?.textContent !== rateText) {
        this.timeRateBtn.firstChild!.textContent = rateText;
        if (!this.timeMenu.hidden) this.refreshTimeMenu();
      }
      this.pauseBtn.textContent = time.paused ? '▶\uFE0E' : '❚❚';
      this.pauseBtn.classList.toggle('active', time.paused);

      const onFoot = camera.mode === 'surface';
      $('nav-mode').textContent = camera.autopilot ? (camera.autopilot.kind === 'land' ? _('Landing') : _('Autopilot')) : onFoot ? _('Surface') : camera.mode === 'orbit' ? _('Follow / Orbit') : this.host.freeRoam ? _('Free roam') : _('Free flight');
      this.roamBtn.classList.toggle('active', this.host.freeRoam);
      $('nav-ref').textContent = camera.reference?.name ?? camera.anchor?.name ?? '—';
      $('nav-speed').textContent = camera.mode === 'free' ? `${fmtSpeed(camera.speed)}  (×${camera.speedMultiplier.toPrecision(2)})` : onFoot ? (camera.speed > 0 ? fmtSpeed(camera.speed) : '—') : '—';
      $('nav-alt').textContent = camera.nearest ? `${fmtDistance(camera.altitude)} · ${camera.nearest.name}` : '—';
      const status = onFoot ? this.host.surfaceStatus() : null;
      $('nav-place-row').hidden = !status;
      $('nav-clock-row').hidden = !status;
      const bar = $('surface-bar');
      bar.hidden = !this.host.landedOn;
      if (status) {
        $('nav-place').textContent = status.place + (camera.surface && camera.surface.zoom > 1.01 ? ` · ${camera.surface.zoom.toFixed(1)}×` : '');
        $('nav-clock').textContent = status.clock;
        $('surface-where').textContent = `${this.host.landedOn!.name} · ${fmtDistance(camera.altitude)} · ${status.clock}`;
      } else if (!bar.hidden) $('surface-where').textContent = this.host.landedOn!.name;
      $('nav-fps').textContent = fixed(this.fps, 0);
      if (this.timeSheet.visible) {
        const alt = $('nav-alt').textContent ?? '—';
        $('ts-nav').textContent = `${$('nav-mode').textContent} · ${alt === '—' ? $('nav-speed').textContent : alt}`;
      }
      if (now - this.discAt >= 500) {
        this.discAt = now;
        const n = this.host.discoveryLog().length;
        const next = this.host.nextDiscovery();
        $('nav-disc').textContent = next ? `${n} · ${_('next')} ${fmtScaleDistance(next.distKm)}` : String(n);
      }
    }
    this.missionPanel.update(now);
    this.systemStrip.update(now);

    const pointSel = this.host.selectedGalaxy !== null || this.host.selectedLandmark !== null || this.host.selectedFar !== null;
    this.followBtn.classList.toggle('active', camera.mode === 'orbit' && (selected ? camera.target === selected : pointSel && camera.anchor !== null));
    this.followBtn.disabled = !selected && !pointSel;
    const landed = this.host.landedOn;
    const landHere = landed !== null && landed === selected;
    this.landBtn.hidden = !landHere && !this.host.canLand(selected);
    const landLabel = landHere ? _('Take off') : _('Land');
    if (this.landBtn.textContent !== landLabel) { this.landBtn.textContent = landLabel; this.landBtn.title = landHere ? _('Back up to orbit (I)') : _('Land on the surface (I)'); }
    this.landBtn.classList.toggle('active', landHere);
    // the phone bar mirrors the card's actions: Land where one can, Center otherwise
    this.cbFollow.classList.toggle('active', this.followBtn.classList.contains('active'));
    this.cbFollow.disabled = this.followBtn.disabled;
    if (this.cbLand.hidden !== this.landBtn.hidden) { this.cbLand.hidden = this.landBtn.hidden; this.cbCenter.hidden = !this.landBtn.hidden; }
    if ($('cb-land-label').textContent !== landLabel) $('cb-land-label').textContent = landLabel;
    const sub = this.infoType.textContent ?? '';
    if (this.infoSub.textContent !== sub) this.infoSub.textContent = sub;
    this.timeSheet.update();
    // auto-hide switched on or off (settings, the More sheet)
    const autoHide = this.host.settings.autoHideUI;
    if (autoHide !== this.autoHideWas) {
      this.autoHideWas = autoHide;
      if (autoHide) { this.showToast(_('The controls hide while you look around. Tap the scene to bring them back.'), 4000); this.armIdle(); }
      else this.setChrome(true);
    }
    if (this.chromeOff && (this.currentTab() !== 'explore' || this.infoOpen)) this.setChrome(true);

    const u = this.host.universe;
    const sys = u.current;
    const sysLabel = sys.catalogIndex === 0 ? _('Solar System') : _('{name} system', { name: sys.star.name });
    const gal = u.currentGalaxy;
    const dSunPc = this.host.camera.position.length() / PARSEC_KM;
    const scaleLabel = dSunPc > 3.0e9 ? _('Observable universe') : dSunPc > 3.0e8 ? _('Supercluster scale') : _('Intergalactic space');
    const label = gal === null ? `${scaleLabel} · ${sysLabel}` : gal === 0 ? sysLabel : `${u.galaxies.name(gal)} · ${sysLabel}`;
    if (this.brandSub.textContent !== label) this.brandSub.textContent = label;

    this.shareBtn.hidden = !(selected && sys.catalogIndex === 0);
    const isStar = selected?.data.type === 'star';
    if (this.euvBtn.hidden !== !isStar) this.euvBtn.hidden = !isStar;
    if (isStar && this.euvBtn.classList.contains('active') !== this.host.euv) {
      this.euvBtn.classList.toggle('active', this.host.euv);
      this.euvBtn.textContent = this.host.euv ? _('Back to visible light') : _('View in extreme ultraviolet (SDO)');
    } else if (isStar && !this.euvBtn.textContent) {
      this.euvBtn.textContent = _('View in extreme ultraviolet (SDO)');
    }
    const galaxyOnly = !selected && this.host.selectedStar === null && this.host.selectedGalaxy !== null;
    if (this.coreBtn.hidden !== !galaxyOnly) this.coreBtn.hidden = !galaxyOnly;
    if (selected) {
      this.setInfoShown(true);
      if (now - this.lastInfoUpdate > 120) {
        this.lastInfoUpdate = now;
        this.renderInfo(selected, camDistanceToSelected);
      }
    } else if (this.host.selectedStar !== null) {
      this.setInfoShown(true);
      if (now - this.lastInfoUpdate > 250) {
        this.lastInfoUpdate = now;
        this.renderStarInfo(this.host.selectedStar);
      }
    } else if (this.host.selectedGalaxy !== null) {
      this.setInfoShown(true);
      if (now - this.lastInfoUpdate > 250) {
        this.lastInfoUpdate = now;
        this.renderGalaxyInfo(this.host.selectedGalaxy);
      }
    } else if (this.host.selectedLandmark !== null) {
      this.setInfoShown(true);
      if (now - this.lastInfoUpdate > 250) {
        this.lastInfoUpdate = now;
        this.renderLandmarkInfo(this.host.selectedLandmark);
      }
    } else if (this.host.selectedFar !== null) {
      this.setInfoShown(true);
      if (now - this.lastInfoUpdate > 250) {
        this.lastInfoUpdate = now;
        this.renderFarInfo(this.host.selectedFar);
      }
    } else {
      this.setInfoShown(false);
    }
    const h = this.host;
    const scopeKey = !this.infoShown ? null
      : `${h.universe.current.catalogIndex}|${selected?.id ?? ''}|${h.selectedStar ?? ''}|${h.selectedGalaxy ?? ''}|${h.selectedLandmark ?? ''}`;
    this.scope.sync(scopeKey, () => scopeTargetFor({
      universe: h.universe, selected, star: h.selectedStar, galaxy: h.selectedGalaxy, landmark: h.selectedLandmark,
    }), h.time.jd, now);
  }

  private renderGalaxyInfo(i: number): void {
    const u = this.host.universe;
    const g = u.galaxies;
    const core = u.galaxyCore(i);
    const coreLabel = core ? _('Fly to the central black hole: {name}', { name: core.entry.name }) : '';
    if (this.coreBtn.textContent !== coreLabel) this.coreBtn.textContent = coreLabel;
    const type = g.typeOf(i);
    this.infoName.textContent = g.name(i);
    this.infoType.textContent = `${_('Galaxy')} · ${_(g.typeLabel(i))}`;
    const source = g.sourceOf(i);
    const peculiar = !!g.handmade(i)?.pec;
    this.infoParent.textContent = i === 0 ? _('Our home galaxy') : g.isReal(i) ? _('Real galaxy catalogue') : _('Procedural cosmic web');

    const rel = u.galaxyRelative(i, this.host.camera.position);
    const camDist = rel.length();
    const distSunKm = g.distancePc(i) * PARSEC_KM;
    const R = g.radius[i];
    const absMag = g.absMag[i];
    const lum = Math.pow(10, (4.83 - absMag) / 2.5);
    const rows: Array<[string, string] | 'sep'> = [];
    rows.push(['Distance', `${fmtLightYears(camDist)} (${fmtDistance(camDist)})`]);
    rows.push(['Magnitude (from here)', fixed(this.host.galaxySprites.apparentMag(i), 1)]);
    rows.push(['Apparent radius', fmtDeg(this.host.galaxySprites.apparent(i).angRad * RAD, 2)]);
    rows.push('sep');
    rows.push(['Distance from the Sun', `${fmtLightYears(distSunKm)} (${fixed((g.distancePc(i) / 1e6), 3)} Mpc)`]);
    if (i !== 0) rows.push(...coordRows(g.position(i), null));
    rows.push(['Hubble type', g.typeGuessed(i) ? `${_(GALAXY_TYPE_LABEL[type])} (${_('estimated')})` : _(GALAXY_TYPE_LABEL[type])]);
    rows.push(['Diameter', `${fixed(((R * 2) / 1000), 1)} kpc (${fmtLightYears(R * 2 * PARSEC_KM)})`]);
    rows.push(['Absolute magnitude', fixed(absMag, 1)]);
    rows.push(['Luminosity', `${lum.toExponential(2)} L☉`]);
    rows.push(['Number of stars (estimate)', `~${(lum * 3).toExponential(1).replace('e+', '×10^')}`]);
    if (core) rows.push(['Central black hole', `~${core.entry.massSolar.toExponential(1).replace('e+', '×10^')} M☉`]);
    if (peculiar) rows.push(['Source', 'Hand-drawn after published images (approximate)']);
    else if (source === 'handmade') rows.push(['Source', 'Messier / NGC (approximate parameters)']);
    else if (source === 'ungc') rows.push(['Source', 'Updated Nearby Galaxy Catalog (Karachentsev+ 2013)']);
    else if (source === '2mrs' || source === '2mrs-cluster') rows.push(['Source', '2MASS Redshift Survey (Huchra+ 2012)']);
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    const desc = g.model(i).p.description ?? '';
    this.infoDesc.textContent = g.isReal(i) ? desc : `${desc} ${_('Not an observed object: generated deterministically to fill the gap between catalogues.')}`.trim();
  }

  private renderFarInfo(ref: FarRef): void {
    const f = this.host.farInfo(ref);
    const member = ref.member >= 0;
    this.infoName.textContent = f.name;
    this.infoType.textContent = member && f.typeCode !== null ? `${_('Galaxy')} · ${_(GALAXY_TYPE_LABEL[TYPE_BY_CODE[f.typeCode]])}` : f.kind;
    this.infoParent.textContent = member ? `${this.host.farInfo({ ...ref, member: -1 }).name} · ${_('Procedural cosmic web')}` : _('Procedural cosmic web');
    const rows: Array<[string, string] | 'sep'> = [];
    rows.push(['Distance', `${fmtLightYears(f.distKm)} (${fmtDistance(f.distKm)})`]);
    rows.push(['Magnitude (from here)', fixed(f.apparentMag, 1)]);
    rows.push(['Apparent radius', fmtDeg((f.radiusPc * PARSEC_KM / Math.max(f.distKm, 1)) * RAD, 2)]);
    rows.push('sep');
    rows.push(['Distance from the Sun', `${fmtLightYears(f.distSunPc * PARSEC_KM)} (${fixed(f.distSunPc / 1e6, 1)} Mpc)`]);
    rows.push(...coordRows(this.host.farPositionPc(ref), farKey(ref)));
    if (f.coreMassSolar > 0) rows.push([member ? 'Central black hole' : 'Black hole of its brightest galaxy', `~${f.coreMassSolar.toExponential(1).replace('e+', '×10^')} M☉`]);
    if (member) {
      rows.push(['Hubble type', f.typeCode !== null ? _(GALAXY_TYPE_LABEL[TYPE_BY_CODE[f.typeCode]]) : '—']);
      rows.push(['Diameter', `${fixed((f.radiusPc * 2) / 1000, 1)} kpc (${fmtLightYears(f.radiusPc * 2 * PARSEC_KM)})`]);
      rows.push(['Absolute magnitude', fixed(f.absMag, 1)]);
      rows.push(['Luminosity', `${f.luminosity.toExponential(2)} L☉`]);
      rows.push(['Number of stars (estimate)', `~${(f.luminosity * 3).toExponential(1).replace('e+', '×10^')}`]);
    } else {
      rows.push(['Radius', `${fixed(f.radiusPc / 1e6, 2)} Mpc (${fmtLightYears(f.radiusPc * PARSEC_KM)})`]);
      rows.push(['Member galaxies (estimated)', `~${f.richness}`]);
      rows.push(['Total luminosity', `${f.luminosity.toExponential(2)} L☉`]);
      rows.push(['Mass (estimated)', `~${f.massSolar.toExponential(1).replace('e+', '×10^')} M☉`]);
      rows.push(['Members', f.resolved ? _('resolved · clickable') : _('resolves when you approach')]);
    }
    rows.push(['Light delay', fmtDuration(f.distKm / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = member
      ? _('A member galaxy of a distant cluster: its position, type and luminosity are derived from the cluster’s richness. Not an observed object.')
      : _('A node of the cosmic web beyond the local galaxy catalogue: its richness and mass are generated with consistent statistics and do not correspond to a catalogue entry. It resolves into member galaxies as you approach.');
  }

  private renderLandmarkInfo(i: number): void {
    const u = this.host.universe;
    const l = u.landmarks[i];
    const d = l.def;
    this.infoName.textContent = d.name;
    this.infoType.textContent = _(LANDMARK_KIND_LABEL[d.kind]);
    this.infoParent.textContent = `${u.galaxies.name(l.galaxy)} · ${d.procedural ? _('procedural discovery') : _('real object')}`;
    const rel = u.landmarkRelative(i, this.host.camera.position);
    const camDist = rel.length();
    const rows: Array<[string, string] | 'sep'> = [];
    rows.push(['Distance', `${fmtLightYears(camDist)} (${fmtDistance(camDist)})`]);
    rows.push(['Apparent radius', fmtDeg(this.host.landmarkSprites.angularRadius(i) * RAD, 2)]);
    const appMag = d.absMag + 5 * Math.log10(Math.max(camDist / PARSEC_KM, 1e-7)) - 5;
    rows.push(['Magnitude (from here)', fixed(appMag, 1)]);
    rows.push('sep');
    rows.push(['Distance from the Sun', fmtLightYears(l.positionPc.length() * PARSEC_KM)]);
    rows.push(...coordRows(l.positionPc, d.procedural ? d.id : null));
    rows.push(['Radius (visual)', fmtLightYears(d.radiusPc * PARSEC_KM)]);
    rows.push(['Absolute magnitude', fixed(d.absMag, 1)]);
    rows.push('sep');
    for (const [k, v] of Object.entries(d.facts)) rows.push([k, v]);
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = d.procedural
      ? `${d.description} ${_('Not an observed object: generated deterministically from the galaxy model; it is always found at the same place under this id.')}`
      : `${d.description} ${_('(Visual: a procedural representation at the real position and size; not a photograph.)')}`;
  }

  private renderStarInfo(id: StarId): void {
    const u = this.host.universe;
    const s = u.starInfo(id);
    const ci = catalogIndexOf(id);
    const isBH = u.blackHole(id) !== undefined;
    const isExtra = u.extraSystem(id) !== undefined;
    const isProc = ci < 0 && !isExtra;
    const bd = u.brownDwarf(id);
    const dwarf = ci >= 0 ? u.catalog.colouredDwarf(ci) : undefined;
    this.infoName.textContent = s.name;
    this.infoType.textContent = isBH
      ? _('Black hole system')
      : bd
        ? s.massSolar < HYDROGEN_BURNING_LIMIT ? _('Brown dwarf') : _('Ultracool dwarf')
        : _('Star') + ' · ' + (s.isWhiteDwarf ? _('White dwarf') : _(LUM_CLASS_DESC[s.lumClass] ?? ''));
    const galName = ci < 0 ? u.galaxies.name(u.galaxyOfStar(id)) : '';
    this.infoParent.textContent = isExtra ? `${_('Real object')} · ${galName}` : isProc ? `${_('Procedural star')} · ${galName}` : s.names?.constellation ? _('constellation {name}', { name: s.names.constellation }) : _('Star catalogue (HYG)');

    const rel = u.starRelative(id, this.host.camera.position);
    const camDist = rel.length();
    const rows: Array<[string, string] | 'sep'> = [];
    rows.push(['Distance', fmtDistance(camDist)]);
    const appMag = this.host.starApparentMag(id) ?? (s.absMag + 5 * Math.log10(Math.max(camDist / PARSEC_KM, 1e-7)) - 5);
    rows.push(['Magnitude (from here)', fixed(appMag, 2)]);
    rows.push('sep');
    rows.push(['Distance from the Sun', isProc ? fmtLightYears(s.distancePc * PARSEC_KM) : `${fixed((s.distancePc * PARSEC_KM / LIGHT_YEAR_KM), 2)} ly (${fixed(s.distancePc, 2)} pc)`]);
    if (s.distancePc > 0) rows.push(...coordRows(u.starPositionPc(id), isProc || isBH ? id : null));
    rows.push(['Spectral class', s.catalogSpectral || s.spectral]);
    if (!isProc) rows.push(['Magnitude (from Earth)', fixed(s.mag, 2)]);
    rows.push(['Absolute magnitude', fixed(s.absMag, 2)]);
    rows.push(['B−V colour', fixed(s.bv, 2)]);
    if (dwarf) rows.push(['Perceived colour', `${_(dwarf.label)} (${dwarf.hex})`]);
    rows.push('sep');
    rows.push(['Temperature*', `${fixed(s.temperature, 0)} K`]);
    rows.push(['Luminosity*', `${s.luminosity >= 1 ? fixed(s.luminosity, 2) : s.luminosity.toPrecision(3)} L☉`]);
    rows.push(['Radius*', `${fixed(s.radiusSolar, 2)} R☉`]);
    rows.push(['Mass*', `${fixed(s.massSolar, 2)} M☉`]);
    if (s.hip) rows.push(['Hipparcos', `HIP ${s.hip}`]);
    if (s.names?.bayer) rows.push(['Bayer / Flamsteed', s.names.bayer]);
    if (s.names?.gliese) rows.push(['Gliese', s.names.gliese]);
    if (bd?.young) rows.push(['Age', _('Young (low surface gravity)')]);
    rows.push('sep');
    const sys = u.system(id);
    // companions: "İkili sistem · B: beyaz cüce (DA)"
    const comps = sys.bodies.filter((b) => b !== sys.star && (b.data.type === 'star' || b.data.type === 'pulsar' || b.data.type === 'blackhole') && b.data.orbit);
    if (comps.length) {
      const order = comps.length === 1 ? 'Binary system' : comps.length === 2 ? 'Triple system' : comps.length === 3 ? 'Quadruple system' : 'Multiple system';
      const list = comps.map((b) => {
        const f = b.data.facts ?? {};
        const label = b.name.startsWith(sys.star.name.replace(/ [A-Z]$/, '')) ? b.name.slice(b.name.lastIndexOf(' ') + 1) : b.name;
        const cls = f['Class'] ? _(f['Class']).toLocaleLowerCase(localeTag()) : b.data.type === 'blackhole' ? _('black hole') : b.data.type === 'pulsar' ? _('neutron star') : '';
        return `${label}: ${cls}${f['Spectral class'] ? ` (${f['Spectral class']})` : ''}`;
      });
      rows.push(['Companion stars', `${_(order)} · ${list.join(' · ')}`]);
    }
    const planets = sys.bodies.filter((b) => b.data.type === 'planet' || b.data.type === 'dwarf').length;
    const moons = sys.bodies.filter((b) => b.data.type === 'moon').length;
    rows.push(['Planets', planets ? `${planets}${moons ? ` ${_('(+{n} moons)', { n: moons })}` : ''}` : 'None']);
    if (sys.belts.length) rows.push(['Belts', sys.belts.map((b) => _(b.name)).join(', ')]);
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);

    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = isProc
      ? `${_(sys.star.data.description ?? '')} ${_('Not an observed object: generated deterministically to fill the gap between catalogues.')} ${_('(* This star is generated deterministically from the density model of the {galaxy} galaxy; its identity is persistent — return to the same place and you will find the same star.)', { galaxy: galName })}`
      : bd && !u.exoplanets.host(ci)
        ? `${_(sys.star.data.description ?? '')} ${_('(* Temperature, mass and radius are derived from the measured spectral type (UltracoolSheet); the mass depends on the age and is quite uncertain.)')}`
        : u.hasMeasuredInfo(id)
        ? `${_(sys.star.data.description ?? '')} ${_('(* Values from spectroscopic and orbital measurements; they replace the catalogue estimates.)')}`
        : `${_(sys.star.data.description ?? '')} ${_('(* Estimates derived from magnitude, distance and B−V colour.)')}`;
    if (dwarf) this.infoDesc.textContent = `${_(dwarf.note)} ${this.infoDesc.textContent}`;
  }

  private renderInfo(b: CelestialBody, camDist: number): void {
    const u = this.host.universe;
    const star = u.star;
    const starTemp = u.current.starTemperature;
    this.infoName.textContent = b.name;
    this.infoType.textContent = typeLabel(b.data.type);
    const partner = binaryPartner(b);
    this.infoParent.textContent = partner
      ? _('Binary system with {name}', { name: partner.name })
      : b.parent ? _('In the {name} system', { name: b.parent.name }) : _('System centre');

    const rows: Array<[string, string] | 'sep'> = [];
    if (b.data.type === 'spacecraft') {
      this.renderSpacecraftInfo(b, camDist, rows);
      return;
    }
    if (b.data.type === 'barycenter') {
      this.renderBarycenterInfo(b, camDist, rows);
      return;
    }
    if (b.data.type === 'blackhole') {
      this.renderBlackHoleInfo(b, camDist, rows);
      return;
    }
    if (b.data.type === 'pulsar') {
      this.renderPulsarInfo(b, camDist, rows);
      return;
    }
    rows.push(['Distance from camera', fmtDistance(camDist)]);
    rows.push(['Distance to surface', fmtDistance(this.host.landedOn === b ? this.host.camera.altitude : Math.max(0, camDist - b.radius))]);
    rows.push('sep');
    // beyond the Solar System: where the world is on the sky, and its id (`star/body`, searchable)
    if (u.current.starId !== 'c0') {
      const posPc = new Vector3().copy(u.current.origin).add(b.position).multiplyScalar(1 / PARSEC_KM);
      const coords = coordRows(posPc, `${u.current.starId}/${b.id}`);
      if (coords.length) rows.push(...coords, 'sep');
    }
    rows.push(['Mean radius', fmtRadius(b.radius, b.data.type !== 'star')]);
    if (b.data.flattening) rows.push(['Flattening', fixed(b.data.flattening, 4)]);
    rows.push(['Mass', fmtMass(b.data.mass)]);
    rows.push(['Density', `${fixed(b.density, 2)} g/cm³`]);
    rows.push(['Surface gravity', `${fixed(b.surfaceGravity, 2)} m/s² (${fixed((b.surfaceGravity / 9.80665), 2)} g)`]);
    rows.push(['Escape velocity', `${fixed(b.escapeVelocity, 2)} km/s`]);
    if (b.data.albedo !== undefined) rows.push(['Albedo', fixed(b.data.albedo, 2)]);
    const temp = b.data.temperature ?? (b.parent ? b.equilibriumTemperature(star.radius, starTemp) : 0);
    rows.push([b.data.temperature ? 'Surface temperature' : 'Equilibrium temperature', fmtTemp(temp)]);
    rows.push('sep');
    if (b.resolved && b.parent) {
      const r = b.resolved;
      rows.push(['Orbital period', b.periodDisplay()]);
      rows.push(['Semi-major axis', isPrimaryType(b.parent.data.type) ? `${fixed((r.a / AU_KM), 4)} AU` : fmtDistance(r.a)]);
      rows.push(['Eccentricity', fixed(r.e, 4)]);
      rows.push(['Inclination', fmtDeg(r.i * RAD)]);
      rows.push(['Longitude of node', fmtDeg(((r.node * RAD) % 360 + 360) % 360)]);
      rows.push(['Perihelion', isPrimaryType(b.parent.data.type) ? `${fixed(((r.a * (1 - r.e)) / AU_KM), 4)} AU` : fmtDistance(r.a * (1 - r.e))]);
      rows.push(['Aphelion', isPrimaryType(b.parent.data.type) ? `${fixed(((r.a * (1 + r.e)) / AU_KM), 4)} AU` : fmtDistance(r.a * (1 + r.e))]);
      rows.push(['Current orbital speed', `${fixed(b.orbitalSpeed, 3)} km/s`]);
      rows.push([_("Distance to {name}", { name: b.parent.name }), fmtDistance(b.localPosition.length())]);
      if (!isPrimaryType(b.parent.data.type)) rows.push([_("Distance to {name}", { name: star.name }), `${fixed((b.distanceToStar / AU_KM), 4)} AU`]);
      rows.push(['Sphere of influence (SOI)', fmtDistance(b.soiRadius)]);
      rows.push('sep');
    }
    rows.push(['Sidereal day', b.data.rotationPeriod === 'sync' ? `${b.siderealDayDisplay} ${_('(locked)')}` : b.siderealDayDisplay]);
    if (typeof b.data.rotationPeriod === 'number' && b.data.rotationPeriod < 0) rows.push(['Rotation', 'Retrograde']);
    if (b.parent) {
      const tilt = Math.acos(Math.min(1, Math.max(-1, b.pole.dot(b.orbitNormal)))) * RAD;
      rows.push(['Axial tilt', fmtDeg(tilt, 1)]);
    }
    if (b.data.rings) rows.push(['Rings', `${fmtDistance(b.data.rings.inner)} – ${fmtDistance(b.data.rings.outer)}`]);
    if (b.data.atmosphere) rows.push(['Atmosphere', b.data.atmosphere.density >= 1 ? 'Dense' : b.data.atmosphere.density > 0.3 ? 'Moderate' : 'Thin']);
    if (b.children.length) rows.push(['Moons (catalogue)', String(b.children.length)]);
    if (b.data.facts) {
      rows.push('sep');
      for (const [k, v] of Object.entries(b.data.facts)) rows.push([k, v]);
    }
    if (b.parent && camDist > 0) {
      const lightTime = camDist / 299_792.458;
      rows.push(['Light delay', fmtDuration(lightTime)]);
    }

    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = _(b.data.description ?? '');
  }

  private renderBarycenterInfo(b: CelestialBody, camDist: number, rows: Array<[string, string] | 'sep'>): void {
    this.infoParent.textContent = _('System centre');
    rows.push(['Distance from camera', fmtDistance(camDist)]);
    rows.push('sep');
    rows.push(['Total mass', fmtSolarMass(b.data.mass / SUN_MASS_KG)]);
    const comps = b.children.filter((c) => c.resolved);
    for (const c of comps) {
      const frac = c.data.mass / b.data.mass;
      rows.push([c.name, `${fmtSolarMass(c.data.mass / SUN_MASS_KG)} · ${_('{n}%', { n: fixed(frac * 100, 1) })}`]);
    }
    const first = comps[0];
    if (first?.resolved) {
      rows.push('sep');
      rows.push(['Orbital period', first.periodDisplay()]);
      const aTotal = comps.reduce((s, c) => s + (c.resolved?.a ?? 0), 0);
      rows.push(['Separation of the components', aTotal > AU_KM * 0.05 ? `${fixed(aTotal / AU_KM, 3)} AU` : fmtDistance(aTotal)]);
      for (const c of comps) rows.push([_("Orbit radius of {name}", { name: c.name }), c.resolved!.a > AU_KM * 0.05 ? `${fixed(c.resolved!.a / AU_KM, 3)} AU` : fmtDistance(c.resolved!.a)]);
      rows.push(['Eccentricity', fixed(first.resolved.e, 3)]);
    }
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = _('The common centre of mass of the binary: both components circle this invisible point, on orbits whose sizes are inversely proportional to their masses, always on opposite sides of it. The heavy component traces a small orbit, the light one a large orbit.');
  }

  private renderBlackHoleInfo(b: CelestialBody, camDist: number, rows: Array<[string, string] | 'sep'>): void {
    const rs = b.radius;
    const mSun = b.data.mass / SUN_MASS_KG;
    const partner = binaryPartner(b) ?? b.parent;
    this.infoParent.textContent = partner ? _('Binary system with {name}', { name: partner.name }) : _('System centre');
    rows.push(['Distance from camera', fmtDistance(camDist)]);
    rows.push(['Distance to event horizon', `${fmtDistance(Math.max(0, camDist - rs))} (${fixed((camDist / rs), 1)} r_s)`]);
    rows.push('sep');
    rows.push(['Mass', fmtSolarMass(mSun)]);
    rows.push(['Schwarzschild radius', fmtDistance(rs)]);
    rows.push(['Photon sphere', `${fmtDistance(rs * 1.5)} (${fmtNum(1.5)} r_s)`]);
    rows.push(['ISCO (innermost stable orbit)', `${fmtDistance(rs * 3)} (3 r_s)`]);
    rows.push(['Shadow diameter', `${fmtDistance(rs * 5.196)} (√27 r_s)`]);
    const hawking = 6.17e-8 / mSun;
    rows.push(['Hawking temperature', hawking >= 1e-3 ? `${hawking.toExponential(2)} K` : `${hawking.toExponential(1)} K`]);
    const evap = 2.1e67 * mSun ** 3;
    rows.push(['Evaporation time', _('{n} years', { n: evap.toExponential(1) })]);
    if (b.data.appearance.kind === 'blackhole') {
      const d = b.data.appearance.disk;
      rows.push(['Accretion disc', d.brightness > 0 ? `${d.inner}–${d.outer} r_s · ~${fmtNum(d.temperature)} K` : 'None (dormant)']);
    }
    rows.push('sep');
    if (b.resolved && b.parent) {
      const r = b.resolved;
      rows.push(['Orbital period', b.periodDisplay()]);
      rows.push(['Semi-major axis', `${fixed((r.a / AU_KM), 3)} AU`]);
      rows.push(['Eccentricity', fixed(r.e, 3)]);
      rows.push(['Current orbital speed', `${fixed(b.orbitalSpeed, 1)} km/s`]);
      rows.push('sep');
    } else if (b.children.length) {
      rows.push(['Orbiting stars', b.children.map((c) => c.name).join(', ')]);
      rows.push('sep');
    }
    if (b.data.facts) for (const [k, v] of Object.entries(b.data.facts)) if (k !== 'Mass') rows.push([k, v]);
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = `${_(b.data.description ?? '')} ${_('Rendering: real-time screen-space tracing of light paths (null geodesics) in the Schwarzschild metric; Doppler beaming and gravitational redshift are applied to the disc.')}`;
  }

  private renderPulsarInfo(b: CelestialBody, camDist: number, rows: Array<[string, string] | 'sep'>): void {
    const a = b.data.appearance.kind === 'pulsar' ? b.data.appearance : null;
    const P = b.rotationPeriodS; // s
    const mSun = b.data.mass / SUN_MASS_KG;
    const partner = binaryPartner(b) ?? b.parent;
    this.infoParent.textContent = partner ? _('Binary system with {name}', { name: partner.name }) : _('System centre');
    rows.push(['Distance from camera', fmtDistance(camDist)]);
    rows.push(['Distance to surface', fmtDistance(Math.max(0, camDist - b.radius))]);
    rows.push('sep');
    const periodTxt = P >= 1 ? `${fixed(P, 4)} s` : `${fixed((P * 1e3), 3)} ms`;
    rows.push(['Rotation period', `${periodTxt} (${fixed((1 / P), P >= 1 ? 3 : 1)} Hz)`]);
    const vEq = (2 * Math.PI * b.radius) / P;
    rows.push(['Equatorial speed', `${fmtNum(vEq, { maximumFractionDigits: 0 })} km/s (${_('{n}% c', { n: fixed(vEq / 299_792.458 * 100, 1) })})`]);
    if (a) rows.push(['Magnetic axis tilt', a.quiet ? '— (no beam)' : fmtDeg(a.magneticTilt, 0)]);
    rows.push('sep');
    rows.push(['Mass', fmtSolarMass(mSun)]);
    rows.push(['Radius', `${fixed(b.radius, 0)} km`]);
    rows.push(['Density', fmtSci(b.density * 1e3, 'kg/m³')]);
    rows.push(['Surface gravity', fmtSci(b.surfaceGravity / 9.80665, 'g')]);
    rows.push(['Escape velocity', `${fmtNum(b.escapeVelocity, { maximumFractionDigits: 0 })} km/s (${_('{n}% c', { n: fixed(b.escapeVelocity / 299_792.458 * 100, 0) })})`]);
    const rs = (2 * 6.674e-11 * b.data.mass) / (299_792_458 ** 2) / 1e3;
    rows.push(['Schwarzschild radius', `${fixed(rs, 2)} km (R / r_s = ${fixed((b.radius / rs), 1)})`]);
    if (b.data.temperature) rows.push(['Surface temperature', _('{n} million K', { n: fixed((b.data.temperature / 1e6), 1) })]);
    rows.push('sep');
    if (b.resolved && b.parent) {
      const r = b.resolved;
      rows.push(['Orbital period', b.periodDisplay()]);
      rows.push(['Semi-major axis', fmtDistance(r.a)]);
      rows.push(['Eccentricity', fixed(r.e, 3)]);
      rows.push(['Current orbital speed', `${fixed(b.orbitalSpeed, 1)} km/s`]);
      rows.push('sep');
    } else if (b.children.length) {
      rows.push(['Orbiting bodies', b.children.map((c) => c.name).join(', ')]);
      rows.push('sep');
    }
    if (b.data.facts) for (const [k, v] of Object.entries(b.data.facts)) if (k !== 'Mass' && k !== 'Period') rows.push([k, v]);
    rows.push(['Light delay', fmtDuration(camDist / 299_792.458)]);
    this.infoBody.innerHTML = rowsHtml(rows);
    this.infoDesc.textContent = `${_(b.data.description ?? '')} ${_('Rendering: two beam cones along a magnetic axis tilted from the spin axis; the brightness pulses each time a cone sweeps across the line of sight (lighthouse effect). Beam geometry is schematic.')}`;
  }

  private renderSpacecraftInfo(b: CelestialBody, camDist: number, rows: Array<[string, string] | 'sep'>): void {
    const u = this.host.universe;
    const star = u.star;
    const earth = u.current.byId.get('earth');
    const o = b.data.orbit;
    const mission = o?.kind === 'trajectory' ? this.host.missions.byBody(b) : undefined;
    this.infoParent.textContent = o?.kind === 'surface' ? _('On the surface of {name}', { name: b.parent!.name })
      : o?.kind === 'lagrange' ? _('{a}–{b} {point} point', { a: star.name, b: b.parent!.name, point: o.point })
      : o?.kind === 'linear' ? _('Interstellar / hyperbolic trajectory')
      : mission ? `${_('Mission')}: ${mission.plan.originName} → ${mission.plan.targetName}`
      : b.parent ? _('In orbit around {name}', { name: b.parent.name }) : '';
    if (mission) {
      rows.push(['Phase', mission.phase ? phaseLabel(mission.phase, mission.plan) : '—']);
      const jd = this.host.time.jd;
      const eta = (mission.plan.arrivalJd - jd) * 86400;
      rows.push(['Arrival', eta > 0 ? _('in {t}', { t: fmtDuration(eta) }) : 'arrived']);
      rows.push([_('Speed (relative to {name})', { name: star.name }), fmtSpeed(b.orbitalSpeed)]);
      rows.push(['Distance from camera', fmtDistance(camDist)]);
      rows.push('sep');
      rows.push(['Path / duration', `${fmtDistance(mission.plan.distanceKm)} · ${fmtDuration(mission.plan.durationS)}`]);
      if (Number.isFinite(mission.plan.budget)) rows.push(['Δv total / budget', `${fixed(mission.plan.dvTotal, 2)} / ${fixed(mission.plan.budget, 2)} km/s`]);
      if (b.data.facts) {
        rows.push('sep');
        for (const [k, v] of Object.entries(b.data.facts)) rows.push([k, v]);
      }
      this.infoBody.innerHTML = rowsHtml(rows);
      const model = mission.plan.ship.model;
      this.infoDesc.textContent = `${_(b.data.description ?? '')} ${model.kind === 'glb' ? `${_('3D model: NASA 3D Resources')}${model.representative ? ' ' + _('(schematic)') : ''}.` : _('The model is an original, schematic representation.')} ${_('Route computed with the patched-conic approximation.')}`;
      return;
    }

    rows.push(['Distance from camera', fmtDistance(camDist)]);
    rows.push('sep');
    const au = (km: number) => km > AU_KM * 0.05
      ? `${fixed((km / AU_KM), km > AU_KM ? 2 : 4)} AU`
      : `${fmtDistance(km)} (${fixed((km / AU_KM), 4)} AU)`;
    rows.push([_("Distance to {name}", { name: star.name }), au(b.distanceToStar)]);
    if (earth && b !== earth) {
      const dEarth = b.position.distanceTo(earth.position);
      rows.push(['Distance from Earth', au(dEarth)]);
      rows.push(['Light delay (Earth)', fmtDuration(dEarth / 299_792.458)]);
    }
    if (o?.kind === 'linear') {
      rows.push([_('Speed (relative to {name})', { name: star.name }), `${fixed(b.orbitalSpeed, 2)} km/s (${fixed((b.orbitalSpeed * 3600), 0)} ${_('km/h')})`]);
      rows.push(['Orbit', 'Unbound – leaving the Solar System']);
    } else if (o?.kind === 'surface') {
      rows.push(['Position', `${fixed(Math.abs(o.lat), 4)}° ${o.lat >= 0 ? _('N') : _('S')}, ${fixed(Math.abs(o.lon), 4)}° ${o.lon >= 0 ? _('E') : _('W')}`]);
    } else if (b.parent && b.resolved) {
      const r = b.resolved;
      rows.push(['Orbital period', b.periodDisplay()]);
      if (b.parent !== star) rows.push([_("Distance to {name}", { name: b.parent.name }), fmtDistance(b.localPosition.length())]);
      rows.push(['Periapsis / apoapsis', `${fmtDistance(r.a * (1 - r.e))} / ${fmtDistance(r.a * (1 + r.e))}`]);
      rows.push(['Inclination', fmtDeg(r.i * RAD)]);
      rows.push(['Current orbital speed', `${fixed(b.orbitalSpeed, 2)} km/s`]);
    } else if (b.parent) {
      rows.push([_("Distance to {name}", { name: b.parent.name }), fmtDistance(b.localPosition.length())]);
    }
    rows.push('sep');
    rows.push(['Mass', b.data.mass >= 1000 ? `${fmtNum(b.data.mass / 1000, { maximumFractionDigits: 1 })} ${_('t')}` : `${b.data.mass} kg`]);
    rows.push(['Size (radius)', `${fixed((b.radius * 1000), 1)} m`]);
    if (b.data.facts) {
      rows.push('sep');
      for (const [k, v] of Object.entries(b.data.facts)) rows.push([k, v]);
    }
    this.infoBody.innerHTML = rowsHtml(rows);
    const rep = b.data.appearance.kind === 'spacecraft' && b.data.appearance.representative;
    const src = b.data.orbit?.kind === 'ephemeris'
      ? _('Position derived from JPL Horizons\' sampled trajectory table (simulation, not live telemetry);')
      : _('Position derived approximately from JPL Horizons data, October 2026;');
    this.infoDesc.textContent = `${_(b.data.description ?? '')} ${src} ${_('3D model: NASA 3D Resources')}${rep ? ' ' + _('(schematic)') : ''}.`;
  }
}
