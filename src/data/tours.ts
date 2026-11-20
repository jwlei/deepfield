/**
 * Guided tours: narrated lessons that fly the camera from object to object while a voice
 * (xAI TTS, "altair") explains what is on screen. Narration is written in the source language
 * (Turkish) and translated like every other display string; the audio for each locale lives in
 * `public/tours/<locale>/<tour>/<step>.mp3` with a manifest produced by `scripts/tts-tours.mjs`.
 *
 * A step = one destination + one paragraph. The player starts the flight and the narration
 * together; the next step begins when both the audio and the flight have finished. Cues fire
 * at sentence starts (0-based index into the Turkish text) and drive the show: cloud strips,
 * overviews, surface pins, true-scale size comparisons, photo / trivia cards, light pulses…
 */

/** Where a step takes the camera (same reference scheme as `places.ts`) */
export type TourTarget =
  | { kind: 'body'; ref: string }
  | { kind: 'star'; ref: string }
  | { kind: 'blackhole'; ref: string }
  | { kind: 'landmark'; ref: string }
  | { kind: 'galaxy'; ref: string }
  /** a planet of another star, by its NASA Exoplanet Archive name (e.g. 'TRAPPIST-1 e'); the step plays in that system */
  | { kind: 'exoplanet'; ref: string };

/**
 * Something that happens while a step is narrated. `at` is the index of the sentence (of the
 * source text, 0-based) at whose start the cue fires; the player maps it onto the spoken locale.
 * `delay` (seconds) holds it back further into that sentence.
 *
 * Body references (`ref`, `toward`, `from`, `to`, `a`, `b`) are Solar System ids; in an exoplanet
 * step they may also be archive planet names ('TRAPPIST-1 f') or 'star' for the host star.
 * `compare` may name a Solar System body from any system: a true-scale copy is brought along.
 */
export type TourCue = { delay?: number } & (
  /** fade the cloud layer in/out (e.g. strip Venus to show the radar surface) */
  | { at: number; action: 'clouds'; on: boolean }
  /** change the simulation rate from this sentence on (s/s) */
  | { at: number; action: 'rate'; rate: number }
  /** pull back above `ref`'s orbit around its parent so the whole orbit is in view (`seconds`: flight time) */
  | { at: number; action: 'overview'; ref: string; seconds?: number }
  /**
   * Pin a surface feature of `ref` (east longitude, degrees) with a labelled marker and, unless
   * `approach` is false, fly in above it. `storm` snaps to the gas giant's rendered storm instead.
   */
  | { at: number; action: 'pin'; ref: string; lat: number; lon: number; label: string; approach?: boolean; storm?: boolean; extent?: number }
  /** remove the pin */
  | { at: number; action: 'unpin' }
  /** fly back to the step's target */
  | { at: number; action: 'return' }
  /**
   * Show a framed inset in the corner: a photograph (`public/tour-media/<image>`) and/or a trivia
   * card (`title`, a `big` headline figure such as "×1.300", `text`). `source` is the picture
   * credit. Stays until `until` (sentence index), the next card, or the end of the step.
   */
  | { at: number; action: 'card'; image?: string; title?: string; big?: string; text?: string; source?: string; until?: number }
  /** hide the current card */
  | { at: number; action: 'uncard' }
  /**
   * Place a true-scale copy of `ref` (e.g. Earth) beside the step's target so the two can be
   * compared; the camera backs off far enough to see both. Removed by `uncompare` or step end.
   */
  | { at: number; action: 'compare'; ref: string; shoulder?: boolean }
  | { at: number; action: 'uncompare' }
  /**
   * Postcard of a mountain: a real relief built offline (`relief`: directory under
   * tour-media/terrain, centred on the summit at `lat`/`lon`, `peak` km above the plains, drawn
   * `scale` times taller) rises on `ref`, and the camera glides down — looking at the ground as
   * it comes in — to stand `dist` km from the summit, `alt` km above the ground, looking at it
   * across the horizon. `fov` narrows the lens (telephoto), `seconds` is the flight time.
   */
  | { at: number; action: 'postcard'; ref: string; lat: number; lon: number; relief: string; peak: number; scale: number; dist: number; alt: number; fov?: number; seconds?: number }
  /**
   * Over a ringed planet's shoulder: the camera `dist` radii out, `elev` degrees above the ring
   * plane, `az` degrees round from the sunlit side, aimed at the rings `aimR` radii out and `aimAz`
   * degrees further round — the planet's limb fills one side of the frame, the rings sweep away
   * on the other. Holds still while the clock runs fast.
   */
  | { at: number; action: 'limb'; ref?: string; elev: number; az: number; dist: number; aimR: number; aimAz: number; seconds?: number }
  /**
   * Fly to a vantage point around `ref` (default: the step's target): `elev` degrees above its
   * equator plane, `az` degrees around the pole measured from the sunlit side (0 = noon side,
   * 90 = morning terminator), `dist` in radii. `seconds` stretches the flight (slow reveals).
   * `inside`: a ringed planet's camera may come closer than its outer ring.
   */
  | { at: number; action: 'vantage'; ref?: string; elev: number; az: number; dist: number; seconds?: number; inside?: boolean }
  /**
   * Over-the-shoulder shot: camera `dist` radii from `ref` on the side away from `toward`, so
   * `toward` hangs in the background behind it (a spacecraft against the world it approaches).
   * `az`/`elev` (degrees) swing the camera off that axis so both stay in frame; `seconds` = flight time.
   */
  | { at: number; action: 'shot'; ref: string; toward: string; dist: number; az?: number; elev?: number; seconds?: number }
  /**
   * Closing credits: one unbroken flight past each of `refs` in turn (sweeping by its sunlit side
   * a few radii out), then out to the opening view of the Solar System, in `seconds`
   */
  | { at: number; action: 'flyby'; refs: string[]; seconds: number }
  /** continuous push-in (negative) / pull-out (positive) while dwelling: ln(distance) per second */
  | { at: number; action: 'dolly'; rate: number }
  /** auto-orbit drift speed (rad/s) from this sentence on */
  | { at: number; action: 'drift'; rate: number }
  /** a pulse of light travels from body `from` to body `to` in `seconds` (light-travel time demo) */
  | { at: number; action: 'pulse'; from: string; to: string; seconds: number }
  /**
   * Live figure in the corner card, recomputed every frame from the simulation: the distance
   * between `a` and `b`, the altitude of `a` above `b`'s surface, the angular separation of `a`
   * and `b` seen from `from` (default Earth), or the one-way light time between them.
   */
  | { at: number; action: 'readout'; kind: 'distance' | 'altitude' | 'separation' | 'light'; a: string; b: string; from?: string; label: string; text?: string; until?: number }
  /**
   * Sky view: park the camera just above `ref` (`alt` km, default 300) on the side facing the
   * `toward` bodies and keep it aimed at their midpoint while the step plays (a "look up from
   * Earth" shot for conjunctions and oppositions). `fov` narrows the field of view (degrees).
   */
  | { at: number; action: 'lookFrom'; ref: string; toward: string[]; alt?: number; fov?: number }
  /**
   * Stand on `ref`: the ground is generated and the camera descends to it (over `seconds`), on the
   * spot where the `toward` bodies hang `elev`° over the horizon (default 9); the gaze then follows
   * them, turning smoothly when a later `land` cue on the same body names other bodies. `sep`
   * first runs the clock to the next moment the first `toward` body stands that many degrees from
   * the star on `ref`'s sky (a conjunction staged on purpose) and picks the spot where the star
   * is `starElev`° up as well (default `elev`). `fov` as in `lookFrom`.
   */
  | { at: number; action: 'land'; ref: string; toward: string[]; elev?: number; sep?: number; starElev?: number; fov?: number; seconds?: number }
  /** field of view (degrees) from this sentence on, eased over `seconds` (slow zoom); restored at step end */
  | { at: number; action: 'fov'; deg: number; seconds?: number }
  /** set the simulation clock to an instant (ISO 8601 UTC) */
  | { at: number; action: 'time'; iso: string }
  /** force orbit lines on/off (planet orbits; `moons` for moon orbits) without moving the camera */
  | { at: number; action: 'orbits'; on: boolean; moons?: boolean }
  /** the soft "work light" tours add on a body's night side when close: off for genuinely backlit shots */
  | { at: number; action: 'fill'; on: boolean }
  /**
   * Meteor shower raining into `ref`'s atmosphere from the radiant at `ra`/`dec` (ICRF degrees):
   * `speed` km/s sets the streak speed, `rate` is streaks per real second (a cinematic figure),
   * `fireballs` the fraction of bright bolides. `approach` flies the camera to a spot that looks
   * across the night side at the hemisphere being hit (`seconds`: flight time). `on: false` stops it.
   */
  | { at: number; action: 'meteors'; on: true; ref: string; ra: number; dec: number; speed: number; rate: number; fireballs?: number; approach?: boolean; seconds?: number }
  | { at: number; action: 'meteors'; on: false });

export interface TourStep {
  /** stable id — audio file name */
  id: string;
  target: TourTarget;
  /** narration (source language) */
  text: string;
  /** simulation rate (s/s) while this step plays; default 1 */
  timeRate?: number;
  /** auto-orbit speed around the target (rad/s); default 0.05 */
  orbitRate?: number;
  /** continuous push-in (negative) / pull-out while dwelling, ln(distance)/s; default 0 */
  dollyRate?: number;
  /** extra seconds to linger after the narration ends; default 1.5 */
  dwell?: number;
  /** seconds of silence before the narration starts, so the opening flight can settle first */
  lead?: number;
  /** length of a step without narration (`text: ''`): an interlude carried by the music, its cues timed by `delay` */
  seconds?: number;
  /** timed events during the narration (see TourCue) */
  cues?: TourCue[];
  /**
   * Bodies that keep their tags while the step plays, besides the target, its primary and moons
   * and everything the cues refer to (the player hides every other tag during a tour)
   */
  show?: string[];
  /** chapter title shown full-screen for a few seconds as the step opens (cinematic) */
  title?: string;
  /** one line under the chapter title */
  kicker?: string;
  /** supporting figures shown in the side strip while the step plays: [label, value] */
  facts?: Array<[string, string]>;
}

export interface TourDef {
  id: string;
  title: string;
  summary: string;
  steps: TourStep[];
  /** small line above the chapter title (default: "<tour title> · i / n"); single-scene events use it for kind and date */
  eyebrow?: string;
  /** simulation clock at the start (ISO 8601 UTC); default: leave the visitor's clock alone */
  startIso?: string;
  /** audio folder (`public/tours/<locale>/<audio>/`); default `id` */
  audio?: string;
  /** at the end stay on the scene's date at 1× instead of restoring the visitor's clock (events) */
  keepClock?: boolean;
  /** background music while the tour plays: a track file name under public/music (default: picked from the library by the tour id) */
  music?: string;
}

const body = (ref: string): TourTarget => ({ kind: 'body', ref });
const star = (ref: string): TourTarget => ({ kind: 'star', ref });
const bh = (ref: string): TourTarget => ({ kind: 'blackhole', ref });
const lm = (ref: string): TourTarget => ({ kind: 'landmark', ref });
const gal = (ref: string): TourTarget => ({ kind: 'galaxy', ref });
const exo = (ref: string): TourTarget => ({ kind: 'exoplanet', ref });

/* cue shorthands */
type CardOpts = Omit<Extract<TourCue, { action: 'card' }>, 'at' | 'action'>;
const card = (at: number, c: CardOpts): TourCue => ({ at, action: 'card', ...c });
const uncard = (at: number): TourCue => ({ at, action: 'uncard' });
const rate = (at: number, r: number): TourCue => ({ at, action: 'rate', rate: r });
const overview = (at: number, ref: string, seconds?: number): TourCue => ({ at, action: 'overview', ref, seconds });
const ret = (at: number): TourCue => ({ at, action: 'return' });
const pin = (at: number, ref: string, lat: number, lon: number, label: string, extra: { storm?: boolean; approach?: boolean; extent?: number } = {}): TourCue => ({ at, action: 'pin', ref, lat, lon, label, ...extra });
const unpin = (at: number): TourCue => ({ at, action: 'unpin' });
const clouds = (at: number, on: boolean): TourCue => ({ at, action: 'clouds', on });
const compare = (at: number, ref: string, o: { shoulder?: boolean } = {}): TourCue => ({ at, action: 'compare', ref, ...o });
const uncompare = (at: number): TourCue => ({ at, action: 'uncompare' });
const vantage = (at: number, elev: number, az: number, dist: number, ref?: string, seconds?: number): TourCue => ({ at, action: 'vantage', elev, az, dist, ref, seconds });
const pulse = (at: number, from: string, to: string, seconds: number): TourCue => ({ at, action: 'pulse', from, to, seconds });
const shot = (at: number, ref: string, toward: string, dist: number, o: { az?: number; elev?: number; seconds?: number } = {}): TourCue => ({ at, action: 'shot', ref, toward, dist, ...o });
const dolly = (at: number, r: number): TourCue => ({ at, action: 'dolly', rate: r });
const drift = (at: number, r: number): TourCue => ({ at, action: 'drift', rate: r });
const fov = (at: number, deg: number, seconds?: number): TourCue => ({ at, action: 'fov', deg, seconds });
const fill = (at: number, on: boolean): TourCue => ({ at, action: 'fill', on });
const lookFrom = (at: number, ref: string, toward: string[], o: { alt?: number; fov?: number } = {}): TourCue => ({ at, action: 'lookFrom', ref, toward, ...o });
const land = (at: number, ref: string, toward: string[], o: { elev?: number; sep?: number; starElev?: number; fov?: number; seconds?: number } = {}): TourCue => ({ at, action: 'land', ref, toward, ...o });
type MeteorOpts = Omit<Extract<TourCue, { action: 'meteors'; on: true }>, 'at' | 'action' | 'on'>;
const meteors = (at: number, m: MeteorOpts): TourCue => ({ at, action: 'meteors', on: true, ...m });
const unmeteors = (at: number): TourCue => ({ at, action: 'meteors', on: false });

/** cue shorthands shared with the Events scenes (src/data/events.ts) */
export const cues = { body, star, bh, lm, gal, exo, card, uncard, rate, overview, ret, pin, unpin, clouds, compare, uncompare, vantage, pulse, shot, dolly, drift, fov, fill, lookFrom, land, meteors, unmeteors };

/* Deep Field: the editorial content of the upstream project (Your Eyes In Space, BigBrains) is not
 * covered by its AGPL licence (see LICENSE-CONTENT.md) and is not included in this fork. */
export const TOURS: TourDef[] = [];

export function tourById(id: string): TourDef | undefined {
  return TOURS.find((t) => t.id === id);
}
