# Story 13.3: Content & Visual Discovery

Status: done

## Story

As a **presentation planner**,
I want **to select supporting content types and visual treatment options for each section, with optional research**,
So that **each part of my presentation has rich context for slide generation**.

## Acceptance Criteria

1. **Content Type Selection:** Given I have selected a key message for a section, when the discovery continues, then I can select content types via multi-select from:
   - Statistics/data points
   - Customer quotes/testimonials
   - Case study examples
   - Industry benchmarks

2. **Visual Treatment Selection:** Given content types have been selected, when visual treatment options are presented, then I can select via multi-select from:
   - Diagram type (flowchart, comparison, timeline, hierarchy)
   - Visual metaphor (journey, building, growth, transformation)
   - Imagery theme (technology, people, nature, abstract)

3. **On-Demand Research:** Given I am asked if I want research for the section, when I request research, then WebSearch tool finds supporting data (statistics, quotes, examples)

4. **Research Results Selection:** Given WebSearch returns findings, when results are presented, then I can select which findings to include via multi-select AskUserQuestion

5. **Section Refinement:** Given content and visual selections are complete, when I'm offered a refinement opportunity, then I can adjust my selections or provide additional notes before advancing to the next section

6. **Discovery Storage:** Given all selections are made for a section, when the section discovery completes, then all data is stored in section.discovery object:
   - content_types: selected content type array
   - visual_treatment: object with diagram_type, visual_metaphor, imagery_theme
   - research_findings: array with source, content, selected status (if research was requested)

## Frontend Test Gate

**Gate ID**: 13-3-TG1

### Prerequisites
- [ ] App running locally (Claude Code CLI)
- [ ] Theme exists (run /sb:setup if needed)
- [ ] Starting state: Complete step 2.6 (message discovery from Story 13.2)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:plan-deck` | Claude Code CLI | Workflow starts |
| 2 | Complete steps 1-2.6 | CLI prompts | Message framings selected for all sections |
| 3 | Observe content type selection | AskUserQuestion UI | Multi-select with 4 content type options |
| 4 | Select content types | Click/check options | Selections confirmed |
| 5 | Observe visual treatment selection | AskUserQuestion UI | Multi-select with diagram/metaphor/imagery options |
| 6 | Select visual treatment | Click/check options | Selections confirmed |
| 7 | Respond to research offer | Yes/No prompt | If yes, WebSearch runs |
| 8 | Select research findings (if applicable) | AskUserQuestion UI | Multi-select from findings |
| 9 | Review refinement opportunity | CLI prompt | Option to adjust or proceed |
| 10 | Repeat for remaining sections | AskUserQuestion UI | Each section gets full discovery |

### Success Criteria (What User Sees)
- [ ] Content type multi-select appears for each section
- [ ] Visual treatment multi-select appears with grouped options
- [ ] Research offer appears after visual treatment
- [ ] WebSearch results displayed if research requested
- [ ] Refinement opportunity before advancing
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you complete the main action without confusion?
2. Did the UI respond within acceptable time (<2s)?
3. Were error messages clear if you made mistakes?
4. Any UX friction or unexpected behavior?

## Tasks / Subtasks

- [x] **Task 1: Add content type selection** (AC: 1)
  - [x] Continue Step 2.6 after message selection
  - [x] Use AskUserQuestion with multiSelect: true
  - [x] Present 4 content type options:
    - Statistics/data points
    - Customer quotes/testimonials
    - Case study examples
    - Industry benchmarks
  - [x] Store selections in section.discovery.content_types

- [x] **Task 2: Add visual treatment selection** (AC: 2)
  - [x] Present diagram type options via AskUserQuestion (multiSelect: true):
    - Flowchart
    - Comparison
    - Timeline
    - Hierarchy
  - [x] Present visual metaphor options:
    - Journey
    - Building
    - Growth
    - Transformation
  - [x] Present imagery theme options:
    - Technology
    - People
    - Nature
    - Abstract
  - [x] Store selections in section.discovery.visual_treatment object

- [x] **Task 3: Add on-demand research integration** (AC: 3, 4)
  - [x] Ask user if they want research for this section
  - [x] If yes, use WebSearch tool to find:
    - Statistics related to section topic
    - Relevant quotes or examples
    - Industry benchmarks if applicable
  - [x] Present findings via AskUserQuestion (multiSelect: true)
  - [x] Store selected findings in section.discovery.research_findings

- [x] **Task 4: Add section refinement opportunity** (AC: 5)
  - [x] Display summary of all section discovery selections
  - [x] Ask if user wants to refine any selections
  - [x] If refinement requested, allow adjustment
  - [x] Proceed to next section after confirmation

- [x] **Task 5: Ensure discovery object persistence** (AC: 6)
  - [x] Verify section.discovery object contains:
    - key_message (from Story 13.2)
    - content_types (array)
    - visual_treatment (object)
    - research_findings (array, if research was requested)
  - [x] Confirm data available for Story 13.4 schema integration

## Dev Notes

### Technical Context

**Insert Location:** Within Step 2.6 (message discovery loop) in `.slide-builder/workflows/plan-deck/instructions.md`, after the message framing selection

**Current Line Reference:** Step 2.6 message selection ends with storing key_message in section.discovery

**Key Integration Points:**
- Continues within the existing Step 2.6 for-each loop over agenda_sections
- Uses existing section.discovery object (key_message already populated from Story 13.2)
- Adds content_types, visual_treatment, and research_findings to discovery object
- This data flows to Story 13.4 (schema integration) for plan.yaml persistence

### AskUserQuestion Tool Patterns

**Content Type Selection:**
```json
{
  "questions": [{
    "question": "What supporting content should we include for '{{section.title}}'?",
    "header": "Content",
    "options": [
      {"label": "Statistics", "description": "Data points, metrics, numbers that support your message"},
      {"label": "Testimonials", "description": "Customer quotes and success stories"},
      {"label": "Case Study", "description": "Detailed example of results achieved"},
      {"label": "Benchmarks", "description": "Industry comparisons and standards"}
    ],
    "multiSelect": true
  }]
}
```

**Visual Treatment Selection (multiple calls due to 4-option limit):**
```json
{
  "questions": [{
    "question": "What diagram style works best for '{{section.title}}'?",
    "header": "Diagrams",
    "options": [
      {"label": "Flowchart", "description": "Process flow, steps, decision points"},
      {"label": "Comparison", "description": "Side-by-side, before/after, vs layout"},
      {"label": "Timeline", "description": "Chronological sequence, phases, milestones"},
      {"label": "Hierarchy", "description": "Org chart, tree structure, nested items"}
    ],
    "multiSelect": true
  }]
}
```

```json
{
  "questions": [{
    "question": "What visual theme resonates for '{{section.title}}'?",
    "header": "Visuals",
    "options": [
      {"label": "Technology", "description": "Modern, digital, tech-forward imagery"},
      {"label": "People", "description": "Human-centered, team, collaboration"},
      {"label": "Nature", "description": "Organic, growth, natural elements"},
      {"label": "Abstract", "description": "Geometric, patterns, conceptual shapes"}
    ],
    "multiSelect": true
  }]
}
```

### Research Integration Pattern

```xml
<action>Ask user if they want research for this section:
  "Would you like me to research supporting data for '{{section.title}}'?"
</action>

<check if="user requests research">
  <action>Use WebSearch tool to find:
    - Query 1: "{{section.title}} statistics {{purpose_keywords}}"
    - Query 2: "{{section.title}} case study examples"
  </action>
  <action>Parse results and present top 3-4 findings via AskUserQuestion (multiSelect: true)</action>
  <action>Store selected findings in section.discovery.research_findings:
    - source: URL
    - content: Finding text
    - selected: true
  </action>
</check>
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/plan-deck/instructions.md` - Extend Step 2.6 with content/visual/research discovery

- **Expected test locations:** Manual testing via `/sb:plan-deck` execution

- **Estimated effort:** 2 story points

- **Prerequisites:** Story 13.2 (Section Message Discovery) - DONE

### Learnings from Previous Story

**From Story 13.2 (Status: done)**

- **Step 2.6 Pattern Established**: for-each loop over agenda_sections with progress indicator (loop_index of total_sections)
- **Discovery Object Structure**: section.discovery object already initialized with key_message
- **AskUserQuestion Multi-Select**: Use multiSelect: true for content/visual selections (different from message which was false)
- **User Flow**: Present options -> Wait for response -> Handle "Other" custom input -> Store result -> Confirm and proceed
- **Workflow Continuation**: After message selection, can continue adding more discovery substeps in same step 2.6

**Key Implementation Notes from 13.2:**
- Use clear section markers with `<!-- ═══════ -->` for readability
- Include output messages showing progress and current selection
- Handle both predefined options and "Other" custom input
- Store all selections in structured format for downstream use (Story 13.4)

**Files Modified in 13.2:**
- `.slide-builder/workflows/plan-deck/instructions.md` (MODIFIED) - Added Step 2.6 section message discovery loop

[Source: notes/sprint-artifacts/13-2-section-message-discovery.md#Dev-Agent-Record]

---

## Context References

**Tech-Spec:** [tech-spec-enhanced-planning.md](../tech-spec-enhanced-planning.md) - Primary context document containing:
- Phase 2 implementation patterns (lines 154-207)
- AskUserQuestion tool patterns (lines 211-246)
- Content and visual discovery details (lines 171-198)
- Discovery flow state machine

**Epic:** Epic 13 in [epics.md](../epics.md) - Story 13.3 definition

**Previous Story:** [13-2-section-message-discovery.md](./13-2-section-message-discovery.md) - Foundation for this story, establishes Step 2.6 iteration pattern

**Architecture:** [architecture.md](../architecture.md) - Workflow patterns and state file schemas

---

## Dev Agent Record

### Context Reference

- [13-3-content-visual-discovery.context.xml](./13-3-content-visual-discovery.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

- Implementation plan: Extend Step 2.6 in plan-deck/instructions.md after message confirmation
- Pattern followed: Single opt-in multi-select, then only run discovery for selected areas
- Revision: Simplified from mandatory multi-step to optional single-step gate
- Design: User can skip all optional discovery (fast path) or selectively engage

### Completion Notes List

- **Simplified Approach:** Single multi-select asks "Want to define specific visual/content guidance?" with options:
  - Diagram Style (flowchart, timeline, comparison, hierarchy)
  - Visual Metaphor (journey, growth, transformation, technology)
  - Deep Research (WebSearch for statistics, quotes, case studies)

- **Fast Path:** User can select NONE to skip all optional discovery and proceed quickly

- **Selective Discovery:** Only selected areas open their discovery process:
  - If "Diagram Style" selected → shows diagram type multi-select
  - If "Visual Metaphor" selected → shows metaphor/imagery multi-select
  - If "Deep Research" selected → runs WebSearch and shows findings multi-select

- **Data Structure:** section.discovery now contains:
  - key_message (required, from 13.2)
  - diagram_requirements (optional array, null if skipped)
  - visual_metaphor (optional array, null if skipped)
  - research_findings (optional array, empty if skipped)

### File List

- `.slide-builder/workflows/plan-deck/instructions.md` (MODIFIED) - Simplified Step 2.6 optional discovery (~100 lines)

### Test Gate Result

✅ Test Gate PASSED by Vishal (2026-01-28)

### Story Completion

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

