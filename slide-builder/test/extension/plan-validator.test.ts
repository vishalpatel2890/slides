/**
 * Plan Validator Tests
 *
 * Story Reference: 22-1 Task 1.7
 * Tests each validation rule independently and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { validatePlan, VALIDATION_RULES } from '../../src/extension/plan-validator';
import type { PlanData, TemplateScore } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

function makePlan(overrides: Partial<PlanData> = {}): PlanData {
  return {
    deck_name: 'Test Deck',
    created: '2026-01-01',
    last_modified: '2026-01-01',
    audience: { description: 'Test', knowledge_level: 'intermediate', priorities: [] },
    purpose: 'Testing',
    desired_outcome: 'Pass',
    key_message: 'Test',
    storyline: { opening_hook: '', tension: '', resolution: '', call_to_action: '' },
    recurring_themes: [],
    agenda_sections: [
      { id: 'section-1', title: 'Introduction', narrative_role: 'hook' },
      { id: 'section-2', title: 'Content', narrative_role: 'detail' },
    ],
    slides: [
      {
        number: 1,
        description: 'Opening slide',
        suggested_template: 'title-slide',
        status: 'pending',
        storyline_role: 'opening',
        agenda_section_id: 'section-1',
        key_points: ['Point A'],
      },
      {
        number: 2,
        description: 'Main content',
        suggested_template: 'content-block',
        status: 'pending',
        storyline_role: 'detail',
        agenda_section_id: 'section-2',
        key_points: ['Point B'],
      },
      {
        number: 3,
        description: 'Call to action',
        suggested_template: 'cta-slide',
        status: 'pending',
        storyline_role: 'cta',
        agenda_section_id: 'section-2',
        key_points: ['Take action'],
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// empty-section rule
// =============================================================================

describe('empty-section rule', () => {
  it('returns no warnings when all sections have slides', () => {
    const plan = makePlan();
    const warnings = validatePlan(plan);
    expect(warnings.filter((w) => w.type === 'empty-section')).toEqual([]);
  });

  it('warns when a section has no slides', () => {
    const plan = makePlan({
      agenda_sections: [
        { id: 'section-1', title: 'Introduction', narrative_role: 'hook' },
        { id: 'section-2', title: 'Content', narrative_role: 'detail' },
        { id: 'section-3', title: 'Empty Section', narrative_role: 'transition' },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'empty-section');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual(
      expect.objectContaining({
        sectionId: 'section-3',
        type: 'empty-section',
        message: "Section 'Empty Section' has no slides",
        severity: 'warning',
      })
    );
  });

  it('warns for multiple empty sections', () => {
    const plan = makePlan({
      agenda_sections: [
        { id: 'section-1', title: 'Intro', narrative_role: 'hook' },
        { id: 'empty-a', title: 'Empty A', narrative_role: 'detail' },
        { id: 'empty-b', title: 'Empty B', narrative_role: 'cta' },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'empty-section');
    expect(warnings).toHaveLength(2);
  });

  it('returns no warnings when no agenda sections defined', () => {
    const plan = makePlan({ agenda_sections: undefined });
    const warnings = validatePlan(plan).filter((w) => w.type === 'empty-section');
    expect(warnings).toEqual([]);
  });

  it('supports nested agenda.sections format', () => {
    const plan = makePlan({
      agenda_sections: undefined,
      agenda: {
        total_sections: 2,
        sections: [
          { id: 'section-1', title: 'Intro', narrative_role: 'hook' },
          { id: 'no-slides', title: 'No Slides', narrative_role: 'detail' },
        ],
      },
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'empty-section');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].sectionId).toBe('no-slides');
  });

  it('does not set slideNumber on empty-section warnings', () => {
    const plan = makePlan({
      agenda_sections: [
        { id: 'section-1', title: 'Intro', narrative_role: 'hook' },
        { id: 'empty', title: 'Empty', narrative_role: 'detail' },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'empty-section');
    expect(warnings[0].slideNumber).toBeUndefined();
  });
});

// =============================================================================
// missing-cta rule
// =============================================================================

describe('missing-cta rule', () => {
  it('returns no warnings when a slide has cta role', () => {
    const plan = makePlan(); // Has slide 3 with storyline_role: 'cta'
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-cta');
    expect(warnings).toEqual([]);
  });

  it('warns when no slide has cta role', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: 'Opening',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
        {
          number: 2,
          description: 'Detail',
          suggested_template: 'content',
          status: 'pending',
          storyline_role: 'detail',
          agenda_section_id: 'section-2',
          key_points: ['B'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-cta');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual(
      expect.objectContaining({
        type: 'missing-cta',
        severity: 'warning',
      })
    );
    // Deck-level: no slideNumber or sectionId
    expect(warnings[0].slideNumber).toBeUndefined();
    expect(warnings[0].sectionId).toBeUndefined();
  });

  it('returns no warnings for zero slides', () => {
    const plan = makePlan({ slides: [] });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-cta');
    expect(warnings).toEqual([]);
  });

  it('detects cta regardless of other roles', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: 'Non-CTA',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
        {
          number: 2,
          description: 'CTA slide',
          suggested_template: 'cta',
          status: 'pending',
          storyline_role: 'cta',
          agenda_section_id: 'section-1',
          key_points: ['B'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-cta');
    expect(warnings).toEqual([]);
  });

  it('is case-sensitive for cta role', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: 'Uppercase CTA',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'CTA', // uppercase - should NOT match
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-cta');
    expect(warnings).toHaveLength(1);
  });
});

// =============================================================================
// low-confidence rule
// =============================================================================

describe('low-confidence rule', () => {
  const baseScores: Record<number, TemplateScore[]> = {
    1: [
      { templateId: 't1', templateName: 'Title', score: 85, tier: 'high', description: 'Title slide' },
    ],
    2: [
      { templateId: 't2', templateName: 'Content', score: 60, tier: 'medium', description: 'Content' },
    ],
    3: [
      { templateId: 't3', templateName: 'CTA', score: 90, tier: 'high', description: 'CTA slide' },
    ],
  };

  it('returns no warnings when scores are unavailable', () => {
    const plan = makePlan();
    const warnings = validatePlan(plan).filter((w) => w.type === 'low-confidence');
    expect(warnings).toEqual([]);
  });

  it('returns no warnings when all scores >= 50', () => {
    const plan = makePlan();
    const warnings = validatePlan(plan, baseScores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toEqual([]);
  });

  it('warns when best score < 50', () => {
    const scores: Record<number, TemplateScore[]> = {
      ...baseScores,
      2: [
        { templateId: 't2', templateName: 'Content', score: 30, tier: 'low', description: 'Content' },
        { templateId: 't3', templateName: 'Other', score: 10, tier: 'low', description: 'Other' },
      ],
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual(
      expect.objectContaining({
        slideNumber: 2,
        type: 'low-confidence',
        severity: 'warning',
      })
    );
    expect(warnings[0].message).toContain('30%');
  });

  it('does not warn at exactly 50', () => {
    const scores: Record<number, TemplateScore[]> = {
      ...baseScores,
      2: [
        { templateId: 't2', templateName: 'Content', score: 50, tier: 'medium', description: 'Content' },
      ],
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toEqual([]);
  });

  it('warns at score 49 (just below threshold)', () => {
    const scores: Record<number, TemplateScore[]> = {
      ...baseScores,
      1: [
        { templateId: 't1', templateName: 'Title', score: 49, tier: 'low', description: 'Title' },
      ],
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].slideNumber).toBe(1);
  });

  it('skips slides with no scores entry', () => {
    const scores: Record<number, TemplateScore[]> = {
      1: [
        { templateId: 't1', templateName: 'Title', score: 85, tier: 'high', description: 'Title' },
      ],
      // slide 2 and 3 have no scores entries
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toEqual([]);
  });

  it('skips slides with empty scores array', () => {
    const scores: Record<number, TemplateScore[]> = {
      ...baseScores,
      2: [],
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toEqual([]);
  });

  it('warns at score 0', () => {
    const scores: Record<number, TemplateScore[]> = {
      1: [
        { templateId: 't1', templateName: 'Title', score: 0, tier: 'low', description: 'Title' },
      ],
    };
    const plan = makePlan();
    const warnings = validatePlan(plan, scores).filter((w) => w.type === 'low-confidence');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('0%');
  });
});

// =============================================================================
// missing-field rule
// =============================================================================

describe('missing-field rule', () => {
  it('returns no warnings when all fields populated', () => {
    const plan = makePlan();
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-field');
    expect(warnings).toEqual([]);
  });

  it('warns on empty description/intent', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: '',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter(
      (w) => w.type === 'missing-field' && w.message.includes('Description')
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].slideNumber).toBe(1);
  });

  it('warns on whitespace-only description', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: '   ',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter(
      (w) => w.type === 'missing-field' && w.message.includes('Description')
    );
    expect(warnings).toHaveLength(1);
  });

  it('warns on empty template', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: 'Valid description',
          suggested_template: '',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter(
      (w) => w.type === 'missing-field' && w.message.includes('Template')
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].slideNumber).toBe(1);
  });

  it('warns on both empty intent and empty template', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: '',
          suggested_template: '',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-field');
    expect(warnings).toHaveLength(2); // One for description, one for template
  });

  it('supports legacy intent field via getSlideIntent', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: undefined as any,
          intent: 'Legacy intent',
          suggested_template: 'title',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter(
      (w) => w.type === 'missing-field' && w.message.includes('Description')
    );
    expect(warnings).toEqual([]);
  });

  it('supports legacy template field via getSlideTemplate', () => {
    const plan = makePlan({
      slides: [
        {
          number: 1,
          description: 'Valid',
          suggested_template: undefined,
          template: 'legacy-template',
          status: 'pending',
          storyline_role: 'opening',
          agenda_section_id: 'section-1',
          key_points: ['A'],
        },
      ],
    });
    const warnings = validatePlan(plan).filter(
      (w) => w.type === 'missing-field' && w.message.includes('Template')
    );
    expect(warnings).toEqual([]);
  });

  it('returns no warnings for zero slides', () => {
    const plan = makePlan({ slides: [] });
    const warnings = validatePlan(plan).filter((w) => w.type === 'missing-field');
    expect(warnings).toEqual([]);
  });
});

// =============================================================================
// Combined / Integration
// =============================================================================

describe('validatePlan (combined)', () => {
  it('returns warnings from all rules', () => {
    const plan = makePlan({
      agenda_sections: [
        { id: 'section-1', title: 'Intro', narrative_role: 'hook' },
        { id: 'section-2', title: 'Content', narrative_role: 'detail' },
        { id: 'empty-section', title: 'Empty', narrative_role: 'transition' },
      ],
      slides: [
        {
          number: 1,
          description: '', // missing-field
          suggested_template: '', // missing-field
          status: 'pending',
          storyline_role: 'opening', // no cta → missing-cta
          agenda_section_id: 'section-1',
          key_points: [],
        },
      ],
    });

    const scores: Record<number, TemplateScore[]> = {
      1: [{ templateId: 't1', templateName: 'Title', score: 20, tier: 'low', description: 'Title' }],
    };

    const warnings = validatePlan(plan, scores);
    const types = warnings.map((w) => w.type);

    expect(types).toContain('empty-section'); // section-2 + empty-section have no slides
    expect(types).toContain('missing-cta');
    expect(types).toContain('low-confidence');
    expect(types).toContain('missing-field');
  });

  it('returns empty array for valid plan', () => {
    const plan = makePlan();
    const scores: Record<number, TemplateScore[]> = {
      1: [{ templateId: 't1', templateName: 'Title', score: 85, tier: 'high', description: 'Title' }],
      2: [{ templateId: 't2', templateName: 'Content', score: 70, tier: 'medium', description: 'Content' }],
      3: [{ templateId: 't3', templateName: 'CTA', score: 90, tier: 'high', description: 'CTA' }],
    };
    const warnings = validatePlan(plan, scores);
    expect(warnings).toEqual([]);
  });

  it('returns empty array for zero slides and no sections', () => {
    const plan = makePlan({ slides: [], agenda_sections: [] });
    expect(validatePlan(plan)).toEqual([]);
  });

  it('exports VALIDATION_RULES array with 4 rules', () => {
    expect(VALIDATION_RULES).toHaveLength(4);
    const ids = VALIDATION_RULES.map((r) => r.id);
    expect(ids).toContain('empty-section');
    expect(ids).toContain('missing-cta');
    expect(ids).toContain('low-confidence');
    expect(ids).toContain('missing-field');
  });

  it('completes within 10ms for 50 slides', () => {
    // Create a 50-slide plan fixture
    const slides = Array.from({ length: 50 }, (_, i) => ({
      number: i + 1,
      description: `Slide ${i + 1} content`,
      suggested_template: `template-${i + 1}`,
      status: 'pending' as const,
      storyline_role: i === 49 ? 'cta' : 'detail',
      agenda_section_id: `section-${(i % 5) + 1}`,
      key_points: [`Point for slide ${i + 1}`],
    }));

    const sections = Array.from({ length: 5 }, (_, i) => ({
      id: `section-${i + 1}`,
      title: `Section ${i + 1}`,
      narrative_role: 'detail',
    }));

    const scores: Record<number, TemplateScore[]> = {};
    for (let i = 1; i <= 50; i++) {
      scores[i] = [
        { templateId: `t${i}`, templateName: `Template ${i}`, score: 70, tier: 'medium' as const, description: 'Desc' },
      ];
    }

    const plan = makePlan({ slides, agenda_sections: sections });

    // Run 100 iterations to get stable timing
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      validatePlan(plan, scores);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    // AC-22.1.14: <10ms per validation for 50 slides
    expect(avgMs).toBeLessThan(10);
  });
});
