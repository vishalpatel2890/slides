# Story 8.1: Output Folder Architecture

**Status:** Draft

---

## User Story

As a **slide builder user**,
I want **slides to be saved to a clean output folder structure**,
So that **viewable content is separate from working files and organized by deck**.

---

## Acceptance Criteria

**Given** a deck with deck_name "Claude Code Fundamentals"
**When** I run /sb:build-one or /sb:build-all
**Then** slides are saved to `output/claude-code-fundamentals/slides/slide-N.html`

**And** plan.yaml is copied to `output/claude-code-fundamentals/`
**And** single slides are saved to `output/singles/{slide-name}.html`
**And** the slug is generated correctly (lowercase, hyphens, no special chars)
**And** output directories are created automatically if they don't exist

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1: Add output_folder variable to build-one workflow**
  - Edit `.slide-builder/workflows/build-one/workflow.yaml`
  - Add `output_folder: "{project-root}/output"`
  - Add `deck_slug: runtime-captured`

- [ ] **Task 2: Implement slug generation in build-one instructions**
  - Edit `.slide-builder/workflows/build-one/instructions.md`
  - Add step to read deck_name from plan.yaml
  - Generate slug: lowercase, replace spaces with hyphens, remove special chars
  - Store as {deck_slug} variable

- [ ] **Task 3: Update slide output path in build-one**
  - Change output from `.slide-builder/deck/slides/` to `output/{deck_slug}/slides/`
  - Create directories if they don't exist
  - Copy plan.yaml to `output/{deck_slug}/`

- [ ] **Task 4: Update single slide output path**
  - Change single slide output from `.slide-builder/single/` to `output/singles/`
  - Use slide name from plan.yaml for filename

- [ ] **Task 5: Update build-all workflow**
  - Edit `.slide-builder/workflows/build-all/workflow.yaml`
  - Add same output_folder and deck_slug variables
  - Edit `.slide-builder/workflows/build-all/instructions.md`
  - Apply same path changes as build-one

- [ ] **Task 6: Update status.yaml tracking**
  - Add `output_folder` field to status.yaml
  - Track current deck output location

### Technical Summary

This story restructures where slides are saved, moving from `.slide-builder/deck/slides/` (working directory) to `output/{deck-slug}/slides/` (clean output directory). The deck slug is generated from the `deck_name` in plan.yaml using a simple algorithm: lowercase, replace spaces with hyphens, remove special characters.

**Slug Generation Algorithm:**
```javascript
function generateSlug(deckName) {
  return deckName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-');          // Collapse multiple hyphens
}
// "Claude Code Fundamentals" → "claude-code-fundamentals"
```

**New Output Structure:**
```
output/
├── claude-code-fundamentals/    ← Deck slug from deck_name
│   ├── slides/
│   │   ├── slide-1.html
│   │   ├── slide-2.html
│   │   └── ...
│   └── plan.yaml               ← Copy for reference
└── singles/
    └── {slide-name}.html
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/build-one/workflow.yaml`
  - `.slide-builder/workflows/build-one/instructions.md`
  - `.slide-builder/workflows/build-all/workflow.yaml`
  - `.slide-builder/workflows/build-all/instructions.md`
  - `.slide-builder/status.yaml`

- **Expected test locations:** Manual browser testing
- **Prerequisites:** None (foundation story)

### Key Code References

| Reference | Location | Pattern |
|-----------|----------|---------|
| Current output path | `.slide-builder/workflows/build-one/workflow.yaml:22-23` | deck_output variable |
| Plan.yaml structure | `.slide-builder/deck/plan.yaml:8` | deck_name field |
| Status tracking | `.slide-builder/status.yaml` | mode, history fields |

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** BMAD workflow pattern - workflow.yaml + instructions.md

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
