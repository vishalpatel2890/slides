# Epic Technical Specification: Foundation & Framework

Date: 2026-01-26
Author: Vishal
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational infrastructure for Slide Builder - an agentic framework extension for Claude Code that enables Solutions Consultants to create brand-perfect presentation slides. This epic creates the project structure, implements the BMAD-pattern workflow system, establishes state management patterns, and registers slash commands that will power all subsequent workflows.

The foundation must be solid because all other epics (Theme Creation, Single Slide Workflow, Editing, Deck Mode, Theme Management, and Export) depend on the patterns and infrastructure established here. This epic delivers zero user-facing features but enables the entire system architecture.

## Objectives and Scope

**In Scope:**

- Create `.slide-builder/` directory structure mirroring BMAD patterns
- Implement workflow.yaml + instructions.md execution pattern
- Establish YAML-based state file management (status.yaml, plan.yaml)
- Register slash commands (`/setup`, `/plan`, `/build`, `/edit`, `/export`, etc.)
- Initialize package.json with puppeteer and googleapis dependencies
- Create .gitignore for credentials and node_modules

**Out of Scope:**

- Theme extraction or generation (Epic 2)
- Actual slide HTML generation (Epic 3)
- Google Slides API integration details (Epic 7)
- Any user-visible slide content
- Brand asset processing

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-001):**

This epic implements the core BMAD-mirror structure defined in the Architecture document. The `.slide-builder/` directory mirrors `.bmad/` exactly, with workflows defined via YAML configuration and Markdown instructions.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| Directory Structure | Project Structure | `.slide-builder/workflows/`, `templates/`, `samples/`, etc. |
| Workflow Pattern | ADR-001 | workflow.yaml + instructions.md per command |
| State Management | State File Patterns | status.yaml, plan.yaml with YAML format |
| Dependencies | package.json | puppeteer, googleapis |

**Constraints from Architecture:**

- 100% alignment with BMAD pattern (no custom workflow formats)
- All state files must be human-readable YAML
- Credentials stored in gitignored directory
- Framework must be extensible for new workflows (FR52)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Directory Scaffolder** | Creates `.slide-builder/` structure | Init command | Directory tree |
| **Workflow Executor** | Loads workflow.yaml, executes instructions.md | Slash command | Workflow completion |
| **State Manager** | Reads/writes YAML state files | State changes | Persisted YAML |
| **Command Router** | Maps slash commands to workflow directories | User command | Workflow path |

**Module Details:**

**1. Directory Scaffolder**
- Creates all required directories in single operation
- Initializes package.json with dependencies
- Creates .gitignore with security entries
- Idempotent (safe to run multiple times)

**2. Workflow Executor**
- Reads workflow.yaml for configuration (name, description, instructions path)
- Loads instructions.md and parses XML step structure
- Executes steps in order with checkpoint pauses
- Handles `<template-output>` tags for file saves

**3. State Manager**
- Writes status.yaml with mode, progress, history
- Writes plan.yaml with slide intents and build status
- Maintains timestamps in ISO 8601 format
- Enables resume from interruption

**4. Command Router**
- Maps `/setup` → `workflows/setup/workflow.yaml`
- Maps `/plan-one` → `workflows/plan-one/workflow.yaml`
- Provides error handling for unknown commands
- Extensible for new command registration

### Data Models and Contracts

**status.yaml Schema:**

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

**plan.yaml Schema (Deck Mode):**

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

**plan.yaml Schema (Single Mode):**

```yaml
intent: "string"                   # What the slide should convey
suggested_template: "layout-name"  # Template or "custom"
created: "ISO8601"                 # Creation timestamp
```

**workflow.yaml Schema:**

```yaml
name: "workflow-name"              # Workflow identifier
description: "string"              # What workflow does
instructions: "{path}/instructions.md"  # Path to instructions
# Additional workflow-specific config
```

### APIs and Interfaces

**Slash Command Interface:**

| Command | Maps To | Description |
|---------|---------|-------------|
| `/setup` | `workflows/setup/` | Theme creation workflow |
| `/theme` | `workflows/theme/` | View theme summary |
| `/theme-edit` | `workflows/theme-edit/` | Modify theme |
| `/plan` | Router | Smart router (asks single or deck) |
| `/plan-one` | `workflows/plan-one/` | Plan single slide |
| `/plan-deck` | `workflows/plan-deck/` | Plan full deck |
| `/build-one` | `workflows/build/` | Build next/single slide |
| `/build-all` | `workflows/build/` | Build all remaining |
| `/edit [n]` | `workflows/edit/` | Edit slide n |
| `/export` | `workflows/export/` | Export to Google Slides |

**File System Interface:**

```
Read Operations:
- Load workflow.yaml from workflows/{command}/
- Load instructions.md from workflows/{command}/
- Read state from status.yaml, plan.yaml

Write Operations:
- Save state to status.yaml, plan.yaml
- Create directories as needed
- Write generated files to appropriate locations
```

### Workflows and Sequencing

**Initialization Sequence (Story 1.1):**

```
1. Create directory structure
   mkdir -p .slide-builder/{workflows,templates,samples,single,deck/slides,credentials,theme-history}

2. Initialize package.json
   npm init -y
   npm install puppeteer googleapis

3. Create .gitignore
   Add: .slide-builder/credentials/
   Add: node_modules/
```

**Workflow Execution Sequence (Story 1.2):**

```
1. User enters slash command (e.g., /setup)
2. Command Router resolves to workflow path
3. Workflow Executor loads workflow.yaml
4. Workflow Executor loads instructions.md
5. For each <step> in instructions:
   a. Execute <action> tags
   b. Handle <template-output> (save + show + approve)
   c. Process <ask> tags (wait for user)
   d. Update state files
6. Report completion
```

**State Update Sequence (Story 1.3):**

```
1. Action occurs (slide built, plan created, etc.)
2. State Manager reads current state file
3. State Manager updates relevant fields
4. State Manager appends to history array
5. State Manager writes updated YAML
6. Timestamp updated to current time
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source |
|-------------|--------|--------|
| Directory scaffolding | < 5 seconds | Local file operations |
| Workflow.yaml load | < 100ms | Small YAML file |
| State file read/write | < 100ms | Small YAML files |
| Command routing | Instant | In-memory lookup |

**Notes:**
- Epic 1 has no network dependencies (no external API calls)
- All operations are local file I/O
- npm install (puppeteer, googleapis) is one-time setup cost, not runtime

### Security

| Concern | Mitigation |
|---------|------------|
| Credentials exposure | `.slide-builder/credentials/` added to .gitignore |
| Sensitive state data | State files contain only metadata, no secrets |
| Directory permissions | Standard user permissions, no elevated access |

**Security Patterns:**
- Credentials directory created but empty until Epic 7 (OAuth setup)
- No secrets stored in workflow.yaml or instructions.md
- .gitignore created as part of scaffolding (not optional)

### Reliability/Availability

| Scenario | Handling |
|----------|----------|
| Interrupted scaffolding | Idempotent - safe to re-run |
| Corrupted state file | Human-readable YAML allows manual recovery |
| Missing workflow directory | Clear error message with available commands |
| Partial workflow execution | State saved at checkpoints, resume supported |

**Recovery Patterns (per NFR14, NFR17):**
- State files are human-readable for manual inspection
- History array in status.yaml provides audit trail
- No destructive operations in Epic 1

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| last_action | status.yaml | What happened last |
| last_modified | status.yaml | When it happened |
| history[] | status.yaml | Full action audit trail |
| Workflow step output | Console | Real-time progress |

**Logging Strategy:**
- All significant actions logged to status.yaml history
- Console output for real-time workflow progress
- No external logging services (local-first architecture)

## Dependencies and Integrations

**NPM Dependencies (package.json):**

| Package | Version | Purpose | Used In Epic |
|---------|---------|---------|--------------|
| puppeteer | latest | HTML-to-image conversion | Epic 7 |
| googleapis | latest | Google Slides API | Epic 7 |

**Note:** These dependencies are installed in Epic 1 but not used until Epic 7. Installing early ensures the development environment is complete.

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime for puppeteer, googleapis |
| Chrome/Chromium | Any modern | Required by puppeteer |
| Claude Code | Current | Framework runtime environment |

**Framework Dependencies:**

| Component | Source | Purpose |
|-----------|--------|---------|
| BMAD Pattern | `.bmad/` reference | Workflow execution model |
| frontend-design skill | Claude Code built-in | HTML generation (Epic 2+) |
| Claude Vision | Claude Code built-in | Brand asset analysis (Epic 2) |

**Integration Points (Epic 1 scope):**

| Integration | Method | Status |
|-------------|--------|--------|
| File System | Node.js fs / Claude Code tools | Active |
| Claude Code CLI | Slash commands | Active |
| Google APIs | OAuth 2.0 | Prepared (credentials dir) |

**No external API calls in Epic 1** - all integrations are local file system operations.

## Acceptance Criteria (Authoritative)

### Story 1.1: Project Structure Scaffolding

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC1.1.1 | Given the user runs the initialization command, when scaffolding completes, then the `.slide-builder/` directory structure exists with: workflows/, templates/, samples/, single/, deck/slides/, credentials/, theme-history/ |
| AC1.1.2 | A `.gitignore` file includes `.slide-builder/credentials/` and `node_modules/` |
| AC1.1.3 | A `package.json` exists with puppeteer and googleapis dependencies |

### Story 1.2: Workflow Definition Pattern

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC1.2.1 | Given a workflow directory exists, when the workflow is invoked, then the system reads `workflow.yaml` for configuration |
| AC1.2.2 | The system loads `instructions.md` for execution logic |
| AC1.2.3 | The system follows step-by-step instructions with checkpoint approvals |
| AC1.2.4 | Given workflow.yaml contains phase definitions, when executing, then each phase completes before the next begins |
| AC1.2.5 | User approval is requested at checkpoint tags |

### Story 1.3: State File Management

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC1.3.1 | Given a workflow is executing, when state changes occur, then the state is written to appropriate YAML file (status.yaml, plan.yaml) |
| AC1.3.2 | State files include timestamps and action descriptions |
| AC1.3.3 | Given a previous workflow was interrupted, when the user resumes, then the system reads the state file and continues from last checkpoint |
| AC1.3.4 | Given a user wants to inspect progress, when they open any state YAML file, then the content is human-readable with clear structure |

### Story 1.4: Slash Command Registration

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC1.4.1 | Given the Slide Builder framework is installed, when the user types `/setup` in Claude Code, then the setup workflow is invoked |
| AC1.4.2 | Given any registered slash command is entered, when the command is recognized, then the corresponding workflow.yaml is loaded and executed |
| AC1.4.3 | Unrecognized commands show helpful error with available commands list |

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
|----|--------------|---------------|-----------|
| AC1.1.1 | Services/Directory Scaffolder | mkdir -p command | Verify all 7 directories exist after init |
| AC1.1.2 | Security/.gitignore | File write | Check .gitignore contains both entries |
| AC1.1.3 | Dependencies/NPM | package.json, npm install | Verify package.json has puppeteer, googleapis |
| AC1.2.1 | Services/Workflow Executor | workflow.yaml read | Mock workflow, verify yaml loaded |
| AC1.2.2 | Services/Workflow Executor | instructions.md read | Verify instructions file loaded |
| AC1.2.3 | Workflows/Execution Sequence | Step execution | Run test workflow, verify order |
| AC1.2.4 | Workflows/Execution Sequence | Phase gates | Verify step N waits for step N-1 |
| AC1.2.5 | Workflows/Execution Sequence | Checkpoint tags | Verify pause at template-output |
| AC1.3.1 | Data Models/status.yaml | State Manager write | Trigger state change, verify YAML updated |
| AC1.3.2 | Data Models/status.yaml | Timestamps | Check ISO8601 format in files |
| AC1.3.3 | Reliability/Recovery | State Manager read | Interrupt workflow, resume, verify continuation |
| AC1.3.4 | Data Models/all schemas | YAML structure | Manual inspection of generated files |
| AC1.4.1 | APIs/Slash Commands | Command Router | Type /setup, verify workflow starts |
| AC1.4.2 | APIs/Slash Commands | Command Router | Test all 10 commands |
| AC1.4.3 | APIs/Slash Commands | Error handling | Type invalid command, verify error message |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Node.js not installed on user machine | High - dependencies won't install | Medium | Document prerequisite, provide clear error |
| **R2:** Puppeteer installation fails (missing Chrome) | Medium - export won't work | Low | Defer to Epic 7, provide manual screenshot fallback |
| **R3:** BMAD pattern interpretation differs | High - workflows inconsistent | Low | Reference BMAD source, validate against existing workflows |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | User has Node.js 18+ installed | npm commands will fail |
| **A2** | User is running Claude Code CLI | Slash commands won't register |
| **A3** | macOS or Linux environment | Windows may need path adjustments |
| **A4** | User has write access to project directory | Directory creation will fail |

### Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| **Q1** | Should `/init` be a separate command or automatic on first `/setup`? | Vishal | **Decision: Automatic on first use** |
| **Q2** | Should we create placeholder workflow.yaml files for all commands in Epic 1? | Dev | Open - recommend yes for command discovery |
| **Q3** | How should we handle Windows path separators? | Dev | Deferred - NFR20 says Windows is nice-to-have |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Scaffolder, State Manager) | Manual verification in Claude Code |
| **Integration** | Workflow execution end-to-end | Run sample workflow, verify outputs |
| **Acceptance** | All ACs per story | Manual testing per AC table |

### Test Approach by Story

**Story 1.1: Project Structure Scaffolding**
- Run initialization command
- Verify directory tree with `ls -la .slide-builder/`
- Check .gitignore contents
- Verify package.json dependencies with `cat package.json`

**Story 1.2: Workflow Definition Pattern**
- Create minimal test workflow (workflow.yaml + instructions.md)
- Invoke via slash command
- Verify steps execute in order
- Verify checkpoint pauses

**Story 1.3: State File Management**
- Execute workflow that creates state
- Inspect status.yaml structure
- Interrupt mid-workflow, resume, verify continuation
- Verify human-readability

**Story 1.4: Slash Command Registration**
- Type each slash command, verify routing
- Type invalid command, verify error with command list
- Verify all 10 commands resolve to correct workflow paths

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 1.1 | 3 | File system verification |
| 1.2 | 5 | Workflow execution + observation |
| 1.3 | 4 | State file inspection + resume test |
| 1.4 | 3 | Command invocation testing |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Run init twice | Idempotent - no errors, no duplicate directories |
| Missing Node.js | Clear error message with install instructions |
| Invalid workflow path | Error with available commands list |
| Corrupted YAML | Graceful error, suggest manual inspection |

### Definition of Done

Epic 1 is complete when:
1. All 7 directories exist under `.slide-builder/`
2. package.json has puppeteer and googleapis
3. .gitignore protects credentials
4. At least one workflow (setup) can be invoked via `/setup`
5. State files (status.yaml) are created and human-readable
6. All 15 acceptance criteria pass manual verification
