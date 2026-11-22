import type { BodyData, LinearState, SimpleElements } from './types';
import { J2000_JD } from '../core/constants';

/**
 * Human-made spacecraft, shown at their (approximate) present positions.
 * Sources: NASA/JPL Horizons & mission pages. Interstellar probes: heliocentric state vectors
 * of 2026-10-22 (JD 2461335.5) extrapolated in a straight line; BepiColombo, Europa Clipper and
 * Hera: sampled Horizons ephemerides in /ephem (scripts/fetch-horizons.mjs).
 * 3D models: NASA 3D Resources (public domain), served from /models.
 */

/** Horizons epoch of the probe states below */
export const PROBE_EPOCH_JD = 2_461_335.5;
export const PROBE_EPOCH_LABEL = '2026-10-22';

/** Straight-line heliocentric state (km, km/s; ecliptic J2000) */
function state(pos: [number, number, number], vel: [number, number, number]): LinearState {
  return { kind: 'linear', epoch: PROBE_EPOCH_JD, pos, vel };
}

function orbit(a: number, e: number, i: number, period: number, M0: number, node: number, argPeri: number, frame: SimpleElements['frame'] = 'parentEquator', epoch = J2000_JD): SimpleElements {
  return { kind: 'simple', a, e, i, period, M0, node, argPeri, epoch, frame };
}

const M = (file: string) => `${import.meta.env.BASE_URL}models/${file}.glb`;
const HORIZONS = 'NASA/JPL Horizons';

export const SPACECRAFT: BodyData[] = [
  /* ---------------- interstellar / outer probes ---------------- */
  {
    id: 'voyager1', name: 'Voyager 1', type: 'spacecraft', parent: 'sun',
    radius: 0.0065, mass: 825, albedo: 0.3,
    orbit: state([-4.815275e9, -2.049336e10, 1.482731e10], [-2.0697, -13.6113, 9.8318]),
    appearance: { kind: 'spacecraft', model: M('voyager'), seed: 901 },
    description: 'The farthest human-made object. Launched on 5 September 1977; after flybys of Jupiter (1979) and Saturn (1980) it crossed the heliopause in 2012 and entered interstellar space. It carries the Golden Record.',
    facts: { 'Launch': '5 September 1977 (Titan IIIE)', 'Agency': 'NASA / JPL', 'Status': 'Active – interstellar space', 'Signal delay': '~23 hours (one way)' },
  },
  {
    id: 'voyager2', name: 'Voyager 2', type: 'spacecraft', parent: 'sun',
    radius: 0.0065, mass: 825, albedo: 0.3,
    orbit: state([5.975126e9, -1.579419e10, -1.343996e10], [4.2034, -9.3402, -11.3165]),
    appearance: { kind: 'spacecraft', model: M('voyager'), seed: 902 },
    description: 'The only spacecraft to have visited all four giant planets (Jupiter 1979, Saturn 1981, Uranus 1986, Neptune 1989). It crossed the heliopause in 2018 and is in interstellar space in the southern ecliptic hemisphere.',
    facts: { 'Launch': '20 August 1977 (Titan IIIE)', 'Agency': 'NASA / JPL', 'Status': 'Active – interstellar space', 'Signal delay': '~19 hours (one way)' },
  },
  {
    id: 'pioneer10', name: 'Pioneer 10', type: 'spacecraft', parent: 'sun',
    radius: 0.0015, mass: 258, albedo: 0.3,
    orbit: state([3.603206e9, 2.091676e10, 1.106985e9], [1.2270, 11.7699, 0.6030]),
    appearance: { kind: 'spacecraft', model: M('pioneer'), seed: 903 },
    description: 'The first spacecraft to cross the asteroid belt and pass Jupiter (1973). The last signal was received on 23 January 2003; it is drifting silently towards Aldebaran.',
    facts: { 'Launch': '2 March 1972 (Atlas-Centaur)', 'Agency': 'NASA / Ames', 'Status': 'Inactive (silent since 2003)' },
  },
  {
    id: 'pioneer11', name: 'Pioneer 11', type: 'spacecraft', parent: 'sun',
    radius: 0.0015, mass: 259, albedo: 0.3,
    orbit: state([4.358680e9, -1.658905e10, 4.227442e9], [4.0374, -10.0955, 2.4312]),
    appearance: { kind: 'spacecraft', model: M('pioneer'), seed: 904 },
    description: 'The first spacecraft to reach Saturn (1979). Its mission ended in 1995 as power dwindled; it is drifting towards the constellation Aquila.',
    facts: { 'Launch': '6 April 1973 (Atlas-Centaur)', 'Agency': 'NASA / Ames', 'Status': 'Inactive (silent since 1995)' },
  },
  {
    id: 'newhorizons', name: 'New Horizons', type: 'spacecraft', parent: 'sun',
    radius: 0.0015, mass: 478, albedo: 0.4,
    orbit: state([3.128322e9, -9.338993e9, 3.435486e8], [5.3071, -12.4873, 0.4914]),
    appearance: { kind: 'spacecraft', model: M('pioneer'), seed: 905, representative: true },
    description: 'The probe that flew past Pluto (2015) and the Kuiper Belt object Arrokoth (2019). It continues to study the heliosphere in the outer Kuiper Belt. (Model is schematic.)',
    facts: { 'Launch': '19 January 2006 (Atlas V)', 'Agency': 'NASA / APL', 'Status': 'Active – Kuiper Belt' },
  },

  /* ---------------- Events: sampled Horizons ephemerides ---------------- */
  {
    id: 'bepicolombo', name: 'BepiColombo', type: 'spacecraft', parent: 'mercury',
    radius: 0.004, mass: 4_100, albedo: 0.5,
    orbit: { kind: 'ephemeris', table: 'bepicolombo' },
    appearance: { kind: 'spacecraft', model: M('dawn'), seed: 920, representative: true },
    description: 'The joint ESA/JAXA mission to Mercury. Launched in 2018; after nine planetary flybys it is slowly captured into Mercury orbit in November 2026. It carries two orbiters: ESA\'s MPO and JAXA\'s Mio. Its position is derived from the sampled trajectory published by JPL Horizons; outside the data span the spacecraft is not shown. (The model is representative.)',
    facts: { 'Launch': '20 October 2018 (Ariane 5)', 'Agency': 'ESA / JAXA', 'Status': 'Mercury orbit insertion – November 2026', 'Source': `${HORIZONS}, 2026-10-22` },
  },
  {
    id: 'europaclipper', name: 'Europa Clipper', type: 'spacecraft', parent: 'earth',
    radius: 0.015, mass: 6_065, albedo: 0.5,
    orbit: { kind: 'ephemeris', table: 'europaclipper' },
    appearance: { kind: 'spacecraft', model: M('juno'), seed: 921, representative: true },
    description: 'NASA\'s probe to study Jupiter\'s moon Europa; with a 30 m solar array span, NASA\'s largest interplanetary spacecraft. It gains speed flying past Mars in March 2025 and Earth in December 2026, and arrives at Jupiter in 2030. Its position is derived from the sampled JPL Horizons trajectory. (The model is representative.)',
    facts: { 'Launch': '14 October 2024 (Falcon Heavy)', 'Agency': 'NASA / JPL', 'Status': 'Earth flyby – 3 December 2026', 'Source': `${HORIZONS}, 2026-10-22` },
  },
  {
    id: 'hera', name: 'Hera', type: 'spacecraft', parent: 'didymos',
    radius: 0.003, mass: 1_128, albedo: 0.5,
    orbit: { kind: 'ephemeris', table: 'hera' },
    appearance: { kind: 'spacecraft', model: M('dawn'), seed: 922, representative: true },
    description: 'ESA\'s planetary defence mission: it studies Dimorphos, struck by DART in 2022, and its primary Didymos up close. It arrives at the binary asteroid in November 2026 and carries two CubeSats, Milani and Juventas. Its position is derived from the trajectory JPL Horizons has published up to 4 November 2026. (The model is representative.)',
    facts: { 'Launch': '7 October 2024 (Falcon 9)', 'Agency': 'ESA', 'Status': 'Didymos approach – November 2026', 'Source': `${HORIZONS}, 2026-10-22` },
  },

  /* ---------------- inner Solar System ---------------- */
  {
    id: 'parker', name: 'Parker Solar Probe', type: 'spacecraft', parent: 'sun',
    radius: 0.0015, mass: 685, albedo: 0.5,
    // final 88-day orbit; perihelion 2024-12-24 (6.1 million km from the photosphere)
    orbit: orbit(58_044_000, 0.882, 3.4, 88.0, 0, 70, 40, 'ecliptic', 2_460_668.5),
    appearance: { kind: 'spacecraft', model: M('parker'), seed: 906 },
    description: 'The closest and fastest human-made object to the Sun: ~6.9 million km at perihelion at 690,000 km/h. Behind its carbon-composite heat shield it studies the solar corona in situ.',
    facts: { 'Launch': '12 August 2018 (Delta IV Heavy)', 'Agency': 'NASA / APL', 'Status': 'Active – corona passes', 'Record speed': '192 km/s' },
  },

  /* ---------------- Earth orbit & L2 ---------------- */
  {
    id: 'iss', name: 'ISS', type: 'spacecraft', parent: 'earth',
    radius: 0.055, mass: 419_725, albedo: 0.6,
    orbit: orbit(6_789, 0.0006, 51.64, 0.0645, 40, 120, 30),
    appearance: { kind: 'spacecraft', model: M('iss'), seed: 907 },
    description: 'International Space Station: a modular research station in low Earth orbit, continuously crewed since 2000. 109 m wide, it circles the Earth ~16 times a day.',
    facts: { 'First module': '20 November 1998 (Zarya)', 'Partners': 'NASA, Roskosmos, ESA, JAXA, CSA', 'Status': 'Active – crewed', 'Orbital speed': '7.66 km/s' },
  },
  {
    id: 'hubble', name: 'Hubble', type: 'spacecraft', parent: 'earth',
    radius: 0.0067, mass: 11_110, albedo: 0.7,
    orbit: orbit(6_891, 0.0003, 28.47, 0.0661, 200, 60, 10),
    appearance: { kind: 'spacecraft', model: M('hubble'), seed: 908 },
    description: 'Hubble Space Telescope: a visible/UV space telescope with a 2.4 m mirror, in orbit since 1990. Its Deep Field images and measurements of the expansion rate of the universe shaped modern cosmology.',
    facts: { 'Launch': '24 April 1990 (STS-31 Discovery)', 'Agency': 'NASA / ESA', 'Status': 'Active' },
  },
  {
    id: 'jwst', name: 'JWST', type: 'spacecraft', parent: 'earth',
    radius: 0.011, mass: 6_500, albedo: 0.5,
    orbit: { kind: 'lagrange', point: 'L2', distance: 1_500_000 },
    appearance: { kind: 'spacecraft', model: M('jwst'), seed: 909 },
    description: 'James Webb Space Telescope: an infrared space telescope with a 6.5 m folding gold-coated mirror. In a halo orbit around the Sun–Earth L2 point, it observes the first galaxies and exoplanet atmospheres.',
    facts: { 'Launch': '25 December 2021 (Ariane 5)', 'Agency': 'NASA / ESA / CSA', 'Status': 'Active – L2', 'Mirror': '18 hexagonal segments, 6.5 m' },
  },

  /* ---------------- Mars ---------------- */
  {
    id: 'perseverance', name: 'Perseverance', type: 'spacecraft', parent: 'mars',
    radius: 0.0015, mass: 1_025, albedo: 0.4,
    orbit: { kind: 'surface', lat: 18.4447, lon: 77.4508, alt: 0.0011 },
    appearance: {
      kind: 'spacecraft', model: M('perseverance'), seed: 910,
    },
    description: 'A rover searching an ancient lake delta in Jezero Crater for signs of life and caching sample tubes. It carried the Ingenuity helicopter.',
    facts: { 'Launch': '30 July 2020 (Atlas V)', 'Landing': '18 February 2021 – Jezero Crater', 'Agency': 'NASA / JPL', 'Status': 'Active' },
  },
  {
    id: 'curiosity', name: 'Curiosity', type: 'spacecraft', parent: 'mars',
    radius: 0.0015, mass: 899, albedo: 0.4,
    orbit: { kind: 'surface', lat: -4.5895, lon: 137.4417, alt: 0.0011 },
    appearance: {
      kind: 'spacecraft', model: M('perseverance'), seed: 911, representative: true,
    },
    description: 'A radioisotope-powered rover climbing the foothills of Aeolis Mons (Mount Sharp) in Gale Crater. It discovered ancient streambeds and organic molecules. (Model is schematic.)',
    facts: { 'Launch': '26 November 2011 (Atlas V)', 'Landing': '6 August 2012 – Gale Crater', 'Agency': 'NASA / JPL', 'Status': 'Active' },
  },

  /* ---------------- Jupiter ---------------- */
  {
    id: 'juno', name: 'Juno', type: 'spacecraft', parent: 'jupiter',
    radius: 0.01, mass: 1_593, albedo: 0.5,
    // highly elliptical polar orbit; ~33 d since 2023
    orbit: orbit(4_050_000, 0.9815, 90.0, 33.0, 0, 20, 270, 'parentEquator', 2_460_000.5),
    appearance: { kind: 'spacecraft', model: M('juno'), seed: 912 },
    description: 'A solar-powered probe in polar orbit around Jupiter. It has mapped the polar storms, interior structure and magnetic field, and in its extended mission makes close flybys of the Galilean moons.',
    facts: { 'Launch': '5 August 2011 (Atlas V)', 'Arrival': '5 July 2016', 'Agency': 'NASA / JPL', 'Status': 'Active' },
  },
];
