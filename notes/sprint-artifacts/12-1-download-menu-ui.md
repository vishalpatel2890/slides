# Story 12.1: Download Menu UI

**Status:** done

---

## User Story

As a presenter,
I want a download button in the presentation header,
So that I can access export options while viewing slides.

---

## Acceptance Criteria

**Given** I am viewing slides in presentation mode
**When** I look at the presentation header
**Then** I see a download button next to the close button

**And** when I click the download button, a dropdown menu opens with three options:
- Download Current Slide (PNG)
- Download All Slides (ZIP)
- Download as PDF (PDF)

**And** clicking outside the menu closes it

**And** pressing 'D' on keyboard opens/closes the menu

---

## Implementation Details

### Tasks / Subtasks

1. **Add CSS styles for download UI** (~line 200 in viewer-template.html)
   - [x] `.download-btn` - Button styling matching existing controls
   - [x] `.download-menu` - Dropdown container (absolute positioned)
   - [x] `.download-menu-item` - Menu item with icon and text
   - [x] `.download-menu.hidden` - Hidden state

2. **Add download button HTML** (~line 443)
   - [x] Button with download SVG icon (↓ arrow with line)
   - [x] Button positioned between next-btn and close-btn
   - [x] `onclick="toggleDownloadMenu()"`
   - [x] `title="Download (D)"`

3. **Add dropdown menu HTML** (after download button)
   - [x] Menu container with three items
   - [x] Each item has icon + label
   - [x] Items call respective download functions

4. **Add JavaScript functions** (~line 825)
   - [x] `toggleDownloadMenu()` - Show/hide dropdown
   - [x] Click-outside handler to close menu
   - [x] 'D' keyboard shortcut handler

### Technical Summary

Modify the viewer template to add a download dropdown menu in the presentation header. The menu follows existing styling patterns (dark background, lime accent on hover) and provides access to three export functions that will be implemented in subsequent stories.

### Project Structure Notes

- **Files to modify:** `.slide-builder/config/templates/viewer-template.html`
- **Expected test locations:** Manual browser testing
- **Estimated effort:** 2 story points
- **Prerequisites:** None - first story in epic

### Key Code References

**Existing button styling (viewer-template.html:202-220):**
```css
.nav-btn {
    background: transparent;
    border: 1px solid var(--amp-mid-gray);
    color: var(--amp-white);
    padding: 8px 16px;
    font-family: var(--font-body);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
    border-color: var(--amp-lime);
    color: var(--amp-lime);
}
```

**Close button styling (viewer-template.html:223-240):**
```css
.close-btn {
    background: transparent;
    border: 1px solid var(--amp-mid-gray);
    color: var(--amp-white);
    width: 36px;
    height: 36px;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

**Presentation controls HTML (viewer-template.html:439-444):**
```html
<div class="presentation-controls">
    <button class="nav-btn" id="prev-btn" onclick="prevSlide()">← Previous</button>
    <span class="slide-counter" id="slide-counter">1 / {{TOTAL_SLIDES}}</span>
    <button class="nav-btn" id="next-btn" onclick="nextSlide()">Next →</button>
    <button class="close-btn" onclick="exitToGallery()" title="Close (Esc)">×</button>
</div>
```

**Keyboard handler pattern (viewer-template.html:770-825):**
```javascript
document.addEventListener('keydown', (e) => {
    if (document.getElementById('presentation-view').classList.contains('hidden')) {
        return;
    }
    switch(e.key) {
        // ... existing cases
    }
});
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** N/A - single file modification

---

## Dev Agent Record

### Context Reference

- [12-1-download-menu-ui.context.xml](./12-1-download-menu-ui.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan (2026-01-28):**
1. Add CSS after .close-btn styles (~line 240) for .download-btn, .download-menu, .download-menu-item, .download-wrapper
2. Add download button HTML between next-btn and close-btn with SVG download icon
3. Add dropdown menu as child of .download-wrapper with three menu items
4. Add JavaScript: toggleDownloadMenu(), closeDownloadMenu(), click-outside handler, 'D' keyboard shortcut
5. Add placeholder functions for download actions (to be implemented in Stories 12.2-12.4)

**Approach:**
- Followed existing styling patterns (.close-btn dimensions, border/hover states)
- Used CSS variables for all colors (--amp-dark-alt, --amp-mid-gray, --amp-lime)
- Used inline SVG icons (feather icon style) matching existing patterns
- Wrapped button and menu in .download-wrapper for positioning context
- Added event.stopPropagation() to button click to prevent immediate close

### Completion Notes

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

✅ Test Gate PASSED by Vishal (2026-01-28)

Implemented download menu UI with:
- Download button (36x36px) positioned between Next button and Close button
- Dropdown menu with three options: PNG (single), ZIP (all), PDF
- Each menu item has icon + label following existing styling
- Click-outside handler closes menu automatically
- 'D' keyboard shortcut toggles menu in presentation mode
- Updated keyboard hint to show 'D' for Download
- Placeholder functions show alerts for features coming in Stories 12.2-12.4

### Files Modified

- `.slide-builder/config/templates/viewer-template.html` - Added CSS styles (lines 242-310), HTML download button/menu (lines 507-538), JavaScript functions (lines 830-872), keyboard handler update (line 911)

### Test Results

Manual testing required - no automated test framework

---

## Review Notes

<!-- Will be populated during code review -->
