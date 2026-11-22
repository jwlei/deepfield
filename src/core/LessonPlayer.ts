/**
 * Academy — drives a lesson: which section/step is open, moves the 3-D scene according to the
 * step's cues, and remembers progress in localStorage.
 */
import { COURSE, type Chapter, type Course, type SceneCue, type Section, type Step } from '../data/lessons';
import type { TourHost, TourOverrides, TourPlayer } from './TourPlayer';

const STORE_KEY = 'yeits.academy';
/** gentle drift around whatever the step flew to */
const LESSON_ORBIT = 0.035;

interface Stored {
  visited: string[];
  last?: { section: string; step: number };
}

export class LessonPlayer {
  readonly course: Course = COURSE;
  section: Section | null = null;
  chapter: Chapter | null = null;
  stepIndex = 0;
  onChange: (() => void) | null = null;

  private overrides: TourOverrides = {};
  private visited = new Set<string>();
  private last: Stored['last'];
  private flight: object | null = null;
  private settled = false;

  constructor(private readonly host: TourHost, private readonly tours: TourPlayer) {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Stored;
        this.visited = new Set(s.visited ?? []);
        this.last = s.last;
      }
    } catch { /* ignore */ }
  }

  /** the visitor finished the last section of a chapter */
  onChapterEnd: ((chapter: Chapter) => void) | null = null;

  get active(): boolean { return this.section !== null; }
  get step(): Step | null { return this.section?.steps[this.stepIndex] ?? null; }
  get resume(): Stored['last'] { return this.last; }

  /* ---- progress ---- */
  private key(section: Section, i: number) { return `${section.id}/${section.steps[i].id}`; }
  isVisited(section: Section, i: number) { return this.visited.has(this.key(section, i)); }
  /** fraction of the section's steps seen */
  progress(section: Section): number {
    let n = 0;
    for (let i = 0; i < section.steps.length; i++) if (this.isVisited(section, i)) n++;
    return n / section.steps.length;
  }
  chapterProgress(ch: Chapter): number {
    let n = 0, t = 0;
    for (const s of ch.sections) { t += s.steps.length; n += this.progress(s) * s.steps.length; }
    return t ? n / t : 0;
  }
  /** whole-course tally: steps seen, sections finished, minutes of material remaining */
  courseProgress(): { steps: number; totalSteps: number; sections: number; totalSections: number; minutesLeft: number; totalMinutes: number } {
    let steps = 0, totalSteps = 0, sections = 0, totalSections = 0, minutesLeft = 0, totalMinutes = 0;
    for (const ch of this.course.chapters) for (const s of ch.sections) {
      const p = this.progress(s);
      totalSteps += s.steps.length; steps += Math.round(p * s.steps.length);
      totalSections++; if (p >= 1) sections++;
      totalMinutes += s.minutes; minutesLeft += Math.round((1 - p) * s.minutes);
    }
    return { steps, totalSteps, sections, totalSections, minutesLeft, totalMinutes };
  }
  private save() {
    try {
      const s: Stored = { visited: [...this.visited], last: this.last };
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch { /* ignore */ }
  }

  /* ---- navigation ---- */
  findSection(id: string): { chapter: Chapter; section: Section } | null {
    for (const ch of this.course.chapters) for (const s of ch.sections) if (s.id === id) return { chapter: ch, section: s };
    return null;
  }

  open(sectionId: string, stepIndex = 0): void {
    const hit = this.findSection(sectionId);
    if (!hit) return;
    if (this.tours.active) this.tours.stop();
    this.chapter = hit.chapter;
    this.section = hit.section;
    this.go(Math.max(0, Math.min(stepIndex, hit.section.steps.length - 1)));
  }

  go(i: number): void {
    if (!this.section) return;
    if (i < 0 || i >= this.section.steps.length) return;
    this.stepIndex = i;
    const step = this.section.steps[i];
    this.visited.add(this.key(this.section, i));
    this.last = { section: this.section.id, step: i };
    this.save();
    this.resetScene();
    if (step.scene?.length) this.applyScene(step.scene);
    this.onChange?.();
  }

  next(): void {
    if (!this.section) return;
    if (this.stepIndex + 1 < this.section.steps.length) this.go(this.stepIndex + 1);
    else {
      // end of section: continue into the next one when there is one
      const nxt = this.nextSection();
      // the last section of a chapter is behind us (the next one opens another chapter, or none)
      const ch = this.findSection(this.section.id)?.chapter;
      if (ch && (!nxt || this.findSection(nxt.id)?.chapter !== ch)) this.onChapterEnd?.(ch);
      if (nxt) this.open(nxt.id, 0);
    }
  }
  prev(): void { if (this.stepIndex > 0) this.go(this.stepIndex - 1); }

  nextSection(): Section | null {
    if (!this.section) return null;
    const all = this.course.chapters.flatMap((c) => c.sections);
    const i = all.indexOf(this.section);
    return all[i + 1] ?? null;
  }

  close(): void {
    if (!this.section) return;
    this.section = null;
    this.chapter = null;
    this.resetScene();
    this.onChange?.();
  }

  /* ---- scene ---- */
  private resetScene(): void {
    this.overrides = {};
    this.host.setTourOverrides(this.overrides);
    this.flight = null;
    this.settled = false;
  }

  private applyScene(cues: SceneCue[]): void {
    const h = this.host;
    const u = h.universe;
    for (const cue of cues) {
      switch (cue.action) {
        case 'goto':
          switch (cue.kind ?? 'body') {
            case 'body': h.goToTourBody(cue.ref); break;
            case 'blackhole': h.goToBlackHole(cue.ref); break;
            case 'landmark': {
              const l = u.landmark(cue.ref);
              if (l) h.goToLandmark(u.landmarks.indexOf(l));
              break;
            }
            case 'star': {
              const hits = u.catalog.search(cue.ref, 1);
              if (hits.length) h.goToStar(`c${hits[0]}`);
              break;
            }
            case 'galaxy': break;
          }
          this.flight = h.camera.autopilot;
          break;
        case 'overview': {
          const moon = u.get(cue.ref)?.data.type === 'moon';
          this.overrides = { ...this.overrides, ...(moon ? { moonOrbits: true } : { orbits: true }) };
          h.setTourOverrides(this.overrides);
          h.goToOverview(cue.ref);
          this.flight = h.camera.autopilot;
          break;
        }
        case 'vantage':
          h.goToVantageOf(cue.ref, cue.elev, cue.az, cue.dist);
          this.flight = h.camera.autopilot;
          break;
        case 'rate':
          h.time.setRate(cue.rate);
          break;
        case 'backdrop':
          h.showBackdrop(true);
          this.flight = null;
          this.settled = true; // the backdrop manages its own drift
          break;
        case 'grid':
          this.overrides = { ...this.overrides, eclipticGrid: cue.ecliptic, equatorialGrid: cue.equatorial };
          h.setTourOverrides(this.overrides);
          break;
        case 'orbits':
          this.overrides = { ...this.overrides, orbits: cue.on };
          h.setTourOverrides(this.overrides);
          break;
      }
    }
  }

  update(_dt: number): void {
    if (!this.section) return;
    // a tour started while a lesson was open takes over the scene
    if (this.tours.active) { this.close(); return; }
    if (this.settled) return;
    const cam = this.host.camera;
    // once the flight we launched has finished, drift gently around the target
    if (this.flight && cam.autopilot !== this.flight) {
      this.flight = null;
      if (!cam.autopilot && cam.target) cam.autoOrbit = LESSON_ORBIT;
      this.settled = true;
    }
  }
}
