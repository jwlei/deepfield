import { AU_KM, C_KM_S, G, PARSEC_KM } from '../../src/core/constants';
import { fixed, fmtNum } from '../../src/i18n';
import { schwarzschildKm } from '../../src/data/blackholes';
import { KIND_LABELS, STATUS_LABELS, type SkyEvent } from '../../src/data/events';
import { LANDMARK_KIND_LABEL } from '../../src/data/landmarks';
import type { BodyData } from '../../src/data/types';
import { GALAXY_TYPE_LABEL } from '../../src/galaxy/GalaxyModel';
import { HANDMADE } from '../../src/galaxy/galaxies';
import { SOLAR_SYSTEM } from '../../src/data/solarSystem';
import { blackHoleTarget, galaxyTarget, landmarkTarget, solarTarget, starTarget } from '../../src/scope/targets';
import type { ScopeTarget } from '../../src/scope/types';
import { typeLabel } from '../../src/ui/format';
import { CONSTELLATIONS, PC_LY, constellationAt, epochFor, fmtDec, fmtRa, midnightMonth, sceneToRaDec, visibility } from './astro';
import { a, appUrl, currentLang, esc, factTable, linkList, locator, openButton, scopeFigure, section, t, url, w, type Page } from './html';
import { tidyBayer } from './catalog';
import { AZ_PATH, searchForm } from './az';
import { dateLong, lat, ly, mag, monthName, pc, plain, sig, years } from './format';
import type { ConstellationEntry, DsoEntry, GalaxyEntry, PlanetEntry, Site, StarEntry } from './model';

const VOYAGER_KMS = 16.9;
const YEAR_S = 3.15576e7;
const EARTH_KG = 5.97237e24, EARTH_KM = 6371, JUP_KG = 1.89813e27, JUP_RE = 11.209;
const MW_DIAMETER_KPC = 26.8, MW_ABS_MAG = -20.9;

/* ------------------------------------------------------------------ shared */

export function conName(abbr: string): string {
  const c = CONSTELLATIONS[abbr];
  if (!c) return abbr;
  return c[0];
}

/** "From the Earth, through a telescope" */
function scopeSection(target: ScopeTarget | null): string {
  return target ? section(t('Through a telescope from Earth'), scopeFigure(target)) : '';
}

function conLink(site: Site, abbr: string): string {
  const c = site.constellations.get(abbr);
  return c ? a(url(`/constellations/${c.slug}`), conName(abbr)) : esc(conName(abbr));
}

function starHref(s: StarEntry): string { return url(`/stars/${s.slug}`); }

/** "seen from Earth" paragraph: latitudes and the month of the midnight culmination */
function skyParagraph(ra: number, dec: number, magnitude: number | null): string {
  const v = visibility(dec);
  const parts: string[] = [];
  if (magnitude !== null) {
    parts.push(magnitude <= 6.5 ? w('Visible to the naked eye under a dark sky (apparent magnitude {m}).', { m: mag(magnitude) })
      : magnitude <= 9 ? w('Too faint for the naked eye (magnitude {m}); binoculars will find it.', { m: mag(magnitude) })
        : w('A telescope is needed to see it: its apparent magnitude is {m}.', { m: mag(magnitude) }));
  }
  if (v.south <= -89.5) parts.push(w('Visible from the whole Southern Hemisphere and north to latitude {north}.', { north: lat(v.north) }));
  else if (v.north >= 89.5) parts.push(w('Visible from the whole Northern Hemisphere and south to latitude {south}.', { south: lat(v.south) }));
  else parts.push(w('Visible from latitudes between {south} and {north}.', { south: lat(v.south), north: lat(v.north) }));
  if (v.circumpolar !== null && Math.abs(v.circumpolar) < 80) {
    parts.push(v.circumpolar > 0 ? w('North of latitude {lat} it never sets.', { lat: lat(v.circumpolar) }) : w('South of latitude {lat} it never sets.', { lat: lat(v.circumpolar) }));
  }
  if (Math.abs(dec) < 75) parts.push(w('It stands highest at midnight in {month}, the best time to observe it.', { month: monthName(midnightMonth(ra)) }));
  return `<p>${parts.map(esc).join(' ')}</p>`;
}

/** when the light seen tonight set out */
function lightParagraph(lightYears: number, buildYear: number): string {
  const parts: string[] = [];
  if (lightYears < 1) parts.push(w('Its light reaches us within a few months.'));
  else if (lightYears < 4000) {
    const y = Math.round(buildYear - lightYears);
    parts.push(y > 0 ? w('The light you see tonight set out around the year {year}.', { year: y }) : w('The light you see tonight set out around {year} BC.', { year: -y + 1 }));
  } else {
    parts.push(w('The light you see tonight set out {ago} ago.', { ago: years(lightYears) }), w(epochFor(lightYears)));
  }
  const voyager = (lightYears / PC_LY) * PARSEC_KM / VOYAGER_KMS / YEAR_S;
  parts.push(w('At the speed of Voyager 1, the fastest craft leaving the Solar System (16.9 km per second), the trip would take {t}.', { t: years(voyager) }));
  return `<p>${parts.map(esc).join(' ')}</p>`;
}

function coordRows(ra: number, dec: number): Array<[string, string]> {
  return [[w('Right ascension (J2000)'), fmtRa(ra)], [w('Declination (J2000)'), fmtDec(dec)]];
}

function thing(name: string, description: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@type': 'Thing', name, description, ...extra };
}

/* ------------------------------------------------------------------ stars */

const LUM_KIND: Record<number, string> = { 1: 'supergiant star', 2: 'bright giant star', 3: 'giant star', 4: 'subgiant star', 5: 'main-sequence star' };

export function starPage(s: StarEntry, site: Site): Page {
  const cat = site.cat, i = s.i;
  const ph = cat.physics(i);
  const h = s.host;
  const names = cat.names.get(i);
  const temperature = h?.teff ?? ph.temperature;
  const radius = h?.rad ?? ph.radius;
  const mass = h?.mass ?? ph.mass;
  const luminosity = h?.lum !== undefined ? 10 ** h.lum : ph.luminosity;
  const spect = h?.spect || cat.catalogSpectral(i) || ph.spectral;
  const kind = ph.wd ? w('white dwarf') : w(LUM_KIND[ph.lumClass] ?? 'star');
  const lyDist = s.dist * PC_LY;
  const buildYear = +site.buildDate.slice(0, 4);

  const lede = esc(w('{name} is a {kind} of spectral type {spect} in the constellation {con}, {dist} from the Sun.', { name: s.name, con: conName(s.con), dist: ly(lyDist), spect, kind }))
    + (h ? ` ${esc(w('It is orbited by {n} confirmed exoplanet(s).', { n: h.planets.length }))}` : '');

  const others = [names?.proper, names?.bayer && tidyBayer(names.bayer), names?.host, names?.gliese, cat.hip[i] ? `HIP ${cat.hip[i]}` : '']
    .filter((x): x is string => !!x && x !== s.name);
  const speed = cat.speed(i);
  const measured = !!h?.teff;
  const facts = factTable([
    others.length ? [w('Other names'), esc([...new Set(others)].join(' · '))] : null,
    [w('Constellation'), conLink(site, s.con)],
    [w('Distance'), `${esc(ly(lyDist))} (${esc(pc(s.dist))})`],
    [w('Apparent magnitude'), esc(w('magnitude {m}', { m: mag(s.mag) }))],
    [w('Absolute magnitude'), esc(w('magnitude {m}', { m: mag(ph.absMag) }))],
    [w('Spectral type'), esc(spect)],
    [w('Surface temperature'), esc(`${fmtNum(Math.round(temperature / 10) * 10)} K`)],
    [w('Luminosity'), esc(`${sig(luminosity)} L☉`)],
    [w('Radius'), esc(`${sig(radius)} R☉`)],
    [w('Mass'), esc(`${sig(mass)} M☉${measured ? '' : ` (${w('estimated')})`}`)],
    h?.age !== undefined ? [w('Age'), esc(w('{n} billion years', { n: fixed(h.age, 1) }))] : null,
    h?.met !== undefined ? [w('Metallicity [Fe/H]'), esc(fixed(h.met, 2))] : null,
    ...coordRows(s.ra, s.dec),
    speed !== null ? [w('Space velocity (relative to the Sun)'), esc(`${fixed(speed, 1)} km/s`)] : null,
  ]);

  // the Sun from there
  const p = cat.pos;
  const back = sceneToRaDec(-p[i * 3], -p[i * 3 + 1], -p[i * 3 + 2]);
  const sunMag = 4.83 + 5 * Math.log10(s.dist / 10);
  const sunCon = constellationAt(back.ra, back.dec);
  const fromThere = `<p>${esc(w('From a planet around {name}, the Sun would look like a star of magnitude {m}, in the direction where our sky has the constellation {con}.', { name: s.name, m: mag(sunMag), con: conName(sunCon) }))} ${esc(sunMag <= 6.5 ? w('It would be visible to the naked eye.') : w('It would be invisible to the naked eye.'))}</p>`;

  const planets = site.planetsByHost.get(i) ?? [];
  const planetList = linkList(planets.map((pl) => ({ href: url(`/exoplanets/${pl.slug}`), label: pl.planet.name, note: planetNote(pl) })));

  let neigh = '';
  if (s.dist <= 100) {
    const nb = cat.neighbours(i, 8, 20 / PC_LY);
    neigh = nb.length
      ? `<p>${esc(w('Its nearest neighbours in the catalogue (within 20 light-years):'))}</p>` + linkList(nb.map(({ j, d }) => {
        const e = site.starByIndex.get(j);
        return { href: j === 0 ? url('/solar-system/sun') : e ? starHref(e) : null, label: j === 0 ? t('Sun') : cat.nameOf(j), note: ly(d * PC_LY) };
      }))
      : `<p>${esc(w('The catalogue has no other star within 20 light-years.'))}</p>`;
  }

  const body = [
    facts,
    section(w('In the sky'), locator({ ra: s.ra, dec: s.dec, ly: lyDist, mag: s.mag, con: s.con, name: s.name }) + skyParagraph(s.ra, s.dec, s.mag)),
    scopeSection(starTarget({ name: s.name, ra: s.ra, dec: s.dec, mag: s.mag, bv: cat.bv[i] })),
    section(w('Light\'s journey'), lightParagraph(lyDist, buildYear)),
    section(w('The Sun seen from there'), fromThere),
    planets.length ? section(w('Planets'), planetList) : '',
    neigh ? section(w('Neighbours'), neigh) : '',
    openButton(appUrl({ open: `star:c${i}` })),
    `<p class="w-src">${esc(measured ? w('Stellar parameters from the NASA Exoplanet Archive; position and brightness from the HYG / AT-HYG catalogue.') : w('Position, brightness and colour from the HYG / AT-HYG catalogue; temperature, luminosity, radius and mass are approximate values computed from these observations.'))}</p>`,
  ].join('\n');

  return {
    path: `/stars/${s.slug}`,
    title: w('{name}: distance, brightness and place in the sky', { name: s.name }),
    description: plain(lede),
    h1: s.name,
    eyebrow: `${w('Star')} · ${spect}`,
    lede,
    body,
    crumbs: [[w('Stars'), '/stars'], [conName(s.con), `/constellations/${site.constellations.get(s.con)?.slug ?? ''}`]],
    jsonld: [thing(s.name, plain(lede), { alternateName: others, url: `https://youreyesinspace.com${url(`/stars/${s.slug}`)}` })],
  };
}

/* ------------------------------------------------------------------ exoplanets */

function planetClass(R?: number, M?: number): string {
  if (R !== undefined) {
    if (R < 1.25) return 'Earth-sized rocky planet';
    if (R < 2) return 'super-Earth';
    if (R < 4) return 'mini-Neptune';
    if (R < 8) return 'Neptune-like planet';
    return 'gas giant';
  }
  if (M !== undefined) {
    if (M < 2) return 'Earth-mass planet';
    if (M < 10) return 'super-Earth';
    if (M < 50) return 'Neptune-like planet';
    return 'gas giant';
  }
  return 'exoplanet';
}

function planetNote(pl: PlanetEntry): string {
  const p = pl.planet;
  const bits: string[] = [];
  if (p.P !== undefined) bits.push(w('{n}-day orbit', { n: sig(p.P) }));
  if (p.R !== undefined) bits.push(`${sig(p.R)} R⊕`);
  return bits.join(' · ');
}

/** stellar flux at the planet, Earth = 1 */
function insolation(pl: PlanetEntry): number | null {
  const p = pl.planet;
  if (p.S !== undefined) return p.S;
  if (p.a !== undefined && pl.host.lum !== undefined) return 10 ** pl.host.lum / (p.a * p.a);
  return null;
}

export function planetPage(pl: PlanetEntry, site: Site): Page {
  const p = pl.planet, h = pl.host;
  const hostName = pl.star?.name ?? h.name;
  const dist = h.dist ?? site.cat.dist(h.i);
  const cls = w(planetClass(p.R, p.M));
  const S = insolation(pl);
  const lede = esc(w('{name} is a {cls} orbiting the star {host}.', { name: p.name, host: hostName, cls }))
    + (p.P !== undefined ? ` ${esc(w('Its year lasts {n} Earth days.', { n: sig(p.P) }))}` : '')
    + (p.year ? ` ${esc(w('It was discovered in {year} by the {method} method.', { year: p.year, method: t(p.method ?? '') }))}` : '');

  const msini = p.Mprov === 'Msini';
  const g = p.M !== undefined && p.R !== undefined && p.Mprov === 'Mass' ? p.M / (p.R * p.R) : null;
  const facts = factTable([
    [w('Host star'), pl.star ? a(url(`/stars/${pl.star.slug}`), hostName) : esc(hostName)],
    [w('Distance'), `${esc(ly(dist * PC_LY))} (${esc(pc(dist))})`],
    p.P !== undefined ? [w('Orbital period'), esc(p.P < 2 ? w('{n} hours', { n: sig(p.P * 24) }) : p.P > 730 ? w('{n} years', { n: sig(p.P / 365.25) }) : w('{n} days', { n: sig(p.P) }))] : null,
    p.a !== undefined ? [w('Orbital radius'), esc(`${sig(p.a)} AU`)] : null,
    p.e !== undefined ? [w('Eccentricity'), esc(fixed(p.e, 3))] : null,
    p.R !== undefined ? [w('Radius'), esc(`${sig(p.R)} R⊕ · ${sig(p.R / JUP_RE)} R♃`)] : null,
    p.M !== undefined ? [w(msini ? 'Mass (minimum)' : 'Mass'), esc(`${sig(p.M)} M⊕ · ${sig(p.M * EARTH_KG / JUP_KG)} M♃${p.Mprov === 'M-R relationship' ? ` (${w('estimated from the radius')})` : ''}`)] : null,
    p.rho !== undefined ? [w('Density'), esc(`${sig(p.rho)} g/cm³`)] : null,
    g !== null ? [w('Surface gravity'), esc(w('{n} × Earth', { n: sig(g) }))] : null,
    p.Teq !== undefined ? [w('Equilibrium temperature'), esc(`${fmtNum(Math.round(p.Teq))} K (${fmtNum(Math.round(p.Teq - 273.15))} °C)`)] : null,
    S !== null ? [w('Stellar flux received'), esc(w('{n} × Earth', { n: sig(S) }))] : null,
    p.method ? [w('Discovery method'), esc(t(p.method))] : null,
    p.year ? [w('Discovery year'), esc(String(p.year))] : null,
    p.facility ? [w('Discovered by'), esc(p.facility)] : null,
  ]);

  // habitable zone (Kopparapu et al. 2013): conservative 0.36–1.07 S⊕, optimistic 0.32–1.78 S⊕
  let hz = '';
  if (S !== null) {
    hz = S >= 0.36 && S <= 1.07 ? w('Inside its star\'s habitable zone: it receives enough light for liquid water to exist on its surface under a suitable atmosphere.')
      : S >= 0.32 && S <= 1.78 ? w('At the edge of the habitable zone (within the optimistic limits): liquid water would be possible only with a favourable atmosphere.')
        : S > 1.78 ? w('Inside the inner edge of the habitable zone: it receives {n} times the light the Earth does, too hot to keep liquid water on its surface.', { n: sig(S) })
          : w('Beyond the habitable zone: it receives only {pct} of the light the Earth does, a frozen world.', { pct: `%${sig(S * 100, 2)}` });
    hz = `<p>${esc(hz)}</p>`;
  }

  // the star in its sky
  let sky = '';
  if (p.a !== undefined && h.rad !== undefined) {
    const angDeg = 2 * Math.atan((h.rad * 695_700) / (p.a * AU_KM)) * 180 / Math.PI;
    const ratio = angDeg / 0.533;
    sky = `<p>${esc(w('In the planet\'s sky its star is a disc {deg}° across: {x} times the Sun as we see it from Earth.', { deg: sig(angDeg, 2), x: sig(ratio, 2) }))}</p>`;
  }

  const hostPos = pl.star ?? site.cat.raDec(h.i);
  const hostCon = pl.star?.con ?? constellationAt(hostPos.ra, hostPos.dec);
  const siblings = (site.planetsByHost.get(h.i) ?? []).filter((x) => x !== pl);
  const body = [
    facts,
    hz ? section(w('Habitable zone'), hz) : '',
    sky ? section(w('Its star in the sky'), sky) : '',
    section(w('In the sky'), locator({ ra: hostPos.ra, dec: hostPos.dec, ly: dist * PC_LY, mag: pl.star?.mag ?? site.cat.mag[h.i], con: hostCon, name: hostName }) + skyParagraph(hostPos.ra, hostPos.dec, pl.star?.mag ?? site.cat.mag[h.i])),
    section(w('Light\'s journey'), lightParagraph(dist * PC_LY, +site.buildDate.slice(0, 4))),
    siblings.length ? section(w('Planets in the same system'), linkList(siblings.map((x) => ({ href: url(`/exoplanets/${x.slug}`), label: x.planet.name, note: planetNote(x) })))) : '',
    openButton(appUrl({ open: `planet:c${h.i}/${p.name}` })),
    `<p class="w-src">${esc(w('Data: {src}. Its look in the simulation is a rendering based on the measured radius, mass and temperature.', { src: site.exoSource }))}</p>`,
  ].join('\n');

  return {
    path: `/exoplanets/${pl.slug}`,
    title: w('{name}: exoplanet of {host}', { name: p.name, host: hostName }),
    description: plain(lede),
    h1: p.name,
    eyebrow: `${w('Exoplanet')} · ${cls}`,
    lede,
    body,
    crumbs: [[w('Exoplanets'), '/exoplanets'], ...(pl.star ? [[hostName, `/stars/${pl.star.slug}`] as [string, string]] : [])],
    jsonld: [thing(p.name, plain(lede))],
  };
}

/* ------------------------------------------------------------------ constellations */

export function constellationPage(c: ConstellationEntry, site: Site): Page {
  const [latin] = CONSTELLATIONS[c.abbr];
  const name = conName(c.abbr);
  const byMag = [...c.stars].sort((x, y) => x.mag - y.mag);
  const brightest = byMag[0];
  // circular mean of the member positions
  let sx = 0, sy = 0, sd = 0;
  for (const s of c.stars) { sx += Math.cos(s.ra * Math.PI / 180); sy += Math.sin(s.ra * Math.PI / 180); sd += s.dec; }
  const ra = ((Math.atan2(sy, sx) * 180 / Math.PI) + 360) % 360;
  const dec = c.stars.length ? sd / c.stars.length : 0;
  const lede = esc(w('{name} ({abbr}) is one of the 88 constellations recognised by the International Astronomical Union.', { name: latin, abbr: c.abbr }))
    + (brightest ? ` ${esc(w('Its brightest star is {star} (magnitude {m}).', { star: brightest.name, m: mag(brightest.mag) }))}` : '');
  const hosts = c.stars.filter((s) => s.host);
  const body = [
    factTable([
      [w('Latin name'), esc(latin)],
      [w('Abbreviation'), esc(c.abbr)],
      brightest ? [w('Brightest star'), a(starHref(brightest), brightest.name)] : null,
      [w('Stars in this encyclopedia'), esc(fmtNum(c.stars.length))],
      [w('Stars with exoplanets'), esc(fmtNum(hosts.length))],
      [w('Deep-sky objects'), esc(fmtNum(c.dsos.length))],
      [w('Galaxies'), esc(fmtNum(c.galaxies.length))],
    ]),
    section(w('In the sky'), locator({ ra, dec, con: c.abbr, name, fov: 70, area: true }) + skyParagraph(ra, dec, null)),
    section(w('Its brightest stars'), linkList(byMag.slice(0, 25).map((s) => ({ href: starHref(s), label: s.name, note: `${mag(s.mag)} · ${ly(s.dist * PC_LY)}` })))),
    hosts.length ? section(w('Its stars with exoplanets'), linkList(hosts.map((s) => ({ href: starHref(s), label: s.name, note: w('{n} planet(s)', { n: s.host!.planets.length }) })), 'w-list w-cols')) : '',
    c.dsos.length ? section(w('Deep-sky objects'), linkList(c.dsos.map((d) => {
      const def = site.dsoDefs.get(d.id)!;
      return { href: url(`/deep-sky/${d.slug}`), label: t(def.name), note: t(LANDMARK_KIND_LABEL[def.kind]).split(' /')[0] };
    }), 'w-list w-cols')) : '',
    c.galaxies.length ? section(w('Galaxies'), linkList(c.galaxies.map((g) => ({ href: url(`/galaxies/${g.slug}`), label: t(g.name), note: ly(g.distMpc * 1e6 * PC_LY) })), 'w-list w-cols')) : '',
    byMag.length > 25 ? section(w('Its other stars'), linkList(byMag.slice(25).map((s) => ({ href: starHref(s), label: s.name })), 'w-list w-cols')) : '',
  ].join('\n');
  return {
    path: `/constellations/${c.slug}`,
    title: w('{name} constellation: stars, planets and deep-sky objects', { name }),
    description: plain(lede),
    h1: latin,
    eyebrow: w('Constellation'),
    lede,
    body,
    crumbs: [[w('Constellations'), '/constellations']],
    jsonld: [thing(latin, plain(lede), { alternateName: [c.abbr] })],
  };
}

/* ------------------------------------------------------------------ deep sky */

export function dsoPage(d: DsoEntry, site: Site): Page {
  const def = site.dsoDefs.get(d.id)!;
  const name = t(def.name);
  const kind = t(LANDMARK_KIND_LABEL[def.kind]).split(' /')[0];
  const lede = esc(t(def.summary));
  const factRows: Array<[string, string] | null> = Object.entries(def.facts).map(([k, v]) => [t(k), esc(t(v))]);
  const hostGalaxy = def.galaxy ? site.galaxies.find((g) => g.name.includes(def.galaxy!) || t(g.name).includes(def.galaxy!)) : undefined;
  const body = [
    def.description ? `<p>${esc(t(def.description))}</p>` : '',
    factTable([
      [w('Type'), esc(kind)],
      [w('Constellation'), conLink(site, d.con)],
      hostGalaxy ? [w('Host galaxy'), a(url(`/galaxies/${hostGalaxy.slug}`), t(hostGalaxy.name))] : null,
      def.distancePc !== undefined && !Object.keys(def.facts).some((k) => k === 'Distance') ? [w('Distance'), `${esc(ly(def.distancePc * PC_LY))} (${esc(pc(def.distancePc))})`] : null,
      ...factRows,
      ...coordRows(def.ra, def.dec),
    ]),
    section(w('In the sky'), locator({ ra: def.ra, dec: def.dec, ly: def.distancePc !== undefined ? def.distancePc * PC_LY : undefined, con: d.con, name }) + skyParagraph(def.ra, def.dec, null)),
    scopeSection(landmarkTarget(def, name, hostGalaxy ? hostGalaxy.distMpc * 1e6 : undefined)),
    def.distancePc !== undefined ? section(w('Light\'s journey'), lightParagraph(def.distancePc * PC_LY, +site.buildDate.slice(0, 4))) : '',
    openButton(appUrl({ open: `landmark:${def.id}` })),
  ].join('\n');
  return {
    path: `/deep-sky/${d.slug}`,
    title: w('{name}: {kind}', { name, kind }),
    description: plain(`${t(def.summary)}. ${t(def.description)}`),
    h1: name,
    eyebrow: kind,
    lede,
    body,
    crumbs: [[w('Deep sky'), '/deep-sky'], [conName(d.con), `/constellations/${site.constellations.get(d.con)?.slug ?? ''}`]],
    jsonld: [thing(name, plain(t(def.description) || t(def.summary)))],
  };
}

/* ------------------------------------------------------------------ galaxies */

export function galaxyPage(g: GalaxyEntry, site: Site): Page {
  const name = t(g.name);
  const hand = g.source === 'curated' ? HANDMADE.find((c) => c.name === g.name) : undefined;
  const type = t(hand?.pec?.label ?? GALAXY_TYPE_LABEL[g.type]);
  const dPc = g.distMpc * 1e6;
  const lyDist = dPc * PC_LY;
  const appMag = g.absMag + 5 * Math.log10(dPc / 10);
  const lede = esc(w('{name} is a galaxy in the direction of the constellation {con}, {dist} away.', { name, con: conName(g.con), dist: ly(lyDist) }))
    + (g.desc ? ` ${esc(t(g.desc))}` : '');
  const lum = 10 ** (-0.4 * (g.absMag - MW_ABS_MAG));
  const body = [
    factTable([
      [w('Type'), esc(type + (g.typeGuessed ? ` (${w('estimated')})` : ''))],
      [w('Constellation'), conLink(site, g.con)],
      [w('Distance'), `${esc(ly(lyDist))} (${esc(pc(dPc))})`],
      g.diameterKpc > 0 ? [w('Diameter'), esc(`${ly(g.diameterKpc * 1000 * PC_LY)} · ${w('{n} × the Milky Way', { n: sig(g.diameterKpc / MW_DIAMETER_KPC, 2) })}`)] : null,
      [w('Absolute magnitude'), esc(w('magnitude {m}', { m: mag(g.absMag) }))],
      [w('Apparent magnitude'), esc(w('magnitude {m}', { m: mag(appMag) }))],
      [w('Luminosity'), esc(w('{n} × the Milky Way', { n: sig(lum, 2) }))],
      ...coordRows(g.ra, g.dec),
      [w('Source'), esc(hand?.pec ? w('Hand-drawn after published images (approximate)') : g.source === 'curated' ? w('Compiled catalogue (NED, approximate values)') : g.source === 'ungc' ? 'Updated Nearby Galaxy Catalog (Karachentsev et al. 2013)' : '2MASS Redshift Survey (Huchra et al. 2012)')],
    ]),
    section(w('In the sky'), locator({ ra: g.ra, dec: g.dec, ly: lyDist, mag: appMag, con: g.con, name }) + skyParagraph(g.ra, g.dec, appMag)),
    scopeSection(galaxyTarget({ ...hand, ...g }, name)),
    section(w('Light\'s journey'), lightParagraph(lyDist, +site.buildDate.slice(0, 4))),
    openButton(appUrl({ open: `galaxy:${g.name}` })),
  ].join('\n');
  return {
    path: `/galaxies/${g.slug}`,
    title: w('{name} galaxy: distance, type and size', { name }),
    description: plain(lede),
    h1: name,
    eyebrow: `${w('Galaxy')} · ${type}`,
    lede,
    body,
    crumbs: [[w('Galaxies'), '/galaxies']],
    jsonld: [thing(name, plain(lede))],
  };
}

/* ------------------------------------------------------------------ black holes */

export function blackHolePage(entry: Site['blackHoles'][number], site: Site): Page {
  const e = entry.entry;
  const bh = e.bodies?.().find((b) => b.type === 'blackhole') ?? e.companionBody?.('host', 2e31);
  const rs = schwarzschildKm(e.massSolar);
  const lede = esc(t(e.summary));
  const scale = rs < 1e6 ? w('{km} km: the size of a city', { km: fmtNum(Math.round(rs)) })
    : rs < AU_KM * 0.5 ? w('{n} million km: {x} times the Sun\'s radius', { n: sig(rs / 1e6), x: sig(rs / 695_700, 2) })
      : w('{n} AU: {x} times Neptune\'s orbit', { n: sig(rs / AU_KM, 3), x: sig(rs / AU_KM / 30.07, 2) });
  const crossing = (2 * Math.PI * rs) / C_KM_S;
  const body = [
    bh?.description ? `<p>${esc(t(bh.description))}</p>` : '',
    factTable([
      [w('Mass'), esc(e.massSolar >= 1e6 ? w('{n} million solar masses', { n: sig(e.massSolar / 1e6) }) : w('{n} solar masses', { n: sig(e.massSolar) }))],
      [w('Event horizon radius'), esc(scale)],
      [w('Time for light to circle the event horizon once'), esc(crossing < 120 ? w('{n} seconds', { n: sig(crossing, 2) }) : crossing < 7200 ? w('{n} minutes', { n: sig(crossing / 60, 2) }) : w('{n} hours', { n: sig(crossing / 3600, 2) }))],
      ...Object.entries(bh?.facts ?? {}).map(([k, v]) => [t(k), esc(t(v))] as [string, string]),
      bh?.discovered ? [w('Discovery'), esc(t(bh.discovered))] : null,
    ]),
    scopeSection(blackHoleTarget(e.bodyId, e.name)),
    `<p>${esc(w('The event horizon is the boundary where the escape velocity equals the speed of light: nothing inside, not even light, can get out. Its radius grows in direct proportion to the mass (the Schwarzschild radius, for a non-rotating black hole).'))}</p>`,
    openButton(appUrl({ open: `bh:${e.id}` })),
  ].join('\n');
  return {
    path: `/black-holes/${entry.slug}`,
    title: w('{name} black hole', { name: e.name }),
    description: plain(`${t(e.summary)}. ${bh?.description ? t(bh.description) : ''}`),
    h1: e.name,
    eyebrow: w('Black hole'),
    lede,
    body,
    crumbs: [[w('Black holes'), '/black-holes']],
    jsonld: [thing(e.name, plain(t(e.summary)))],
  };
}

/* ------------------------------------------------------------------ solar system */

function rotation(b: BodyData): string | null {
  const r = b.rotationPeriod;
  if (r === undefined) return null;
  if (r === 'sync') return w('Tidally locked (always shows the same face)');
  const h = Math.abs(r);
  const s = h < 48 ? w('{n} hours', { n: sig(h) }) : w('{n} days', { n: sig(h / 24) });
  return r < 0 ? `${s} (${w('retrograde')})` : s;
}

export function solarPage(entry: Site['solar'][number], site: Site): Page {
  const b = entry.body;
  const name = t(b.name);
  const parent = b.parent ? site.solarById.get(b.parent) : undefined;
  const craft = b.type === 'spacecraft';
  const r = b.radius, m = b.mass;
  const gSurf = (G * m) / (r * 1000) ** 2;
  const vEsc = Math.sqrt((2 * G * m) / (r * 1000)) / 1000;
  const rho = m / ((4 / 3) * Math.PI * (r * 1e5) ** 3) * 1000;
  const o = b.orbit;
  const orbitRows: Array<[string, string] | null> = [];
  if (o?.kind === 'jpl') {
    orbitRows.push([w('Mean distance from the Sun'), esc(`${sig(o.a)} AU (${w('{n} million km', { n: fmtNum(Math.round(o.a * AU_KM / 1e6)) })})`)]);
    orbitRows.push([w('Eccentricity'), esc(fixed(o.e, 3))]);
    orbitRows.push([w('Orbital period'), esc(o.a ** 1.5 < 2 ? w('{n} days', { n: sig(o.a ** 1.5 * 365.25) }) : w('{n} years', { n: sig(o.a ** 1.5) }))]);
  } else if (o?.kind === 'simple') {
    const around = parent ? t(parent.body.name) : '';
    orbitRows.push([w('Orbital radius'), esc(o.a > AU_KM * 0.1 ? `${sig(o.a / AU_KM)} AU` : `${fmtNum(Math.round(o.a))} km`) + (around ? ` (${esc(around)})` : '')]);
    if (o.e) orbitRows.push([w('Eccentricity'), esc(fixed(o.e, 3))]);
    orbitRows.push([w('Orbital period'), esc(o.period < 2 ? w('{n} hours', { n: sig(o.period * 24) }) : o.period > 730 ? w('{n} years', { n: sig(o.period / 365.25) }) : w('{n} days', { n: sig(o.period) }))]);
  }
  const facts = factTable([
    [w('Type'), esc(typeLabel(b.type))],
    parent ? [w('Parent body'), a(url(`/solar-system/${parent.slug}`), t(parent.body.name))] : null,
    !craft && r > 0 ? [w('Radius'), esc(`${fmtNum(Math.round(r))} km · ${sig(r / EARTH_KM)} R⊕`)] : null,
    !craft && m > 0 ? [w('Mass'), esc(`${sig(m, 4)} kg · ${sig(m / EARTH_KG)} M⊕`)] : null,
    !craft && m > 0 && r > 0 ? [w('Mean density'), esc(`${sig(rho)} g/cm³`)] : null,
    !craft && m > 1e19 && r > 0 ? [w('Surface gravity'), esc(`${sig(gSurf)} m/s² · ${w('{n} × Earth', { n: sig(gSurf / 9.81, 2) })}`)] : null,
    !craft && m > 1e19 && r > 0 ? [w('Escape velocity'), esc(`${sig(vEsc)} km/s`)] : null,
    !craft ? (rotation(b) ? [w('Rotation period'), esc(rotation(b)!)] : null) : null,
    ...orbitRows,
    b.temperature ? [w('Temperature'), esc(`${fmtNum(Math.round(b.temperature))} K (${fmtNum(Math.round(b.temperature - 273.15))} °C)`)] : null,
    ...Object.entries(b.facts ?? {}).map(([k, v]) => [t(k), esc(t(v))] as [string, string]),
    b.discovered ? [w('Discovery'), esc(t(b.discovered))] : null,
  ]);
  const children = site.solar.filter((s) => s.body.parent === b.id && s.body.type !== 'barycenter');
  const lede = b.description ? esc(t(b.description)) : esc(typeLabel(b.type));
  const body = [
    facts,
    scopeSection(solarTarget(b.id, SOLAR_SYSTEM, t)),
    children.length ? section(b.type === 'star' ? w('Bodies orbiting it') : w('Moons and companions'), linkList(children.map((c) => ({ href: url(`/solar-system/${c.slug}`), label: t(c.body.name), note: typeLabel(c.body.type) })), 'w-list w-cols')) : '',
    openButton(appUrl({ target: b.id })),
  ].join('\n');
  return {
    path: `/solar-system/${entry.slug}`,
    title: craft ? w('{name} spacecraft', { name }) : w('{name}: {type}', { name, type: typeLabel(b.type) }),
    description: plain(lede),
    h1: name,
    eyebrow: typeLabel(b.type),
    lede,
    body,
    crumbs: [[w('Solar System'), '/solar-system'], ...(parent && parent.body.type !== 'star' ? [[t(parent.body.name), `/solar-system/${parent.slug}`] as [string, string]] : [])],
    jsonld: [thing(name, plain(lede))],
  };
}

/* ------------------------------------------------------------------ events */

export function eventPage(entry: Site['events'][number], site: Site): Page {
  const e: SkyEvent = entry.e;
  const title = t(e.title);
  const lede = esc(t(e.kicker));
  const bodies = e.bodies.map((id) => site.solarById.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const body = [
    `<p>${esc(t(e.summary))}</p>`,
    factTable([
      [w('Type'), esc(t(KIND_LABELS[e.kind]))],
      [w('Date'), esc(dateLong(e.time, true))],
      e.window ? [w('Visibility window'), esc(`${dateLong(e.window[0])} – ${dateLong(e.window[1])}`)] : null,
      [w('Status'), esc(t(STATUS_LABELS[e.status]))],
      ...e.facts.map(([k, v]) => [t(k), esc(t(v))] as [string, string]),
      bodies.length ? [w('Bodies involved'), bodies.map((x) => a(url(`/solar-system/${x.slug}`), t(x.body.name))).join(', ')] : null,
      [w('Source'), `<a href="${esc(e.source.url)}" rel="noopener">${esc(e.source.name)}</a>`],
    ]),
    openButton(appUrl({ event: e.id }), w('Watch in the simulation')),
  ].join('\n');
  return {
    path: `/sky-events/${entry.slug}`,
    title: `${title} · ${dateLong(e.time)}`,
    description: plain(`${t(e.kicker)} ${t(e.summary)}`),
    h1: title,
    eyebrow: `${t(KIND_LABELS[e.kind])} · ${dateLong(e.time)}`,
    lede,
    body,
    crumbs: [[w('Sky events'), '/sky-events']],
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Event', name: title, description: plain(t(e.summary)),
      startDate: e.window?.[0] ?? e.time, endDate: e.window?.[1] ?? e.time,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: `https://youreyesinspace.com${appUrl({ event: e.id })}` },
      image: 'https://youreyesinspace.com/og-image.jpg',
      organizer: { '@type': 'Organization', name: 'Your Eyes In Space', url: 'https://youreyesinspace.com' },
    }],
  };
}

/* ------------------------------------------------------------------ hubs */

function hub(p: Omit<Page, 'eyebrow'>): Page { return { ...p }; }

export function hubPages(site: Site): Page[] {
  const out: Page[] = [];
  const named = site.stars.filter((s) => site.cat.names.get(s.i)?.proper);
  const brightest = [...site.stars].sort((x, y) => x.mag - y.mag).slice(0, 60);
  const nearest = [...site.stars].sort((x, y) => x.dist - y.dist).slice(0, 60);
  const cons = [...site.constellations.values()].sort((x, y) => conName(x.abbr).localeCompare(conName(y.abbr), currentLang()));
  const conList = linkList(cons.map((c) => ({ href: url(`/constellations/${c.slug}`), label: conName(c.abbr) })), 'w-list w-cols');

  const lede = esc(w('A sky encyclopedia compiled from the real catalogues the simulation uses: the distances, brightnesses and orbits on every page are computed from measurements, and every object opens in the 3D simulation with one click.'));
  out.push(hub({
    path: '/encyclopedia', title: w('Sky encyclopedia: stars, exoplanets, constellations and galaxies'), description: plain(lede),
    h1: w('Sky encyclopedia'), lede, crumbs: [],
    body: searchForm(false) + `<ol class="w-index">${([
      [AZ_PATH, w('All entries, A to Z'), site.stars.length + site.planets.length + site.constellations.size + site.solar.length + site.dsos.length + site.galaxies.length + site.blackHoles.length + site.events.length],
      ['/stars', w('Stars'), site.stars.length],
      ['/exoplanets', w('Exoplanets'), site.planets.length],
      ['/constellations', w('Constellations'), site.constellations.size],
      ['/solar-system', w('Solar System'), site.solar.length],
      ['/deep-sky', w('Deep sky'), site.dsos.length],
      ['/galaxies', w('Galaxies'), site.galaxies.length],
      ['/black-holes', w('Black holes'), site.blackHoles.length],
      ['/sky-events', w('Sky events'), site.events.length],
    ] as Array<[string, string, number]>).map(([p, label, n]) => `<li>${a(url(p), label)}<span>${esc(fmtNum(n))}</span></li>`).join('')}</ol>`
      + section(w('Constellations'), conList),
  }));

  const sLede = esc(w('The brightest and nearest stars in the sky, {n} stars with names and the stars that host exoplanets, by constellation.', { n: fmtNum(named.length) }));
  out.push(hub({
    path: '/stars', title: w('Stars: the brightest and nearest stars'), description: plain(sLede), h1: w('Stars'), lede: sLede,
    crumbs: [],
    body: [
      section(w('Brightest stars'), linkList(brightest.map((s) => ({ href: starHref(s), label: s.name, note: `${mag(s.mag)} · ${conName(s.con)}` })), 'w-list w-cols')),
      section(w('Nearest stars'), linkList(nearest.map((s) => ({ href: starHref(s), label: s.name, note: ly(s.dist * PC_LY) })), 'w-list w-cols')),
      section(w('By constellation'), conList),
    ].join('\n'),
  }));

  const hz = site.planets.filter((pl) => { const S = insolation(pl); return S !== null && S >= 0.32 && S <= 1.78; }).sort((x, y) => (x.host.dist ?? 1e9) - (y.host.dist ?? 1e9));
  const nearPl = [...site.planets].sort((x, y) => (x.host.dist ?? 1e9) - (y.host.dist ?? 1e9)).slice(0, 80);
  const pLede = esc(w('The {n} confirmed exoplanets of the NASA Exoplanet Archive: their orbits, sizes, temperatures and where they sit relative to the habitable zone.', { n: fmtNum(site.planets.length) }));
  const byYear: Record<number, number> = {};
  for (const pl of site.planets) if (pl.planet.year) byYear[pl.planet.year] = (byYear[pl.planet.year] ?? 0) + 1;
  out.push(hub({
    path: '/exoplanets', title: w('Exoplanets: the nearest and the habitable-zone planets'), description: plain(pLede), h1: w('Exoplanets'), lede: pLede,
    crumbs: [],
    body: [
      section(w('Exoplanets in the habitable zone'), linkList(hz.map((pl) => ({ href: url(`/exoplanets/${pl.slug}`), label: pl.planet.name, note: ly((pl.host.dist ?? 0) * PC_LY) })), 'w-list w-cols')),
      section(w('Nearest exoplanets'), linkList(nearPl.map((pl) => ({ href: url(`/exoplanets/${pl.slug}`), label: pl.planet.name, note: ly((pl.host.dist ?? 0) * PC_LY) })), 'w-list w-cols')),
      section(w('Discoveries by year'), factTable(Object.entries(byYear).sort((x, y) => +y[0] - +x[0]).map(([y, n]) => [y, esc(fmtNum(n))]))),
    ].join('\n'),
  }));

  const cLede = esc(w('The 88 official constellations that divide the sky: the stars, exoplanets, nebulae, clusters and galaxies of each.'));
  out.push(hub({ path: '/constellations', title: w('The 88 constellations: their stars and deep-sky objects'), description: plain(cLede), h1: w('Constellations'), lede: cLede, crumbs: [], body: conList }));

  const groups: Array<[string, Array<Site['solar'][number]>]> = [
    [w('The Sun and planets'), site.solar.filter((s) => s.body.type === 'star' || s.body.type === 'planet')],
    [w('Dwarf planets'), site.solar.filter((s) => s.body.type === 'dwarf')],
    [w('Moons'), site.solar.filter((s) => s.body.type === 'moon')],
    [w('Asteroids and comets'), site.solar.filter((s) => s.body.type === 'asteroid' || s.body.type === 'comet')],
    [w('Spacecraft'), site.solar.filter((s) => s.body.type === 'spacecraft')],
  ];
  const ssLede = esc(w('The Sun, planets, moons, dwarf planets, comets and spacecraft, with NASA/JPL orbital data.'));
  out.push(hub({
    path: '/solar-system', title: w('Solar System: planets, moons and spacecraft'), description: plain(ssLede), h1: w('Solar System'), lede: ssLede, crumbs: [],
    body: groups.filter(([, l]) => l.length).map(([g, l]) => section(g, linkList(l.map((s) => ({ href: url(`/solar-system/${s.slug}`), label: t(s.body.name) })), 'w-list w-cols'))).join('\n'),
  }));

  const hand = site.dsos.filter((d) => d.handMade);
  const kinds = new Map<string, DsoEntry[]>();
  for (const d of site.dsos) {
    const k = site.dsoDefs.get(d.id)!.kind;
    const list = kinds.get(k) ?? [];
    list.push(d);
    kinds.set(k, list);
  }
  const dLede = esc(w('Nebulae, star clusters, supernova remnants, planetary nebulae and pulsars: {n} objects.', { n: fmtNum(site.dsos.length) }));
  out.push(hub({
    path: '/deep-sky', title: w('Deep sky: nebulae, star clusters and pulsars'), description: plain(dLede), h1: w('Deep sky'), lede: dLede, crumbs: [],
    body: [
      section(w('Highlights'), linkList(hand.map((d) => ({ href: url(`/deep-sky/${d.slug}`), label: t(site.dsoDefs.get(d.id)!.name), note: t(LANDMARK_KIND_LABEL[site.dsoDefs.get(d.id)!.kind]).split(' /')[0] })), 'w-list w-cols')),
      section(w('By type'), factTable([...kinds.entries()].map(([k, l]) => [t(LANDMARK_KIND_LABEL[k as keyof typeof LANDMARK_KIND_LABEL]).split(' /')[0], esc(fmtNum(l.length))]))),
      `<p>${esc(w('Every object is listed on its constellation\'s page.'))}</p>`,
      section(w('Constellations'), conList),
    ].join('\n'),
  }));

  const curated = site.galaxies.filter((g) => g.source === 'curated');
  const nearG = site.galaxies.filter((g) => g.source !== 'curated').sort((x, y) => x.distMpc - y.distMpc).slice(0, 120);
  const gLede = esc(w('Real galaxies from the Local Group to the Virgo Cluster: {n} galaxies with their distances, types and sizes.', { n: fmtNum(site.galaxies.length) }));
  out.push(hub({
    path: '/galaxies', title: w('Galaxies: from Andromeda to the Virgo Cluster'), description: plain(gLede), h1: w('Galaxies'), lede: gLede, crumbs: [],
    body: [
      section(w('Highlights'), linkList(curated.map((g) => ({ href: url(`/galaxies/${g.slug}`), label: t(g.name), note: ly(g.distMpc * 1e6 * PC_LY) })), 'w-list w-cols')),
      section(w('Nearest galaxies'), linkList(nearG.map((g) => ({ href: url(`/galaxies/${g.slug}`), label: t(g.name), note: ly(g.distMpc * 1e6 * PC_LY) })), 'w-list w-cols')),
    ].join('\n'),
  }));

  const bLede = esc(w('From Sagittarius A* at the centre of the Milky Way to M87*, the first ever imaged, from X-ray binaries to supermassive giants: known black holes with their masses and event horizons.'));
  out.push(hub({
    path: '/black-holes', title: w('Black holes: Sagittarius A*, M87* and others'), description: plain(bLede), h1: w('Black holes'), lede: bLede, crumbs: [],
    body: linkList(site.blackHoles.map((b) => ({ href: url(`/black-holes/${b.slug}`), label: b.entry.name, note: t(b.entry.summary) }))),
  }));

  const now = site.buildDate;
  const upcoming = site.events.filter((x) => x.e.time >= now), past = site.events.filter((x) => x.e.time < now).reverse();
  const eLede = esc(w('Upcoming sky and space events: meteor showers, conjunctions, eclipses and the key moments of space missions, each one viewable in the simulation.'));
  const evList = (l: typeof site.events) => linkList(l.map((x) => ({ href: url(`/sky-events/${x.slug}`), label: t(x.e.title), note: dateLong(x.e.time) })));
  out.push(hub({
    path: '/sky-events', title: w('Sky events calendar: meteor showers, eclipses, conjunctions'), description: plain(eLede), h1: w('Sky events'), lede: eLede, crumbs: [],
    body: [upcoming.length ? section(w('Upcoming'), evList(upcoming)) : '', past.length ? section(w('Past events'), evList(past)) : ''].join('\n'),
  }));
  return out;
}

/** /stars/<anything not generated>: the long tail of the 2.8 million stars (noindex, filled in by /wiki/star.js) */
export function fallbackStarPage(): Page {
  return {
    path: '/stars/_',
    title: w('Catalogue star'),
    description: w('One of the 2.8 million stars of the Gaia and Tycho-2 catalogues.'),
    h1: w('Catalogue star'),
    eyebrow: w('Star'),
    lede: esc(w('One of the 2.8 million stars of the Gaia and Tycho-2 catalogues. This star has no detailed page yet; open it in the simulation to see its position, brightness and surroundings.')),
    body: `${openButton(appUrl({}))}<script src="/wiki/star.js" defer></script>`,
    crumbs: [[w('Stars'), '/stars']],
    noindex: true,
  };
}
