/**
 * White dwarfs whose perceived colour is far from any blackbody: dense helium atmospheres broaden
 * the absorption of sodium, calcium or carbon until whole bands of the visible go missing.
 * Hollands, Gänsicke, Tremblay & Koester (2026), "Any colour you like: the diverse chromaticities
 * of white dwarfs", RAS Techniques and Instruments 5, rzag069 (doi:10.1093/rasti/rzag069).
 *
 * All of them lie in the Gaia Catalogue of Nearby Stars tier; they are matched by Gaia DR3
 * source_id. `hex` is the disc-integrated sRGB colour of the paper's tables C4–C6.
 */
export interface ColouredDwarf {
  /** Gaia DR3 source_id */
  gaia: string;
  /** survey designation (the paper's name) */
  wd: string;
  /** older catalogue name, searchable */
  alias?: string;
  hex: string;
  /** effective temperature (K) where the paper gives one */
  teff?: number;
  spectral: string;
  /** colour as a person would name it */
  label: string;
  note: string;
}

export const COLOURED_DWARFS: ColouredDwarf[] = [
  {
    gaia: '1666074615061406336', wd: 'WD J1330+6435', hex: '#DDFFB8', teff: 4240, spectral: 'DZ',
    label: 'Green',
    note: 'The first known green star (Hollands et al. 2026). Sodium, calcium and lithium from the rocky planetary debris it swallowed pollute its atmosphere. In the ultra-dense helium, sodium\'s narrow orange line broadens until it absorbs the yellows, the oranges and part of the reds, leaving a pale green light that peaks near 500 nm. No Sun-like star could do this.',
  },
  {
    gaia: '609898313949732608', wd: 'WD J0851+1543', hex: '#F1FFF8', spectral: 'DZ',
    label: 'Pale green',
    note: 'A pale green-cyan white dwarf: strong Ca II absorption in the blue and a steeply falling red end shift its colour towards green. Its high-quality spectrum means the green can be claimed reliably (Hollands et al. 2026).',
  },
  {
    gaia: '2341622358827194880', wd: 'WD J2356−2054', hex: '#70B4FF', teff: 4000, spectral: 'DZ',
    label: 'Vivid blue',
    note: 'Only 4000 K, yet vivid blue: its atmosphere holds so much sodium that the hugely broadened absorption wipes out the middle of the visible, leaving the 450–500 nm range. A more extreme relative of the green star WD J1330+6435 (Blouin et al. 2019; Hollands et al. 2026).',
  },
  {
    gaia: '927618687178189056', wd: 'WD J0744+4649', hex: '#F6FFA3', spectral: 'DZ',
    label: 'Yellow',
    note: 'Yellow where it should be orange: calcium absorbs most of the light below 460 nm. The metals in its atmosphere show that the planetary fragment it swallowed was made of crust-like rock (Hollands et al. 2026).',
  },
  {
    gaia: '740483560857296768', wd: 'WD J1011+2845', alias: 'LHS 2229', hex: '#FF8775', teff: 4335, spectral: 'DQpec',
    label: 'Salmon pink',
    note: 'Possibly the reddest star known by perceived colour: a deep salmon pink. Carbon dredged up from deep inside suppresses 400–600 nm with distorted Swan bands. Only 48 light-years away (Hollands et al. 2026).',
  },
  {
    gaia: '3662951038644235776', wd: 'WD J1333+0016', hex: '#FF9DB3', spectral: 'DQpec',
    label: 'Pink',
    note: 'A white dwarf that looks pink because of the distorted Swan bands in its carbon atmosphere; similar to LHS 2229, but emitting a little more light in the blue (Hollands et al. 2026).',
  },
  {
    gaia: '1505825635741455872', wd: 'WD J1403+4533', hex: '#C5F5FF', spectral: 'DC',
    label: 'Cyan',
    note: 'A cool, infrared-faint white dwarf: absorption by colliding molecules in its ultra-dense atmosphere suppresses the red, and the star looks cyan (Hollands et al. 2026).',
  },
];

/** sRGB 0…1 of a "#RRGGBB" colour */
export function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}

const byWd = new Map(COLOURED_DWARFS.map((c) => [c.wd, c]));

/** the entry named by a curated destination (`ref`), if it is one of these stars */
export function colouredDwarf(name: string): ColouredDwarf | undefined {
  return byWd.get(name);
}
