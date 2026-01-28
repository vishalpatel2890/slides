# Story 8.2: Core Viewer Component

**Status:** Draft

---

## User Story

As a **slide builder user**,
I want **an auto-generated viewer that shows all slides in gallery and presentation modes**,
So that **I can see all slides at a glance and present them sequentially**.

---

## Acceptance Criteria

**Given** slides exist in `output/{deck-slug}/slides/`
**When** I open `output/{deck-slug}/index.html`
**Then** I see a gallery grid of all slide thumbnails

**And** clicking a thumbnail enters presentation mode showing that slide
**And** prev/next buttons navigate between slides
**And** a close button returns to gallery view
**And** the viewer is auto-regenerated after each slide build

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1: Create viewer template**
  - Create `.slide-builder/templates/viewer-template.html`
  - Include gallery view (CSS Grid of thumbnails)
  - Include presentation view (single slide display)
  - Use theme.json colors for styling

- [ ] **Task 2: Implement gallery view**
  - CSS Grid layout with auto-fit, minmax(400px)
  - iframe per slide with transform: scale(0.208) for thumbnails
  - Slide number overlay on each thumbnail
  - Click handler to enter presentation mode

- [ ] **Task 3: Implement presentation mode**
  - Single iframe at viewport size
  - Navigation buttons (prev/next/close)
  - Slide counter display ("3 of 10")
  - Close button returns to gallery

- [ ] **Task 4: Add viewer generation to build-one**
  - Edit `.slide-builder/workflows/build-one/instructions.md`
  - After slide build, scan output folder for slide-*.html
  - Sort numerically (slide-1, slide-2, ...)
  - Generate index.html from template with slide list

- [ ] **Task 5: Add viewer generation to build-all**
  - Edit `.slide-builder/workflows/build-all/instructions.md`
  - Generate viewer after all slides are built

- [ ] **Task 6: Test viewer generation**
  - Build slide with existing deck
  - Verify index.html created
  - Open in browser, test gallery and presentation

### Technical Summary

This story creates a unified viewer that displays all deck slides. The viewer has two modes:

1. **Gallery Mode (default):** Grid of thumbnail previews using iframes with CSS transform scaling
2. **Presentation Mode:** Single slide displayed at viewport size with navigation

**Viewer Architecture:**
```html
<div id="viewer">
  <!-- Gallery View -->
  <div id="gallery-view">
    <div class="thumbnail-grid">
      <!-- Generated: one card per slide -->
      <div class="slide-card" data-slide="1">
        <div class="preview">
          <iframe src="slides/slide-1.html"></iframe>
        </div>
        <div class="label">Slide 1</div>
      </div>
    </div>
  </div>

  <!-- Presentation View (hidden by default) -->
  <div id="presentation-view" class="hidden">
    <div class="slide-container">
      <iframe id="current-slide" src=""></iframe>
    </div>
    <div class="controls">
      <button id="prev-btn">← Prev</button>
      <span id="slide-counter">1 of 10</span>
      <button id="next-btn">Next →</button>
      <button id="close-btn">✕</button>
    </div>
  </div>
</div>
```

**Slide Discovery Logic:**
```javascript
// Scan for slides and sort numerically
const slides = fs.readdirSync(slidesDir)
  .filter(f => f.match(/^slide-\d+\.html$/))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });
```

**Thumbnail Scaling (from samples/index.html pattern):**
```css
.preview iframe {
  width: 480%;
  height: 480%;
  border: none;
  pointer-events: none;
  transform: scale(0.208);
  transform-origin: top left;
}
```

### Project Structure Notes

- **Files to create:**
  - `.slide-builder/templates/viewer-template.html`

- **Files to modify:**
  - `.slide-builder/workflows/build-one/instructions.md`
  - `.slide-builder/workflows/build-all/instructions.md`

- **Expected test locations:** Manual browser testing of `output/{deck-slug}/index.html`
- **Prerequisites:** Story 8.1 (Output Folder Architecture)

### Key Code References

| Reference | Location | Pattern |
|-----------|----------|---------|
| Gallery CSS Grid | `.slide-builder/samples/index.html:106-112` | grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)) |
| Iframe thumbnails | `.slide-builder/samples/index.html:140-147` | transform: scale(0.208) |
| Theme colors | `.slide-builder/theme.json` | colors.background.dark: "#0a0a0a" |

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow (samples/index.html)
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** Pure HTML/CSS/JS viewer (matches existing slide approach)

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
