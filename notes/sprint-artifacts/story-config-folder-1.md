# Story 1: Create Config Folder Structure

**Status:** Review

---

## User Story

As a **Slide Builder user**,
I want **all my brand configuration in a single folder**,
So that **I can easily zip and share my theme with teammates**.

---

## Acceptance Criteria

**Given** an existing .slide-builder/ directory with theme.json, theme-history/, samples/, templates/ at root
**When** the config folder refactoring is applied
**Then** all four items are moved to .slide-builder/config/

**And** .gitignore is updated to ignore .slide-builder/config/ as a single entry
**And** git history is preserved via git mv
**And** the directory structure matches:
```
.slide-builder/
├── config/
│   ├── theme.json
│   ├── theme-history/
│   ├── samples/
│   └── templates/
├── workflows/           (unchanged)
├── status.yaml          (unchanged)
├── deck/                (unchanged)
└── single/              (unchanged)
```

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1.1:** Create `.slide-builder/config/` directory
- [x] **Task 1.2:** Move theme.json → config/theme.json (note: used `mv` since file is gitignored, not tracked)
- [x] **Task 1.3:** Move theme-history/ → config/theme-history/ (note: used `mv` since dir is gitignored)
- [x] **Task 1.4:** Move samples/ → config/samples/ (note: used `mv` since dir is gitignored)
- [x] **Task 1.5:** Move templates/ → config/templates/ (note: used `mv` since dir is gitignored)
- [x] **Task 1.6:** Update .gitignore to replace individual entries with single `config/` entry
- [x] **Task 1.7:** Commit changes with message: "refactor: create config folder structure"

### Technical Summary

This story performs the physical file restructuring. All moves use `git mv` to preserve version history. The .gitignore is simplified from 4 separate entries to a single `config/` entry with a descriptive comment explaining its purpose.

### Project Structure Notes

- **Files to modify:** `.gitignore`
- **Files to move:** `theme.json`, `theme-history/`, `samples/`, `templates/`
- **Expected test locations:** Manual verification via `ls -la .slide-builder/config/`
- **Prerequisites:** None

### Key Code References

**Current .gitignore (to be replaced):**
```gitignore
# Theme configuration (user's brand)
.slide-builder/theme.json
.slide-builder/theme-history/

# Generated templates (created from user's theme during /setup)
.slide-builder/templates/

# Sample slides (generated during theme setup)
.slide-builder/samples/
```

**New .gitignore entry:**
```gitignore
# User/Org Configuration (shareable brand assets)
# Zip .slide-builder/config/ to share your brand with others
.slide-builder/config/
```

---

## Context References

**Tech-Spec:** [tech-spec-config-folder.md](../tech-spec-config-folder.md) - Primary context document containing:

- Complete source tree changes
- Technical approach with git mv strategy
- Path resolution patterns
- Testing strategy

**Architecture:** [architecture.md](../architecture.md) - Project structure (lines 37-101)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan:**
1. Created config/ directory inside .slide-builder/
2. Attempted `git mv` but files were gitignored (not tracked), so used regular `mv`
3. Updated .gitignore to use single config/ entry instead of 4 separate entries

**Note:** The acceptance criteria mentioned using `git mv` to preserve history, but since theme.json, theme-history/, samples/, and templates/ were all in .gitignore (not tracked by git), there was no git history to preserve. Regular `mv` was the appropriate operation.

### Completion Notes

- All 4 items successfully moved to .slide-builder/config/
- .gitignore simplified from 4 entries to 1 entry with descriptive comment
- Directory structure verified to match acceptance criteria
- **Important:** Workflow path references still point to old locations - Story 2 will update those

### Files Modified

- `.gitignore` - Replaced 4 separate slide-builder entries with single config/ entry

### Test Results

Verification command: `ls -la .slide-builder/config/`
```
drwxr-xr-x   6 vishalpatel  staff   192 Jan 28 06:15 .
drwxr-xr-x   8 vishalpatel  staff   256 Jan 28 06:15 ..
drwxr-xr-x@ 11 vishalpatel  staff   352 Jan 27 16:23 samples
drwxr-xr-x   4 vishalpatel  staff   128 Jan 28 06:12 templates
drwxr-xr-x   3 vishalpatel  staff    96 Jan 27 16:08 theme-history
-rw-r--r--   1 vishalpatel  staff  6469 Jan 27 16:23 theme.json
```
✅ All items present in config/ folder

---

## Review Notes

<!-- Will be populated during code review -->
