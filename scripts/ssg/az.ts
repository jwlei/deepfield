import { fmtNum } from '../../src/i18n';
import { conName } from './pages';
import { currentLang, esc, t, url, w, type Page } from './html';
import type { Site } from './model';

/** kinds in the order of the encyclopedia's contents; the search data refers to them by index */
const KINDS = ['Star', 'Exoplanet', 'Constellation', 'Solar System', 'Deep sky', 'Galaxy', 'Black hole', 'Sky event'];

export interface AzEntry { name: string; path: string; kind: number; alt?: string }

export const AZ_PATH = '/encyclopedia/a-z';
export const SEARCH_PATH = '/encyclopedia/search.json';
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

function letterOf(name: string): string {
  const c = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

function letterPath(l: string): string {
  return l === 'A' ? AZ_PATH : `${AZ_PATH}/${l === '#' ? '0-9' : l.toLowerCase()}`;
}

/** every page of the encyclopedia under its name in the current language (paths localized) */
export function azEntries(site: Site): AzEntry[] {
  const out: AzEntry[] = [];
  for (const s of site.stars) {
    const hip = site.cat.hip[s.i];
    out.push({ name: s.name, path: url(`/stars/${s.slug}`), kind: 0, alt: hip ? `HIP ${hip}` : undefined });
  }
  for (const p of site.planets) out.push({ name: p.planet.name, path: url(`/exoplanets/${p.slug}`), kind: 1 });
  for (const c of site.constellations.values()) out.push({ name: conName(c.abbr), path: url(`/constellations/${c.slug}`), kind: 2 });
  for (const s of site.solar) out.push({ name: t(s.body.name), path: url(`/solar-system/${s.slug}`), kind: 3 });
  for (const d of site.dsos) out.push({ name: t(site.dsoDefs.get(d.id)!.name), path: url(`/deep-sky/${d.slug}`), kind: 4, alt: d.id });
  for (const g of site.galaxies) out.push({ name: t(g.name), path: url(`/galaxies/${g.slug}`), kind: 5, alt: t(g.name) !== g.name ? g.name : undefined });
  for (const b of site.blackHoles) out.push({ name: b.entry.name, path: url(`/black-holes/${b.slug}`), kind: 6 });
  for (const e of site.events) out.push({ name: t(e.e.title), path: url(`/sky-events/${e.slug}`), kind: 7 });
  const coll = new Intl.Collator(currentLang(), { numeric: true, sensitivity: 'base' });
  return out.sort((x, y) => coll.compare(x.name, y.name));
}

/** compact search data: [name, path, kind, alt?] */
export function searchJson(entries: AzEntry[]): string {
  return JSON.stringify(entries.map((e) => (e.alt ? [e.name, e.path, e.kind, e.alt] : [e.name, e.path, e.kind])));
}

export function searchForm(withData: boolean): string {
  const data = withData
    ? ` data-src="${esc(url(SEARCH_PATH))}" data-kinds="${esc(JSON.stringify(KINDS.map((k) => w(k))))}" data-none="${esc(w('No results'))}" data-count="${esc(w('{n} results'))}"`
    : '';
  return `<form class="w-search" role="search" action="${esc(url(AZ_PATH))}"${data}>`
    + `<input type="search" name="q" placeholder="${esc(w('Search: Sirius, TRAPPIST-1 e, Andromeda, Orion…'))}" aria-label="${esc(w('Search the encyclopedia'))}" autocomplete="off" spellcheck="false" />`
    + '</form>';
}

/** the index: one page per initial, all of them linked from a letter bar, searchable across the whole encyclopedia */
export function azPages(entries: AzEntry[]): Page[] {
  const byLetter = new Map<string, AzEntry[]>(LETTERS.map((l) => [l, []]));
  for (const e of entries) byLetter.get(letterOf(e.name))!.push(e);
  const kinds = KINDS.map((k) => w(k));
  const bar = (cur: string) => `<nav class="w-az" aria-label="${esc(w('Letters'))}">${LETTERS.map((l) => {
    const label = l === '#' ? '0–9' : l;
    if (!byLetter.get(l)!.length) return `<span>${label}</span>`;
    return `<a href="${esc(url(letterPath(l)))}"${l === cur ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('')}</nav>`;
  const lede = esc(w('All {n} entries of the encyclopedia in alphabetical order. The search box covers all of them at once.', { n: fmtNum(entries.length) }));
  return LETTERS.filter((l) => byLetter.get(l)!.length).map((l) => {
    const list = byLetter.get(l)!;
    const label = l === '#' ? '0–9' : l;
    return {
      path: letterPath(l),
      title: w('Encyclopedia A to Z: {l}', { l: label }),
      description: plainLede(entries.length),
      h1: w('A to Z'),
      lede,
      crumbs: [],
      wide: true,
      scripts: ['/wiki/az.js'],
      body: searchForm(true) + bar(l)
        + `<div class="w-az-body"><h2>${esc(label)} <span class="w-note">${esc(w('{n} entries', { n: fmtNum(list.length) }))}</span></h2>`
        + `<ul class="w-list w-cols w-az-list">${list.map((e) => `<li><a href="${esc(e.path)}">${esc(e.name)}</a> <span class="w-note">${esc(kinds[e.kind])}</span></li>`).join('')}</ul></div>`
        + '<div class="w-az-results" hidden></div>',
    };
  });
}

function plainLede(n: number): string {
  return w('All {n} entries of the encyclopedia in alphabetical order. The search box covers all of them at once.', { n: fmtNum(n) });
}
