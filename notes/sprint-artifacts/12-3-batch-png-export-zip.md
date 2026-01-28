# Story 12.3: Batch PNG Export (ZIP)

**Status:** ready-for-dev

---

## User Story

As a presenter,
I want to download all slides as PNG images in a ZIP file,
So that I can archive the deck or use slides individually.

---

## Acceptance Criteria

**Given** I am viewing slides in presentation mode
**When** I click "Download All Slides (ZIP)" from the download menu
**Then** a progress modal appears

**And** the progress bar updates as each slide is processed (e.g., "Processing slide 3 of 14...")

**And** when complete, a ZIP file downloads automatically

**And** the ZIP file is named `{deckName}-slides.zip`

**And** the ZIP contains PNG files for each slide numbered sequentially (slide-1.png, slide-2.png, etc.)

**And** the progress modal dismisses after download

**And** this works with `file://` protocol

---

## Implementation Details

### Tasks / Subtasks

1. **Inline JSZip library**
   - [x] Download JSZip v3.10.1 minified (~45KB)
   - [x] Add to `<script>` section before application code
   - [x] Verify library loads correctly

2. **Add progress modal HTML/CSS**
   - [x] Modal overlay with dark semi-transparent background
   - [x] Centered card with title and progress bar
   - [x] Progress text showing current slide count
   - [x] CSS for `.progress-modal`, `.progress-bar`, `.progress-text`

3. **Implement progress modal functions**
   - [x] `showProgressModal(title)` - Show modal with title
   - [x] `updateProgress(current, total)` - Update bar and text
   - [x] `hideProgressModal()` - Hide modal

4. **Implement downloadAllSlidesPNG() function**
   - [x] Show progress modal with "Exporting slides..."
   - [x] Create new JSZip instance
   - [x] Loop through all slides sequentially
   - [x] For each slide: load in iframe, capture with html2canvas, add to zip
   - [x] Update progress after each slide
   - [x] Generate ZIP blob
   - [x] Trigger download
   - [x] Hide progress modal

5. **Wire up menu item**
   - [x] Connect "Download All Slides" menu item to function
   - [x] Close menu after selection

### Technical Summary

Use JSZip to bundle individual slide PNGs into a single downloadable ZIP file. Process slides sequentially (not parallel) to manage memory usage. Show a progress modal to indicate activity and provide feedback during the potentially lengthy batch operation.

### Project Structure Notes

- **Files to modify:** `.slide-builder/config/templates/viewer-template.html`
- **Expected test locations:** Manual browser testing with 14-slide deck
- **Estimated effort:** 2 story points
- **Prerequisites:** Story 12.1, 12.2 (uses captureSlide function)

### Key Code References

**Progress modal HTML:**
```html
<div id="progress-modal" class="progress-modal hidden">
    <div class="progress-modal-card">
        <h3 class="progress-title" id="progress-title">Exporting...</h3>
        <div class="progress-bar-container">
            <div class="progress-bar" id="progress-bar"></div>
        </div>
        <p class="progress-text" id="progress-text">Processing slide 1 of 14...</p>
    </div>
</div>
```

**Progress modal CSS:**
```css
.progress-modal {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 10, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.progress-modal.hidden {
    display: none;
}

.progress-modal-card {
    background: var(--amp-dark-alt);
    border: 1px solid var(--amp-mid-gray);
    padding: 40px;
    min-width: 400px;
    text-align: center;
}

.progress-bar-container {
    height: 8px;
    background: var(--amp-mid-gray);
    margin: 20px 0;
}

.progress-bar {
    height: 100%;
    background: var(--amp-lime);
    width: 0%;
    transition: width 0.2s ease;
}
```

**JSZip usage pattern:**
```javascript
async function downloadAllSlidesPNG() {
    showProgressModal('Exporting slides as PNG...');
    const zip = new JSZip();

    for (let i = 1; i <= totalSlides; i++) {
        updateProgress(i, totalSlides);

        // Navigate to slide
        await loadSlideInIframe(i);

        // Capture slide
        const blob = await captureSlideAsBlob(i);

        // Add to zip
        zip.file(`slide-${i}.png`, blob);
    }

    // Generate and download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${sanitizeFilename(deckName)}-slides.zip`);

    hideProgressModal();
}
```

**Sequential slide loading:**
```javascript
async function loadSlideInIframe(slideNumber) {
    const slide = slides[slideNumber - 1];
    const iframe = document.getElementById('presentation-iframe');

    return new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.src = `slides/${slide.filename}`;
    });
}
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- JSZip configuration details
- Progress calculation logic
- Memory management considerations
- Complete implementation guidance

**Architecture:** N/A - single file modification

---

## Dev Agent Record

### Context Reference

- [12-3-batch-png-export-zip.context.xml](./12-3-batch-png-export-zip.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**2026-01-28 - Implementation Plan:**
1. Download JSZip v3.10.1 from cdnjs and inline in viewer-template.html
2. Add progress modal HTML after presentation-view div (before script section)
3. Add progress modal CSS in the DOWNLOAD MENU section (line ~310)
4. Implement showProgressModal(), updateProgress(), hideProgressModal() functions
5. Create captureSlideForExport(slideIndex) adapting existing captureSlide() pattern
6. Replace downloadAllSlidesPNG() placeholder with full implementation
7. Menu item already wired - just needs the function to work
8. Regenerate viewer and test

### Completion Notes

- Implemented batch PNG export with ZIP bundling using JSZip v3.10.1
- Added progress modal (CSS + HTML) with animated progress bar
- Created captureSlideForExport() function that works with any slide index
- Full downloadAllSlidesPNG() implementation processes slides sequentially to manage memory
- Works with both file:// and http:// protocols using srcdoc fallback
- ZIP uses DEFLATE compression level 6 for good balance of size/speed
- **Bug fix:** Removed `transform: none !important;` from capture CSS to preserve layout transforms used for vertical centering

### Files Modified

- `.slide-builder/templates/viewer-template.html` - Added JSZip library, progress modal CSS/HTML, and batch export functions

### Test Results

**2026-01-28 - Bug Fix Validation:**
- Issue: Slide 3 PNG export was offset (content pushed to bottom half)
- Root cause: Capture CSS injected `transform: none !important;` which broke layout transforms (e.g., `translateY(-50%)` for vertical centering)
- Fix: Removed `transform: none !important;` from capture CSS in both `captureSlide()` and `captureSlideForExport()` functions
- Result: PASS - All slides now export with correct positioning

---

## Review Notes

<!-- Will be populated during code review -->
