# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick-Flow
**Change Type:** Enhancement
**Development Context:** Brownfield

---

## Context

### Available Documents

No formal documents - direct code analysis. Key files: `viewer-template.html`, `regenerate-viewer.js`, and sample `index.html`.

### Project Stack

- **Runtime:** Node.js CommonJS
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Dependencies:** puppeteer@23.0.0, googleapis@140.0.0
- **Test Framework:** None configured

### Existing Codebase Structure

```
.slide-builder/templates/viewer-template.html  ← Generation template
scripts/regenerate-viewer.js                   ← Manual regeneration
output/{deck-slug}/index.html                  ← Static viewer (problem)
output/{deck-slug}/slides/slide-N.html         ← Individual slides
output/{deck-slug}/plan.yaml                   ← Deck metadata
```

---

## The Change

### Problem Statement

The presentation viewer (`index.html`) has slide data statically embedded at build time. When slides are added, modified, or removed in the `slides/` folder, the viewer doesn't reflect these changes until manually regenerated via `node scripts/regenerate-viewer.js` or agent workflow. This creates friction during iterative slide development.

### Proposed Solution

Implement a manifest-based dynamic loading system:
1. Create `slides/manifest.json` containing slide metadata (number, filename, title)
2. Modify `index.html` to fetch this manifest on page load instead of using embedded data
3. Add cache-busting query parameters to iframe URLs for guaranteed fresh content
4. Update `regenerate-viewer.js` to generate manifest alongside viewer
5. Provide utility to generate manifest from existing slides folder

### Scope

**In Scope:**

- Create new `manifest.json` file format and initial generation
- Modify `viewer-template.html` to fetch manifest dynamically
- Add cache-busting to all iframe src assignments
- Update `regenerate-viewer.js` to generate manifest alongside viewer
- Provide utility to generate manifest from existing slides folder

**Out of Scope:**

- Auto-watching for file changes (requires background process)
- Server-side components (must work with `file://` protocol)
- Changes to individual slide HTML structure
- Changes to slide-building agent workflows (separate story if needed)

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `.slide-builder/templates/viewer-template.html` | MODIFY | Replace static slide data with dynamic manifest fetch, add cache-busting |
| `scripts/regenerate-viewer.js` | MODIFY | Generate `manifest.json` in slides folder alongside viewer regeneration |
| `scripts/generate-manifest.js` | CREATE | Standalone utility to generate manifest from existing slides folder |
| `output/claude-code-fundamentals/slides/manifest.json` | CREATE | Initial manifest for existing deck |

### Technical Approach

**Manifest File Format (`slides/manifest.json`):**
```json
{
  "deckName": "Claude Code Fundamentals",
  "generatedAt": "2026-01-28T12:00:00.000Z",
  "slides": [
    {"number": 1, "filename": "slide-1.html", "title": "Claude Code Fundamentals"},
    {"number": 2, "filename": "slide-2.html", "title": "The AI Evolution"}
  ]
}
```

**Dynamic Loading Strategy:**
1. On `DOMContentLoaded`, fetch `slides/manifest.json`
2. Parse response and populate `slides` array
3. Update `deckName` and `totalSlides` from manifest
4. Render gallery with fetched data
5. Handle fetch errors gracefully (show error message if manifest missing)

**Cache-Busting Implementation:**
```javascript
const cacheBuster = `?t=${Date.now()}`;
iframe.src = `slides/${slide.filename}${cacheBuster}`;
```

Apply cache-busting to:
- Gallery preview iframes (in `renderGallery()`)
- Presentation iframe (in `updatePresentationSlide()`)

### Existing Patterns to Follow

Follow patterns established in `regenerate-viewer.js`:
- Use `fs.readFileSync` / `fs.writeFileSync` for file operations
- Use `path.join()` for cross-platform path construction
- Extract titles using regex from slide HTML content
- Sort slides by numeric value extracted from filename

Follow patterns in `viewer-template.html`:
- Vanilla JavaScript, no external dependencies
- ES6 features (const, let, arrow functions, template literals)
- 4-space indentation
- Single quotes for strings in JavaScript
- CSS custom properties for theming

### Integration Points

**Internal Dependencies:**
- `slides/manifest.json` must exist for viewer to function
- `plan.yaml` used as fallback for deck name if manifest missing deckName

**Filesystem Structure:**
- Manifest lives in `slides/` folder alongside slide HTML files
- Viewer (`index.html`) fetches manifest via relative path `slides/manifest.json`

---

## Development Context

### Relevant Existing Code

**Title Extraction (regenerate-viewer.js:26-36):**
```javascript
function extractTitle(htmlContent, slideNum) {
    const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();
    const titleMatch = htmlContent.match(/<title>Slide \d+:\s*([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();
    return `Slide ${slideNum}`;
}
```

**Slide Discovery (regenerate-viewer.js:76-82):**
```javascript
const slideFiles = fs.readdirSync(slidesFolder)
    .filter(f => /^slide-\d+\.html$/.test(f))
    .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
    });
```

**Gallery Rendering (viewer-template.html:347-366):**
```javascript
function renderGallery() {
    const grid = document.getElementById('slide-grid');
    grid.innerHTML = '';
    slides.forEach((slide, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => enterPresentation(index + 1);
        card.innerHTML = `
            <div class="card-preview">
                <iframe src="slides/${slide.filename}" loading="lazy"></iframe>
            </div>
            ...
        `;
        grid.appendChild(card);
    });
}
```

### Dependencies

**Framework/Libraries:**
- Node.js (runtime for scripts)
- fs (built-in, file operations)
- path (built-in, path handling)
- No browser-side dependencies (vanilla JS)

**Internal Modules:**
- None - self-contained scripts

### Configuration Changes

None required. Manifest is auto-discovered by convention (`slides/manifest.json`).

### Existing Conventions (Brownfield)

- **Semicolons:** Yes
- **Quotes:** Single quotes in JS
- **Indentation:** 4 spaces
- **Naming:** kebab-case for files, camelCase for JS variables
- **Error handling:** Console logging with process.exit(1) for scripts

### Test Framework & Standards

No test framework configured. Manual testing via browser.

---

## Implementation Stack

- **Runtime:** Node.js (scripts)
- **Browser:** Vanilla HTML/CSS/JavaScript
- **File Format:** JSON for manifest
- **Protocol Support:** `file://` (no server required)

---

## Technical Details

**Error Handling Strategy:**

1. **Manifest fetch fails:** Display user-friendly error in gallery area
2. **Empty manifest:** Show "No slides found" message
3. **Malformed JSON:** Catch parse error, display message

**Browser Compatibility:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses `fetch()` API (ES6+)
- Uses template literals, arrow functions, const/let

**Performance Considerations:**
- Manifest is small JSON file (< 5KB typically)
- Cache-busting adds minimal overhead (query string only)
- Lazy loading retained for gallery thumbnails (`loading="lazy"`)

**Edge Cases:**
- Slides numbered non-sequentially (e.g., 1, 2, 5) - handled by sort
- Slides with special characters in title - JSON encoding handles this
- Very long deck names - CSS handles truncation

---

## Development Setup

```bash
# No special setup needed - vanilla Node.js project

# Clone repo (if not already)
git clone <repo-url>
cd slide-builder

# Install dependencies (only needed for export features)
npm install

# Run manifest generation
node scripts/generate-manifest.js claude-code-fundamentals

# Open viewer
open output/claude-code-fundamentals/index.html
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/dynamic-viewer`
2. Verify existing viewer works: `open output/claude-code-fundamentals/index.html`
3. Review current `viewer-template.html` structure

### Implementation Steps

**Phase 1: Create Manifest Generator Script**
1. Create `scripts/generate-manifest.js`
2. Implement slide discovery (reuse logic from regenerate-viewer.js)
3. Implement title extraction (reuse logic from regenerate-viewer.js)
4. Write manifest.json to slides folder
5. Test: `node scripts/generate-manifest.js claude-code-fundamentals`

**Phase 2: Update Viewer Template**
1. Remove static `{{SLIDE_LIST}}` injection
2. Add `loadManifest()` async function
3. Update `DOMContentLoaded` to call `loadManifest()` then `renderGallery()`
4. Add error handling UI for failed manifest load
5. Add cache-busting to `renderGallery()` iframe src
6. Add cache-busting to `updatePresentationSlide()` iframe src

**Phase 3: Update Regenerate Script**
1. Modify `regenerate-viewer.js` to also generate manifest.json
2. Ensure manifest is written before viewer template population
3. Keep template variables for deck name and total slides (dynamically updated)

**Phase 4: Generate Initial Manifest**
1. Run generator for existing deck
2. Verify viewer loads correctly with dynamic data

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Open index.html via file:// - slides load from manifest
- [ ] Add new slide HTML to slides/ folder, update manifest, refresh - new slide appears
- [ ] Edit slide content, refresh viewer - updated content shows (cache-busting)
- [ ] Delete manifest.json, refresh - error message displays gracefully
- [ ] Test keyboard navigation in presentation mode
- [ ] Test gallery click to enter presentation
- [ ] Verify slide counter updates correctly

### Acceptance Criteria

1. **Given** a valid `slides/manifest.json` exists, **when** `index.html` is opened via `file://`, **then** all slides from manifest are displayed in gallery
2. **Given** a slide HTML file is modified, **when** the viewer is refreshed, **then** the updated content is displayed (no stale cache)
3. **Given** no manifest exists, **when** `index.html` is opened, **then** a user-friendly error message is displayed
4. **Given** `regenerate-viewer.js` is run, **when** it completes, **then** both `index.html` and `slides/manifest.json` are created/updated
5. **Given** `generate-manifest.js` is run with a deck slug, **when** it completes, **then** `manifest.json` is created in the slides folder

---

## Developer Resources

### File Paths Reference

- `.slide-builder/templates/viewer-template.html` - Template to modify
- `scripts/regenerate-viewer.js` - Existing script to update
- `scripts/generate-manifest.js` - New script to create
- `output/{deck-slug}/index.html` - Generated viewer
- `output/{deck-slug}/slides/manifest.json` - New manifest file
- `output/{deck-slug}/slides/slide-N.html` - Individual slides

### Key Code Locations

- Title extraction: `scripts/regenerate-viewer.js:26`
- Slide discovery: `scripts/regenerate-viewer.js:76`
- Gallery rendering: `.slide-builder/templates/viewer-template.html:347`
- Presentation update: `.slide-builder/templates/viewer-template.html:412`

### Testing Locations

No automated tests - manual browser testing.

### Documentation to Update

- None required for this change

---

## UX/UI Considerations

**Error State UI:**
When manifest fails to load, display centered message in gallery area:
```
Unable to load slides.
Please ensure slides/manifest.json exists.
```

Style error message to match existing theme (dark background, light text, lime accent).

**Loading State (Optional Enhancement):**
Could add brief loading indicator while manifest fetches, but for local `file://` this is nearly instantaneous - skip for MVP.

---

## Testing Approach

**Manual Browser Testing:**
1. Open `output/claude-code-fundamentals/index.html` in Chrome
2. Verify gallery displays all 14 slides
3. Click slide to enter presentation mode
4. Navigate with arrow keys
5. Press Escape to return to gallery
6. Modify a slide file, refresh, verify change appears

**Edge Case Testing:**
1. Delete manifest.json - verify error message
2. Create malformed manifest.json - verify error handling
3. Empty slides array in manifest - verify "no slides" handling

---

## Deployment Strategy

### Deployment Steps

Not applicable - local development tool. Changes take effect immediately when files are saved.

### Rollback Plan

1. Revert to previous `viewer-template.html`
2. Re-run `node scripts/regenerate-viewer.js {deck-slug}` to restore static viewer
3. Delete `manifest.json` files (optional cleanup)

### Monitoring

Not applicable - local tool with no production deployment.
