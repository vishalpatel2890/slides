# Story 1.1: Move Viewer Template & Cleanup Deprecated Folders

**Status:** done

---

## User Story

As a **Slide Builder developer**,
I want **the viewer-template.html moved out of config/ and deprecated folders removed**,
So that **the config/ folder only contains shareable brand assets and the codebase structure is clean**.

---

## Acceptance Criteria

**AC #1:** Given `.slide-builder/config/templates/viewer-template.html` exists
**When** the refactoring is complete
**Then** `viewer-template.html` exists at `.slide-builder/templates/viewer-template.html`

**AC #2:** Given the new viewer-template location
**When** running `node scripts/regenerate-viewer.js claude-code-fundamentals`
**Then** the viewer generates successfully without errors

**AC #3:** Given deprecated folders exist
**When** the refactoring is complete
**Then** `.slide-builder/config/templates/` directory does not exist

**AC #4:** Given deprecated folders exist
**When** the refactoring is complete
**Then** `.slide-builder/config/samples/` directory does not exist

**AC #5:** Given workflow instructions reference `config/samples/`
**When** the refactoring is complete
**Then** all workflow instructions reference `config/catalog/` instead

**AC #6:** Given CONVENTIONS.md documents the file structure
**When** the refactoring is complete
**Then** CONVENTIONS.md includes the `templates/` folder for framework templates

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1:** Create `.slide-builder/templates/` directory (AC: #1)
- [x] **Task 2:** Move `viewer-template.html` from `config/templates/` to `templates/` (AC: #1)
- [x] **Task 3:** Update `scripts/regenerate-viewer.js` line 61 to use new path (AC: #2)
- [x] **Task 4:** Test viewer generation: `node scripts/regenerate-viewer.js claude-code-fundamentals` (AC: #2)
- [x] **Task 5:** Delete `.slide-builder/config/templates/` directory (AC: #3)
- [x] **Task 6:** Delete `.slide-builder/config/samples/` directory (AC: #4)
- [x] **Task 7:** Update `build-one/instructions.md` - change `config/samples/` to `config/catalog/` (AC: #5)
- [x] **Task 8:** Update `build-all/instructions.md` - change `config/samples/` to `config/catalog/` (AC: #5)
- [x] **Task 9:** Update `theme-edit/instructions.md` - remove deprecated sample generation logic (AC: #5)
- [x] **Task 10:** Update `setup/instructions.md` - verify/update cleanup logic (AC: #5)
- [x] **Task 11:** Update `CONVENTIONS.md` - add templates/ folder documentation (AC: #6)
- [x] **Task 12:** Final verification - confirm config/ only has theme.json, theme-history/, catalog/

### Technical Summary

This story performs a structural cleanup to properly separate framework code from shareable brand assets:

1. **Create framework templates folder:** `.slide-builder/templates/` at root level (peer to `workflows/`, `config/`)
2. **Move viewer-template:** The 249KB viewer-template.html is framework code that generates deck viewers, not a brand asset
3. **Update regenerate-viewer.js:** Change path from `config/templates/viewer-template.html` to `templates/viewer-template.html`
4. **Delete deprecated folders:** `config/samples/` and `config/templates/` are replaced by `config/catalog/`
5. **Update workflow references:** All workflows referencing `config/samples/` must use `config/catalog/`

### Project Structure Notes

- **Files to modify:**
  - `scripts/regenerate-viewer.js`
  - `.slide-builder/workflows/build-one/instructions.md`
  - `.slide-builder/workflows/build-all/instructions.md`
  - `.slide-builder/workflows/theme-edit/instructions.md`
  - `.slide-builder/workflows/setup/instructions.md`
  - `.slide-builder/CONVENTIONS.md`
- **Expected test locations:** Manual testing via `node scripts/regenerate-viewer.js`
- **Estimated effort:** 1 story point
- **Prerequisites:** None

### Key Code References

| Purpose | File | Line(s) |
|---------|------|---------|
| Viewer template path | `scripts/regenerate-viewer.js` | 61 |
| Samples reference | `build-one/instructions.md` | 47 |
| Samples reference | `build-all/instructions.md` | 152, 184, 529 |
| Sample generation | `theme-edit/instructions.md` | 265-317, 610-660 |
| Cleanup logic | `setup/instructions.md` | 1978-1987 |

---

## Context References

**Tech-Spec:** [tech-spec-viewer-template-move.md](../tech-spec-viewer-template-move.md) - Primary context document containing:

- Complete source tree changes
- Directory structure before/after
- Workflow reference updates
- Testing strategy

**Related Tech-Specs:**
- [tech-spec-config-folder.md](../tech-spec-config-folder.md) - Original config folder restructuring
- [tech-spec-catalog.md](../tech-spec-catalog.md) - Catalog system that replaces samples/templates

---

## Dev Agent Record

### Context Reference

- [14-1-move-viewer-template-cleanup-folders.context.xml](./14-1-move-viewer-template-cleanup-folders.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

- Task 1-2: Created `.slide-builder/templates/` and moved viewer-template.html
- Task 3: Updated `scripts/regenerate-viewer.js` line 61 path reference
- Task 4: Verified viewer generation works with new path
- Task 5-6: Deleted deprecated `config/templates/` and `config/samples/` directories
- Task 7-9: Updated workflow instructions to use `config/catalog/` instead of deprecated folders
- Task 10: Verified setup cleanup logic is still relevant
- Task 11: Added `templates/` folder documentation to CONVENTIONS.md
- Task 12: Final verification passed

### Completion Notes

Successfully refactored the file structure to properly separate framework code from shareable brand assets:

1. **New structure:** `.slide-builder/templates/` contains framework templates (viewer-template.html)
2. **Clean config/:** Now only contains shareable brand assets (theme.json, theme-history/, catalog/)
3. **Updated workflows:** build-one, build-all, theme-edit instructions updated to use catalog system
4. **theme-edit preview:** Changed sample generation to output/theme-preview/ for visual validation during editing

All acceptance criteria met. Viewer generation tested and working.

### Files Modified

- `.slide-builder/templates/viewer-template.html` (created/moved)
- `scripts/regenerate-viewer.js` (line 61 path update)
- `.slide-builder/workflows/build-one/instructions.md` (samples → catalog)
- `.slide-builder/workflows/build-all/instructions.md` (3 samples → catalog refs)
- `.slide-builder/workflows/theme-edit/instructions.md` (samples → output/theme-preview/)
- `.slide-builder/CONVENTIONS.md` (added templates/ folder docs)

### Test Results

```
✅ Viewer generation test:
   node scripts/regenerate-viewer.js claude-code-fundamentals
   - Found 14 slides
   - Manifest generated successfully
   - Viewer regenerated successfully

✅ Config folder verification:
   ls .slide-builder/config/
   - catalog/ ✓
   - theme-history/ ✓
   - theme.json ✓
   - (no deprecated folders)

✅ Templates folder verification:
   ls .slide-builder/templates/
   - viewer-template.html ✓
```

---

### Completion Notes
**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

---

## Review Notes

<!-- Will be populated during code review -->
