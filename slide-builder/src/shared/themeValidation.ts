/**
 * Theme JSON validation utility.
 * Pure function with no side effects, no file I/O, no React or VS Code API imports.
 *
 * Story Reference: BT-4.4 — Theme Runtime Validation
 * Architecture Reference: notes/architecture.md — Pure Utility Pattern
 * Tech Spec Reference: notes/sprint-artifacts/tech-spec-epic-bt-4.md (AC-19 through AC-23)
 */

import type { ThemeJson, ThemeColors, ThemeTypography, ThemeShapes, ThemeComponents } from './types';

// =============================================================================
// ThemeValidationResult Interface (Task 1, AC-19)
// =============================================================================

export interface ThemeValidationResult {
  /** true if no errors (warnings are OK) */
  valid: boolean;
  /** Missing required fields — blocks save */
  errors: string[];
  /** Missing optional but recommended fields — logged */
  warnings: string[];
  /** Normalized theme with defaults filled, or null if unparseable */
  theme: ThemeJson | null;
}

// =============================================================================
// Helper Utilities
// =============================================================================

/**
 * Safely access a nested property on an unknown object.
 * Returns undefined if any intermediate property is missing or not an object.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Check if a value is a non-null, non-array object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty record (object with at least one key).
 */
function isNonEmptyRecord(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length > 0;
}

/**
 * Deep clone an object using structured clone-like approach.
 * Uses JSON parse/stringify for simplicity since theme data is JSON-safe.
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// Default Values for Missing Required Fields (Task 5, AC-22)
// =============================================================================

const DEFAULT_COLOR = '#000000';
const DEFAULT_NAME = 'Untitled';
const DEFAULT_VERSION = '0.0.0';
const DEFAULT_FONT = 'sans-serif';

// =============================================================================
// Required & Optional Field Definitions (Tasks 3-4, AC-20, AC-21)
// =============================================================================

/** Required string fields with their dot-notation paths */
const REQUIRED_STRING_FIELDS = [
  'name',
  'version',
  'colors.primary',
  'colors.secondary',
  'colors.accent',
  'colors.background.default',
  'colors.background.alt',
  'colors.text.heading',
  'colors.text.body',
  'typography.fonts.heading',
  'typography.fonts.body',
] as const;

/** Required non-empty record fields */
const REQUIRED_NONEMPTY_RECORD_FIELDS = [
  'typography.scale',
  'typography.weights',
  'shapes.borderRadius',
  'shapes.shadow',
  'shapes.border',
] as const;

/** Required existence-only fields (can be empty object) */
const REQUIRED_EXISTS_FIELDS = [
  'components',
] as const;

/** Optional fields that produce warnings when missing */
const OPTIONAL_FIELDS = [
  'colors.background.dark',
  'colors.text.onDark',
  'colors.semantic',
  'colors.dataViz',
  'colors.brand',
  'typography.fonts.mono',
  'personality',
  'meta',
  'brandContext',
] as const;

// =============================================================================
// Main Validation Function (AC-19)
// =============================================================================

/**
 * Validates a theme JSON object for required fields, optional fields,
 * and fills sensible defaults for missing required fields.
 *
 * @param data - The raw data to validate (accepts unknown for type safety)
 * @returns ThemeValidationResult with validation status, errors, warnings, and normalized theme
 */
export function validateThemeJson(data: unknown): ThemeValidationResult {
  // ─── Task 2: Invalid input guard (AC-23) ───────────────────────────
  if (!isPlainObject(data)) {
    return {
      valid: false,
      errors: ['Input is not a valid object'],
      warnings: [],
      theme: null,
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── Task 3: Required field validation (AC-20) ─────────────────────

  // 3.1-3.4: Check required string fields
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = getNestedValue(data, field);
    if (value === undefined || value === null || typeof value !== 'string' || value.trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 3.6-3.7: Check required non-empty record fields
  for (const field of REQUIRED_NONEMPTY_RECORD_FIELDS) {
    const value = getNestedValue(data, field);
    if (!isNonEmptyRecord(value)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 3.8: Check components exists (can be empty object)
  for (const field of REQUIRED_EXISTS_FIELDS) {
    const value = getNestedValue(data, field);
    if (!isPlainObject(value)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // ─── Task 4: Optional field warnings (AC-21) ──────────────────────

  for (const field of OPTIONAL_FIELDS) {
    const value = getNestedValue(data, field);
    if (value === undefined || value === null) {
      warnings.push(`Missing optional field: ${field}`);
    }
  }

  // ─── Task 5: Default filling for missing required fields (AC-22) ──

  // 5.1: Deep clone the input data as base for normalized theme
  const theme = deepClone(data) as Record<string, unknown>;

  // 5.2: Fill missing name and version
  if (typeof theme.name !== 'string' || (theme.name as string).trim() === '') {
    theme.name = DEFAULT_NAME;
  }
  if (typeof theme.version !== 'string' || (theme.version as string).trim() === '') {
    theme.version = DEFAULT_VERSION;
  }

  // Ensure nested structures exist for filling defaults
  if (!isPlainObject(theme.colors)) {
    theme.colors = {};
  }
  const colors = theme.colors as Record<string, unknown>;

  // 5.3: Fill missing color fields with '#000000'
  if (typeof colors.primary !== 'string' || (colors.primary as string).trim() === '') {
    colors.primary = DEFAULT_COLOR;
  }
  if (typeof colors.secondary !== 'string' || (colors.secondary as string).trim() === '') {
    colors.secondary = DEFAULT_COLOR;
  }
  if (typeof colors.accent !== 'string' || (colors.accent as string).trim() === '') {
    colors.accent = DEFAULT_COLOR;
  }

  // Background colors
  if (!isPlainObject(colors.background)) {
    colors.background = {};
  }
  const bg = colors.background as Record<string, unknown>;
  if (typeof bg.default !== 'string' || (bg.default as string).trim() === '') {
    bg.default = DEFAULT_COLOR;
  }
  if (typeof bg.alt !== 'string' || (bg.alt as string).trim() === '') {
    bg.alt = DEFAULT_COLOR;
  }

  // Text colors
  if (!isPlainObject(colors.text)) {
    colors.text = {};
  }
  const text = colors.text as Record<string, unknown>;
  if (typeof text.heading !== 'string' || (text.heading as string).trim() === '') {
    text.heading = DEFAULT_COLOR;
  }
  if (typeof text.body !== 'string' || (text.body as string).trim() === '') {
    text.body = DEFAULT_COLOR;
  }

  // 5.4: Fill missing typography fonts
  if (!isPlainObject(theme.typography)) {
    theme.typography = {};
  }
  const typography = theme.typography as Record<string, unknown>;
  if (!isPlainObject(typography.fonts)) {
    typography.fonts = {};
  }
  const fonts = typography.fonts as Record<string, unknown>;
  if (typeof fonts.heading !== 'string' || (fonts.heading as string).trim() === '') {
    fonts.heading = DEFAULT_FONT;
  }
  if (typeof fonts.body !== 'string' || (fonts.body as string).trim() === '') {
    fonts.body = DEFAULT_FONT;
  }

  // 5.5: Fill missing typography scale and weights
  if (!isNonEmptyRecord(typography.scale)) {
    typography.scale = { body: '1rem' };
  }
  if (!isNonEmptyRecord(typography.weights)) {
    typography.weights = { regular: 400 };
  }

  // 5.6: Fill missing shapes
  if (!isPlainObject(theme.shapes)) {
    theme.shapes = {};
  }
  const shapes = theme.shapes as Record<string, unknown>;
  if (!isNonEmptyRecord(shapes.borderRadius)) {
    shapes.borderRadius = { medium: '8px' };
  }
  if (!isNonEmptyRecord(shapes.shadow)) {
    shapes.shadow = { medium: '0 2px 4px rgba(0,0,0,0.1)' };
  }
  if (!isNonEmptyRecord(shapes.border)) {
    shapes.border = { thin: '1px solid #e5e5e5' };
  }

  // 5.7: Fill missing components
  if (!isPlainObject(theme.components)) {
    theme.components = {};
  }

  // 5.8: Unknown/extra properties are already preserved via deep clone

  // ─── Task 6: Valid/invalid determination ───────────────────────────

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    theme: theme as ThemeJson,
  };
}
