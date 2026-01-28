# Story 6.2: Theme Editing

Status: done

## Story

As a **user**,
I want **to modify my theme via `/theme-edit` with the same gestalt feedback loop used during setup**,
So that **I can refine my brand settings without running full re-setup and see validated samples before committing changes**.

## Acceptance Criteria

1. **AC6.2.1:** Given a theme exists, when the user runs `/theme-edit`, then they can describe desired changes in natural language
2. **AC6.2.2:** The system interprets gestalt feedback (e.g., "warmer colors", "bolder fonts", "more minimal")
3. **AC6.2.3:** The system applies interpreted changes to theme primitives
4. **AC6.2.4:** Sample slides are regenerated with the updated theme for visual validation
5. **AC6.2.5:** The 6 sample slides demonstrate all theme primitives (title, list, flow, columns, callout, code)
6. **AC6.2.6:** User can approve changes or provide additional feedback
7. **AC6.2.7:** When user approves, theme.json is updated with changes
8. **AC6.2.8:** Templates are regenerated if shape/layout primitives changed
9. **AC6.2.9:** A version entry is created in theme-history before changes are applied
10. **AC6.2.10:** User can cancel editing to discard all changes

## Frontend Test Gate

**Gate ID**: 6-2-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2 or prior editing)
- [ ] Claude Code active in terminal
- [ ] Test user: Solutions Consultant refining their brand configuration
- [ ] Starting state: Existing theme with at least v1 in theme-history
- [ ] Browser available for sample deck preview

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:theme-edit` | Claude Code CLI | System loads current theme and displays summary |
| 2 | Observe backup notification | CLI output | Message: "Current theme saved to history as v{N}" |
| 3 | Provide feedback "warmer colors" | CLI input | System acknowledges and describes planned changes |
| 4 | Wait for sample generation | CLI + Browser | 6 sample slides regenerated and opened in browser |
| 5 | Review sample deck | Browser | Samples show warmer color palette |
| 6 | Provide additional feedback "bolder fonts" | CLI input | System applies cumulative changes |
| 7 | Wait for sample regeneration | CLI + Browser | Updated samples with warmer colors AND bolder fonts |
| 8 | Type "approved" | CLI input | Theme saved, templates regenerated if needed |
| 9 | Check theme.json | File system | meta.version incremented, colors/typography updated |
| 10 | Check theme-history/ | File system | Pre-edit version preserved as theme-v{N-1}-{date}.json |
| 11 | Start new edit, type "cancel" | CLI input | Changes discarded, original theme restored |

### Success Criteria (What User Sees)
- [ ] Current theme summary displayed before edit starts
- [ ] Backup confirmation message with version number
- [ ] Feedback prompt: "What would you like to change?"
- [ ] System describes specific changes for each feedback (e.g., "Shifting colors toward warm spectrum")
- [ ] 6 sample slides generated: title, list, flow, columns, callout, code
- [ ] Samples open automatically in browser
- [ ] Approval prompt after samples: "How does it look? (feedback / approved / cancel)"
- [ ] Multiple feedback rounds work correctly (cumulative changes)
- [ ] "approved" saves theme and increments version
- [ ] "cancel" restores original theme without changes
- [ ] Templates regenerated if shape/layout primitives changed
- [ ] status.yaml updated with edit action in history
- [ ] No console errors
- [ ] No network request failures

### Feedback Questions
1. Was the feedback interpretation accurate (did "warmer" make colors warmer)?
2. Did the sample slides reflect the changes correctly?
3. Was the approval/cancel flow clear?
4. Any UX friction or unexpected behavior in the feedback loop?

## Tasks / Subtasks

- [x] **Task 1: Implement Theme Editor Module** (AC: 2, 3)
  - [x] 1.1: Create feedback interpretation logic:
    - Map "warmer colors" → shift hues toward orange/red, reduce blue tones
    - Map "cooler colors" → shift toward blue/green spectrum
    - Map "bolder" → increase font weights, higher contrast
    - Map "more minimal" → reduce shadows, increase corner radius
    - Map "more corporate" → traditional fonts, navy/gray palette
    - Map "softer" → lower contrast, lighter shadows
    - Map "sharper" → higher contrast, smaller corners
  - [x] 1.2: Apply primitive changes to ThemeJson object
  - [x] 1.3: Document changes made in theme meta.changeNotes
  - [x] 1.4: Return updated theme and list of changes made

- [x] **Task 2: Implement Version Manager Module** (AC: 9)
  - [x] 2.1: Check if `.slide-builder/theme-history/` exists, create if needed
  - [x] 2.2: Determine next version number from current theme meta.version
  - [x] 2.3: Save current theme.json to `theme-history/theme-v{N}-{YYYY-MM-DD}.json`
  - [x] 2.4: Return version file path and new version number
  - [x] 2.5: Log "Theme v{N} saved to history" to status.yaml

- [x] **Task 3: Implement Sample Regenerator** (AC: 4, 5)
  - [x] 3.1: Reuse Epic 2 sample deck generation infrastructure
  - [x] 3.2: Generate 6 sample slides with updated theme:
    - sample-1-title.html (hero typography, primary color)
    - sample-2-list.html (body text, bullets)
    - sample-3-flow.html (arrows, boxes)
    - sample-4-columns.html (multiple box styles)
    - sample-5-callout.html (accent color, emphasis)
    - sample-6-code.html (mono font, dark variant)
  - [x] 3.3: Save samples to `.slide-builder/samples/`
  - [x] 3.4: Open samples in browser via `open` command
  - [x] 3.5: Display "Sample deck regenerated. Review in browser."

- [x] **Task 4: Implement Template Updater** (AC: 8)
  - [x] 4.1: Compare old and new theme primitives for shapes/layouts
  - [x] 4.2: If shapes.boxes or shapes.arrows changed → regenerate templates
  - [x] 4.3: Copy approved samples to `.slide-builder/templates/` as `layout-{name}.html`
  - [x] 4.4: Log which templates were updated
  - [x] 4.5: Display "Templates regenerated" or "No template changes needed"

- [x] **Task 5: Implement Theme Edit Workflow** (AC: 1, 6, 7, 10)
  - [x] 5.1: Create `.slide-builder/workflows/theme-edit/workflow.yaml`
  - [x] 5.2: Create `.slide-builder/workflows/theme-edit/instructions.md` with 6 phases:
    - Phase 1: Load and Backup
    - Phase 2: Collect Feedback
    - Phase 3: Apply Changes
    - Phase 4: Regenerate Samples
    - Phase 5: Validation Loop
    - Phase 6: Save and Update Templates
  - [x] 5.3: Implement cancel flow to restore from latest version
  - [x] 5.4: Implement approval flow to save and finalize

- [x] **Task 6: Register /theme-edit Slash Command** (AC: 1)
  - [x] 6.1: Create `.claude/commands/sb/theme-edit.md`
  - [x] 6.2: Document command purpose, prerequisites, example usage
  - [x] 6.3: Include feedback examples: "warmer colors", "bolder fonts", etc.
  - [x] 6.4: Document approval commands: "approved", "cancel"

- [x] **Task 7: Implement Status Logger for Theme Edit** (AC: 7)
  - [x] 7.1: Log "Theme edit started" when workflow begins
  - [x] 7.2: Log "Theme v{N} saved to history" when backup created
  - [x] 7.3: Log "Theme edited: {feedback summary}" when approved
  - [x] 7.4: Update last_action and last_modified in status.yaml

- [x] **Task 8: Testing - Theme Edit Verification** (AC: 1-10)
  - [x] 8.1: Run `/theme-edit` with valid theme, verify current theme displayed
  - [x] 8.2: Provide "warmer colors" feedback, verify changes described
  - [x] 8.3: Verify sample deck regenerates with warmer colors
  - [x] 8.4: Provide additional "bolder fonts" feedback, verify cumulative changes
  - [x] 8.5: Type "approved", verify:
    - theme.json updated with changes
    - meta.version incremented
    - theme-history has pre-edit version
  - [x] 8.6: Verify templates regenerated if shapes changed
  - [x] 8.7: Start new edit, type "cancel", verify original theme restored
  - [x] 8.8: Verify status.yaml history updated with edit actions
  - [x] 8.9: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Theme Editor Module:**

Per the Epic 6 Tech Spec, Story 6.2 implements the Theme Editor module and extends the Version Manager:

```
Module: Theme Editor (Story 6.2)
Responsibility: Interprets gestalt feedback and updates primitives
Inputs: currentTheme (ThemeJson), feedback (string)
Outputs: updatedTheme (ThemeJson), changes (string[])

Module: Version Manager (Stories 6.3, 6.4) - Extended for 6.2
Responsibility: Creates/reads/restores theme versions
Operations: Save current version, list versions
```

**Complete /theme-edit Workflow (from Tech Spec):**

```
Phase 1: Load and Backup
┌─────────────────────────────────────────────────────────────┐
│ 1. Check theme.json exists                                   │
│    → If missing: Error "No theme found. Run /setup first"    │
│ 2. Read current theme.json                                   │
│ 3. Display current theme summary (reuse /theme formatter)    │
│ 4. Save current version to theme-history/:                   │
│    → Determine next version number from meta.version         │
│    → Save as theme-v{N}-{YYYY-MM-DD}.json                    │
│ 5. Log: "Theme v{N} saved to history"                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Collect Feedback
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "What would you like to change?"                  │
│    Examples: "warmer colors", "bolder fonts", "more minimal" │
│ 2. Accept gestalt feedback (high-level, not micro-inputs)    │
│ 3. If pre-filled feedback provided, use that                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Apply Changes
┌─────────────────────────────────────────────────────────────┐
│ 1. Interpret feedback using Theme Editor:                    │
│    - "warmer" → adjust color hues toward warm spectrum       │
│    - "bolder" → increase weights, contrast                   │
│    - "minimal" → reduce shadows, increase spacing            │
│ 2. Apply changes to theme primitives                         │
│ 3. Increment meta.version                                    │
│ 4. Update meta.lastModified timestamp                        │
│ 5. Add meta.changeNotes with feedback summary                │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Regenerate Samples
┌─────────────────────────────────────────────────────────────┐
│ 1. Generate 6 sample slides with updated theme:              │
│    - sample-1-title.html (hero typography, primary color)    │
│    - sample-2-list.html (body text, bullets)                 │
│    - sample-3-flow.html (arrows, boxes)                      │
│    - sample-4-columns.html (multiple box styles)             │
│    - sample-5-callout.html (accent color, emphasis)          │
│    - sample-6-code.html (mono font, dark variant)            │
│ 2. Save to .slide-builder/samples/                           │
│ 3. Open samples in browser for preview                       │
│ 4. Display: "Sample deck regenerated. Review in browser."    │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: Validation Loop
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "How does it look?"                               │
│    Options: more feedback / "approved" / "cancel"            │
│ 2. If more feedback:                                         │
│    → Return to Phase 3 (Apply Changes)                       │
│ 3. If "cancel":                                              │
│    → Discard changes, restore from latest version            │
│    → Exit workflow                                           │
│ 4. If "approved":                                            │
│    → Continue to Phase 6                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 6: Save and Update Templates
┌─────────────────────────────────────────────────────────────┐
│ 1. Save updated theme to .slide-builder/theme.json           │
│ 2. Check if shape/layout primitives changed:                 │
│    → If yes: regenerate templates in .slide-builder/templates│
│    → Copy approved samples to templates/ with layout-* names │
│ 3. Update status.yaml:                                       │
│    - last_action: "Theme edited: {feedback summary}"         │
│    - Add to history                                          │
│ 4. Display success:                                          │
│    "Theme updated to v{N}!"                                  │
│    "Previous version saved: theme-v{N-1}-{date}.json"        │
└─────────────────────────────────────────────────────────────┘
```

**Feedback Interpretation Logic (from Tech Spec):**

```
User Feedback              → Theme Primitive Changes
─────────────────────────────────────────────────────────────
"warmer colors"            → Shift primary/secondary toward orange/red
                             Reduce blue/purple tones
                             Slightly increase saturation
"cooler colors"            → Shift toward blue/green spectrum
                             Reduce warm tones
"bolder"                   → Increase heading font weight (600→700)
                             Higher color contrast
                             Darker text colors
"more minimal"             → Reduce box shadows
                             Increase corner radius slightly
                             More whitespace (larger spacing)
"more corporate"           → Traditional fonts (serif or clean sans)
                             Navy/gray color palette
                             Smaller corner radius
"more playful"             → Brighter accent colors
                             Larger corner radius
                             Slightly increased font sizes
"softer"                   → Lower contrast
                             Lighter shadows
                             Larger corner radius
"sharper"                  → Higher contrast
                             Smaller/no corner radius
                             Crisper shadows
```

**Key Constraints (from Tech Spec):**

- Version saved BEFORE changes applied - always have rollback
- Cancel during edit discards changes, restores from version
- Sample regeneration is the bottleneck (< 30 seconds target)
- Templates regenerated ONLY if shape/layout primitives change
- Per PRD: Target 1-3 feedback rounds before approval
- 3+ rounds: offer direct theme.json editing as escape hatch

**Non-Functional Requirements (from Tech Spec):**

- Feedback interpretation: < 5 seconds (AI processing)
- Sample regeneration: < 30 seconds (6 slides via frontend-design skill)
- Template regeneration: < 30 seconds if needed
- Per PRD NFR5: "Theme feedback loop iteration should feel responsive"

### Project Structure Notes

**Files to Create:**

```
.slide-builder/
├── workflows/
│   └── theme-edit/                  # CREATE - Theme edit workflow
│       ├── workflow.yaml
│       └── instructions.md
├── theme-history/                   # CREATE if doesn't exist
│   └── theme-v{N}-{YYYY-MM-DD}.json # Version files

.claude/commands/sb/
└── theme-edit.md                    # CREATE - Slash command documentation
```

**Files to Read/Update:**

```
.slide-builder/
├── theme.json                       # READ/WRITE - Theme primitives
├── status.yaml                      # READ/WRITE - Action logging
├── samples/                         # WRITE - Regenerated samples
│   ├── sample-1-title.html
│   ├── sample-2-list.html
│   ├── sample-3-flow.html
│   ├── sample-4-columns.html
│   ├── sample-5-callout.html
│   └── sample-6-code.html
└── templates/                       # WRITE (if primitives changed)
    ├── layout-title.html
    ├── layout-list.html
    └── ...
```

**Alignment with Architecture:**

Per Architecture ADR-001 (BMAD Pattern Alignment):
- Workflow.yaml + instructions.md structure
- Follows BMAD workflow execution pattern with 6 phases

Per Architecture State File Patterns:
- status.yaml tracks mode, last_action, history
- All timestamps in ISO 8601 format

Per Architecture Project Structure:
- Theme stored at `.slide-builder/theme.json`
- Theme history in `.slide-builder/theme-history/`
- Samples in `.slide-builder/samples/`
- Templates in `.slide-builder/templates/`

Per PRD Theme Setup UX Philosophy:
- "AI does the work, user is creative director"
- Gestalt feedback, not micro-configuration
- Show, don't ask - present samples for reaction

### Learnings from Previous Story

**From Story 6-1-theme-summary-view (Status: in-progress)**

The previous story (6.1) established patterns critical for 6.2:

- **Theme Loader Module:** Reuse for loading theme.json at workflow start
- **Theme Formatter Module:** Reuse for displaying current theme before edit
- **ANSI Color Support:** Same color swatch generation for theme display
- **Status.yaml Updates:** Same history append pattern

**Files Created in 6.1 to Reference:**
- `.slide-builder/workflows/theme/workflow.yaml` - workflow config pattern
- `.slide-builder/workflows/theme/instructions.md` - 3-phase workflow pattern
- `.claude/commands/sb/theme.md` - command doc pattern

**Key Patterns to Extend:**
- Phase structure with clear boundaries
- Error handling for missing theme
- Status.yaml history entries: `{ action: "...", timestamp: "ISO8601" }`

**Implementation Notes from 6.1:**
- Theme.json uses `meta.extractedFrom` structure (vs `meta.sources`)
- Layouts are in `theme.slides.layouts` (title, content, split, data)
- ANSI 24-bit true color: `\x1b[38;2;R;G;Bm` escape sequences

[Source: notes/sprint-artifacts/6-1-theme-summary-view.md#Dev-Agent-Record]

### Testing Standards

Per Epic 6 Tech Spec Test Strategy:

**Story 6.2 Test Scenarios:**
- Run `/theme-edit`, verify current theme displayed first
- Provide feedback "warmer colors", verify:
  - Changes described in console
  - Sample deck regenerated
  - Samples display warmer colors
- Provide additional feedback "bolder fonts", verify cumulative changes
- Type "approved", verify theme.json updated
- Check meta.version incremented
- Check theme-history/ has pre-edit version saved
- Start edit, type "cancel", verify theme unchanged
- Change shape primitives, verify templates regenerated

**Edge Cases (from Tech Spec):**
- No theme exists: Error "No theme found. Run /setup first"
- Cancel during edit: Restore from latest version in history
- Sample regeneration fails: Log error, allow retry, theme not yet saved
- Feedback exceeds 3 rounds: Offer direct theme.json editing as escape hatch

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Story 6.2: Theme Editing] - AC definitions (AC6.2.1-AC6.2.10)
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Services and Modules] - Theme Editor, Version Manager, Sample Regenerator modules
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Workflows and Sequencing] - Complete /theme-edit Workflow (6 phases)
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Data Models and Contracts] - Feedback interpretation logic
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Non-Functional Requirements] - Performance targets
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Test Strategy Summary] - Test scenarios
- [Source: notes/architecture.md#Novel Pattern Designs] - Theme Extraction Pipeline pattern
- [Source: notes/architecture.md#State File Patterns] - status.yaml schema
- [Source: notes/architecture.md#Project Structure] - File locations
- [Source: notes/epics.md#Story 6.2: Theme Editing] - User story and AC context
- [Source: notes/prd.md#Theme Setup UX Philosophy] - Gestalt feedback philosophy
- [Source: notes/sprint-artifacts/6-1-theme-summary-view.md] - Previous story patterns (Theme Loader, Formatter)

## Dev Agent Record

### Context Reference

- [6-2-theme-editing.context.xml](./6-2-theme-editing.context.xml) - Generated 2026-01-27

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

```
Plan for Story 6.2 Implementation:
1. Task 5 (Theme Edit Workflow) - Create the comprehensive 6-phase workflow.yaml and instructions.md first as it orchestrates everything
2. Task 6 (Slash Command) - Update the existing command doc with complete documentation
3. Tasks 1-4, 7 are implemented WITHIN the workflow instructions.md (Theme Editor, Version Manager, Sample Regenerator, Template Updater, Status Logger modules)
4. Task 8 will be manual testing via Frontend Test Gate
```

### Completion Notes

**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### Completion Notes List

- **Tasks 1-7 Complete**: Implemented comprehensive theme-edit workflow with all 6 phases per Tech Spec
- **Theme Editor Module**: Feedback interpretation logic covers warmer, cooler, bolder, minimal, corporate, playful, softer, sharper keywords with specific primitive changes
- **Version Manager**: Saves theme to theme-history/ with theme-v{N}-{YYYY-MM-DD}.json naming before any edits
- **Sample Regenerator**: 6 sample slides (title, agenda, flow, comparison, callout, technical) using frontend-design skill
- **Template Updater**: Compares shapes.* and components.box.* primitives to determine if templates need regeneration
- **Cancel Flow**: Discards working_theme, does NOT write to theme.json, logs cancellation to status.yaml
- **Approval Flow**: Writes to theme.json, increments version, logs completion to status.yaml
- **3+ Feedback Rounds**: Offers escape hatch for direct theme.json editing per Tech Spec Q2
- ✅ **Test Gate PASSED** by Vishal (2026-01-27)

### File List

**Created/Modified:**
- `.slide-builder/workflows/theme-edit/workflow.yaml` - Updated to v2.0 with full config
- `.slide-builder/workflows/theme-edit/instructions.md` - Complete 6-phase workflow implementation
- `.claude/commands/sb/theme-edit.md` - Full slash command documentation with examples

**Read (reference):**
- `.slide-builder/theme.json` - Current theme structure
- `.slide-builder/status.yaml` - Status tracking patterns
- `.slide-builder/workflows/theme/instructions.md` - Theme Loader/Formatter patterns from Story 6.1

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Tasks 1-7 implemented: workflow.yaml v2.0, instructions.md with 6 phases, theme-edit.md command doc | Dev Agent |
| 2026-01-27 | Task 8 complete, Test Gate PASSED, story ready for review | Dev Agent |
| 2026-01-27 | Story marked DONE - Definition of Done complete | Dev Agent |
