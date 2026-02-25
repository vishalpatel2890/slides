/**
 * Tests for validateFolderName utility.
 * Story Reference: cv-3-6 AC-5
 */

import { describe, it, expect } from 'vitest';
import { validateFolderName } from '../../src/webview/catalog/utils/validateFolderName';

const existingNames = ['Marketing', 'Sales Decks', 'Archive'];

describe('validateFolderName', () => {
  // AC-5: Empty name
  it('rejects empty string', () => {
    expect(validateFolderName('', existingNames, 'Old Name')).toBe(
      'Folder name cannot be empty',
    );
  });

  it('rejects whitespace-only string', () => {
    expect(validateFolderName('   ', existingNames, 'Old Name')).toBe(
      'Folder name cannot be empty',
    );
  });

  // AC-5: Invalid filesystem characters
  it('rejects name with forward slash', () => {
    const result = validateFolderName('foo/bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with backslash', () => {
    const result = validateFolderName('foo\\bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with colon', () => {
    const result = validateFolderName('foo:bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with asterisk', () => {
    const result = validateFolderName('foo*bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with question mark', () => {
    const result = validateFolderName('foo?bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with double quote', () => {
    const result = validateFolderName('foo"bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  it('rejects name with angle brackets', () => {
    expect(validateFolderName('foo<bar', existingNames, 'Old Name')).toContain(
      'invalid characters',
    );
    expect(validateFolderName('foo>bar', existingNames, 'Old Name')).toContain(
      'invalid characters',
    );
  });

  it('rejects name with pipe', () => {
    const result = validateFolderName('foo|bar', existingNames, 'Old Name');
    expect(result).toContain('invalid characters');
  });

  // AC-5: Duplicate folder name (case-insensitive)
  it('rejects duplicate name (exact match)', () => {
    expect(validateFolderName('Marketing', existingNames, 'Old Name')).toBe(
      'A folder with this name already exists',
    );
  });

  it('rejects duplicate name (case-insensitive)', () => {
    expect(validateFolderName('marketing', existingNames, 'Old Name')).toBe(
      'A folder with this name already exists',
    );
  });

  it('rejects duplicate name (different case)', () => {
    expect(validateFolderName('SALES DECKS', existingNames, 'Old Name')).toBe(
      'A folder with this name already exists',
    );
  });

  // Max length
  it('rejects name exceeding 255 characters', () => {
    const longName = 'a'.repeat(256);
    expect(validateFolderName(longName, existingNames, 'Old Name')).toBe(
      'Folder name is too long (max 255 characters)',
    );
  });

  // Valid names
  it('accepts valid name', () => {
    expect(validateFolderName('New Folder', existingNames, 'Old Name')).toBeNull();
  });

  it('accepts name at exactly 255 characters', () => {
    const maxName = 'a'.repeat(255);
    expect(validateFolderName(maxName, existingNames, 'Old Name')).toBeNull();
  });

  // No-op rename (same name as current)
  it('allows same name as current (no-op rename)', () => {
    expect(validateFolderName('Marketing', existingNames, 'Marketing')).toBeNull();
  });

  it('allows same name case-insensitively as current', () => {
    expect(validateFolderName('marketing', existingNames, 'Marketing')).toBeNull();
  });

  // Names with spaces and special but valid characters
  it('accepts name with spaces', () => {
    expect(validateFolderName('My Folder Name', existingNames, 'Old Name')).toBeNull();
  });

  it('accepts name with hyphens and underscores', () => {
    expect(validateFolderName('my-folder_name', existingNames, 'Old Name')).toBeNull();
  });

  it('accepts name with parentheses', () => {
    expect(validateFolderName('Folder (Copy)', existingNames, 'Old Name')).toBeNull();
  });
});
