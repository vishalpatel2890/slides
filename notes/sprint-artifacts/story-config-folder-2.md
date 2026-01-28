# Story 2: Update Workflow Path References

**Status:** Complete

---

## User Story

As a **Slide Builder user**,
I want **all workflows to read/write from the new config/ location**,
So that **the system continues to work after the folder restructure**.

---

## Acceptance Criteria

**Given** config files have been moved to .slide-builder/config/
**When** I run `/theme`
**Then** it reads theme from config/theme.json and displays correctly

**And** `/setup` writes new themes to config/theme.json, samples to config/samples/, templates to config/templates/
**And** `/build-one` reads theme from config/theme.json and templates from config/templates/
**And** `/build-all` reads theme from config/theme.json and templates from config/templates/
**And** `/theme-edit` updates config/theme.json and writes history to config/theme-history/
**And** `/edit` reads theme from config/theme.json

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 2.1:** Add `config_path` variable to all workflow.yaml files:
  ```yaml
  config_path: "{project-root}/.slide-builder/config"
  ```
- [x] **Task 2.2:** Update `setup/workflow.yaml` - theme_file, samples_dir, templates_dir paths
- [x] **Task 2.3:** Update `setup/instructions.md` - all path references
- [x] **Task 2.4:** Update `theme/workflow.yaml` - theme_file path
- [x] **Task 2.5:** Update `theme/instructions.md` - all path references
- [x] **Task 2.6:** Update `theme-edit/workflow.yaml` - theme_file, theme_history_dir paths
- [x] **Task 2.7:** Update `theme-edit/instructions.md` - all path references
- [x] **Task 2.8:** Update `build-one/workflow.yaml` - theme_file, templates_dir paths
- [x] **Task 2.9:** Update `build-one/instructions.md` - all path references
- [x] **Task 2.10:** Update `build-all/workflow.yaml` - theme_file, templates_dir paths
- [x] **Task 2.11:** Update `build-all/instructions.md` - all path references
- [x] **Task 2.12:** Update `edit/workflow.yaml` - theme_file path
- [x] **Task 2.13:** Update `edit/instructions.md` - all path references
- [x] **Task 2.14:** Check and update any other workflows (plan-one, plan-deck, export) if they reference theme/templates
- [ ] **Task 2.15:** Test each workflow after updates
- [ ] **Task 2.16:** Commit: "refactor: update workflow paths to use config/"

### Technical Summary

All workflow files need a new `config_path` variable that points to the config folder. All existing references to theme.json, theme-history/, samples/, and templates/ must be updated to use `{config_path}/` prefix instead of `{project-root}/.slide-builder/`.

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/setup/workflow.yaml`
  - `.slide-builder/workflows/setup/instructions.md`
  - `.slide-builder/workflows/theme/workflow.yaml`
  - `.slide-builder/workflows/theme/instructions.md`
  - `.slide-builder/workflows/theme-edit/workflow.yaml`
  - `.slide-builder/workflows/theme-edit/instructions.md`
  - `.slide-builder/workflows/build-one/workflow.yaml`
  - `.slide-builder/workflows/build-one/instructions.md`
  - `.slide-builder/workflows/build-all/workflow.yaml`
  - `.slide-builder/workflows/build-all/instructions.md`
  - `.slide-builder/workflows/edit/workflow.yaml`
  - `.slide-builder/workflows/edit/instructions.md`
- **Expected test locations:** Manual testing via slash commands
- **Prerequisites:** Story 1 complete (files moved to config/)

### Key Code References

**Path variable pattern (add to workflow.yaml):**
```yaml
# Config paths (shareable brand assets)
config_path: "{project-root}/.slide-builder/config"
theme_file: "{config_path}/theme.json"
theme_history_dir: "{config_path}/theme-history"
samples_dir: "{config_path}/samples"
templates_dir: "{config_path}/templates"
```

**Example update in setup/workflow.yaml:**
```yaml
# Before:
theme_file: "{project-root}/.slide-builder/theme.json"

# After:
config_path: "{project-root}/.slide-builder/config"
theme_file: "{config_path}/theme.json"
```

---

## Context References

**Tech-Spec:** [tech-spec-config-folder.md](../tech-spec-config-folder.md) - Primary context document containing:

- Integration points for each workflow
- Path resolution pattern
- Complete list of files to modify

**Architecture:** [architecture.md](../architecture.md) - Workflow patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan:**
1. Add `config_path` variable to all workflow.yaml files that reference theme, samples, templates, or theme-history
2. Update path references in each workflow.yaml to use `{config_path}/` prefix
3. Update corresponding instructions.md files to reference correct paths
4. Verify plan-one, plan-deck, and export workflows don't need config path updates (they only reference theme for reading, which is handled by the main workflows)

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

All workflow files have been updated to use the new `config_path` variable that points to `.slide-builder/config/`. This includes:

1. **workflow.yaml files** - Added `config_path` variable and updated theme_file, templates_dir, samples_dir, theme_history_dir references
2. **instructions.md files** - Updated all hardcoded path references from `.slide-builder/` to `.slide-builder/config/`
3. **status.yaml** - Updated theme.file and templates.directory paths

The path resolution pattern now follows:
- `{config_path}/theme.json` instead of `{project-root}/.slide-builder/theme.json`
- `{config_path}/templates/` instead of `{project-root}/.slide-builder/templates/`
- `{config_path}/samples/` instead of `{project-root}/.slide-builder/samples/`
- `{config_path}/theme-history/` instead of `{project-root}/.slide-builder/theme-history/`

### Files Modified

**Workflow YAML files (8 files):**
- `.slide-builder/workflows/setup/workflow.yaml`
- `.slide-builder/workflows/theme/workflow.yaml`
- `.slide-builder/workflows/theme-edit/workflow.yaml`
- `.slide-builder/workflows/build-one/workflow.yaml`
- `.slide-builder/workflows/build-all/workflow.yaml`
- `.slide-builder/workflows/edit/workflow.yaml`
- `.slide-builder/workflows/plan-one/workflow.yaml`
- `.slide-builder/workflows/plan-deck/workflow.yaml`

**Instruction MD files (8 files):**
- `.slide-builder/workflows/setup/instructions.md`
- `.slide-builder/workflows/theme/instructions.md`
- `.slide-builder/workflows/theme-edit/instructions.md`
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-all/instructions.md`
- `.slide-builder/workflows/edit/instructions.md`
- `.slide-builder/workflows/plan-one/instructions.md`
- `.slide-builder/workflows/plan-deck/instructions.md`

**Status file (1 file):**
- `.slide-builder/status.yaml`

### Test Results

Pending manual testing via slash commands (Task 2.15)

---

## Review Notes

<!-- Will be populated during code review -->
