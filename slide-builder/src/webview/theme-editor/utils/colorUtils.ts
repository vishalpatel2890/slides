/**
 * colorUtils - Pure color conversion functions for hex/RGB/HSL synchronization.
 *
 * Story Reference: bt-3-1 Task 2 -- AC-3, AC-4, AC-5
 * Used by ColorPickerPopover to keep hex, RGB, and HSL inputs synchronized.
 * Designed for reuse by Stories 3.3 (Shapes/Components) for border/shadow color properties.
 */

// =============================================================================
// Types
// =============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// =============================================================================
// Hex validation
// =============================================================================

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Returns true if the string is a valid 6-digit hex color with # prefix. */
export function isValidHex(hex: string): boolean {
  return HEX_REGEX.test(hex);
}

// =============================================================================
// Hex <-> RGB
// =============================================================================

/**
 * Convert a hex color string to RGB values.
 * Accepts both uppercase and lowercase hex (e.g., "#FF5733" or "#ff5733").
 * Returns null for invalid input.
 */
export function hexToRgb(hex: string): RGB | null {
  if (!isValidHex(hex)) return null;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
}

/**
 * Convert RGB values to a lowercase 6-digit hex string with # prefix.
 * Clamps values to 0-255 range.
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// =============================================================================
// RGB <-> HSL
// =============================================================================

/**
 * Convert RGB (0-255 each) to HSL (h: 0-360, s: 0-100, l: 0-100).
 * All output values are rounded to integers.
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL (h: 0-360, s: 0-100, l: 0-100) to RGB (0-255 each).
 * All output values are rounded to integers.
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  function hueToRgb(p: number, q: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  }

  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

// =============================================================================
// Hex <-> HSL (via intermediate RGB)
// =============================================================================

/**
 * Convert hex color to HSL. Returns null for invalid hex input.
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb);
}

/**
 * Convert HSL to hex color string.
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}
