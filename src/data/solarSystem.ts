import type { BodyData, JplElements, SimpleElements } from './types';
import type { GeneratedBelt } from '../gen/SystemGenerator';
import { J2000_JD } from '../core/constants';
import { SPACECRAFT } from './spacecraft';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function jpl(
  a: number, e: number, i: number, L: number, lonPeri: number, node: number,
  da: number, de: number, di: number, dL: number, dLonPeri: number, dNode: number,
): JplElements {
  return { kind: 'jpl', a, e, i, L, lonPeri, node, da, de, di, dL, dLonPeri, dNode };
}

function moonOrbit(
  a: number, e: number, i: number, period: number, M0: number,
  opts: Partial<SimpleElements> = {},
): SimpleElements {
  return {
    kind: 'simple', a, e, i, period, M0,
    node: opts.node ?? (M0 * 1.7) % 360,
    argPeri: opts.argPeri ?? (M0 * 2.3) % 360,
    epoch: J2000_JD,
    frame: opts.frame ?? 'parentEquator',
    nodeRate: opts.nodeRate,
    periRate: opts.periRate,
    ...(opts.table && { table: opts.table }),
  };
}

function helio(a: number, e: number, i: number, node: number, argPeri: number, M0: number, period: number, epoch = J2000_JD): SimpleElements {
  return { kind: 'simple', a: a * 149597870.7, e, i, node, argPeri, M0, epoch, period, frame: 'ecliptic' };
}

const GRAY: [number, number, number] = [0.42, 0.41, 0.40];

/* ------------------------------------------------------------------ */
/*  Catalogue                                                          */
/* ------------------------------------------------------------------ */

export const SOLAR_SYSTEM: BodyData[] = [
  /* ---------------- Sun ---------------- */
  {
    id: 'sun', name: 'Sun', type: 'star',
    radius: 695_700, mass: 1.9885e30, rotationPeriod: 609.12,
    pole: { ra: 286.13, dec: 63.87 },
    appearance: { kind: 'star', temperature: 5772, seed: 1 },
    temperature: 5772,
    description: 'The G2V main-sequence star at the centre of the Solar System. It holds 99.86% of the system\'s mass and converts ~4 million tonnes of matter into energy every second through hydrogen fusion in its core.',
    facts: { 'Spectral class': 'G2V', 'Luminosity': '1 L☉ (3.828×10²⁶ W)', 'Age': '~4.6 billion years', 'Photosphere temperature': '5772 K' },
  },

  /* ---------------- Mercury ---------------- */
  {
    id: 'mercury', name: 'Mercury', type: 'planet', parent: 'sun',
    radius: 2439.7, mass: 3.3011e23, albedo: 0.142, rotationPeriod: 1407.6,
    pole: { ra: 281.01, dec: 61.45 },
    orbit: jpl(0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593,
      0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081),
    appearance: { kind: 'terrestrial', seed: 11, landLow: [0.30, 0.29, 0.28], landMid: [0.42, 0.41, 0.40], landHigh: [0.55, 0.54, 0.52], craters: 1.0, roughness: 1.2, variation: 0.3 },
    description: 'The closest planet to the Sun and the smallest. Its cratered surface resembles the Moon; because of a 3:2 spin–orbit resonance one Mercury day lasts two Mercury years.',
    facts: { 'Class': 'Terrestrial, cratered', 'Surface temperature': '100–700 K', 'Moons': '0' },
  },

  /* ---------------- Venus ---------------- */
  {
    id: 'venus', name: 'Venus', type: 'planet', parent: 'sun',
    radius: 6051.8, mass: 4.8675e24, albedo: 0.689, rotationPeriod: -5832.5,
    pole: { ra: 272.76, dec: 67.16 },
    orbit: jpl(0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255,
      0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418),
    appearance: { kind: 'terrestrial', seed: 21, landLow: [0.45, 0.30, 0.15], landMid: [0.62, 0.45, 0.25], landHigh: [0.80, 0.65, 0.40], craters: 0.1, roughness: 0.8, variation: 0.5 },
    atmosphere: { color: [0.95, 0.85, 0.60], height: 0.04, density: 1.6 },
    clouds: { seed: 22, color: [0.96, 0.90, 0.72], coverage: 1.0, height: 0.012, speed: 60, opacity: 0.97 },
    temperature: 737,
    description: 'Shrouded in a dense CO₂ atmosphere and sulphuric-acid clouds, the hottest planet in the Solar System thanks to a runaway greenhouse effect. It rotates retrograde: a Venus day (243 days) is longer than a Venus year.',
    facts: { 'Surface pressure': '92 bar', 'Atmosphere': '96.5% CO₂, 3.5% N₂', 'Moons': '0' },
  },

  /* ---------------- Earth ---------------- */
  {
    id: 'earth', name: 'Earth', type: 'planet', parent: 'sun',
    radius: 6371.0, flattening: 0.00335, mass: 5.97237e24, albedo: 0.306, rotationPeriod: 23.9345,
    // Greenwich meridian at J2000 (GMST 280.46°) measured from the local +X axis (RA 180°)
    primeMeridian: 100.46,
    pole: { ra: 0, dec: 90 },
    orbit: jpl(1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0,
      0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0),
    appearance: { kind: 'terrestrial', seed: 31, ocean: [0.02, 0.10, 0.28], landLow: [0.12, 0.30, 0.10], landMid: [0.42, 0.36, 0.20], landHigh: [0.55, 0.52, 0.48], ice: [0.92, 0.95, 1.0], seaLevel: 0.55, iceCaps: 0.74, craters: 0, roughness: 1.0, cityLights: true, variation: 0.4 },
    atmosphere: { color: [0.30, 0.55, 1.0], height: 0.025, density: 1.0, sunsetColor: [1.0, 0.45, 0.2] },
    clouds: { seed: 32, color: [1, 1, 1], coverage: 0.5, height: 0.006, speed: 1.15, opacity: 0.88 },
    temperature: 288,
    description: 'The only planet known to harbour life. 71% of its surface is covered by liquid water; its nitrogen–oxygen atmosphere and magnetic field shield the surface from the solar wind.',
    facts: { 'Atmosphere': '78% N₂, 21% O₂', 'Moons': '1 (the Moon)', 'Orbital speed': '29.78 km/s' },
  },
  {
    id: 'moon', name: 'Moon', type: 'moon', parent: 'earth',
    radius: 1737.4, mass: 7.342e22, albedo: 0.136, rotationPeriod: 'sync',
    // Mean elements at J2000 (Simon et al.). `period` drives the mean anomaly, so it is the
    // anomalistic month (27.5545 d), and `periRate` is the argument of perigee rate
    // ω' = ϖ' − Ω' = 0.11140 + 0.05295 °/d: together with the node rate the mean longitude
    // advances 13.17636 °/d (the sidereal month), which keeps the phases on the calendar.
    // Within the Horizons table's span (scripts/fetch-horizons.mjs) the position is JPL's own,
    // accurate enough for eclipses; the mean elements miss the evection and variation (~1–2°).
    orbit: moonOrbit(384_400, 0.0549, 5.145, 27.554550, 134.96, { frame: 'ecliptic', node: 125.04, argPeri: 318.31, nodeRate: -0.0529539, periRate: 0.1643580, table: 'moon' }),
    appearance: {
      kind: 'terrestrial', seed: 33, landLow: [0.22, 0.22, 0.23], landMid: [0.38, 0.38, 0.38], landHigh: [0.58, 0.57, 0.55], craters: 1.0, roughness: 1.0, variation: 0.6,
      ground: { file: 'moon-regolith', slope: 0.8405, albedo: 1.8034, height: 0.02562 },
    },
    description: 'Earth\'s only natural satellite and the fifth-largest moon in the Solar System. Tidally locked, it always shows the same face to Earth.',
    facts: { 'Surface gravity': '1.62 m/s²', 'Mean distance': '384,400 km' },
  },

  /* ---------------- Mars ---------------- */
  {
    id: 'mars', name: 'Mars', type: 'planet', parent: 'sun',
    radius: 3389.5, flattening: 0.00589, mass: 6.4171e23, albedo: 0.25, rotationPeriod: 24.6229,
    // IAU W0 = 176.63° from the ICRF node, re-expressed in the ecliptic pole basis
    primeMeridian: 135.77,
    pole: { ra: 317.68, dec: 52.89 },
    orbit: jpl(1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891,
      0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343),
    appearance: { kind: 'terrestrial', seed: 41, landLow: [0.40, 0.16, 0.08], landMid: [0.72, 0.34, 0.14], landHigh: [0.85, 0.58, 0.38], ice: [0.95, 0.93, 0.90], iceCaps: 0.88, craters: 0.6, roughness: 1.1, variation: 0.6 },
    atmosphere: { color: [0.85, 0.60, 0.45], height: 0.02, density: 0.35 },
    temperature: 210,
    description: 'A desert planet painted red by iron oxide. Home to Olympus Mons, the tallest mountain in the Solar System, and Valles Marineris, its longest canyon.',
    facts: { 'Atmosphere': '95% CO₂ (6 mbar)', 'Moons': '2 (Phobos, Deimos)' },
  },
  {
    id: 'phobos', name: 'Phobos', type: 'moon', parent: 'mars',
    radius: 11.1, mass: 1.0659e16, albedo: 0.071, rotationPeriod: 'sync',
    orbit: moonOrbit(9376, 0.0151, 1.08, 0.31891, 40),
    appearance: { kind: 'terrestrial', seed: 42, landLow: [0.18, 0.17, 0.16], landMid: [0.30, 0.28, 0.26], landHigh: [0.42, 0.40, 0.38], craters: 1.0, roughness: 1.4, variation: 0.3 },
    description: 'The larger, inner moon of Mars. It orbits so close that tidal forces will tear it apart or bring it down onto the surface within ~50 million years.',
  },
  {
    id: 'deimos', name: 'Deimos', type: 'moon', parent: 'mars',
    radius: 6.2, mass: 1.4762e15, albedo: 0.068, rotationPeriod: 'sync',
    orbit: moonOrbit(23_463, 0.0002, 1.79, 1.26244, 200),
    appearance: { kind: 'terrestrial', seed: 43, landLow: [0.20, 0.19, 0.18], landMid: [0.32, 0.31, 0.30], landHigh: [0.44, 0.42, 0.40], craters: 0.6, roughness: 1.2, variation: 0.3 },
    description: 'The small outer moon of Mars. Its cratered surface is softened by regolith; probably a captured asteroid.',
  },

  /* ---------------- Jupiter ---------------- */
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet', parent: 'sun',
    radius: 69_911, flattening: 0.06487, mass: 1.8982e27, albedo: 0.503, rotationPeriod: 9.925,
    pole: { ra: 268.06, dec: 64.50 },
    orbit: jpl(5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909,
      -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106),
    appearance: {
      kind: 'gas', seed: 51, skin: 'map:jupiter', bandFreq: 13.0, turbulence: 0.9,
      bands: [[0.86, 0.78, 0.64], [0.58, 0.38, 0.26], [0.92, 0.86, 0.74], [0.42, 0.25, 0.17], [0.76, 0.62, 0.48], [0.52, 0.32, 0.22]],
      storm: [-22, 20, 0.11, 0.70, 0.28, 0.16],
      mapStorm: [-21.2, -47.2],
    },
    atmosphere: { color: [0.9, 0.8, 0.7], height: 0.015, density: 0.5 },
    temperature: 165,
    description: 'The largest planet in the Solar System, 2.5 times the mass of all the other planets combined. The Great Red Spot is a giant anticyclone that has raged for at least 350 years.',
    facts: { 'Composition': '90% H₂, 10% He', 'Moons': '95+', 'Magnetic field': '20,000 times Earth\'s' },
  },
  {
    id: 'io', name: 'Io', type: 'moon', parent: 'jupiter',
    radius: 1821.6, mass: 8.9319e22, albedo: 0.63, rotationPeriod: 'sync',
    orbit: moonOrbit(421_800, 0.0041, 0.05, 1.769138, 10),
    appearance: { kind: 'terrestrial', seed: 52, landLow: [0.85, 0.75, 0.30], landMid: [0.95, 0.88, 0.55], landHigh: [0.60, 0.35, 0.15], craters: 0, roughness: 0.9, volcanic: true, variation: 1.0 },
    // Pele, Loki, Prometheus, Tvashtar, Pillan, Amirani (USGS west longitudes → east)
    activity: { kind: 'volcanic', vents: [[-18.7, 104.7], [13.0, 51.2], [-1.5, 207.0], [62.0, 237.0], [-12.0, 117.0], [24.5, 245.5]], height: 300, spread: 600, fall: 1, color: [0.78, 0.82, 0.92], intensity: 1 },
    description: 'The most geologically active body in the Solar System, with more than 400 active volcanoes. Jupiter\'s tidal heating paints its surface in colourful sulphur compounds.',
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parent: 'jupiter',
    radius: 1560.8, mass: 4.7998e22, albedo: 0.67, rotationPeriod: 'sync',
    orbit: moonOrbit(671_100, 0.0094, 0.47, 3.551181, 120),
    appearance: { kind: 'terrestrial', seed: 53, landLow: [0.60, 0.42, 0.32], landMid: [0.88, 0.86, 0.84], landHigh: [0.97, 0.97, 0.98], craters: 0.05, roughness: 0.4, variation: 0.8 },
    description: 'A moon thought to hide more liquid water beneath its ice shell than all of Earth\'s oceans. Its surface is covered with lines and cracks and has very few craters.',
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parent: 'jupiter',
    radius: 2634.1, mass: 1.4819e23, albedo: 0.43, rotationPeriod: 'sync',
    orbit: moonOrbit(1_070_400, 0.0013, 0.20, 7.154553, 250),
    appearance: { kind: 'terrestrial', seed: 54, landLow: [0.30, 0.27, 0.25], landMid: [0.48, 0.45, 0.42], landHigh: [0.72, 0.72, 0.72], craters: 0.5, roughness: 0.9, variation: 0.9 },
    description: 'The largest moon in the Solar System, bigger than Mercury. The only moon known to have its own magnetic field.',
  },
  {
    id: 'callisto', name: 'Callisto', type: 'moon', parent: 'jupiter',
    radius: 2410.3, mass: 1.0759e23, albedo: 0.22, rotationPeriod: 'sync',
    orbit: moonOrbit(1_882_700, 0.0074, 0.19, 16.689018, 300),
    appearance: { kind: 'terrestrial', seed: 55, landLow: [0.15, 0.14, 0.13], landMid: [0.30, 0.28, 0.26], landHigh: [0.62, 0.62, 0.62], craters: 1.0, roughness: 1.0, variation: 0.5 },
    description: 'The most heavily cratered surface in the Solar System. Geologically dead, an ancient surface ~4 billion years old.',
  },

  /* ---------------- Saturn ---------------- */
  {
    id: 'saturn', name: 'Saturn', type: 'planet', parent: 'sun',
    radius: 58_232, flattening: 0.09796, mass: 5.6834e26, albedo: 0.342, rotationPeriod: 10.656,
    pole: { ra: 40.59, dec: 83.54 },
    orbit: jpl(9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448,
      -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794),
    appearance: {
      kind: 'gas', seed: 61, skin: 'map:saturn', bandFreq: 11.0, turbulence: 0.35, hexagon: true,
      bands: [[0.92, 0.84, 0.62], [0.78, 0.68, 0.46], [0.96, 0.90, 0.72], [0.70, 0.60, 0.42], [0.88, 0.80, 0.60]],
    },
    atmosphere: { color: [0.95, 0.9, 0.75], height: 0.015, density: 0.45 },
    rings: { inner: 74_500, outer: 140_220, color: [0.82, 0.76, 0.66], opacity: 0.95, seed: 62, gaps: [[117_500, 4_700], [133_590, 325], [90_000, 1_200]] },
    temperature: 134,
    description: 'The gas giant famous for its magnificent ring system. The rings are mostly water ice and, although they span 280,000 km, they are on average only ~10 metres thick.',
    facts: { 'Density': '0.687 g/cm³ (less than water)', 'Moons': '146+', 'Ring mass': '~1.5×10¹⁹ kg' },
  },
  {
    id: 'mimas', name: 'Mimas', type: 'moon', parent: 'saturn',
    radius: 198.2, mass: 3.7493e19, albedo: 0.96, rotationPeriod: 'sync',
    orbit: moonOrbit(185_540, 0.0196, 1.57, 0.942422, 15),
    appearance: { kind: 'terrestrial', seed: 63, landLow: [0.55, 0.55, 0.56], landMid: [0.75, 0.75, 0.76], landHigh: [0.92, 0.92, 0.93], craters: 1.0, roughness: 1.4, variation: 0.2 },
    description: 'An icy moon whose 130 km Herschel crater makes it look like the "Death Star".',
  },
  {
    id: 'enceladus', name: 'Enceladus', type: 'moon', parent: 'saturn',
    radius: 252.1, mass: 1.0802e20, albedo: 0.99, rotationPeriod: 'sync',
    orbit: moonOrbit(238_040, 0.0047, 0.01, 1.370218, 75),
    appearance: { kind: 'terrestrial', seed: 64, landLow: [0.80, 0.85, 0.90], landMid: [0.92, 0.95, 0.98], landHigh: [1.0, 1.0, 1.0], craters: 0.2, roughness: 0.5, variation: 0.3 },
    // the tiger stripes: Alexandria, Cairo, Baghdad, Damascus
    activity: { kind: 'cryo', vents: [[-78, 40], [-82, 110], [-80, 200], [-76, 300], [-86, 20], [-84, 250]], height: 500, spread: 60, fall: 0, color: [0.9, 0.95, 1.0], intensity: 0.8 },
    description: 'Geysers at its south pole spray water vapour and ice; its subsurface ocean is a prime target for astrobiology. The most reflective body in the Solar System.',
  },
  {
    id: 'tethys', name: 'Tethys', type: 'moon', parent: 'saturn',
    radius: 531.1, mass: 6.1745e20, albedo: 0.80, rotationPeriod: 'sync',
    orbit: moonOrbit(294_670, 0.0001, 1.09, 1.887802, 140),
    appearance: { kind: 'terrestrial', seed: 65, landLow: [0.62, 0.63, 0.65], landMid: [0.80, 0.81, 0.83], landHigh: [0.95, 0.95, 0.96], craters: 0.8, roughness: 1.0, variation: 0.3 },
    description: 'A moon made almost entirely of water ice. The giant valley Ithaca Chasma runs three-quarters of the way around it.',
  },
  {
    id: 'dione', name: 'Dione', type: 'moon', parent: 'saturn',
    radius: 561.4, mass: 1.0955e21, albedo: 0.70, rotationPeriod: 'sync',
    orbit: moonOrbit(377_420, 0.0022, 0.03, 2.736915, 210),
    appearance: { kind: 'terrestrial', seed: 66, landLow: [0.55, 0.56, 0.58], landMid: [0.76, 0.77, 0.79], landHigh: [0.93, 0.93, 0.95], craters: 0.7, roughness: 0.9, variation: 0.4 },
    description: 'An icy moon known for its bright ice cliffs ("wispy terrain").',
  },
  {
    id: 'rhea', name: 'Rhea', type: 'moon', parent: 'saturn',
    radius: 763.8, mass: 2.3065e21, albedo: 0.65, rotationPeriod: 'sync',
    orbit: moonOrbit(527_070, 0.0010, 0.33, 4.5175, 290),
    appearance: { kind: 'terrestrial', seed: 67, landLow: [0.55, 0.56, 0.57], landMid: [0.74, 0.75, 0.76], landHigh: [0.90, 0.90, 0.91], craters: 0.9, roughness: 1.0, variation: 0.3 },
    description: 'Saturn\'s second-largest moon, with a heavily cratered icy surface.',
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parent: 'saturn',
    radius: 2574.7, mass: 1.3452e23, albedo: 0.22, rotationPeriod: 'sync',
    orbit: moonOrbit(1_221_870, 0.0288, 0.31, 15.945421, 330),
    appearance: { kind: 'terrestrial', seed: 68, ocean: [0.10, 0.08, 0.05], landLow: [0.35, 0.25, 0.12], landMid: [0.55, 0.40, 0.20], landHigh: [0.70, 0.58, 0.38], seaLevel: 0.42, craters: 0.05, roughness: 0.6, variation: 0.6 },
    atmosphere: { color: [0.95, 0.65, 0.30], height: 0.10, density: 1.6 },
    clouds: { seed: 69, color: [0.90, 0.62, 0.30], coverage: 1.0, height: 0.04, speed: 1.5, opacity: 0.92 },
    temperature: 94,
    description: 'The only moon with a dense nitrogen atmosphere. Its surface has lakes and seas of liquid methane and ethane, hydrocarbon rain and dunes.',
    facts: { 'Surface pressure': '1.45 bar', 'Atmosphere': '95% N₂, 5% CH₄' },
  },
  {
    id: 'iapetus', name: 'Iapetus', type: 'moon', parent: 'saturn',
    radius: 734.5, mass: 1.8056e21, albedo: 0.27, rotationPeriod: 'sync',
    orbit: moonOrbit(3_560_840, 0.0283, 15.47, 79.3215, 60, { frame: 'laplace' }),
    appearance: { kind: 'terrestrial', seed: 70, landLow: [0.08, 0.06, 0.04], landMid: [0.45, 0.42, 0.38], landHigh: [0.88, 0.88, 0.86], craters: 0.8, roughness: 1.0, variation: 1.0 },
    description: 'The "yin-yang" moon: one half coal-black, the other snow-white. A mysterious ridge 20 km high runs along its equator.',
  },

  /* ---------------- Uranus ---------------- */
  {
    id: 'uranus', name: 'Uranus', type: 'planet', parent: 'sun',
    radius: 25_362, flattening: 0.0229, mass: 8.6810e25, albedo: 0.30, rotationPeriod: -17.24,
    pole: { ra: 257.31, dec: -15.18 },
    orbit: jpl(19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503,
      -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589),
    appearance: {
      kind: 'gas', seed: 71, skin: 'map:uranus', bandFreq: 4.0, turbulence: 0.15,
      bands: [[0.60, 0.85, 0.90], [0.55, 0.80, 0.88], [0.66, 0.88, 0.92], [0.58, 0.82, 0.90]],
    },
    atmosphere: { color: [0.6, 0.9, 1.0], height: 0.02, density: 0.5 },
    rings: { inner: 41_800, outer: 51_150, color: [0.45, 0.45, 0.48], opacity: 0.35, seed: 72, gaps: [[44_700, 2_400], [47_600, 1_600], [49_000, 1_200]] },
    temperature: 76,
    description: 'An ice giant tilted 98°, so it practically "rolls" along its orbital plane. Methane in its atmosphere gives it its pale cyan colour.',
    facts: { 'Composition': 'H₂, He, CH₄ (2.3%)', 'Moons': '28', 'Discovery': '1781, W. Herschel' },
  },
  {
    id: 'miranda', name: 'Miranda', type: 'moon', parent: 'uranus',
    radius: 235.8, mass: 6.4e19, albedo: 0.32, rotationPeriod: 'sync',
    orbit: moonOrbit(129_900, 0.0013, 4.34, 1.413479, 30),
    appearance: { kind: 'terrestrial', seed: 73, landLow: [0.40, 0.40, 0.42], landMid: [0.60, 0.60, 0.62], landHigh: [0.82, 0.82, 0.84], craters: 0.6, roughness: 1.6, variation: 0.6 },
    description: 'Home to Verona Rupes (20 km), the tallest cliff in the Solar System. Its surface is a patchwork of disconnected geological provinces.',
  },
  {
    id: 'ariel', name: 'Ariel', type: 'moon', parent: 'uranus',
    radius: 578.9, mass: 1.251e21, albedo: 0.53, rotationPeriod: 'sync',
    orbit: moonOrbit(190_900, 0.0012, 0.04, 2.520379, 100),
    appearance: { kind: 'terrestrial', seed: 74, landLow: [0.45, 0.45, 0.46], landMid: [0.66, 0.66, 0.67], landHigh: [0.88, 0.88, 0.89], craters: 0.5, roughness: 1.0, variation: 0.3 },
    description: 'The brightest moon of Uranus, with the geologically youngest surface.',
  },
  {
    id: 'umbriel', name: 'Umbriel', type: 'moon', parent: 'uranus',
    radius: 584.7, mass: 1.275e21, albedo: 0.26, rotationPeriod: 'sync',
    orbit: moonOrbit(266_000, 0.0039, 0.13, 4.144177, 170),
    appearance: { kind: 'terrestrial', seed: 75, landLow: [0.20, 0.20, 0.21], landMid: [0.33, 0.33, 0.34], landHigh: [0.55, 0.55, 0.56], craters: 0.9, roughness: 1.0, variation: 0.3 },
    description: 'The darkest of Uranus\'s major moons. A bright ring called "Wunda" sits at its pole.',
  },
  {
    id: 'titania', name: 'Titania', type: 'moon', parent: 'uranus',
    radius: 788.9, mass: 3.400e21, albedo: 0.35, rotationPeriod: 'sync',
    orbit: moonOrbit(436_300, 0.0011, 0.08, 8.705872, 240),
    appearance: { kind: 'terrestrial', seed: 76, landLow: [0.35, 0.34, 0.34], landMid: [0.55, 0.54, 0.54], landHigh: [0.78, 0.78, 0.78], craters: 0.7, roughness: 1.0, variation: 0.3 },
    description: 'The largest moon of Uranus, covered in giant canyons and fault systems.',
  },
  {
    id: 'oberon', name: 'Oberon', type: 'moon', parent: 'uranus',
    radius: 761.4, mass: 3.076e21, albedo: 0.31, rotationPeriod: 'sync',
    orbit: moonOrbit(583_500, 0.0014, 0.07, 13.463239, 310),
    appearance: { kind: 'terrestrial', seed: 77, landLow: [0.30, 0.29, 0.28], landMid: [0.50, 0.48, 0.47], landHigh: [0.72, 0.71, 0.70], craters: 0.9, roughness: 1.0, variation: 0.4 },
    description: 'The outermost major moon of Uranus; an old cratered surface and a mountain 6 km high.',
  },

  /* ---------------- Neptune ---------------- */
  {
    id: 'neptune', name: 'Neptune', type: 'planet', parent: 'sun',
    radius: 24_622, flattening: 0.0171, mass: 1.02413e26, albedo: 0.29, rotationPeriod: 16.11,
    pole: { ra: 299.36, dec: 43.46 },
    orbit: jpl(30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574,
      0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664),
    appearance: {
      kind: 'gas', seed: 81, skin: 'map:neptune', bandFreq: 5.0, turbulence: 0.5,
      bands: [[0.20, 0.35, 0.85], [0.25, 0.45, 0.95], [0.18, 0.30, 0.75], [0.35, 0.55, 1.0]],
      storm: [-25, 80, 0.09, 0.08, 0.12, 0.35],
    },
    atmosphere: { color: [0.4, 0.6, 1.0], height: 0.02, density: 0.5 },
    rings: { inner: 53_000, outer: 63_000, color: [0.45, 0.42, 0.42], opacity: 0.25, seed: 82, gaps: [[56_000, 3_000], [60_500, 1_500]] },
    temperature: 72,
    description: 'The farthest planet from the Sun. The fastest winds in the Solar System (2,100 km/h) blow here. It was discovered by mathematics, not by telescope (1846).',
    facts: { 'Moons': '16', 'Orbital period': '164.8 years', 'Discovery': '1846, Le Verrier / Galle' },
  },
  {
    id: 'triton', name: 'Triton', type: 'moon', parent: 'neptune',
    radius: 1353.4, mass: 2.1390e22, albedo: 0.76, rotationPeriod: 'sync',
    orbit: moonOrbit(354_760, 0.000016, 156.885, 5.876854, 90),
    appearance: { kind: 'terrestrial', seed: 83, skin: 'map:triton', landLow: [0.60, 0.50, 0.48], landMid: [0.82, 0.78, 0.76], landHigh: [0.95, 0.94, 0.94], ice: [0.92, 0.90, 0.95], iceCaps: 0.55, craters: 0.1, roughness: 0.6, variation: 0.6 },
    // Voyager 2's dark nitrogen geysers (Hili, Mahilani): 8 km up, trailing 100+ km downwind
    activity: { kind: 'cryo', vents: [[-57, 35], [-50, 2], [-62, 60], [-48, 25]], height: 8, spread: 120, fall: 0.3, color: [0.25, 0.24, 0.26], intensity: 0.5 },
    atmosphere: { color: [0.7, 0.75, 0.9], height: 0.015, density: 0.15 },
    temperature: 38,
    description: 'The only large moon orbiting Neptune retrograde — probably a captured Kuiper Belt object. Known for its nitrogen geysers and "cantaloupe" terrain.',
  },

  /* ---------------- Pluto system ---------------- */
  // Pluto and Charon are a true binary: their centre of mass lies ~2 100 km from Pluto's centre,
  // outside the dwarf planet (radius 1 188 km). The heliocentric orbit belongs to that point; the
  // two bodies circle it on opposite sides with a shared 6.387-day period (a·m₂/M and a·m₁/M of
  // the 19 591 km separation). The barycentre carries Pluto's pole so Charon's orbit stays in
  // Pluto's equatorial plane.
  {
    id: 'pluto-bary', name: 'Pluto–Charon barycentre', type: 'barycenter', parent: 'sun',
    radius: 0, mass: 1.303e22 + 1.586e21,
    pole: { ra: 132.99, dec: -6.16 },
    orbit: jpl(39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684,
      -0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482),
    appearance: { kind: 'none', seed: 0 },
  },
  {
    id: 'pluto', name: 'Pluto', type: 'dwarf', parent: 'pluto-bary',
    radius: 1188.3, mass: 1.303e22, albedo: 0.52, rotationPeriod: -153.2928,
    pole: { ra: 132.99, dec: -6.16 },
    orbit: moonOrbit(2_126, 0.0002, 0.08, 6.387230, 180, { node: 306, argPeri: 234 }),
    appearance: { kind: 'terrestrial', seed: 91, skin: 'map:pluto', landLow: [0.35, 0.22, 0.15], landMid: [0.72, 0.60, 0.50], landHigh: [0.95, 0.93, 0.90], ice: [0.97, 0.96, 0.95], iceCaps: 0.6, craters: 0.3, roughness: 0.8, variation: 1.0 },
    atmosphere: { color: [0.55, 0.65, 0.95], height: 0.03, density: 0.2 },
    temperature: 44,
    description: 'The most famous dwarf planet of the Kuiper Belt. Known for the heart-shaped nitrogen-ice plain Sputnik Planitia, a blue layered atmosphere and a binary system with Charon.',
    facts: { 'Discovery': '1930, Clyde Tombaugh', 'Moons': '5', 'Reclassification': '2006 (dwarf planet)' },
  },
  {
    id: 'charon', name: 'Charon', type: 'moon', parent: 'pluto-bary',
    radius: 606, mass: 1.586e21, albedo: 0.38, rotationPeriod: 'sync',
    orbit: moonOrbit(17_465, 0.0002, 0.08, 6.387230, 180, { node: 306, argPeri: 54 }),
    appearance: { kind: 'terrestrial', seed: 92, skin: 'map:charon', landLow: [0.35, 0.34, 0.34], landMid: [0.55, 0.54, 0.54], landHigh: [0.78, 0.76, 0.75], craters: 0.5, roughness: 0.9, variation: 0.5 },
    description: 'Pluto\'s moon, half its size; its reddish polar region (Mordor Macula) formed from methane escaping Pluto.',
  },

  /* ---------------- Dwarf planets & asteroids ---------------- */
  {
    id: 'ceres', name: 'Ceres', type: 'dwarf', parent: 'sun',
    radius: 469.7, mass: 9.3835e20, albedo: 0.09, rotationPeriod: 9.074, tilt: 4,
    orbit: helio(2.7691, 0.0760, 10.594, 80.305, 73.597, 77.372, 1681.6),
    appearance: { kind: 'terrestrial', seed: 101, landLow: [0.22, 0.21, 0.20], landMid: [0.36, 0.35, 0.34], landHigh: [0.60, 0.60, 0.60], craters: 0.9, roughness: 1.0, variation: 0.4 },
    description: 'The largest body in the Asteroid Belt and the only dwarf planet of the inner Solar System. Known for the bright salt deposits in Occator crater.',
    facts: { 'Discovery': '1801, G. Piazzi' },
  },
  {
    id: 'vesta', name: 'Vesta', type: 'asteroid', parent: 'sun',
    radius: 262.7, mass: 2.5907e20, albedo: 0.42, rotationPeriod: 5.342, tilt: 29,
    orbit: helio(2.3615, 0.0887, 7.1417, 103.81, 150.73, 20.86, 1325.75),
    appearance: { kind: 'terrestrial', seed: 102, landLow: [0.28, 0.27, 0.25], landMid: [0.45, 0.44, 0.42], landHigh: [0.68, 0.67, 0.65], craters: 1.0, roughness: 2.2, variation: 0.4 },
    description: 'The brightest and second-largest body in the Asteroid Belt; a "protoplanet" with a differentiated interior.',
  },
  {
    id: 'eris', name: 'Eris', type: 'dwarf', parent: 'sun',
    radius: 1163, mass: 1.6466e22, albedo: 0.96, rotationPeriod: 25.9, tilt: 78,
    orbit: helio(67.864, 0.43607, 44.040, 35.951, 151.639, 205.99, 204_199),
    appearance: { kind: 'terrestrial', seed: 103, landLow: [0.80, 0.82, 0.85], landMid: [0.92, 0.93, 0.95], landHigh: [1.0, 1.0, 1.0], craters: 0.1, roughness: 0.5, variation: 0.2 },
    description: 'The most massive known dwarf planet, heavier than Pluto. Its discovery triggered Pluto\'s reclassification. A very bright surface covered in methane ice.',
    facts: { 'Discovery': '2005, M. Brown et al.', 'Moon': 'Dysnomia' },
  },
  {
    id: 'haumea', name: 'Haumea', type: 'dwarf', parent: 'sun',
    radius: 780, flattening: 0.45, mass: 4.006e21, albedo: 0.66, rotationPeriod: 3.9155, tilt: 15,
    orbit: helio(43.116, 0.19642, 28.2137, 122.167, 239.041, 218.205, 103_468),
    appearance: { kind: 'terrestrial', seed: 104, landLow: [0.70, 0.70, 0.72], landMid: [0.85, 0.85, 0.87], landHigh: [0.98, 0.98, 1.0], craters: 0.1, roughness: 0.5, variation: 0.3 },
    // Ortiz et al. 2017 (occultation): r ≈ 2287 km, ~70 km wide, normal optical depth ≈ 0.5
    rings: { inner: 2252, outer: 2322, color: [0.6, 0.6, 0.62], opacity: 0.4, seed: 104 },
    description: 'A dwarf planet spinning once every 3.9 hours, stretched into an ellipsoid as a result. The first trans-Neptunian object known to have its own ring system.',
  },
  {
    id: 'makemake', name: 'Makemake', type: 'dwarf', parent: 'sun',
    radius: 715, mass: 3.1e21, albedo: 0.81, rotationPeriod: 22.83, tilt: 20,
    orbit: helio(45.430, 0.16126, 28.9835, 79.620, 294.834, 165.514, 111_845),
    appearance: { kind: 'terrestrial', seed: 105, landLow: [0.55, 0.35, 0.25], landMid: [0.78, 0.62, 0.50], landHigh: [0.92, 0.88, 0.85], craters: 0.2, roughness: 0.6, variation: 0.5 },
    description: 'One of the brightest Kuiper Belt objects; a reddish surface covered in methane, ethane and tholins.',
  },
  {
    id: 'gonggong', name: 'Gonggong', type: 'dwarf', parent: 'sun',
    radius: 615, mass: 1.75e21, albedo: 0.14, rotationPeriod: 22.4, tilt: 30,
    orbit: helio(67.38, 0.4993, 30.63, 336.86, 207.07, 93.0, 201_980),
    appearance: { kind: 'terrestrial', seed: 106, landLow: [0.40, 0.22, 0.15], landMid: [0.62, 0.40, 0.28], landHigh: [0.82, 0.68, 0.58], craters: 0.3, roughness: 0.7, variation: 0.5 },
    description: 'One of the reddest and slowest-rotating large trans-Neptunian objects, coated in water ice and tholins. It follows a steeply inclined scattered-disc orbit swinging between 34 and 101 AU.',
    facts: { 'Discovery': '2007, Schwamb, Brown, Rabinowitz', 'Moon': 'Xiangliu', 'Name': 'Chinese water god' },
  },
  {
    id: 'quaoar', name: 'Quaoar', type: 'dwarf', parent: 'sun',
    radius: 545, mass: 1.2e21, albedo: 0.11, rotationPeriod: 17.68, tilt: 14,
    orbit: helio(43.69, 0.0392, 7.99, 188.8, 147.5, 272.0, 105_500),
    appearance: { kind: 'terrestrial', seed: 107, landLow: [0.30, 0.20, 0.16], landMid: [0.50, 0.38, 0.32], landHigh: [0.72, 0.64, 0.58], craters: 0.4, roughness: 0.8, variation: 0.4 },
    // the outer ring Q1R (Morgado et al. 2023): r ≈ 4057 km, uneven, a few to ~300 km wide and
    // tenuous; the inner Q2R (2520 km, τ ≈ 0.004) is too faint to draw
    rings: { inner: 4020, outer: 4095, color: [0.55, 0.5, 0.47], opacity: 0.15, seed: 107 },
    description: 'A classical Kuiper Belt object on a nearly circular orbit. Its two rings lie far outside the Roche limit, at an unexpected distance that challenged theories of ring formation.',
    facts: { 'Discovery': '2002, Trujillo & Brown', 'Moon': 'Weywot', 'Rings': '2 (2023)' },
  },
  {
    id: 'orcus', name: 'Orcus', type: 'dwarf', parent: 'sun',
    radius: 455, mass: 6.35e20, albedo: 0.23, rotationPeriod: 13.2, tilt: 10,
    orbit: helio(39.42, 0.2257, 20.59, 268.8, 72.3, 152.0, 90_400),
    appearance: { kind: 'terrestrial', seed: 108, landLow: [0.30, 0.30, 0.31], landMid: [0.52, 0.52, 0.53], landHigh: [0.78, 0.78, 0.80], craters: 0.5, roughness: 0.8, variation: 0.3 },
    description: 'Locked in the same 2:3 resonance with Neptune as Pluto, but always on the opposite side of its orbit — hence the nickname "anti-Pluto". Crystalline water ice and traces of ammonia hint at past cryovolcanism.',
    facts: { 'Discovery': '2004, Brown, Trujillo, Rabinowitz', 'Moon': 'Vanth', 'Resonance': '2:3 (Neptune)' },
  },
  {
    id: 'sedna', name: 'Sedna', type: 'dwarf', parent: 'sun',
    radius: 500, mass: 1.0e21, albedo: 0.32, rotationPeriod: 10.27, tilt: 12,
    orbit: helio(506, 0.8496, 11.93, 144.25, 311.29, 357.6, 4_163_000),
    appearance: { kind: 'terrestrial', seed: 109, landLow: [0.45, 0.18, 0.10], landMid: [0.70, 0.35, 0.22], landHigh: [0.88, 0.62, 0.50], craters: 0.2, roughness: 0.6, variation: 0.5 },
    description: 'The most distant large body known in the Solar System: even its perihelion of 76 AU lies beyond the Kuiper Belt, and its aphelion is ~900 AU. With an ~11,400-year orbit and a surface as red as Mars, it is regarded as the first member of the inner Oort Cloud; it reaches perihelion in 2076.',
    facts: { 'Discovery': '2003, Brown, Trujillo, Rabinowitz', 'Perihelion': '76 AU (2076)', 'Orbital period': '≈ 11,400 years' },
  },

  /* ---------------- Comet ---------------- */
  {
    id: 'halley', name: '1P/Halley', type: 'comet', parent: 'sun',
    radius: 5.5, mass: 2.2e14, albedo: 0.04, rotationPeriod: 52.8, tilt: 60,
    orbit: helio(17.8600, 0.9680328, 162.19216, 59.257416, 112.15810, 194.10145, 27_568.4, 2_461_335.5), // JPL Horizons osculating, 2026-10-22
    appearance: { kind: 'terrestrial', seed: 111, landLow: [0.05, 0.05, 0.05], landMid: [0.12, 0.11, 0.10], landHigh: [0.25, 0.24, 0.22], craters: 0.6, roughness: 2.5, variation: 0.4 },
    description: 'The most famous periodic comet, returning every 75–79 years. On its retrograde orbit it was visited by the Giotto probe in 1986; its next perihelion is in 2061.',
  },

  /* ---------------- Small bodies of the Events tab (JPL Horizons osculating elements, 2026-10-22) ---------------- */
  {
    id: 'didymos', name: '65803 Didymos', type: 'asteroid', parent: 'sun',
    radius: 0.39, mass: 5.2e11, albedo: 0.15, rotationPeriod: 2.26, tilt: 171,
    orbit: helio(1.64277, 0.3831054, 3.413776, 72.984986, 319.57586, 324.0609, 769.06, 2_461_335.5),
    appearance: { kind: 'terrestrial', seed: 121, landLow: [0.30, 0.29, 0.27], landMid: [0.48, 0.46, 0.43], landHigh: [0.66, 0.64, 0.60], craters: 0.7, roughness: 2.0, variation: 0.4 },
    description: 'A near-Earth binary asteroid: the 780 m Didymos and the 150 m Dimorphos orbiting it. NASA\'s DART spacecraft struck Dimorphos in 2022, shortening its orbital period by 32 minutes; ESA\'s Hera mission is studying the outcome on site.',
    facts: { 'Discovery': '1996, Spacewatch', 'Moon': 'Dimorphos', 'DART impact': '26 September 2022' },
  },
  {
    id: 'dimorphos', name: 'Dimorphos', type: 'moon', parent: 'didymos',
    radius: 0.0755, mass: 4.3e9, albedo: 0.15, rotationPeriod: 'sync',
    orbit: { kind: 'simple', a: 1.19, e: 0.03, i: 0, node: 0, argPeri: 0, M0: 0, epoch: J2000_JD, period: 0.4738, frame: 'parentEquator' },
    appearance: { kind: 'terrestrial', seed: 122, landLow: [0.28, 0.27, 0.25], landMid: [0.46, 0.44, 0.41], landHigh: [0.64, 0.62, 0.58], craters: 0.4, roughness: 2.5, variation: 0.5 },
    description: 'Didymos\'s small moon; the first celestial body whose orbit humanity deliberately changed (DART, 2022). After the impact its period dropped from 11 h 55 min to 11 h 23 min.',
  },
  {
    id: 'phaethon', name: '3200 Phaethon', type: 'asteroid', parent: 'sun',
    radius: 2.9, mass: 1.4e14, albedo: 0.11, rotationPeriod: 3.604,
    orbit: helio(1.27144, 0.8896639, 22.310287, 265.09492, 322.30221, 34.293814, 523.65, 2_461_335.5),
    appearance: { kind: 'terrestrial', seed: 123, landLow: [0.12, 0.13, 0.15], landMid: [0.24, 0.25, 0.28], landHigh: [0.40, 0.41, 0.44], craters: 0.5, roughness: 2.0, variation: 0.4 },
    description: 'A "rock comet" that comes closer to the Sun than Mercury (0.14 AU). It is the parent body of the Geminid meteor shower seen every December and the target of JAXA\'s DESTINY+ probe.',
    facts: { 'Discovery': '1983, IRAS', 'Perihelion': '0.14 AU', 'Meteor shower': 'Geminids (13–14 December)' },
  },
  {
    id: 'tempeltuttle', name: '55P/Tempel-Tuttle', type: 'comet', parent: 'sun',
    radius: 1.8, mass: 1.2e13, albedo: 0.04, rotationPeriod: 15.3,
    orbit: helio(10.3300, 0.9055286, 162.47462, 235.39641, 172.55108, 310.26943, 12_127.3, 2_461_335.5),
    appearance: { kind: 'terrestrial', seed: 124, landLow: [0.05, 0.05, 0.05], landMid: [0.12, 0.11, 0.10], landHigh: [0.25, 0.24, 0.22], craters: 0.6, roughness: 2.5, variation: 0.4 },
    description: 'A retrograde comet returning every 33 years; the source of the mid-November Leonid meteor shower. The famous Leonid storms of 1833 and 1966 came from dense debris trails like those left after its last perihelion (1998). Next perihelion 2031.',
    facts: { 'Discovery': '1865–66, Tempel & Tuttle', 'Period': '33.2 years', 'Meteor shower': 'Leonids (17–18 November)' },
  },
  {
    id: 'encke', name: '2P/Encke', type: 'comet', parent: 'sun',
    radius: 2.4, mass: 9.2e13, albedo: 0.05, rotationPeriod: 11.1,
    orbit: helio(2.21774, 0.8473211, 11.347783, 334.01916, 187.28794, 326.80643, 1206.3, 2_461_335.5),
    appearance: { kind: 'terrestrial', seed: 125, landLow: [0.06, 0.06, 0.06], landMid: [0.13, 0.12, 0.11], landHigh: [0.26, 0.25, 0.23], craters: 0.6, roughness: 2.5, variation: 0.4 },
    description: 'The comet with the shortest known period: it circles the Sun every 3.3 years. It is the main source of the Taurid meteor showers (Southern and Northern Taurids) in October–November; its broad dust stream is famous for "Halloween fireballs".',
    facts: { 'Discovery': '1786, P. Méchain; period 1819, J. F. Encke', 'Period': '3.3 years', 'Meteor shower': 'Taurids (October–November)' },
  },
  {
    id: 'tuttle', name: '8P/Tuttle', type: 'comet', parent: 'sun',
    radius: 2.25, mass: 7e13, albedo: 0.04, rotationPeriod: 11.4,
    orbit: helio(5.70685, 0.8207537, 54.969545, 270.18374, 207.48491, 135.88316, 4979.6, 2_461_335.5),
    appearance: { kind: 'terrestrial', seed: 126, landLow: [0.06, 0.06, 0.06], landMid: [0.13, 0.12, 0.11], landHigh: [0.26, 0.25, 0.23], craters: 0.6, roughness: 2.5, variation: 0.4 },
    description: 'A comet with a 13.6-year period and a two-lobed nucleus. It is the source of the Ursid meteor shower in late December; last perihelion 2021, next 2035.',
    facts: { 'Discovery': '1790, P. Méchain; 1858, H. Tuttle', 'Period': '13.6 years', 'Meteor shower': 'Ursids (22 December)' },
  },

  /* ---------------- Spacecraft ---------------- */
  ...SPACECRAFT,
];

export const PLANET_HOTKEYS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'sun'];

/** Small-body populations rendered as GPU particle belts */
export const SOLAR_BELTS: GeneratedBelt[] = [
  {
    name: 'Asteroid Belt', count: 24_000, aMin: 2.06, aMax: 3.28, eMax: 0.25, iSigmaDeg: 7,
    color: [0.75, 0.70, 0.62], opacity: 0.9, seed: 7,
    gaps: [[2.50, 0.02], [2.82, 0.015], [2.95, 0.012], [3.27, 0.02]],
  },
  {
    name: 'Trojan Asteroids (L4)', count: 2_500, aMin: 5.05, aMax: 5.35, eMax: 0.12, iSigmaDeg: 10,
    color: [0.6, 0.55, 0.5], opacity: 0.7, seed: 8, trojan: { aAU: 5.2029, meanLongitudeDeg: 34.4 + 60 },
  },
  {
    name: 'Trojan Asteroids (L5)', count: 2_500, aMin: 5.05, aMax: 5.35, eMax: 0.12, iSigmaDeg: 10,
    color: [0.6, 0.55, 0.5], opacity: 0.7, seed: 9, trojan: { aAU: 5.2029, meanLongitudeDeg: 34.4 - 60 },
  },
  {
    name: 'Kuiper Belt', count: 30_000, aMin: 37, aMax: 50, eMax: 0.2, iSigmaDeg: 6,
    color: [0.55, 0.62, 0.8], opacity: 0.75, seed: 10,
  },
  {
    name: 'Scattered Disc', count: 5_000, aMin: 50, aMax: 120, eMax: 0.55, iSigmaDeg: 20,
    color: [0.5, 0.55, 0.75], opacity: 0.5, seed: 11,
  },
];

export { GRAY };
