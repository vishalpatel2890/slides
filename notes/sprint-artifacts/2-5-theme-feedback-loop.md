# Story 2.5: Theme Feedback Loop

Status: done

## Story

As a **user**,
I want **to provide high-level feedback ("too corporate", "colors off") and see updated samples**,
So that **the theme matches my vision without micro-managing details**.

## Acceptance Criteria

1. **AC2.5.1:** Given the sample deck is displayed, when the user provides gestalt feedback (e.g., "too corporate", "colors off"), then the system interprets the feedback and adjusts theme primitives
2. **AC2.5.2:** The system regenerates the sample deck with updated theme for re-validation
3. **AC2.5.3:** Given the user approves the samples ("Perfect"), when they confirm approval, then the theme is locked (saved to theme.json)
4. **AC2.5.4:** Upon approval, sample slides are copied to templates/ as layout templates (layout-title.html, layout-list.html, etc.)
5. **AC2.5.5:** A version entry is created in theme-history/ with timestamp
6. **AC2.5.6:** Given feedback exceeds 3 rounds, then direct theme.json editing is offered as escape hatch

## Frontend Test Gate

**Gate ID**: 2-5-TG1

### Prerequisites
- [ ] Story 2.4 complete (6 sample slides exist in `.slide-builder/samples/`)
- [ ] theme.json exists at `.slide-builder/theme.json`
- [ ] Claude Code CLI running
- [ ] Modern browser available for preview (Chrome, Firefox, Safari)
- [ ] Starting state: `/sb:setup` completes Phase 4 (sample generation) successfully

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:setup` and complete Phases 1-4 | Claude Code CLI | Sample deck generated, "How does this look?" prompt appears |
| 2 | Provide feedback: "Make it bolder" | Claude Code CLI | System acknowledges feedback, indicates theme adjustments |
| 3 | Wait for sample regeneration | Claude Code CLI | "Regenerating sample slides..." followed by "Sample deck updated" |
| 4 | Open updated sample slides in browser | Browser | Slides show higher contrast, stronger colors |
| 5 | Provide feedback: "Colors are too warm" | Claude Code CLI | System adjusts color temperature |
| 6 | Wait for second regeneration | Claude Code CLI | Sample deck regenerated with cooler palette |
| 7 | Respond with "Perfect" or "Approved" | Claude Code CLI | System confirms approval, begins finalization |
| 8 | Verify templates directory created | File system | `.slide-builder/templates/` exists |
| 9 | Count files in templates directory | File system | 6 layout template files present |
| 10 | Verify template naming | File system | Files named layout-title.html, layout-list.html, etc. |
| 11 | Verify theme-history entry | File system | `.slide-builder/theme-history/theme-v1-*.json` exists |
| 12 | Check theme.json version | File read | meta.version reflects final version |

### Success Criteria (What User Sees)
- [ ] Feedback prompt appears after sample deck display
- [ ] System interprets gestalt feedback (not asking for specific values)
- [ ] Theme primitives change based on feedback type:
  - "bolder" → higher contrast, reduced corner radius, increased font weights
  - "colors off" → color adjustments, may ask clarifying question
  - "too corporate" → softer colors, larger corner radius, warmer tones
- [ ] Sample slides regenerate with updated theme
- [ ] After 3 feedback rounds, escape hatch offered (direct JSON editing)
- [ ] On approval: templates/ created with 6 layout files
- [ ] On approval: theme-history/ contains version snapshot
- [ ] Completion message shows next steps
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you provide gestalt feedback and see meaningful theme changes?
2. Did the regenerated samples reflect your feedback accurately?
3. Was the approval flow clear and intuitive?
4. Were templates created with correct naming after approval?

## Tasks / Subtasks

- [x] **Task 1: Implement Feedback Interpreter Module** (AC: 1)
  - [x] 1.1: Create feedback parsing logic to identify feedback type
  - [x] 1.2: Map gestalt terms to theme adjustments per tech spec table:
    - "too corporate" → softer colors, larger corner radius, warmer tones
    - "not bold enough" → higher contrast, smaller corner radius, heavier weights
    - "colors off" → re-weight extractions, ask clarifying question
    - "too busy" → increase whitespace, reduce shadows
    - "too plain" → add accent usage, increase shadow depth
  - [x] 1.3: Handle ambiguous feedback by asking clarifying questions
  - [x] 1.4: Generate theme modification instructions from parsed feedback

- [x] **Task 2: Implement Theme Update Logic** (AC: 1, 2)
  - [x] 2.1: Apply feedback-derived modifications to theme.json
  - [x] 2.2: Recalculate dependent values (e.g., text colors for contrast)
  - [x] 2.3: Preserve unaffected theme sections
  - [x] 2.4: Save updated theme.json to `.slide-builder/theme.json`

- [x] **Task 3: Implement Sample Deck Regeneration** (AC: 2)
  - [x] 3.1: Re-invoke frontend-design skill for all 6 slides with updated theme
  - [x] 3.2: Follow same sample generation flow as Story 2.4
  - [x] 3.3: Overwrite existing samples with regenerated versions
  - [x] 3.4: Report progress during regeneration

- [x] **Task 4: Implement Iteration Tracking** (AC: 6)
  - [x] 4.1: Track feedback iteration count in status.yaml
  - [x] 4.2: After 3 iterations, check if user still not satisfied
  - [x] 4.3: Offer direct theme.json editing as escape hatch
  - [x] 4.4: Document escape hatch path in completion message

- [x] **Task 5: Implement Template Finalizer Module** (AC: 3, 4, 5)
  - [x] 5.1: On approval, create `.slide-builder/templates/` directory
  - [x] 5.2: Copy sample files to templates with naming conversion:
    - `01-title.html` → `layout-title.html`
    - `02-agenda.html` → `layout-list.html`
    - `03-flow.html` → `layout-flow.html`
    - `04-comparison.html` → `layout-columns-2.html`
    - `05-callout.html` → `layout-callout.html`
    - `06-technical.html` → `layout-code.html`
  - [x] 5.3: Update theme.json layouts section with file references
  - [x] 5.4: Create `.slide-builder/theme-history/` directory if not exists
  - [x] 5.5: Save theme snapshot to `theme-history/theme-v1-{date}.json`

- [x] **Task 6: Update Setup Workflow Instructions - Phase 5** (AC: 1-6)
  - [x] 6.1: Expand Phase 5 placeholder in setup/instructions.md
  - [x] 6.2: Add feedback loop with iteration counter
  - [x] 6.3: Add action to interpret feedback and modify theme
  - [x] 6.4: Add action to regenerate samples
  - [x] 6.5: Add check for 3+ iterations and escape hatch offer
  - [x] 6.6: Add finalization actions (copy to templates, save history)
  - [x] 6.7: Update status.yaml with phase completion

- [x] **Task 7: Testing and Validation** (AC: 1-6)
  - [x] 7.1: Test feedback "make it bolder" → verify higher contrast
  - [x] 7.2: Test feedback "too corporate" → verify softer tones
  - [x] 7.3: Test approval flow → verify templates created
  - [x] 7.4: Test 4 iterations → verify escape hatch offered
  - [x] 7.5: Verify theme-history entry created with timestamp
  - [x] 7.6: Verify theme.json layouts section updated

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Feedback Interpreter Module:**
- Parses natural language feedback ("too corporate", "bolder colors", "warmer feel")
- Maps to specific theme adjustments (color temperature, contrast, corner radius, font weight)
- Returns modification instructions for Theme Synthesizer re-run

**From Tech Spec - Template Finalizer Module:**
- On user approval, copies sample files to templates/
- Renames: `sample-1-title.html` → `layout-title.html`
- Updates theme.json layouts section with file references
- Saves theme version to theme-history/

**Feedback Interpretation Mapping (from Tech Spec):**

| User Feedback | Theme Adjustments |
|---------------|-------------------|
| "Too corporate" | Softer colors (+10% saturation reduction), larger corner radius (+4px), warmer text colors |
| "Not bold enough" | Higher contrast (darken primary by 15%), reduce corner radius (-4px), increase font weights |
| "Colors off" | Re-weight extraction sources, ask clarifying question about desired palette |
| "Too busy" | Increase whitespace (larger margins), reduce shadow intensity, simplify shapes |
| "Too plain" | Add accent color usage, increase shadow depth, add subtle gradients |
| "Fonts don't feel right" | Re-analyze sources for alternate fonts, ask for specific preference |

**Phase 5 Workflow Sequence (from Tech Spec):**
```
Phase 5: Feedback Loop (Story 2.5)
┌─────────────────────────────────────────────────────────────┐
│ LOOP (max 3 iterations recommended):                        │
│                                                             │
│ 1. Ask: "How does this look? (Perfect / feedback)"          │
│                                                             │
│ IF feedback provided:                                       │
│   → Interpret gestalt feedback                              │
│   → Map to theme adjustments                                │
│   → Update theme.json                                       │
│   → Regenerate all 6 samples                                │
│   → Return to step 1                                        │
│                                                             │
│ IF "Perfect" or approved:                                   │
│   → Exit loop, proceed to finalization                      │
│                                                             │
│ IF 3+ iterations and still not satisfied:                   │
│   → Offer direct theme.json editing as escape hatch         │
└─────────────────────────────────────────────────────────────┘
```

**Key Architecture Constraints:**
- Per ADR-002: Templates generated during setup, reused during build
- Per Architecture: theme-history/ directory for version snapshots
- Per NFR5: Theme feedback loop iteration should "feel responsive"
- Per NFR15: Theme changes don't corrupt existing slides
- Target 1-3 feedback rounds (per PRD)

### Project Structure Notes

**From Architecture - Template Storage:**
```
.slide-builder/
├── samples/               # INPUT: From Story 2.4
│   ├── 01-title.html
│   ├── 02-agenda.html
│   ├── 03-flow.html
│   ├── 04-comparison.html
│   ├── 05-callout.html
│   └── 06-technical.html
├── templates/             # OUTPUT: Created by this story
│   ├── layout-title.html
│   ├── layout-list.html
│   ├── layout-flow.html
│   ├── layout-columns-2.html
│   ├── layout-callout.html
│   └── layout-code.html
├── theme.json            # MODIFIED: layouts section updated
└── theme-history/        # OUTPUT: Version snapshots
    └── theme-v1-2026-01-27.json
```

**File Naming Mapping (existing → template):**

| Sample File (from 2.4) | Template File |
|------------------------|---------------|
| 01-title.html | layout-title.html |
| 02-agenda.html | layout-list.html |
| 03-flow.html | layout-flow.html |
| 04-comparison.html | layout-columns-2.html |
| 05-callout.html | layout-callout.html |
| 06-technical.html | layout-code.html |

Note: Story 2.4 used naming convention `01-title.html` rather than `sample-1-title.html` as originally spec'd. Template finalizer must use actual file names.

### Learnings from Previous Story

**From Story 2-4-sample-deck-generation (Status: done)**

- **Sample slide naming:** Using `01-title.html`, `02-agenda.html` pattern (not `sample-1-title.html`) - template finalizer must account for this
- **6 samples verified:** All 6 slides exist in `.slide-builder/samples/` and are working
- **CSS variable pattern:** All slides use CSS variables from theme.json - regeneration will automatically use updated values
- **1920x1080 dimensions:** All slides render at correct dimensions
- **frontend-design skill invocation:** Documented in Phase 4 workflow steps 4.2.0 - can reuse same pattern for regeneration
- **Phase 4 workflow expanded:** setup/instructions.md has complete Phase 4 - Phase 5 placeholder ready for expansion

**Key Interface from Previous Story:**
- Sample files at `.slide-builder/samples/` are input for template finalization
- Regeneration follows same frontend-design skill pattern from Phase 4
- status.yaml tracks current phase - will update to "feedback-loop" during Phase 5

[Source: notes/sprint-artifacts/2-4-sample-deck-generation.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story 2.5: Theme Feedback Loop] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Services and Modules] - Feedback Interpreter and Template Finalizer modules
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Feedback Interpretation Mapping] - Gestalt feedback → theme adjustments table
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Workflows and Sequencing] - Phase 5 Feedback Loop flow
- [Source: notes/architecture.md#Project Structure] - templates/ and theme-history/ directory locations
- [Source: notes/architecture.md#ADR-002: Hybrid Template + Skill Generation] - Templates from setup reused during build
- [Source: notes/epics.md#Story 2.5: Theme Feedback Loop] - User story and AC definitions
- [Source: notes/prd.md#Theme Management] - FR5-FR7 feedback requirements

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/2-5-theme-feedback-loop.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**2026-01-27 - Implementation Plan:**
- Task 6 is the primary implementation task (expand Phase 5 in setup/instructions.md)
- Tasks 1-5 define the logic that will be embedded in the workflow instructions
- Task 7 is validation after implementation
- Approach: Implement complete Phase 5 workflow in instructions.md, which embeds all feedback interpretation, theme update, regeneration, iteration tracking, and finalization logic

### Completion Notes List

- **2026-01-27:** Implemented complete Phase 5 (Feedback Loop) and Phase 6 (Finalization) workflow in setup/instructions.md
  - Phase 5 includes: feedback collection (step 5.1), approval detection (5.2), gestalt feedback interpretation with mapping table (5.3), theme modification with validation (5.4), sample regeneration with frontend-design skill (5.5), iteration tracking with escape hatch at 3+ rounds (5.6)
  - Phase 6 includes: theme locking (step 6), template creation with correct naming mapping (6.1), theme.json layouts update (6.2), theme-history versioning (6.3), status.yaml completion (6.4)
  - All feedback patterns from tech spec implemented: corporate, bold, colors, busy, plain, fonts
  - Clarifying questions for ambiguous feedback implemented
  - Escape hatch offers direct JSON editing after 3 iterations
- **2026-01-27:** ✅ Test Gate PASSED by Vishal
- **2026-01-27:** ✅ Story marked DONE - Definition of Done complete

### File List

| File | Status | Description |
|------|--------|-------------|
| .slide-builder/workflows/setup/instructions.md | MODIFIED | Expanded Phase 5 placeholder (lines 1499-1518) and Phase 6 placeholder (lines 1520-1541) with complete feedback loop and finalization workflow (~350 lines added) |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete - Phase 5 & 6 workflow expanded | Dev Agent (Opus 4.5) |
| 2026-01-27 | Test Gate PASSED - Story ready for review | Vishal |
