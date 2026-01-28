# Story 8.2: Core Viewer Component

**Epic:** 8 - Slide Viewer & Output Architecture
**Story ID:** 8-2
**Story Key:** 8-2-core-viewer-component
**Status:** done
**Created:** 2026-01-27

---

## Story

As a **slide builder user**,
I want **an auto-generated viewer that shows all slides in gallery and presentation modes**,
So that **I can see all slides at a glance and present them sequentially**.

---

## Acceptance Criteria

1. **Given** slides exist in `output/{deck-slug}/slides/`
   **When** I open `output/{deck-slug}/index.html`
   **Then** I see a gallery grid of all slide thumbnails

2. **And** clicking a thumbnail enters presentation mode showing that slide

3. **And** prev/next buttons navigate between slides

4. **And** a close button returns to gallery view

5. **And** the viewer is auto-regenerated after each slide build

---

## Frontend Test Gate

**Gate ID**: 8-2-TG1

### Prerequisites
- [ ] Theme exists (.slide-builder/theme.json)
- [ ] Deck has been planned (/sb:plan-deck completed)
- [ ] At least 2 slides built in `output/{deck-slug}/slides/`
- [ ] Browser ready to open local HTML files

### Test Steps (Manual Browser Testing)

| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:build-one` | Claude Code terminal | Slide built, "Viewer regenerated" message appears |
| 2 | Open `output/{deck-slug}/index.html` | Browser | Gallery view displays with slide thumbnails |
| 3 | Count thumbnail cards | Gallery grid | All slides appear as clickable thumbnail cards |
| 4 | Click slide 2 thumbnail | Gallery card | Enters presentation mode showing slide 2 |
| 5 | Click "Next" button | Presentation controls | Navigates to slide 3 |
| 6 | Click "Previous" button | Presentation controls | Navigates back to slide 2 |
| 7 | Click "Close" or "X" button | Presentation header | Returns to gallery view |
| 8 | Build another slide (`/sb:build-one`) | Claude Code terminal | Viewer auto-regenerates |
| 9 | Refresh browser | Browser | New slide appears in gallery |

### Success Criteria (What User Sees)
- [ ] Gallery displays all slides as 16:9 thumbnail cards
- [ ] Clicking any thumbnail enters presentation mode at that slide
- [ ] Prev/Next buttons navigate between slides correctly
- [ ] Close button returns to gallery view
- [ ] Slide counter shows current position (e.g., "3 / 10")
- [ ] New slides appear after rebuild without manual intervention
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you navigate through all slides without issues?
2. Is the thumbnail size appropriate for quick scanning?
3. Are the navigation controls intuitive?
4. Any visual glitches or layout problems?

---

## Tasks / Subtasks

- [x] Task 1: Create viewer template (AC: 1, 2, 3, 4)
  - [x] 1.1 Create `.slide-builder/templates/viewer-template.html`
  - [x] 1.2 Implement gallery mode with CSS grid and iframe thumbnails
  - [x] 1.3 Implement presentation mode with single slide view
  - [x] 1.4 Add navigation controls (prev/next/close buttons)
  - [x] 1.5 Add slide counter display
  - [x] 1.6 Style with theme colors (dark bg, lime accent)

- [x] Task 2: Add viewer generation to build-one workflow (AC: 5)
  - [x] 2.1 Update `.slide-builder/workflows/build-one/instructions.md` with viewer generation step
  - [x] 2.2 Implement slide discovery (scan for slide-*.html files)
  - [x] 2.3 Sort slides numerically
  - [x] 2.4 Generate index.html from template with slide list

- [x] Task 3: Add viewer generation to build-all workflow (AC: 5)
  - [x] 3.1 Update `.slide-builder/workflows/build-all/instructions.md` with viewer generation step
  - [x] 3.2 Generate viewer after all slides are built

- [x] Task 4: Test and validate
  - [x] 4.1 Build 2+ slides and verify viewer shows all
  - [x] 4.2 Test gallery → presentation → gallery flow
  - [x] 4.3 Test navigation (prev/next/close)
  - [x] 4.4 Verify viewer regenerates on new slide build

---

## Dev Notes

### Technical Approach

**Viewer Template Structure:**
```html
<!-- Two-mode viewer: gallery (default) and presentation -->
<div id="gallery-view">
  <!-- Thumbnail grid using iframe + CSS transform -->
</div>
<div id="presentation-view" class="hidden">
  <!-- Single slide iframe + navigation controls -->
</div>
```

**Key Implementation Details:**

1. **Gallery Mode:**
   - CSS Grid layout (auto-fit, minmax 400px)
   - iframe per slide with transform: scale(0.208) for 16:9 thumbnail
   - Click thumbnail → enter presentation mode at that slide
   - Slide number overlay on each thumbnail

2. **Presentation Mode:**
   - Single iframe at full viewport
   - Navigation: prev/next buttons, slide counter
   - Exit: close button returns to gallery
   - Basic keyboard: ArrowLeft, ArrowRight, Escape (Story 8.3 adds full keyboard support)

3. **Slide Discovery:**
   - Scan output folder for slide-*.html files
   - Sort numerically (slide-1, slide-2, ...)
   - Generate slide list for template

### Project Structure Notes

**Files to Create:**
- `.slide-builder/templates/viewer-template.html`

**Files to Modify:**
- `.slide-builder/workflows/build-one/instructions.md` - Add viewer generation step
- `.slide-builder/workflows/build-all/instructions.md` - Add viewer generation step

### Learnings from Previous Story

**From Story 8-1-output-folder-architecture (Status: done)**

- **Output Structure Established**: Slides are now saved to `output/{deck-slug}/slides/slide-N.html`
- **Slug Generation**: Uses lowercase, spaces→hyphens, remove special chars pattern
- **Status Tracking**: status.yaml now includes `deck_slug` and `output_folder` fields
- **Plan Copy**: plan.yaml is copied to output folder on first build
- **Workflow Pattern**: build-one and build-all both use output_root variable for output path

**Files Created/Modified by Story 8-1:**
- `.slide-builder/workflows/build-one/workflow.yaml` - Has output_root, deck_output_dir
- `.slide-builder/workflows/build-one/instructions.md` - Uses slug generation, outputs to output/
- `.slide-builder/workflows/build-all/workflow.yaml` - Has output_root, deck_output_dir
- `.slide-builder/workflows/build-all/instructions.md` - Uses slug generation, outputs to output/

**Key Pattern to Reuse:**
- Slug is stored in status.yaml as `deck_slug`
- Output path is `{project-root}/output/{deck_slug}/`
- Viewer should be generated at `{project-root}/output/{deck_slug}/index.html`

[Source: notes/sprint-artifacts/8-1-output-folder-architecture.md#Dev-Agent-Record]

### References

- [Source: notes/epics.md#Story-8.2] - Epic story definition
- [Source: notes/tech-spec.md#Story-2:-Core-Viewer-Component] - Technical specification
- [Source: .slide-builder/samples/index.html:106-147] - Gallery CSS and iframe thumbnail pattern

---

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/8-2-core-viewer-component.context.xml`

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

### Completion Notes List

1. Created viewer-template.html with gallery and presentation modes
2. Added Step 4B (viewer generation) to build-one workflow
3. Added Step 4B (viewer generation) to build-all workflow
4. Viewer uses iframe + scale(0.208) for 16:9 thumbnails
5. Keyboard navigation: ArrowLeft/Right, Space, Escape
6. Theme-matched styling: dark #0a0a0a bg, lime #d4e94c accents
7. Fixed presentation mode scaling with dynamic JS calculation
8. Added regenerate-viewer.js utility script

### Completion Notes
**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

**Created:**
- `.slide-builder/templates/viewer-template.html` - Gallery + presentation viewer template
- `scripts/regenerate-viewer.js` - Manual viewer regeneration script

**Modified:**
- `.slide-builder/workflows/build-one/instructions.md` - Added Step 4B for viewer generation
- `.slide-builder/workflows/build-all/instructions.md` - Added Step 4B for viewer generation

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story created from epic definition | Dev Agent |
| 2026-01-27 | Implemented Tasks 1-3: viewer template and workflow integration | Dev Agent |
| 2026-01-28 | Fixed presentation scaling, added regenerate script, Task 4 validated | Dev Agent |

---
