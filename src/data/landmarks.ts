import type { Vector3 } from 'three';
import type { BodyData } from './types';
import type { StarInfo } from './StarCatalog';
import { starBody, syntheticInfo } from './blackholes';
import { PULSARS, pulsarBodies, pulsarInfo, type PulsarParams } from './pulsars';
import { catalogueCluster, globularCount, nebulaCluster, type ClusterParams } from '../galaxy/ClusterStars';

/**
 * Real, named deep-sky landmarks: nebulae, clusters, supernova remnants and a few record-holding
 * stars — in the Milky Way and in the nearby galaxies. Nebulae/clusters/remnants are drawn as
 * sprites and are destinations; stars become visitable systems (`l{n}` ids).
 */
export type LandmarkKind = 'nebula' | 'cluster' | 'remnant' | 'star' | 'pulsar' | 'planetary' | 'globular';

export const LANDMARK_KIND_LABEL: Record<LandmarkKind, string> = {
  nebula: 'Nebula',
  cluster: 'Star cluster',
  remnant: 'Supernova / planetary nebula remnant',
  star: 'Star',
  pulsar: 'Pulsar / neutron star',
  planetary: 'Planetary nebula',
  globular: 'Globular cluster',
};

export interface LandmarkStar {
  massSolar: number;
  radiusSolar: number;
  temperature: number;
  luminosity: number;
  spectral: string;
}

export interface LandmarkDef {
  id: string;
  name: string;
  kind: LandmarkKind;
  /** substring of the host galaxy's catalogue name; null = Milky Way */
  galaxy: string | null;
  ra: number;
  dec: number;
  /** distance (pc) from the Sun; omitted for objects in other galaxies (sightline ∩ galaxy plane) */
  distancePc?: number;
  /** visual radius (pc) of the sprite */
  radiusPc: number;
  /** integrated absolute magnitude (V) */
  absMag: number;
  /** sprite tint (linear RGB) */
  color: [number, number, number];
  summary: string;
  description: string;
  facts: Record<string, string>;
  /** physical parameters when `kind === 'star'` (makes the landmark a visitable system) */
  star?: LandmarkStar;
  /** physical parameters when `kind === 'pulsar'` (visitable system, see data/pulsars.ts) */
  pulsar?: PulsarParams;
  /** generated object (see galaxy/ProcLandmarks.ts); position comes with the landmark, not from ra/dec */
  procedural?: true;
  /** survey-catalogue entry (data/DeepSky.ts): labelled only when close, like the generated ones */
  catalog?: true;
  /** star clusters: age / population, from which the selectable member stars are generated */
  cluster?: ClusterParams;
  /** generated emission nebulae: what sets their mix of emission lines (catalogue objects: the reference mix) */
  gas?: NebulaGas;
}

/**
 * How a remnant shines: young Type Ia shells show almost nothing but Balmer lines (Tycho), young
 * core-collapse ones the oxygen of the star's interior (Cas A), a pulsar fills one with synchrotron
 * light (the Crab); later a radiative shock lights red and teal filaments (the Veil) until the
 * shell fades into a faint red web (Simeis 147).
 */
export type RemnantClass = 'radiative' | 'balmer' | 'oxygen' | 'plerion' | 'faded';

export interface NebulaGas {
  /**
   * 0 … 1: how hard the ionising light is (the hottest O stars, a hotter central star, fast
   * shocks); sets how far [O III] reaches. Reflection nebulae: the colour of the lighting star
   * (0 a cool K–M supergiant, yellow-orange; 1 an early B star, deep blue).
   */
  excitation: number;
  /** 0 … 1: share of the low-ionisation lines [S II] / [N II] (metals, shocks, nitrogen-rich ejecta) */
  lowIon: number;
  /** 0 … 1: how much of the stars' light the dust scatters back to us (blue reflection lanes, as in M20) */
  scatter?: number;
  remnant?: RemnantClass;
}

/** landmark is a visitable system (`l{n}` id) */
export function isSystemLandmark(def: LandmarkDef): boolean {
  return def.star !== undefined || def.pulsar !== undefined;
}

/** Sky position → sprite colour presets */
export const EMISSION: [number, number, number] = [1.0, 0.45, 0.55];   // Hα + [O III]
export const OLD_CLUSTER: [number, number, number] = [1.0, 0.9, 0.7];
export const YOUNG_CLUSTER: [number, number, number] = [0.75, 0.85, 1.0];
export const PLANETARY: [number, number, number] = [0.5, 0.95, 0.9];
export const SNR: [number, number, number] = [0.9, 0.8, 1.0];

const KPC_M31 = 765_000;

export const LANDMARKS: LandmarkDef[] = [
  /* ---------------- Milky Way ---------------- */
  {
    id: 'l-m42', name: 'Orion Nebula (M42)', kind: 'nebula', galaxy: null, ra: 83.822, dec: -5.391, distancePc: 412, radiusPc: 6, absMag: -4.1, color: EMISSION,
    summary: 'The nearest giant star-forming region',
    description: 'The naked-eye nebula in Orion\'s sword; a star factory 1,300 light-years away and 24 light-years across. The four hot stars of the Trapezium cluster at its centre ionise and light up the cloud; Hubble has imaged hundreds of protoplanetary discs (proplyds) within it.',
    facts: { 'Distance': '412 pc (1,340 light-years)', 'Apparent magnitude': '4.0', 'Diameter': '~24 light-years', 'Mass': '~2 000 M☉', 'Discovery': '1610, Peiresc' },
  },
  {
    id: 'l-pleiades', name: 'Pleiades (M45)', kind: 'cluster', galaxy: null, ra: 56.75, dec: 24.117, distancePc: 136, radiusPc: 7, absMag: -4.1, color: YOUNG_CLUSTER,
    summary: 'The Seven Sisters — the most famous open cluster',
    description: 'A 100-million-year-old open cluster in Taurus; it holds ~1,000 stars, and its bright B-type members light up the dust cloud they are passing through as a blue reflection nebula. Every culture in human history has a name for it.',
    facts: { 'Distance': '136 pc (444 light-years)', 'Apparent magnitude': '1.6', 'Age': '~100 million years', 'Number of stars': '~1 000', 'Core radius': '~2.5 pc' },
  },
  {
    id: 'l-carina', name: 'Carina Nebula (NGC 3372)', kind: 'nebula', galaxy: null, ra: 161.1, dec: -59.6, distancePc: 2600, radiusPc: 45, absMag: -11.1, color: EMISSION,
    summary: 'The giant nebula of the southern sky; home of Eta Carinae',
    description: 'Four times larger and far brighter than the Orion Nebula; it hosts dozens of the Milky Way\'s most massive stars (Eta Carinae, WR 25, the Trumpler 14/16 clusters). The "Cosmic Cliffs" in JWST\'s first images lie at the edge of this nebula.',
    facts: { 'Distance': '2,600 pc (8,500 light-years)', 'Apparent magnitude': '1.0', 'Diameter': '~300 light-years', 'Discovery': '1752, Lacaille' },
  },
  {
    id: 'l-etacar', name: 'Eta Carinae', kind: 'star', galaxy: null, ra: 161.265, dec: -59.684, distancePc: 2300, radiusPc: 0.05, absMag: -8.5, color: [1, 0.85, 0.7],
    summary: 'The brightest and most unstable star in the Milky Way',
    description: 'A binary of two giant stars of roughly 100 and 30 solar masses. In the "Great Eruption" of 1843 it became the second-brightest star in the sky and ejected more than 10 solar masses of material, forming the Homunculus Nebula. It is expected to go supernova in the near (astronomical) future.',
    facts: { 'Distance': '2,300 pc (7,500 light-years)', 'Luminosity': '~5 million L☉', 'Mass': '~100 + 30 M☉', 'Orbital period (binary)': '5.54 years', 'Type': 'Luminous blue variable (LBV)' },
    star: { massSolar: 100, radiusSolar: 300, temperature: 15_000, luminosity: 5e6, spectral: 'LBV' },
  },
  {
    id: 'l-m1', name: 'Crab Nebula (M1)', kind: 'remnant', galaxy: null, ra: 83.633, dec: 22.0145, distancePc: 2000, radiusPc: 1.7, absMag: -3.1, color: SNR,
    summary: 'The remnant and pulsar of the supernova of 1054',
    description: 'The remnant of the supernova that Chinese astronomers saw even in daylight in 1054. At its centre the Crab Pulsar, spinning 30 times a second, powers the nebula with synchrotron radiation; it is still expanding at 1,500 km/s. The first object in the Messier catalogue.',
    facts: { 'Distance': '2,000 pc (6,500 light-years)', 'Apparent magnitude': '8.4', 'Explosion': '4 July 1054', 'Pulsar period': '33.5 ms', 'Expansion speed': '~1,500 km/s' },
  },
  {
    id: 'l-m16', name: 'Eagle Nebula (M16)', kind: 'nebula', galaxy: null, ra: 274.7, dec: -13.807, distancePc: 1740, radiusPc: 10, absMag: -5.2, color: EMISSION,
    summary: 'The nebula of the "Pillars of Creation"',
    description: 'Hubble\'s iconic 1995 "Pillars of Creation" photograph shows the 4–5-light-year-long columns of cold gas at the heart of this nebula, where new stars are being born. The young cluster NGC 6611 lights the nebula.',
    facts: { 'Distance': '1,740 pc (5,700 light-years)', 'Apparent magnitude': '6.0', 'Age (cluster)': '~1–2 million years' },
  },
  {
    id: 'l-m8', name: 'Lagoon Nebula (M8)', kind: 'nebula', galaxy: null, ra: 270.92, dec: -24.38, distancePc: 1250, radiusPc: 17, absMag: -4.5, color: EMISSION,
    summary: 'A giant H II region visible to the naked eye in Sagittarius',
    description: 'Towards the Galactic centre in Sagittarius; a bright emission nebula 110 × 50 light-years in size. Its "Hourglass" structure and Bok globules show the early stages of star formation.',
    facts: { 'Distance': '1,250 pc (4,100 light-years)', 'Apparent magnitude': '6.0', 'Size': '110 × 50 light-years' },
  },
  {
    id: 'l-omegacen', name: 'Omega Centauri (NGC 5139)', kind: 'cluster', galaxy: null, ra: 201.697, dec: -47.48, distancePc: 5240, radiusPc: 30, absMag: -10.3, color: OLD_CLUSTER,
    summary: 'The largest globular cluster of the Milky Way',
    description: 'A giant globular cluster of 10 million stars and 4 million solar masses — probably the core of a dwarf galaxy swallowed by the Milky Way. There is strong evidence for an intermediate-mass black hole (~40,000 M☉) at its centre.',
    facts: { 'Distance': '5,240 pc (17,000 light-years)', 'Apparent magnitude': '3.9', 'Mass': '~4 × 10⁶ M☉', 'Number of stars': '~10 million', 'Age': '~12 billion years' },
  },
  {
    id: 'l-47tuc', name: '47 Tucanae (NGC 104)', kind: 'cluster', galaxy: null, ra: 6.024, dec: -72.081, distancePc: 4450, radiusPc: 25, absMag: -9.4, color: OLD_CLUSTER,
    summary: 'The second-brightest globular cluster in the sky',
    description: 'Although it appears right next to the Small Magellanic Cloud, it is 15 times closer — a globular cluster belonging to the Milky Way\'s halo. Its dense core hosts dozens of millisecond pulsars.',
    facts: { 'Distance': '4,450 pc (14,500 light-years)', 'Apparent magnitude': '4.1', 'Mass': '~7 × 10⁵ M☉', 'Millisecond pulsars': '25+' },
  },
  {
    id: 'l-wd1', name: 'Westerlund 1', kind: 'cluster', galaxy: null, ra: 251.767, dec: -45.851, distancePc: 3900, radiusPc: 1.5, absMag: -11, color: YOUNG_CLUSTER,
    summary: 'The most massive young super star cluster in the Milky Way',
    description: 'A "super star cluster" only 3–5 million years old with ~60,000 solar masses: hundreds of giant stars, 24 Wolf-Rayet stars, yellow hypergiants and a magnetar (CXOU J1647). Heavily dimmed by dust in the optical, it shines in the infrared.',
    facts: { 'Distance': '3,900 pc (12,700 light-years)', 'Mass': '~6 × 10⁴ M☉', 'Age': '3–5 million years', 'Wolf-Rayet stars': '24' },
  },
  {
    id: 'l-m57', name: 'Ring Nebula (M57)', kind: 'remnant', galaxy: null, ra: 283.396, dec: 33.029, distancePc: 787, radiusPc: 0.4, absMag: -0.7, color: PLANETARY,
    summary: 'The best-known planetary nebula',
    description: 'In Lyra, the outer layers shed by a Sun-like star at the end of its life. The 120,000 K white dwarf at the centre ionises the ring; a preview of the Sun\'s fate ~5 billion years from now.',
    facts: { 'Distance': '787 pc (2,570 light-years)', 'Apparent magnitude': '8.8', 'Age': '~7,000 years', 'Central star': 'White dwarf, ~120,000 K' },
  },
  {
    id: 'l-m27', name: 'Dumbbell Nebula (M27)', kind: 'remnant', galaxy: null, ra: 299.90, dec: 22.72, distancePc: 380, radiusPc: 0.7, absMag: -0.4, color: PLANETARY,
    summary: 'The first planetary nebula discovered (1764)',
    description: 'Discovered by Messier in 1764, the first of its kind. At 380 pc it is one of the nearest and brightest planetary nebulae; it has been expanding for ~10,000 years.',
    facts: { 'Distance': '380 pc (1,240 light-years)', 'Apparent magnitude': '7.5', 'Age': '~10,000 years' },
  },
  {
    id: 'l-helix', name: 'Helix Nebula (NGC 7293)', kind: 'remnant', galaxy: null, ra: 337.411, dec: -20.837, distancePc: 200, radiusPc: 0.9, absMag: 1.1, color: PLANETARY,
    summary: 'The "Eye of God" — one of the nearest planetary nebulae',
    description: 'In Aquarius, only 650 light-years away; it covers half the apparent size of the Moon on the sky. Thousands of comet-like knots along its inner edge are sculpted by the wind of the central star.',
    facts: { 'Distance': '200 pc (650 light-years)', 'Apparent magnitude': '7.6', 'Age': '~10,600 years' },
  },
  {
    id: 'l-casa', name: 'Cassiopeia A', kind: 'remnant', galaxy: null, ra: 350.85, dec: 58.815, distancePc: 3400, radiusPc: 2.5, absMag: -6, color: SNR,
    summary: 'The brightest radio source in the sky; remnant of a supernova around 1680',
    description: 'The remnant of a supernova that exploded about 340 years ago — one of the last observed in the Milky Way, though dust may have hidden the explosion. The neutron star at its centre was discovered in Chandra\'s first-light image; JWST revealed the remnant\'s "Green Monster" structure.',
    facts: { 'Distance': '3,400 pc (11,000 light-years)', 'Explosion': '~1680', 'Expansion speed': '4,000–6,000 km/s', 'Centre': 'Neutron star' },
  },

  /* ---------------- Large Magellanic Cloud ---------------- */
  {
    id: 'l-30dor', name: 'Tarantula Nebula (30 Doradus)', kind: 'nebula', galaxy: 'Large Magellanic', ra: 84.76, dec: -69.14, radiusPc: 100, absMag: -10.5, color: EMISSION,
    summary: 'The largest star-forming region in the Local Group',
    description: 'The Large Magellanic Cloud\'s giant H II region, 1,000 light-years across; if it were where the Orion Nebula is, it would be bright enough to cast shadows. The R136 cluster at its centre holds the most massive stars known; SN 1987A exploded nearby.',
    facts: { 'Distance': '49.6 kpc (LMC)', 'Apparent magnitude': '8.0', 'Diameter': '~1,000 light-years', 'Mass (gas)': '~10⁶ M☉' },
  },
  {
    id: 'l-r136a1', name: 'R136a1', kind: 'star', galaxy: 'Large Magellanic', ra: 84.6767, dec: -69.1008, radiusPc: 0.05, absMag: -12.5, color: [0.7, 0.8, 1],
    summary: 'Most massive and brightest star known',
    description: 'The brightest member of the R136 cluster at the heart of the Tarantula Nebula: about 200 solar masses, 4.7 million solar luminosities, a surface temperature of 46,000 K. A hydrogen-burning Wolf-Rayet star (WN5h); younger than 1 million years and losing thousands of Earth masses a year to its winds.',
    facts: { 'Mass': '~196 M☉ (170–230)', 'Luminosity': '4.7 × 10⁶ L☉', 'Temperature': '46 000 K', 'Radius': '~39 R☉', 'Spectrum': 'WN5h', 'Age': '< 1 million years' },
    star: { massSolar: 196, radiusSolar: 39, temperature: 46_000, luminosity: 4.7e6, spectral: 'WN5h' },
  },
  {
    id: 'l-sn1987a', name: 'SN 1987A', kind: 'remnant', galaxy: 'Large Magellanic', ra: 83.8667, dec: -69.2697, radiusPc: 0.6, absMag: -6, color: SNR,
    summary: 'The nearest supernova of the telescope era (1987)',
    description: 'The remnant of the blue supergiant Sanduleak −69° 202, which exploded on 23 February 1987; the first object from which supernova neutrinos were detected. Hubble and JWST have shown the blast wave hitting rings ejected 20,000 years earlier and, in 2024, traces of the neutron star at the centre.',
    facts: { 'Distance': '51.4 kpc', 'Explosion': '23 February 1987', 'Progenitor': 'Sanduleak −69° 202 (blue supergiant)', 'Peak magnitude': '2.9', 'Neutrinos': '25 detected (Kamiokande, IMB, Baksan)' },
  },
  {
    id: 'l-wohg64', name: 'WOH G64', kind: 'star', galaxy: 'Large Magellanic', ra: 73.294, dec: -68.3417, radiusPc: 0.05, absMag: -8.5, color: [1, 0.6, 0.4],
    summary: 'One of the largest stars known — 1,500 solar radii',
    description: 'A red hypergiant in the Large Magellanic Cloud that, put in the Sun\'s place, would swallow Jupiter\'s orbit. In 2024 it became the first star outside the Milky Way to be imaged up close with the VLTI: wrapped in a thick cocoon of dust and in its final stages before a supernova.',
    facts: { 'Radius': '~1 540 R☉', 'Mass': '~25 M☉', 'Luminosity': '2.8 × 10⁵ L☉', 'Temperature': '~3 400 K', 'Spectrum': 'M7.5 I' },
    star: { massSolar: 25, radiusSolar: 1540, temperature: 3400, luminosity: 2.8e5, spectral: 'M7.5 I' },
  },
  {
    id: 'l-ngc1850', name: 'NGC 1850', kind: 'cluster', galaxy: 'Large Magellanic', ra: 77.19, dec: -68.76, radiusPc: 12, absMag: -9.6, color: YOUNG_CLUSTER,
    summary: 'The LMC\'s young double cluster — nothing like it in the Milky Way',
    description: 'A star cluster only 100 million years old yet as massive as a globular cluster; beside it is an even younger companion cluster, just 4 million years old. Such young, massive clusters no longer form in the Milky Way.',
    facts: { 'Distance': '49.6 kpc (LMC)', 'Apparent magnitude': '9.0', 'Age': '~100 million years', 'Mass': '~10⁵ M☉' },
  },

  /* ---------------- Small Magellanic Cloud ---------------- */
  {
    id: 'l-ngc346', name: 'NGC 346', kind: 'nebula', galaxy: 'Small Magellanic', ra: 14.77, dec: -72.18, radiusPc: 50, absMag: -9, color: EMISSION,
    summary: 'The brightest star-forming region of the Small Magellanic Cloud',
    description: 'The most active star factory in the metal-poor Small Magellanic Cloud; JWST showed that it holds enough dust to form planets under conditions resembling the early universe.',
    facts: { 'Distance': '62 kpc (SMC)', 'Apparent magnitude': '10.3', 'Young star': '2 500+' },
  },
  {
    id: 'l-ngc602', name: 'NGC 602', kind: 'cluster', galaxy: 'Small Magellanic', ra: 22.37, dec: -73.56, radiusPc: 30, absMag: -7, color: YOUNG_CLUSTER,
    summary: 'A young star-forming cluster at the edge of the SMC (a Hubble classic)',
    description: 'A 5-million-year-old cluster on the outer wing of the Small Magellanic Cloud, carving out the surrounding N90 nebula as it grows. Famous for the Hubble photograph with distant galaxies visible in the background.',
    facts: { 'Distance': '61 kpc (SMC)', 'Age': '~5 million years' },
  },

  /* ---------------- Andromeda (M31) ---------------- */
  {
    id: 'l-g1', name: 'Mayall II (G1)', kind: 'cluster', galaxy: 'Andromeda', ra: 10.0942, dec: 39.5742, distancePc: KPC_M31, radiusPc: 15, absMag: -10.9, color: OLD_CLUSTER,
    summary: 'The most massive globular cluster in the Local Group',
    description: 'In Andromeda\'s halo, 130,000 light-years from the centre; a globular cluster of 10 million solar masses, twice the mass of Omega Centauri. Like Omega Centauri it is probably the core of a swallowed dwarf galaxy; it may harbour a ~20,000 M☉ black hole.',
    facts: { 'Distance': '765 kpc (M31 halo)', 'Apparent magnitude': '13.7', 'Mass': '~10⁷ M☉', 'Age': '~12 billion years' },
  },
  {
    id: 'l-ngc206', name: 'NGC 206', kind: 'cluster', galaxy: 'Andromeda', ra: 10.1, dec: 40.73, radiusPc: 500, absMag: -14, color: YOUNG_CLUSTER,
    summary: 'Andromeda\'s giant star cloud',
    description: 'An OB star cloud 4,000 light-years across in Andromeda\'s south-western spiral arm; the richest young stellar association in the Local Group. Even a small telescope shows it as a bright patch in the disc of M31.',
    facts: { 'Distance': '765 kpc (M31)', 'Diameter': '~4,000 light-years', 'Age': '~10–50 million years' },
  },
  {
    id: 'l-m31v1', name: 'Hubble\'s Cepheid V1', kind: 'star', galaxy: 'Andromeda', ra: 10.3638, dec: 41.1696, radiusPc: 0.05, absMag: -5.5, color: [1, 0.95, 0.8],
    summary: 'The star that changed the size of the universe (1923)',
    description: 'The variable star Edwin Hubble found in Andromeda in 1923; its period–luminosity relation proved that the "Andromeda Nebula" is a separate galaxy outside the Milky Way. A Cepheid with a 31.4-day period; today the Hubble Space Telescope has observed it too.',
    facts: { 'Distance': '765 kpc (M31)', 'Period': '31.4 days', 'Apparent magnitude': '18.5–19.5', 'Type': 'Classical Cepheid', 'Discovery': 'October 1923, Hubble, 100-inch Hooker' },
    star: { massSolar: 7, radiusSolar: 110, temperature: 5800, luminosity: 1.2e4, spectral: 'F–G Ib' },
  },
  {
    id: 'l-sandr', name: 'S Andromedae (SN 1885A)', kind: 'remnant', galaxy: 'Andromeda', ra: 10.6797, dec: 41.2678, radiusPc: 1.2, absMag: -4, color: SNR,
    summary: 'The first supernova observed outside the Milky Way',
    description: 'A supernova that flared in 1885 just 16 arcseconds from Andromeda\'s centre, almost visible to the naked eye (magnitude 5.8). In 1988 Hubble found its remnant as a dark cloud of iron silhouetted against Andromeda\'s bulge.',
    facts: { 'Explosion': '20 August 1885', 'Peak magnitude': '5.8', 'Type': 'Ia (subluminous)', 'Remnant': 'Iron-rich, ~13,000 km/s' },
  },

  /* ---------------- Triangulum (M33) ---------------- */
  {
    id: 'l-ngc604', name: 'NGC 604', kind: 'nebula', galaxy: 'M33', ra: 23.6396, dec: 30.7833, radiusPc: 230, absMag: -12.6, color: EMISSION,
    summary: 'One of the largest H II regions in the Local Group',
    description: 'A stellar nursery in the Triangulum Galaxy 1,500 light-years across, 100 times larger than the Orion Nebula; a giant bubble of gas carved out by more than 200 hot giant stars. Together with the Tarantula it is one of the largest nebulae in the Local Group.',
    facts: { 'Distance': '840 kpc (M33)', 'Diameter': '~1,500 light-years', 'Apparent magnitude': '12', 'Massive star': '200+' },
  },
  ...PULSARS,
];

// emission nebulae carry a generated exciting cluster inside the cloud, clusters their members:
// selectable stars below the star catalogue's completeness limit (the bright ones are the
// catalogue's own)
for (const d of LANDMARKS) {
  if (d.cluster) continue;
  if (d.kind === 'nebula') d.cluster = nebulaCluster(d.radiusPc, d.distancePc);
  else if (d.kind === 'globular' || (d.kind === 'cluster' && d.color === OLD_CLUSTER)) d.cluster = catalogueCluster(d.distancePc, { ageMyr: 12_000, count: globularCount(d.absMag) });
  else if (d.kind === 'cluster') d.cluster = catalogueCluster(d.distancePc, { ageMyr: 60, count: 500 });
}

/* ---------------- helpers for star-type landmarks ---------------- */

export function landmarkStarBodies(def: LandmarkDef): BodyData[] {
  if (def.pulsar) return pulsarBodies(def);
  const s = def.star!;
  return [starBody(def.id, def.name, s.massSolar, s.radiusSolar, s.temperature, def.description, { ...def.facts, 'Spectrum': s.spectral })];
}

export function landmarkStarInfo(def: LandmarkDef, positionPc: Vector3): StarInfo {
  if (def.pulsar) return pulsarInfo(def, positionPc);
  const s = def.star!;
  return syntheticInfo(def.name, positionPc, s.massSolar, s.radiusSolar, s.temperature, s.luminosity, s.spectral);
}
