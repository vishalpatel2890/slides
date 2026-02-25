/**
 * Claude Context Writer Tests
 *
 * Story Reference: 23-1 Task 4
 * Tests the pure generateContextMarkdown() function and validates all sections.
 */

import { describe, it, expect } from 'vitest';
import { generateContextMarkdown } from '../../src/extension/claude-context-writer';
import type { ClaudeContextOptions } from '../../src/extension/claude-context-writer';
import type { PlanData, TemplateCatalogEntry, ThemeConfig, SlideEntry } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

function makePlan(overrides: Partial<PlanData> = {}): PlanData {
  return {
    deck_name: 'Test Deck',
    created: '2026-01-01',
    last_modified: '2026-01-01',
    audience: {
      description: 'Sales team executives',
      knowledge_level: 'intermediate',
      priorities: ['revenue growth', 'market share'],
    },
    purpose: 'Quarterly business review',
    desired_outcome: 'Approval for Q2 budget',
    key_message: 'Strong performance drives future investment',
    storyline: {
      opening_hook: 'Record-breaking Q1 results',
      tension: 'Market challenges ahead',
      resolution: 'Strategic investments position us for success',
      call_to_action: 'Approve the proposed budget',
    },
    recurring_themes: ['growth', 'innovation'],
    agenda_sections: [
      { id: 'section-1', title: 'Introduction', narrative_role: 'hook' },
      { id: 'section-2', title: 'Results', narrative_role: 'evidence' },
      { id: 'section-3', title: 'Next Steps', narrative_role: 'cta' },
    ],
    slides: [
      {
        number: 1,
        description: 'Title slide with company branding',
        suggested_template: 'title-slide',
        status: 'built',
        storyline_role: 'hook',
        agenda_section_id: 'section-1',
        key_points: ['Welcome', 'Q1 Review'],
        design_plan: 'Full-width hero image',
        tone: 'professional',
      },
      {
        number: 2,
        description: 'Revenue highlights for Q1',
        suggested_template: 'metrics-dashboard',
        status: 'pending',
        storyline_role: 'evidence',
        agenda_section_id: 'section-2',
        key_points: ['30% growth', '$10M revenue', 'Beat forecast'],
        design_plan: 'Three metric cards',
        tone: 'confident',
      },
      {
        number: 3,
        description: 'Budget request and call to action',
        suggested_template: 'cta-slide',
        status: 'pending',
        storyline_role: 'cta',
        agenda_section_id: 'section-3',
        key_points: ['Approve $5M budget', 'Q2 initiatives'],
        design_plan: 'Single focused message',
        tone: 'persuasive',
      },
    ],
    ...overrides,
  };
}

function makeTemplates(): TemplateCatalogEntry[] {
  return [
    { id: 'title-slide', name: 'Title Slide', description: 'Opening title with branding', use_cases: ['opening', 'title'] },
    { id: 'metrics-dashboard', name: 'Metrics Dashboard', description: 'Display key metrics', use_cases: ['data', 'kpis'] },
    { id: 'cta-slide', name: 'CTA Slide', description: 'Call to action', use_cases: ['closing', 'action'] },
  ];
}

function makeTheme(): ThemeConfig {
  return {
    colors: {
      primary: '#0066cc',
      secondary: '#333333',
      accent: '#ff6600',
    },
    typography: { fontFamily: 'Inter' },
    shapes: { borderRadius: '8px' },
  };
}

function makeOptions(overrides: Partial<ClaudeContextOptions> = {}): ClaudeContextOptions {
  return {
    plan: makePlan(),
    templates: makeTemplates(),
    theme: makeTheme(),
    ...overrides,
  };
}

// =============================================================================
// Pure Function Tests (AC-23.1.17)
// =============================================================================

describe('generateContextMarkdown is a pure function', () => {
  it('produces identical output for identical input', () => {
    const options = makeOptions();
    const output1 = generateContextMarkdown(options);
    const output2 = generateContextMarkdown(options);

    // Remove timestamp line for comparison (timestamp will differ)
    const normalize = (s: string) => s.replace(/<!-- Updated: .* -->/, '<!-- Updated: TIMESTAMP -->');
    expect(normalize(output1)).toBe(normalize(output2));
  });

  it('returns a string', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(typeof output).toBe('string');
  });

  it('has no side effects (does not modify input)', () => {
    const options = makeOptions();
    const originalPlan = JSON.stringify(options.plan);
    const originalTemplates = JSON.stringify(options.templates);

    generateContextMarkdown(options);

    expect(JSON.stringify(options.plan)).toBe(originalPlan);
    expect(JSON.stringify(options.templates)).toBe(originalTemplates);
  });
});

// =============================================================================
// Header and Structure (AC-23.1.10)
// =============================================================================

describe('Markdown structure (AC-23.1.10)', () => {
  it('starts with auto-generated comment', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output.startsWith('<!-- AUTO-GENERATED by Slide Builder Plan Editor')).toBe(true);
  });

  it('includes timestamp comment', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('<!-- Updated:');
  });

  it('has Plan Editor Context title', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('# Plan Editor Context');
  });

  it('has all major section headers', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('## Deck Overview');
    expect(output).toContain('## Storyline');
    expect(output).toContain('## Agenda Sections');
    expect(output).toContain('## Slides');
    expect(output).toContain('## Available Templates');
    expect(output).toContain('## Theme');
    expect(output).toContain('## Editing Instructions');
  });
});

// =============================================================================
// Deck Overview (AC-23.1.2, AC-23.1.3)
// =============================================================================

describe('Deck Overview section (AC-23.1.2, AC-23.1.3)', () => {
  it('includes deck name (AC-23.1.2)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Name:** Test Deck');
  });

  it('includes purpose (AC-23.1.2)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Purpose:** Quarterly business review');
  });

  it('includes desired outcome', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Desired Outcome:** Approval for Q2 budget');
  });

  it('includes key message', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Key Message:** Strong performance drives future investment');
  });

  it('includes audience description and knowledge level (AC-23.1.3)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Audience:** Sales team executives (knowledge: intermediate)');
  });

  it('includes audience priorities (AC-23.1.3)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Priorities:** revenue growth, market share');
  });

  it('handles missing audience gracefully', () => {
    const options = makeOptions({
      plan: makePlan({ audience: undefined as any }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('## Deck Overview');
    expect(output).toContain('**Audience:**');
  });
});

// =============================================================================
// Storyline (AC-23.1.6)
// =============================================================================

describe('Storyline section (AC-23.1.6)', () => {
  it('includes opening hook', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Opening Hook:** Record-breaking Q1 results');
  });

  it('includes tension', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Tension:** Market challenges ahead');
  });

  it('includes resolution', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Resolution:** Strategic investments position us for success');
  });

  it('includes call to action', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Call to Action:** Approve the proposed budget');
  });

  it('handles missing storyline gracefully', () => {
    const options = makeOptions({
      plan: makePlan({ storyline: undefined as any }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('## Storyline');
  });
});

// =============================================================================
// Agenda Sections Table (AC-23.1.4)
// =============================================================================

describe('Agenda Sections table (AC-23.1.4)', () => {
  it('has table header with ID, Title, Narrative Role', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| ID | Title | Narrative Role |');
  });

  it('includes all sections', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| section-1 | Introduction | hook |');
    expect(output).toContain('| section-2 | Results | evidence |');
    expect(output).toContain('| section-3 | Next Steps | cta |');
  });

  it('handles empty agenda sections', () => {
    const options = makeOptions({
      plan: makePlan({ agenda_sections: [] }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('No agenda sections defined.');
  });

  it('supports nested agenda.sections format', () => {
    const options = makeOptions({
      plan: makePlan({
        agenda_sections: undefined,
        agenda: {
          total_sections: 2,
          sections: [
            { id: 'nested-1', title: 'Nested Section', narrative_role: 'detail' },
          ],
        },
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('| nested-1 | Nested Section | detail |');
  });
});

// =============================================================================
// Slides Table (AC-23.1.5)
// =============================================================================

describe('Slides table (AC-23.1.5)', () => {
  it('has table header with all columns', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| # | Description | Template | Status | Role | Section |');
  });

  it('includes all slides with correct data', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| 1 | Title slide with company branding | title-slide | built | hook | section-1 |');
    expect(output).toContain('| 2 | Revenue highlights for Q1 | metrics-dashboard | pending | evidence | section-2 |');
    expect(output).toContain('| 3 | Budget request and call to action | cta-slide | pending | cta | section-3 |');
  });

  it('handles empty slides array', () => {
    const options = makeOptions({
      plan: makePlan({ slides: [] }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('No slides in this deck.');
  });

  it('escapes pipe characters in descriptions', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: 'Option A | Option B comparison',
            suggested_template: 'comparison',
            status: 'pending',
            storyline_role: 'evidence',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          },
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('Option A \\| Option B comparison');
  });

  it('handles newlines in descriptions', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: 'Line one\nLine two',
            suggested_template: 'content',
            status: 'pending',
            storyline_role: 'detail',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          },
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    // Newlines should be replaced with spaces
    expect(output).toContain('Line one Line two');
  });
});

// =============================================================================
// Backward Compatibility (AC-23.1.18)
// =============================================================================

describe('Backward compatibility (AC-23.1.18)', () => {
  it('uses getSlideIntent for legacy intent field', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: undefined as any,
            intent: 'Legacy intent text',
            suggested_template: 'title',
            status: 'pending',
            storyline_role: 'hook',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          } as any,
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('Legacy intent text');
  });

  it('uses getSlideTemplate for legacy template field', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: 'Test slide',
            suggested_template: undefined,
            template: 'legacy-template',
            status: 'pending',
            storyline_role: 'hook',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          } as any,
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('legacy-template');
  });

  it('prefers description over intent when both present', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: 'New description',
            intent: 'Old intent',
            suggested_template: 'title',
            status: 'pending',
            storyline_role: 'hook',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          } as any,
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('New description');
  });
});

// =============================================================================
// Available Templates (AC-23.1.7)
// =============================================================================

describe('Available Templates section (AC-23.1.7)', () => {
  it('has table header with Name, Description, Use Cases', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| Name | Description | Use Cases |');
  });

  it('includes all templates', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('| Title Slide | Opening title with branding | opening, title |');
    expect(output).toContain('| Metrics Dashboard | Display key metrics | data, kpis |');
    expect(output).toContain('| CTA Slide | Call to action | closing, action |');
  });

  it('handles empty templates array', () => {
    const options = makeOptions({ templates: [] });
    const output = generateContextMarkdown(options);
    expect(output).toContain('No templates loaded.');
  });

  it('handles templates with empty use_cases', () => {
    const options = makeOptions({
      templates: [
        { id: 'simple', name: 'Simple', description: 'Basic slide', use_cases: [] },
      ],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('| Simple | Basic slide |  |');
  });
});

// =============================================================================
// Theme Section (AC-23.1.8)
// =============================================================================

describe('Theme section (AC-23.1.8)', () => {
  it('shows theme summary when loaded', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('## Theme');
    expect(output).toContain('**Colors:**');
  });

  it('shows "No theme loaded" when theme is null', () => {
    const options = makeOptions({ theme: null });
    const output = generateContextMarkdown(options);
    expect(output).toContain('No theme loaded.');
  });

  it('shows color sample', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('primary: #0066cc');
  });

  it('indicates typography is configured', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Typography:** Configured');
  });

  it('indicates shapes are configured', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('**Shapes:** Configured');
  });
});

// =============================================================================
// Editing Instructions (AC-23.1.9)
// =============================================================================

describe('Editing Instructions section (AC-23.1.9)', () => {
  it('includes instructions header', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('## Editing Instructions');
  });

  it('mentions plan.yaml', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('plan.yaml');
  });

  it('includes YAML field reference table', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('### YAML Field Reference');
    expect(output).toContain('| `description` |');
    expect(output).toContain('| `suggested_template` |');
    expect(output).toContain('| `key_points` |');
  });

  it('includes slide numbering rules', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('### Slide Numbering Rules');
    expect(output).toContain('1-indexed');
    expect(output).toContain('sequential');
  });

  it('includes array structure example', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('### Array Structure');
    expect(output).toContain('```yaml');
    expect(output).toContain('slides:');
  });
});

// =============================================================================
// Focused Slide Section (Story 23.2 prep)
// =============================================================================

describe('Focused Slide section', () => {
  it('is not included when no focused slide', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).not.toContain('## Currently Focused Slide');
  });

  it('is included when focused slide is provided', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('## Currently Focused Slide');
  });

  it('shows focused slide details', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('**Slide Number:** 2');
    expect(output).toContain('**Description:** Revenue highlights for Q1');
    expect(output).toContain('**Template:** metrics-dashboard');
  });

  it('shows key points as bullet list', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('**Key Points:**');
    expect(output).toContain('- 30% growth');
    expect(output).toContain('- $10M revenue');
  });

  it('shows neighboring slides when provided', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
      focusedSlideNeighbors: {
        previous: plan.slides[0],
        next: plan.slides[2],
      },
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('### Neighboring Slides');
    expect(output).toContain('**Previous:** Slide 1:');
    expect(output).toContain('**Next:** Slide 3:');
  });

  it('handles first slide (no previous)', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[0],
      focusedSlideNeighbors: {
        next: plan.slides[1],
      },
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('**Previous:** (none - this is the first slide)');
    expect(output).toContain('**Next:** Slide 2:');
  });

  it('handles last slide (no next)', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[2],
      focusedSlideNeighbors: {
        previous: plan.slides[1],
      },
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('**Previous:** Slide 2:');
    expect(output).toContain('**Next:** (none - this is the last slide)');
  });

  it('shows section context', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('**Section:** section-2 — Results');
  });

  it('shows suggested actions', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('### Suggested Actions');
    expect(output).toContain('Modify this slide\'s description');
  });
});

// =============================================================================
// Plan-Level Workflow Recommendations (AC-3, AC-4, AC-5)
// =============================================================================

describe('Plan-level workflow recommendations (AC-3, AC-4, AC-5)', () => {
  it('includes "Recommended Workflows for Plan Editing" when no focused slide (AC-3)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('## Recommended Workflows for Plan Editing');
  });

  it('contains decision guide table with all workflows (AC-4)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('plan-deck');
    expect(output).toContain('plan-one');
    expect(output).toContain('add-slide');
    expect(output).toContain('edit');
    expect(output).toContain('/sb-create:plan-deck');
    expect(output).toContain('/sb-create:plan-one');
    expect(output).toContain('/sb-create:add-slide');
    expect(output).toContain('/sb-create:edit');
  });

  it('contains edit-plan workflow in table (AC-4)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('/sb-create:edit-plan');
    expect(output).toContain('plan.yaml');
  });

  it('contains Decision Guide section (AC-4)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).toContain('### Decision Guide');
    expect(output).toContain('make a targeted plan change');
    expect(output).toContain('add a single slide');
    expect(output).toContain('completely restructure the deck');
    expect(output).toContain('redesign a built slide');
  });

  it('does NOT include "Currently Focused Slide" when no focused slide (AC-5)', () => {
    const output = generateContextMarkdown(makeOptions());
    expect(output).not.toContain('## Currently Focused Slide');
  });

  it('does NOT include workflow recommendations when focused slide is provided (AC-5)', () => {
    const plan = makePlan();
    const options = makeOptions({
      plan,
      focusedSlide: plan.slides[1],
    });
    const output = generateContextMarkdown(options);
    expect(output).not.toContain('## Recommended Workflows for Plan Editing');
    expect(output).toContain('## Currently Focused Slide');
  });

  it('workflow recommendations and focused slide are mutually exclusive (AC-5)', () => {
    // Plan-level: has workflows, no focused slide
    const planLevelOutput = generateContextMarkdown(makeOptions());
    expect(planLevelOutput).toContain('## Recommended Workflows for Plan Editing');
    expect(planLevelOutput).not.toContain('## Currently Focused Slide');

    // Slide-level: has focused slide, no workflows
    const plan = makePlan();
    const slideLevelOutput = generateContextMarkdown(makeOptions({
      plan,
      focusedSlide: plan.slides[0],
    }));
    expect(slideLevelOutput).toContain('## Currently Focused Slide');
    expect(slideLevelOutput).not.toContain('## Recommended Workflows for Plan Editing');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge cases', () => {
  it('handles completely empty plan', () => {
    const emptyPlan: PlanData = {
      deck_name: '',
      created: '',
      last_modified: '',
      audience: { description: '', knowledge_level: 'intermediate', priorities: [] },
      purpose: '',
      desired_outcome: '',
      key_message: '',
      storyline: { opening_hook: '', tension: '', resolution: '', call_to_action: '' },
      recurring_themes: [],
      agenda_sections: [],
      slides: [],
    };
    const options = makeOptions({ plan: emptyPlan, templates: [], theme: null });
    const output = generateContextMarkdown(options);

    expect(output).toContain('## Deck Overview');
    expect(output).toContain('No agenda sections defined.');
    expect(output).toContain('No slides in this deck.');
    expect(output).toContain('No templates loaded.');
    expect(output).toContain('No theme loaded.');
  });

  it('handles slides with undefined fields', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: 'Test',
            suggested_template: undefined as any,
            status: 'pending',
            storyline_role: undefined as any,
            agenda_section_id: undefined as any,
            key_points: [],
          },
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('| 1 | Test |');
  });

  it('handles very long descriptions (truncation not required but output should work)', () => {
    const longDesc = 'A'.repeat(500);
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: longDesc,
            suggested_template: 'title',
            status: 'pending',
            storyline_role: 'hook',
            agenda_section_id: 'section-1',
            key_points: ['Test'],
          },
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain(longDesc);
  });

  it('handles special markdown characters in content', () => {
    const options = makeOptions({
      plan: makePlan({
        slides: [
          {
            number: 1,
            description: '**Bold** and _italic_ and `code`',
            suggested_template: 'title',
            status: 'pending',
            storyline_role: 'hook',
            agenda_section_id: 'section-1',
            key_points: ['*bullet*'],
          },
        ],
      }),
    });
    const output = generateContextMarkdown(options);
    // Output should still be valid markdown (special chars preserved in table)
    expect(output).toContain('**Bold**');
  });

  it('handles zero slides with many templates', () => {
    const manyTemplates = Array.from({ length: 20 }, (_, i) => ({
      id: `template-${i}`,
      name: `Template ${i}`,
      description: `Description ${i}`,
      use_cases: ['case1', 'case2'],
    }));
    const options = makeOptions({
      plan: makePlan({ slides: [] }),
      templates: manyTemplates,
    });
    const output = generateContextMarkdown(options);
    expect(output).toContain('No slides in this deck.');
    expect(output).toContain('Template 19'); // All templates should be included
  });
});

// =============================================================================
// Performance
// =============================================================================

describe('Performance', () => {
  it('generates context for 50 slides in under 20ms', () => {
    const slides: SlideEntry[] = Array.from({ length: 50 }, (_, i) => ({
      number: i + 1,
      description: `Slide ${i + 1} description with some content`,
      suggested_template: `template-${(i % 10) + 1}`,
      status: 'pending' as const,
      storyline_role: 'detail',
      agenda_section_id: `section-${(i % 5) + 1}`,
      key_points: [`Point A for slide ${i + 1}`, `Point B for slide ${i + 1}`],
      design_plan: 'Standard layout',
      tone: 'professional',
    }));

    const templates: TemplateCatalogEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `template-${i + 1}`,
      name: `Template ${i + 1}`,
      description: `Description for template ${i + 1}`,
      use_cases: ['general', 'content', 'data'],
    }));

    const options = makeOptions({
      plan: makePlan({ slides }),
      templates,
    });

    // Warm up
    generateContextMarkdown(options);

    // Measure
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      generateContextMarkdown(options);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / 100;

    // AC-23.1.14: Context generation should be fast (<70ms including write)
    // Pure generation should be well under 20ms
    expect(avgMs).toBeLessThan(20);
  });
});
