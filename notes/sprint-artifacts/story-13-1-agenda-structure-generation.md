# Story 13.1: Agenda Structure Generation

**Status:** done

---

## User Story

As a **presentation planner**,
I want **the agent to propose a high-level agenda with 4-8 sections after I provide my purpose and audience**,
So that **I can structure my presentation around clear narrative stages before diving into details**.

---

## Acceptance Criteria

**Given** I have provided purpose, audience, key points, and length via the existing plan-deck prompts
**When** the agent analyzes my input
**Then** it proposes 4-8 agenda sections with:
- Unique id (agenda-1, agenda-2, etc.)
- Title (e.g., "The Problem", "Our Solution", "Results")
- Narrative role (opening | context | problem | solution | evidence | cta)
- Estimated slides (1-3 per section)
- Brief description (1 sentence)

**And** I can select/deselect sections via Claude Code's AskUserQuestion multi-select UI

**And** I can add custom sections via the "Other" option

**And** confirmed sections are stored in the workflow variable `{{agenda_sections}}` for Phase 2 discovery

**And** if I select fewer than 3 sections, I receive a warning that the presentation may be too brief

---

## Implementation Details

### Tasks / Subtasks

- [x] 1. **Add step 2.5 to plan-deck/instructions.md** (~line 145, after context collection)
   - [x] Insert new `<step n="2.5" goal="Generate and refine agenda structure">`
   - [x] Move before step 3 (narrative generation)

- [x] 2. **Implement agenda proposal logic**
   - [x] Analyze `{{purpose}}`, `{{audience}}`, `{{key_points}}`, `{{desired_length}}`
   - [x] Generate 4-8 sections based on content analysis
   - [x] Map each section to a narrative_role

- [x] 3. **Add AskUserQuestion tool call for section selection**
   - [x] Use multiSelect: true
   - [x] Present sections in groups of 4 (tool limit)
   - [x] Include section title as label, description as description
   - [x] Store selections in `{{agenda_sections}}`

- [x] 4. **Handle custom section input via "Other"**
   - [x] If user provides custom text, parse into new section
   - [x] Generate id, title, narrative_role, estimated_slides, description

- [x] 5. **Add validation for minimum sections**
   - [x] If fewer than 3 sections selected, display warning
   - [x] Allow user to proceed anyway or select more

### Technical Summary

Insert a new workflow step that:
1. Analyzes collected presentation context
2. Proposes agenda sections using content-based heuristics
3. Presents sections via Claude Code's AskUserQuestion with multiSelect: true
4. Stores confirmed sections for use in Phase 2 discovery (Story 13.2)

The key technical integration is using `AskUserQuestion` tool:
```json
{
  "questions": [{
    "question": "Which agenda sections should we include in your presentation?",
    "header": "Agenda",
    "options": [
      {"label": "Opening Hook", "description": "Attention-grabbing intro that connects to audience's situation"},
      {"label": "The Problem", "description": "Define the challenge or pain point being addressed"},
      {"label": "Our Solution", "description": "Present your approach and key differentiators"},
      {"label": "Results & Proof", "description": "Evidence, metrics, case studies supporting the solution"}
    ],
    "multiSelect": true
  }]
}
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/plan-deck/instructions.md` - Add step 2.5
  - `.slide-builder/workflows/plan-deck/workflow.yaml` - Add agenda_sections variable

- **Expected test locations:** Manual testing via `/sb:plan-deck` execution

- **Estimated effort:** 2 story points

- **Prerequisites:** None (first story in Epic 13)

### Key Code References

**Context collection (existing step 2):**
`.slide-builder/workflows/plan-deck/instructions.md:74-144`

**Narrative generation (step 3 to modify later):**
`.slide-builder/workflows/plan-deck/instructions.md:146-213`

**Template matching keywords (reference for section generation):**
`.slide-builder/workflows/plan-deck/instructions.md:162-176`

---

## Context References

**Tech-Spec:** [tech-spec-enhanced-planning.md](../tech-spec-enhanced-planning.md) - Primary context document containing:

- Brownfield codebase analysis
- AskUserQuestion tool patterns
- Enhanced plan.yaml schema
- Complete implementation guidance

**Epic:** [epic-13-enhanced-planning.md](./epic-13-enhanced-planning.md)

---

## Dev Agent Record

### Context Reference

- [13-1-agenda-structure-generation.context.xml](./13-1-agenda-structure-generation.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan (2026-01-28):**
1. Insert new step 2.5 between step 2 (context collection) and step 3 (narrative generation)
2. Follow existing BMAD workflow XML patterns: `<step>`, `<action>`, `<check>`, `<output>`, `<ask>`, `<goto>`
3. Use AskUserQuestion tool with multiSelect: true for section selection
4. Handle 4-option limit by documenting multiple question calls
5. Add custom section parsing with narrative_role inference from keywords
6. Add minimum sections validation with warning and option to add more

**Key Decisions:**
- Used purpose-based heuristics to generate appropriate agenda structure (pitch → problem-solution, demo → walkthrough, etc.)
- Split section selection into multiple AskUserQuestion calls to handle 4-option limit
- Custom section parsing infers narrative_role from keywords (intro→opening, problem→problem, etc.)
- Default estimated_slides=2 for custom sections
- Minimum threshold set at 3 sections with warning but allow proceed

### Completion Notes

**Implemented Step 2.5** with full agenda structure generation:
- Analyzes purpose/audience/key_points/desired_length to propose 4-8 sections
- Each section has: id, title, narrative_role, estimated_slides, description
- Uses AskUserQuestion multiSelect: true for user confirmation
- Handles "Other" custom input with automatic field generation
- Validates minimum 3 sections with warning if too few
- Stores confirmed sections in `{{agenda_sections}}` for Phase 2 (Story 13.2)

**Added workflow variables:**
- `proposed_agenda`: Holds generated sections before user selection
- `agenda_sections`: User-confirmed sections for downstream use
- Updated workflow_version to 2.1

### Files Modified

- `.slide-builder/workflows/plan-deck/instructions.md` - Added step 2.5 (agenda structure generation)
- `.slide-builder/workflows/plan-deck/workflow.yaml` - Added agenda_sections and proposed_agenda variables

### Test Results

✅ Test Gate PASSED by Vishal (2026-01-28)

Manual testing via `/sb:plan-deck` confirmed:
- Step 2.5 appears after context collection
- Agenda sections proposed with complete structure
- AskUserQuestion multi-select available for section selection
- Minimum sections validation working
- Confirmed sections stored for Phase 2 discovery

---

## Review Notes

<!-- Will be populated during code review -->
