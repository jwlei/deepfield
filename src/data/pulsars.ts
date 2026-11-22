import type { Vector3 } from 'three';
import { AU_KM } from '../core/constants';
import { SUN_MASS_KG, SUN_RADIUS_KM } from '../astro/stellar';
import type { StarInfo } from './StarCatalog';
import type { BodyData, PoleRaDec } from './types';
import type { LandmarkDef } from './landmarks';
import { decimalYearJd, semiMajorKm, starBody, syntheticInfo } from './blackholes';

/**
 * Real pulsars (rotating neutron stars). Each one is a deep-sky landmark of kind `pulsar`
 * and a visitable system: the neutron star itself (with its sweeping beams), plus real
 * companions – the first exoplanets ever found (PSR B1257+12), the Hulse–Taylor binary
 * neutron star, white-dwarf companions of millisecond pulsars.
 *
 * Periods, distances, ages and field strengths follow the ATNF Pulsar Catalogue; beam
 * geometry (magnetic tilt, opening angle) is illustrative.
 */
export interface PulsarParams {
  /** spin period (ms) */
  periodMs: number;
  massSolar: number;
  radiusKm: number;
  /** effective surface temperature (K) used for the thermal glow */
  temperature: number;
  /** spin axis */
  pole: PoleRaDec;
  /** angle between magnetic and spin axis (deg) */
  magneticTilt: number;
  /** half opening angle of each beam (deg) */
  beamHalfAngle: number;
  /** beam length in stellar radii */
  beamLength: number;
  beamColor: [number, number, number];
  /** extra bodies of the system; `parent` must reference the pulsar id */
  companions?: (pulsarId: string) => BodyData[];
}

const EARTH_MASS_KG = 5.9722e24;
const EPOCH = decimalYearJd(2000.0);
export const RADIO: [number, number, number] = [0.55, 0.85, 1.0];
export const GAMMA: [number, number, number] = [0.85, 0.6, 1.0];
export const MAGNETAR: [number, number, number] = [1.0, 0.55, 0.75];
export const PULSAR_SPRITE: [number, number, number] = [0.65, 0.9, 1.0];

function pulsarBody(def: LandmarkDef): BodyData {
  const p = def.pulsar!;
  return {
    id: def.id, name: def.name, type: 'pulsar',
    radius: p.radiusKm,
    mass: p.massSolar * SUN_MASS_KG,
    rotationPeriod: p.periodMs / 3.6e6,
    pole: p.pole,
    appearance: { kind: 'pulsar', seed: (def.id.length * 17) % 991 + 3, magneticTilt: p.magneticTilt, beamHalfAngle: p.beamHalfAngle, beamLength: p.beamLength, beamColor: p.beamColor },
    temperature: p.temperature,
    description: def.description,
    facts: def.facts,
  };
}

export function pulsarBodies(def: LandmarkDef): BodyData[] {
  const p = def.pulsar!;
  return [pulsarBody(def), ...(p.companions?.(def.id) ?? [])];
}

export function pulsarInfo(def: LandmarkDef, positionPc: Vector3): StarInfo {
  const p = def.pulsar!;
  const rSolar = p.radiusKm / SUN_RADIUS_KM;
  const lum = rSolar * rSolar * (p.temperature / 5772) ** 4;
  return syntheticInfo(def.name, positionPc, p.massSolar, rSolar, p.temperature, lum, 'NS');
}

/** A rocky pulsar planet (PSR B1257+12 system) */
function pulsarPlanet(id: string, name: string, parent: string, massEarth: number, radiusKm: number, aAU: number, e: number, periodDays: number, M0: number, seed: number, description: string, facts: Record<string, string>): BodyData {
  return {
    id, name, type: 'planet', parent,
    radius: radiusKm, mass: massEarth * EARTH_MASS_KG, albedo: 0.2, rotationPeriod: 'sync',
    orbit: { kind: 'simple', a: aAU * AU_KM, e, i: 50, node: 110, argPeri: 0, M0, epoch: EPOCH, period: periodDays, frame: 'ecliptic' },
    appearance: { kind: 'terrestrial', seed, landLow: [0.18, 0.17, 0.2], landMid: [0.3, 0.28, 0.32], landHigh: [0.45, 0.42, 0.46], craters: 0.8, roughness: 1.1, variation: 0.4 },
    description, facts,
  };
}

/** White-dwarf companion */
function whiteDwarf(id: string, name: string, parent: string, massSolar: number, radiusSolar: number, temperature: number, periodDays: number, totalMassSolar: number, e: number, description: string, facts: Record<string, string>): BodyData {
  return starBody(id, name, massSolar, radiusSolar, temperature, description, facts, {
    parent,
    orbit: { kind: 'simple', a: semiMajorKm(periodDays, totalMassSolar * SUN_MASS_KG), e, i: 42, node: 20, argPeri: 0, M0: 0, epoch: EPOCH, period: periodDays, frame: 'ecliptic' },
  });
}

export const PULSARS: LandmarkDef[] = [
  {
    id: 'l-crabpsr', name: 'Crab Pulsar (PSR B0531+21)', kind: 'pulsar', galaxy: null, ra: 83.633, dec: 22.0145, distancePc: 2000, radiusPc: 0.05, absMag: 4.5, color: PULSAR_SPRITE,
    summary: 'The neutron star spinning 30 times a second at the heart of the 1054 supernova',
    description: 'The young pulsar powering the Crab Nebula: the core that collapsed in the supernova of 1054 now spins 30 times a second and pumps its rotational energy (100,000 times the Sun\'s total output) into the nebula through winds and beams. One of the first pulsars seen pulsing in radio, optical, X-rays and gamma rays; the first pulsar discovered through its optical pulses (1969).',
    facts: { 'Period': '33.4 ms (30 Hz)', 'Spin-down': '4.2 × 10⁻¹³ s/s', 'Characteristic age': '~1,240 years (actual: 970)', 'Magnetic field': '3.8 × 10¹² G', 'Spin-down luminosity': '4.5 × 10³⁸ erg/s', 'Distance': '2,000 pc (6,500 light-years)', 'Discovery': '1968, Staelin & Reifenstein (NRAO)' },
    pulsar: { periodMs: 33.392, massSolar: 1.4, radiusKm: 12, temperature: 1.6e6, pole: { ra: 83.633, dec: 22.0145 + 64 }, magneticTilt: 55, beamHalfAngle: 12, beamLength: 60, beamColor: RADIO },
  },
  {
    id: 'l-vela', name: 'Vela Pulsar (PSR B0833-45)', kind: 'pulsar', galaxy: null, ra: 128.836, dec: -45.176, distancePc: 287, radiusPc: 0.05, absMag: 5, color: PULSAR_SPRITE,
    summary: 'The brightest gamma-ray source in the sky; the "glitching" pulsar',
    description: 'The 11,000-year-old pulsar at the centre of the Vela Supernova Remnant. It is the brightest persistent gamma-ray source in the sky and regularly "glitches": its spin suddenly speeds up — the most direct evidence for the superfluid interior of neutron stars. Its discovery (1968) proved that pulsars are born in supernovae.',
    facts: { 'Period': '89.3 ms', 'Characteristic age': '11,300 years', 'Magnetic field': '3.4 × 10¹² G', 'Distance': '287 pc (936 light-years)', 'Glitch frequency': 'about once every 3 years', 'Discovery': '1968, Large, Vaughan & Mills (Molonglo)' },
    pulsar: { periodMs: 89.33, massSolar: 1.4, radiusKm: 12, temperature: 1.1e6, pole: { ra: 128.836, dec: -45.176 + 70 }, magneticTilt: 70, beamHalfAngle: 10, beamLength: 50, beamColor: RADIO },
  },
  {
    id: 'l-b1919', name: 'PSR B1919+21 (LGM-1)', kind: 'pulsar', galaxy: null, ra: 290.437, dec: 21.884, distancePc: 300, radiusPc: 0.05, absMag: 6, color: PULSAR_SPRITE,
    summary: 'The first pulsar discovered — Jocelyn Bell Burnell, 1967',
    description: 'The regular 1.337-second pulses that PhD student Jocelyn Bell Burnell noticed on her chart recordings in Cambridge on 28 November 1967. Half-jokingly named "LGM-1" (Little Green Men); the rotating-neutron-star explanation came in 1968 and Hewish received the 1974 Nobel Prize. Its pulse profiles were immortalised on the cover of Joy Division\'s "Unknown Pleasures".',
    facts: { 'Period': '1.3373 s', 'Characteristic age': '16 million years', 'Magnetic field': '1.4 × 10¹² G', 'Distance': '~300 pc (~1,000 light-years)', 'Discovery': '28 November 1967, Bell Burnell & Hewish (Mullard, Cambridge)' },
    pulsar: { periodMs: 1337.3, massSolar: 1.4, radiusKm: 12, temperature: 6e5, pole: { ra: 290.437, dec: 21.884 - 60 }, magneticTilt: 40, beamHalfAngle: 7, beamLength: 45, beamColor: RADIO },
  },
  {
    id: 'l-lich', name: 'PSR B1257+12 (Lich)', kind: 'pulsar', galaxy: null, ra: 195.013, dec: 12.682, distancePc: 600, radiusPc: 0.05, absMag: 6, color: PULSAR_SPRITE,
    summary: 'The star of the first exoplanets ever discovered (1992)',
    description: 'The millisecond pulsar Aleksander Wolszczan found with Arecibo in 1990; microsecond irregularities in its pulses revealed the first planets outside the Solar System in 1992. Its three planets (Draugr, Poltergeist, Phobetor) probably formed in a disc left over from the supernova; dead worlds constantly bathed in the pulsar\'s radiation.',
    facts: { 'Period': '6.219 ms (161 Hz)', 'Characteristic age': '~3 billion years', 'Magnetic field': '8.8 × 10⁸ G', 'Distance': '~600 pc (~2,000 light-years)', 'Planets': 'Draugr, Poltergeist, Phobetor', 'Discovery': '1990, Wolszczan & Frail (Arecibo)' },
    pulsar: {
      periodMs: 6.219, massSolar: 1.4, radiusKm: 12, temperature: 8e5, pole: { ra: 195.013, dec: 12.682 + 50 }, magneticTilt: 60, beamHalfAngle: 14, beamLength: 60, beamColor: RADIO,
      companions: (id) => [
        pulsarPlanet(`${id}-a`, 'Draugr (PSR B1257+12 b)', id, 0.02, 1500, 0.19, 0.0, 25.262, 40, 71,
          'The lowest-mass exoplanet known: about twice the mass of the Moon. Discovered in 1994.', { 'Mass': '0.020 M⊕', 'Orbit': '0.19 AU · 25.26 days' }),
        pulsarPlanet(`${id}-b`, 'Poltergeist (PSR B1257+12 c)', id, 4.3, 9500, 0.36, 0.0186, 66.5419, 200, 72,
          'One of the first exoplanets, announced in 1992; a super-Earth of four Earth masses.', { 'Mass': '4.3 M⊕', 'Orbit': '0.36 AU · 66.54 days', 'Discovery': '1992' }),
        pulsarPlanet(`${id}-c`, 'Phobetor (PSR B1257+12 d)', id, 3.9, 9300, 0.46, 0.0252, 98.2114, 310, 73,
          'The second planet, discovered with Poltergeist in 1992; it is close to a 3:2 resonance with Poltergeist.', { 'Mass': '3.9 M⊕', 'Orbit': '0.46 AU · 98.21 days', 'Discovery': '1992' }),
      ],
    },
  },
  {
    id: 'l-j1748', name: 'PSR J1748-2446ad', kind: 'pulsar', galaxy: null, ra: 267.02, dec: -24.768, distancePc: 5900, radiusPc: 0.05, absMag: 6, color: PULSAR_SPRITE,
    summary: 'The fastest-spinning pulsar known: 716 turns a second',
    description: 'A millisecond pulsar discovered in the globular cluster Terzan 5 in 2004. It spins 716 times a second; its equator moves at nearly a quarter of the speed of light — very close to the limit neutron-star matter can withstand. It is in a 26-hour eclipsing orbit with a bloated companion star.',
    facts: { 'Period': '1.396 ms (716 Hz)', 'Equatorial speed': '~0.24 c', 'Companion': '~0.14 M☉, 1.09-day orbit', 'Cluster': 'Terzan 5', 'Distance': '~5,900 pc (~19,000 light-years)', 'Discovery': '2004, Hessels et al. (GBT)' },
    pulsar: {
      periodMs: 1.3961, massSolar: 1.4, radiusKm: 12, temperature: 9e5, pole: { ra: 267.02, dec: -24.768 + 75 }, magneticTilt: 75, beamHalfAngle: 16, beamLength: 60, beamColor: RADIO,
      companions: (id) => [
        starBody(`${id}-comp`, 'PSR J1748-2446ad companion', 0.14, 0.3, 3600, 'A low-mass companion bloated by the pulsar\'s radiation and filling its Roche lobe; it eclipses the pulsar for 40% of the orbit.', { 'Mass': '~0.14 M☉', 'Orbital period': '26.3 hours' }, {
          parent: id,
          orbit: { kind: 'simple', a: semiMajorKm(1.0944, 1.54 * SUN_MASS_KG), e: 0, i: 65, node: 30, argPeri: 0, M0: 0, epoch: EPOCH, period: 1.0944, frame: 'ecliptic' },
        }),
      ],
    },
  },
  {
    id: 'l-hulsetaylor', name: 'Hulse–Taylor Binary (PSR B1913+16)', kind: 'pulsar', galaxy: null, ra: 288.867, dec: 16.1075, distancePc: 5250, radiusPc: 0.05, absMag: 6, color: PULSAR_SPRITE,
    summary: 'The first evidence for gravitational waves — 1993 Nobel Prize',
    description: 'The first double neutron star, found by Hulse and Taylor with Arecibo in 1974: a 59 ms pulsar orbits an unseen neutron star every 7.75 hours on an orbit slightly larger than the Sun\'s diameter. The orbit shrinks by 3.5 m a year, exactly as general relativity\'s prediction of gravitational waves requires; they will merge in ~300 million years.',
    facts: { 'Period': '59.03 ms', 'Orbital period': '7.75 hours', 'Eccentricity': '0.617', 'Masses': '1.440 + 1.389 M☉', 'Periastron advance': '4.2°/year', 'Orbital decay': '3.5 m/year', 'Merger': 'in ~300 million years', 'Distance': '~5 kpc (uncertain)', 'Discovery': '1974, Hulse & Taylor (Arecibo)' },
    pulsar: {
      periodMs: 59.03, massSolar: 1.44, radiusKm: 12, temperature: 7e5, pole: { ra: 288.867, dec: 16.1075 + 55 }, magneticTilt: 50, beamHalfAngle: 9, beamLength: 50, beamColor: RADIO,
      companions: (id) => [{
        id: `${id}-comp`, name: 'PSR B1913+16 companion', type: 'pulsar', parent: id,
        radius: 12, mass: 1.389 * SUN_MASS_KG, rotationPeriod: 1, pole: { ra: 288.867, dec: 16.1075 + 55 },
        orbit: { kind: 'simple', a: semiMajorKm(0.322997, 2.83 * SUN_MASS_KG), e: 0.6171, i: 47, node: 15, argPeri: 226, M0: 0, epoch: EPOCH, period: 0.322997, frame: 'ecliptic' },
        appearance: { kind: 'pulsar', seed: 44, magneticTilt: 0, beamHalfAngle: 0, beamLength: 0, beamColor: RADIO, quiet: true },
        temperature: 5e5,
        description: 'The unseen second neutron star of the Hulse–Taylor binary; its pulses do not reach us (its beams miss Earth, or it is radio-quiet). Its existence is known from the Doppler shifts in the pulsar\'s pulse timing.',
        facts: { 'Mass': '1.389 M☉', 'Type': 'Neutron star (quiet)' },
      }],
    },
  },
  {
    id: 'l-geminga', name: 'Geminga (PSR J0633+1746)', kind: 'pulsar', galaxy: null, ra: 98.476, dec: 17.77, distancePc: 250, radiusPc: 0.05, absMag: 6, color: PULSAR_SPRITE,
    summary: 'A radio-quiet gamma-ray pulsar; its name means "it\'s not there" in Milanese dialect',
    description: 'The mysterious gamma-ray source found by the SAS-2 satellite in 1972; for 20 years no radio or optical counterpart could be found ("Geminga": the gamma-ray source in Gemini — and in Milanese dialect "gh\'è minga", "it\'s not there"). In 1992 ROSAT detected 237 ms X-ray pulses. One of the nearest pulsars to us.',
    facts: { 'Period': '237 ms', 'Characteristic age': '342,000 years', 'Magnetic field': '1.6 × 10¹² G', 'Distance': '250 pc (815 light-years)', 'Band': 'Gamma and X-rays (radio-quiet)', 'Discovery': '1972 (SAS-2) · pulsar: 1992, Halpern & Holt (ROSAT)' },
    pulsar: { periodMs: 237.1, massSolar: 1.4, radiusKm: 12, temperature: 5e5, pole: { ra: 98.476, dec: 17.77 + 60 }, magneticTilt: 80, beamHalfAngle: 20, beamLength: 50, beamColor: GAMMA },
  },
  {
    id: 'l-j0437', name: 'PSR J0437-4715', kind: 'pulsar', galaxy: null, ra: 69.316, dec: -47.2525, distancePc: 156.8, radiusPc: 0.05, absMag: 7, color: PULSAR_SPRITE,
    summary: 'The nearest and brightest millisecond pulsar; it has a white-dwarf companion',
    description: 'The nearest millisecond pulsar, discovered with Parkes in 1993. Its 5.76 ms period is as stable as an atomic clock; its orbit and distance are known to microsecond precision from pulsar timing. It is a cornerstone of pulsar timing arrays (nanohertz gravitational-wave detectors). It has a 0.25-solar-mass helium white dwarf companion orbiting every 5.74 days.',
    facts: { 'Period': '5.757 ms (174 Hz)', 'Characteristic age': '6.7 billion years', 'Mass': '1.44 M☉', 'Companion': 'He white dwarf, 0.25 M☉, 5.74 days', 'Distance': '156.8 pc (511 light-years)', 'Discovery': '1993, Johnston et al. (Parkes)' },
    pulsar: {
      periodMs: 5.7575, massSolar: 1.44, radiusKm: 12, temperature: 7e5, pole: { ra: 69.316, dec: -47.2525 + 48 }, magneticTilt: 35, beamHalfAngle: 15, beamLength: 60, beamColor: RADIO,
      companions: (id) => [whiteDwarf(`${id}-wd`, 'PSR J0437-4715 B (white dwarf)', id, 0.254, 0.02, 4000, 5.7410, 1.69, 0,
        'What is left of the mass transfer that spun the pulsar up to milliseconds: now a cold helium white dwarf.', { 'Mass': '0.254 M☉', 'Orbital period': '5.741 days', 'Type': 'He white dwarf' })],
    },
  },
  {
    id: 'l-sgr1806', name: 'SGR 1806−20 (Magnetar)', kind: 'pulsar', galaxy: null, ra: 272.164, dec: -20.411, distancePc: 8700, radiusPc: 0.05, absMag: 5, color: [1, 0.75, 0.85],
    summary: 'The most powerful magnet in the universe; its 2004 giant flare rattled Earth\'s ionosphere',
    description: 'A magnetar with a magnetic field exceeding 10¹⁵ gauss — a quadrillion times Earth\'s. On 27 December 2004 a crust fracture on its surface released, in 0.2 seconds, as much energy as the Sun emits in 250,000 years; from 50,000 light-years away it ionised Earth\'s upper atmosphere and saturated satellite detectors. Slowly rotating (7.56 s) but with immense fields, such stars are soft gamma repeaters (SGRs).',
    facts: { 'Period': '7.56 s', 'Magnetic field': '~2 × 10¹⁵ G', 'Characteristic age': '~1,500 years', 'Giant flare': '27 December 2004 · ~10⁴⁶ erg', 'Distance': '~8,700 pc (~28,000 light-years)', 'Discovery': '1979 (gamma-ray bursts) · period: 1998, Kouveliotou et al.' },
    pulsar: { periodMs: 7560, massSolar: 1.4, radiusKm: 12, temperature: 4e6, pole: { ra: 272.164, dec: -20.411 + 65 }, magneticTilt: 30, beamHalfAngle: 18, beamLength: 40, beamColor: MAGNETAR },
  },
];
