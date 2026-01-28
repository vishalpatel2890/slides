# Slide Builder - Technical Specification: Move Viewer Template & Cleanup Deprecated Folders

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick-Flow
**Change Type:** Refactoring / Cleanup
**Development Context:** Brownfield

---

## Context

### Available Documents

- **CONVENTIONS.md:** `.slide-builder/CONVENTIONS.md` - Defines intended file structure
- **Existing Tech Specs:** `notes/tech-spec-config-folder.md`, `notes/tech-spec-catalog.md`
- **Catalog System:** Already implemented in `config/catalog/`

### Project Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18+ |
| Dependencies | puppeteer | ^23.0.0 |
| Dependencies | googleapis | ^140.0.0 |
| Framework | BMAD-pattern agentic workflows | N/A |
| Viewer Generator | scripts/regenerate-viewer.js | N/A |

### Existing Codebase Structure

```
.slide-builder/
├── config/
│   ├── theme.json              # Brand primitives (keep)
│   ├── theme-history/          # Version snapshots (keep)
│   ├── catalog/                # NEW catalog system (keep)
│   │   ├── catalog.json
│   │   └── *.html              # 7 slide layout templates
│   ├── samples/                # DEPRECATED - to be removed
│   │   └── *.html              # 8 sample slides
│   └── templates/              # DEPRECATED - to be removed
│       ├── viewer-template.html    # Framework code (move out)
│       └── layout-rocd-initiative.html  # Duplicate (remove)
├── workflows/                  # Core framework
├── status.yaml
└── CONVENTIONS.md
```

---

## The Change

### Problem Statement

The `config/` folder is intended for **user/org-specific shareable brand assets** that can be zipped and shared. Currently it contains:

1. **`config/templates/viewer-template.html`** - This is **framework code**, not a brand asset. It's the master template used by `scripts/regenerate-viewer.js` to generate deck viewers. It should not be shared when zipping `config/`.

2. **`config/samples/`** - Deprecated folder containing old sample slides. Replaced by the catalog system.

3. **`config/templates/`** - Deprecated folder. The `layout-rocd-initiative.html` is already migrated to catalog as `rocd-initiative-template.html`.

Workflows still reference these deprecated folders, causing confusion and potential errors.

### Proposed Solution

1. **Create `.slide-builder/templates/`** - New folder for framework templates (peer to `workflows/`, `config/`)
2. **Move `viewer-template.html`** to `.slide-builder/templates/viewer-template.html`
3. **Delete `config/templates/`** folder entirely
4. **Delete `config/samples/`** folder entirely
5. **Update all workflow references** to use `config/catalog/` instead of deprecated folders
6. **Update `scripts/regenerate-viewer.js`** to use new viewer-template path
7. **Update CONVENTIONS.md** to document the framework templates folder

### Scope

**In Scope:**

- Create `.slide-builder/templates/` directory
- Move `viewer-template.html` to new location
- Delete `config/samples/` directory and contents
- Delete `config/templates/` directory and contents
- Update `scripts/regenerate-viewer.js` path reference
- Update `build-one/instructions.md` - change samples references to catalog
- Update `build-all/instructions.md` - change samples references to catalog
- Update `theme-edit/instructions.md` - remove/update sample generation logic
- Update `setup/instructions.md` - update cleanup logic
- Update `CONVENTIONS.md` - document new structure

**Out of Scope:**

- Changes to catalog system (already working)
- Changes to theme.json or theme-history/
- New functionality

---

## Implementation Details

### Source Tree Changes

| File/Directory | Action | Details |
|----------------|--------|---------|
| `.slide-builder/templates/` | CREATE | New directory for framework templates |
| `.slide-builder/templates/viewer-template.html` | MOVE | From `config/templates/viewer-template.html` |
| `.slide-builder/config/templates/` | DELETE | Remove entire directory |
| `.slide-builder/config/samples/` | DELETE | Remove entire directory |
| `scripts/regenerate-viewer.js` | MODIFY | Update templatePath from `config/templates/` to `templates/` |
| `.slide-builder/workflows/build-one/instructions.md` | MODIFY | Change `config/samples/` refs to `config/catalog/` |
| `.slide-builder/workflows/build-all/instructions.md` | MODIFY | Change `config/samples/` refs to `config/catalog/` |
| `.slide-builder/workflows/theme-edit/instructions.md` | MODIFY | Remove sample generation to deprecated folder |
| `.slide-builder/workflows/setup/instructions.md` | MODIFY | Update/keep cleanup logic for deprecated folders |
| `.slide-builder/CONVENTIONS.md` | MODIFY | Document templates/ folder for framework assets |

### Technical Approach

**File Move:**
```bash
# Create new templates folder
mkdir -p .slide-builder/templates

# Move viewer-template (not git tracked, use mv)
mv .slide-builder/config/templates/viewer-template.html .slide-builder/templates/

# Delete deprecated folders
rm -rf .slide-builder/config/templates
rm -rf .slide-builder/config/samples
```

**Path Update in regenerate-viewer.js (line 61):**
```javascript
// Before:
const templatePath = path.join(PROJECT_ROOT, '.slide-builder', 'config', 'templates', 'viewer-template.html');

// After:
const templatePath = path.join(PROJECT_ROOT, '.slide-builder', 'templates', 'viewer-template.html');
```

### Existing Patterns to Follow

From existing codebase:

1. **Folder naming:** Use kebab-case or simple lowercase (`templates/`, `workflows/`, `config/`)
2. **Path references in workflows:** Use `{project-root}/.slide-builder/` pattern
3. **Catalog references:** Use `config/catalog/` for slide layout templates

### Integration Points

| Component | Integration | Impact |
|-----------|-------------|--------|
| `scripts/regenerate-viewer.js` | Reads viewer-template.html | Must update path |
| `/build-one` workflow | References samples for layout hints | Update to catalog |
| `/build-all` workflow | References samples for layout hints | Update to catalog |
| `/theme-edit` workflow | Generates samples | Remove deprecated logic |
| `/setup` workflow | Cleans up deprecated folders | Keep/enhance |

---

## Development Context

### Relevant Existing Code

| File | Lines | Reference For |
|------|-------|---------------|
| `scripts/regenerate-viewer.js` | 61 | Current viewer-template path |
| `.slide-builder/workflows/build-one/instructions.md` | 47 | Samples reference |
| `.slide-builder/workflows/build-all/instructions.md` | 152, 184, 529 | Samples references |
| `.slide-builder/workflows/theme-edit/instructions.md` | 265-317, 610-660 | Sample generation |
| `.slide-builder/workflows/setup/instructions.md` | 1978-1987 | Cleanup logic |

### Dependencies

**Framework/Libraries:**
- No new dependencies
- Existing: puppeteer ^23.0.0, googleapis ^140.0.0

**Internal Modules:**
- `scripts/regenerate-viewer.js` - Viewer generation script
- All workflow files in `.slide-builder/workflows/`

### Configuration Changes

None required - this is file reorganization only.

### Existing Conventions (Brownfield)

| Convention | Current Pattern | Conform? |
|------------|-----------------|----------|
| Path variables | `{project-root}/.slide-builder/` | Yes |
| Directory naming | lowercase/kebab-case | Yes |
| Catalog for layouts | `config/catalog/` | Yes |

### Test Framework & Standards

Manual validation only:
1. Run `node scripts/regenerate-viewer.js {deck-slug}` - verify viewer generates
2. Run `/sb:build-one` - verify no errors about missing samples
3. Verify `config/` only contains theme.json, theme-history/, catalog/

---

## Implementation Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Workflow Engine | BMAD workflow.xml | Executes workflows |
| Viewer Generation | Node.js script | Creates deck index.html |
| File Operations | Bash / Claude Code | Move and delete files |

---

## Technical Details

### Directory Structure After Change

```
.slide-builder/
├── config/                         # Shareable brand assets (zip to share)
│   ├── theme.json                  # Brand primitives
│   ├── theme-history/              # Version snapshots
│   └── catalog/                    # Slide layout templates
│       ├── catalog.json
│       ├── title.html
│       ├── agenda.html
│       ├── process-flow.html
│       ├── comparison.html
│       ├── callout.html
│       ├── technical.html
│       └── rocd-initiative-template.html
├── templates/                      # Framework templates (NOT shareable)
│   └── viewer-template.html        # Deck viewer generator template
├── workflows/                      # Core framework
├── credentials/                    # OAuth tokens (gitignored)
├── status.yaml                     # Runtime state
└── CONVENTIONS.md
```

### Workflow Reference Updates

**build-one/instructions.md:**
- Line 47: Change "sample files in `.slide-builder/config/samples/`" to "catalog templates in `.slide-builder/config/catalog/`"

**build-all/instructions.md:**
- Line 152, 184: Change `config/samples/{{template_file}}` to `config/catalog/{{template_file}}`
- Line 529: Change `config/samples/` to `config/catalog/`

**theme-edit/instructions.md:**
- Lines 265-317: Remove or update sample generation to not reference deprecated samples/
- Lines 610-660: Same - remove deprecated sample generation logic

---

## Development Setup

```bash
# No setup changes needed
# Project already configured
```

---

## Implementation Guide

### Setup Steps

1. Verify current state: `ls -la .slide-builder/config/`
2. Verify viewer-template exists: `ls -la .slide-builder/config/templates/viewer-template.html`

### Implementation Steps

**Task 1: Create templates folder and move viewer-template**
1. Create `.slide-builder/templates/` directory
2. Move `viewer-template.html` to new location
3. Verify move successful

**Task 2: Update regenerate-viewer.js**
1. Edit `scripts/regenerate-viewer.js` line 61
2. Change path from `config/templates/viewer-template.html` to `templates/viewer-template.html`
3. Test: `node scripts/regenerate-viewer.js claude-code-fundamentals`

**Task 3: Delete deprecated folders**
1. Delete `.slide-builder/config/templates/` directory
2. Delete `.slide-builder/config/samples/` directory

**Task 4: Update workflow instructions**
1. Update `build-one/instructions.md` - samples → catalog
2. Update `build-all/instructions.md` - samples → catalog
3. Update `theme-edit/instructions.md` - remove deprecated sample generation
4. Update `setup/instructions.md` - verify cleanup logic still relevant

**Task 5: Update CONVENTIONS.md**
1. Add `templates/` folder to file structure documentation
2. Document that `templates/` is for framework templates (not shareable)

### Testing Strategy

| Test | Command/Action | Expected Result |
|------|----------------|-----------------|
| Viewer generation | `node scripts/regenerate-viewer.js claude-code-fundamentals` | Successfully generates index.html |
| Build workflow | `/sb:build-one` | No errors about missing samples |
| Config folder clean | `ls .slide-builder/config/` | Only theme.json, theme-history/, catalog/ |

### Acceptance Criteria

1. `viewer-template.html` exists at `.slide-builder/templates/viewer-template.html`
2. `scripts/regenerate-viewer.js` successfully generates viewers from new path
3. `.slide-builder/config/templates/` does not exist
4. `.slide-builder/config/samples/` does not exist
5. All workflow instructions reference `config/catalog/` not `config/samples/`
6. `CONVENTIONS.md` documents the `templates/` folder

---

## Developer Resources

### File Paths Reference

**Files to create:**
- `.slide-builder/templates/viewer-template.html`

**Files to delete:**
- `.slide-builder/config/templates/` (entire directory)
- `.slide-builder/config/samples/` (entire directory)

**Files to modify:**
- `scripts/regenerate-viewer.js`
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-all/instructions.md`
- `.slide-builder/workflows/theme-edit/instructions.md`
- `.slide-builder/workflows/setup/instructions.md`
- `.slide-builder/CONVENTIONS.md`

### Key Code Locations

| Purpose | File | Line(s) |
|---------|------|---------|
| Viewer template path | `scripts/regenerate-viewer.js` | 61 |
| Samples reference | `build-one/instructions.md` | 47 |
| Samples reference | `build-all/instructions.md` | 152, 184, 529 |
| Sample generation | `theme-edit/instructions.md` | 265-317, 610-660 |
| Cleanup logic | `setup/instructions.md` | 1978-1987 |

### Testing Locations

Manual testing via:
- `node scripts/regenerate-viewer.js {deck-slug}`
- `/sb:build-one` command
- `ls` commands to verify folder structure

---

## UX/UI Considerations

No UI/UX impact - this is a backend/structural change only.

---

## Testing Approach

**Manual Validation:**
1. Generate a viewer: `node scripts/regenerate-viewer.js claude-code-fundamentals`
2. Verify output at `output/claude-code-fundamentals/index.html`
3. Run `/sb:build-one` to verify workflow works without samples/ reference errors

---

## Deployment Strategy

### Deployment Steps

1. Make file changes (move, delete, edit)
2. Test viewer generation
3. Commit changes

### Rollback Plan

1. Recreate `config/templates/` and `config/samples/` from git history or backup
2. Revert `scripts/regenerate-viewer.js` path change
3. Revert workflow instruction changes

### Monitoring

N/A - Local CLI tool

---

## Summary

| Metric | Value |
|--------|-------|
| Directories to Create | 1 (`.slide-builder/templates/`) |
| Files to Move | 1 (`viewer-template.html`) |
| Directories to Delete | 2 (`config/templates/`, `config/samples/`) |
| Files to Modify | 6 |
| Stories | 1 |
| Breaking Changes | None |
