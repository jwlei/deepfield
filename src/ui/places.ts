/**
 * "Görmeye değecek yerler" – curated destinations for the topbar dropdown.
 * body: Solar-System body id · star: HYG proper name (resolved through the catalogue search)
 * galaxy: substring of the galaxy catalogue name · index 0 = Milky Way overview.
 * blackhole: universal black-hole id (see data/blackholes.ts) · landmark: id from data/landmarks.ts.
 * exoplanet: planet name as in the NASA Exoplanet Archive.
 */
export interface Place {
  label: string;
  kind: 'body' | 'star' | 'galaxy' | 'blackhole' | 'landmark' | 'exoplanet';
  ref: string;
  note?: string;
}

export interface PlaceGroup {
  title: string;
  items: Place[];
}

export const PLACES: PlaceGroup[] = [
  {
    title: 'Spacecraft',
    items: [
      { label: 'Voyager 1', kind: 'body', ref: 'voyager1', note: 'The most distant human-made object' },
      { label: 'Voyager 2', kind: 'body', ref: 'voyager2', note: 'Interstellar space' },
      { label: 'Pioneer 10', kind: 'body', ref: 'pioneer10', note: 'Silent, heading towards Aldebaran' },
      { label: 'Pioneer 11', kind: 'body', ref: 'pioneer11', note: 'First spacecraft to reach Saturn' },
      { label: 'New Horizons', kind: 'body', ref: 'newhorizons', note: 'Kuiper Belt' },
      { label: 'Parker Solar Probe', kind: 'body', ref: 'parker', note: 'Solar corona' },
      { label: 'James Webb (JWST)', kind: 'body', ref: 'jwst', note: 'Sun–Earth L2' },
      { label: 'Hubble', kind: 'body', ref: 'hubble', note: 'Low Earth orbit' },
      { label: 'ISS – International Space Station', kind: 'body', ref: 'iss', note: '~420 km altitude' },
      { label: 'Juno', kind: 'body', ref: 'juno', note: 'Jupiter polar orbit' },
      { label: 'Perseverance', kind: 'body', ref: 'perseverance', note: 'Mars – Jezero Crater' },
      { label: 'Curiosity', kind: 'body', ref: 'curiosity', note: 'Mars – Gale Crater' },
    ],
  },
  {
    title: 'Black holes',
    items: [
      { label: 'Sagittarius A*', kind: 'blackhole', ref: 'b0', note: 'Milky Way centre · 4.3 million M☉' },
      { label: 'Cygnus X-1', kind: 'blackhole', ref: 'cygx1', note: 'First black hole discovered' },
      { label: 'Gaia BH1', kind: 'blackhole', ref: 'b2', note: 'Nearest known · dormant' },
      { label: 'V404 Cygni', kind: 'blackhole', ref: 'b3', note: 'X-ray nova' },
      { label: 'A0620-00', kind: 'blackhole', ref: 'b4', note: 'Quiet binary in Monoceros' },
      { label: 'M87*', kind: 'blackhole', ref: 'b1', note: 'First imaged · 6.5 billion M☉' },
      { label: 'M31*', kind: 'blackhole', ref: 'm31star', note: 'Andromeda centre · 140 million M☉' },
      { label: 'LMC X-1', kind: 'blackhole', ref: 'lmcx1', note: 'Large Magellanic Cloud' },
      { label: 'M33 X-7', kind: 'blackhole', ref: 'm33x7', note: 'Triangulum Galaxy · eclipsing' },
      { label: 'Centaurus A*', kind: 'blackhole', ref: 'cenastar', note: 'Nearest active nucleus' }
    ],
  },
  {
    title: 'Pulsars',
    items: [
      { label: 'Crab Pulsar', kind: 'landmark', ref: 'l-crabpsr', note: 'Supernova of 1054 · 30 Hz' },
      { label: 'Vela Pulsar', kind: 'landmark', ref: 'l-vela', note: 'Glitching pulsar' },
      { label: 'PSR B1919+21', kind: 'landmark', ref: 'l-b1919', note: 'First pulsar · Bell Burnell, 1967' },
      { label: 'PSR B1257+12 (Lich)', kind: 'landmark', ref: 'l-lich', note: 'First exoplanets' },
      { label: 'PSR J1748-2446ad', kind: 'landmark', ref: 'l-j1748', note: 'Fastest · 716 Hz' },
      { label: 'Hulse–Taylor Binary', kind: 'landmark', ref: 'l-hulsetaylor', note: 'Gravitational-wave evidence' },
      { label: 'Geminga', kind: 'landmark', ref: 'l-geminga', note: 'Radio-quiet gamma-ray pulsar' },
      { label: 'PSR J0437-4715', kind: 'landmark', ref: 'l-j0437', note: 'Nearest millisecond pulsar' },
      { label: 'SGR 1806−20', kind: 'landmark', ref: 'l-sgr1806', note: 'Magnetar · 2004 giant flare' },
    ],
  },
  {
    title: 'Nebulae, clusters and record stars',
    items: [
      { label: 'Orion Nebula (M42)', kind: 'landmark', ref: 'l-m42', note: 'Nearest star factory' },
      { label: 'Pleiades', kind: 'landmark', ref: 'l-pleiades', note: 'The Seven Sisters' },
      { label: 'Carina Nebula', kind: 'landmark', ref: 'l-carina', note: 'Home of Eta Carinae' },
      { label: 'Crab Nebula (M1)', kind: 'landmark', ref: 'l-m1', note: 'Supernova of 1054' },
      { label: 'Omega Centauri', kind: 'landmark', ref: 'l-omegacen', note: 'Largest globular cluster' },
      { label: 'Tarantula Nebula', kind: 'landmark', ref: 'l-30dor', note: 'Large Magellanic Cloud' },
      { label: 'R136a1', kind: 'landmark', ref: 'l-r136a1', note: 'Most massive star known' },
      { label: 'SN 1987A', kind: 'landmark', ref: 'l-sn1987a', note: 'Large Magellanic Cloud' },
      { label: 'Mayall II (G1)', kind: 'landmark', ref: 'l-g1', note: 'Andromeda · giant globular cluster' },
      { label: 'Hubble\'s Cepheid V1', kind: 'landmark', ref: 'l-m31v1', note: 'Andromeda · 1923' },
      { label: 'NGC 604', kind: 'landmark', ref: 'l-ngc604', note: 'Triangulum Galaxy' },
    ],
  },
  {
    title: 'Planets and moons',
    items: [
      { label: 'Earth', kind: 'body', ref: 'earth' },
      { label: 'Moon', kind: 'body', ref: 'moon' },
      { label: 'Mars', kind: 'body', ref: 'mars' },
      { label: 'Jupiter', kind: 'body', ref: 'jupiter', note: 'Great Red Spot' },
      { label: 'Europa', kind: 'body', ref: 'europa', note: 'Ocean under an ice shell' },
      { label: 'Io', kind: 'body', ref: 'io', note: 'Volcanic moon' },
      { label: 'Saturn', kind: 'body', ref: 'saturn', note: 'Rings' },
      { label: 'Titan', kind: 'body', ref: 'titan', note: 'Methane lakes, dense atmosphere' },
      { label: 'Enceladus', kind: 'body', ref: 'enceladus', note: 'Ice geysers' },
      { label: 'Uranus', kind: 'body', ref: 'uranus', note: 'Planet on its side' },
      { label: 'Neptune', kind: 'body', ref: 'neptune' },
      { label: 'Triton', kind: 'body', ref: 'triton', note: 'Retrograde moon' },
      { label: 'Pluto', kind: 'body', ref: 'pluto' },
      { label: 'Sun', kind: 'body', ref: 'sun' },
      { label: '1P/Halley', kind: 'body', ref: 'halley', note: 'Comet' },
    ],
  },
  {
    title: 'Exoplanets',
    items: [
      { label: 'Proxima Centauri b', kind: 'exoplanet', ref: 'Proxima Cen b', note: 'Nearest exoplanet · in the habitable zone' },
      { label: 'TRAPPIST-1 e', kind: 'exoplanet', ref: 'TRAPPIST-1 e', note: 'One of seven Earth-sized planets' },
      { label: '51 Pegasi b', kind: 'exoplanet', ref: '51 Peg b', note: 'First found around a Sun-like star, 1995' },
      { label: 'HD 209458 b', kind: 'exoplanet', ref: 'HD 209458 b', note: 'First planet seen in transit' },
      { label: 'HD 189733 b', kind: 'exoplanet', ref: 'HD 189733 b', note: 'Azure hot Jupiter' },
      { label: '55 Cancri e', kind: 'exoplanet', ref: '55 Cnc e', note: 'Super-Earth with a magma ocean' },
      { label: 'Kepler-186 f', kind: 'exoplanet', ref: 'Kepler-186 f', note: 'Earth-sized, in the habitable zone' },
      { label: 'K2-18 b', kind: 'exoplanet', ref: 'K2-18 b', note: 'Mini-Neptune with methane and CO₂' },
      { label: 'LHS 3844 b', kind: 'exoplanet', ref: 'LHS 3844 b', note: 'Bare rock without an atmosphere' },
      { label: 'KELT-9 b', kind: 'exoplanet', ref: 'KELT-9 b', note: 'Hottest known gas giant' },
      { label: 'Beta Pictoris b', kind: 'exoplanet', ref: 'bet Pic b', note: 'Directly imaged young giant' },
      { label: 'HR 8799 e', kind: 'exoplanet', ref: 'HR 8799 e', note: 'Photographed four-planet system' },
    ],
  },
  {
    title: 'Stars',
    items: [
      { label: 'Proxima Centauri', kind: 'star', ref: 'Proxima Centauri', note: 'Nearest star – 4.2 ly' },
      { label: 'Alpha Centauri (Rigil Kentaurus)', kind: 'star', ref: 'Rigil Kentaurus', note: 'Triple system – 4.4 ly' },
      { label: 'Sirius', kind: 'star', ref: 'Sirius', note: 'The brightest star in the sky' },
      { label: 'Vega', kind: 'star', ref: 'Vega' },
      { label: 'Betelgeuse', kind: 'star', ref: 'Betelgeuse', note: 'Red supergiant' },
      { label: 'Rigel', kind: 'star', ref: 'Rigel', note: 'Blue supergiant' },
      { label: 'Polaris', kind: 'star', ref: 'Polaris', note: 'Pole Star' },
      { label: 'Aldebaran', kind: 'star', ref: 'Aldebaran' },
      { label: 'Antares', kind: 'star', ref: 'Antares' },
      { label: 'Deneb', kind: 'star', ref: 'Deneb', note: '~2,600 ly away' },
      { label: 'Green star (WD J1330+6435)', kind: 'star', ref: 'WD J1330+6435', note: 'The first known green star – 280 ly' },
      { label: 'Pink white dwarf (LHS 2229)', kind: 'star', ref: 'WD J1011+2845', note: 'The reddest star by perceived colour' },
      { label: 'Blue white dwarf (WD J2356−2054)', kind: 'star', ref: 'WD J2356−2054', note: '4000 K, yet vivid blue' },
    ],
  },
  {
    title: 'Galaxies',
    items: [
      { label: 'Milky Way (from outside)', kind: 'galaxy', ref: '#0', note: 'Overview of our galaxy' },
      { label: 'Large Magellanic Cloud', kind: 'galaxy', ref: 'Large Magellanic' },
      { label: 'Small Magellanic Cloud', kind: 'galaxy', ref: 'Small Magellanic' },
      { label: 'Andromeda (M31)', kind: 'galaxy', ref: 'Andromeda' },
      { label: 'Triangulum (M33)', kind: 'galaxy', ref: 'Triangulum' },
      { label: 'Centaurus A', kind: 'galaxy', ref: 'Centaurus A' },
      { label: 'Whirlpool (M51)', kind: 'galaxy', ref: 'Whirlpool' },
      { label: 'Pinwheel (M101)', kind: 'galaxy', ref: 'Pinwheel (M101)' },
      { label: 'Sombrero (M104)', kind: 'galaxy', ref: 'Sombrero' },
      { label: 'Virgo A (M87)', kind: 'galaxy', ref: 'M87', note: 'The first black hole ever imaged' },
    ],
  },
  {
    title: 'Peculiar galaxies',
    items: [
      { label: 'Hoag\'s Object', kind: 'galaxy', ref: 'Hoag', note: 'A perfect ring' },
      { label: 'Cartwheel Galaxy (ESO 350-40)', kind: 'galaxy', ref: 'Cartwheel', note: 'Collisional ring' },
      { label: 'Lindsay-Shapley Ring (AM 0644-741)', kind: 'galaxy', ref: 'Lindsay-Shapley', note: 'Collisional ring' },
      { label: 'Arp 147 (ring)', kind: 'galaxy', ref: 'Arp 147 (ring)', note: 'Collisional ring' },
      { label: 'NGC 922', kind: 'galaxy', ref: 'NGC 922', note: 'Collisional ring' },
      { label: 'NGC 4650A', kind: 'galaxy', ref: 'NGC 4650A', note: 'Polar ring' },
      { label: 'NGC 660', kind: 'galaxy', ref: 'NGC 660', note: 'Polar ring' },
      { label: 'Antennae', kind: 'galaxy', ref: 'Antennae', note: 'Merging galaxies' },
      { label: 'The Mice', kind: 'galaxy', ref: 'The Mice', note: 'Tidal tails' },
      { label: 'Tadpole (UGC 10214)', kind: 'galaxy', ref: 'Tadpole', note: 'Tidal tail' },
      { label: 'Rose (Arp 273)', kind: 'galaxy', ref: 'Rose (Arp 273', note: 'Interacting pair' },
      { label: 'NGC 2207 and IC 2163', kind: 'galaxy', ref: 'NGC 2207', note: 'Interacting pair' },
      { label: 'Penguin and Egg (Arp 142)', kind: 'galaxy', ref: 'Penguin', note: 'Interacting pair' },
      { label: 'Atoms for Peace (NGC 7252)', kind: 'galaxy', ref: 'Atoms for Peace', note: 'Merger remnant' },
      { label: 'Integral Sign (UGC 3697)', kind: 'galaxy', ref: 'Integral Sign', note: 'Warped disc' },
    ],
  },
];
