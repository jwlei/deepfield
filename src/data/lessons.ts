/**
 * Academy — course content.
 *
 * A course is chapters → sections → steps. A step is one "slide" of a lesson: a few content
 * blocks (prose, formulas, callouts, tables…), optionally an interactive widget rendered inside
 * the panel, and optionally scene cues that move the 3-D universe behind it. Content is English.
 */

export type Block =
  /** paragraph; may contain inline HTML (<em>, <b>, <sub>, <sup>) and inline formulas via $…$ */
  | { kind: 'p'; html: string }
  /** display formula (LaTeX subset, see ui/lessons/math.ts) with an optional caption */
  | { kind: 'eq'; tex: string; note?: string; label?: string }
  /** highlighted aside */
  | { kind: 'callout'; tone: 'key' | 'think' | 'history' | 'note' | 'example'; title?: string; html: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /** term → definition pairs */
  | { kind: 'terms'; items: Array<[string, string]> }
  | { kind: 'timeline'; items: Array<{ when: string; title: string; text: string }> }
  | { kind: 'table'; head: string[]; rows: string[][]; caption?: string }
  /** two-column comparison */
  | { kind: 'compare'; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  /** closing summary */
  | { kind: 'summary'; items: string[] }
  | { kind: 'figure'; image: string; caption: string; source?: string };

export type WidgetSpec =
  /** the naked-eye sky from an ancient city: fixed stars turning, the Moon's phases, the five wanderers along the ecliptic */
  | { type: 'ancientsky' }
  /** retrograde motion: Ptolemy's epicycles vs Copernicus' heliocentric orbits, same sky */
  | { type: 'models'; mode: 'ptolemy' | 'copernicus'; lock?: boolean }
  /** Eudoxus' two nested spheres tracing the hippopede */
  | { type: 'eudoxus' }
  /** sidereal vs synodic period */
  | { type: 'synodic' }
  /** celestial sphere: horizon system, diurnal motion, equatorial coordinates */
  | { type: 'sphere'; mode: 'altaz' | 'diurnal' | 'equatorial' }
  /** precession of the celestial pole around the ecliptic pole */
  | { type: 'precession' }
  /** electromagnetic spectrum with telescopes and atmospheric windows */
  | { type: 'spectrum' }
  /** ellipse geometry (foci, a, b, e, r(θ)); `conics` extends e past 1 to parabola/hyperbola */
  | { type: 'ellipse'; conics?: boolean }
  /** Kepler's second law: equal areas in equal times */
  | { type: 'kepler2' }
  /** Kepler's third law: log–log plot of P against a with the real planets */
  | { type: 'kepler3' }
  /** Newton's cannonball: launch speed → sub-orbital, circular, elliptical, escape */
  | { type: 'cannon' }
  /** two bodies orbiting their centre of mass; mass ratio presets */
  | { type: 'twobody' }
  /** kinetic, potential and total energy along an orbit with running time averages */
  | { type: 'virial' }
  /** stellar parallax: Earth's orbit, the line of sight and the yearly shift against background stars */
  | { type: 'parallax' }
  /** the magnitude scale: two markers on a −27…+31 ruler and the brightness ratio between them */
  | { type: 'magnitude' }
  /** inverse-square law and the distance modulus: move a star of given M and watch m change */
  | { type: 'distmod' }
  /** Young's double slit: wavefronts from two slits and the interference pattern on a screen */
  | { type: 'doubleslit' }
  /** an electromagnetic wave: E and B fields in phase, perpendicular, moving at c */
  | { type: 'emwave' }
  /** Planck curves against wavelength; `mode: 'catastrophe'` overlays Rayleigh–Jeans and Wien approximations */
  | { type: 'blackbody'; mode?: 'planck' | 'catastrophe' }
  /** Stefan–Boltzmann: luminosity from radius and temperature, with real-star presets */
  | { type: 'lrt' }
  /** Planck's quantum ladder: an oscillator's allowed energies nhν and their Boltzmann occupation at T */
  | { type: 'quantum' }
  /** UBV filters over a blackbody spectrum → B−V, U−B and the colour–colour diagram */
  | { type: 'colorindex' }
  /** Michelson–Morley interferometer: ether-wind prediction vs the observed null result */
  | { type: 'michelson' }
  /** Galilean vs relativistic velocity addition */
  | { type: 'velocityadd' }
  /** Minkowski spacetime diagram with a boosted frame and a draggable event */
  | { type: 'minkowski' }
  /** Einstein's train: two lightning strikes, two observers, relativity of simultaneity */
  | { type: 'train' }
  /** two light clocks, one at rest and one moving: time dilation */
  | { type: 'lightclock' }
  /** cosmic-ray muons reaching the ground: classical vs relativistic survival */
  | { type: 'muon' }
  /** relativistic momentum, kinetic energy, γ against β; the energy–momentum triangle */
  | { type: 'relenergy' }
  /** the solar spectrum with Fraunhofer's dark lines; drag a cursor to identify them, zoom in */
  | { type: 'fraunhofer' }
  /** Kirchhoff's laws: a lamp, a gas cloud and a draggable observer — continuous, emission or absorption */
  | { type: 'kirchhoff' }
  /** identify-the-element game: match a mystery emission spectrum to a reference */
  | { type: 'elementid' }
  /** Doppler shift of spectral lines: a moving source, its wavefronts and the shifted spectrum */
  | { type: 'dopplerlines' }
  /** a spectroscopic binary: two stars orbiting, their lines splitting and merging */
  | { type: 'specbinary' }
  /** the photoelectric effect: wavelength, intensity, metal, retarding voltage → K_max and current */
  | { type: 'photoelectric' }
  /** a photon across the spectrum: energy, frequency, momentum, equivalent temperature, what it does to matter */
  | { type: 'photonscale' }
  /** Compton scattering: drag the scattering angle, see Δλ and the recoil electron */
  | { type: 'compton' }
  /** Rutherford's gold foil: Thomson vs nuclear atom, α trajectories and the scattering histogram */
  | { type: 'rutherford' }
  /** hydrogen series (Lyman, Balmer, Paschen, Brackett) on a wavelength axis; click a line for its transition */
  | { type: 'series' }
  /** Bohr's atom: click energy levels to make the electron jump and emit or absorb a photon */
  | { type: 'bohr' }
  /** hydrogen-like ions: nuclear charge Z and reduced mass rescale the ladder */
  | { type: 'hydrogenic' }
  /** de Broglie standing waves around a Bohr orbit; integer n fits, fractional n cancels */
  | { type: 'matterwave' }
  /** hydrogen orbitals |ψ|² for (n, l, m) with the radial probability and the Bohr radius */
  | { type: 'orbitals' }
  /** a wave packet: position spread against momentum spread, Δx·Δp */
  | { type: 'wavepacket' }
  /** Pauli's exclusion principle builds the periodic table: fill shells electron by electron */
  | { type: 'pauli' }
  /** the light bucket: aperture, exposure and magnitude → photons collected and a simulated star field */
  | { type: 'lightbucket' }
  /** Snell's law: drag the incident ray; media, wavelength (dispersion), total internal reflection */
  | { type: 'snell' }
  /** thin lens / concave mirror ray diagram: object distance, focal length, image and magnification */
  | { type: 'lens' }
  /** Airy pattern of a circular aperture; two stars and the Rayleigh criterion */
  | { type: 'airy' }
  /** atmospheric seeing: speckles, long-exposure blur, adaptive optics */
  | { type: 'seeing' }
  /** chromatic aberration of a single lens and its cure, the achromatic doublet */
  | { type: 'chromatic' }
  /** reflecting telescope designs: prime, Newtonian, Cassegrain, Gregorian, Schmidt — ray paths */
  | { type: 'designs' }
  /** focal length, plate scale, field of view and magnification on real targets */
  | { type: 'platescale' }
  /** compare two telescopes: aperture to scale, light grasp, limiting magnitude, resolution */
  | { type: 'scopes' }
  /** alt-azimuth vs equatorial mounts: tracking a star and field rotation */
  | { type: 'mount' }
  /** Jansky's antenna: a signal that peaks 4 minutes earlier each day — the sidereal clue */
  | { type: 'jansky' }
  /** a radio dish: wavefronts to the feed, beam pattern, half-power beam width, flux density in janskys */
  | { type: 'dish' }
  /** two-element interferometer: baseline, fringes, synthesized resolution, Earth-rotation uv coverage */
  | { type: 'interferometer' }
  /** atmospheric transmission against wavelength at different altitudes */
  | { type: 'atmwindow' }
  /** infrared: the glow of a warm telescope against a cold target; cooling */
  | { type: 'irthermal' }
  /** grazing-incidence X-ray mirrors: reflectivity against angle and energy, nested Wolter shells */
  | { type: 'grazing' }
  /** gamma-ray detection: coded mask, Compton telescope, pair conversion, Cherenkov air shower */
  | { type: 'gammadetect' }
  /** the same galaxy seen in radio, infrared, optical, ultraviolet, X-ray and gamma rays */
  | { type: 'multiview' }
  /** all-sky maps in galactic coordinates across the spectrum (Mollweide) */
  | { type: 'skymap' }
  /** survey data volumes against time, and the time to move them */
  | { type: 'datagrowth' }
  /** cross-matching two catalogues: match radius, true pairs and false matches */
  | { type: 'crossmatch' }
  /** optical double vs bound pair: forty years of positions — two straight proper-motion tracks or a shared drift with an orbit */
  | { type: 'doubletest' }
  /** a visual binary's apparent orbit: ρ, θ measurements accumulating (observe) or true vs projected ellipse with the displaced focus (deproject) */
  | { type: 'visualorbit'; mode: 'observe' | 'deproject' }
  /** astrometric binary: the proper-motion path of a visible star wobbling about an unseen companion */
  | { type: 'astrometric' }
  /** sorting game: image, light curve, spectrum or proper-motion track → which class of binary */
  | { type: 'binaryclassify' }
  /** both stars tracked against the background: the centre-of-mass line and the ratio of the two orbits */
  | { type: 'massratio' }
  /** m₁ + m₂ = α³/(p³P²): sliders for angular semi-major axis, parallax, period and ratio with error propagation; real presets */
  | { type: 'binarymass' }
  /** mass–luminosity diagram of real binaries with an adjustable power-law fit */
  | { type: 'massluminosity' }
  /** radial-velocity curve shape against eccentricity and argument of periastron, with the orbit */
  | { type: 'rvshape' }
  /** the mass function: P and K₁ fixed, inclination and primary mass varied → companion mass */
  | { type: 'massfunction' }
  /** eclipsing binary: two stars, inclination and light curve (animate) or contacts, timings and depths → radii and temperature ratio (measure) */
  | { type: 'eclipse'; mode: 'animate' | 'measure' }
  /** Algol, β Lyrae and W UMa light curves with the morphing geometry */
  | { type: 'lcgallery' }
  /** a star's reflex velocity from one planet, against the precision floors of successive spectrographs */
  | { type: 'planetrv' }
  /** a planetary transit: radius, distance, inclination → light curve, depth, duration, probability */
  | { type: 'transit' }
  /** the exoplanet population: mass against separation, coloured by discovery method, with each method's reach */
  | { type: 'methods' }
  /** mass–radius diagram with composition curves and a draggable test planet */
  | { type: 'density' }
  /** habitable zone around a chosen star, a planet placed in it, and the signals it would produce */
  | { type: 'habitable' }
  /** the Harvard sequence O5 → M8 as one slider: continuum colour and the strengths of H, He, Ca II, metal and TiO lines */
  | { type: 'spectralseq' }
  /** a planet's spectrum assembled from reflected sunlight (solar lines intact), the planet's reflectivity and molecular bands, and its own thermal emission */
  | { type: 'planetspectrum' }
  /** Boltzmann equation: populations of hydrogen's levels against temperature, with N₂/N₁ */
  | { type: 'boltzmann' }
  /** Saha equation: ionisation fraction of a chosen element against temperature at a chosen electron pressure */
  | { type: 'saha' }
  /** Boltzmann × Saha: the fraction of hydrogen in n = 2 against temperature, peaking at A0, with the spectral classes marked */
  | { type: 'balmerpeak' }
  /** spectra of an M dwarf, L, T and Y dwarfs and Jupiter side by side: TiO, hydrides, methane, ammonia */
  | { type: 'coolspectra' }
  /** the H–R diagram built star by star from real and field data, with switchable axes (spectral class / B−V / T against M_V / L) */
  | { type: 'hrbuild' }
  /** a main-sequence star of chosen mass: its place on the diagram, T, L, R, lifetime, drawn to scale */
  | { type: 'hrmass' }
  /** H–R diagram with lines of constant radius; drag a star and read its radius, shown against the Sun */
  | { type: 'hrradius' }
  /** the H–R diagram extended to brown dwarfs and the planets, with an age slider for the cooling objects */
  | { type: 'hrextended' }
  /** MK luminosity classes: a Balmer line's width against surface gravity, with the star's place on an inset diagram */
  | { type: 'luminosityclass' }
  /** spectroscopic parallax: classify a star's spectrum, choose the luminosity class, get a distance, compare with Gaia */
  | { type: 'specparallax' }
  /** Specific intensity vs flux: an observer backing away from a resolved star; surface brightness stays constant while flux falls as 1/r² */
  | { type: 'intensity' }
  /** Polar diagram of the intensity I(θ) at a chosen optical depth in an atmosphere, with the mean intensity ⟨I⟩ compared with the local Planck value */
  | { type: 'meanintensity' }
  /** Integrates I cos θ over the sphere for a user-shaped radiation field: isotropic gives zero flux, surface field gives πB */
  | { type: 'fluxcos' }
  /** Radiation pressure vs gravity on a dust grain near the Sun, and P_rad/P_gas in a star of chosen mass */
  | { type: 'radpressure' }
  /** Fits blackbodies to a stellar energy distribution in different ways: effective, colour and Balmer-jump temperatures disagree */
  | { type: 'colortemp' }
  /** A beam through a slab with adjustable density, opacity and thickness; transmitted fraction follows e^(−τ) */
  | { type: 'opticaldepth' }
  /** Sunset simulator: transmitted solar spectrum and disc colour vs zenith angle for Earth (Rayleigh λ⁻⁴) and Mars (dust) */
  | { type: 'sunset' }
  /** Opacity κ_λ against wavelength split into bound–free hydrogen, H⁻, free–free and electron scattering as T and ρ vary */
  | { type: 'opacitysources' }
  /** Rosseland mean opacity vs temperature for several densities: H⁻ rise, ionisation peak, Kramers T^−3.5 fall, scattering floor */
  | { type: 'rosseland' }
  /** Animated photon random walk; net displacement compared with ℓ√N over many trials and the escape time through the Sun */
  | { type: 'randomwalk' }
  /** Solar limb darkening: drag a cursor across the disc, see the slanted τ = 2/3 depth; 'eddington' mode overlays the gray-atmosphere prediction on measured profiles */
  | { type: 'limbdark'; mode: 'observe' | 'eddington' }
  /** Slab transfer solution I = I₀e^(−τ) + S(1 − e^(−τ)) with sliders for I₀, S and τ; shows emission vs absorption lines */
  | { type: 'transfer' }
  /** Thermalisation: mean intensity vs Planck function against depth for pure absorption and for scattering with destruction probability ε */
  | { type: 'thermalize' }
  /** Plane-parallel geometry: layers, a ray at angle θ, slant optical depth τ_v/μ and the depth where it reaches 2/3 */
  | { type: 'planeparallel' }
  /** Eddington gray-atmosphere T(τ) = T_eff(3/4(τ + 2/3))^(1/4) compared with an empirical solar model */
  | { type: 'grayatm' }
  /** Eddington–Barbier relation: user-shaped S(τ), escape-probability weighting for chosen μ, exact integral vs S(τ = μ) */
  | { type: 'barbier' }
  /** Anatomy of a line profile: core, wings, FWHM, equivalent width rectangle, formation depth across the profile */
  | { type: 'lineprofile' }
  /** Natural, Doppler and pressure broadening combined into a Voigt profile as temperature, pressure and turbulence change */
  | { type: 'broadening' }
  /** Rotational broadening: a disc colour-coded by line-of-sight velocity builds a flat-bottomed line profile; v sin i slider */
  | { type: 'rotation' }
  /** Curve of growth: equivalent width vs column density through the linear, saturated and damping regimes */
  | { type: 'curveofgrowth' }
  /** Solar photospheric abundances as a bar chart with the CI-chondrite values overlaid; X, Y, Z readout */
  | { type: 'abundances' }
  /** Hydrostatic balance: a shell inside a Sun-like star that can be dragged from centre to surface, with gravity and the two pressure forces drawn to scale and the P(r) curve */
  | { type: 'hydrostatic' }
  /** Central-pressure estimator GM²/R⁴ with central-condensation factors for the Sun, red dwarf, blue giant, white dwarf, Jupiter, Saturn, Earth, Moon */
  | { type: 'centralpressure' }
  /** Mass conservation: stacked shells for a chosen density profile; cumulative mass M_r and local gravity g(r) as the radius is dragged */
  | { type: 'massshells' }
  /** Mean molecular weight μ from X, Y, Z sliders and ionisation state, with the resulting ideal-gas pressure and particle count */
  | { type: 'meanmolecular' }
  /** Log–log plot of ideal-gas, radiation and degenerate electron pressure against density at a chosen temperature, with the Sun's centre, Sirius B and other objects marked */
  | { type: 'pressuremix' }
  /** Cold mass–radius curve from the Earth to the bottom of the main sequence showing the Jupiter-mass radius maximum, with planets, brown dwarfs and exoplanets placed */
  | { type: 'giantradius' }
  /** Kelvin–Helmholtz time calculator for any M, R, L, compared with geological and cluster ages and the nuclear time scale; presets for Sun, Jupiter, Saturn */
  | { type: 'khtimescale' }
  /** Binding energy per nucleon against mass number for the stable nuclei, hoverable, with the energy released by fusion steps highlighted */
  | { type: 'bindingenergy' }
  /** Gamow peak: Maxwell–Boltzmann tail × tunnelling probability for a chosen reaction and temperature, showing the peak energy and the steep T dependence of the rate */
  | { type: 'gamow' }
  /** Animated proton–proton chain with switchable PP I / II / III branches, per-step rates and energy tally, neutrino energies */
  | { type: 'ppchain' }
  /** Energy generation rate of pp, CNO and triple-alpha against temperature, with the central temperatures of real stars marked and the pp/CNO crossover */
  | { type: 'ppcno' }
  /** Radiative temperature gradient required for a given luminosity against opacity and density, with solar layers placed and the convection-zone boundary */
  | { type: 'radgradient' }
  /** Schwarzschild criterion: a bubble released in a layer whose temperature gradient the student sets, rising away or oscillating back; Earth's dry adiabatic lapse rate mode */
  | { type: 'convection' }
  /** Mixing-length estimates of convective velocity, temperature excess and superadiabaticity against depth in the solar convection zone; granulation cartoon */
  | { type: 'mixinglength' }
  /** Lane–Emden solver: density and mass profiles for polytropic index n, central condensation, with Jupiter (n = 1) and the Sun compared */
  | { type: 'polytrope' }
  /** Standard solar model profiles T, ρ, P, M_r, L_r, X against radius with a draggable cursor and the convection-zone boundary */
  | { type: 'solarmodel' }
  /** Ends of the main sequence: peak central temperature of a contracting object against mass (brown-dwarf and hydrogen-burning limits) and L/L_Edd along the main sequence */
  | { type: 'msrange' }
  /** Cross-section of a main-sequence star for a chosen mass: convective and radiative zones, burning core, surface colour, central T and ρ */
  | { type: 'msstructure' }
  /** Main-sequence lifetime against mass with the ages of the universe, Sun and Earth marked; mass slider reports lifetime, luminosity and spectral type */
  | { type: 'mslifetime' }
  /** The Sun through its main-sequence life: an age slider from birth to 10 Gyr drives luminosity, radius and effective temperature curves, the Sun drawn to scale and colour, and the Earth's equilibrium temperature */
  | { type: 'sunhistory' }
  /** Hydrogen and helium mass fractions against radius inside the Sun at a chosen age, with the ³He bump and the central mean molecular weight */
  | { type: 'solarcomposition' }
  /** Energy generation rate ε(r) of the pp chain and CNO cycle inside the Sun with the cumulative luminosity L_r, a draggable cursor and the radius enclosing 50 % and 99 % of the output */
  | { type: 'solarenergy' }
  /** Radiative and adiabatic temperature gradients against radius in the Sun, crossing at the base of the convection zone; photon mean free path and diffusion time readouts */
  | { type: 'solargradients' }
  /** Helioseismology: an animated spherical-harmonic p-mode pattern on the solar disc for chosen l and m, with the sound-speed profile and the model-minus-Sun residual */
  | { type: 'pmodes' }
  /** Solar neutrino spectrum (pp, pep, ⁷Be, ⁸B, hep, CNO) with the thresholds of the chlorine, gallium and water detectors; toggle predicted vs observed to see the deficit */
  | { type: 'neutrinospectrum' }
  /** Two-flavour neutrino oscillation: survival probability against distance for a chosen energy, mixing angle and Δm², with the Sun–Earth MSW regime marked */
  | { type: 'nuoscillation' }
  /** Temperature and density against height from the photosphere through the chromosphere and transition region into the corona (VAL-type model), with a draggable cursor */
  | { type: 'atmprofile' }
  /** Animated solar granulation: evolving convection cells in intensity or Doppler view, with granule and supergranule scales and lifetimes */
  | { type: 'granulation' }
  /** Spicules at the limb: animated jets rising and falling along supergranule boundaries, with the chromospheric flash spectrum (Hα, Ca II H and K, He I D₃) */
  | { type: 'spicules' }
  /** Coronal ionisation: the fraction of iron in each ionisation stage against temperature, the EUV lines each stage emits (the SDO/AIA channels) and the visible coronal lines */
  | { type: 'coronalions' }
  /** Parker's solar wind: the isothermal wind solution v(r) for a chosen coronal temperature, the critical point, and the speed, density and Parker-spiral angle at 1 AU */
  | { type: 'solarwind' }
  /** A coronal mass ejection launched toward the Earth: travel time, kinetic energy, and the compression of the magnetosphere as speed and density change */
  | { type: 'cme' }
  /** Differential rotation: meridians painted on the Sun wind up as the days pass; latitude slider reports the local rotation period; interior rotation map with the tachocline */
  | { type: 'diffrot' }
  /** A sunspot: umbra and penumbra temperatures and brightness, magnetic against gas pressure as the field strength changes, and the Zeeman splitting of a line */
  | { type: 'sunspot' }
  /** The sunspot cycle: 300 years of sunspot numbers with the Maunder and Dalton minima, and the butterfly diagram of spot latitudes; a year cursor shows the spots on the disc */
  | { type: 'butterfly' }
  /** Solar flare energy: magnetic reconnection in a loop of chosen field strength and size, the energy released, the GOES class and comparisons */
  | { type: 'flareenergy' }
  /** Babcock's dynamo in stages: poloidal field wound into toroidal by differential rotation, flux tubes rising into bipolar spot groups, and the polar field reversing over 22 years */
  | { type: 'dynamo' }
  /** Magnetic activity in other stars: X-ray-to-bolometric luminosity against Rossby number with the saturated and unsaturated branches, real stars placed and sliders for rotation period and spectral type */
  | { type: 'activity' }
  /** Interstellar extinction and reddening: a star seen through a dust cloud, with sliders for A_V, R_V and distance; the reddened spectrum, apparent magnitude, colour excess E(B−V) and the distance error if extinction is ignored */
  | { type: 'extinction' }
  /** Mie scattering and the extinction curve: the extinction efficiency Q against grain size over wavelength, and A_λ/A_V against 1/λ with the 217.5 nm bump for a chosen R_V, the U, B and V bands marked */
  | { type: 'extcurve' }
  /** The 21-cm line: the spin-flip transition animated and the line profile for a chosen H I column density, temperature and width, with the optical depth τ_H and the brightness temperature */
  | { type: 'hi21cm' }
  /** The phases of the interstellar medium: cloud types placed on a density–temperature diagram with their masses and sizes drawn to scale; click a type for its properties and Jeans mass */
  | { type: 'ismphases' }
  /** Heating and cooling of a molecular cloud: cosmic-ray and photoelectric heating against line and dust cooling as functions of density, with the equilibrium temperature of the gas */
  | { type: 'heatcool' }
  /** The Jeans criterion: Jeans mass and length against density for a chosen temperature and composition, with the Bonnor–Ebert mass and the observed cloud types marked as stable or collapsing */
  | { type: 'jeans' }
  /** Homologous free-fall collapse: an animated cloud whose shells fall together, with r/r₀ and log ρ/ρ₀ against time and the free-fall time for the chosen density; inside-out collapse for comparison */
  | { type: 'freefall' }
  /** Fragmentation: the Jeans mass falling as the density rises during isothermal collapse and rising again when it turns adiabatic, with the minimum fragment mass for chosen efficiency and temperature, and a cascading-fragmentation cartoon */
  | { type: 'fragmentation' }
  /** Magnetic support of a cloud: the magnetic critical mass and the ambipolar-diffusion time against the free-fall time for a chosen field, radius and density; subcritical or supercritical */
  | { type: 'magcollapse' }
  /** Protostellar collapse on the H–R diagram: evolutionary tracks of 0.05–10 solar-mass clouds from the first hydrostatic core to deuterium burn-out, with a stage slider for the 1 solar-mass case and the infall line profile */
  | { type: 'protostartrack' }
  /** Pre-main-sequence tracks: the Hayashi forbidden region, tracks for 0.8–60 solar masses with contraction times, a mass slider animating a star down its Hayashi track and across to the ZAMS, and its convective structure */
  | { type: 'pmstracks' }
  /** The initial mass function: Salpeter, Kroupa and Chabrier forms with the deuterium- and hydrogen-burning limits, and the numbers and masses of stars in each range for a cluster of chosen mass */
  | { type: 'imf' }
  /** Strömgren spheres: the ionising photon rate of an O or B star, the equilibrium radius of its H II region for a chosen gas density, the ionisation front expanding, and the Hα glow */
  | { type: 'stromgren' }
  /** P Cygni profiles: an expanding or infalling shell around a T Tauri star and the line profile it produces, with sliders for the shell speed and optical depth; toggles outflow, inverse (accretion) and the FU Orionis state */
  | { type: 'pcygni' }
  /** Disk formation: a rotating cloud collapsing, faster along the axis than in the plane, settling into a disk of radius set by angular momentum, with jets; sliders for the initial spin and radius */
  | { type: 'protodisk' }
  /** Stellar evolution timescales against mass: free-fall, Kelvin–Helmholtz and nuclear timescales on a log plot with a mass slider, and the fraction of stars expected in each phase */
  | { type: 'evotimescales' }
  /** A main-sequence star ageing: core hydrogen fraction, mean molecular weight, central temperature and density, luminosity and radius against age for a chosen mass, with the interior profile and the isothermal core appearing at hydrogen exhaustion */
  | { type: 'mscore' }
  /** The Schönberg–Chandrasekhar limit: pressure at the surface of an isothermal core against core mass, its maximum, the envelope pressure, and the limiting core fraction for chosen mean molecular weights; degeneracy raises the limit */
  | { type: 'sclimit' }
  /** Main-sequence and post-main-sequence evolutionary tracks of 0.8–25 solar-mass stars (Schaller et al. 1992) with the numbered points and elapsed times of Table 13.1; a mass selector and age cursor move a star along its track */
  | { type: 'evotracks' }
  /** The giant stages of a 1 or 5 solar-mass star: the annotated track from ZAMS through SGB, RGB, helium burning, AGB and planetary nebula, with a stage slider showing the cross-section (core, burning shells, convective envelope) and the first dredge-up */
  | { type: 'giantstages' }
  /** The helium core flash: pressure of an ideal and a degenerate gas against temperature, the triple-alpha rate's steep temperature dependence, and the runaway luminosity of the flash for a degenerate core compared with quiet ignition in a non-degenerate one */
  | { type: 'heflash' }
  /** Thermal pulses on the AGB: hydrogen- and helium-shell luminosities and the surface luminosity against time for a chosen core mass, with the interpulse period and the growing pulse amplitude */
  | { type: 'thermalpulses' }
  /** Third dredge-up and the s-process: slow neutron captures and beta decays walked across the chart of nuclides to technetium-99, and a C/O ratio slider that turns an M giant into an S and then a C star as carbon monoxide locks up the lesser element */
  | { type: 'sprocess' }
  /** AGB mass loss: the Reimers rate for chosen luminosity, radius and mass, the mass of the star against time, the superwind, and the initial–final mass relation that keeps white dwarfs below the Chandrasekhar limit */
  | { type: 'agbmassloss' }
  /** A planetary nebula: the ejected envelope expanding while the central star crosses the H–R diagram to the white-dwarf cooling track; sliders for expansion speed and age give the size, the Helix as the worked case, and the [O III] and Hα colours */
  | { type: 'planetary' }
  /** Stellar populations: Population I, II and III placed in a cut-away Milky Way with their metallicities, ages and velocities, and the metallicity of each generation rising with time */
  | { type: 'stellarpops' }
  /** Main-sequence fitting: a cluster's colour–magnitude diagram in apparent magnitude is dragged vertically onto the calibrated main sequence; the shift is the distance modulus and gives the distance */
  | { type: 'msfitting' }
  /** Isochrones: a synthetic cluster colour–magnitude diagram at a chosen age from 1 Myr to 13 Gyr, with the turn-off, giants, horizontal branch, white dwarfs, the Hertzsprung gap in young clusters and the ages of real clusters marked */
  | { type: 'isochrone' }
  /** Star counts by evolutionary phase: the number of a cluster's stars expected on the main sequence, subgiant, giant, horizontal and asymptotic branches from the lifetimes of each phase and the initial mass function; why the AGB and post-AGB are nearly empty */
  | { type: 'phasecounts' };

export type SceneCue =
  | { action: 'goto'; ref: string; kind?: 'body' | 'blackhole' | 'star' | 'landmark' | 'galaxy' }
  | { action: 'overview'; ref: string }
  | { action: 'vantage'; ref: string; elev: number; az: number; dist: number }
  | { action: 'rate'; rate: number }
  | { action: 'backdrop' }
  | { action: 'grid'; equatorial?: boolean; ecliptic?: boolean }
  | { action: 'orbits'; on: boolean };

export interface Step {
  id: string;
  /** small label above the title: Concept · Derivation · History · Interactive … */
  kicker?: string;
  title: string;
  body: Block[];
  widget?: WidgetSpec;
  scene?: SceneCue[];
}

export interface Section {
  id: string;
  /** "1.1" */
  number: string;
  title: string;
  summary: string;
  minutes: number;
  steps: Step[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  sections: Section[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  chapters: Chapter[];
}

/* Deep Field: the editorial content of the upstream project (Your Eyes In Space, BigBrains) is not
 * covered by its AGPL licence (see LICENSE-CONTENT.md) and is not included in this fork. */
export const COURSE: Course = { id: 'astrophysics', title: '', subtitle: '', chapters: [] };
