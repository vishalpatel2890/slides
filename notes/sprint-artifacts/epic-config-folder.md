# Slide Builder - Epic: Config Folder Isolation

**Date:** 2026-01-28
**Project Level:** Quick-Flow (3 stories)

---

## Epic: Config Folder Isolation

**Slug:** config-folder

### Goal

Consolidate all user/org-specific configuration assets (theme, samples, templates, theme-history) into a single `.slide-builder/config/` folder, enabling easy sharing of brand configurations via zip file.

### Scope

- Create new `.slide-builder/config/` directory structure
- Move 4 items: theme.json, theme-history/, samples/, templates/
- Update all workflow files to reference new paths
- Update .gitignore and documentation

### Success Criteria

1. All config assets consolidated in `.slide-builder/config/`
2. All workflows read/write to new config/ location
3. `/setup` creates config/ directory structure if missing
4. `/theme` successfully reads theme from config/theme.json
5. `/build-one` successfully reads templates from config/templates/
6. User can zip config/, share, and recipient can use immediately
7. `.gitignore` updated to ignore config/ as single entry

### Dependencies

- None (standalone refactoring effort)

---

## Story Map

```
Story 1: Create config folder and move files
    ↓
Story 2: Update workflow path references
    ↓
Story 3: Update documentation
```

---

## Stories

### Story 1: Create Config Folder Structure

As a **Slide Builder user**,
I want **all my brand configuration in a single folder**,
So that **I can easily zip and share my theme with teammates**.

**Acceptance Criteria:**

**Given** an existing .slide-builder/ directory with theme.json, theme-history/, samples/, templates/ at root
**When** the config folder refactoring is applied
**Then** all four items are moved to .slide-builder/config/
**And** .gitignore is updated to ignore .slide-builder/config/ as a single entry
**And** git history is preserved via git mv

**Prerequisites:** None

**Technical Notes:** Use `git mv` to preserve file history. Create config/ directory first before moving.

---

### Story 2: Update Workflow Path References

As a **Slide Builder user**,
I want **all workflows to read/write from the new config/ location**,
So that **the system continues to work after the folder restructure**.

**Acceptance Criteria:**

**Given** config files have been moved to .slide-builder/config/
**When** I run /theme
**Then** it reads theme from config/theme.json and displays correctly
**And** /setup writes new themes to config/theme.json
**And** /build-one reads templates from config/templates/
**And** /theme-edit updates config/theme.json and writes history to config/theme-history/

**Prerequisites:** Story 1 complete

**Technical Notes:** Add `config_path` variable to workflow.yaml files. Update all path references in both workflow.yaml and instructions.md files.

---

### Story 3: Update Documentation

As a **Slide Builder contributor**,
I want **documentation to reflect the new config/ structure**,
So that **the project structure is accurately documented**.

**Acceptance Criteria:**

**Given** the config folder restructure is complete
**When** I read notes/architecture.md
**Then** the project structure section shows the new config/ folder
**And** .gitignore includes a comment explaining config/ purpose
**And** CONVENTIONS.md is updated if it references the old paths

**Prerequisites:** Stories 1 and 2 complete

**Technical Notes:** Update architecture.md lines 37-101 (project structure section). Add descriptive comment to .gitignore.

---

## Implementation Order

| Order | Story | Deliverable |
|-------|-------|-------------|
| 1 | Create Config Folder Structure | config/ folder created, files moved, gitignore updated |
| 2 | Update Workflow Path References | All workflows using new paths |
| 3 | Update Documentation | architecture.md and conventions updated |

---

## Tech Spec Reference

**Primary Context:** [tech-spec-config-folder.md](../tech-spec-config-folder.md)

Contains:
- Complete source tree changes
- Technical approach with path patterns
- Integration points for each workflow
- Testing strategy and acceptance criteria
