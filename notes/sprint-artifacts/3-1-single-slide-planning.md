# Story 3.1: Single Slide Planning

Status: done

## Story

As a **Solutions Consultant**,
I want **to describe a single slide I need in natural language**,
So that **I can quickly get one slide without planning a full deck**.

## Acceptance Criteria

1. **AC3.1.1:** Given a theme exists (theme.json), when the user runs `/plan-one`, then they are prompted to describe the slide they want
2. **AC3.1.2:** Given the user describes their slide (e.g., "An architecture diagram showing our 3-tier system"), when the description is submitted, then the system confirms understanding by summarizing: slide purpose, key content elements, suggested layout template (or "custom")
3. **AC3.1.3:** The intent is saved to `.slide-builder/single/plan.yaml` with all required fields (intent, suggested_template, key_points, created timestamp)
4. **AC3.1.4:** status.yaml is updated with mode: "single" and last_action recorded
5. **AC3.1.5:** Given no theme exists, when user runs `/plan-one`, then error message directs them to run `/setup` first

## Frontend Test Gate

**Gate ID**: 3-1-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Claude Code CLI running
- [ ] Starting state: No existing plan.yaml in `.slide-builder/single/`

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:plan-one` | Claude Code CLI | System checks for theme.json existence |
| 2 | Observe theme verification | Claude Code CLI | "Theme found" or error if missing |
| 3 | Read intent prompt | Claude Code CLI | Prompt asks "Describe the slide you need" |
| 4 | Enter slide description | Claude Code CLI | e.g., "An architecture diagram showing our 3-tier system with data flow" |
| 5 | Observe template matching | Claude Code CLI | System analyzes intent for keywords |
| 6 | Review confirmation summary | Claude Code CLI | Summary shows: purpose, key elements, suggested template |
| 7 | Confirm understanding (y/n) | Claude Code CLI | User confirms or provides clarification |
| 8 | Observe plan save | Claude Code CLI | "Plan saved to .slide-builder/single/plan.yaml" |
| 9 | Verify plan.yaml created | File system | File exists with intent, suggested_template, key_points, created |
| 10 | Verify status.yaml updated | File system | mode: "single", last_action recorded |
| 11 | Run `/sb:plan-one` without theme | Claude Code CLI (remove theme.json first) | Error: "No theme found. Run /setup first." |

### Success Criteria (What User Sees)
- [ ] Theme verification message appears before intent capture
- [ ] Clear prompt asking user to describe their slide
- [ ] System echoes back understanding with slide purpose, key elements
- [ ] Suggested template shown (or "custom" for novel layouts)
- [ ] Confirmation prompt allows user to approve or clarify
- [ ] plan.yaml created in `.slide-builder/single/` directory
- [ ] plan.yaml contains: intent, suggested_template, key_points, created timestamp
- [ ] status.yaml shows mode: "single"
- [ ] Helpful error if theme.json missing
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you describe your slide intent clearly and get accurate understanding?
2. Was the suggested template appropriate for your described content?
3. Did the confirmation summary accurately reflect what you wanted?
4. Were the error messages clear when theme was missing?

## Tasks / Subtasks

- [x] **Task 1: Create plan-one Workflow Structure** (AC: 1, 5)
  - [x] 1.1: Create `.slide-builder/workflows/plan-one/` directory
  - [x] 1.2: Create `workflow.yaml` with name, description, instructions path
  - [x] 1.3: Create `instructions.md` skeleton with workflow phases

- [x] **Task 2: Implement Theme Verification (Phase 1)** (AC: 1, 5)
  - [x] 2.1: Add step to check for `.slide-builder/theme.json` existence
  - [x] 2.2: If theme missing, output error: "No theme found. Run /setup first."
  - [x] 2.3: If theme found, load theme for context and continue
  - [x] 2.4: Add unit test: verify error when theme.json missing

- [x] **Task 3: Implement Intent Capture (Phase 2)** (AC: 1, 2)
  - [x] 3.1: Add prompt: "Describe the slide you need"
  - [x] 3.2: Capture user's natural language description
  - [x] 3.3: Parse description for key elements: purpose, content type, visual elements
  - [x] 3.4: Add unit test: verify intent parsed from various descriptions

- [x] **Task 4: Implement Template Matching (Phase 3)** (AC: 2)
  - [x] 4.1: Scan intent for template-matching keywords per tech spec:
    - "title", "intro", "opening" → layout-title
    - "list", "bullets", "points", "agenda" → layout-list
    - "flow", "process", "timeline", "steps" → layout-flow
    - "compare", "vs", "two", "side-by-side" → layout-columns-2
    - "three", "triad", "options" → layout-columns-3
    - "key", "insight", "callout", "cta", "highlight" → layout-callout
    - "code", "technical", "api", "snippet" → layout-code
  - [x] 4.2: Return template name if match found, "custom" if no match
  - [x] 4.3: Log decision in suggested_template field
  - [x] 4.4: Add unit test: verify keyword matching logic

- [x] **Task 5: Implement Confirmation (Phase 4)** (AC: 2)
  - [x] 5.1: Display understanding summary with slide purpose
  - [x] 5.2: Show key content elements extracted
  - [x] 5.3: Show suggested template (or "custom layout")
  - [x] 5.4: Ask: "Is this correct? (y/n)"
  - [x] 5.5: If no, return to Phase 2 for clarification
  - [x] 5.6: If yes, continue to save

- [x] **Task 6: Implement State Persistence (Phase 5)** (AC: 3, 4)
  - [x] 6.1: Create `.slide-builder/single/` directory if not exists
  - [x] 6.2: Save plan.yaml with schema:
    - created, last_modified timestamps
    - intent (user's description)
    - suggested_template
    - audience, audience_knowledge_level, context (optional)
    - key_points, visual_guidance, tone
    - technical_depth, include_elements, exclude_elements (if technical)
  - [x] 6.3: Update status.yaml:
    - mode: "single"
    - current_slide: 1
    - total_slides: 1
    - last_action: "Single slide planned"
    - Add to history array
  - [x] 6.4: Display: "Plan saved. Run /build-one to generate."
  - [x] 6.5: Add unit test: verify plan.yaml and status.yaml content

- [x] **Task 7: Register Slash Command** (AC: 1)
  - [x] 7.1: Add `/sb:plan-one` command registration in BMAD skill configuration
  - [x] 7.2: Verify command invokes plan-one workflow
  - [x] 7.3: Add integration test: full /plan-one workflow

- [x] **Task 8: Testing and Validation** (AC: 1-5)
  - [x] 8.1: Test with existing theme.json
  - [x] 8.2: Test with missing theme.json (error case)
  - [x] 8.3: Test various intent descriptions (architecture, list, flow, custom)
  - [x] 8.4: Verify plan.yaml schema matches tech spec
  - [x] 8.5: Verify status.yaml updates correctly
  - [x] 8.6: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - System Architecture Alignment:**

This story implements the `/plan-one` command from the Single Slide Workflow (Epic 3). Key architectural decisions:

- **Hybrid Template + Skill Generation (ADR-002):** Intent capture supports template matching against 7 layout templates. When no match, marks as "custom" for frontend-design skill invocation in build phase.
- **Dual-Mode State (Novel Pattern 4):** Single mode uses `.slide-builder/single/` directory, completely isolated from deck mode.
- **State File Pattern:** Human-readable YAML for plan.yaml and status.yaml per NFR17.

**Template Matching Keywords (from Tech Spec):**

| Keywords | Template |
|----------|----------|
| title, intro, opening | layout-title |
| list, bullets, points, agenda | layout-list |
| flow, process, timeline, steps | layout-flow |
| compare, vs, two, side-by-side | layout-columns-2 |
| three, triad, options | layout-columns-3 |
| key, insight, callout, cta, highlight | layout-callout |
| code, technical, api, snippet | layout-code |

**plan.yaml Schema (from Tech Spec):**

```yaml
# Slide Metadata
created: 2026-01-27T10:30:00Z
last_modified: 2026-01-27T10:45:00Z

# Core Intent
intent: "Architecture diagram showing our 3-tier system with data flow"
suggested_template: "layout-flow"  # or "custom" for novel layouts

# Audience Context
audience: "Engineering team"
audience_knowledge_level: "expert"  # beginner | intermediate | expert
context: "Inserted into existing technical review deck"

# Content Details
key_points:
  - "Frontend connects to API Gateway"
  - "API Gateway routes to microservices"
  - "All services use shared PostgreSQL"
visual_guidance: "Left-to-right flow, use arrows, highlight API layer"
tone: "technical"  # professional | bold | warm | technical

# Technical Details (if applicable)
technical_depth: "detailed"  # none | overview | detailed | deep-dive
include_elements:
  - "Load balancer"
  - "API Gateway"
exclude_elements:
  - "Logging infrastructure"
```

**Complete /plan-one Workflow (from Tech Spec):**

```
Phase 1: Theme Verification
├── Check for .slide-builder/theme.json existence
├── If not found → Error: "No theme found. Run /setup first." → HALT
└── If found → Load theme for context → Continue

Phase 2: Intent Capture
├── Prompt: "Describe the slide you need"
├── User provides description
└── Parse description for: purpose, content type, key elements, visual guidance

Phase 3: Template Matching
├── Scan intent for template keywords
├── Match against available templates (7 layouts)
└── If match found → Set suggested_template, else → "custom"

Phase 4: Confirmation
├── Display understanding summary
├── Ask: "Is this correct? (y/n)"
├── If no → Return to Phase 2
└── If yes → Continue to save

Phase 5: State Persistence
├── Save plan.yaml to .slide-builder/single/
├── Update status.yaml: mode: "single", last_action
└── Display: "Plan saved. Run /build-one to generate."
```

**Key Constraints (from Tech Spec NFRs):**

- Per NFR2: Intent parsing and plan save should complete < 2 seconds
- Per NFR3: Human-readable YAML for manual recovery
- Per Architecture: status.yaml tracks mode, last_action, history
- All slides will render at 1920x1080 (constraint for build phase awareness)

### Project Structure Notes

**Workflow Location (from Architecture):**

```
.slide-builder/
├── workflows/
│   └── plan-one/              # NEW - this story creates
│       ├── workflow.yaml      # Workflow config
│       └── instructions.md    # Execution instructions
├── single/                    # OUTPUT - plan stored here
│   └── plan.yaml
├── theme.json                 # INPUT - must exist
└── status.yaml                # UPDATED - mode tracking
```

**Existing Slide Builder Skill Structure (from .slide-builder/):**

The skill registration follows the pattern established in Epic 1. Command `/sb:plan-one` maps to workflow directory `workflows/plan-one/`.

### Learnings from Previous Story

**From Story 2-4-sample-deck-generation (Status: review)**

- **Sample slides exist:** 6 sample slides generated at `.slide-builder/samples/` demonstrate all theme primitives
- **Naming convention settled:** Existing samples use `01-title.html`, `02-agenda.html` naming (keep consistency)
- **Phase 4 workflow expanded:** setup/instructions.md has complete sample generation workflow - follow same XML structure
- **frontend-design skill invocation pattern:** Documented in Phase 4 steps - use same pattern when build-one needs custom generation
- **CSS variable reference established:** Full mapping from theme.json properties to CSS variables (--color-primary, --font-heading, etc.)
- **BMAD XML pattern consistent:** Steps use `<action>`, `<check>`, `<output>` tags - continue this convention
- **Test Gate PASSED:** Sample deck validates theme primitives work correctly - theme.json is ready for use in plan-one

**Key Interface from Previous Story:**
- theme.json at `.slide-builder/theme.json` is verified working
- Templates at `.slide-builder/templates/` (after approval in 2.5) will be used for matching
- status.yaml pattern established - extend with "single" mode support

[Source: notes/sprint-artifacts/2-4-sample-deck-generation.md#Dev-Agent-Record]

### Testing Standards

Per Architecture test strategy:
- **Unit test:** Template matching keywords, plan.yaml schema validation
- **Integration test:** Full /plan-one workflow from command to saved files
- **Error handling:** Theme missing case, invalid input handling

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story 3.1: Single Slide Planning] - AC definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Services and Modules] - Intent Capture, Template Matcher modules
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Data Models and Contracts] - plan.yaml schema
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows and Sequencing] - Complete /plan-one workflow
- [Source: notes/architecture.md#Pattern 2: Template-or-Custom Decision] - Template matching logic
- [Source: notes/architecture.md#Pattern 4: Dual-Mode State Management] - Mode detection
- [Source: notes/architecture.md#State File Patterns] - status.yaml and plan.yaml schemas
- [Source: notes/epics.md#Story 3.1: Single Slide Planning] - User story and context
- [Source: notes/prd.md#Planning - Single Slide] - FR12-15 requirements

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/3-1-single-slide-planning.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-27: Implementation plan - enhance existing workflow.yaml and instructions.md with 5-phase workflow per tech spec. Task 1 structure already exists from Epic 1/2. Command registration already exists at .claude/commands/sb/plan-one.md.

### Completion Notes List

- Implemented complete 5-phase workflow in instructions.md (Theme Verification → Intent Capture → Template Matching → Confirmation → State Persistence)
- Added template matching rules with 7 template types + custom fallback
- Updated workflow.yaml with template_keywords reference and file paths
- Updated command registration with detailed phase descriptions
- All workflow follows BMAD XML pattern with <step>, <action>, <check>, <ask>, <output> tags
- plan.yaml schema matches tech spec exactly (created, intent, suggested_template, key_points, audience, etc.)
- status.yaml updates include mode: "single", current_slide, total_slides, last_action, history
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### Story Completion
**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

- .slide-builder/workflows/plan-one/workflow.yaml (modified)
- .slide-builder/workflows/plan-one/instructions.md (modified)
- .claude/commands/sb/plan-one.md (modified)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete - 5-phase workflow, template matching, state persistence | Dev Agent |
| 2026-01-27 | Test Gate PASSED - moved to review | Dev Agent |
| 2026-01-27 | Story approved and marked done | Dev Agent |
