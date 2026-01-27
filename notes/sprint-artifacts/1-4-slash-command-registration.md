# Story 1.4: Slash Command Registration

Status: done

## Story

As a **user**,
I want **slash commands (`/setup`, `/plan`, `/build`, etc.) to invoke workflows**,
So that **I can use the framework through simple CLI commands**.

## Acceptance Criteria

1. **AC1.4.1:** Given the Slide Builder framework is installed, when the user types `/setup` in Claude Code, then the setup workflow is invoked
2. **AC1.4.2:** Given any registered slash command is entered, when the command is recognized, then the corresponding workflow.yaml is loaded and executed
3. **AC1.4.3:** Unrecognized commands show helpful error with available commands list

## Frontend Test Gate

**Gate ID**: 1-4-TG1

### Prerequisites
- [ ] Stories 1.1, 1.2, 1.3 complete (`.slide-builder/` structure exists with test workflow and state files)
- [ ] Claude Code CLI running
- [ ] Terminal environment available
- [ ] Starting state: `.slide-builder/workflows/` directory exists with at least one workflow (setup or test)

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Type `/setup` in Claude Code | Claude Code CLI | Setup workflow is invoked, instructions begin executing |
| 2 | Type `/plan` in Claude Code | Claude Code CLI | Plan workflow invoked OR smart router asks "single or deck?" |
| 3 | Type `/plan-one` in Claude Code | Claude Code CLI | Single slide planning workflow invoked |
| 4 | Type `/invalid-command` in Claude Code | Claude Code CLI | Error message displays with list of available commands |
| 5 | Verify workflow.yaml is loaded | Check console output | Confirms workflow configuration was read |
| 6 | Verify instructions.md executes | Check workflow steps | Steps execute in order with checkpoints |

### Success Criteria (What User Sees)
- [ ] `/setup` successfully invokes setup workflow
- [ ] `/plan-one` successfully invokes single slide planning workflow
- [ ] `/plan-deck` successfully invokes deck planning workflow
- [ ] Invalid commands show helpful error listing available commands
- [ ] Command routing is instant (no perceptible delay)
- [ ] Workflow configuration loads correctly
- [ ] No console errors during command routing

### Feedback Questions
1. Did the command invoke the expected workflow immediately?
2. Was the error message for invalid commands helpful?
3. Did you find all expected commands available?
4. Any commands you expected that weren't registered?

## Tasks / Subtasks

- [x] **Task 1: Create workflow directory structure for all MVP commands** (AC: 1, 2)
  - [x] 1.1: Create `.slide-builder/workflows/setup/` directory with placeholder workflow.yaml
  - [x] 1.2: Create `.slide-builder/workflows/theme/` directory with placeholder workflow.yaml
  - [x] 1.3: Create `.slide-builder/workflows/theme-edit/` directory with placeholder workflow.yaml
  - [x] 1.4: Create `.slide-builder/workflows/plan/` directory with placeholder workflow.yaml (smart router)
  - [x] 1.5: Create `.slide-builder/workflows/plan-one/` directory with placeholder workflow.yaml
  - [x] 1.6: Create `.slide-builder/workflows/plan-deck/` directory with placeholder workflow.yaml
  - [x] 1.7: Create `.slide-builder/workflows/build/` directory with placeholder workflow.yaml
  - [x] 1.8: Create `.slide-builder/workflows/edit/` directory with placeholder workflow.yaml
  - [x] 1.9: Create `.slide-builder/workflows/export/` directory with placeholder workflow.yaml

- [x] **Task 2: Create Claude Code skill registration** (AC: 1, 2)
  - [x] 2.1: Create skill registration entry for `/sb:setup` command in Claude Code skills
  - [x] 2.2: Create skill registration entry for `/sb:theme` command
  - [x] 2.3: Create skill registration entry for `/sb:theme-edit` command
  - [x] 2.4: Create skill registration entry for `/sb:plan` command (smart router)
  - [x] 2.5: Create skill registration entry for `/sb:plan-one` command
  - [x] 2.6: Create skill registration entry for `/sb:plan-deck` command
  - [x] 2.7: Create skill registration entry for `/sb:build-one` command
  - [x] 2.8: Create skill registration entry for `/sb:build-all` command
  - [x] 2.9: Create skill registration entry for `/sb:edit` command
  - [x] 2.10: Create skill registration entry for `/sb:export` command

- [x] **Task 3: Implement command-to-workflow routing logic** (AC: 2)
  - [x] 3.1: Document command → workflow directory mapping in a CONVENTIONS.md or workflow registry
  - [x] 3.2: Each skill invokes BMAD workflow execution pattern with corresponding workflow.yaml path
  - [x] 3.3: Workflow executor loads workflow.yaml and instructions.md per Story 1.2 pattern

- [x] **Task 4: Implement error handling for invalid commands** (AC: 3)
  - [x] 4.1: Define error message template listing all available commands
  - [x] 4.2: Include brief description of each command in error output
  - [x] 4.3: Ensure error message is helpful and actionable

- [x] **Task 5: Create placeholder workflow.yaml files with proper structure** (AC: 2)
  - [x] 5.1: Each workflow.yaml follows BMAD schema: name, description, instructions path
  - [x] 5.2: Include placeholder instructions.md with minimal step structure
  - [x] 5.3: Ensure workflow files are valid YAML and can be loaded

- [x] **Task 6: Integration testing** (AC: 1-3)
  - [x] 6.1: Test each of the 10 commands invokes correct workflow
  - [x] 6.2: Test invalid command shows error with full command list
  - [x] 6.3: Verify workflow.yaml is loaded and instructions.md executed
  - [x] 6.4: Verify extensibility - adding new workflow/command is straightforward

## Dev Notes

### Architecture Patterns and Constraints

**Command-to-Workflow Mapping** (from tech-spec-epic-1.md and Architecture):

| Command | Maps To | Description |
|---------|---------|-------------|
| `/sb-setup` | `workflows/setup/` | Theme creation workflow |
| `/sb-theme` | `workflows/theme/` | View theme summary |
| `/sb-theme-edit` | `workflows/theme-edit/` | Modify theme |
| `/sb-plan` | Router | Smart router (asks single or deck) |
| `/sb-plan-one` | `workflows/plan-one/` | Plan single slide |
| `/sb-plan-deck` | `workflows/plan-deck/` | Plan full deck |
| `/sb-build-one` | `workflows/build/` | Build next/single slide |
| `/sb-build-all` | `workflows/build/` | Build all remaining |
| `/sb-edit` | `workflows/edit/` | Edit slide n |
| `/sb-export` | `workflows/export/` | Export to Google Slides |

**Note:** Commands prefixed with `sb-` to avoid collision with potential built-in Claude Code commands.

**Key Architecture Constraints:**
- Per ADR-001: 100% alignment with BMAD workflow pattern
- Per FR48: Each command maps to a workflow definition (workflow.yaml)
- Per FR49: Workflows have associated instruction files (instructions.md)
- Per FR52: Framework is extensible for new workflows/commands

**Skill Registration Pattern:**
- Claude Code skills are registered in the BMAD skills directory structure
- Each skill invokes the workflow execution engine with the appropriate workflow.yaml path
- Skills follow the pattern: load workflow.yaml → load instructions.md → execute steps

### Project Structure Notes

Per Architecture "Project Structure" section, workflow directories are at:
```
.slide-builder/
├── workflows/
│   ├── setup/           # /sb-setup
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── theme/           # /sb-theme
│   ├── theme-edit/      # /sb-theme-edit
│   ├── plan/            # /sb-plan (router)
│   ├── plan-one/        # /sb-plan-one
│   ├── plan-deck/       # /sb-plan-deck
│   ├── build/           # /sb-build-one, /sb-build-all
│   ├── edit/            # /sb-edit
│   └── export/          # /sb-export
```

**Story 1.2 established:** workflow.yaml schema with name, description, instructions path, variables
**Story 1.3 established:** State files in `.slide-builder/status.yaml`, `deck/plan.yaml`, `single/plan.yaml`

### Learnings from Previous Story

**From Story 1-3-state-file-management (Status: review)**

- **State Files Created**: `status.yaml`, `deck/plan.yaml`, `single/plan.yaml` now available for workflow state tracking
- **Schema Pattern**: Enhanced YAML schemas with rich context for agents - workflows should use similar descriptive schemas
- **No Code Functions Needed**: Operations are patterns for Claude Code to follow during workflow execution
- **Resume Pattern**: Workflow execution can read state files to detect incomplete workflows and resume
- **Timestamp Format**: ISO 8601 for all timestamps
- **Human-Readability**: YAML files use descriptive field names and inline comments

**Key Interface for Command Registration:**
- Commands trigger workflow execution which reads/writes state files
- Workflows should initialize/update status.yaml during execution
- Each command invocation should log to status.yaml history

[Source: notes/sprint-artifacts/1-3-state-file-management.md#Dev-Agent-Record]

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Verify each command maps to correct workflow directory
- **Integration test:** Type command, verify workflow executes
- **Error handling test:** Type invalid command, verify helpful error displayed
- **Extensibility test:** Add new workflow, verify it becomes accessible

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story 1.4: Slash Command Registration] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#APIs and Interfaces] - Slash command interface table
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Services and Modules] - Command Router module spec
- [Source: notes/architecture.md#Workflow File Pattern] - workflow.yaml + instructions.md structure
- [Source: notes/architecture.md#FR Category to Architecture Mapping] - FR48-52 framework requirements
- [Source: notes/epics.md#Story 1.4: Slash Command Registration] - User story and AC definitions
- [Source: notes/prd.md#Command Structure] - Full command reference

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-4-slash-command-registration.context.xml

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

Implementation approach:
1. Created 9 workflow directories (setup, theme, theme-edit, plan, plan-one, plan-deck, build, edit, export)
2. Each workflow has workflow.yaml with BMAD schema + instructions.md with step structure
3. Skill registrations in `.claude/commands/sb/` directory following BMAD pattern
4. Commands use `sb:` prefix (not `sb-`) to match Claude Code skill naming convention
5. Added `/sb:help` command for discoverability
6. CONVENTIONS.md documents all mappings and patterns

### Completion Notes List

- Created 9 workflow directories with full workflow.yaml and instructions.md files
- Each workflow follows BMAD pattern: name, description, installed_path, instructions path
- Instructions include proper XML workflow structure with steps, actions, asks, and template-outputs
- 11 skill registrations created (10 commands + help)
- CONVENTIONS.md created with command-to-workflow mapping and extensibility guide
- All workflow.yaml files are valid YAML with proper schema
- Commands use `sb:` prefix per Claude Code skill naming convention
- ✅ Test Gate PASSED by Vishal (2026-01-26)

### File List

**NEW:**
- .slide-builder/workflows/setup/workflow.yaml
- .slide-builder/workflows/setup/instructions.md
- .slide-builder/workflows/theme/workflow.yaml
- .slide-builder/workflows/theme/instructions.md
- .slide-builder/workflows/theme-edit/workflow.yaml
- .slide-builder/workflows/theme-edit/instructions.md
- .slide-builder/workflows/plan/workflow.yaml
- .slide-builder/workflows/plan/instructions.md
- .slide-builder/workflows/plan-one/workflow.yaml
- .slide-builder/workflows/plan-one/instructions.md
- .slide-builder/workflows/plan-deck/workflow.yaml
- .slide-builder/workflows/plan-deck/instructions.md
- .slide-builder/workflows/build/workflow.yaml
- .slide-builder/workflows/build/instructions.md
- .slide-builder/workflows/edit/workflow.yaml
- .slide-builder/workflows/edit/instructions.md
- .slide-builder/workflows/export/workflow.yaml
- .slide-builder/workflows/export/instructions.md
- .slide-builder/CONVENTIONS.md
- .claude/commands/sb/setup.md
- .claude/commands/sb/theme.md
- .claude/commands/sb/theme-edit.md
- .claude/commands/sb/plan.md
- .claude/commands/sb/plan-one.md
- .claude/commands/sb/plan-deck.md
- .claude/commands/sb/build-one.md
- .claude/commands/sb/build-all.md
- .claude/commands/sb/edit.md
- .claude/commands/sb/export.md
- .claude/commands/sb/help.md

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Story drafted from create-story workflow | SM Agent |
| 2026-01-26 | Implementation complete - 9 workflows + 11 skills + CONVENTIONS.md | Dev Agent |
| 2026-01-26 | Story approved and marked done - Definition of Done complete | Dev Agent |
