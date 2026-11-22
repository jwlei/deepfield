import { Vector3 } from 'three';
import { AU_KM, C_KM_S, DAY_S, DEG, G, OBLIQUITY_J2000, RAD, YEAR_D } from '../core/constants';
import { SUN_MASS_KG, SUN_RADIUS_KM } from '../astro/stellar';
import { raDecToEclipticMath, raDecToScene } from '../math/frames';
import { _, fixed, fmtNum } from '../i18n';
import type { StarInfo } from './StarCatalog';
import type { BodyData, PoleRaDec, SimpleElements } from './types';

/** Schwarzschild radius (km) for a mass in solar masses */
export function schwarzschildKm(massSolar: number): number {
  return (2 * G * massSolar * SUN_MASS_KG) / ((C_KM_S * 1e3) ** 2) / 1e3;
}

/** Semi-major axis (km) from period (days) and total mass (kg) */
export function semiMajorKm(periodDays: number, totalMassKg: number): number {
  const T = periodDays * DAY_S;
  return Math.cbrt((G * totalMassKg * T * T) / (4 * Math.PI * Math.PI)) / 1e3;
}

/**
 * Astrometric (sky-plane) orbital elements → ecliptic J2000 elements.
 * Sky frame at the target: x = north, y = east, z = line of sight away from the observer;
 * Ω is the position angle of the ascending node (from north through east), i the tilt of the
 * orbit against the sky plane.
 */
function skyElementsToEcliptic(ra: number, dec: number, i: number, Omega: number, omega: number): { i: number; node: number; argPeri: number } {
  const L = raDecToEclipticMath(ra, dec);
  // north direction (d/dδ of the unit vector), equatorial → ecliptic (rotate about x by −ε)
  const a = ra * DEG, d = dec * DEG;
  const nx = -Math.sin(d) * Math.cos(a), ny = -Math.sin(d) * Math.sin(a), nz = Math.cos(d);
  const ce = Math.cos(OBLIQUITY_J2000), se = Math.sin(OBLIQUITY_J2000);
  const N = new Vector3(nx, ce * ny + se * nz, -se * ny + ce * nz).normalize();
  const E = new Vector3().crossVectors(N, L).normalize();
  const si = Math.sin(i * DEG), ci = Math.cos(i * DEG);
  const sO = Math.sin(Omega * DEG), cO = Math.cos(Omega * DEG);
  const sw = Math.sin(omega * DEG), cw = Math.cos(omega * DEG);
  // orbit normal and periapsis direction in the (N, E, L) basis
  const h = new Vector3().addScaledVector(N, si * sO).addScaledVector(E, -si * cO).addScaledVector(L, ci);
  const e = new Vector3()
    .addScaledVector(N, cO * cw - sO * sw * ci)
    .addScaledVector(E, sO * cw + cO * sw * ci)
    .addScaledVector(L, sw * si);
  const inc = Math.acos(Math.min(1, Math.max(-1, h.z)));
  const n = Math.abs(Math.sin(inc)) < 1e-8 ? new Vector3(1, 0, 0) : new Vector3(-h.y, h.x, 0).normalize();
  const node = Math.atan2(n.y, n.x);
  const argPeri = Math.atan2(new Vector3().crossVectors(n, e).dot(h), n.dot(e));
  return { i: inc * RAD, node: ((node * RAD) % 360 + 360) % 360, argPeri: ((argPeri * RAD) % 360 + 360) % 360 };
}

/** JD of a decimal year */
export function decimalYearJd(y: number): number {
  const year = Math.floor(y);
  const jan1 = Date.UTC(year, 0, 1) / 86_400_000 + 2_440_587.5;
  return jan1 + (y - year) * YEAR_D;
}

interface Disk { inner: number; outer: number; temperature: number; brightness: number }

interface BlackHoleBodyOpts {
  id: string;
  name: string;
  massSolar: number;
  pole: PoleRaDec;
  disk: Disk;
  diskAbsMag: number;
  parent?: string;
  orbit?: SimpleElements;
  description: string;
  facts: Record<string, string>;
  discovered?: string;
}

function blackHoleBody(o: BlackHoleBodyOpts): BodyData {
  return {
    id: o.id,
    name: o.name,
    type: 'blackhole',
    parent: o.parent,
    radius: schwarzschildKm(o.massSolar),
    mass: o.massSolar * SUN_MASS_KG,
    rotationPeriod: 24,
    pole: o.pole,
    orbit: o.orbit,
    appearance: { kind: 'blackhole', seed: o.id.length * 7 + 3, disk: o.disk, diskAbsMag: o.diskAbsMag },
    description: o.description,
    discovered: o.discovered,
    facts: o.facts,
  };
}

/** Hand-made companion / S-star body (no procedural planets) */
export function starBody(id: string, name: string, massSolar: number, radiusSolar: number, temperature: number, description: string, facts: Record<string, string>, extra: Partial<BodyData> = {}): BodyData {
  return {
    id, name, type: 'star',
    radius: radiusSolar * SUN_RADIUS_KM,
    mass: massSolar * SUN_MASS_KG,
    rotationPeriod: 400,
    pole: { ra: 120, dec: 40 },
    appearance: { kind: 'star', temperature, seed: (id.length * 31) % 997 + 5 },
    temperature,
    description,
    facts,
    ...extra,
  };
}

/** Minimal StarInfo for a system whose primary is not in the HYG catalogue */
export function syntheticInfo(name: string, positionPc: Vector3, massSolar: number, radiusSolar: number, temperature: number, luminosity: number, spectral: string): StarInfo {
  const absMag = 4.83 - 2.5 * Math.log10(Math.max(luminosity, 1e-9));
  const d = positionPc.length();
  return {
    index: -1, name, names: null, hip: 0,
    position: positionPc.clone(), distancePc: d,
    mag: absMag + 5 * Math.log10(Math.max(d, 1e-3) / 10), absMag,
    bv: 0.6, temperature, luminosity, radiusSolar, radiusKm: radiusSolar * SUN_RADIUS_KM,
    massSolar, massKg: massSolar * SUN_MASS_KG, spectral, lumClass: 5, catalogSpectral: spectral, isWhiteDwarf: false,
  };
}

/* ------------------------------------------------------------------------------------------ */

/** A black hole and where it lives */
export interface BlackHoleEntry {
  /** universal id: `b{n}` for stand-alone systems */
  id: string;
  name: string;
  massSolar: number;
  /** body id inside its system */
  bodyId: string;
  /** host: a HYG catalogue star (search ref), or a stand-alone system around `position` */
  host:
    | {
        kind: 'catalog'; starRef: string; hostName?: string;
        /** measured parameters of the host star, replacing the photometric catalogue estimates */
        star?: HostStarOverride;
      }
    | { kind: 'system'; positionPc: (ctx: PositionContext) => Vector3 };
  /** bodies of a stand-alone system (root first) */
  bodies?: () => BodyData[];
  /** StarInfo of the primary for stand-alone systems */
  info?: (positionPc: Vector3) => StarInfo;
  /** galaxy index the system belongs to (0 = Milky Way) */
  galaxy?: (ctx: PositionContext) => number;
  /** body appended to a catalogue star's generated system */
  companionBody?: (starBodyId: string, starMassKg: number) => BodyData;
  summary: string;
}

/** Dynamically / spectroscopically measured values for a catalogue star (all optional) */
export interface HostStarOverride {
  massSolar?: number;
  radiusSolar?: number;
  temperature?: number;
  luminosity?: number;
  spectral?: string;
}

export interface PositionContext {
  milkyWayCenterPc: () => Vector3;
  galaxyPositionPc: (nameSubstring: string) => { index: number; position: Vector3 } | null;
  /** 3D point of a sky position inside a galaxy: sightline ∩ galaxy disc plane (pc) */
  galaxyPlanePoint: (nameSubstring: string, ra: number, dec: number) => Vector3;
}

const SGR_A: PoleRaDec = { ra: 266.4168, dec: -29.0078 };
const EPOCH_2020 = decimalYearJd(2020.0);

function sStar(id: string, name: string, massSolar: number, radiusSolar: number, temperature: number,
  aArcsec: number, e: number, i: number, Omega: number, omega: number, periodYr: number, tPeri: number, note: string): BodyData {
  const el = skyElementsToEcliptic(SGR_A.ra, SGR_A.dec, i, Omega, omega);
  const aKm = aArcsec * 8178 * AU_KM; // 1″ at 8.178 kpc = 8178 AU
  return starBody(id, name, massSolar, radiusSolar, temperature,
    `${note} Orbital elements from GRAVITY/VLT and Keck astrometry (converted from the plane of the sky to the ecliptic).`,
    { 'Orbital period': _('{n} years', { n: fixed(periodYr, 2) }), 'Eccentricity': fixed(e, 3), 'Pericentre passage': fmtNum(tPeri, { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    {
      parent: 'sgra',
      orbit: { kind: 'simple', a: aKm, e, i: el.i, node: el.node, argPeri: el.argPeri, M0: 0, epoch: decimalYearJd(tPeri), period: periodYr * YEAR_D, frame: 'ecliptic' },
    });
}

/** Stellar-mass black hole with a luminous companion in another galaxy (X-ray binary) */
function xrayBinary(o: {
  id: string; name: string; galaxy: string; ra: number; dec: number; massSolar: number; summary: string;
  companion: { name: string; massSolar: number; radiusSolar: number; temperature: number; spectral: string; luminosity: number };
  periodDays: number; inc: number; node: number; disk: Disk; diskAbsMag: number; description: string; facts: Record<string, string>; discovered?: string;
}): BlackHoleEntry {
  const c = o.companion;
  return {
    id: o.id, name: o.name, massSolar: o.massSolar, bodyId: o.id,
    host: { kind: 'system', positionPc: (ctx) => ctx.galaxyPlanePoint(o.galaxy, o.ra, o.dec) },
    galaxy: (ctx) => ctx.galaxyPositionPc(o.galaxy)?.index ?? 0,
    summary: o.summary,
    info: (p) => syntheticInfo(o.name, p, c.massSolar, c.radiusSolar, c.temperature, c.luminosity, c.spectral),
    bodies: () => [
      starBody(`${o.id}-star`, c.name, c.massSolar, c.radiusSolar, c.temperature,
        `Companion star of the black hole ${o.name}; gas overflowing its Roche lobe feeds the black hole's accretion disc.`,
        { 'Spectrum': c.spectral, 'Mass': `~${c.massSolar} M☉` }),
      blackHoleBody({
        id: o.id, name: o.name, massSolar: o.massSolar, parent: `${o.id}-star`,
        pole: { ra: o.ra, dec: o.dec + 60 > 90 ? o.dec - 60 : o.dec + 60 },
        disk: o.disk, diskAbsMag: o.diskAbsMag,
        orbit: {
          kind: 'simple', a: semiMajorKm(o.periodDays, (c.massSolar + o.massSolar) * SUN_MASS_KG), e: 0, i: o.inc, node: o.node, argPeri: 0, M0: 0,
          epoch: EPOCH_2020, period: o.periodDays, frame: 'ecliptic',
        },
        description: o.description, facts: o.facts, discovered: o.discovered,
      }),
    ],
  };
}

/** Supermassive black hole at the centre of a catalogue galaxy */
function galaxyCore(o: { id: string; name: string; galaxy: string; massSolar: number; pole: PoleRaDec; disk: Disk; diskAbsMag: number; summary: string; description: string; facts: Record<string, string>; discovered?: string }): BlackHoleEntry {
  return {
    id: o.id, name: o.name, massSolar: o.massSolar, bodyId: o.id,
    host: { kind: 'system', positionPc: (ctx) => ctx.galaxyPositionPc(o.galaxy)?.position ?? new Vector3() },
    galaxy: (ctx) => ctx.galaxyPositionPc(o.galaxy)?.index ?? 0,
    summary: o.summary,
    info: (p) => syntheticInfo(o.name, p, o.massSolar, 0, 1, 1e-4, 'SMBH'),
    bodies: () => [blackHoleBody({ id: o.id, name: o.name, massSolar: o.massSolar, pole: o.pole, disk: o.disk, diskAbsMag: o.diskAbsMag, description: o.description, facts: o.facts, discovered: o.discovered })],
  };
}

/**
 * The supermassive black hole of any other galaxy (procedural, survey or a far cluster's member),
 * built on demand. Its mass follows the black hole–bulge relation (M• ≈ 0.1–0.5 % of the bulge's
 * stellar mass, Kormendy & Ho 2013): a giant elliptical holds billions of suns, a bulgeless disc a
 * few hundred thousand to a million, a dwarf irregular perhaps an intermediate-mass hole. Whether
 * it is feeding (an AGN with a bright, hot disc) or quiet like Sgr A* is drawn from the seed.
 */
/**
 * Mass (M☉) of a galaxy's central black hole from the black hole–bulge relation (~0.2 % of the
 * bulge's stellar mass, bulge share by Hubble type, a factor-of-two scatter drawn from `seed`)
 */
export function nucleusMass(type: 'E' | 'S0' | 'S' | 'SB' | 'Irr', luminosity: number, seed: number): number {
  const u = ((Math.imul(seed ^ 0x9e3779b1, 0x85ebca6b) >>> 0) % 100_003) / 100_003;
  const bulge = { E: 1, S0: 0.6, SB: 0.3, S: 0.25, Irr: 0.03 }[type];
  return Math.max(1e5, 2 * luminosity * bulge * 0.002 * Math.pow(10, 0.6 * (u - 0.5)));
}

export function galaxyNucleus(o: { id: string; name: string; galaxyName: string; type: 'E' | 'S0' | 'S' | 'SB' | 'Irr'; luminosity: number; seed: number; pole: PoleRaDec }): BlackHoleEntry {
  const u = (k: number) => ((Math.imul(o.seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 100_003) / 100_003;
  const massSolar = nucleusMass(o.type, o.luminosity, o.seed);
  const active = u(2) < (o.type === 'E' || o.type === 'S0' ? 0.2 : 0.1);
  const disk = active
    ? { inner: 3, outer: Math.round(12 + 10 * u(3)), temperature: 15_000 + 25_000 * u(4), brightness: 0.85 + 0.15 * u(5) }
    : { inner: 3, outer: Math.round(10 + 8 * u(3)), temperature: 6000 + 6000 * u(4), brightness: 0.35 + 0.3 * u(5) };
  const diskAbsMag = active ? -12 - 6 * u(6) : 2 - 3 * u(6);
  const m = massSolar.toExponential(1).replace('e+', '×10^');
  const description = active
    ? _('The supermassive black hole at the centre of {g}: about {m} solar masses. It is an active galactic nucleus (AGN) right now: infalling gas heats to millions of kelvin and its disc shines as bright as all the galaxy\'s stars.', { g: o.galaxyName, m })
    : _('The supermassive black hole at the centre of {g}: about {m} solar masses. Quiet, like Sagittarius A*; the faint hot gas around it shows only up close.', { g: o.galaxyName, m });
  return {
    id: o.id, name: o.name, massSolar, bodyId: o.id,
    host: { kind: 'system', positionPc: () => new Vector3() },
    summary: 'The supermassive black hole at the galaxy\'s centre',
    bodies: () => [blackHoleBody({
      id: o.id, name: o.name, massSolar, pole: o.pole, disk, diskAbsMag, description,
      facts: { 'Mass': `~${m} M☉`, 'Event horizon radius': `${fmtNum(Math.round(schwarzschildKm(massSolar)))} km`, 'Status': active ? _('Active nucleus (AGN)') : _('Quiescent'), 'Source': _('Procedural (black hole–bulge relation)') },
    })],
  };
}

export const BLACK_HOLES: BlackHoleEntry[] = [
  {
    id: 'b0', name: 'Sagittarius A*', massSolar: 4.297e6, bodyId: 'sgra',
    host: { kind: 'system', positionPc: (c) => c.milkyWayCenterPc() },
    galaxy: () => 0,
    summary: 'The supermassive black hole at the centre of the Milky Way',
    info: (p) => syntheticInfo('Sagittarius A*', p, 4.297e6, 0, 1, 1e-6, 'SMBH'),
    bodies: () => [
      blackHoleBody({
        id: 'sgra', name: 'Sagittarius A*', massSolar: 4.297e6,
        // disk / spin axis: EHT favours a nearly face-on view (i ≲ 30°)
        pole: { ra: 86.4, dec: 52 },
        disk: { inner: 3, outer: 14, temperature: 9000, brightness: 0.55 },
        diskAbsMag: 2.0,
        description: 'The dynamical centre of the Milky Way: a supermassive black hole of 4.3 million solar masses. The orbits of the surrounding S-stars (S2, S38, S55) let us measure its mass directly; in 2022 the Event Horizon Telescope imaged its shadow. The event horizon is 12.7 million km across (~18 solar radii), its shadow 52 micro-arcseconds on the sky.',
        discovered: '1974 (Balick & Brown, radyo)',
        facts: {
          'Mass': '4.297 × 10⁶ M☉',
          'Distance': '8,178 pc (26,700 light-years)',
          'Shadow diameter': '~52 µas (EHT 2022)',
          'Nobel': '2020 — Genzel & Ghez (S-star orbits)',
          'Status': 'Quiet (low accretion)',
        },
      }),
      sStar('s2', 'S2', 14, 7, 28_000, 0.12540, 0.88466, 134.567, 228.171, 66.263, 16.0518, 2018.379,
        'A B-type star that passed 120 AU from Sgr A* in 2018 at 2.7% of the speed of light; Schwarzschild precession and gravitational redshift were first measured on its orbit.'),
      sStar('s38', 'S38', 10, 5, 22_000, 0.1406, 0.8201, 171.1, 101.06, 17.99, 19.2, 2003.19,
        'The second reference star: its 19-year orbit, lying almost in the plane of the sky, constrains the mass of Sgr A*.'),
      sStar('s55', 'S55 (S0-102)', 9, 4.5, 20_000, 0.1078, 0.7209, 150.1, 325.5, 331.5, 12.80, 2009.34,
        'One of the shortest-period S-stars known: one lap around Sgr A* every 12.8 years.'),
    ],
  },
  {
    id: 'b1', name: 'M87*', massSolar: 6.5e9, bodyId: 'm87star',
    host: { kind: 'system', positionPc: (c) => c.galaxyPositionPc('M87')?.position ?? new Vector3() },
    galaxy: (c) => c.galaxyPositionPc('M87')?.index ?? 0,
    summary: 'The first black hole ever imaged (EHT 2019), centre of Virgo A',
    info: (p) => syntheticInfo('M87*', p, 6.5e9, 0, 1, 1e-4, 'SMBH'),
    bodies: () => [
      blackHoleBody({
        id: 'm87star', name: 'M87*', massSolar: 6.5e9,
        // jet axis ~17° from the line of sight (toward us)
        pole: { ra: 10, dec: -4 },
        disk: { inner: 3, outer: 16, temperature: 7500, brightness: 0.9 },
        diskAbsMag: -8,
        description: 'The 6.5-billion-solar-mass giant at the centre of the galaxy Virgo A (M87); its event horizon spans 38 billion km (~6 times Pluto\'s orbit). This is the first black hole image, released by the Event Horizon Telescope in 2019: a ring of bright photons around a central shadow. It launches a relativistic jet 5,000 light-years long.',
        discovered: '1918 (jet, Curtis) · 2019 (shadow, EHT)',
        facts: {
          'Mass': '6.5 × 10⁹ M☉',
          'Distance': '16.4 Mpc (53.5 million light-years)',
          'Shadow diameter': '~42 µas (EHT 2019)',
          'Jet': '~5,000 light-years, 99% of the speed of light',
          'Status': 'Active galactic nucleus',
        },
      }),
    ],
  },
  {
    id: 'cygx1', name: 'Cygnus X-1', massSolar: 21.2, bodyId: 'cygx1',
    host: {
      kind: 'catalog', starRef: 'HIP 98298', hostName: 'HDE 226868',
      // Miller-Jones et al. 2021 (VLBA parallax): the supergiant is far heavier than its B−V colour suggests
      star: { massSolar: 40.6, radiusSolar: 22.3, temperature: 31_000, luminosity: 4.0e5, spectral: 'O9.7 Iab' },
    },
    summary: 'The first black hole discovered — an X-ray binary with HDE 226868',
    companionBody: (starId, starMassKg) => blackHoleBody({
      id: 'cygx1', name: 'Cygnus X-1', massSolar: 21.2, parent: starId,
      pole: { ra: 299.59, dec: 35.2 },
      disk: { inner: 3, outer: 28, temperature: 30_000, brightness: 1.6 },
      diskAbsMag: -3,
      orbit: {
        kind: 'simple', a: semiMajorKm(5.599829, starMassKg + 21.2 * SUN_MASS_KG), e: 0.018, i: 27.1, node: 0, argPeri: 0, M0: 0,
        epoch: EPOCH_2020, period: 5.599829, frame: 'ecliptic',
      },
      description: 'An X-ray source discovered by rocket in 1964; in 1971 it became the first black-hole candidate, identified as the invisible 21-solar-mass companion of the blue supergiant HDE 226868. Gas pulled from its companion heats to millions of degrees in the accretion disc and emits X-rays. It was the subject of the famous Hawking–Thorne bet.',
      discovered: '1964 (Aerobee rocket) · 1971 (identified as a black hole)',
      facts: {
        'Mass': '21.2 M☉',
        'Companion': 'HDE 226868 — O9.7 Iab blue supergiant, ~40 M☉',
        'Orbital period': '5.6 days',
        'Distance': '2,220 pc (7,240 light-years)',
        'Rotation': 'a* > 0.99 (near maximal)',
      },
    }),
  },
  {
    id: 'b2', name: 'Gaia BH1', massSolar: 9.62, bodyId: 'gaiabh1',
    host: { kind: 'system', positionPc: () => raDecToScene(262.1711, -0.5811).multiplyScalar(480) },
    galaxy: () => 0,
    summary: 'The nearest known black hole — quiet, no disc (lensing only)',
    info: (p) => syntheticInfo('Gaia BH1', p, 0.93, 0.99, 5850, 1.0, 'G V'),
    bodies: () => [
      starBody('gaiabh1-star', 'Gaia BH1 (companion star)', 0.93, 0.99, 5850,
        'A Sun-like G-type star; the astrometric "wobble" seen by the Gaia satellite revealed an invisible companion of 9.6 solar masses.',
        { 'Spectrum': 'G V', 'Mass': '0.93 M☉', 'Apparent magnitude': '13.8' }),
      blackHoleBody({
        id: 'gaiabh1', name: 'Gaia BH1', massSolar: 9.62, parent: 'gaiabh1-star',
        pole: { ra: 200, dec: 30 },
        disk: { inner: 3, outer: 8, temperature: 3000, brightness: 0 },
        diskAbsMag: 30,
        orbit: {
          kind: 'simple', a: semiMajorKm(185.59, (0.93 + 9.62) * SUN_MASS_KG), e: 0.451, i: 126.6, node: 97.8, argPeri: 12.8, M0: 0,
          epoch: EPOCH_2020, period: 185.59, frame: 'ecliptic',
        },
        description: 'The nearest known black hole to Earth (1,560 light-years). Since it swallows no matter it has no disc and no X-rays; its existence is known only from the orbit of its companion star (Gaia DR3, El-Badry et al. 2023). Here too, only the gravitational lensing of background stars and the shadow of its 28 km event horizon can be seen.',
        discovered: '2022 (Gaia DR3 astrometrisi)',
        facts: {
          'Mass': '9.62 M☉',
          'Distance': '480 pc (1,560 light-years)',
          'Orbital period': '185.6 days',
          'Separation': '1.4 AU',
          'Status': 'Dormant — no accretion',
        },
      }),
    ],
  },
  {
    id: 'b3', name: 'V404 Cygni', massSolar: 9.0, bodyId: 'v404',
    host: { kind: 'system', positionPc: () => raDecToScene(306.0159, 33.8672).multiplyScalar(2390) },
    galaxy: () => 0,
    summary: 'X-ray nova famous for its 2015 outburst',
    info: (p) => syntheticInfo('V404 Cygni', p, 0.7, 6.0, 4800, 16, 'K0 IV'),
    bodies: () => [
      starBody('v404-star', 'V404 Cygni (companion star)', 0.7, 6.0, 4800,
        'A K-type subgiant filling its Roche lobe; it circles the black hole every 6.5 days and feeds it matter.',
        { 'Spectrum': 'K0 IV', 'Mass': '~0.7 M☉' }),
      blackHoleBody({
        id: 'v404', name: 'V404 Cygni', massSolar: 9.0, parent: 'v404-star',
        pole: { ra: 306, dec: 60 },
        disk: { inner: 3, outer: 30, temperature: 14_000, brightness: 1.2 },
        diskAbsMag: -1,
        orbit: {
          kind: 'simple', a: semiMajorKm(6.4714, (0.7 + 9.0) * SUN_MASS_KG), e: 0, i: 67, node: 40, argPeri: 0, M0: 0,
          epoch: EPOCH_2020, period: 6.4714, frame: 'ecliptic',
        },
        description: 'A low-mass X-ray binary in Cygnus. During its 1989 and 2015 outbursts it became the brightest X-ray source in the sky within days; in 2015 its jets were seen to change direction within seconds (precession). The first black hole whose distance was measured directly by radio parallax.',
        discovered: '1989 (outburst seen by the Ginga satellite)',
        facts: {
          'Mass': '9.0 M☉',
          'Distance': '2,390 pc (7,800 light-years)',
          'Orbital period': '6.47 days',
          'Outbursts': '1938, 1956, 1989, 2015',
        },
      }),
    ],
  },
  {
    id: 'b4', name: 'A0620-00', massSolar: 6.6, bodyId: 'a0620',
    host: { kind: 'system', positionPc: () => raDecToScene(95.6855, -0.3458).multiplyScalar(1060) },
    galaxy: () => 0,
    summary: 'A quiet X-ray nova in Monoceros (V616 Mon)',
    info: (p) => syntheticInfo('A0620-00', p, 0.4, 0.67, 4200, 0.08, 'K5 V'),
    bodies: () => [
      starBody('a0620-star', 'V616 Monocerotis (companion star)', 0.4, 0.67, 4200,
        'A K-type dwarf; on its 7.75-hour orbit it keeps losing gas to the black hole.',
        { 'Spectrum': 'K5 V', 'Mass': '~0.4 M☉' }),
      blackHoleBody({
        id: 'a0620', name: 'A0620-00', massSolar: 6.6, parent: 'a0620-star',
        pole: { ra: 95, dec: 51 },
        disk: { inner: 3, outer: 26, temperature: 6500, brightness: 0.35 },
        diskAbsMag: 4,
        orbit: {
          kind: 'simple', a: semiMajorKm(0.32301, (0.4 + 6.6) * SUN_MASS_KG), e: 0, i: 51, node: 300, argPeri: 0, M0: 0,
          epoch: EPOCH_2020, period: 0.32301, frame: 'ecliptic',
        },
        description: 'An X-ray nova discovered through the outburst caught by the Ariel 5 satellite in 1975; its fading afterwards allowed the companion\'s orbit to be measured and, in 1986, the mass function confirmed it as a black hole. For a long time it was the nearest known black hole.',
        discovered: '1975 (Ariel 5) · 1986 (mass measurement, McClintock & Remillard)',
        facts: {
          'Mass': '6.6 M☉',
          'Distance': '1,060 pc (3,460 light-years)',
          'Orbital period': '7.75 hours',
          'Status': 'Quiet (faint disc)',
        },
      }),
    ],
  },
  xrayBinary({
    id: 'lmcx1', name: 'LMC X-1', galaxy: 'Large Magellanic', ra: 84.9117, dec: -69.7433, massSolar: 10.9,
    summary: 'The first extragalactic black hole, in the Large Magellanic Cloud',
    companion: { name: 'LMC X-1 companion (O7 III)', massSolar: 31.8, radiusSolar: 17, temperature: 33_000, spectral: 'O7 III', luminosity: 3e5 },
    periodDays: 3.9092, inc: 36.4, node: 120, disk: { inner: 3, outer: 26, temperature: 28_000, brightness: 1.4 }, diskAbsMag: -4,
    description: 'A persistently bright X-ray binary in the Large Magellanic Cloud discovered in 1969; one of the first black holes outside the Milky Way to have its mass measured. Its disc, fed by the wind of a giant O star, stays almost always in the "soft" (thermal) state.',
    discovered: '1969 (rocket flights before Uhuru)',
    facts: { 'Mass': '10.9 M☉', 'Companion': 'O7 III, ~32 M☉', 'Orbital period': '3.91 days', 'Distance': '48 kpc (LMC)', 'Rotation': 'a* ≈ 0.92' },
  }),
  xrayBinary({
    id: 'lmcx3', name: 'LMC X-3', galaxy: 'Large Magellanic', ra: 84.7358, dec: -64.0836, massSolar: 6.98,
    summary: 'A slowly spinning black hole paired with a B star in the LMC',
    companion: { name: 'LMC X-3 companion (B3 V)', massSolar: 3.63, radiusSolar: 4.3, temperature: 18_000, spectral: 'B3 V', luminosity: 1800 },
    periodDays: 1.7049, inc: 69.2, node: 20, disk: { inner: 3, outer: 24, temperature: 20_000, brightness: 1.0 }, diskAbsMag: -2,
    description: 'A black hole in the north of the Large Magellanic Cloud fed by a B star overflowing its Roche lobe. Its disc is remarkably stable compared with its Milky Way counterparts; one of the first objects to have its black-hole spin measured (a* ≈ 0.25).',
    discovered: '1971 (Uhuru)',
    facts: { 'Mass': '6.98 M☉', 'Companion': 'B3 V, ~3.6 M☉', 'Orbital period': '1.70 days', 'Distance': '48 kpc (LMC)' },
  }),
  xrayBinary({
    id: 'm33x7', name: 'M33 X-7', galaxy: 'M33', ra: 23.392, dec: 30.537, massSolar: 15.65,
    summary: 'An eclipsing massive X-ray binary in the Triangulum Galaxy',
    companion: { name: 'M33 X-7 companion (O7-8 III)', massSolar: 70, radiusSolar: 19.6, temperature: 35_000, spectral: 'O7-8 III', luminosity: 5e5 },
    periodDays: 3.4530, inc: 74.6, node: 200, disk: { inner: 3, outer: 26, temperature: 30_000, brightness: 1.5 }, diskAbsMag: -4,
    description: 'A black hole in the Triangulum Galaxy (M33) orbiting a 70-solar-mass giant star every 3.45 days and regularly eclipsed behind its companion. Because the eclipses pin down the orbital inclination, its mass (15.65 M☉) is known with unusual precision.',
    discovered: '2007 (Orosz ve ark., Chandra + Gemini)',
    facts: { 'Mass': '15.65 M☉', 'Companion': 'O7-8 III, ~70 M☉', 'Orbital period': '3.45 days (eclipsing)', 'Distance': '840 kpc (M33)' },
  }),
  galaxyCore({
    id: 'm31star', name: 'M31*', galaxy: 'Andromeda', massSolar: 1.4e8, pole: { ra: 100, dec: 15 },
    disk: { inner: 3, outer: 12, temperature: 5000, brightness: 0.12 }, diskAbsMag: 2,
    summary: 'The sleeping giant at the centre of Andromeda (140 million M☉)',
    description: 'The 140-million-solar-mass black hole in the nucleus of the Andromeda Galaxy; 30 times heavier than Sgr A* but likewise almost starved. Around it orbit the eccentric disc of old stars discovered by Hubble (the P1/P2 double nucleus) and the P3 cluster of young blue stars.',
    discovered: '1988 (double nucleus, Lauer & Dressler), 2005 (mass, Bender et al.)',
    facts: { 'Mass': '1.4 × 10⁸ M☉', 'Distance': '765 kpc', 'Status': 'Very low accretion (L ≈ 10⁻¹⁰ L_Edd)' },
  }),
  galaxyCore({
    id: 'cenastar', name: 'Centaurus A*', galaxy: 'Centaurus A', massSolar: 5.5e7, pole: { ra: 201.4, dec: 2 },
    disk: { inner: 3, outer: 18, temperature: 8000, brightness: 1.1 }, diskAbsMag: -9,
    summary: 'The nearest active galactic nucleus; giant radio jets',
    description: 'A 55-million-solar-mass active black hole hidden in the dusty centre of Centaurus A. The jets it fires in both directions form radio lobes 20 times the width of the Moon on the sky; in 2021 the EHT imaged the base of the jet on black-hole scales.',
    discovered: '1949 (radio source)',
    facts: { 'Mass': '5.5 × 10⁷ M☉', 'Distance': '3.8 Mpc', 'Jet': '~1 Mpc radio lobes', 'Status': 'Active (radio galaxy)' },
  }),
  galaxyCore({
    id: 'm104star', name: 'Sombrero black hole', galaxy: 'Sombrero', massSolar: 1.0e9, pole: { ra: 190, dec: 78 },
    disk: { inner: 3, outer: 12, temperature: 6000, brightness: 0.25 }, diskAbsMag: -3,
    summary: 'Centre of the Sombrero Galaxy · 1 billion M☉',
    description: 'A black hole in the middle of the huge bulge of the Sombrero Galaxy (M104), 230 times heavier than the one at the centre of the Milky Way. It feeds gently as a low-luminosity active nucleus (LINER).',
    facts: { 'Mass': '~1 × 10⁹ M☉', 'Distance': '9.6 Mpc', 'Status': 'Low-luminosity AGN' },
  }),
  galaxyCore({
    id: 'm106star', name: 'M106 black hole', galaxy: 'M106', massSolar: 4.0e7, pole: { ra: 185, dec: 20 },
    disk: { inner: 3, outer: 20, temperature: 7000, brightness: 0.8 }, diskAbsMag: -7,
    summary: 'The black-hole mass measured most precisely, using water masers',
    description: 'Clouds of water masers orbit the black hole at the centre of M106 (NGC 4258) in perfect agreement with Kepler\'s laws. This disc yields both the black hole\'s mass (40 million M☉) and the galaxy\'s distance geometrically; it is an anchor of the cosmic distance ladder.',
    discovered: '1995 (Miyoshi ve ark., VLBA maser diski)',
    facts: { 'Mass': '4.0 × 10⁷ M☉', 'Distance': '7.2 Mpc (maser geometry)', 'Status': 'Seyfert 2 / LINER' },
  }),
  galaxyCore({
    id: 'm81star', name: 'M81*', galaxy: 'Bode', massSolar: 7.0e7, pole: { ra: 150, dec: 30 },
    disk: { inner: 3, outer: 14, temperature: 6500, brightness: 0.5 }, diskAbsMag: -5,
    summary: 'The low-luminosity nucleus of Bode\'s Galaxy',
    description: 'The 70-million-solar-mass black hole at the centre of M81; one of the nearest and best-studied low-luminosity active nuclei, a bridge between Sgr A* and bright quasars.',
    facts: { 'Mass': '7 × 10⁷ M☉', 'Distance': '3.6 Mpc', 'Status': 'Low-luminosity AGN' },
  }),
];
