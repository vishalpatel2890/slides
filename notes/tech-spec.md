# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick Flow
**Change Type:** Feature Addition
**Development Context:** Brownfield - Adding export functionality to existing slide viewer

---

## Context

### Available Documents

- Product briefs: None found
- Research documents: None found
- Brownfield documentation: None found (codebase analyzed directly)

### Project Stack

**Runtime:** Node.js (CommonJS modules)

**Dependencies (from package.json):**
- `puppeteer ^23.0.0` - Headless browser (not used for this feature)
- `googleapis ^140.0.0` - Google API integration

**Frontend:** Vanilla HTML/CSS/JavaScript
- No framework (React, Vue, etc.)
- No build tooling (Webpack, Vite, etc.)
- Single HTML file with inline CSS and JavaScript
- Slide dimensions: 1920x1080px (16:9 aspect ratio)

### Existing Codebase Structure

```
slide-builder/
├── .slide-builder/
│   └── config/
│       └── templates/
│           └── viewer-template.html    ← PRIMARY: Template for generated viewers
├── output/{deck-slug}/
│   ├── index.html                      ← Generated from template
│   └── slides/
│       ├── slide-N.html                ← Individual slide files
│       └── manifest.json               ← Slide metadata
└── scripts/
    ├── generate-manifest.js            ← Creates manifest.json
    └── regenerate-viewer.js            ← Rebuilds viewer from template
```

**Key File:** `.slide-builder/config/templates/viewer-template.html` (838 lines)
- Contains all viewer logic in single file
- Uses `{{PLACEHOLDERS}}` for build-time substitution
- Inline CSS (~415 lines of styles)
- Inline JavaScript (~370 lines of application logic)

---

## The Change

### Problem Statement

The slide viewer currently has no export functionality. Users need to download slides as images (PNG) and PDFs for sharing, offline use, and archival purposes. The viewer must support `file://` protocol for true offline capability - users often open the generated `index.html` directly from their filesystem without running a local server.

### Proposed Solution

Add a download dropdown menu to the presentation header with three export options:

1. **Download Current Slide as PNG** - Capture and download the currently displayed slide as a 1920x1080 PNG image
2. **Download All Slides as PNG (ZIP)** - Render all slides as PNGs and bundle into a downloadable ZIP file
3. **Download Deck as PDF** - Render all slides as PNGs and combine into a multi-page landscape PDF document

**Technical Approach:** Use browser-based rendering libraries (html2canvas, jsPDF, JSZip) inlined in the viewer template for true offline support.

### Scope

**In Scope:**

- Download dropdown menu button in presentation header (next to navigation controls)
- Single slide PNG export (current slide)
- Batch PNG export with ZIP bundling (all slides)
- PDF export with all slides as pages
- Progress modal with progress bar for batch operations
- Inline library bundling (html2canvas, jsPDF, JSZip minified)
- Full `file://` protocol support

**Out of Scope:**

- Gallery view download options (presentation mode only)
- Server-side rendering via Puppeteer
- Customizable export settings (resolution, format, compression)
- Cloud storage integration (Google Drive, Dropbox)
- Individual slide PDF downloads
- Selective slide export (choosing specific slides)
- Export from within iframes (we capture the parent container)

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `.slide-builder/config/templates/viewer-template.html` | MODIFY | Add download menu HTML, CSS, JavaScript, and inline libraries |

**Detailed Changes to `viewer-template.html`:**

1. **CSS Section (~line 200):** Add styles for:
   - `.download-btn` - Dropdown trigger button
   - `.download-menu` - Dropdown menu container
   - `.download-menu-item` - Menu item styling
   - `.progress-modal` - Export progress overlay
   - `.progress-bar` - Progress bar styling

2. **HTML Section (~line 443):** Add to `.presentation-controls`:
   - Download dropdown button with SVG icon
   - Dropdown menu with three export options
   - Progress modal overlay (hidden by default)

3. **JavaScript Section (~line 825):** Add new functions:
   - `toggleDownloadMenu()` - Show/hide dropdown
   - `downloadCurrentSlide()` - Single PNG export
   - `downloadAllSlidesPNG()` - ZIP of all PNGs
   - `downloadDeckPDF()` - PDF export
   - `showProgressModal(title)` - Show progress UI
   - `updateProgress(current, total)` - Update progress bar
   - `hideProgressModal()` - Hide progress UI
   - `captureSlide(slideNumber)` - Render slide to canvas

4. **Library Section (new, ~line 467):** Inline minified libraries:
   - html2canvas v1.4.1 (~175KB minified)
   - jsPDF v2.5.1 (~90KB minified)
   - JSZip v3.10.1 (~45KB minified)

### Technical Approach

**PNG Rendering Pipeline:**
```
iframe.contentDocument → html2canvas(slideElement) → canvas.toBlob('image/png') → download/store
```

1. Access slide content via `document.getElementById('presentation-iframe').contentDocument`
2. Use `html2canvas` to render the slide's `.slide` element to a canvas
3. Convert canvas to PNG blob via `canvas.toBlob()`
4. For single download: Create object URL and trigger download
5. For batch: Store blob in memory, add to JSZip, generate ZIP

**PDF Generation Pipeline:**
```
For each slide:
  captureSlide(n) → PNG blob → base64 → jsPDF.addImage()
jsPDF.save('deck.pdf')
```

1. Create jsPDF instance with landscape orientation (1920x1080 aspect)
2. Loop through all slides, capturing each as PNG
3. Add each PNG as a page in the PDF
4. Save the final PDF document

**Library Versions (Definitive):**
- html2canvas: v1.4.1 (latest stable as of Jan 2026)
- jsPDF: v2.5.1 (latest stable)
- JSZip: v3.10.1 (latest stable)

### Existing Patterns to Follow

**Code Style (from viewer-template.html):**
- Functions use camelCase: `renderGallery()`, `calculateScale()`, `goToSlide()`
- DOM queries use `document.getElementById()` and `document.querySelector()`
- Event handlers inline on HTML elements: `onclick="functionName()"`
- CSS variables for theming: `var(--amp-lime)`, `var(--amp-dark-alt)`
- Comment blocks with `═══` characters for section separators
- No semicolons at end of statements in existing JS (inconsistent - normalize to include)

**CSS Patterns:**
- Class naming: `.presentation-controls`, `.nav-btn`, `.slide-counter`
- Button hover states: `border-color` and `color` transitions
- Disabled states: `opacity: 0.3`, `cursor: not-allowed`
- Use existing CSS variables for colors

**HTML Patterns:**
- Button elements for interactive controls
- Inline `onclick` handlers
- SVG icons inline (not external files)

### Integration Points

**Internal Integration:**
- `slides` array (global) - Contains slide metadata for iteration
- `currentSlide` (global) - Index of currently displayed slide
- `totalSlides` (global) - Total slide count
- `deckName` (global) - Deck name for filenames
- Presentation iframe: `document.getElementById('presentation-iframe')`

**No External Integration Required:**
- Feature is entirely client-side
- No API calls needed
- No server-side components

---

## Development Context

### Relevant Existing Code

**Slide Navigation (viewer-template.html:711-730):**
```javascript
function nextSlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        updatePresentationSlide();
    }
}
```
Use similar pattern for iterating through slides during batch export.

**Presentation Controls HTML (viewer-template.html:439-444):**
```html
<div class="presentation-controls">
    <button class="nav-btn" id="prev-btn" onclick="prevSlide()">← Previous</button>
    <span class="slide-counter" id="slide-counter">1 / {{TOTAL_SLIDES}}</span>
    <button class="nav-btn" id="next-btn" onclick="nextSlide()">Next →</button>
    <button class="close-btn" onclick="exitToGallery()" title="Close (Esc)">×</button>
</div>
```
Add download button here, between next-btn and close-btn.

**Button Styling (viewer-template.html:202-220):**
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
```
Follow this pattern for download button styling.

### Dependencies

**Framework/Libraries (to be added inline):**

| Library | Version | Size (minified) | Purpose |
|---------|---------|-----------------|---------|
| html2canvas | 1.4.1 | ~175KB | HTML to canvas rendering |
| jsPDF | 2.5.1 | ~90KB | PDF document generation |
| JSZip | 3.10.1 | ~45KB | ZIP file creation |

Total addition: ~310KB to viewer template

**Internal Modules:**
- None (all code inline in template)

### Configuration Changes

None required - no external configuration files affected.

### Existing Conventions (Brownfield)

**Code Style:**
- Vanilla JavaScript (ES6+ features used: async/await, arrow functions, template literals)
- No TypeScript
- No module system (all functions global)
- Inline styles via CSS variables

**File Organization:**
- Single-file viewer template
- All CSS in `<style>` block
- All JavaScript in `<script>` block
- Libraries should be added before application code

**Error Handling:**
- Console logging for errors: `console.error('message')`
- Try/catch for async operations
- Graceful fallbacks where possible

### Test Framework & Standards

No automated testing framework in place. Testing will be manual.

---

## Implementation Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Browser (Chrome, Safari, Firefox) | Latest |
| Language | JavaScript (ES6+) | - |
| Rendering | html2canvas | 1.4.1 |
| PDF | jsPDF | 2.5.1 |
| ZIP | JSZip | 3.10.1 |
| Styling | CSS3 with CSS Variables | - |

---

## Technical Details

### html2canvas Configuration

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

**Key Options:**
- `width/height: 1920/1080` - Force exact slide dimensions
- `scale: 1` - 1:1 pixel ratio (no scaling)
- `useCORS: true` - Allow cross-origin images (fonts from Google)
- `allowTaint: true` - Allow tainted canvas for local fonts
- `backgroundColor: null` - Preserve slide's background

### jsPDF Configuration

```javascript
const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
    hotfixes: ['px_scaling']
});
```

**Key Options:**
- `orientation: 'landscape'` - Slides are wider than tall
- `unit: 'px'` - Use pixels for positioning
- `format: [1920, 1080]` - Custom page size matching slides
- `hotfixes: ['px_scaling']` - Fix pixel scaling issues

### File Naming Convention

- Single PNG: `{deckName}-slide-{N}.png` (e.g., "Claude-Code-Fundamentals-slide-3.png")
- ZIP file: `{deckName}-slides.zip`
- PDF file: `{deckName}.pdf`

### Cross-Origin Considerations

**iframe Content Access:**
Slides are loaded in iframes from `slides/slide-N.html`. For `file://` protocol, same-origin policy is strict. The iframe's `contentDocument` should be accessible since both parent and child are from same origin (local filesystem).

**External Resources:**
- Google Fonts loaded via `<link>` - html2canvas handles these
- SVG icons are inline - no cross-origin issues
- No external images in slides by default

### Progress Calculation

For batch operations:
```javascript
function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `Processing slide ${current} of ${total}...`;
}
```

### Memory Management

For large decks (20+ slides):
- Process slides sequentially (not parallel) to limit memory
- Release canvas blobs after adding to ZIP/PDF
- Show progress to indicate activity

---

## Development Setup

```bash
# Clone repo (if not already)
git clone <repo-url>
cd slide-builder

# Install dependencies (only needed if using npm scripts)
npm install

# No build step required - edit viewer-template.html directly

# Test changes:
# 1. Edit .slide-builder/config/templates/viewer-template.html
# 2. Regenerate a deck's viewer:
node scripts/regenerate-viewer.js claude-code-fundamentals

# 3. Open output/claude-code-fundamentals/index.html in browser
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch
2. Download minified library files:
   - https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
   - https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
   - https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
3. Open `.slide-builder/config/templates/viewer-template.html` for editing

### Implementation Steps

**Story 1: Download Menu UI**
1. Add CSS for download button, dropdown menu, and items (~line 220)
2. Add download button HTML to `.presentation-controls` (~line 443)
3. Add dropdown menu HTML (hidden by default)
4. Add `toggleDownloadMenu()` JavaScript function
5. Add click-outside handler to close menu
6. Add keyboard shortcut 'D' for download menu

**Story 2: Single Slide PNG Export**
1. Inline html2canvas library in `<script>` section
2. Implement `captureSlide(slideNumber)` helper function
3. Implement `downloadCurrentSlide()` function
4. Wire up menu item click handler
5. Test with various slide types

**Story 3: Batch PNG Export (ZIP)**
1. Inline JSZip library
2. Add progress modal HTML and CSS
3. Implement `showProgressModal()`, `updateProgress()`, `hideProgressModal()`
4. Implement `downloadAllSlidesPNG()` function
5. Test with 14-slide deck

**Story 4: PDF Export**
1. Inline jsPDF library
2. Implement `downloadDeckPDF()` function
3. Wire up menu item click handler
4. Test PDF output quality and page breaks
5. Verify file size is reasonable

### Testing Strategy

**Manual Testing Checklist:**

1. **file:// Protocol:**
   - Open `index.html` directly in browser (not via server)
   - Verify download menu appears and functions
   - Verify PNG download works
   - Verify ZIP download works
   - Verify PDF download works

2. **Server Protocol:**
   - Serve via `python3 -m http.server`
   - Verify all functionality works

3. **Cross-Browser:**
   - Chrome (primary)
   - Safari
   - Firefox

4. **Export Quality:**
   - PNG is 1920x1080 pixels
   - PNG captures all slide elements (text, SVGs, backgrounds)
   - PDF pages are correct size
   - PDF text/images are crisp

5. **Large Deck:**
   - Test with 20+ slides
   - Verify progress bar updates
   - Verify no memory crashes
   - Verify reasonable export time

### Acceptance Criteria

**Story 1 - Download Menu UI:**
- [ ] Download button visible in presentation header
- [ ] Dropdown menu opens on click
- [ ] Menu shows three options with icons
- [ ] Menu closes when clicking outside
- [ ] Keyboard shortcut 'D' opens menu
- [ ] Styling matches existing nav buttons

**Story 2 - Single PNG Export:**
- [ ] Clicking "Download Current Slide" triggers download
- [ ] Downloaded PNG is named `{deckName}-slide-{N}.png`
- [ ] PNG dimensions are 1920x1080
- [ ] PNG accurately captures slide content
- [ ] Works with `file://` protocol

**Story 3 - Batch PNG Export:**
- [ ] Clicking "Download All as PNG" shows progress modal
- [ ] Progress bar updates as slides are processed
- [ ] ZIP file downloads when complete
- [ ] ZIP contains all slides as numbered PNGs
- [ ] Modal dismisses after download
- [ ] Works with `file://` protocol

**Story 4 - PDF Export:**
- [ ] Clicking "Download as PDF" shows progress modal
- [ ] Progress bar updates during generation
- [ ] PDF file downloads when complete
- [ ] PDF contains all slides as pages
- [ ] PDF pages are landscape 1920x1080
- [ ] PDF file size is reasonable (<50MB for 14 slides)
- [ ] Works with `file://` protocol

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `.slide-builder/config/templates/viewer-template.html` | Main template (modify this) |
| `output/claude-code-fundamentals/index.html` | Generated viewer (for testing) |
| `scripts/regenerate-viewer.js` | Regenerates viewer from template |

### Key Code Locations

| Function/Element | Location |
|-----------------|----------|
| CSS styles | viewer-template.html:10-415 |
| Gallery view HTML | viewer-template.html:421-431 |
| Presentation view HTML | viewer-template.html:436-465 |
| Presentation controls | viewer-template.html:439-444 |
| JavaScript functions | viewer-template.html:467-836 |
| Keyboard handlers | viewer-template.html:770-825 |

### Testing Locations

No automated tests. Manual testing via:
1. Open `output/claude-code-fundamentals/index.html` in browser
2. Enter presentation mode
3. Test download menu functionality

### Documentation to Update

None required - this is an internal tool.

---

## UX/UI Considerations

### UI Components Affected

**New Components:**
- Download dropdown button (styled like existing nav buttons)
- Dropdown menu (3 items with icons)
- Progress modal overlay
- Progress bar

**Existing Components Modified:**
- `.presentation-controls` div - Add download button

### UX Flow

**Current Flow:**
1. User views slides
2. No export option available

**New Flow:**
1. User views slides
2. User clicks "Download" button in header
3. Dropdown shows three options
4. User selects export type
5. For batch: Progress modal appears
6. File downloads automatically
7. Modal dismisses (batch) or immediate download (single)

### Visual Design

**Download Button:**
- Same size as close button (36x36px)
- Download icon (↓ arrow with line)
- Same border/hover styling as nav buttons

**Dropdown Menu:**
- Dark background (`var(--amp-dark-alt)`)
- Border: `1px solid var(--amp-mid-gray)`
- Items with icons on left
- Hover state: lime accent color

**Progress Modal:**
- Semi-transparent dark overlay
- Centered white card
- Title: "Exporting..." or "Generating PDF..."
- Progress bar with lime fill
- Slide count text below

### Accessibility

- Download button has `title` attribute for tooltip
- Dropdown menu is keyboard navigable
- Progress modal is not dismissible during export (intentional)
- Color contrast meets WCAG AA

---

## Testing Approach

### Manual Testing Protocol

Since no test framework exists, follow this manual testing checklist:

**Pre-Testing:**
1. Regenerate viewer: `node scripts/regenerate-viewer.js claude-code-fundamentals`
2. Clear browser cache
3. Open DevTools console for error monitoring

**Test Matrix:**

| Test | Chrome | Safari | Firefox |
|------|--------|--------|---------|
| Menu opens/closes | | | |
| Single PNG (file://) | | | |
| Single PNG (http://) | | | |
| ZIP export (file://) | | | |
| ZIP export (http://) | | | |
| PDF export (file://) | | | |
| PDF export (http://) | | | |
| Progress bar works | | | |
| Large deck (14 slides) | | | |

**Quality Verification:**
1. Open downloaded PNG in image viewer - verify 1920x1080
2. Unzip ZIP file - verify all slides present
3. Open PDF - verify all pages, quality, file size

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. Regenerate all existing deck viewers:
   ```bash
   node scripts/regenerate-viewer.js claude-code-fundamentals
   # Repeat for other decks
   ```
3. Commit regenerated viewers
4. Deploy updated decks to hosting (if applicable)

### Rollback Plan

1. Revert commit on main branch
2. Regenerate viewers to restore previous template
3. Redeploy

### Monitoring

No server-side monitoring needed - purely client-side feature.

**User Feedback Channels:**
- Direct user reports
- Browser console errors (users can share screenshots)
