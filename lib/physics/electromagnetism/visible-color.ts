/**
 * Wavelength → sRGB approximation for the visible band.
 *
 * This is the classic Dan Bruton piecewise fit (380 nm … 780 nm), which
 * stands in for a proper CIE 1931 xyz → sRGB transform when the only use
 * case is rendering a rainbow that *looks* right to the eye. Luminance
 * falls off at the violet and red edges to reproduce the fact that the
 * eye is nearly blind at 380 nm and 780 nm.
 *
 * It is not a scientifically accurate colour-matching function — scenes
 * that need calibrated tristimulus values should use a real CIE table.
 * For illustration in the spectrum scenes, the perceptual match is plenty.
 *
 * References: Dan Bruton, "Approximate RGB Values for Visible Wavelengths"
 * (1996), widely reproduced; see e.g. Noah.org's cached version.
 */

export interface RGB {
  /** 0..255 */
  readonly r: number;
  /** 0..255 */
  readonly g: number;
  /** 0..255 */
  readonly b: number;
}

const GAMMA = 0.8;

function clamp255(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 255;
  return Math.round(255 * x);
}

/**
 * Convert a wavelength in nanometres to an approximate sRGB triple.
 * Outside 380–780 nm the function returns pure black.
 */
export function wavelengthToRGB(nm: number): RGB {
  let r = 0;
  let g = 0;
  let b = 0;

  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    r = 0;
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    r = 0;
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
    b = 0;
  } else if (nm >= 645 && nm <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    return { r: 0, g: 0, b: 0 };
  }

  // Intensity falls off towards the edges of the visible band.
  let factor = 1;
  if (nm >= 380 && nm < 420) {
    factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380);
  } else if (nm >= 420 && nm < 701) {
    factor = 1;
  } else if (nm >= 701 && nm <= 780) {
    factor = 0.3 + (0.7 * (780 - nm)) / (780 - 700);
  }

  return {
    r: clamp255(Math.pow(r * factor, GAMMA)),
    g: clamp255(Math.pow(g * factor, GAMMA)),
    b: clamp255(Math.pow(b * factor, GAMMA)),
  };
}
