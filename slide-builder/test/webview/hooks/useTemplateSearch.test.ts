/**
 * Tests for useTemplateSearch hook and template filtering utilities.
 * Story Reference: cv-5-1 Task 6 — useTemplateSearch hook
 */

import { describe, it, expect } from 'vitest';
import {
  filterTemplatesBySearch,
  filterTemplatesByCategory,
} from '../../../src/webview/catalog/context/CatalogContext';
import type { SlideTemplateDisplay } from '../../../src/shared/types';

const mockSlideTemplates: SlideTemplateDisplay[] = [
  {
    id: 'title-basic',
    name: 'Basic Title',
    description: 'Simple centered title slide',
    use_cases: ['Opening slides'],
    category: 'Title',
  },
  {
    id: 'content-bullets',
    name: 'Bullet Points',
    description: 'Standard content slide with bullets',
    use_cases: ['Body content'],
    category: 'Content',
  },
  {
    id: 'data-chart',
    name: 'Chart Slide',
    description: 'Data visualization with charts',
    use_cases: ['Data presentation'],
    category: 'Data',
  },
  {
    id: 'image-full',
    name: 'Full Bleed Image',
    description: 'Edge-to-edge image slide',
    use_cases: ['Visual impact'],
    category: 'Image',
  },
];

describe('filterTemplatesBySearch', () => {
  it('returns all templates when query empty', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, '');
    expect(result).toHaveLength(4);
  });

  it('returns all templates when query is whitespace only', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, '   ');
    expect(result).toHaveLength(4);
  });

  it('filters by name match', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, 'Title');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('title-basic');
  });

  it('filters by description match', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, 'bullets');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('content-bullets');
  });

  it('filter is case-insensitive', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, 'CHART');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('data-chart');
  });

  it('returns empty array when no matches', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('matches partial strings', () => {
    const result = filterTemplatesBySearch(mockSlideTemplates, 'Bullet');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('content-bullets');
  });

  it('handles templates with empty description', () => {
    const templatesWithEmpty = [
      { id: 'test', name: 'Test', description: '', use_cases: [], category: 'Test' },
    ];
    const result = filterTemplatesBySearch(templatesWithEmpty, 'Test');
    expect(result).toHaveLength(1);
  });
});

describe('filterTemplatesByCategory', () => {
  it('returns all templates when category is null', () => {
    const result = filterTemplatesByCategory(mockSlideTemplates, null);
    expect(result).toHaveLength(4);
  });

  it('filters by category', () => {
    const result = filterTemplatesByCategory(mockSlideTemplates, 'Title');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('title-basic');
  });

  it('returns empty array when category has no matches', () => {
    const result = filterTemplatesByCategory(mockSlideTemplates, 'NonexistentCategory');
    expect(result).toHaveLength(0);
  });

  it('is case-sensitive for category matching', () => {
    const result = filterTemplatesByCategory(mockSlideTemplates, 'title'); // lowercase
    expect(result).toHaveLength(0);
  });

  it('filters multiple templates with same category', () => {
    const templatesWithDuplicateCategory = [
      ...mockSlideTemplates,
      {
        id: 'title-fancy',
        name: 'Fancy Title',
        description: 'Decorative title',
        use_cases: [],
        category: 'Title',
      },
    ];
    const result = filterTemplatesByCategory(templatesWithDuplicateCategory, 'Title');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain('title-basic');
    expect(result.map((t) => t.id)).toContain('title-fancy');
  });
});

describe('Combined filtering', () => {
  it('search and category filters work together', () => {
    // First filter by category
    let result = filterTemplatesByCategory(mockSlideTemplates, 'Content');
    // Then filter by search
    result = filterTemplatesBySearch(result, 'bullets');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('content-bullets');
  });

  it('returns empty when filters exclude all', () => {
    let result = filterTemplatesByCategory(mockSlideTemplates, 'Title');
    result = filterTemplatesBySearch(result, 'bullets');
    expect(result).toHaveLength(0);
  });
});
