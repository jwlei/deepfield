/**
 * Release notes shown behind the version badge. Source language is English, like every other
 * display string; entries are translated through the dictionary (`text` fields are collected by
 * scripts/i18n-check.mjs). Newest first.
 */
export interface Release {
  version: string;
  /** ISO date of the release (a range for the early ones) */
  date: string;
  /** one-line theme of the release */
  title: string;
  items: Array<{ text: string }>;
}

export const CURRENT_VERSION = '0.9.4';

export const CHANGELOG: Release[] = [
  {
    version: '0.9.4', date: '2026-11-15', title: 'A multiplayer universe, peculiar galaxies and ringed worlds',
    items: [
      { text: 'Multiplayer: explore the same universe together with your friends; a list of open rooms, password-protected rooms, room codes and invite links; up to 16 people in a room' },
      { text: 'Astronauts: pick one of eight characters (Finn the frog, Barbara the bee, Fernando the flamingo, Nova, Rae the red panda and their mech versions); they fly with a jetpack, carry your name, wave and jump' },
      { text: 'Exploring together: chat, sharing discoveries with a screenshot, following someone or teleporting to them, a vote to call everyone to where you are; everyone in a room shares the same clock' },
      { text: 'Game modes: Free, Treasure hunt (the same target for everyone, the first to find it scores) and Hide and seek (one hides, the others search with hot/cold hints)' },
      { text: 'Peculiar galaxies, drawn by hand: Hoag\'s Object, the Cartwheel, Lindsay-Shapley, Arp 147, NGC 922, the polar-ring galaxies NGC 4650A and NGC 660, the Mice, the Antennae, the Tadpole, the Rose (Arp 273), NGC 2207 and IC 2163, the Penguin and the Egg, Atoms for Peace and the Integral Sign. Rings, tidal tails and warped discs look the same from afar and up close' },
      { text: 'Hoag\'s Object\'s ring is made of tightly wound blue strands and star-forming knots; a faint, reddish inner ring sits in the gap' },
      { text: 'Rings on every kind of planet: giants, ice giants, sub-Neptunes, debris rings round rocky worlds and rings round icy dwarfs; the real rings of Haumea and Quaoar. Dusty rings light up when seen against the Sun' },
      { text: 'Finer weather on gas giants: hot spots and festoons along the edge of the equatorial zone, strings of white ovals, clusters of cyclones round the poles' },
      { text: 'Generated nebulae take their colour from physics: excitation, metallicity, dust scattering, the type of star and the class of remnant; the colour in their name matches their tint' },
      { text: 'System strip: the system\'s stars, planets and moons as small icons along the right edge' },
      { text: 'Object size setting: planets, moons, asteroids and belt particles can be enlarged up to 10x; a hint points to the setting when you enter free roam' },
      { text: 'Community: Discord, YouTube and Reddit in the About card and on the last page of the welcome' },
      { text: 'Fixes: galaxies in clusters no longer vanish as you approach; dry worlds no longer look black in some browsers; stars no longer streak while turning around a body' },
    ],
  },
  {
    version: '0.9.3', date: '2026-11-11', title: 'Turning black-hole discs, the telescope view and new worlds',
    items: [
      { text: 'Black holes: the accretion discs now turn; the gas flows faster at the inner edge, heavier holes turn more slowly and the disc follows the simulation clock. Thin bright filaments of gas; white-hot inside, red outside, bluer and brighter on the side coming towards us' },
      { text: 'Star trails: the stars stretch into streaks when you fly fast between them; can be switched off in the settings' },
      { text: 'Star size setting: the stars of the sky can be drawn up to 3 times larger' },
      { text: 'Telescope view: how the selection looks from Earth through binoculars, amateur and smart telescopes, Hubble and JWST, and radio telescopes; filters, eyepieces, exposure time, radio bands and VLA configurations. In the info card and the encyclopedia' },
      { text: 'Twelve new kinds of planet: jungle, sand sea, salt, toxic, geothermal, Titan-like, iron, chthonian, lava eye, hycean, super-puff and hot Neptune' },
      { text: 'Gas giants: colours, belts, storms and polar hoods of its own for each; the night side of the hottest glows like embers' },
      { text: 'Geology of its own for every world: rift valleys, shield volcanoes, polar caps and cracks in the ice; new kinds of rock on the landing grounds and haze on the horizon' },
      { text: 'Maps of their own for the famous exoplanets; HD 189733 b with its cobalt-blue haze and wind-sheared clouds' },
      { text: 'Nebulae and clusters look the same from afar and close up; generated nebulae no longer vanish on the approach' },
      { text: 'Events: every event narrated in five languages; the penumbral lunar eclipse of 2027 and the total solar eclipse lasting over six minutes at Luxor added' },
      { text: 'Colourful white dwarfs: the green star WD J1330+6435 and six like it (Hollands et al. 2026)' },
      { text: 'The Moon follows the JPL Horizons ephemeris and sits on its drawn orbit; every comet keeps a faint tail far from the Sun; Jupiter\'s Great Red Spot is back' },
      { text: 'Phones: a two-row top bar and a landscape layout; they start at the highest graphics level and drop to Low if the first seconds stutter' },
    ],
  },
  {
    version: '0.9.2', date: '2026-11-07', title: 'The encyclopedia and cinematic tours',
    items: [
      { text: 'Encyclopedia: tens of thousands of pages in five languages on stars, exoplanets, constellations, deep sky, galaxies, black holes, the Solar System and sky events; every page opens in the simulation' },
      { text: 'An A–Z index and a search over the whole encyclopedia' },
      { text: 'From the simulation to the encyclopedia: a book button in the top bar, a link in the About card and "Read in the encyclopedia" under every selection that has a page' },
      { text: 'Sky locator map: where each object sits on the sky, the whole sky and a view of the galaxy from above; the Embed button puts it on other websites' },
      { text: 'Tours: Carl Sagan–style openings and closings for every tour, cinematic camera moves and date cards; narrated again in five languages' },
      { text: 'Landings in the tours: some scenes now stand on a world and look up at its sky' },
      { text: 'Welcome: the same scene on every first visit; real Moon and Io textures' },
      { text: 'Support: choose between GitHub Sponsors and Buy Me a Coffee' },
      { text: 'Windows: shaders compile in the background, so the page no longer freezes at the start or on landing; markers blinking while dragging and the flicker in Opera GX fixed' },
      { text: 'Fix: the black rectangle in the Exoplanets tour' },
    ],
  },
  {
    version: '0.9.1', date: '2026-11-05', title: 'Real catalogues, a first-visit welcome and exoplanets',
    items: [
      { text: 'Real catalogues: main belt, near-Earth asteroids, Trojans, outer bodies and comets from the JPL small-body database; deep-sky survey objects, exoplanet systems on measured orbits, brown dwarfs and binaries; UNGC and 2MRS galaxies' },
      { text: 'First-visit welcome: five chapters over live shots (Saturn spinning at 600×, earthrise, Io before Jupiter, the Sun); shown only once' },
      { text: 'Smoother start: the welcome shots are visited behind the loading screen so shaders compile and surfaces bake ahead of time; star catalogues are parsed in a background thread and uploaded in slices' },
      { text: 'Planet surfaces are baked into cube maps: richer rocky and gas-giant models, eye adaptation (auto exposure), light shafts and nebula profiles' },
      { text: 'New tour: Exoplanets — eleven stops from 51 Pegasi b to TRAPPIST-1, narrated in five languages, with images' },
      { text: 'Asteroid and Kuiper belts are off by default; they can be switched on in the settings' },
      { text: 'Fix: a member galaxy of a far cluster vanished as you approached it' },
    ],
  },
  {
    version: '0.8', date: '2026-10-30', title: 'Streamer Mode: a space expedition together with your viewers',
    items: [
      { text: 'Streamer Mode (youreyesinspace.com/?stream): the streamer picks the route, viewers join from their phones via a QR code and answer the Knowledge Gate questions along the way together' },
      { text: 'Viewers can also answer and vote by typing A, B, C or D in the stream chat' },
      { text: 'Random space events on the way: the crew votes, and the outcome changes the hull, the answer time or the points multiplier; every chapter ends with a tough boss question' },
      { text: 'Scoring, ranks and votes run on the server: thousands of viewers can join one stream; phones join through bot protection' },
      { text: 'Voiced narrator, sound effects and a live leaderboard' },
      { text: 'Comet dust tails look softer and more natural' },
    ],
  },
  {
    version: '0.7', date: '2026-10-28', title: 'Surface landings, volumetric galaxies, a universe that invites exploration',
    items: [
      { text: 'Land on rocky planets: the surface and sky are generated as you touch down; scrub time to watch the sky, take off and control your altitude' },
      { text: 'Water, ice, volcanoes and gas vents on planetary surfaces; realistic dust and ion tails on comets' },
      { text: 'Volumetric galaxies and nebulae: dust lanes and glowing gas are raymarched' },
      { text: 'Every nearby star and planet is clickable; cluster stars can be selected and a discovery counter points to the next find' },
      { text: 'Binary and multiple star systems with scientifically consistent rarity; richer procedural objects in other galaxies' },
      { text: 'Clusters resolve into individual stars; fixed the glare at galaxy centres and planets that were too faint from afar' },
      { text: 'Clean view (N) hides every marker and name; a setting for star glare (lens flare)' },
      { text: 'Graphics levels: lowest, medium, highest; phones start at lowest, computers at highest' },
      { text: 'Fewer hitches when flying fast through crowded galaxies and volumetric clouds' },
      { text: 'Solar System tour: over-the-shoulder shots, Olympus Mons from real elevation data, a camera that looks down while descending to Mars, and Saturn\'s polar hexagon' },
    ],
  },
  {
    version: '0.6', date: '2026-10-24', title: 'Sky events, the surface of Mars, a quieter sky',
    items: [
      { text: 'Events panel: upcoming flybys, conjunctions, meteor showers, eclipses and mission milestones; each plays as a narrated, cinematic scene, with a countdown in the top bar' },
      { text: 'JPL Horizons ephemerides: BepiColombo, Europa Clipper and Hera fly on real trajectory tables, with their trails drawn in the scene' },
      { text: 'Meteor showers: streams entering the atmosphere from the radiant, fireballs and a viewing spot over the night side' },
      { text: 'Real Martian terrain around Perseverance and Curiosity: a five-ring elevation map from HiRISE, CTX and HRSC+MOLA data, with NASA rover panoramas on the horizon' },
      { text: 'Embeddable view and share links for event scenes; a visit counter on the About card' },
      { text: 'Settings: switches to hide dwarf planets, asteroids and comets, and human-made objects' },
      { text: 'Tours: only the bodies being narrated are labelled, the background stays quiet; the black-hole tour now shows the companion stars and the S-star orbits' },
      { text: 'Render resolution goes down to 0.25× and drops on its own when the frame rate stutters (automatic resolution)' },
      { text: 'Academy: chapters on the Sun, the interstellar medium and star formation, main-sequence and later evolution (11–13)' },
      { text: 'Boulders when flying through ring systems; an option to light the night side when close' },
      { text: 'Source code licensed under AGPL-3.0; a separate content licence for tours, lessons and narration' },
    ],
  },
  {
    version: '0.5', date: '2026-10-20', title: 'The Academy grows, the sky gets easier to read',
    items: [
      { text: 'Academy chapters 4–10: special relativity, light and matter, telescopes, binary stars, spectral classification, stellar atmospheres and interiors' },
      { text: 'The dwarf planets Sedna, Gonggong, Quaoar and Orcus' },
      { text: 'A Sun marker and off-screen compass once you leave the Sun behind; optional distances in labels' },
      { text: 'Every label is clickable: star, galaxy, nebula, black hole and body names select their object' },
      { text: 'A switch, green highlight and name options for procedural objects' },
      { text: 'Living stellar photospheres (granulation, spots, limb darkening) and coronae' },
    ],
  },
  {
    version: '0.4', date: '2026-10-13', title: 'The Academy opens',
    items: [
      { text: 'Academy: chapter-by-chapter astrophysics lessons with formulas, small interactive experiments, scene cues and a narrating lecturer (chapters 1–3)' },
      { text: 'Backlit close-ups with the Sun over the limb in tours, shadow-free fill light, the circling Solar System as the opening view' },
    ],
  },
  {
    version: '0.3', date: '2026-10-09', title: 'Tours rebuilt',
    items: [
      { text: 'Guided tours on a new cue set: true-scale comparisons, photo and trivia cards, cloud-layer fades, vantage points, a pulse of light; narration in five languages' },
      { text: 'Nebulae as three-dimensional point clouds derived from photographs' },
      { text: 'Realistic shapes for small bodies; NASA Treks imagery for fifteen bodies' },
    ],
  },
  {
    version: '0.1 – 0.2', date: '2026-09-29', title: 'First releases',
    items: [
      { text: 'A log-depth Solar System, Keplerian orbits, streamed NASA satellite imagery' },
      { text: 'Real black holes with gravitational lensing, nine pulsar systems, deep-sky landmarks in the Milky Way and nearby galaxies' },
      { text: 'Mission planner: Lambert/Hohmann and slingshot routes, real and science-fiction craft' },
      { text: 'Five languages, touch and phone support, the first narrated tours' },
    ],
  },
];
