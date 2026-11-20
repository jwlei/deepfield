import type { TourDef, TourStep } from './tours';

/**
 * Sky & space events ("Events" tab): each one is a single-scene mini tour played by the same
 * TourPlayer as the guided tours, with the simulation clock set to the event. Narration is
 * written in Turkish and translated like every other display string.
 *
 * Dates and figures were checked on 2026-10-22. Spacecraft geometry comes from NASA/JPL Horizons
 * (see public/ephem and scripts/fetch-horizons.mjs); mission dates are the agencies' published
 * plans and may move — `status` and `source` say how firm each one is, and
 * public/events/overrides.json can patch `time`/`status` without a rebuild.
 */

export type EventKind =
  | 'orbit-insertion' | 'flyby' | 'conjunction' | 'opposition' | 'elongation'
  | 'meteor-shower' | 'moon' | 'milestone' | 'eclipse' | 'solstice';

export type EventStatus = 'scheduled' | 'confirmed' | 'happened';

export interface SkyEvent {
  id: string;
  kind: EventKind;
  title: string;
  summary: string;
  /** instant of the event, ISO 8601 UTC */
  time: string;
  /** visibility / activity window, ISO 8601 UTC */
  window?: [string, string];
  status: EventStatus;
  source: { name: string; url: string };
  /** bodies of the simulation involved (first = main subject) */
  bodies: string[];
  /** the scene (one or more tour steps) */
  scene: TourStep[];
  /** simulation clock when the scene starts (default: `time`) */
  sceneStart?: string;
  /** one line under the chapter title as the scene opens: what the visitor is about to see */
  kicker: string;
  /**
   * the figures that make the event graspable at a glance — shown in the scene's facts strip and,
   * the first three, on the panel card: [label, value]
   */
  facts: Array<[string, string]>;
  /** 'sky' = seen from Earth, 'space' = from space */
  view?: 'space' | 'sky';
  /** epoch of the trajectory data shown, when the scene uses Horizons tables */
  epoch?: string;
  tags?: string[];
}

/* Deep Field: the editorial content of the upstream project (Your Eyes In Space, BigBrains) is not
 * covered by its AGPL licence (see LICENSE-CONTENT.md) and is not included in this fork. */
const PUSH = -0.012;  // gentle push-in, ln(distance)/s

export const EVENTS: SkyEvent[] = [];

export function eventById(id: string): SkyEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/** The event as a playable tour definition. */
export function eventTour(e: SkyEvent): TourDef {
  // scenes are composed shots: a slow, visible drift plus a gentle push-in unless the step says
  // otherwise; the opening step carries the chapter title, the one-line promise and the facts strip
  const steps = e.scene.map((s, i) => ({
    ...s, orbitRate: s.orbitRate ?? 0.012, dollyRate: s.dollyRate ?? PUSH,
    // the bodies the event is about keep their tags; the rest of the sky stays quiet
    show: [...(s.show ?? []), ...e.bodies],
    ...(i === 0 ? { title: s.title ?? e.title, kicker: s.kicker ?? e.kicker, facts: s.facts ?? e.facts } : {}),
  }));
  return { id: `event:${e.id}`, title: e.title, summary: e.summary, steps, startIso: e.sceneStart ?? e.time, audio: `events/${e.id}`, keepClock: true };
}

/** Human label of an event kind (source language) */
export const KIND_LABELS: Record<EventKind, string> = {
  'orbit-insertion': 'Yörüngeye giriş',
  flyby: 'Yakın geçiş',
  conjunction: 'Kavuşum',
  opposition: 'Karşı konum',
  elongation: 'Uzanım',
  'meteor-shower': 'Meteor yağmuru',
  moon: 'Ay',
  milestone: 'Kilometre taşı',
  eclipse: 'Tutulma',
  solstice: 'Gündönümü',
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'planlandı',
  confirmed: 'kesin',
  happened: 'gerçekleşti',
};

/** Runtime patch shape of public/events/overrides.json */
export interface EventOverride {
  time?: string;
  status?: EventStatus;
  /** hide the event entirely */
  hidden?: boolean;
}

/** Apply `public/events/overrides.json` (fetched by the panel) in place. */
export function applyOverrides(patch: Record<string, EventOverride>): void {
  for (const e of EVENTS) {
    const p = patch[e.id];
    if (!p) continue;
    if (p.time && !Number.isNaN(Date.parse(p.time))) e.time = p.time;
    if (p.status) e.status = p.status;
    if (p.hidden) e.tags = [...(e.tags ?? []), 'hidden'];
  }
}
