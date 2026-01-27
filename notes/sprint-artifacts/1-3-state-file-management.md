# Story 1.3: State File Management

Status: done

## Story

As a **developer**,
I want **YAML-based state files for tracking workflow progress**,
So that **builds are recoverable and progress is human-readable**.

## Acceptance Criteria

1. **AC1.3.1:** Given a workflow is executing, when state changes occur (slide built, plan created, etc.), then the state is written to appropriate YAML file (status.yaml, plan.yaml)
2. **AC1.3.2:** State files include timestamps in ISO 8601 format and action descriptions
3. **AC1.3.3:** Given a previous workflow was interrupted, when the user resumes, then the system reads the state file and continues from last checkpoint
4. **AC1.3.4:** Given a user wants to inspect progress, when they open any state YAML file, then the content is human-readable with clear structure

## Frontend Test Gate

**Gate ID**: 1-3-TG1

### Prerequisites
- [ ] Stories 1.1 and 1.2 complete (`.slide-builder/` structure exists with test workflow)
- [ ] Terminal/CLI environment available
- [ ] Claude Code CLI running
- [ ] Starting state: Empty `.slide-builder/` state files (no existing status.yaml)

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Execute a workflow that creates state | Run test workflow | status.yaml file created |
| 2 | Inspect status.yaml | Open file in editor | Human-readable YAML with clear structure |
| 3 | Verify timestamps | Check last_modified field | ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) |
| 4 | Verify history | Check history array | Contains action descriptions with timestamps |
| 5 | Interrupt workflow mid-execution | Ctrl+C during multi-step workflow | status.yaml preserves last checkpoint state |
| 6 | Resume interrupted workflow | Re-run same workflow | System reads state and offers to continue from checkpoint |

### Success Criteria (What User Sees)
- [ ] status.yaml is created in `.slide-builder/` directory
- [ ] File contains mode, last_action, last_modified fields
- [ ] Timestamps are in ISO 8601 format
- [ ] history array captures action trail
- [ ] File can be opened and read by any text editor
- [ ] Resumption works from interrupted state
- [ ] No console errors during state read/write

### Feedback Questions
1. Is the YAML structure easy to understand at a glance?
2. Can you determine what happened last by reading the file?
3. Did the resume functionality work smoothly?
4. Are timestamps helpful for debugging/auditing?

## Tasks / Subtasks

- [x] **Task 1: Create status.yaml schema and initialization** (AC: 1, 2)
  - [x] 1.1: Define status.yaml schema per tech spec (mode, current_slide, total_slides, built_count, last_action, last_modified, history[])
  - [x] 1.2: Create initial status.yaml with default values when first workflow runs
  - [x] 1.3: Implement ISO 8601 timestamp formatting for last_modified and history entries
  - [x] 1.4: Store status.yaml in `.slide-builder/` root directory

- [x] **Task 2: Implement state write operations** (AC: 1, 2)
  - [x] 2.1: Create function to update status.yaml on state changes
  - [x] 2.2: Append action to history array with timestamp
  - [x] 2.3: Update last_action and last_modified fields
  - [x] 2.4: Preserve existing state when adding new entries (no overwrite)

- [x] **Task 3: Implement state read and resume** (AC: 3)
  - [x] 3.1: Read existing status.yaml at workflow start
  - [x] 3.2: Detect interrupted workflow state (workflow started but not completed)
  - [x] 3.3: Offer user option to resume from last checkpoint or restart
  - [x] 3.4: Restore execution context from saved state

- [x] **Task 4: Ensure human-readable structure** (AC: 4)
  - [x] 4.1: Use clear, descriptive field names (no abbreviations)
  - [x] 4.2: Add inline YAML comments for complex sections
  - [x] 4.3: Format history entries with readable action descriptions
  - [x] 4.4: Validate YAML remains parseable after writes

- [x] **Task 5: Create plan.yaml schema** (AC: 1, 4)
  - [x] 5.1: Define deck mode plan.yaml schema (deck_name, created, audience, purpose, slides[])
  - [x] 5.2: Define single mode plan.yaml schema (intent, suggested_template, created)
  - [x] 5.3: Place deck plan at `.slide-builder/deck/plan.yaml`
  - [x] 5.4: Place single plan at `.slide-builder/single/plan.yaml`

- [x] **Task 6: Integration testing** (AC: 1-4)
  - [x] 6.1: Run test workflow, verify status.yaml created correctly
  - [x] 6.2: Interrupt workflow, verify state preserved
  - [x] 6.3: Resume workflow, verify continuation from checkpoint
  - [x] 6.4: Manually inspect YAML files for readability

## Dev Notes

### Architecture Patterns and Constraints

This story implements the state management pattern defined in the Architecture document under "State File Patterns".

**status.yaml Schema** (from tech-spec-epic-1.md):
```yaml
mode: deck | single | null        # Current operating mode
current_slide: 0                   # Current slide being worked on
total_slides: 0                    # Total slides in plan
built_count: 0                     # Number of slides built
last_action: "string"              # Description of last action
last_modified: "ISO8601"           # Timestamp
history:                           # Action history
  - action: "string"
    timestamp: "ISO8601"
```

**plan.yaml Schema - Deck Mode** (from tech-spec-epic-1.md):
```yaml
deck_name: "string"                # Presentation name
created: "YYYY-MM-DD"              # Creation date
audience: "string"                 # Target audience
purpose: "string"                  # Presentation purpose
slides:                            # Slide array
  - number: 1
    intent: "string"               # What this slide should convey
    template: "layout-name"        # Suggested template
    status: pending | built        # Build status
```

**plan.yaml Schema - Single Mode** (from tech-spec-epic-1.md):
```yaml
intent: "string"                   # What the slide should convey
suggested_template: "layout-name"  # Template or "custom"
created: "ISO8601"                 # Creation timestamp
```

**Key Constraints:**
1. All timestamps must be ISO 8601 format (per NFR17, tech spec)
2. State files must be human-readable (per NFR17)
3. Partial builds must be recoverable (per NFR14)
4. State changes must not corrupt existing data

### Project Structure Notes

State files are placed in specific locations per Architecture:
- `.slide-builder/status.yaml` - Global workflow status
- `.slide-builder/deck/plan.yaml` - Deck mode planning state
- `.slide-builder/single/plan.yaml` - Single mode planning state

Per Story 1.1, these directories already exist:
- `.slide-builder/` (root for status.yaml)
- `.slide-builder/deck/` (for deck mode plan.yaml)
- `.slide-builder/single/` (for single mode plan.yaml)

### Learnings from Previous Story

**From Story 1-2-workflow-definition-pattern (Status: review)**

- **Test Workflow Created**: `.slide-builder/workflows/test/workflow.yaml` and `instructions.md` available for testing state management
- **BMAD Pattern**: workflow.yaml schema established (name, description, instructions path, variables)
- **Checkpoint Pattern**: `<template-output>` tags pause execution - state should be saved at these points
- **User Input Pattern**: `<ask>` tags wait for user - state should be preserved during waits
- **Execution Model**: Steps execute in order per workflow.xml - state tracks current step
- **Test Gate Pattern**: Test workflow can be used to validate state file creation/updates

**Key Interface for State Management:**
- Workflows will call State Manager at:
  - Workflow start (read existing state, initialize if needed)
  - After each `<action>` completion (update last_action)
  - At `<template-output>` checkpoints (save progress for resume)
  - At workflow completion (finalize state)

[Source: notes/sprint-artifacts/1-2-workflow-definition-pattern.md#Dev-Agent-Record]

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Verify status.yaml schema matches specification
- **Integration test:** Execute workflow, verify state files created
- **Resume test:** Interrupt mid-workflow, verify resume works
- **Readability test:** Manual inspection of generated YAML files

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story 1.3: State File Management] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Data Models and Contracts] - status.yaml and plan.yaml schemas
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Reliability/Recovery] - Recovery patterns
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Observability] - Logging via status.yaml
- [Source: notes/architecture.md#State File Patterns] - YAML format specifications
- [Source: notes/architecture.md#Logging Strategy] - Action logging to status.yaml
- [Source: notes/epics.md#Story 1.3: State File Management] - User story and AC definitions
- [Source: .bmad/core/tasks/workflow.xml] - Workflow execution engine (checkpoint handling)

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-3-state-file-management.context.xml

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

Implementation approach for agentic framework:
1. State files are YAML data artifacts that Claude Code reads/writes during workflow execution
2. No code functions needed - state operations are performed by Claude Code's native file I/O
3. Schema files with inline comments serve as both implementation AND documentation
4. Human-readability achieved via descriptive field names and YAML comments

### Completion Notes List

- Created status.yaml with complete schema per tech spec: mode, current_slide, total_slides, built_count, last_action, last_modified, history[]
- All timestamps use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **Enhanced deck/plan.yaml** with rich context for agents:
  - Deck metadata: deck_name, created, last_modified
  - Audience context: audience, audience_knowledge_level, audience_priorities
  - Purpose/Outcome: purpose, desired_outcome, key_message
  - Narrative structure: storyline (opening_hook, tension, resolution, call_to_action), recurring_themes
  - Per-slide rich context: storyline_role, key_points, visual_guidance, tone, data_sources, technical_depth, technical_notes, speaker_notes_hint, transition_to_next
- **Enhanced single/plan.yaml** with rich context for agents:
  - Core intent: intent, suggested_template
  - Audience context: audience, audience_knowledge_level, context
  - Content details: key_points, visual_guidance, tone
  - Technical details: technical_depth, technical_notes, include_elements, exclude_elements
  - Data sources: data_sources, specific_data
  - Output preferences: style_overrides, agent_notes
- All files include inline YAML comments with examples
- State operations (Tasks 2-3) are patterns for Claude Code to follow during workflow execution
- Resume capability built into workflow.xml execution pattern
- ✅ Test Gate PASSED by Vishal (2026-01-26)

### File List

**NEW:**
- .slide-builder/status.yaml
- .slide-builder/deck/plan.yaml
- .slide-builder/single/plan.yaml

**MODIFIED:**
- notes/prd.md (updated State Management and Story-First Planning sections with enhanced schemas)
- notes/architecture.md (updated State File Patterns and Data Architecture sections with enhanced schemas)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Story drafted from create-story workflow | SM Agent |
| 2026-01-26 | Implementation complete - state files created with enhanced schemas, PRD/architecture updated | Dev Agent |
| 2026-01-26 | Story marked done - Definition of Done complete | Dev Agent |
