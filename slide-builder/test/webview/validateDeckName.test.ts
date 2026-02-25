/**
 * Tests for validateDeckSlug utility.
 * Story Reference: rename-deck-2 AC-3
 */

import { describe, it, expect } from 'vitest';
import { validateDeckSlug, toSlug } from '../../src/webview/catalog/utils/validateDeckName';

const existingIds = ['my-deck', 'another-deck', 'test-deck'];

describe('validateDeckSlug', () => {
  // AC-3: Empty slug
  it('rejects empty string', () => {
    expect(validateDeckSlug('', existingIds, 'old-deck')).toBe(
      'Directory slug cannot be empty',
    );
  });

  it('rejects whitespace-only string', () => {
    expect(validateDeckSlug('   ', existingIds, 'old-deck')).toBe(
      'Directory slug cannot be empty',
    );
  });

  // AC-3: Invalid filesystem characters
  it('rejects slug with forward slash', () => {
    const result = validateDeckSlug('foo/bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with backslash', () => {
    const result = validateDeckSlug('foo\\bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with colon', () => {
    const result = validateDeckSlug('foo:bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with asterisk', () => {
    const result = validateDeckSlug('foo*bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with question mark', () => {
    const result = validateDeckSlug('foo?bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with double quote', () => {
    const result = validateDeckSlug('foo"bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  it('rejects slug with angle brackets', () => {
    expect(validateDeckSlug('foo<bar', existingIds, 'old-deck')).toContain('invalid characters');
    expect(validateDeckSlug('foo>bar', existingIds, 'old-deck')).toContain('invalid characters');
  });

  it('rejects slug with pipe', () => {
    const result = validateDeckSlug('foo|bar', existingIds, 'old-deck');
    expect(result).toContain('invalid characters');
  });

  // AC-3: Spaces not allowed in slugs
  it('rejects slug with spaces', () => {
    expect(validateDeckSlug('my deck', existingIds, 'old-deck')).toBe(
      'Directory slug cannot contain spaces',
    );
  });

  // AC-3: Max length
  it('rejects slug exceeding 255 characters', () => {
    const longSlug = 'a'.repeat(256);
    expect(validateDeckSlug(longSlug, existingIds, 'old-deck')).toBe(
      'Directory slug is too long (max 255 characters)',
    );
  });

  // AC-3: Duplicate check (case-insensitive)
  it('rejects duplicate ID (exact match)', () => {
    expect(validateDeckSlug('my-deck', existingIds, 'old-deck')).toBe(
      'A deck with this directory name already exists',
    );
  });

  it('rejects duplicate ID (case-insensitive)', () => {
    expect(validateDeckSlug('MY-DECK', existingIds, 'old-deck')).toBe(
      'A deck with this directory name already exists',
    );
  });

  it('rejects duplicate ID (mixed case)', () => {
    expect(validateDeckSlug('Another-Deck', existingIds, 'old-deck')).toBe(
      'A deck with this directory name already exists',
    );
  });

  // Same-as-current (no-op, valid)
  it('allows same slug as current (no-op rename)', () => {
    expect(validateDeckSlug('my-deck', existingIds, 'my-deck')).toBeNull();
  });

  it('allows same slug case-insensitively as current', () => {
    expect(validateDeckSlug('MY-DECK', existingIds, 'my-deck')).toBeNull();
  });

  // Valid slugs
  it('accepts valid slug', () => {
    expect(validateDeckSlug('new-deck', existingIds, 'old-deck')).toBeNull();
  });

  it('accepts slug at exactly 255 characters', () => {
    const maxSlug = 'a'.repeat(255);
    expect(validateDeckSlug(maxSlug, existingIds, 'old-deck')).toBeNull();
  });

  it('accepts slug with hyphens', () => {
    expect(validateDeckSlug('my-new-deck', existingIds, 'old-deck')).toBeNull();
  });

  it('accepts slug with underscores', () => {
    expect(validateDeckSlug('my_new_deck', existingIds, 'old-deck')).toBeNull();
  });

  it('accepts slug with numbers', () => {
    expect(validateDeckSlug('deck-2024-v2', existingIds, 'old-deck')).toBeNull();
  });
});

describe('toSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(toSlug('My New Deck')).toBe('my-new-deck');
  });

  it('lowercases the input', () => {
    expect(toSlug('MyDeck')).toBe('mydeck');
  });

  it('strips invalid characters', () => {
    expect(toSlug('Deck: A & B!')).toBe('deck-a-b');
  });

  it('collapses multiple hyphens', () => {
    expect(toSlug('Deck - - Name')).toBe('deck-name');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toSlug(' -My Deck- ')).toBe('my-deck');
  });

  it('handles empty string', () => {
    expect(toSlug('')).toBe('');
  });

  it('handles string with only invalid chars', () => {
    expect(toSlug('!@#$%')).toBe('');
  });

  it('preserves numbers', () => {
    expect(toSlug('Q4 2024 Report')).toBe('q4-2024-report');
  });
});
