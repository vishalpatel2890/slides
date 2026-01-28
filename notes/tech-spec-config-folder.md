# Slide Builder - Technical Specification: Config Folder Isolation

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick-Flow
**Change Type:** Refactoring / Architecture Improvement
**Development Context:** Brownfield

---

## Context

### Available Documents

- **PRD:** `notes/prd.md` - Complete product requirements for Slide Builder
- **Architecture:** `notes/architecture.md` - Technical decisions, patterns, ADRs
- **Existing Epics:** Tech specs for epics 1-8 in `notes/sprint-artifacts/`
- **Current Theme:** `.slide-builder/theme.json` - Amperity brand v2.0

### Project Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js (via Claude Code CLI) | 18+ |
| Dependencies | puppeteer | ^23.0.0 |
| Dependencies | googleapis | ^140.0.0 |
| Framework | BMAD-pattern agentic workflows | N/A |
| State Files | YAML (status, plans) | N/A |
| Config Files | JSON (theme) | N/A |
| Output Format | HTML/CSS/JS | 1920x1080 |

### Existing Codebase Structure

```
.slide-builder/                     # Framework directory
├── workflows/                      # CORE - 12 workflow definitions
│   ├── setup/                      # Theme creation workflow
│   ├── theme/                      # Theme viewing workflow
│   ├── theme-edit/                 # Theme modification workflow
│   ├── plan-one/                   # Single slide planning
│   ├── plan-deck/                  # Deck planning
│   ├── build-one/                  # Single slide building
│   ├── build-all/                  # Batch slide building
│   ├── edit/                       # Slide editing
│   ├── export/                     # Google Slides export
│   └── ...
├── theme.json                      # USER/ORG - Brand configuration
├── theme-history/                  # USER/ORG - Version snapshots
├── samples/                        # USER/ORG - 6 sample slides
├── templates/                      # USER/ORG - Layout templates
├── status.yaml                     # Runtime session state
├── deck/                           # User deck workspace
├── single/                         # User single-slide workspace
├── CONVENTIONS.md                  # Development conventions
└── credentials/                    # OAuth tokens (gitignored)

.claude/commands/sb/                # Slash command definitions
output/                             # User-generated slide outputs
```

---

## The Change

### Problem Statement

Currently, user/org-specific configuration assets (theme, samples, templates, theme-history) are scattered at the root level of `.slide-builder/`. This creates friction when sharing brand configurations:

1. **Manual file hunting** - Users must identify which files/folders to copy
2. **Easy to miss files** - `theme-history/` often forgotten
3. **No clear boundary** - Hard to distinguish "my brand stuff" from "framework code"
4. **Zip complexity** - Must selectively zip multiple items at different paths

Users want a **single folder** they can zip and share for instant brand replication on another machine.

### Proposed Solution

Consolidate all shareable brand configuration into `.slide-builder/config/`:

```
.slide-builder/
├── config/                         # NEW: Single shareable folder
│   ├── theme.json                  # Brand primitives
│   ├── theme-history/              # Version snapshots
│   ├── samples/                    # Sample slides demonstrating theme
│   └── templates/                  # Layout templates
├── workflows/                      # Core framework (unchanged)
├── status.yaml                     # Runtime state (unchanged)
├── deck/                           # User workspace (unchanged)
├── single/                         # User workspace (unchanged)
└── credentials/                    # Security (unchanged)
```

**Sharing workflow becomes:**
1. Zip `.slide-builder/config/`
2. Share zip file
3. Recipient unzips to their `.slide-builder/config/`
4. Done - they have your complete brand theme

### Scope

**In Scope:**

- Create `.slide-builder/config/` directory structure
- Move `theme.json` → `config/theme.json`
- Move `theme-history/` → `config/theme-history/`
- Move `samples/` → `config/samples/`
- Move `templates/` → `config/templates/`
- Update all 12 workflow files to reference new `config/` paths
- Update `.gitignore` to reflect new structure
- Update `CONVENTIONS.md` if it references these paths
- Update `architecture.md` to document new structure

**Out of Scope:**

- No new commands (`/export-config`, `/import-config`) - manual zip only
- `status.yaml` stays at root (runtime state, not shareable)
- `deck/`, `single/` stay at root (user workspace, not shareable)
- `output/` stays at project root (user workspace)
- `credentials/` stays at root (security sensitive)
- No migration script for existing users (manual move for now)

---

## Implementation Details

### Source Tree Changes

| File/Directory | Action | Details |
|----------------|--------|---------|
| `.slide-builder/config/` | CREATE | New directory for shareable config |
| `.slide-builder/config/theme.json` | MOVE | From `.slide-builder/theme.json` |
| `.slide-builder/config/theme-history/` | MOVE | From `.slide-builder/theme-history/` |
| `.slide-builder/config/samples/` | MOVE | From `.slide-builder/samples/` |
| `.slide-builder/config/templates/` | MOVE | From `.slide-builder/templates/` |
| `.slide-builder/workflows/setup/workflow.yaml` | MODIFY | Update theme/samples/templates paths |
| `.slide-builder/workflows/setup/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/theme/workflow.yaml` | MODIFY | Update theme.json path |
| `.slide-builder/workflows/theme/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/theme-edit/workflow.yaml` | MODIFY | Update theme paths |
| `.slide-builder/workflows/theme-edit/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/build-one/workflow.yaml` | MODIFY | Update templates path |
| `.slide-builder/workflows/build-one/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/build-all/workflow.yaml` | MODIFY | Update templates path |
| `.slide-builder/workflows/build-all/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/plan-one/workflow.yaml` | MODIFY | Update templates path if referenced |
| `.slide-builder/workflows/plan-deck/workflow.yaml` | MODIFY | Update templates path if referenced |
| `.slide-builder/workflows/edit/workflow.yaml` | MODIFY | Update templates path |
| `.slide-builder/workflows/edit/instructions.md` | MODIFY | Update path references |
| `.slide-builder/workflows/export/workflow.yaml` | MODIFY | Update paths if referenced |
| `.gitignore` | MODIFY | Update gitignore patterns for new structure |
| `notes/architecture.md` | MODIFY | Document new config/ structure |

### Technical Approach

**Path Reference Pattern:**

All workflows currently use `{installed_path}` for workflow-relative paths. For config assets, introduce a new variable:

```yaml
# In workflow.yaml files
config_path: "{project-root}/.slide-builder/config"
theme_file: "{config_path}/theme.json"
templates_dir: "{config_path}/templates"
samples_dir: "{config_path}/samples"
theme_history_dir: "{config_path}/theme-history"
```

**File Move Strategy:**

Use `git mv` to preserve history:
```bash
git mv .slide-builder/theme.json .slide-builder/config/theme.json
git mv .slide-builder/theme-history .slide-builder/config/theme-history
git mv .slide-builder/samples .slide-builder/config/samples
git mv .slide-builder/templates .slide-builder/config/templates
```

**Backward Compatibility:**

None required - this is a structural refactor. All paths updated atomically in one commit.

### Existing Patterns to Follow

From the existing codebase:

1. **Path Variables:** Use `{project-root}` and `{installed_path}` pattern from existing workflows
2. **YAML Structure:** Follow existing workflow.yaml format with clear variable definitions
3. **Gitignore Pattern:** Group related ignores with comments (see existing `.gitignore`)
4. **Directory Naming:** Use kebab-case for folders (e.g., `theme-history` not `themeHistory`)

### Integration Points

| Component | Integration | Impact |
|-----------|-------------|--------|
| `/setup` workflow | Writes to config/ | Must create config/ if not exists, write theme.json, samples/, templates/ |
| `/theme` workflow | Reads from config/ | Must read theme.json from new location |
| `/theme-edit` workflow | Reads/writes config/ | Must update theme.json, theme-history/ at new location |
| `/build-one` workflow | Reads from config/ | Must read theme.json and templates/ from new location |
| `/build-all` workflow | Reads from config/ | Must read theme.json and templates/ from new location |
| `/edit` workflow | Reads from config/ | Must read theme.json from new location |
| Status tracking | No change | status.yaml stays at root |

---

## Development Context

### Relevant Existing Code

| File | Lines | Reference For |
|------|-------|---------------|
| `.slide-builder/workflows/setup/workflow.yaml` | All | Current theme.json path pattern |
| `.slide-builder/workflows/build-one/workflow.yaml` | All | Current templates path pattern |
| `.slide-builder/workflows/theme/instructions.md` | All | How theme.json is read |
| `.gitignore` | 1-33 | Current gitignore structure |
| `notes/architecture.md` | 37-101 | Project structure documentation |

### Dependencies

**Framework/Libraries:**
- No new dependencies required
- Existing: puppeteer ^23.0.0, googleapis ^140.0.0

**Internal Modules:**
- All workflow files in `.slide-builder/workflows/`
- Slash commands in `.claude/commands/sb/`

### Configuration Changes

**`.gitignore` - Update from:**
```gitignore
# Theme configuration (user's brand)
.slide-builder/theme.json
.slide-builder/theme-history/

# Generated templates (created from user's theme during /setup)
.slide-builder/templates/

# Sample slides (generated during theme setup)
.slide-builder/samples/
```

**`.gitignore` - Update to:**
```gitignore
# User/Org Configuration (shareable brand assets)
# Zip .slide-builder/config/ to share your brand with others
.slide-builder/config/
```

### Existing Conventions (Brownfield)

| Convention | Current Pattern | Conform? |
|------------|-----------------|----------|
| Path variables | `{project-root}`, `{installed_path}` | Yes |
| Directory naming | kebab-case | Yes |
| Config format | JSON for data, YAML for state/plans | Yes |
| Gitignore style | Grouped with comments | Yes |

### Test Framework & Standards

No automated tests exist for this project (it's an agentic workflow framework). Validation is manual:

1. Run `/setup` - verify files created in `config/`
2. Run `/theme` - verify theme loads from `config/`
3. Run `/build-one` - verify templates load from `config/`
4. Zip `config/`, delete it, unzip - verify workflows still work

---

## Implementation Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Workflow Engine | BMAD workflow.xml | Executes workflow.yaml + instructions.md |
| State Management | YAML files | status.yaml, plan.yaml |
| Configuration | JSON files | theme.json |
| File Operations | Claude Code native | Read, Write, Edit tools |
| Version Control | Git | Track changes, preserve history with git mv |

---

## Technical Details

### Directory Creation Logic

The `/setup` workflow must create `config/` and subdirectories if they don't exist:

```
On /setup start:
1. Check if .slide-builder/config/ exists
2. If not, create:
   - .slide-builder/config/
   - .slide-builder/config/theme-history/
   - .slide-builder/config/samples/
   - .slide-builder/config/templates/
3. Proceed with theme extraction
4. Write theme.json to config/theme.json
5. Write samples to config/samples/
6. Write templates to config/templates/
```

### Theme History Pattern

When theme is modified via `/theme-edit`:

```
1. Read current theme from config/theme.json
2. Copy current to config/theme-history/theme-v{N}-{date}.json
3. Apply modifications
4. Write updated theme to config/theme.json
```

### Path Resolution

All workflows resolve paths using this pattern:

```yaml
# workflow.yaml
config_path: "{project-root}/.slide-builder/config"

# Then reference as:
theme_file: "{config_path}/theme.json"
```

The workflow engine replaces `{project-root}` with the actual project root at runtime.

---

## Development Setup

```bash
# No setup changes - same environment
# Project already has package.json with dependencies

# To test changes:
1. Make the file moves (git mv)
2. Update workflow files
3. Run /setup or /theme to verify
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b refactor/config-folder`
2. Verify current state: all workflows working before changes

### Implementation Steps

**Story 1: Create config folder and move files**
1. Create `.slide-builder/config/` directory
2. `git mv .slide-builder/theme.json .slide-builder/config/theme.json`
3. `git mv .slide-builder/theme-history .slide-builder/config/theme-history`
4. `git mv .slide-builder/samples .slide-builder/config/samples`
5. `git mv .slide-builder/templates .slide-builder/config/templates`
6. Update `.gitignore` with new pattern
7. Commit: "refactor: create config folder structure"

**Story 2: Update workflow path references**
1. Update `setup/workflow.yaml` - theme, samples, templates paths
2. Update `setup/instructions.md` - path references
3. Update `theme/workflow.yaml` and `instructions.md`
4. Update `theme-edit/workflow.yaml` and `instructions.md`
5. Update `build-one/workflow.yaml` and `instructions.md`
6. Update `build-all/workflow.yaml` and `instructions.md`
7. Update `edit/workflow.yaml` and `instructions.md`
8. Update any other workflows referencing these paths
9. Commit: "refactor: update workflow paths to use config/"

**Story 3: Update documentation**
1. Update `notes/architecture.md` - project structure section
2. Update `.slide-builder/CONVENTIONS.md` if needed
3. Add comment in `.gitignore` explaining config/ purpose
4. Commit: "docs: update architecture for config folder"

### Testing Strategy

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Theme loads | Run `/theme` | Displays theme from config/theme.json |
| Setup creates config | Delete config/, run `/setup` | Creates config/ with theme, samples, templates |
| Build uses templates | Run `/build-one` | Uses templates from config/templates/ |
| Theme edit works | Run `/theme-edit` | Updates config/theme.json, creates history |
| Config portable | Zip config/, delete, unzip, run `/theme` | Theme loads correctly |

### Acceptance Criteria

1. All config assets consolidated in `.slide-builder/config/`
2. All workflows read/write to new config/ location
3. `/setup` creates config/ directory structure if missing
4. `/theme` successfully reads theme from config/theme.json
5. `/build-one` successfully reads templates from config/templates/
6. User can zip config/, share, and recipient can use immediately
7. `.gitignore` updated to ignore config/ as single entry
8. Architecture docs updated to reflect new structure

---

## Developer Resources

### File Paths Reference

**Config folder (shareable):**
- `.slide-builder/config/theme.json`
- `.slide-builder/config/theme-history/`
- `.slide-builder/config/samples/`
- `.slide-builder/config/templates/`

**Workflows to modify:**
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

**Other files:**
- `.gitignore`
- `notes/architecture.md`

### Key Code Locations

| Purpose | File | What to Change |
|---------|------|----------------|
| Theme path definition | `*/workflow.yaml` | Add `config_path` variable, update `theme_file` |
| Templates path | `build-*/workflow.yaml` | Update `templates_dir` to use config_path |
| Samples path | `setup/workflow.yaml` | Update `samples_dir` to use config_path |
| Theme history | `theme-edit/workflow.yaml` | Update `theme_history_dir` to use config_path |

### Testing Locations

Manual testing only - run slash commands and verify behavior:
- `/setup` - Creates config/ structure
- `/theme` - Reads from config/
- `/build-one` - Uses config/templates/
- `/theme-edit` - Updates config/theme.json

### Documentation to Update

- `notes/architecture.md` - Project structure section (lines 37-101)
- `.slide-builder/CONVENTIONS.md` - If it references paths
- `.gitignore` - Comments explaining config/ purpose

---

## UX/UI Considerations

No UI/UX impact - this is a backend/structural change only. Users interact through the same slash commands with identical behavior.

---

## Testing Approach

**Manual Validation Protocol:**

1. **Pre-change baseline:** Run `/theme`, `/build-one` - confirm working
2. **Post-change validation:**
   - Run `/theme` - must display theme correctly
   - Run `/build-one` with a plan - must generate slide
   - Run `/setup` fresh - must create config/ structure
   - Run `/theme-edit` - must update theme and create history
3. **Portability test:**
   - Zip `.slide-builder/config/`
   - Delete `.slide-builder/config/`
   - Unzip the backup
   - Run `/theme` - must work

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main
2. No deployment needed - this is a local CLI tool
3. Users pull latest and their existing files need manual migration

### Rollback Plan

1. `git revert <commit-hash>` for each commit
2. Manually move files back:
   ```bash
   mv .slide-builder/config/theme.json .slide-builder/theme.json
   mv .slide-builder/config/theme-history .slide-builder/theme-history
   mv .slide-builder/config/samples .slide-builder/samples
   mv .slide-builder/config/templates .slide-builder/templates
   rmdir .slide-builder/config
   ```

### Monitoring

N/A - Local CLI tool, no production monitoring.

---

## Summary

| Metric | Value |
|--------|-------|
| Files to Create | 1 directory (config/) |
| Files to Move | 4 (theme.json, theme-history/, samples/, templates/) |
| Workflows to Update | ~8-10 |
| Other Files to Update | 2 (.gitignore, architecture.md) |
| Stories | 3 |
| Breaking Changes | None (internal refactor) |
