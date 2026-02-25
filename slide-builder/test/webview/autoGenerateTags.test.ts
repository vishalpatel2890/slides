/**
 * Tests for autoGenerateTags utility.
 *
 * Story Reference: cv-4-4 AC-30
 */

import { describe, it, expect } from 'vitest';
import { autoGenerateTags, suggestAssetType } from '../../src/webview/catalog/utils/autoGenerateTags';

describe('autoGenerateTags', () => {
  it('splits filename on hyphens', () => {
    const tags = autoGenerateTags('company-logo-dark.png', 'logo');
    expect(tags).toContain('company');
    expect(tags).toContain('dark');
  });

  it('splits filename on underscores', () => {
    const tags = autoGenerateTags('user_avatar_small.png', 'icon');
    expect(tags).toContain('user');
    expect(tags).toContain('avatar');
    expect(tags).toContain('small');
  });

  it('splits camelCase words', () => {
    const tags = autoGenerateTags('brandLogoLight.svg', 'logo');
    expect(tags).toContain('brand');
    expect(tags).toContain('light');
  });

  it('adds asset type as a tag', () => {
    const tags = autoGenerateTags('myfile.png', 'icon');
    expect(tags).toContain('icon');
  });

  it('does not duplicate asset type if already in filename', () => {
    const tags = autoGenerateTags('icon-menu.svg', 'icon');
    const iconCount = tags.filter((t) => t === 'icon').length;
    expect(iconCount).toBe(1);
  });

  it('removes file extension', () => {
    const tags = autoGenerateTags('test-image.png', 'image');
    expect(tags).not.toContain('png');
    expect(tags).not.toContain('.png');
  });

  it('filters out single character parts', () => {
    const tags = autoGenerateTags('a-b-test.png', 'image');
    expect(tags).not.toContain('a');
    expect(tags).not.toContain('b');
    expect(tags).toContain('test');
  });

  it('filters out common noise words', () => {
    const tags = autoGenerateTags('the-and-or-logo.png', 'logo');
    expect(tags).not.toContain('the');
    expect(tags).not.toContain('and');
    expect(tags).not.toContain('or');
  });

  it('converts all parts to lowercase', () => {
    // Using simple filename to avoid 5-tag limit cutting off results
    const tags = autoGenerateTags('Brand-DARK.png', 'logo');
    expect(tags).toContain('brand');
    expect(tags).toContain('dark');
    expect(tags).not.toContain('Brand');
    expect(tags).not.toContain('DARK');
  });

  it('limits to 5 tags maximum', () => {
    const tags = autoGenerateTags('one-two-three-four-five-six-seven.png', 'image');
    expect(tags.length).toBeLessThanOrEqual(5);
  });

  it('returns at least the asset type for simple filenames', () => {
    const tags = autoGenerateTags('a.png', 'image');
    expect(tags).toContain('image');
  });

  it('handles filenames with spaces', () => {
    const tags = autoGenerateTags('my file name.png', 'image');
    expect(tags).toContain('my');
    expect(tags).toContain('file');
    expect(tags).toContain('name');
  });
});

describe('suggestAssetType', () => {
  it('suggests "icon" when path contains "icon"', () => {
    expect(suggestAssetType('/assets/icons/menu.svg')).toBe('icon');
    expect(suggestAssetType('icon-menu.svg')).toBe('icon');
    expect(suggestAssetType('/path/to/iconset/file.png')).toBe('icon');
  });

  it('suggests "logo" when path contains "logo"', () => {
    expect(suggestAssetType('/brand/logos/company.png')).toBe('logo');
    expect(suggestAssetType('company-logo.svg')).toBe('logo');
    expect(suggestAssetType('Logo_Dark.png')).toBe('logo');
  });

  it('suggests "image" as default fallback', () => {
    expect(suggestAssetType('/photos/beach.jpg')).toBe('image');
    expect(suggestAssetType('photo.png')).toBe('image');
    expect(suggestAssetType('/assets/background.webp')).toBe('image');
  });

  it('is case-insensitive', () => {
    expect(suggestAssetType('/ICONS/menu.svg')).toBe('icon');
    expect(suggestAssetType('/LOGO/company.png')).toBe('logo');
  });

  it('prioritizes "icon" over "logo" if both present', () => {
    // icon appears first in the check order
    expect(suggestAssetType('/icons/logo-icon.svg')).toBe('icon');
  });
});
