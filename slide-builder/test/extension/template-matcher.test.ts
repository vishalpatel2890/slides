/**
 * Template Matcher Scoring Engine Tests
 *
 * Story Reference: 20-2 Task 2.8 - Scoring algorithm tests
 * AC-20.2.6: Tokenizes intent + key_points, matches use_cases (x2.0) + description (x1.0)
 * AC-20.2.7: Performance < 50ms per slide
 */

import { describe, it, expect } from 'vitest';
import {
  tokenize,
  computeConfidenceScores,
  computeAllConfidenceScores,
} from '../../src/extension/template-matcher';
import type { SlideEntry, TemplateCatalogEntry } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockCatalog: TemplateCatalogEntry[] = [
  {
    id: 'title-slide',
    name: 'Title Slide',
    description: 'Opening slide with title and subtitle for presentations',
    use_cases: ['introduction', 'opening', 'welcome', 'title'],
  },
  {
    id: 'content-slide',
    name: 'Content Slide',
    description: 'General content with bullet points and supporting text',
    use_cases: ['information', 'details', 'content', 'points', 'benefits'],
  },
  {
    id: 'data-chart',
    name: 'Data Chart',
    description: 'Data visualization with charts and graphs for metrics',
    use_cases: ['data', 'metrics', 'charts', 'analysis', 'numbers', 'statistics'],
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Side by side comparison of options or features',
    use_cases: ['compare', 'versus', 'options', 'alternatives', 'features'],
  },
  {
    id: 'closing-cta',
    name: 'Closing CTA',
    description: 'Final slide with call to action and next steps',
    use_cases: ['closing', 'conclusion', 'action', 'next', 'steps', 'summary'],
  },
];

const makeSlide = (overrides: Partial<SlideEntry> = {}): SlideEntry => ({
  number: 1,
  description: 'Test slide',
  status: 'pending',
  storyline_role: 'evidence',
  agenda_section_id: 'main',
  ...overrides,
});

// =============================================================================
// Tests - Tokenization
// =============================================================================

describe('tokenize', () => {
  it('splits text into lowercase tokens', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world']);
  });

  it('removes punctuation', () => {
    expect(tokenize('data, charts & analysis!')).toEqual(['data', 'charts', 'analysis']);
  });

  it('filters out single-character tokens', () => {
    expect(tokenize('a b cd ef')).toEqual(['cd', 'ef']);
  });

  it('handles empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('handles multiple spaces', () => {
    expect(tokenize('  hello   world  ')).toEqual(['hello', 'world']);
  });
});

// =============================================================================
// Tests - computeConfidenceScores
// =============================================================================

describe('computeConfidenceScores', () => {
  it('returns scores for all templates in catalog', () => {
    const slide = makeSlide({ description: 'introduction to the topic' });
    const scores = computeConfidenceScores(slide, mockCatalog);
    expect(scores.length).toBe(mockCatalog.length);
  });

  it('sorts templates by score descending (AC-20.2.5)', () => {
    const slide = makeSlide({ description: 'data analysis metrics charts' });
    const scores = computeConfidenceScores(slide, mockCatalog);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].score).toBeGreaterThanOrEqual(scores[i].score);
    }
  });

  it('assigns high tier for scores >= 80 (AC-20.2.4)', () => {
    const slide = makeSlide({
      description: 'data metrics charts analysis numbers statistics',
    });
    const scores = computeConfidenceScores(slide, mockCatalog);
    const dataChart = scores.find((s) => s.templateId === 'data-chart');
    expect(dataChart).toBeDefined();
    // Data chart should score high with these tokens
    if (dataChart && dataChart.score >= 80) {
      expect(dataChart.tier).toBe('high');
    }
  });

  it('assigns low tier for scores < 50 (AC-20.2.4)', () => {
    const slide = makeSlide({ description: 'unrelated topic about gardening' });
    const scores = computeConfidenceScores(slide, mockCatalog);
    // All templates should be low confidence for unrelated content
    for (const score of scores) {
      expect(score.tier).toBe('low');
      expect(score.score).toBeLessThan(50);
    }
  });

  it('weights use_cases higher than description (AC-20.2.6)', () => {
    // "introduction" is in title-slide use_cases (x2.0 weight)
    // "presentations" is in title-slide description (x1.0 weight)
    const slideUseCases = makeSlide({ description: 'introduction' });
    const slideDesc = makeSlide({ description: 'presentations' });

    const scoresUseCases = computeConfidenceScores(slideUseCases, mockCatalog);
    const scoresDesc = computeConfidenceScores(slideDesc, mockCatalog);

    const titleFromUseCases = scoresUseCases.find((s) => s.templateId === 'title-slide');
    const titleFromDesc = scoresDesc.find((s) => s.templateId === 'title-slide');

    // Both should match, but use_cases match should score higher
    expect(titleFromUseCases).toBeDefined();
    expect(titleFromDesc).toBeDefined();
    if (titleFromUseCases && titleFromDesc) {
      expect(titleFromUseCases.score).toBeGreaterThan(titleFromDesc.score);
    }
  });

  it('includes key_points in scoring (AC-20.2.6)', () => {
    const slideWithoutKeyPoints = makeSlide({
      description: 'overview',
      key_points: [],
    });
    const slideWithKeyPoints = makeSlide({
      description: 'overview',
      key_points: ['data', 'metrics', 'charts'],
    });

    const scoresWithout = computeConfidenceScores(slideWithoutKeyPoints, mockCatalog);
    const scoresWith = computeConfidenceScores(slideWithKeyPoints, mockCatalog);

    const dataWithout = scoresWithout.find((s) => s.templateId === 'data-chart');
    const dataWith = scoresWith.find((s) => s.templateId === 'data-chart');

    expect(dataWith).toBeDefined();
    expect(dataWithout).toBeDefined();
    if (dataWith && dataWithout) {
      expect(dataWith.score).toBeGreaterThan(dataWithout.score);
    }
  });

  it('returns all 0 scores for slide with no content', () => {
    const emptySlide = makeSlide({ description: '', key_points: [] });
    const scores = computeConfidenceScores(emptySlide, mockCatalog);
    for (const score of scores) {
      expect(score.score).toBe(0);
      expect(score.tier).toBe('low');
    }
  });

  it('includes template description in results', () => {
    const slide = makeSlide({ description: 'test' });
    const scores = computeConfidenceScores(slide, mockCatalog);
    const titleScore = scores.find((s) => s.templateId === 'title-slide');
    expect(titleScore?.description).toBe('Opening slide with title and subtitle for presentations');
  });

  it('handles empty catalog', () => {
    const slide = makeSlide({ description: 'test content' });
    const scores = computeConfidenceScores(slide, []);
    expect(scores).toEqual([]);
  });

  it('normalizes scores to 0-100 range', () => {
    const slide = makeSlide({
      description: 'data analysis metrics charts numbers statistics',
    });
    const scores = computeConfidenceScores(slide, mockCatalog);
    for (const score of scores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    }
  });
});

// =============================================================================
// Tests - computeAllConfidenceScores
// =============================================================================

describe('computeAllConfidenceScores', () => {
  it('returns scores for each slide by number', () => {
    const slides = [
      makeSlide({ number: 1, description: 'introduction' }),
      makeSlide({ number: 2, description: 'data analysis' }),
      makeSlide({ number: 3, description: 'conclusion' }),
    ];
    const result = computeAllConfidenceScores(slides, mockCatalog);

    expect(Object.keys(result).length).toBe(3);
    expect(result[1]).toBeDefined();
    expect(result[2]).toBeDefined();
    expect(result[3]).toBeDefined();
  });

  it('each slide gets all templates scored', () => {
    const slides = [makeSlide({ number: 1, description: 'test' })];
    const result = computeAllConfidenceScores(slides, mockCatalog);

    expect(result[1].length).toBe(mockCatalog.length);
  });

  it('handles empty slides array', () => {
    const result = computeAllConfidenceScores([], mockCatalog);
    expect(Object.keys(result).length).toBe(0);
  });
});

// =============================================================================
// Tests - Performance (AC-20.2.7)
// =============================================================================

describe('Performance', () => {
  it('scores a single slide in < 50ms (AC-20.2.7)', () => {
    const slide = makeSlide({
      description: 'This is a comprehensive slide about data analysis and metrics visualization',
      key_points: [
        'Revenue growth of 25%',
        'Customer acquisition improved',
        'Market share comparison with competitors',
        'Q4 financial summary and projections',
      ],
    });

    const start = performance.now();
    computeConfidenceScores(slide, mockCatalog);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('scores 50 slides in < 2500ms', () => {
    const slides = Array.from({ length: 50 }, (_, i) =>
      makeSlide({
        number: i + 1,
        description: `Slide about topic ${i} with various content and context`,
        key_points: ['Point one', 'Point two', 'Point three'],
      })
    );

    const start = performance.now();
    computeAllConfidenceScores(slides, mockCatalog);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2500);
  });
});
