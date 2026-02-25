/**
 * Theme Validation - Unit Tests
 *
 * Story Reference: BT-4.4 — Theme Runtime Validation (AC-19 through AC-23)
 * Tests cover: valid themes, missing required fields, missing optional fields,
 * invalid inputs (null/undefined/string/number/array), default filling,
 * unknown property preservation, and performance.
 */

import { describe, it, expect } from 'vitest';
import { validateThemeJson, type ThemeValidationResult } from '../../src/shared/themeValidation';
import type { ThemeJson } from '../../src/shared/types';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a valid, complete ThemeJson object for testing.
 * All required fields are present; optional fields are omitted unless specified.
 */
function createValidTheme(overrides?: Partial<ThemeJson>): Record<string, unknown> {
  return {
    name: 'Test Theme',
    version: '1.0.0',
    colors: {
      primary: '#FF0000',
      secondary: '#00FF00',
      accent: '#0000FF',
      background: {
        default: '#FFFFFF',
        alt: '#F5F5F5',
      },
      text: {
        heading: '#111111',
        body: '#333333',
      },
    },
    typography: {
      fonts: {
        heading: 'Inter',
        body: 'Roboto',
      },
      scale: { body: '1rem', h1: '2.5rem', h2: '2rem' },
      weights: { regular: 400, bold: 700 },
    },
    shapes: {
      borderRadius: { small: '4px', medium: '8px', large: '16px' },
      shadow: { small: '0 1px 2px rgba(0,0,0,0.05)', medium: '0 2px 4px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e5e5e5', medium: '2px solid #ccc' },
    },
    components: {
      box: { default: { padding: '16px' } },
    },
    ...overrides,
  };
}

/**
 * Creates a complete theme with all optional fields populated.
 */
function createCompleteTheme(): Record<string, unknown> {
  return {
    ...createValidTheme(),
    colors: {
      primary: '#FF0000',
      secondary: '#00FF00',
      accent: '#0000FF',
      background: {
        default: '#FFFFFF',
        alt: '#F5F5F5',
        dark: '#1A1A2E',
      },
      text: {
        heading: '#111111',
        body: '#333333',
        onDark: '#FFFFFF',
      },
      semantic: { success: '#00C853', warning: '#FFD600', error: '#FF1744', info: '#2979FF' },
      dataViz: { palette: ['#FF6384', '#36A2EB', '#FFCE56'] },
      brand: { primary: '#FF0000' },
    },
    typography: {
      fonts: {
        heading: 'Inter',
        body: 'Roboto',
        mono: 'Fira Code',
      },
      scale: { body: '1rem', h1: '2.5rem' },
      weights: { regular: 400, bold: 700 },
    },
    shapes: {
      borderRadius: { medium: '8px' },
      shadow: { medium: '0 2px 4px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e5e5e5' },
    },
    components: {},
    personality: { classification: 'Professional', traits: ['clean', 'modern'] },
    meta: { brandDescription: 'Test brand', confidence: 0.95 },
    brandContext: { voice: 'Professional and confident' },
  };
}

// =============================================================================
// Test 7.1: Valid complete theme
// =============================================================================

describe('validateThemeJson', () => {
  describe('valid themes', () => {
    it('7.1: valid complete theme returns { valid: true, errors: [], warnings: [] } with theme preserved', () => {
      const theme = createCompleteTheme();
      const result = validateThemeJson(theme);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.theme).not.toBeNull();
      expect(result.theme!.name).toBe('Test Theme');
      expect(result.theme!.version).toBe('1.0.0');
    });

    it('valid theme with only required fields returns valid: true with optional field warnings', () => {
      const theme = createValidTheme();
      const result = validateThemeJson(theme);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.theme).not.toBeNull();
    });
  });

  // ===========================================================================
  // Test 7.2: Theme missing name
  // ===========================================================================

  describe('required field: name', () => {
    it('7.2: theme missing name returns error for name, result.theme.name === "Untitled"', () => {
      const theme = createValidTheme();
      delete theme.name;
      const result = validateThemeJson(theme);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
      expect(result.theme).not.toBeNull();
      expect(result.theme!.name).toBe('Untitled');
    });
  });

  // ===========================================================================
  // Test 7.3: Theme missing colors.primary
  // ===========================================================================

  describe('required field: colors.primary', () => {
    it('7.3: theme missing colors.primary returns error, result.theme.colors.primary === "#000000"', () => {
      const theme = createValidTheme();
      const colors = theme.colors as Record<string, unknown>;
      delete colors.primary;
      const result = validateThemeJson(theme);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: colors.primary');
      expect(result.theme).not.toBeNull();
      expect(result.theme!.colors.primary).toBe('#000000');
    });
  });

  // ===========================================================================
  // Test 7.4: Theme missing ALL required fields
  // ===========================================================================

  describe('all required fields missing', () => {
    it('7.4: theme missing ALL required fields returns errors listing all 17+ required fields', () => {
      const result = validateThemeJson({});

      expect(result.valid).toBe(false);
      // 11 string fields + 5 non-empty record fields + 1 exists field = 17
      expect(result.errors.length).toBeGreaterThanOrEqual(17);

      // Verify all required string fields are reported
      expect(result.errors).toContain('Missing required field: name');
      expect(result.errors).toContain('Missing required field: version');
      expect(result.errors).toContain('Missing required field: colors.primary');
      expect(result.errors).toContain('Missing required field: colors.secondary');
      expect(result.errors).toContain('Missing required field: colors.accent');
      expect(result.errors).toContain('Missing required field: colors.background.default');
      expect(result.errors).toContain('Missing required field: colors.background.alt');
      expect(result.errors).toContain('Missing required field: colors.text.heading');
      expect(result.errors).toContain('Missing required field: colors.text.body');
      expect(result.errors).toContain('Missing required field: typography.fonts.heading');
      expect(result.errors).toContain('Missing required field: typography.fonts.body');

      // Verify non-empty record fields are reported
      expect(result.errors).toContain('Missing required field: typography.scale');
      expect(result.errors).toContain('Missing required field: typography.weights');
      expect(result.errors).toContain('Missing required field: shapes.borderRadius');
      expect(result.errors).toContain('Missing required field: shapes.shadow');
      expect(result.errors).toContain('Missing required field: shapes.border');

      // Verify components exists check
      expect(result.errors).toContain('Missing required field: components');

      // Theme should still have defaults filled
      expect(result.theme).not.toBeNull();
      expect(result.theme!.name).toBe('Untitled');
      expect(result.theme!.version).toBe('0.0.0');
    });
  });

  // ===========================================================================
  // Test 7.5: Theme missing only optional fields
  // ===========================================================================

  describe('optional field warnings', () => {
    it('7.5: theme missing only optional fields returns { valid: true, errors: [] } with warnings', () => {
      const theme = createValidTheme();
      const result = validateThemeJson(theme);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check all 9 optional fields produce warnings
      expect(result.warnings).toContain('Missing optional field: colors.background.dark');
      expect(result.warnings).toContain('Missing optional field: colors.text.onDark');
      expect(result.warnings).toContain('Missing optional field: colors.semantic');
      expect(result.warnings).toContain('Missing optional field: colors.dataViz');
      expect(result.warnings).toContain('Missing optional field: colors.brand');
      expect(result.warnings).toContain('Missing optional field: typography.fonts.mono');
      expect(result.warnings).toContain('Missing optional field: personality');
      expect(result.warnings).toContain('Missing optional field: meta');
      expect(result.warnings).toContain('Missing optional field: brandContext');
    });
  });

  // ===========================================================================
  // Tests 7.6-7.10: Invalid inputs (AC-23)
  // ===========================================================================

  describe('invalid inputs (AC-23)', () => {
    it('7.6: input null returns { valid: false, theme: null }', () => {
      const result = validateThemeJson(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.warnings).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it('7.7: input undefined returns { valid: false, theme: null }', () => {
      const result = validateThemeJson(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.warnings).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it('7.8: input "string" returns { valid: false, theme: null }', () => {
      const result = validateThemeJson('hello world');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.warnings).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it('7.9: input 42 returns { valid: false, theme: null }', () => {
      const result = validateThemeJson(42);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.warnings).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it('7.10: input [] (array) returns { valid: false, theme: null }', () => {
      const result = validateThemeJson([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.warnings).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it('input boolean false returns { valid: false, theme: null }', () => {
      const result = validateThemeJson(false);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Input is not a valid object']);
      expect(result.theme).toBeNull();
    });
  });

  // ===========================================================================
  // Test 7.11: Unknown extra properties preserved
  // ===========================================================================

  describe('property preservation', () => {
    it('7.11: theme with unknown extra properties -- properties preserved in result.theme', () => {
      const theme = createValidTheme();
      (theme as Record<string, unknown>).customField = 'custom value';
      (theme as Record<string, unknown>).anotherCustom = { nested: true, count: 42 };

      const result = validateThemeJson(theme);

      expect(result.theme).not.toBeNull();
      expect((result.theme as Record<string, unknown>).customField).toBe('custom value');
      expect((result.theme as Record<string, unknown>).anotherCustom).toEqual({ nested: true, count: 42 });
    });

    it('preserves unknown nested properties within known structures', () => {
      const theme = createValidTheme();
      const colors = theme.colors as Record<string, unknown>;
      colors.customColor = '#ABCDEF';

      const result = validateThemeJson(theme);

      expect(result.theme).not.toBeNull();
      expect((result.theme!.colors as Record<string, unknown>).customColor).toBe('#ABCDEF');
    });
  });

  // ===========================================================================
  // Test 7.12: Theme with brandContext populated -- no warning for brandContext
  // ===========================================================================

  describe('brandContext', () => {
    it('7.12: theme with brandContext populated -- no warning for brandContext', () => {
      const theme = createValidTheme({
        brandContext: { voice: 'Professional', designPhilosophy: 'Clean and modern' },
      } as Partial<ThemeJson>);

      const result = validateThemeJson(theme);

      expect(result.warnings).not.toContain('Missing optional field: brandContext');
    });
  });

  // ===========================================================================
  // Test 7.13: Empty typography.scale returns error for non-empty scale
  // ===========================================================================

  describe('non-empty record validation', () => {
    it('7.13: theme with empty typography.scale ({}) returns error for non-empty scale', () => {
      const theme = createValidTheme();
      (theme.typography as Record<string, unknown>).scale = {};

      const result = validateThemeJson(theme);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: typography.scale');
      // Default should be filled
      expect(result.theme).not.toBeNull();
      expect(result.theme!.typography.scale).toEqual({ body: '1rem' });
    });

    it('theme with empty typography.weights ({}) returns error', () => {
      const theme = createValidTheme();
      (theme.typography as Record<string, unknown>).weights = {};

      const result = validateThemeJson(theme);

      expect(result.errors).toContain('Missing required field: typography.weights');
      expect(result.theme!.typography.weights).toEqual({ regular: 400 });
    });

    it('theme with empty shapes.borderRadius ({}) returns error', () => {
      const theme = createValidTheme();
      (theme.shapes as Record<string, unknown>).borderRadius = {};

      const result = validateThemeJson(theme);

      expect(result.errors).toContain('Missing required field: shapes.borderRadius');
      expect(result.theme!.shapes.borderRadius).toEqual({ medium: '8px' });
    });

    it('theme with empty shapes.shadow ({}) returns error', () => {
      const theme = createValidTheme();
      (theme.shapes as Record<string, unknown>).shadow = {};

      const result = validateThemeJson(theme);

      expect(result.errors).toContain('Missing required field: shapes.shadow');
    });

    it('theme with empty shapes.border ({}) returns error', () => {
      const theme = createValidTheme();
      (theme.shapes as Record<string, unknown>).border = {};

      const result = validateThemeJson(theme);

      expect(result.errors).toContain('Missing required field: shapes.border');
    });
  });

  // ===========================================================================
  // Test 7.14: Components: {} (empty) passes -- components only needs to exist
  // ===========================================================================

  describe('components existence check', () => {
    it('7.14: theme with components: {} (empty) passes -- components only needs to exist', () => {
      const theme = createValidTheme({ components: {} } as Partial<ThemeJson>);
      const result = validateThemeJson(theme);

      // Should not have error for components
      expect(result.errors).not.toContain('Missing required field: components');
    });

    it('theme without components key returns error', () => {
      const theme = createValidTheme();
      delete (theme as Record<string, unknown>).components;
      const result = validateThemeJson(theme);

      expect(result.errors).toContain('Missing required field: components');
    });
  });

  // ===========================================================================
  // Test 7.15: Performance -- validation completes in <5ms
  // ===========================================================================

  describe('performance', () => {
    it('7.15: validation completes in <5ms for a typical theme', () => {
      const theme = createCompleteTheme();
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        validateThemeJson(theme);
      }

      const elapsed = performance.now() - start;
      const avgMs = elapsed / iterations;

      // Average should be well under 5ms
      expect(avgMs).toBeLessThan(5);
    });
  });

  // ===========================================================================
  // Additional edge case tests for default filling (AC-22)
  // ===========================================================================

  describe('default filling (AC-22)', () => {
    it('fills missing version with "0.0.0"', () => {
      const theme = createValidTheme();
      delete theme.version;
      const result = validateThemeJson(theme);

      expect(result.theme!.version).toBe('0.0.0');
    });

    it('fills missing colors.secondary with "#000000"', () => {
      const theme = createValidTheme();
      delete (theme.colors as Record<string, unknown>).secondary;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.secondary).toBe('#000000');
    });

    it('fills missing colors.accent with "#000000"', () => {
      const theme = createValidTheme();
      delete (theme.colors as Record<string, unknown>).accent;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.accent).toBe('#000000');
    });

    it('fills missing colors.background.default with "#000000"', () => {
      const theme = createValidTheme();
      delete ((theme.colors as Record<string, unknown>).background as Record<string, unknown>).default;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.background.default).toBe('#000000');
    });

    it('fills missing colors.background.alt with "#000000"', () => {
      const theme = createValidTheme();
      delete ((theme.colors as Record<string, unknown>).background as Record<string, unknown>).alt;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.background.alt).toBe('#000000');
    });

    it('fills missing colors.text.heading with "#000000"', () => {
      const theme = createValidTheme();
      delete ((theme.colors as Record<string, unknown>).text as Record<string, unknown>).heading;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.text.heading).toBe('#000000');
    });

    it('fills missing colors.text.body with "#000000"', () => {
      const theme = createValidTheme();
      delete ((theme.colors as Record<string, unknown>).text as Record<string, unknown>).body;
      const result = validateThemeJson(theme);

      expect(result.theme!.colors.text.body).toBe('#000000');
    });

    it('fills missing typography.fonts.heading with "sans-serif"', () => {
      const theme = createValidTheme();
      delete ((theme.typography as Record<string, unknown>).fonts as Record<string, unknown>).heading;
      const result = validateThemeJson(theme);

      expect(result.theme!.typography.fonts.heading).toBe('sans-serif');
    });

    it('fills missing typography.fonts.body with "sans-serif"', () => {
      const theme = createValidTheme();
      delete ((theme.typography as Record<string, unknown>).fonts as Record<string, unknown>).body;
      const result = validateThemeJson(theme);

      expect(result.theme!.typography.fonts.body).toBe('sans-serif');
    });

    it('fills missing shapes.shadow with default', () => {
      const theme = createValidTheme();
      delete (theme.shapes as Record<string, unknown>).shadow;
      const result = validateThemeJson(theme);

      expect(result.theme!.shapes.shadow).toEqual({ medium: '0 2px 4px rgba(0,0,0,0.1)' });
    });

    it('fills missing shapes.border with default', () => {
      const theme = createValidTheme();
      delete (theme.shapes as Record<string, unknown>).border;
      const result = validateThemeJson(theme);

      expect(result.theme!.shapes.border).toEqual({ thin: '1px solid #e5e5e5' });
    });

    it('fills missing components with empty object', () => {
      const theme = createValidTheme();
      delete (theme as Record<string, unknown>).components;
      const result = validateThemeJson(theme);

      expect(result.theme!.components).toEqual({});
    });

    it('fills all defaults for a completely empty object', () => {
      const result = validateThemeJson({});

      expect(result.theme).not.toBeNull();
      expect(result.theme!.name).toBe('Untitled');
      expect(result.theme!.version).toBe('0.0.0');
      expect(result.theme!.colors.primary).toBe('#000000');
      expect(result.theme!.colors.secondary).toBe('#000000');
      expect(result.theme!.colors.accent).toBe('#000000');
      expect(result.theme!.colors.background.default).toBe('#000000');
      expect(result.theme!.colors.background.alt).toBe('#000000');
      expect(result.theme!.colors.text.heading).toBe('#000000');
      expect(result.theme!.colors.text.body).toBe('#000000');
      expect(result.theme!.typography.fonts.heading).toBe('sans-serif');
      expect(result.theme!.typography.fonts.body).toBe('sans-serif');
      expect(result.theme!.typography.scale).toEqual({ body: '1rem' });
      expect(result.theme!.typography.weights).toEqual({ regular: 400 });
      expect(result.theme!.shapes.borderRadius).toEqual({ medium: '8px' });
      expect(result.theme!.shapes.shadow).toEqual({ medium: '0 2px 4px rgba(0,0,0,0.1)' });
      expect(result.theme!.shapes.border).toEqual({ thin: '1px solid #e5e5e5' });
      expect(result.theme!.components).toEqual({});
    });
  });

  // ===========================================================================
  // ThemeValidationResult interface shape test (AC-19)
  // ===========================================================================

  describe('ThemeValidationResult interface (AC-19)', () => {
    it('returned result has correct shape: valid, errors, warnings, theme', () => {
      const result = validateThemeJson({});

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('theme');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('function is importable and callable', () => {
      expect(typeof validateThemeJson).toBe('function');
      const result = validateThemeJson({});
      expect(result).toBeDefined();
    });
  });
});
