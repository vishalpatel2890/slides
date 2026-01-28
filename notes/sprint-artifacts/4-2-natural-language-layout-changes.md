# Story 4.2: Natural Language Layout Changes

Status: done

## Story

As a **user**,
I want **to describe layout changes in plain English**,
So that **I can modify slide structure without technical knowledge**.

## Acceptance Criteria

1. **AC4.2.1:** Given a slide is loaded for editing, when the user describes a layout change (e.g., "Move the diagram to the right"), then the system reads current slide HTML
2. **AC4.2.2:** The system reads existing text edits from slide-state.json before regeneration
3. **AC4.2.3:** The system regenerates the layout based on the instruction using frontend-design skill
4. **AC4.2.4:** The system preserves all user text edits by reapplying them to matching data-field selectors
5. **AC4.2.5:** The regenerated slide maintains theme consistency (uses theme CSS variables)
6. **AC4.2.6:** The user text content is not lost during layout regeneration
7. **AC4.2.7:** Given the user makes multiple edit requests, when each request is processed, then previous text edits continue to persist
8. **AC4.2.8:** The regenerated slide is saved to the original slide file location
9. **AC4.2.9:** status.yaml is updated with last_action describing the edit operation

## Frontend Test Gate

**Gate ID**: 4-2-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] A slide exists that was built via `/sb:build-one`
- [ ] Edit workflow invoked via `/sb:edit` (Story 4.1 complete)
- [ ] User has made at least 1 text edit in the slide via browser contenteditable
- [ ] Starting state: Slide loaded for editing with edit instruction prompt visible

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open slide in browser, edit the title text | Browser - click on title element | Title becomes editable, change saved to state |
| 2 | Run `/sb:edit` and provide instruction "Add a subtitle below the title" | Claude Code CLI | System confirms understanding and proceeds |
| 3 | Observe regeneration | CLI output | "Regenerating layout..." indicator shown |
| 4 | View regenerated slide | Browser - refresh or reopen slide.html | New subtitle element visible, original title edit PRESERVED |
| 5 | Inspect slide HTML | Browser DevTools or file | All text elements have contenteditable and data-field attributes |
| 6 | Verify theme CSS | Browser DevTools | CSS variables (--color-primary, etc.) present in :root |
| 7 | Run second `/sb:edit` with "Make the title bigger" | Claude Code CLI | Second regeneration preserves all previous edits |
| 8 | Check status.yaml | File system | last_action reflects edit operation |

### Success Criteria (What User Sees)
- [ ] Layout change reflected in regenerated slide (e.g., subtitle added, element repositioned)
- [ ] Original text edits preserved after regeneration
- [ ] Multiple edit cycles preserve all accumulated text edits
- [ ] Theme styling consistent (colors, fonts match theme.json)
- [ ] All text elements remain contenteditable with data-field attributes
- [ ] status.yaml updated with edit action description
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did the layout change match your natural language description?
2. Were your text edits actually preserved, or did you lose any content?
3. Did the regeneration feel responsive (under 30 seconds)?
4. Was the theme styling consistent between original and regenerated slide?

## Tasks / Subtasks

- [x] **Task 1: Implement Layout Regenerator Module** (AC: 3, 5)
  - [x] 1.1: Load theme.json for style consistency during regeneration
  - [x] 1.2: Prepare frontend-design skill invocation with:
    - Current slide HTML as reference
    - User's edit instruction
    - Theme object (colors, typography, shapes)
    - Constraints: 1920x1080, contenteditable required, data-field required
    - List of existing data-field values to preserve where possible
  - [x] 1.3: Invoke frontend-design skill with prepared context
  - [x] 1.4: Receive new HTML layout from skill
  - [x] 1.5: Validate response has:
    - contenteditable="true" on all text elements
    - data-field attributes on text elements
    - Theme CSS variables in :root
    - Correct 1920x1080 dimensions

- [x] **Task 2: Implement Current Slide Reading** (AC: 1, 2)
  - [x] 2.1: Read current slide HTML from target path (determined in Story 4.1)
  - [x] 2.2: Parse HTML to extract all data-field values and their current content
  - [x] 2.3: Read slide-state.json to get all saved text edits
  - [x] 2.4: Merge browser localStorage edits with state file (if applicable)
  - [x] 2.5: Build complete edit collection: [{selector, content, lastModified}]

- [x] **Task 3: Implement Edit Reapplicator Module** (AC: 4, 6, 7)
  - [x] 3.1: After receiving new HTML from Layout Regenerator:
    - For each saved edit in edit collection
    - Search new HTML for element matching data-field selector
  - [x] 3.2: If matching element found:
    - Replace element's innerHTML with saved content
    - Mark edit as "applied"
  - [x] 3.3: If no matching element found:
    - Mark edit as "orphaned" (handled in Story 4.3)
    - Preserve in state file, do not delete
  - [x] 3.4: Ensure auto-save JavaScript is present in final HTML
  - [x] 3.5: Test multiple edit cycles preserve accumulated edits

- [x] **Task 4: Implement Slide Persister Module** (AC: 8, 9)
  - [x] 4.1: Write final HTML to original slide file location
  - [x] 4.2: Update slide-state.json:
    - Preserve all edits (applied + orphaned)
    - Update lastModified timestamp
    - Increment regenerationCount
  - [x] 4.3: Update status.yaml:
    - Set last_action: "Layout edited: [user instruction summary]"
    - Add history entry with:
      - action description
      - timestamp
      - preserved_edits count
      - orphaned_edits count (if any)

- [x] **Task 5: Update Edit Workflow Instructions** (AC: 1-9)
  - [x] 5.1: Extend `.slide-builder/workflows/edit/instructions.md`:
    - Add Phase 5A: Layout Regeneration (invoke frontend-design skill)
    - Add Phase 5B: Edit Reapplication (match and inject saved edits)
    - Add Phase 5C: Save and Report (write files, update status)
  - [x] 5.2: Update workflow.yaml if needed for new phase configuration
  - [x] 5.3: Ensure workflow handles both single mode and deck mode consistently

- [x] **Task 6: Testing - Edit Preservation Verification** (AC: 4, 6, 7)
  - [x] 6.1: Test: Edit slide title, regenerate layout, verify title edit preserved
  - [x] 6.2: Test: Edit 3 different fields, regenerate, verify all 3 preserved
  - [x] 6.3: Test: Multiple sequential /edit commands, verify cumulative edits preserved
  - [x] 6.4: Test: Verify theme CSS variables present in regenerated slide
  - [x] 6.5: Test: Verify status.yaml updated with edit action
  - [x] 6.6: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Layout Regenerator Module:**

This story implements the Layout Regenerator module from the tech spec. The module is responsible for:
- Constructing frontend-design skill invocation with current HTML, instruction, theme, and constraints
- Invoking the skill and receiving new HTML layout
- Validating the response has required attributes (contenteditable, data-field, theme CSS)

```
Module: Layout Regenerator (from Tech Spec)
Responsibility: Invokes frontend-design skill with edit instruction
Inputs: Theme, current layout, edit instruction
Outputs: New slide HTML
```

**From Tech Spec - Edit Reapplicator Module:**

This story also implements the Edit Reapplicator module which:
- Iterates through all saved edits from state file
- For each edit, searches new HTML for matching data-field selector
- If match found: replaces element innerHTML with saved content
- If no match: marks edit as orphaned, preserves in state file (Story 4.3 handles orphan UX)

```
Module: Edit Reapplicator (from Tech Spec)
Inputs: New HTML, saved edits
Outputs: HTML with edits injected, applied/orphaned edit lists
```

**From Tech Spec - Slide Persister Module:**

Handles file I/O after regeneration:
- Writes final HTML to slide file location
- Updates slide-state.json with orphan warnings and regeneration count
- Updates status.yaml with last_action and history entry

**Key Constraints (from Tech Spec):**

- Regenerated slides MUST maintain all contenteditable and data-field attributes
- State file edits MUST be preserved even if no matching selector exists (orphaned edits)
- Regenerated slides MUST use theme CSS variables consistently
- Layout changes MUST be processed by frontend-design skill for quality assurance
- Per PRD NFR5: Regeneration should feel responsive (target < 30 seconds)

**frontend-design Skill Invocation Pattern:**

Per tech spec, the skill should receive:
```yaml
edit_context:
  slide_path: ".slide-builder/single/slide.html"
  current_html: "<html>...</html>"
  instruction: "Move the diagram to the right side"
  theme: { /* full theme.json contents */ }
  constraints:
    dimensions: "1920x1080"
    required_attributes:
      - "contenteditable='true'"
      - "data-field"
    preserve_fields:
      - "title"
      - "bullet-1"
      # ... all existing data-field values
```

**HTML Slide Pattern (from Architecture):**

Regenerated slides MUST follow this structure:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --color-primary: {{theme.colors.primary}};
      /* All theme CSS variables */
    }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_id}}">
    <!-- ALL text elements MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Title</h1>
  </div>
  <script>/* Auto-save script */</script>
</body>
</html>
```

**Edit Reapplication Algorithm (from Tech Spec):**

```
For each edit in slide-state.json.edits:
    ├─→ selector: "[data-field='title']"
    │   content: "My Custom Title"
    ↓
Search new HTML for element matching selector
    ├─→ FOUND: Replace innerHTML with saved content, mark "applied"
    └─→ NOT FOUND: Add to orphanedEdits array, preserve in state file
```

### Project Structure Notes

**Files to Modify:**

```
.slide-builder/
├── workflows/
│   └── edit/
│       └── instructions.md      # MODIFY - Add Phases 4-6 for regeneration
├── single/
│   ├── slide.html               # MODIFY - Regenerated layout written here
│   └── slide-state.json         # MODIFY - Updated with orphan tracking
└── status.yaml                  # MODIFY - Updated with edit action
```

**Files to Read:**

```
.slide-builder/
├── theme.json                   # READ - Required for style consistency
├── single/
│   ├── slide.html               # READ - Current layout before regeneration
│   └── slide-state.json         # READ - Existing edits to preserve
└── status.yaml                  # READ - Mode detection (from Story 4.1)
```

**Alignment with Architecture:**

Per Architecture Novel Pattern 3 (Text Edit Persistence):
- Read state → generate → reapply edits → save
- Use data-field selectors to match content across layouts
- Never delete state entries, only add/update

Per Architecture ADR-002 (Hybrid Template + Skill Generation):
- Layout regeneration uses frontend-design skill for novel layouts
- Skill receives full theme.json for brand consistency

### Learnings from Previous Story

**From Story 4-1-edit-command-invocation (Status: review)**

- **Edit Workflow Structure:** Workflow directory exists at `.slide-builder/workflows/edit/` with workflow.yaml (v2.0) and instructions.md. This story extends instructions.md with new phases.

- **Mode Detection Pattern:** Status.yaml mode field determines single vs deck mode. Slide path resolution already implemented in Story 4.1.

- **Slide Loader Pattern:** Story 4.1 implemented loading slide HTML and slide-state.json. This story builds on that by adding regeneration logic after the load.

- **State File Schema:** slide-state.json uses `{ slide, edits: [{selector, content}], lastModified }` format. This story adds `orphanedEdits` array and `regenerationCount`.

- **Files Created/Modified:**
  - `.slide-builder/workflows/edit/workflow.yaml` - Enhanced with v2.0, explicit paths
  - `.slide-builder/workflows/edit/instructions.md` - 7-step workflow (extend with Phases 4-6)
  - `.claude/commands/sb/edit.md` - Usage docs already include edit command
  - `.slide-builder/single/slide.html` - Test slide exists with contenteditable/data-field
  - `.slide-builder/single/slide-state.json` - Test state file with 2 edits

- **Key Pattern to Reuse:** The edit workflow invocation flow from Story 4.1:
  1. Parse command arguments
  2. Detect mode from status.yaml
  3. Target correct slide path
  4. Load slide HTML and state
  5. Display info and prompt for instruction
  6. **[NEW in 4.2]** Regenerate layout via frontend-design skill
  7. **[NEW in 4.2]** Reapply saved edits
  8. **[NEW in 4.2]** Save and update status

[Source: notes/sprint-artifacts/4-1-edit-command-invocation.md#Dev-Agent-Record]

### Testing Standards

Per Architecture test strategy and Tech Spec test approach:

**Story 4.2 Test Scenarios:**
- Edit slide title in browser, run `/edit "add subtitle"`, verify title edit preserved
- Request "Move the diagram to the right", verify layout changes
- Request "Make title bigger", verify font size changes in regenerated slide
- Inspect regenerated slide for theme CSS variables
- Check status.yaml has edit action logged with edit description
- Request multiple edits sequentially, verify all previous text edits retained
- Verify regenerated slide saved to original file path

**Edge Cases:**
- Empty edit instruction: Prompt for instruction again
- Very long edit instruction: Pass to skill; may need clarification if too vague
- Theme.json changed since build: Warn user; regenerate with new theme (style update)

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Story 4.2: Natural Language Layout Changes] - AC definitions (AC4.2.1-AC4.2.9)
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Services and Modules] - Layout Regenerator, Edit Reapplicator, Slide Persister modules
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Workflows and Sequencing] - Complete /edit workflow Phases 4-6
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Data Models and Contracts] - slide-state.json schema, edit_context schema
- [Source: notes/architecture.md#Pattern 3: Text Edit Persistence] - State file approach for edit preservation
- [Source: notes/architecture.md#ADR-002: Hybrid Template + Skill Generation] - frontend-design skill usage
- [Source: notes/architecture.md#HTML Slide Pattern] - Required HTML structure for slides
- [Source: notes/epics.md#Story 4.2: Natural Language Layout Changes] - User story and AC context
- [Source: notes/sprint-artifacts/4-1-edit-command-invocation.md#Dev-Agent-Record] - Previous story patterns

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-2-natural-language-layout-changes.context.xml`

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**2026-01-27: Implementation Plan**

Tasks 1-5 implemented via edit workflow instructions enhancement:
- Phase 5A: Layout Regeneration - frontend-design skill invocation with edit_context
- Phase 5B: Edit Reapplication - data-field selector matching algorithm
- Phase 5C: Save and Report - file persistence with state and status updates

Key decisions:
1. Extended existing Phase 5 placeholder into 3 sub-phases (5A, 5B, 5C) for clarity
2. Added validation step to inject missing attributes if frontend-design skill omits them
3. Added auto-save script injection check to ensure browser edits persist
4. Documented complete edit_context schema for skill invocation
5. Updated workflow.yaml to v2.1 with documented variables and skills

### Completion Notes List

- **Tasks 1-5 Complete:** Edit workflow instructions updated with full regeneration logic
- **Phase 5A:** Layout Regenerator module implemented - loads theme, prepares edit_context, invokes frontend-design skill, validates response
- **Phase 5B:** Edit Reapplicator module implemented - matches data-field selectors, applies edits, tracks orphans
- **Phase 5C:** Slide Persister module implemented - writes HTML, updates state file with regenerationCount and orphanedEdits, updates status.yaml with history entry
- **Workflow v2.1:** workflow.yaml updated with Story 4.2 variables and skill dependencies
- **Both modes supported:** Single and deck mode paths handled consistently per Story 4.1 patterns
- **Test Gate PASSED** by Vishal (2026-01-27)

### Completion Notes
**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

**Modified:**
- `.slide-builder/workflows/edit/instructions.md` - Added Phases 5A, 5B, 5C for regeneration, edit reapplication, and persistence
- `.slide-builder/workflows/edit/workflow.yaml` - Updated to v2.1 with Story 4.2 variables and skills documentation

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Tasks 1-5 implemented: Edit workflow enhanced with layout regeneration, edit reapplication, and persistence phases | Dev Agent |
| 2026-01-27 | Frontend Test Gate PASSED - Story ready for review | Dev Agent |
