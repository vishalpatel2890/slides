/**
 * Template Matcher - Confidence scoring engine for template selection.
 *
 * Story Reference: 20-2 Task 2 - Implement template-matcher scoring engine
 * Architecture Reference: notes/architecture/architecture.md#Pattern 2: Template Confidence Scoring
 *
 * AC-20.2.6: Tokenizes slide intent + key_points, compares against template
 *            use_cases (x2.0) and description (x1.0), normalizes to 0-100
 * AC-20.2.7: Completes within 50ms per slide
 */

import type { SlideEntry, TemplateCatalogEntry, TemplateScore } from '../shared/types';
import { getSlideIntent } from '../shared/types';

// =============================================================================
// Tokenization
// =============================================================================

/**
 * Tokenize text into lowercase words, removing punctuation.
 * Splits on whitespace and strips non-alphanumeric characters.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1); // Skip single-char tokens
}

// =============================================================================
// Scoring
// =============================================================================

/**
 * Compute confidence scores for a single slide against all templates.
 *
 * Algorithm:
 * 1. Tokenize slide intent + key_points
 * 2. For each template:
 *    a. Tokenize use_cases (weight x2.0) and description (weight x1.0)
 *    b. Count matching tokens
 *    c. Normalize: score = weighted_matches / max_possible * 100
 *    d. Assign tier: >=80 high, 50-79 medium, <50 low
 * 3. Sort by score descending
 *
 * @param slide - The slide to score
 * @param catalog - Template catalog entries
 * @returns Sorted TemplateScore[] (best match first)
 */
export function computeConfidenceScores(
  slide: SlideEntry,
  catalog: TemplateCatalogEntry[]
): TemplateScore[] {
  // Build slide tokens from intent + key_points
  const slideText = [
    getSlideIntent(slide),
    ...(slide.key_points ?? []),
  ].join(' ');
  const slideTokens = tokenize(slideText);

  if (slideTokens.length === 0) {
    // No content to match — return all templates with 0 score
    return catalog.map((t) => ({
      templateId: t.id,
      templateName: t.name,
      score: 0,
      tier: 'low' as const,
      description: t.description,
    }));
  }

  // Create a Set for O(1) lookup
  const slideTokenSet = new Set(slideTokens);

  const scores: TemplateScore[] = catalog.map((template) => {
    // Tokenize template fields separately for weighted scoring
    const useCaseTokens = tokenize(template.use_cases.join(' '));
    const descriptionTokens = tokenize(template.description);

    // Count matches with weights
    let weightedMatches = 0;
    let maxPossible = 0;

    // use_cases matches (weight x2.0)
    for (const token of useCaseTokens) {
      maxPossible += 2.0;
      if (slideTokenSet.has(token)) {
        weightedMatches += 2.0;
      }
    }

    // description matches (weight x1.0)
    for (const token of descriptionTokens) {
      maxPossible += 1.0;
      if (slideTokenSet.has(token)) {
        weightedMatches += 1.0;
      }
    }

    // Normalize to 0-100
    const score = maxPossible > 0
      ? Math.round((weightedMatches / maxPossible) * 100)
      : 0;

    // Assign tier
    const tier: 'high' | 'medium' | 'low' =
      score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

    return {
      templateId: template.id,
      templateName: template.name,
      score,
      tier,
      description: template.description,
    };
  });

  // Sort by score descending (best match first)
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

/**
 * Compute confidence scores for all slides in a plan.
 *
 * @param slides - All slides in the plan
 * @param catalog - Template catalog entries
 * @returns Record mapping slide number to sorted TemplateScore[]
 */
export function computeAllConfidenceScores(
  slides: SlideEntry[],
  catalog: TemplateCatalogEntry[]
): Record<number, TemplateScore[]> {
  const result: Record<number, TemplateScore[]> = {};

  for (const slide of slides) {
    result[slide.number] = computeConfidenceScores(slide, catalog);
  }

  return result;
}
