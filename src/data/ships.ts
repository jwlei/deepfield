import { C_KM_S } from '../core/constants';

/**
 * Vehicles for the mission planner.
 *
 * Real spacecraft are modelled with an impulsive Δv budget measured from a 300 km Earth parking
 * orbit (launch-vehicle upper stage + on-board propellant), so Lambert / patched-conic transfers
 * can be checked against what the vehicle could really do. Fictional ships carry their
 * franchise's stated performance (warp factors, hyperdrive class, continuous-thrust drive);
 * their names are used only to identify the vehicles and their models are original
 * approximations (see NOTICE.md).
 */
export type ProceduralShip = 'saucer' | 'freighter' | 'xwing' | 'corvette' | 'capsule' | 'rocket';

export interface WarpFactor {
  label: string;
  /** speed in units of c */
  c: number;
}

export type Propulsion =
  | {
      kind: 'impulsive';
      /** total Δv available from a 300 km Earth parking orbit (km/s) */
      dvBudget: number;
      /** low-thrust vehicle: the impulsive numbers are an approximation */
      lowThrust?: boolean;
    }
  | {
      kind: 'brachistochrone';
      /** available continuous accelerations (g) */
      accelsG: number[];
      /** maximum speed as fraction of c (relativity is ignored below this) */
      maxC: number;
    }
  | {
      kind: 'warp';
      /** sub-light cruise as fraction of c */
      impulseC: number;
      warpFactors: WarpFactor[];
    }
  | {
      kind: 'hyperdrive';
      sublightC: number;
      /** effective hyperspace speed (c) */
      hyperC: number;
      hyperLabel: string;
    };

export interface ShipDef {
  id: string;
  name: string;
  /** short line under the name */
  tagline: string;
  origin: 'real' | 'fiction';
  franchise?: string;
  lengthM: number;
  massKg: number;
  /** bounding radius used for the body (km) */
  radiusKm: number;
  model: { kind: 'glb'; file: string; representative?: boolean } | { kind: 'procedural'; shape: ProceduralShip };
  propulsion: Propulsion;
  description: string;
  facts: Record<string, string>;
}

const TNG_WARP: WarpFactor[] = [
  { label: 'Warp 1', c: 1 }, { label: 'Warp 2', c: 10 }, { label: 'Warp 3', c: 39 }, { label: 'Warp 4', c: 102 },
  { label: 'Warp 5', c: 214 }, { label: 'Warp 6', c: 392 }, { label: 'Warp 7', c: 656 }, { label: 'Warp 8', c: 1024 },
  { label: 'Warp 9', c: 1516 }, { label: 'Warp 9.6 (maximum)', c: 1909 }, { label: 'Warp 9.9 (emergency)', c: 3053 },
];
const TOS_WARP: WarpFactor[] = [1, 2, 3, 4, 5, 6, 7, 8].map((w) => ({ label: `Warp ${w}${w === 8 ? ' (acil)' : ''}`, c: w * w * w }));

export const SHIPS: ShipDef[] = [
  /* ---------------- real vehicles ---------------- */
  {
    id: 'voyager', name: 'Voyager', tagline: 'Titan IIIE-Centaur · 1977 · Grand Tour', origin: 'real',
    lengthM: 3.7, massKg: 825, radiusKm: 0.0065,
    model: { kind: 'glb', file: 'voyager' },
    propulsion: { kind: 'impulsive', dvBudget: 7.3 },
    description: 'Both Voyagers were launched directly towards Jupiter (C3 ≈ 102 km²/s²) on a Titan IIIE-Centaur; gravity assists at Jupiter and Saturn carried them through the outer Solar System and into interstellar space.',
    facts: { 'Departure Δv (from a 300 km parking orbit)': '~7.1 km/s', 'Onboard Δv': '~0.2 km/s', 'Power': 'RTG, 470 W (1977)' },
  },
  {
    id: 'newhorizons', name: 'New Horizons', tagline: 'Atlas V 551 + Star 48B · 2006 · fastest launch', origin: 'real',
    lengthM: 2.7, massKg: 478, radiusKm: 0.0015,
    model: { kind: 'glb', file: 'pioneer', representative: true },
    propulsion: { kind: 'impulsive', dvBudget: 9.2 },
    description: 'The spacecraft that left Earth at the highest speed ever (16.26 km/s); a Jupiter gravity assist took it to Pluto in 9.5 years.',
    facts: { 'Launch C3': '158 km²/s²', 'Departure Δv': '~8.9 km/s', 'Onboard Δv': '~0.3 km/s' },
  },
  {
    id: 'parker', name: 'Parker Solar Probe', tagline: 'Delta IV Heavy + Star 48BV · 2018', origin: 'real',
    lengthM: 3, massKg: 685, radiusKm: 0.0015,
    model: { kind: 'glb', file: 'parker' },
    propulsion: { kind: 'impulsive', dvBudget: 9.0 },
    description: 'To get close to the Sun it shed Earth\'s orbital speed with seven Venus gravity assists; the fastest human-made object (192 km/s).',
    facts: { 'Launch C3': '154 km²/s²', 'Departure Δv': '~8.8 km/s', 'Venus gravity assist': '7 times' },
  },
  {
    id: 'juno', name: 'Juno', tagline: 'Atlas V 551 · 2011 · Jupiter orbit', origin: 'real',
    lengthM: 20, massKg: 3625, radiusKm: 0.01,
    model: { kind: 'glb', file: 'juno' },
    propulsion: { kind: 'impulsive', dvBudget: 6.6 },
    description: 'It could not be launched with enough energy to reach Jupiter directly: an Earth gravity assist two years later added 3.9 km/s and it entered Jupiter orbit in 2016.',
    facts: { 'Launch C3': '31 km²/s²', 'Departure Δv': '~4.6 km/s', 'Onboard Δv': '~2.0 km/s (JOI 0.54)' },
  },
  {
    id: 'galileo', name: 'Galileo', tagline: 'Space Shuttle + IUS · 1989 · VEEGA', origin: 'real',
    lengthM: 5.3, massKg: 2380, radiusKm: 0.005,
    model: { kind: 'glb', file: 'galileo' },
    propulsion: { kind: 'impulsive', dvBudget: 5.3 },
    description: 'Released from the Shuttle\'s payload bay with a small IUS stage; it could only reach Jupiter via a Venus–Earth–Earth gravity-assist chain (VEEGA), taking 6 years.',
    facts: { 'Launch C3': '~14 km²/s²', 'Departure Δv': '~3.8 km/s', 'Onboard Δv': '~1.5 km/s' },
  },
  {
    id: 'cassini', name: 'Cassini–Huygens', tagline: 'Titan IVB-Centaur · 1997 · Saturn', origin: 'real',
    lengthM: 6.8, massKg: 5712, radiusKm: 0.006,
    model: { kind: 'glb', file: 'galileo', representative: true },
    propulsion: { kind: 'impulsive', dvBudget: 6.4 },
    description: 'Reached Saturn in 6.7 years via Venus–Venus–Earth–Jupiter gravity assists; it studied the Saturn system for 13 years and Huygens landed on Titan.',
    facts: { 'Launch C3': '16.6 km²/s²', 'Departure Δv': '~4.0 km/s', 'Onboard Δv': '~2.4 km/s' },
  },
  {
    id: 'dawn', name: 'Dawn', tagline: 'Delta II · 2007 · ion engine · Vesta + Ceres', origin: 'real',
    lengthM: 19.7, massKg: 1218, radiusKm: 0.01,
    model: { kind: 'glb', file: 'dawn' },
    propulsion: { kind: 'impulsive', dvBudget: 14.3, lowThrust: true },
    description: 'Its xenon ion engines produced 11 km/s of Δv — a budget no chemical rocket could match; the first spacecraft to orbit two separate bodies. (Low thrust: the impulsive calculation here is approximate.)',
    facts: { 'Launch C3': '11 km²/s²', 'Onboard Δv': '11.5 km/s (ion)', 'Thrust': '90 mN' },
  },
  {
    id: 'orion', name: 'Orion + SLS', tagline: 'Artemis · crewed · 2022–', origin: 'real',
    lengthM: 8, massKg: 26_500, radiusKm: 0.012,
    model: { kind: 'procedural', shape: 'capsule' },
    propulsion: { kind: 'impulsive', dvBudget: 4.6 },
    description: 'NASA\'s deep-space crew capsule; the SLS upper stage provides ~3.2 km/s for trans-lunar injection (TLI) and Orion\'s service module ~1.3 km/s. Not enough for Mars on its own.',
    facts: { 'Crew': '4', 'Service module Δv': '~1.3 km/s', 'TLI (ICPS)': '~3.2 km/s' },
  },
  {
    id: 'starship', name: 'Starship (refuelled in orbit)', tagline: 'SpaceX · fully fuelled · 100 t payload', origin: 'real',
    lengthM: 52, massKg: 1_300_000, radiusKm: 0.03,
    model: { kind: 'procedural', shape: 'rocket' },
    propulsion: { kind: 'impulsive', dvBudget: 6.9 },
    description: 'Fully refuelled by tankers in low Earth orbit, Starship carries ~6.9 km/s of Δv with 100 t of payload: enough to fly directly to Mars and land with aerobraking.',
    facts: { 'Payload': '100 t', 'Fully fuelled Δv (LEO)': '~6.9 km/s', 'Engine': '6 × Raptor' },
  },

  /* ---------------- fiction ---------------- */
  {
    id: 'enterprise-d', name: 'USS Enterprise NCC-1701-D', tagline: 'Star Trek: TNG · Galaxy class', origin: 'fiction', franchise: 'Star Trek',
    lengthM: 642.5, massKg: 4.5e9, radiusKm: 0.32,
    model: { kind: 'procedural', shape: 'saucer' },
    propulsion: { kind: 'warp', impulseC: 0.25, warpFactors: TNG_WARP },
    description: 'A Galaxy-class starship; 0.25c on impulse engines, faster than light by warping space with its warp drive. On the TNG scale warp 9.6 ≈ 1,909 c: 19 hours to Proxima, ~50 years to the far side of the galaxy.',
    facts: { 'Crew': '1 014', 'Cruise speed': 'Warp 6 (392 c)', 'Maximum': 'Warp 9.6 · 12 hours', 'Entered service': '2363' },
  },
  {
    id: 'enterprise', name: 'USS Enterprise NCC-1701', tagline: 'Star Trek (1966) · Constitution class', origin: 'fiction', franchise: 'Star Trek',
    lengthM: 289, massKg: 1.9e8, radiusKm: 0.145,
    model: { kind: 'procedural', shape: 'saucer' },
    propulsion: { kind: 'warp', impulseC: 0.25, warpFactors: TOS_WARP },
    description: 'Kirk\'s ship. On the original series\' warp scale, speed = warp³ × c: warp 6 = 216 c, warp 8 = 512 c (emergency).',
    facts: { 'Crew': '430', 'Cruise speed': 'Warp 6 (216 c)', 'Maximum': 'Warp 8 (512 c)', 'Five-year mission': '2265–2270' },
  },
  {
    id: 'falcon', name: 'Millennium Falcon', tagline: 'Star Wars · YT-1300 light freighter', origin: 'fiction', franchise: 'Star Wars',
    lengthM: 34.75, massKg: 1.05e6, radiusKm: 0.018,
    model: { kind: 'procedural', shape: 'freighter' },
    propulsion: { kind: 'hyperdrive', sublightC: 0.05, hyperC: 2e7, hyperLabel: 'Hyperspace (class 0.5)' },
    description: '"The ship that made the Kessel Run in less than twelve parsecs." Class 0.5 hyperdrive: across the galaxy in a few days — taken here as ~2×10⁷ c.',
    facts: { 'Hyperdrive': 'Class 0.5', 'Hyperspace speed (assumed)': '2 × 10⁷ c', 'Sublight speed (assumed)': '0.05 c', 'Captain': 'Han Solo' },
  },
  {
    id: 'xwing', name: 'T-65B X-wing', tagline: 'Star Wars · Rebel Alliance starfighter', origin: 'fiction', franchise: 'Star Wars',
    lengthM: 12.5, massKg: 10_000, radiusKm: 0.007,
    model: { kind: 'procedural', shape: 'xwing' },
    propulsion: { kind: 'hyperdrive', sublightC: 0.04, hyperC: 1e7, hyperLabel: 'Hyperspace (class 1)' },
    description: 'Class 1 hyperdrive assisted by an astromech droid; half the Falcon\'s speed. Taken here as ~10⁷ c.',
    facts: { 'Hyperdrive': 'Class 1', 'Hyperspace speed (assumed)': '10⁷ c', 'Sublight speed (assumed)': '0.04 c', 'Weapons': '4 laser cannons, 2 proton torpedo launchers' },
  },
  {
    id: 'rocinante', name: 'Rocinante', tagline: 'The Expanse · MCRN corvette · Epstein drive', origin: 'fiction', franchise: 'The Expanse',
    lengthM: 46, massKg: 2.5e6, radiusKm: 0.024,
    model: { kind: 'procedural', shape: 'corvette' },
    propulsion: { kind: 'brachistochrone', accelsG: [0.3, 1, 3, 6], maxC: 0.2 },
    description: 'A fusion-powered Epstein drive: it accelerates continuously for half the trip, flips and decelerates for the other half (brachistochrone trajectory). At 1 g, Mars in 2–4 days, Jupiter in ~1 week. Not faster than light; Solar System only.',
    facts: { 'Cruise acceleration': '0.3 g', 'Combat acceleration': '≥ 3 g (with "the juice")', 'Crew': '4–6', 'Class': 'Corvette (formerly Tachi)' },
  },
];

export function shipById(id: string): ShipDef | undefined {
  return SHIPS.find((s) => s.id === id);
}

/** maximum speed (km/s) a ship can reach, for feasibility / interstellar checks */
export function shipMaxSpeedKms(s: ShipDef): number {
  const p = s.propulsion;
  switch (p.kind) {
    case 'warp': return Math.max(...p.warpFactors.map((w) => w.c)) * C_KM_S;
    case 'hyperdrive': return p.hyperC * C_KM_S;
    case 'brachistochrone': return p.maxC * C_KM_S;
    default: return 0;
  }
}

/** can the ship leave the Solar System in a human lifetime (FTL)? */
export function isFtl(s: ShipDef): boolean {
  return s.propulsion.kind === 'warp' || s.propulsion.kind === 'hyperdrive';
}
