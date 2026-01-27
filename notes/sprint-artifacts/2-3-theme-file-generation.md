# Story 2.3: Theme File Generation

Status: done

## Story

As a **system**,
I want **to generate a complete theme.json with all primitives**,
So that **slides can be generated consistently**.

## Acceptance Criteria

1. **AC2.3.1:** Given brand primitives have been extracted, when the theme file is generated, then `.slide-builder/theme.json` contains: meta (name, version, created, sources), colors, typography, shapes, layouts sections
2. **AC2.3.2:** The theme file is valid JSON
3. **AC2.3.3:** All CSS custom properties can be derived from the theme (--color-primary, --font-heading, etc.)
4. **AC2.3.4:** The theme includes personality classification with reasoning notes

## Frontend Test Gate

**Gate ID**: 2-3-TG1

### Prerequisites
- [ ] Story 2.2 complete (Brand primitive extraction functional)
- [ ] Claude Code CLI running
- [ ] Test brand assets available that have been analyzed through Phase 1-2
- [ ] Starting state: `/sb:setup` completes Phase 2 (extraction) successfully

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Run `/sb:setup` and complete Phases 1-2 | Claude Code CLI | Extraction summary displayed |
| 2 | Observe theme generation starting | Claude Code CLI | System displays "Generating theme.json..." message |
| 3 | Verify theme.json file created | File system | File exists at `.slide-builder/theme.json` |
| 4 | Open theme.json in editor | Text editor | Valid JSON with no syntax errors |
| 5 | Check meta section | theme.json | Contains name, version "1.0", created date, sources array |
| 6 | Check colors section | theme.json | Contains primary, secondary, accent, background (default/alt), text (heading/body) |
| 7 | Check typography section | theme.json | Contains fonts (heading/body/mono), scale (hero/h1/h2/h3/body/small), weights |
| 8 | Check shapes section | theme.json | Contains boxes (default/callout with cornerRadius, shadow), arrows (strokeWidth, headType, curve) |
| 9 | Check personality section | theme.json | Contains classification, confidence, notes |
| 10 | Verify layouts placeholder | theme.json | Contains layouts section (will be populated by Story 2.4) |

### Success Criteria (What User Sees)
- [ ] theme.json file exists at `.slide-builder/theme.json`
- [ ] File is valid JSON (parseable without errors)
- [ ] meta section complete (name, version, created, sources)
- [ ] colors section has all required properties with valid hex codes
- [ ] typography section has fonts, scale, and weights
- [ ] shapes section has boxes and arrows with all properties
- [ ] personality section has classification, confidence, notes
- [ ] layouts section exists (placeholder for Story 2.4)
- [ ] No console errors during theme generation

### Feedback Questions
1. Does the theme.json structure match the tech spec schema?
2. Are all color values valid hex codes?
3. Is the meta.sources array populated with input source references?
4. Does the personality section accurately reflect the classification from Phase 2?

## Tasks / Subtasks

- [x] **Task 1: Implement Theme Synthesizer Module** (AC: 1, 2)
  - [x] 1.1: Read {{extracted_primitives}} from Phase 2 output
  - [x] 1.2: Build meta section with name, version "1.0", current date, and sources list
  - [x] 1.3: Map extracted colors to theme.json colors structure
  - [x] 1.4: Map extracted typography to theme.json typography structure
  - [x] 1.5: Map extracted shapes to theme.json shapes structure
  - [x] 1.6: Copy personality classification to personality section

- [x] **Task 2: Implement CSS Variable Derivation** (AC: 3)
  - [x] 2.1: Define CSS variable naming convention per architecture
  - [x] 2.2: Ensure all theme values can map to CSS custom properties:
    - `--color-primary`, `--color-secondary`, `--color-accent`
    - `--color-bg-default`, `--color-bg-alt`
    - `--color-text-heading`, `--color-text-body`
    - `--font-heading`, `--font-body`, `--font-mono`
    - `--size-hero`, `--size-h1`, `--size-h2`, `--size-h3`, `--size-body`, `--size-small`
  - [x] 2.3: Document CSS variable mappings in theme structure

- [x] **Task 3: Add Layouts Placeholder** (AC: 1)
  - [x] 3.1: Create empty layouts section in theme.json
  - [x] 3.2: Define expected layout template references (will be populated by Story 2.4):
    - title, list, flow, columns-2, columns-3, callout, code

- [x] **Task 4: Update Setup Workflow Instructions - Phase 3** (AC: 1-4)
  - [x] 4.1: Expand Phase 3 placeholder (Step n="3") in instructions.md
  - [x] 4.2: Add action to read {{extracted_primitives}} from Phase 2
  - [x] 4.3: Add action to construct complete theme.json object
  - [x] 4.4: Add action to validate JSON structure before writing
  - [x] 4.5: Add Write tool call to save theme.json to `.slide-builder/theme.json`
  - [x] 4.6: Add output block showing theme generation summary
  - [x] 4.7: Update status.yaml with phase: "theme-generation-complete"

- [x] **Task 5: Implement JSON Validation** (AC: 2)
  - [x] 5.1: Add validation step to ensure all required fields are present
  - [x] 5.2: Add validation step to ensure all hex colors are valid format
  - [x] 5.3: Add validation step to ensure no null or placeholder values
  - [x] 5.4: Add error handling if validation fails

- [x] **Task 6: Testing and Validation** (AC: 1-4)
  - [x] 6.1: Test theme generation with complete extraction data
  - [x] 6.2: Test theme.json is valid JSON (parse test)
  - [x] 6.3: Test all required sections are present
  - [x] 6.4: Test CSS variable derivation produces expected names
  - [x] 6.5: Verify meta.sources matches input assets
  - [x] 6.6: Verify personality section matches Phase 2 classification

## Dev Notes

### Architecture Patterns and Constraints

**From Architecture theme.json Schema:**
```json
{
  "meta": {
    "name": "string",
    "version": "string",
    "created": "YYYY-MM-DD",
    "sources": ["string"]
  },
  "colors": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB",
    "background": { "default": "#RRGGBB", "alt": "#RRGGBB" },
    "text": { "heading": "#RRGGBB", "body": "#RRGGBB" },
    "semantic": { "success": "#RRGGBB", "warning": "#RRGGBB", "error": "#RRGGBB" }
  },
  "typography": {
    "fonts": { "heading": "string", "body": "string", "mono": "string" },
    "scale": { "hero": "string", "h1": "string", "h2": "string", "h3": "string", "body": "string", "small": "string" },
    "weights": { "normal": "number", "medium": "number", "bold": "number" }
  },
  "shapes": {
    "boxes": {
      "default": { "cornerRadius": "string", "border": "string", "shadow": "string" },
      "callout": { "cornerRadius": "string", "border": "string", "shadow": "string" }
    },
    "arrows": {
      "default": { "strokeWidth": "string", "headType": "string", "curve": "string" }
    },
    "lines": { "default": { "strokeWidth": "string", "style": "string" } }
  },
  "layouts": {
    "title": { "file": "layout-title.html" },
    "list": { "file": "layout-list.html" },
    ...
  },
  "personality": {
    "classification": "string",
    "notes": "string"
  }
}
```

**Key Architecture Constraints:**
- Per ADR-001: 100% alignment with BMAD workflow pattern
- Per FR3: System generates a complete theme file with all primitives
- Per Tech Spec: Theme stored at `.slide-builder/theme.json`
- CSS variables pattern: `--color-primary`, `--font-heading`, etc.
- Version starts at "1.0"

**Theme Synthesizer Module Spec (from tech-spec-epic-2.md):**
- Merges extraction data into coherent theme.json
- Applies personality-based defaults for missing values
- Outputs complete theme.json with all required sections

### Project Structure Notes

Per Architecture, theme generation is Phase 3 of setup workflow:
```
.slide-builder/
├── workflows/
│   └── setup/
│       ├── workflow.yaml
│       └── instructions.md   # Add Phase 3 steps here
└── theme.json               # OUTPUT: Generated by this story
```

**Integration with Previous Stories:**
- Phase 1 (Story 2.1) collects assets and performs initial analysis
- Phase 2 (Story 2.2) extracts structured primitives → {{extracted_primitives}}
- Phase 3 (this story) synthesizes theme.json from {{extracted_primitives}}
- Phase 4 (Story 2.4) generates sample slides using theme.json

### Learnings from Previous Story

**From Story 2-2-brand-primitive-extraction (Status: done)**

- **Extraction data structure established:** {{extracted_primitives}} contains colors, typography, shapes, personality
- **Source priority weighting:** website (1.0) > PDF (0.8) > images (0.6) for conflict resolution
- **Personality classification:** Uses scoring system with brand description weighting
- **Phase 2 outputs available:** {{extracted_primitives}}, {{aggregated_colors}}, {{aggregated_fonts}}, {{aggregated_shapes}}, {{brand_personality}}, {{typography_scale}}
- **BMAD XML pattern:** Steps use `<action>`, `<check>`, `<output>` tags consistently
- **Skill invocation:** frontend-design skill loaded at Phase 2 start with explicit Skill tool call

**Key Interface from Previous Story:**
- {{extracted_primitives}} structure matches what we need to map to theme.json
- All color, typography, shape, and personality data aggregated and ready
- Sources tracked in {{extraction_sources}} for meta.sources

[Source: notes/sprint-artifacts/2-2-brand-primitive-extraction.md#Dev-Agent-Record]

### CSS Variable Mapping

| Theme Property | CSS Variable |
|---------------|--------------|
| colors.primary | --color-primary |
| colors.secondary | --color-secondary |
| colors.accent | --color-accent |
| colors.background.default | --color-bg-default |
| colors.background.alt | --color-bg-alt |
| colors.text.heading | --color-text-heading |
| colors.text.body | --color-text-body |
| typography.fonts.heading | --font-heading |
| typography.fonts.body | --font-body |
| typography.fonts.mono | --font-mono |
| typography.scale.hero | --size-hero |
| typography.scale.h1 | --size-h1 |
| typography.scale.h2 | --size-h2 |
| typography.scale.h3 | --size-h3 |
| typography.scale.body | --size-body |
| typography.scale.small | --size-small |

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Theme synthesis produces complete structure
- **Integration test:** Full theme.json generation from extraction data
- **Edge cases:** Missing optional fields, semantic colors optional

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story 2.3: Theme File Generation] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Services and Modules] - Theme Synthesizer module spec
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Data Models and Contracts] - theme.json schema
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Workflows and Sequencing] - Phase 3 Theme Synthesis flow
- [Source: notes/architecture.md#theme.json] - Complete theme schema
- [Source: notes/architecture.md#Implementation Patterns] - CSS variable patterns
- [Source: notes/epics.md#Story 2.3: Theme File Generation] - User story and AC definitions

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/2-3-theme-file-generation.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**2026-01-27 - Implementation Plan:**
- Expanded Phase 3 placeholder (lines 906-919) into complete theme synthesis pipeline
- Steps 3-3.9 implement: initialization, meta section, colors mapping, typography mapping, shapes mapping, layouts placeholder, personality section, JSON validation, file writing, summary display
- All steps follow BMAD workflow XML pattern with proper `<action>`, `<check>`, `<output>` tags
- CSS variable mapping documented inline for each section (colors, typography)
- Validation includes hex color format checking, required field verification, and fallback values
- Error handling with HALT on critical failures

### Story Completion
**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### Completion Notes List

- Implemented complete Phase 3 (Theme File Generation) in setup workflow instructions.md
- Steps 3-3.9 cover: initialization, meta building, colors mapping, typography mapping, shapes mapping, layouts placeholder, personality section, JSON validation, file writing, summary display
- All acceptance criteria addressed:
  - AC2.3.1: theme.json contains meta, colors, typography, shapes, layouts sections (Steps 3.1-3.5)
  - AC2.3.2: JSON validation in Step 3.7 with required field and format checks
  - AC2.3.3: CSS variable mapping documented in Steps 3.2 and 3.3 with comments
  - AC2.3.4: Personality section with classification, confidence, notes in Step 3.6
- Theme schema matches architecture specification exactly
- Layouts placeholder defines all 7 template types for Story 2.4
- Validation includes fallback values for robustness
- Phase 3 integrates with Phase 2 outputs ({{extracted_primitives}})
- Output saved to .slide-builder/theme.json
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### File List

| Status | File Path |
|--------|-----------|
| MODIFIED | .slide-builder/workflows/setup/instructions.md |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implemented Phase 3 theme generation (Tasks 1-6 complete) | Dev Agent |
| 2026-01-27 | Test Gate PASSED - Status: review | Dev Agent |
| 2026-01-27 | Story marked done | Dev Agent |
