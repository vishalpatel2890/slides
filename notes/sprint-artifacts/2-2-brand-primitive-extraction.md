# Story 2.2: Brand Primitive Extraction

Status: done

## Story

As a **system**,
I want **to extract colors, typography, and visual patterns from brand assets**,
So that **I can generate a complete theme file**.

## Acceptance Criteria

1. **AC2.2.1:** Given brand assets have been collected, when extraction runs, then the system identifies: primary, secondary, accent colors; background colors (default, alt); text colors (heading, body)
2. **AC2.2.2:** The system identifies font families (heading, body, mono) and typography scale (hero, h1, h2, body sizes)
3. **AC2.2.3:** The system identifies shape styles (corner radius, shadows, borders) and arrow styles (stroke width, head type)
4. **AC2.2.4:** The system infers brand personality (bold, minimal, corporate, playful) from visual signals
5. **AC2.2.5:** Given conflicting signals from multiple sources, when making decisions, then the system uses the brief description to resolve ambiguity

## Frontend Test Gate

**Gate ID**: 2-2-TG1

### Prerequisites
- [ ] Story 2.1 complete (Asset collection functional in setup workflow)
- [ ] Claude Code CLI running
- [ ] Test brand assets available (website URL, PDF, or image with clear brand colors/fonts)
- [ ] Starting state: `/sb:setup` completes Phase 1 (asset collection) successfully

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Run `/sb:setup` and complete asset collection | Claude Code CLI | Phase 1 completes, proceeds to analysis |
| 2 | Observe color extraction output | Claude Code CLI | System displays extracted colors (primary, secondary, accent, backgrounds, text) |
| 3 | Observe typography extraction output | Claude Code CLI | System displays extracted fonts (heading, body, mono) and scale |
| 4 | Observe shape extraction output | Claude Code CLI | System displays shape styles (corner radius, shadows, borders) |
| 5 | Observe personality classification | Claude Code CLI | System displays inferred brand personality with reasoning |
| 6 | Review extraction summary | Claude Code CLI | Complete summary of all extracted primitives shown |

### Success Criteria (What User Sees)
- [ ] All color categories extracted (primary, secondary, accent, backgrounds, text)
- [ ] Font families identified for heading, body, and mono
- [ ] Typography scale derived (hero, h1, h2, h3, body, small sizes)
- [ ] Shape styles captured (corner radius, shadow, border patterns)
- [ ] Arrow styles defined (stroke width, head type, curve style)
- [ ] Brand personality classified (bold/minimal/corporate/playful) with notes
- [ ] Extraction data structured for theme synthesis
- [ ] No console errors during extraction phase

### Feedback Questions
1. Were the extracted colors reasonably accurate to the source brand?
2. Did the typography detection capture appropriate fonts?
3. Was the personality classification reasonable for the brand?
4. Any unexpected extraction results that don't match the brand?

## Tasks / Subtasks

- [x] **Task 1: Implement Website CSS/Style Analysis** (AC: 1, 2, 3)
  - [x] 1.1: Parse WebFetch HTML result for inline styles and `<style>` blocks
  - [x] 1.2: Extract color values (hex, rgb, hsl) from CSS properties
  - [x] 1.3: Extract font-family declarations and categorize by usage (heading vs body)
  - [x] 1.4: Extract shape-related CSS (border-radius, box-shadow, border styles)
  - [x] 1.5: Identify layout patterns and spacing values

- [x] **Task 2: Implement PDF Visual Analysis via Claude Vision** (AC: 1, 2, 3)
  - [x] 2.1: Analyze PDF content for dominant color palette
  - [x] 2.2: Identify typography styles (font characteristics, weights, hierarchy)
  - [x] 2.3: Detect shape patterns (rounded vs sharp corners, shadow usage)
  - [x] 2.4: Extract visual weight and density signals

- [x] **Task 3: Implement Image Visual Analysis via Claude Vision** (AC: 1, 2, 3)
  - [x] 3.1: Extract dominant color palette from images
  - [x] 3.2: Analyze visual style characteristics (modern, classic, bold, subtle)
  - [x] 3.3: Identify any typography visible in images
  - [x] 3.4: Capture visual mood and design language signals

- [x] **Task 4: Implement Brand Personality Inference** (AC: 4)
  - [x] 4.1: Define personality classification rules (bold, minimal, corporate, playful)
  - [x] 4.2: Map visual signals to personality indicators:
    - High contrast, strong colors → bold
    - Whitespace, muted palette → minimal
    - Traditional fonts, formal colors → corporate
    - Bright colors, rounded shapes → playful
  - [x] 4.3: Weight signals from multiple sources
  - [x] 4.4: Generate personality classification with reasoning notes

- [x] **Task 5: Implement Multi-Source Conflict Resolution** (AC: 5)
  - [x] 5.1: Define source priority weighting (website > PDF > images)
  - [x] 5.2: Detect conflicting signals across sources
  - [x] 5.3: Use brand description keywords to resolve ambiguity
  - [x] 5.4: Document reasoning for conflict resolution decisions

- [x] **Task 6: Build Extraction Data Structure** (AC: 1-5)
  - [x] 6.1: Create structured output format per tech spec:
    ```yaml
    source: "website.com"
    type: website | pdf | image
    colors_found:
      - hex: "#XXXXXX"
        usage: "primary button"
        confidence: 0.95
    fonts_found:
      - family: "Font Name"
        usage: "headings"
        weights: [400, 600, 700]
    shapes_observed:
      - element: "cards"
        corner_radius: "8px"
        shadow: true
    personality_signals:
      - signal: "description"
        suggests: "bold|minimal|corporate|playful"
    ```
  - [x] 6.2: Aggregate extraction data from all sources
  - [x] 6.3: Store extraction results for Theme Synthesizer (Story 2.3)

- [x] **Task 7: Update Setup Workflow Instructions - Phase 2** (AC: 1-5)
  - [x] 7.1: Add Phase 2 Brand Analysis steps to instructions.md
  - [x] 7.2: Implement CSS parsing actions for website analysis
  - [x] 7.3: Implement Vision analysis actions for PDF/image processing
  - [x] 7.4: Add personality inference logic
  - [x] 7.5: Add conflict resolution with description context
  - [x] 7.6: Display extraction summary to user

- [x] **Task 8: Testing and Validation** (AC: 1-5)
  - [x] 8.1: Test website extraction with known brand (verify color accuracy)
  - [x] 8.2: Test PDF extraction with branded document
  - [x] 8.3: Test image extraction with logo/brand imagery
  - [x] 8.4: Test personality inference produces reasonable classification
  - [x] 8.5: Test conflict resolution with mixed source signals
  - [x] 8.6: Verify extraction data structure matches spec

## Dev Notes

### Architecture Patterns and Constraints

**From Architecture Pattern 1 (Theme Extraction Pipeline):**
```
Processing:
├── Color extraction (primary, secondary, accent, backgrounds)
├── Typography detection (fonts, weights, scales)
├── Shape inference (corner radius, shadows, borders)
├── Brand personality classification (bold, minimal, corporate, playful)
└── Semantic style mapping (what style for "emphasis", "warning", etc.)

Output:
└── Structured extraction data for theme synthesis
```

**Key Architecture Constraints:**
- Per ADR-001: 100% alignment with BMAD workflow pattern
- Per FR2: System extracts colors, typography, and visual patterns from provided brand assets
- Per Tech Spec: Use Claude Vision for PDF/image analysis, WebFetch + CSS parsing for websites
- All analysis performed locally via Claude; no assets uploaded to external services (NFR12, NFR13)

**Brand Analyzer Module Spec (from tech-spec-epic-2.md):**
- **For Website URLs:** Uses WebFetch to retrieve page, analyzes HTML/CSS for colors, font declarations, layout patterns
- **For PDFs/Images:** Uses Claude Vision to extract dominant colors, typography styles, shape characteristics
- **For All Sources:** Infers brand personality (bold, minimal, corporate, playful) from visual weight and color temperature
- Outputs structured extraction data per source

**Extraction Data Structure (per Tech Spec):**
```yaml
source: "website.com"
type: website | pdf | image
colors_found:
  - hex: "#2563EB"
    usage: "primary button"
    confidence: 0.95
fonts_found:
  - family: "Inter"
    usage: "headings"
    weights: [400, 600, 700]
shapes_observed:
  - element: "cards"
    corner_radius: "8px"
    shadow: true
personality_signals:
  - signal: "high contrast colors"
    suggests: "bold"
```

### Project Structure Notes

Per Architecture, extraction runs within setup workflow:
```
.slide-builder/
├── workflows/
│   └── setup/
│       ├── workflow.yaml
│       └── instructions.md   # Add Phase 2 steps here
└── theme.json               # Will receive synthesis output (Story 2.3)
```

**Integration with Story 2.1:**
- Phase 1 (Story 2.1) collects assets and performs initial WebFetch/Vision analysis
- Phase 2 (this story) extracts structured primitives from that analysis
- Extraction data passed to Theme Synthesizer (Story 2.3)

### Learnings from Previous Story

**From Story 2-1-brand-asset-input-collection (Status: done)**

- **Workflow pattern established:** Phase 1 steps in instructions.md follow BMAD XML pattern
- **Asset analysis stored:** WebFetch results and Claude Vision analysis from Phase 1 available for primitive extraction
- **Validation patterns:** Input validation with `<check>` and `<goto>` for re-prompting works well
- **Error handling:** Graceful fallback when WebFetch or Read fails implemented
- **Phase structure:** Phase 2-6 placeholders already in place for this and subsequent stories

**Key Interface from Previous Story:**
- WebFetch result stored for CSS/style extraction
- Vision analysis results stored for PDF/image primitive extraction
- Brand description available for conflict resolution context
- Input sources list available for theme.json meta.sources

[Source: notes/sprint-artifacts/2-1-brand-asset-input-collection.md#Dev-Agent-Record]

### Color Extraction Guidelines

**Primary color identification:**
- Most frequently used accent/brand color
- Often found in buttons, links, headers
- Highest visual prominence

**Secondary color identification:**
- Supporting brand color
- Often used for secondary buttons, borders, accents
- Complements primary

**Accent color identification:**
- Call-to-action color
- High contrast for attention
- Used sparingly for emphasis

**Background colors:**
- Default: Main page/slide background
- Alt: Card/section backgrounds, contrast areas

**Text colors:**
- Heading: Usually darker, higher contrast
- Body: Slightly lighter for readability

### Typography Extraction Guidelines

**Font family detection:**
- Heading fonts: Often sans-serif, bold, distinctive
- Body fonts: Readable, clean, often same family as heading
- Mono fonts: For code blocks, technical content

**Scale derivation:**
- Hero: Largest text (72px typical)
- H1: Primary headings (48px typical)
- H2: Secondary headings (36px typical)
- H3: Tertiary headings (24px typical)
- Body: Standard text (16-18px typical)
- Small: Captions, labels (14px typical)

### Personality Classification Rules

| Personality | Visual Signals |
|-------------|---------------|
| **Bold** | High contrast, saturated colors, sharp edges, heavy weights |
| **Minimal** | White space, muted palette, thin weights, subtle shadows |
| **Corporate** | Traditional fonts (serif/classic sans), formal colors (navy, gray), structured layouts |
| **Playful** | Bright colors, rounded corners, varied weights, casual fonts |

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Each extraction type produces expected structure
- **Integration test:** Full extraction from all source types
- **Edge cases:** Single source only, conflicting sources, missing elements

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story 2.2: Brand Primitive Extraction] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Services and Modules] - Brand Analyzer module spec
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Data Models and Contracts] - Extraction data structure
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Workflows and Sequencing] - Phase 2 Brand Analysis flow
- [Source: notes/architecture.md#Pattern 1: Theme Extraction Pipeline] - Processing pipeline pattern
- [Source: notes/architecture.md#theme.json] - Target schema for extracted primitives
- [Source: notes/epics.md#Story 2.2: Brand Primitive Extraction] - User story and AC definitions
- [Source: notes/prd.md#Theme Primitive Schema] - Complete primitive categories

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/2-2-brand-primitive-extraction.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**2026-01-26 - Implementation Plan:**
- Expanded Phase 2 placeholder (lines 358-378) into complete extraction pipeline
- Steps 2-2.9 implement: initialization, website extraction, PDF extraction, image extraction, conflict resolution, personality classification, typography scale derivation, shape/arrow definition, data structure compilation, summary display
- All steps follow BMAD workflow XML pattern with proper `<action>`, `<check>`, `<output>` tags
- Extraction data structure matches tech-spec-epic-2.md specification exactly
- Personality classification uses scoring system with source weighting
- Conflict resolution prioritizes: website (1.0) > PDF (0.8) > images (0.6)
- Brand description keywords used to break ties in ambiguous cases

### Completion Notes List

- Implemented complete Phase 2 (Brand Primitive Extraction) in setup workflow instructions.md
- Steps 2-2.9 cover: initialization, website CSS parsing, PDF vision analysis, image vision analysis, multi-source aggregation, personality classification, typography scale derivation, shape/arrow styles, extraction data structure, summary display
- All acceptance criteria addressed:
  - AC2.2.1: Color extraction (primary, secondary, accent, backgrounds, text) in steps 2.1-2.4
  - AC2.2.2: Typography extraction (fonts, scale) in steps 2.1-2.3, 2.6
  - AC2.2.3: Shape extraction (corners, shadows, borders, arrows) in steps 2.1-2.3, 2.7
  - AC2.2.4: Personality inference in step 2.5 with scoring system
  - AC2.2.5: Conflict resolution in step 2.4 using source priority and brand description
- Extraction data structure matches tech spec YAML format
- Phase 2 integrates with Phase 1 outputs (website_analysis, pdf_analysis, image_analysis, brand_description)
- Output stored in {{extracted_primitives}} for Theme Synthesizer (Story 2.3)
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### Story Completion
**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

| Status | File Path |
|--------|-----------|
| MODIFIED | .slide-builder/workflows/setup/instructions.md |
| MODIFIED | .slide-builder/workflows/setup/workflow.yaml |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Story drafted from create-story workflow | SM Agent |
| 2026-01-26 | Implemented Phase 2 brand primitive extraction (Tasks 1-7 complete) | Dev Agent |
| 2026-01-26 | Added required_skills config to workflow.yaml + explicit Skill tool call in instructions | Dev Agent |
| 2026-01-27 | Test Gate PASSED - Status: review | Dev Agent |
| 2026-01-27 | Story marked done - Definition of Done complete | Dev Agent |
