/**
 * Plan Validator - Structural validation rules for plan data.
 *
 * Story Reference: 22-1 Task 1 - Create plan-validator.ts with 4 validation rules
 * Architecture Reference: notes/architecture/architecture.md#ADR-002 - Extension host as source of truth
 *
 * AC-22.1.1: Synchronous validation engine producing ValidationWarning[]
 * AC-22.1.2: empty-section rule (FR24)
 * AC-22.1.3: missing-cta rule (FR25)
 * AC-22.1.4: low-confidence rule (FR26)
 * AC-22.1.5: missing-field rule (FR27)
 * AC-22.1.6: ValidationWarning type shape
 * AC-22.1.14: <10ms for 50 slides
 */

import type { PlanData, TemplateScore, ValidationWarning } from '../shared/types';
import { getAgendaSections, getSlideIntent, getSlideTemplate } from '../shared/types';

// =============================================================================
// Validation Rule Interface
// =============================================================================

export interface ValidationRule {
  id: string;
  check: (plan: PlanData, scores?: Record<number, TemplateScore[]>) => ValidationWarning[];
}

// =============================================================================
// Rules
// =============================================================================

/**
 * AC-22.1.2 (FR24): If an agenda section has zero slides assigned to it,
 * produce a warning with sectionId and type: 'empty-section'.
 */
const emptySection: ValidationRule = {
  id: 'empty-section',
  check: (plan) => {
    const sections = getAgendaSections(plan);
    const slides = plan.slides ?? [];
    const warnings: ValidationWarning[] = [];

    for (const section of sections) {
      const hasSlides = slides.some((s) => s.agenda_section_id === section.id);
      if (!hasSlides) {
        warnings.push({
          sectionId: section.id,
          type: 'empty-section',
          message: `Section '${section.title}' has no slides`,
          severity: 'warning',
        });
      }
    }

    return warnings;
  },
};

/**
 * AC-22.1.3 (FR25): If no slide has storyline_role: "cta",
 * produce a deck-level warning (no slideNumber or sectionId).
 */
const missingCta: ValidationRule = {
  id: 'missing-cta',
  check: (plan) => {
    const slides = plan.slides ?? [];
    if (slides.length === 0) return [];

    const hasCta = slides.some((s) => s.storyline_role === 'cta');
    if (!hasCta) {
      return [
        {
          type: 'missing-cta',
          message: 'No CTA slide — assign a call-to-action storyline role to at least one slide',
          severity: 'warning',
        },
      ];
    }

    return [];
  },
};

/**
 * AC-22.1.4 (FR26): If a slide's best template confidence score < 50%,
 * produce a warning with slideNumber. Returns [] if scores unavailable.
 */
const lowConfidence: ValidationRule = {
  id: 'low-confidence',
  check: (plan, scores) => {
    if (!scores) return [];

    const slides = plan.slides ?? [];
    const warnings: ValidationWarning[] = [];

    for (const slide of slides) {
      const slideScores = scores[slide.number];
      if (!slideScores || slideScores.length === 0) continue;

      const bestScore = slideScores[0].score;
      if (bestScore < 50) {
        warnings.push({
          slideNumber: slide.number,
          type: 'low-confidence',
          message: `Slide ${slide.number}: Low template confidence (${bestScore}%)`,
          severity: 'warning',
        });
      }
    }

    return warnings;
  },
};

/**
 * AC-22.1.5 (FR27): If a slide's intent or template field is empty/whitespace-only,
 * produce a warning with slideNumber and type: 'missing-field'.
 */
const missingField: ValidationRule = {
  id: 'missing-field',
  check: (plan) => {
    const slides = plan.slides ?? [];
    const warnings: ValidationWarning[] = [];

    for (const slide of slides) {
      const intent = getSlideIntent(slide);
      const template = getSlideTemplate(slide);

      if (!intent || !intent.trim()) {
        warnings.push({
          slideNumber: slide.number,
          type: 'missing-field',
          message: `Slide ${slide.number}: Description is empty`,
          severity: 'warning',
        });
      }

      if (!template || !template.trim()) {
        warnings.push({
          slideNumber: slide.number,
          type: 'missing-field',
          message: `Slide ${slide.number}: Template is empty`,
          severity: 'warning',
        });
      }
    }

    return warnings;
  },
};

// =============================================================================
// Exported Rules Array and Validate Function
// =============================================================================

/** All plan-level validation rules, exported for testability (AC-22.1.1) */
export const VALIDATION_RULES: ValidationRule[] = [
  emptySection,
  missingCta,
  lowConfidence,
  missingField,
];

/**
 * Run all plan-level validation rules synchronously.
 *
 * @param plan - The plan data to validate
 * @param scores - Optional template confidence scores (for low-confidence rule)
 * @returns Combined ValidationWarning[] from all rules
 */
export function validatePlan(
  plan: PlanData,
  scores?: Record<number, TemplateScore[]>
): ValidationWarning[] {
  return VALIDATION_RULES.flatMap((rule) => rule.check(plan, scores));
}
