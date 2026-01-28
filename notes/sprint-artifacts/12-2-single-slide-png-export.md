# Story 12.2: Single Slide PNG Export

**Status:** done

---

## User Story

As a presenter,
I want to download the current slide as a PNG image,
So that I can share it in documents or emails.

---

## Acceptance Criteria

**Given** I am viewing a slide in presentation mode
**When** I click "Download Current Slide" from the download menu
**Then** a PNG file downloads automatically

**And** the filename is `{deckName}-slide-{N}.png` (e.g., "Claude-Code-Fundamentals-slide-3.png")

**And** the PNG dimensions are exactly 1920x1080 pixels

**And** the PNG accurately captures all slide content (text, SVGs, backgrounds, gradients)

**And** this works with `file://` protocol (opening index.html directly)

---

## Implementation Details

### Tasks / Subtasks

1. **Inline html2canvas library**
   - [x] Download html2canvas v1.4.1 minified (~175KB)
   - [x] Add to `<script>` section before application code
   - [x] Verify library loads correctly

2. **Implement captureSlide() helper function**
   - [x] Get iframe contentDocument
   - [x] Find `.slide` element in iframe
   - [x] Configure html2canvas options for 1920x1080
   - [x] Return canvas element or PNG blob

3. **Implement downloadCurrentSlide() function**
   - [x] Call captureSlide(currentSlide)
   - [x] Convert canvas to PNG blob
   - [x] Create object URL for download
   - [x] Generate filename with deck name and slide number
   - [x] Trigger download via hidden anchor click
   - [x] Revoke object URL after download

4. **Wire up menu item**
   - [x] Connect "Download Current Slide" menu item to function
   - [x] Close menu after selection

### Technical Summary

Use html2canvas to render the current slide's DOM to a canvas element, then convert to PNG blob for download. The library is inlined in the viewer template for offline support. Key challenge is accessing the iframe's contentDocument while maintaining cross-origin compatibility (same origin for file:// protocol).

### Project Structure Notes

- **Files to modify:** `.slide-builder/config/templates/viewer-template.html`
- **Expected test locations:** Manual browser testing with various slide types
- **Estimated effort:** 2 story points
- **Prerequisites:** Story 12.1 (Download Menu UI)

### Key Code References

**html2canvas configuration:**
```javascript
const canvas = await html2canvas(slideElement, {
    width: 1920,
    height: 1080,
    scale: 1,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false
});
```

**Download trigger pattern:**
```javascript
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

**Accessing iframe content:**
```javascript
const iframe = document.getElementById('presentation-iframe');
const slideDoc = iframe.contentDocument || iframe.contentWindow.document;
const slideElement = slideDoc.querySelector('.slide');
```

**Filename sanitization:**
```javascript
function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
}
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- html2canvas configuration details
- File naming conventions
- Cross-origin considerations
- Complete implementation guidance

**Architecture:** N/A - single file modification

---

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/12-2-single-slide-png-export.context.xml`

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**2026-01-28 - Implementation Plan:**
1. Fetch html2canvas v1.4.1 from cdnjs and inline in viewer-template.html
2. Add captureSlide() async helper to access iframe content and render to canvas
3. Replace downloadCurrentSlide() placeholder with full implementation
4. Menu item already wired up from Story 12.1 - just needs working function

**Key constraints:**
- Must work with file:// protocol (no external fetch for libs)
- PNG must be exactly 1920x1080
- Use existing global vars: deckName, currentSlide

### Completion Notes

**Implementation completed 2026-01-28:**
- Inlined html2canvas v1.4.1 library (~198KB) into viewer-template.html for file:// protocol support
- Added `sanitizeFilename()` helper for safe filename generation
- Added `downloadBlob()` helper for triggering browser downloads
- Added `captureSlide()` async function using html2canvas with 1920x1080 configuration
- Replaced placeholder `downloadCurrentSlide()` with full implementation
- Menu item was already wired up from Story 12.1 - just needed working function

**Key implementation decisions:**
- Library inlined as script tag rather than external fetch for offline support
- Using canvas.toBlob() callback pattern for PNG conversion
- Filename format: `{sanitized-deck-name}-slide-{N}.png`
- Error handling with try/catch and user alerts

### Files Modified

- `.slide-builder/config/templates/viewer-template.html` - Added html2canvas library inline, captureSlide(), downloadBlob(), sanitizeFilename(), replaced downloadCurrentSlide() placeholder

### Test Results

| AC | Status | Notes |
|----|--------|-------|
| AC1 | PASS | PNG downloads on menu click |
| AC2 | PASS | Filename format `{deckName}-slide-{N}.png` |
| AC3 | PASS | 1920x1080 dimensions verified |
| AC4 | PASS | All content renders (text, SVGs, backgrounds, animated elements) |
| AC5 | PASS | Works on file:// protocol via srcdoc/base64 fallback |

**Debug fix applied 2026-01-28:** Enhanced capture CSS injection to include `transform: none !important` - resolves animated elements being positioned off-canvas during capture due to `translateY()` initial state.

---

## Review Notes

<!-- Will be populated during code review -->
