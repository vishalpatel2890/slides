/**
 * Shared Types - Schema Enforcement Tests
 *
 * Tests for validateSlide, validatePlan, and normalizeDescription
 * from src/shared/types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDescription,
  validateSlide,
  validatePlan,
  isWebviewMessage,
  isThemeEditorWebviewMessage,
  isThemeEditorExtensionMessage,
  type SlideEntry,
  type ThemeJson,
} from '../../src/shared/types';

// =============================================================================
// normalizeDescription
// =============================================================================

describe('normalizeDescription', () => {
  it('collapses newlines to single space', () => {
    expect(normalizeDescription('Line one\nLine two')).toBe('Line one Line two');
  });

  it('collapses multiple newlines to single space', () => {
    expect(normalizeDescription('Line one\n\n\nLine two')).toBe('Line one Line two');
  });

  it('collapses multiple spaces to single space', () => {
    expect(normalizeDescription('Too   many   spaces')).toBe('Too many spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeDescription('  padded  ')).toBe('padded');
  });

  it('handles mixed whitespace', () => {
    expect(normalizeDescription('  Line one\n  Line two  \n\n  Line three  '))
      .toBe('Line one Line two Line three');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeDescription('')).toBe('');
  });

  it('returns single-line input unchanged (trimmed)', () => {
    expect(normalizeDescription('Already single line')).toBe('Already single line');
  });
});

// =============================================================================
// validateSlide
// =============================================================================

describe('validateSlide', () => {
  const validSlide: SlideEntry = {
    number: 1,
    description: 'Opening impact statement',
    suggested_template: 'title',
    status: 'pending',
    storyline_role: 'opening',
    agenda_section_id: 'agenda-1',
    key_points: ['Main point'],
  };

  it('returns no warnings for valid slide', () => {
    expect(validateSlide(validSlide)).toEqual([]);
  });

  it('warns on empty description', () => {
    const slide = { ...validSlide, description: '' };
    const warnings = validateSlide(slide);
    expect(warnings).toContainEqual(
      expect.objectContaining({ type: 'empty-description', slideNumber: 1 })
    );
  });

  it('warns on multiline description', () => {
    const slide = { ...validSlide, description: 'Line one\nLine two' };
    const warnings = validateSlide(slide);
    expect(warnings).toContainEqual(
      expect.objectContaining({ type: 'multiline-description', slideNumber: 1 })
    );
  });

  it('warns on empty key_points', () => {
    const slide = { ...validSlide, key_points: [] };
    const warnings = validateSlide(slide);
    expect(warnings).toContainEqual(
      expect.objectContaining({ type: 'empty-key-points', slideNumber: 1 })
    );
  });

  it('supports legacy intent field via getSlideIntent', () => {
    const slide = { ...validSlide, description: undefined as any, intent: 'Legacy intent' };
    const warnings = validateSlide(slide);
    // Should not warn about empty description since intent is present
    expect(warnings.find(w => w.type === 'empty-description')).toBeUndefined();
  });

  it('returns multiple warnings for multiple issues', () => {
    const slide = { ...validSlide, description: '', key_points: [] };
    const warnings = validateSlide(slide);
    expect(warnings.length).toBe(2);
  });
});

// =============================================================================
// validatePlan
// =============================================================================

describe('validatePlan', () => {
  it('returns no warnings for valid plan', () => {
    const slides: SlideEntry[] = [
      {
        number: 1,
        description: 'Title slide',
        suggested_template: 'title',
        status: 'pending',
        storyline_role: 'opening',
        agenda_section_id: 'agenda-1',
        key_points: ['Point A'],
      },
      {
        number: 2,
        description: 'Content slide',
        suggested_template: 'content',
        status: 'pending',
        storyline_role: 'evidence',
        agenda_section_id: 'agenda-2',
        key_points: ['Point B'],
      },
    ];

    expect(validatePlan(slides)).toEqual([]);
  });

  it('aggregates warnings across slides', () => {
    const slides: SlideEntry[] = [
      {
        number: 1,
        description: '',
        suggested_template: 'title',
        status: 'pending',
        storyline_role: 'opening',
        agenda_section_id: 'agenda-1',
        key_points: [],
      },
      {
        number: 2,
        description: 'Valid',
        suggested_template: 'content',
        status: 'pending',
        storyline_role: 'evidence',
        agenda_section_id: 'agenda-2',
        key_points: [],
      },
    ];

    const warnings = validatePlan(slides);
    // Slide 1: empty-description + empty-key-points = 2
    // Slide 2: empty-key-points = 1
    expect(warnings.length).toBe(3);
  });

  it('returns empty array for empty slides array', () => {
    expect(validatePlan([])).toEqual([]);
  });
});

// =============================================================================
// isWebviewMessage - Type Guard Tests (AC-23.2.12, AC-23.2.13)
// =============================================================================

describe('isWebviewMessage', () => {
  it('returns true for open-claude message without slideNumber (AC-23.2.12)', () => {
    const msg = { type: 'open-claude' };
    expect(isWebviewMessage(msg)).toBe(true);
  });

  it('returns true for open-claude message with slideNumber (AC-23.2.13)', () => {
    const msg = { type: 'open-claude', slideNumber: 5 };
    expect(isWebviewMessage(msg)).toBe(true);
  });

  it('returns true for edit-slide message', () => {
    const msg = { type: 'edit-slide', slideNumber: 1, field: 'description', value: 'test' };
    expect(isWebviewMessage(msg)).toBe(true);
  });

  it('returns true for ready message', () => {
    const msg = { type: 'ready' };
    expect(isWebviewMessage(msg)).toBe(true);
  });

  it('returns false for unknown message type', () => {
    const msg = { type: 'unknown-type' };
    expect(isWebviewMessage(msg)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isWebviewMessage('not-an-object')).toBe(false);
    expect(isWebviewMessage(null)).toBe(false);
    expect(isWebviewMessage(undefined)).toBe(false);
  });

  it('returns false for object without type', () => {
    const msg = { slideNumber: 1 };
    expect(isWebviewMessage(msg)).toBe(false);
  });
});

// =============================================================================
// isThemeEditorWebviewMessage - Type Guard Tests (bt-2-1 Task 7.1, AC-6)
// =============================================================================

describe('isThemeEditorWebviewMessage', () => {
  it('returns true for theme-editor-ready message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-ready' })).toBe(true);
  });

  it('returns true for theme-editor-save message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-save', theme: {} })).toBe(true);
  });

  it('returns true for theme-editor-revert message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-revert' })).toBe(true);
  });

  it('returns true for theme-editor-dirty message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-dirty', isDirty: true })).toBe(true);
  });

  it('returns true for theme-editor-launch-edit message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-launch-edit' })).toBe(true);
  });

  it('returns true for theme-editor-launch-setup message', () => {
    expect(isThemeEditorWebviewMessage({ type: 'theme-editor-launch-setup' })).toBe(true);
  });

  it('returns false for unknown message type', () => {
    expect(isThemeEditorWebviewMessage({ type: 'unknown-type' })).toBe(false);
  });

  it('returns false for non-theme-editor message type', () => {
    expect(isThemeEditorWebviewMessage({ type: 'ready' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isThemeEditorWebviewMessage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isThemeEditorWebviewMessage(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isThemeEditorWebviewMessage('theme-editor-ready')).toBe(false);
    expect(isThemeEditorWebviewMessage(42)).toBe(false);
  });

  it('returns false for object without type field', () => {
    expect(isThemeEditorWebviewMessage({ isDirty: true })).toBe(false);
  });

  it('returns false for object with non-string type', () => {
    expect(isThemeEditorWebviewMessage({ type: 123 })).toBe(false);
  });
});

// =============================================================================
// isThemeEditorExtensionMessage - Type Guard Tests (bt-2-1 Task 7.2, AC-6)
// =============================================================================

describe('isThemeEditorExtensionMessage', () => {
  it('returns true for theme-editor-data message with theme', () => {
    expect(isThemeEditorExtensionMessage({
      type: 'theme-editor-data',
      theme: { name: 'Test', version: '1.0' },
      exists: true,
    })).toBe(true);
  });

  it('returns true for theme-editor-data message with null theme', () => {
    expect(isThemeEditorExtensionMessage({
      type: 'theme-editor-data',
      theme: null,
      exists: false,
    })).toBe(true);
  });

  it('returns true for theme-editor-save-result success', () => {
    expect(isThemeEditorExtensionMessage({
      type: 'theme-editor-save-result',
      success: true,
    })).toBe(true);
  });

  it('returns true for theme-editor-save-result failure with error', () => {
    expect(isThemeEditorExtensionMessage({
      type: 'theme-editor-save-result',
      success: false,
      error: 'Permission denied',
    })).toBe(true);
  });

  it('returns true for theme-editor-external-change message', () => {
    expect(isThemeEditorExtensionMessage({
      type: 'theme-editor-external-change',
      theme: { name: 'Updated', version: '2.0' },
    })).toBe(true);
  });

  it('returns false for unknown message type', () => {
    expect(isThemeEditorExtensionMessage({ type: 'unknown-type' })).toBe(false);
  });

  it('returns false for webview message type (wrong direction)', () => {
    expect(isThemeEditorExtensionMessage({ type: 'theme-editor-ready' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isThemeEditorExtensionMessage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isThemeEditorExtensionMessage(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isThemeEditorExtensionMessage('theme-editor-data')).toBe(false);
    expect(isThemeEditorExtensionMessage(42)).toBe(false);
  });

  it('returns false for object without type field', () => {
    expect(isThemeEditorExtensionMessage({ theme: null, exists: false })).toBe(false);
  });
});

// =============================================================================
// ThemeJson Interface - TypeScript Compilation Check (bt-2-1 Task 7.3)
// =============================================================================

describe('ThemeJson interface', () => {
  it('accepts a fully populated theme object', () => {
    const theme: ThemeJson = {
      name: 'Corporate Blue',
      version: '1.0.0',
      colors: {
        primary: '#0066cc',
        secondary: '#003366',
        accent: '#ff6600',
        background: { default: '#ffffff', alt: '#f5f5f5', dark: '#1a1a2e' },
        text: { heading: '#111111', body: '#333333', onDark: '#ffffff' },
      },
      typography: {
        fonts: { heading: 'Inter', body: 'Open Sans' },
        scale: { sm: '0.875rem', base: '1rem', lg: '1.25rem' },
        weights: { normal: 400, bold: 700 },
      },
      shapes: {
        borderRadius: { sm: '4px', md: '8px', lg: '12px' },
        shadow: { sm: '0 1px 2px rgba(0,0,0,0.1)' },
        border: { default: '1px solid #e0e0e0' },
      },
      components: {
        box: { default: { background: '#ffffff', border: '1px solid #e0e0e0' } },
      },
    };
    // TypeScript compilation check -- if this compiles, the interface is correct
    expect(theme.name).toBe('Corporate Blue');
  });

  it('preserves unknown properties via index signature', () => {
    const theme: ThemeJson = {
      name: 'Test',
      version: '1.0',
      colors: {
        primary: '#000',
        secondary: '#000',
        accent: '#000',
        background: { default: '#fff', alt: '#eee', dark: '#000' },
        text: { heading: '#000', body: '#333', onDark: '#fff' },
      },
      typography: {
        fonts: { heading: 'Arial', body: 'Arial' },
        scale: {},
        weights: {},
      },
      shapes: { borderRadius: {}, shadow: {}, border: {} },
      components: {},
      // Unknown property -- should be allowed by [key: string]: unknown
      customPlugin: { enabled: true, version: '2.0' },
    };
    expect(theme.customPlugin).toEqual({ enabled: true, version: '2.0' });
  });
});
