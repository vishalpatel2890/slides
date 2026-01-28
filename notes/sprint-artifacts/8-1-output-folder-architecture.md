# Story 8.1: Output Folder Architecture

**Epic:** 8 - Slide Viewer & Output Architecture
**Story ID:** 8-1
**Story Key:** 8-1-output-folder-architecture
**Status:** done
**Created:** 2026-01-27

---

## Story

As a **slide builder user**,
I want **slides to be saved to a clean output folder structure**,
So that **viewable content is separate from working files and organized by deck**.

---

## Acceptance Criteria

1. **Given** a deck with deck_name "Claude Code Fundamentals"
   **When** I run /sb:build-one or /sb:build-all
   **Then** slides are saved to `output/claude-code-fundamentals/slides/slide-N.html`

2. **And** plan.yaml is copied to `output/claude-code-fundamentals/`

3. **And** single slides are saved to `output/singles/{slide-name}.html`

4. **And** the slug is generated correctly (lowercase, hyphens, no special chars)

---

## Dev Notes

**Prerequisites:** None (foundation story for Epic 8)

**Technical Notes:**
- Modify build-one and build-all workflow.yaml and instructions.md
- Add slug generation: lowercase, replace spaces with hyphens, remove special chars
- Create output directories if they don't exist
- Update status.yaml to track output_folder

**Files to Modify:**
- `.slide-builder/workflows/build-one/workflow.yaml`
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-all/workflow.yaml`
- `.slide-builder/workflows/build-all/instructions.md`
- `.slide-builder/status.yaml`

---

## Tasks/Subtasks

- [x] Add slug generation logic to build-one workflow
  - [x] Update workflow.yaml with output_folder variable
  - [x] Update instructions.md with slug generation step
  - [x] Update instructions.md with new output paths
- [x] Add slug generation logic to build-all workflow
  - [x] Update workflow.yaml with output_folder variable
  - [x] Update instructions.md with slug generation and output paths
- [x] Update status.yaml schema to track output_folder
- [x] Create output directory structure on first build
- [x] Copy plan.yaml to output folder
- [x] Test deck mode output: slides saved to output/{slug}/slides/
- [x] Test single mode output: slides saved to output/singles/

---

## Frontend Test Gate

**Prerequisites:**
- Existing theme must exist (.slide-builder/theme.json)

**Test Steps - Deck Mode:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `/sb:plan-deck` and create a deck | Output message shows slug and output path |
| 2 | Run `/sb:build-one` | Slide saved to `output/{slug}/slides/slide-1.html` |
| 3 | Check `ls output/` | Folder with deck slug exists |
| 4 | Check `ls output/{slug}/` | Contains `slides/` folder and `plan.yaml` |
| 5 | Run `/sb:edit 1` | Finds slide in output/{slug}/slides/ |

**Test Steps - Single Mode:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `/sb:plan-one` | Output message shows output path (output/singles/) |
| 2 | Run `/sb:build-one` | Slide saved to `output/singles/{slug}.html` |
| 3 | Check `ls output/singles/` | Contains the slide HTML file |

**Success Criteria:**
- [x] Deck slides are saved to output/{deck-slug}/slides/
- [x] Deck slug is correctly generated (lowercase, hyphens)
- [x] Single slides are saved to output/singles/{intent-slug}.html
- [x] Output directory structure is created automatically
- [x] plan.yaml is copied to deck output folder on first build
- [x] /sb:edit finds slides in new output location
- [x] /sb:export references new output location

**Feedback Questions:**
- Does the output folder location make sense for your workflow?
- Is the slug format acceptable (lowercase, hyphens)?

---

## Dev Agent Record

### Debug Log
**2026-01-27 Implementation Plan:**
1. Modify build-one workflow.yaml to add output_folder variable pointing to {project-root}/output
2. Modify build-one instructions.md to:
   - Add slug generation step (lowercase deck_name, replace spaces with hyphens, remove special chars)
   - Change deck output path from .slide-builder/deck/slides/ to output/{slug}/slides/
   - Change single output path from .slide-builder/single/ to output/singles/
   - Add step to copy plan.yaml to output folder
3. Modify build-all workflow.yaml similarly
4. Modify build-all instructions.md similarly
5. Update status.yaml schema to include output_folder tracking

**2026-01-27 Implementation Complete:**
- ✅ build-one/workflow.yaml updated with output_root, single_output_dir, deck_output_dir
- ✅ build-one/instructions.md updated with slug generation and new output paths
- ✅ build-all/workflow.yaml updated with output_root, deck_output_dir
- ✅ build-all/instructions.md updated with slug generation and new output paths
- ✅ Both workflows now track output_folder and deck_slug in status.yaml
- ✅ plan.yaml copied to output folder on first slide build
- ✅ Single slides now go to output/singles/{slug}.html

### Completion Notes
**Completed: 2026-01-27**

Implemented clean output folder architecture:
- All slide outputs now go to `output/` folder
- Deck slides: `output/{deck-slug}/slides/slide-N.html`
- Single slides: `output/singles/{slug}.html`
- Slug generation: lowercase, spaces→hyphens, remove special chars
- plan.yaml copied to deck output folder on first build
- Removed obsolete `.slide-builder/single/` and `.slide-builder/deck/slides/` directories
- Updated all workflows: plan-one, plan-deck, build-one, build-all, edit, export

---

## File List

**Modified:**
- `.slide-builder/workflows/build-one/workflow.yaml` - Added output_root, single_output_dir, deck_output_dir variables
- `.slide-builder/workflows/build-one/instructions.md` - Added slug generation, new output paths, plan.yaml copy
- `.slide-builder/workflows/build-all/workflow.yaml` - Added output_root, deck_output_dir variables
- `.slide-builder/workflows/build-all/instructions.md` - Added slug generation, new output paths, plan.yaml copy
- `.slide-builder/workflows/plan-one/workflow.yaml` - Changed plan_file to output/singles/plan.yaml
- `.slide-builder/workflows/plan-one/instructions.md` - Creates output/singles/ instead of .slide-builder/single/
- `.slide-builder/workflows/plan-deck/instructions.md` - Added slug generation, updated output message
- `.slide-builder/workflows/edit/workflow.yaml` - Updated slide paths to output/ location
- `.slide-builder/workflows/edit/instructions.md` - Updated to read slides from output/{slug}/slides/
- `.slide-builder/workflows/export/instructions.md` - Updated to read slides from new output location

**New output structure:**
- `output/{deck-slug}/slides/` - Deck slides
- `output/{deck-slug}/plan.yaml` - Copy of deck plan
- `output/singles/` - Single slides

**Working files:**
- `.slide-builder/deck/plan.yaml` - Deck plan (working file)
- `.slide-builder/status.yaml` - Status tracking (now includes deck_slug, output_folder)
- `output/singles/plan.yaml` - Single slide plan (in output folder)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story created from epic definition | Dev Agent |

---
