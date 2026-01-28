# Story 8.3: Presentation Mode Polish

**Status:** Draft

---

## User Story

As a **slide builder user**,
I want **enhanced presentation mode with sidebar, keyboard nav, and smooth transitions**,
So that **I have a polished, professional presentation experience**.

---

## Acceptance Criteria

**Given** I am in presentation mode
**When** I press ArrowRight
**Then** the next slide displays with a smooth transition

**And** a thumbnail sidebar shows all slides with the current one highlighted
**And** clicking a sidebar thumbnail jumps to that slide
**And** Escape returns to gallery
**And** F toggles fullscreen
**And** number keys 1-9 jump to that slide
**And** Home/End go to first/last slide

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1: Add thumbnail sidebar**
  - Fixed left sidebar (200px width)
  - Vertical list of mini-thumbnails
  - Active slide highlighted with accent color
  - Click to jump to slide

- [ ] **Task 2: Implement full keyboard navigation**
  - ArrowLeft/ArrowRight: prev/next slide
  - ArrowUp/ArrowDown: same as left/right
  - Escape: exit to gallery
  - F: toggle fullscreen
  - Home: go to first slide
  - End: go to last slide
  - Number keys 1-9: jump to slide N

- [ ] **Task 3: Add CSS transitions**
  - Fade transition on slide change (opacity)
  - Smooth highlight transition on sidebar
  - Optional: slide direction animation

- [ ] **Task 4: Implement fullscreen support**
  - F key or button to toggle
  - Use Fullscreen API
  - Graceful fallback for unsupported browsers

- [ ] **Task 5: Polish styling to match theme**
  - Dark background (#0a0a0a)
  - Lime accent (#d4e94c) for active states
  - Teal (#4ecdc4) for secondary highlights
  - Outfit font family
  - Sharp corners (0px border-radius)

- [ ] **Task 6: Add progress indicator**
  - Visual progress bar at bottom
  - Or dot indicators for slide position

### Technical Summary

This story enhances the presentation mode with professional-grade navigation and polish:

**Thumbnail Sidebar:**
```html
<div id="sidebar">
  <div class="sidebar-thumb active" data-slide="1">
    <iframe src="slides/slide-1.html"></iframe>
    <span class="num">1</span>
  </div>
  <div class="sidebar-thumb" data-slide="2">
    <iframe src="slides/slide-2.html"></iframe>
    <span class="num">2</span>
  </div>
  <!-- ... -->
</div>
```

**Keyboard Event Handling:**
```javascript
document.addEventListener('keydown', (e) => {
  if (viewerState.mode !== 'presentation') return;

  switch(e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextSlide();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      prevSlide();
      break;
    case 'Escape':
      exitToGallery();
      break;
    case 'f':
    case 'F':
      toggleFullscreen();
      break;
    case 'Home':
      goToSlide(1);
      break;
    case 'End':
      goToSlide(viewerState.totalSlides);
      break;
    default:
      if (e.key >= '1' && e.key <= '9') {
        goToSlide(parseInt(e.key));
      }
  }
});
```

**Fullscreen API:**
```javascript
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Fullscreen not supported:', err);
    });
  } else {
    document.exitFullscreen();
  }
}
```

**Transition CSS:**
```css
#current-slide {
  transition: opacity 0.3s ease-in-out;
}

.slide-changing {
  opacity: 0;
}

.sidebar-thumb {
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.sidebar-thumb.active {
  border-color: #d4e94c;
  transform: scale(1.05);
}
```

**Theme Integration:**
```css
:root {
  --bg-dark: #0a0a0a;
  --bg-dark-alt: #1a1a1a;
  --accent-lime: #d4e94c;
  --accent-teal: #4ecdc4;
  --text-white: #ffffff;
  --text-muted: #888888;
  --font-family: 'Outfit', system-ui, sans-serif;
}
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/templates/viewer-template.html`

- **Expected test locations:** Manual browser testing
- **Prerequisites:** Story 8.2 (Core Viewer Component)

### Key Code References

| Reference | Location | Pattern |
|-----------|----------|---------|
| Theme colors | `.slide-builder/theme.json` | colors section |
| Slide styling | `.slide-builder/deck/slides/slide-1.html` | CSS variables |
| Gallery pattern | `.slide-builder/samples/index.html` | Card hover effects |

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** Pure HTML/CSS/JS with theme.json integration

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
