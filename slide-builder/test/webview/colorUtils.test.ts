import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  rgbToHsl,
  hslToRgb,
  isValidHex,
} from '../../src/webview/theme-editor/utils/colorUtils';

/**
 * Unit tests for colorUtils.
 * Story Reference: bt-3-1 Task 2.7 -- AC-3, AC-4, AC-5
 */

describe('colorUtils', () => {
  // =========================================================================
  // isValidHex
  // =========================================================================

  describe('isValidHex', () => {
    it('accepts valid 6-digit hex with # prefix', () => {
      expect(isValidHex('#000000')).toBe(true);
      expect(isValidHex('#FFFFFF')).toBe(true);
      expect(isValidHex('#ff5733')).toBe(true);
      expect(isValidHex('#0066cc')).toBe(true);
    });

    it('rejects invalid hex strings', () => {
      expect(isValidHex('')).toBe(false);
      expect(isValidHex('000000')).toBe(false);
      expect(isValidHex('#fff')).toBe(false);
      expect(isValidHex('#GGGGGG')).toBe(false);
      expect(isValidHex('#12345')).toBe(false);
      expect(isValidHex('#1234567')).toBe(false);
      expect(isValidHex('not-a-color')).toBe(false);
    });
  });

  // =========================================================================
  // hexToRgb
  // =========================================================================

  describe('hexToRgb', () => {
    it('converts pure black', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('converts pure white', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('converts pure red', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts lowercase hex', () => {
      expect(hexToRgb('#ff5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('returns null for invalid hex', () => {
      expect(hexToRgb('')).toBeNull();
      expect(hexToRgb('#fff')).toBeNull();
      expect(hexToRgb('invalid')).toBeNull();
    });
  });

  // =========================================================================
  // rgbToHex
  // =========================================================================

  describe('rgbToHex', () => {
    it('converts black RGB to lowercase hex', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    });

    it('converts white RGB to lowercase hex', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
    });

    it('converts red RGB', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    });

    it('produces lowercase 6-digit hex', () => {
      expect(rgbToHex({ r: 255, g: 87, b: 51 })).toBe('#ff5733');
    });

    it('clamps out-of-range values', () => {
      expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
    });
  });

  // =========================================================================
  // Round-trip: hex -> RGB -> hex
  // =========================================================================

  describe('round-trip hex -> RGB -> hex', () => {
    const testCases = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ff5733', '#0066cc'];

    for (const hex of testCases) {
      it(`preserves ${hex} through round-trip`, () => {
        const rgb = hexToRgb(hex);
        expect(rgb).not.toBeNull();
        expect(rgbToHex(rgb!)).toBe(hex);
      });
    }
  });

  // =========================================================================
  // rgbToHsl
  // =========================================================================

  describe('rgbToHsl', () => {
    it('converts black', () => {
      expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    });

    it('converts white', () => {
      expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
    });

    it('converts pure red', () => {
      expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('converts pure green', () => {
      expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    });

    it('converts pure blue', () => {
      expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    });
  });

  // =========================================================================
  // hslToRgb
  // =========================================================================

  describe('hslToRgb', () => {
    it('converts black HSL', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('converts white HSL', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('converts pure red HSL', () => {
      expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts gray (50% lightness)', () => {
      const gray = hslToRgb({ h: 0, s: 0, l: 50 });
      expect(gray.r).toBe(gray.g);
      expect(gray.g).toBe(gray.b);
      expect(gray.r).toBe(128);
    });
  });

  // =========================================================================
  // hexToHsl
  // =========================================================================

  describe('hexToHsl', () => {
    it('converts #FF0000 to red HSL', () => {
      expect(hexToHsl('#FF0000')).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('returns null for invalid hex', () => {
      expect(hexToHsl('invalid')).toBeNull();
    });
  });

  // =========================================================================
  // hslToHex
  // =========================================================================

  describe('hslToHex', () => {
    it('converts red HSL to hex', () => {
      expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000');
    });

    it('converts black HSL to hex', () => {
      expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000');
    });
  });

  // =========================================================================
  // Round-trip: hex -> HSL -> hex
  // =========================================================================

  describe('round-trip hex -> HSL -> hex', () => {
    // Note: Due to rounding in HSL intermediate representation, some colors
    // may shift by 1 in RGB space. We test that primary colors survive.
    const testCases = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];

    for (const hex of testCases) {
      it(`preserves ${hex} through hex->HSL->hex round-trip`, () => {
        const hsl = hexToHsl(hex);
        expect(hsl).not.toBeNull();
        expect(hslToHex(hsl!)).toBe(hex);
      });
    }
  });

  // =========================================================================
  // Case normalization
  // =========================================================================

  describe('case normalization', () => {
    it('uppercase hex input produces lowercase output through RGB round-trip', () => {
      const rgb = hexToRgb('#FF5733');
      expect(rgb).not.toBeNull();
      expect(rgbToHex(rgb!)).toBe('#ff5733');
    });

    it('mixed case hex input produces lowercase output', () => {
      const rgb = hexToRgb('#aAbBcC');
      expect(rgb).not.toBeNull();
      expect(rgbToHex(rgb!)).toBe('#aabbcc');
    });
  });
});
