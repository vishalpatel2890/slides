# Story 1.1: Project Structure Scaffolding

Status: done

## Story

As a **developer**,
I want **the Slide Builder directory structure created following BMAD patterns**,
So that **all workflows have a consistent home and state files have designated locations**.

## Acceptance Criteria

1. **AC1.1.1:** Given the user runs the initialization command, when scaffolding completes, then the `.slide-builder/` directory structure exists with: `workflows/`, `templates/`, `samples/`, `single/`, `deck/slides/`, `credentials/`, `theme-history/`
2. **AC1.1.2:** A `.gitignore` file includes `.slide-builder/credentials/` and `node_modules/`
3. **AC1.1.3:** A `package.json` exists with puppeteer and googleapis dependencies

## Frontend Test Gate

**Gate ID**: 1-1-TG1

### Prerequisites
- [ ] Terminal/CLI environment available
- [ ] Node.js 18+ installed
- [ ] User has write permissions to project directory
- [ ] Starting state: Clean project directory OR existing project without `.slide-builder/`

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Run `/setup` or initialization command | Claude Code CLI | Scaffolding begins without errors |
| 2 | List directory structure | `ls -la .slide-builder/` | Shows 7 subdirectories |
| 3 | Verify all directories exist | `ls .slide-builder/` | workflows, templates, samples, single, deck, credentials, theme-history |
| 4 | Check nested directory | `ls .slide-builder/deck/` | slides/ subdirectory exists |
| 5 | Check .gitignore contents | `cat .gitignore` | Contains `.slide-builder/credentials/` and `node_modules/` |
| 6 | Check package.json | `cat package.json` | Contains "puppeteer" and "googleapis" in dependencies |

### Success Criteria (What User Sees)
- [ ] `.slide-builder/` directory created with all 7 subdirectories
- [ ] `deck/slides/` nested directory exists
- [ ] `.gitignore` has credentials protection entry
- [ ] `package.json` has required dependencies
- [ ] No error messages during scaffolding
- [ ] Idempotent: Running twice produces no errors

### Feedback Questions
1. Did the scaffolding complete without any errors?
2. Are all directories visible in your file explorer/IDE?
3. Did npm install run successfully (if dependencies needed)?
4. Any permission errors encountered?

## Tasks / Subtasks

- [x] **Task 1: Create directory structure** (AC: 1)
  - [x] 1.1: Create `.slide-builder/` root directory
  - [x] 1.2: Create `workflows/` subdirectory for workflow definitions
  - [x] 1.3: Create `templates/` subdirectory for HTML layout templates
  - [x] 1.4: Create `samples/` subdirectory for sample deck slides
  - [x] 1.5: Create `single/` subdirectory for single-slide mode
  - [x] 1.6: Create `deck/slides/` nested directories for deck mode
  - [x] 1.7: Create `credentials/` subdirectory (gitignored) for OAuth tokens
  - [x] 1.8: Create `theme-history/` subdirectory for theme versions

- [x] **Task 2: Initialize .gitignore** (AC: 2)
  - [x] 2.1: Create or update `.gitignore` file in project root
  - [x] 2.2: Add `.slide-builder/credentials/` entry to protect OAuth tokens
  - [x] 2.3: Add `node_modules/` entry to exclude dependencies
  - [x] 2.4: Verify entries don't duplicate existing gitignore rules

- [x] **Task 3: Initialize package.json with dependencies** (AC: 3)
  - [x] 3.1: Run `npm init -y` if package.json doesn't exist
  - [x] 3.2: Add puppeteer to dependencies (for HTML-to-image conversion)
  - [x] 3.3: Add googleapis to dependencies (for Google Slides API)
  - [x] 3.4: Verify package.json has valid JSON structure

- [x] **Task 4: Test idempotency** (AC: 1, 2, 3)
  - [x] 4.1: Run scaffolding command a second time
  - [x] 4.2: Verify no errors occur on re-run
  - [x] 4.3: Verify existing files/directories are preserved

## Dev Notes

### Architecture Patterns and Constraints

This story establishes the foundational directory structure that mirrors BMAD's own `.bmad/` architecture. Per ADR-001, this is a 100% alignment requirement - no custom directory patterns.

**Directory Structure Specification** (from Architecture):
```
.slide-builder/
├── workflows/          # Workflow definitions (workflow.yaml + instructions.md)
├── templates/          # Generated HTML layout templates (from /setup)
├── samples/            # Sample deck slides generated during theme setup
├── single/             # Single slide mode workspace
├── deck/
│   └── slides/         # Deck mode slide storage
├── credentials/        # OAuth tokens (MUST be gitignored)
└── theme-history/      # Theme version snapshots
```

**Key Constraints:**
1. All directories must be created in a single idempotent operation
2. The `credentials/` directory MUST be gitignored (NFR11: Security)
3. Dependencies installed now but used in Epic 7 (forward planning)
4. State files go in `single/` or `deck/` based on mode (Pattern 4 in Architecture)

### Project Structure Notes

Per Architecture "Project Structure" section, this scaffolding creates the framework home. Subsequent stories will populate:
- `workflows/setup/` in Story 1.2-1.4
- `templates/layout-*.html` in Epic 2 (Theme Creation)
- `samples/sample-*.html` in Story 2.4
- `theme.json` at `.slide-builder/theme.json` in Story 2.3

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Verify each directory exists after scaffolding
- **Integration test:** Run initialization, verify complete structure
- **Idempotency test:** Run twice, verify no errors or duplicates
- Edge cases: Missing Node.js (clear error), permission denied (graceful fail)

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story 1.1: Project Structure Scaffolding] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Directory Scaffolder] - Module responsibility
- [Source: notes/architecture.md#Project Structure] - Directory structure specification
- [Source: notes/architecture.md#ADR-001: BMAD Pattern Alignment] - 100% alignment requirement
- [Source: notes/architecture.md#Security Architecture] - Credentials must be gitignored
- [Source: notes/architecture.md#Development Environment] - Setup commands reference
- [Source: notes/epics.md#Story 1.1: Project Structure Scaffolding] - User story and AC definitions

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-1-project-structure-scaffolding.context.xml

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

Implementation plan:
1. Created all 7 directories with single `mkdir -p` command for idempotency
2. Created .gitignore with credentials protection and node_modules exclusion
3. Initialized package.json with npm init, then added dependencies manually (bun/npm registry issues)
4. Verified idempotency by re-running mkdir and confirming test file preservation

### Completion Notes List

- All 4 tasks completed successfully
- Directory structure created following exact Architecture specification
- .gitignore protects OAuth credentials per NFR11 security requirement
- package.json declares puppeteer and googleapis (will be installed when needed in Epic 7)
- Idempotency verified: re-run produces no errors, existing files preserved
- Note: Used manual package.json dependency declaration due to npm/bun registry connectivity issues
- **Enhancement:** Expanded .gitignore for open source (ADR-006) - gitignores all user-generated content (themes, templates, samples, slides) while versioning only the framework (workflows/)
- ✅ Test Gate PASSED by Vishal (2026-01-26)

### File List

**NEW:**
- .slide-builder/workflows/ (directory)
- .slide-builder/templates/ (directory)
- .slide-builder/samples/ (directory)
- .slide-builder/single/ (directory)
- .slide-builder/deck/slides/ (directory)
- .slide-builder/credentials/ (directory)
- .slide-builder/theme-history/ (directory)
- .gitignore
- package.json

**MODIFIED:**
- notes/architecture.md (Added ADR-006: Open Source Content Strategy, updated Security Architecture section)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Story drafted from create-story workflow | SM Agent |
| 2026-01-26 | Implementation complete, all ACs met, Test Gate PASSED | Dev Agent |
| 2026-01-26 | Added ADR-006: Open Source Content Strategy | Dev Agent |
| 2026-01-26 | Story marked DONE - Definition of Done complete | Dev Agent |
