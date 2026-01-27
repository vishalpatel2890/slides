# Story 3.4: Slide Preview in Browser

Status: done

## Story

As a **user**,
I want **to preview my generated slide in a web browser**,
So that **I can see exactly how it looks before using it**.

## Acceptance Criteria

1. **AC3.4.1:** Given a slide has been built, when the build completes, then the system provides the file path and offers to open in browser
2. **AC3.4.2:** Given the user opens the slide HTML file, when viewed in Chrome, Firefox, or Safari, then the slide renders correctly at 1920x1080
3. **AC3.4.3:** All elements display as designed with no layout issues
4. **AC3.4.4:** Text is editable via click (contenteditable works)
5. **AC3.4.5:** Slides are self-contained (no external dependencies except Google Fonts)

## Frontend Test Gate

**Gate ID**: 3-4-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Build-one workflow has been run (from Story 3.2 or 3.3)
- [ ] A slide.html exists at `.slide-builder/single/slide.html`
- [ ] Modern web browser installed (Chrome, Firefox, or Safari)
- [ ] Starting state: Slide has been built via `/sb:build-one`

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:build-one` | Claude Code CLI | Slide builds successfully |
| 2 | Observe completion message | Claude Code CLI | File path displayed: `.slide-builder/single/slide.html` |
| 3 | Observe browser offer | Claude Code CLI | "Open in browser? (y/n)" prompt or similar |
| 4 | Accept browser open | Claude Code CLI | Browser launches with slide |
| 5 | Verify dimensions | Browser DevTools | Viewport shows 1920x1080 content |
| 6 | Verify visual layout | Browser window | All elements positioned correctly, no overlap |
| 7 | Click on title text | Title element | Cursor appears, text is editable |
| 8 | Click on body text | Body/paragraph element | Cursor appears, text is editable |
| 9 | Type some text | Any contenteditable element | Text input works normally |
| 10 | Check for external deps | Browser DevTools > Network | Only Google Fonts (if used), no other external calls |
| 11 | Open in Firefox | Firefox browser | Same slide renders identically |
| 12 | Open in Safari | Safari browser | Same slide renders identically |
| 13 | Check console for errors | Browser DevTools > Console | No JavaScript errors |

### Success Criteria (What User Sees)
- [ ] Slide file path clearly displayed after build completion
- [ ] Browser opens with the slide rendered
- [ ] Slide displays at full 1920x1080 resolution (or scaled appropriately)
- [ ] All visual elements (boxes, arrows, icons) display correctly
- [ ] All text is clickable and shows cursor for editing
- [ ] Theme colors and fonts applied correctly
- [ ] No broken images or missing resources
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx) except expected font loading
- [ ] Slide renders identically in Chrome, Firefox, and Safari

### Feedback Questions
1. Does the slide preview match your expectations from the plan?
2. Is the text editing experience smooth and intuitive?
3. Are there any visual glitches or layout issues?
4. Does the slide load quickly without noticeable delay?

## Tasks / Subtasks

- [x] **Task 1: Add Preview Offer to Build Completion (Phase 4)** (AC: 1)
  - [x] 1.1: Update `.slide-builder/workflows/build-one/instructions.md` to add preview offer in Phase 4
  - [x] 1.2: After slide save, display clear file path message: "Slide saved to: .slide-builder/single/slide.html"
  - [x] 1.3: Add prompt: "Open in browser? (y/n)"
  - [x] 1.4: Document the path format for easy copy-paste

- [x] **Task 2: Implement Browser Open Functionality** (AC: 1)
  - [x] 2.1: If user accepts, use `open` command (macOS) / `xdg-open` (Linux) / `start` (Windows) to launch default browser
  - [x] 2.2: Pass the absolute file path to the browser
  - [x] 2.3: Handle cross-platform command differences
  - [x] 2.4: Provide fallback message if open fails: "Open the file manually at: [absolute path]"

- [x] **Task 3: Ensure Slide Dimensions Are Correct** (AC: 2, 3)
  - [x] 3.1: Verify viewport meta tag in slide HTML: `<meta name="viewport" content="width=1920, height=1080">`
  - [x] 3.2: Ensure body/slide container has explicit dimensions: `width: 1920px; height: 1080px;`
  - [x] 3.3: Add overflow: hidden to prevent scrollbars
  - [x] 3.4: Add viewport auto-scaling CSS for smaller screens (from Story 3.2 pattern)

- [x] **Task 4: Validate Self-Contained Slide Structure** (AC: 5)
  - [x] 4.1: Ensure all CSS is embedded in `<style>` tags (no external stylesheets except fonts)
  - [x] 4.2: Ensure all JavaScript is embedded in `<script>` tags (no external scripts)
  - [x] 4.3: Verify Google Fonts loaded via `<link>` tag with preconnect
  - [x] 4.4: Verify no other external resources referenced
  - [x] 4.5: Add comment in HTML documenting allowed external dependencies

- [x] **Task 5: Verify Contenteditable Functionality** (AC: 4)
  - [x] 5.1: Verify all text elements have `contenteditable="true"`
  - [x] 5.2: Verify all contenteditable elements have `data-field` attributes
  - [x] 5.3: Test text selection and editing works in Chrome
  - [x] 5.4: Test text selection and editing works in Firefox
  - [x] 5.5: Test text selection and editing works in Safari
  - [x] 5.6: Verify cursor appears on click

- [x] **Task 6: Cross-Browser Testing** (AC: 2, 3)
  - [x] 6.1: Open slide in Chrome - verify layout matches design
  - [x] 6.2: Open slide in Firefox - verify identical rendering
  - [x] 6.3: Open slide in Safari - verify identical rendering
  - [x] 6.4: Check for CSS property compatibility issues
  - [x] 6.5: Document any browser-specific workarounds needed
  - [x] 6.6: Run Frontend Test Gate checklist

- [x] **Task 7: Update Status and Complete** (AC: 1)
  - [x] 7.1: After successful preview offer, update status.yaml if not already updated
  - [x] 7.2: Log "Slide preview offered" or similar in history
  - [x] 7.3: Display completion message: "Slide ready. Edit text directly in browser."

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Preview Handler Module:**

This story implements the Preview Handler module from the tech spec. The module is responsible for:
- Providing file path to generated slide
- Offering to open in default browser
- Confirming slide is viewable

**Preview Handler (from Tech Spec Services/Modules):**

```
Module: Preview Handler
Responsibility: Opens generated slide in browser
Inputs: slide.html path
Outputs: Browser window with slide
```

**From Tech Spec - Complete /build-one Workflow Phase 4:**

```
Phase 4: Preview and State Update
┌─────────────────────────────────────────────────────────────┐
│ 1. Update status.yaml:                                      │
│    - built_count: 1                                         │
│    - last_action: "Built slide using [template/custom]"     │
│    - Add to history                                         │
│ 2. Display slide file path                                  │
│ 3. Ask: "Open in browser? (y/n)"                            │
│ 4. If yes → Open file in default browser                    │
│ 5. Display: "Slide ready. Edit text directly in browser."   │
└─────────────────────────────────────────────────────────────┘
```

**Key Constraints (from Tech Spec NFRs):**

- Per NFR4: "Slide preview renders immediately in browser (no loading delay)"
- Per NFR18: "Must work in Chrome, Firefox, Safari"
- Per Architecture ADR-003: Slides are self-contained HTML files
- Per Architecture HTML Slide Pattern: All slides follow standard structure with contenteditable

**Acceptance Criteria Mapping (from Tech Spec):**

| AC# | Acceptance Criterion | Test Approach |
|-----|---------------------|---------------|
| AC3.4.1 | File path shown and browser offer | After build, verify path shown and offer to open |
| AC3.4.2 | Renders at 1920x1080 in browsers | Open in Chrome, Firefox, Safari - check viewport |
| AC3.4.3 | All elements display correctly | Visual inspection for layout issues |
| AC3.4.4 | Text is editable via click | Click text in browser, verify editable |
| AC3.4.5 | Self-contained (except fonts) | Check HTML has no external script/CSS (except fonts) |

**HTML Slide Pattern Requirements (from Architecture):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>Slide Title</title>
  <style>
    /* Theme primitives injected here */
    :root {
      --color-primary: {{theme.colors.primary}};
      /* ... all theme variables */
    }
    body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; }
    .slide { width: 100%; height: 100%; position: relative; }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_number}}">
    <!-- All text elements MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Title Here</h1>
    <p contenteditable="true" data-field="body">Body text</p>
  </div>
  <script>
    // Auto-save script for contenteditable elements
  </script>
</body>
</html>
```

### Project Structure Notes

**Files Involved:**

```
.slide-builder/
├── workflows/
│   └── build-one/              # EXISTING - modify Phase 4
│       ├── workflow.yaml       # Workflow config
│       └── instructions.md     # MODIFY - enhance preview offer
├── single/
│   └── slide.html             # INPUT - generated slide to preview
├── theme.json                  # INPUT - referenced for verification
└── status.yaml                 # UPDATED - preview action logged
```

**No New Files Created** - This story enhances the existing build-one workflow's Phase 4 to add robust preview functionality.

### Learnings from Previous Story

**From Story 3-3-custom-slide-building (Status: drafted)**

- **Build-one workflow Phase 4 exists:** Phase 4 already has basic state update logic - enhance with preview offer
- **Slide output location confirmed:** Slides saved to `.slide-builder/single/slide.html`
- **Auto-save script pattern:** JavaScript for contenteditable persistence exists in slides
- **Viewport scaling added in Story 3.2:** Templates have auto-scaling CSS for smaller viewports
- **Theme CSS variables injected:** Slides already use --color-primary, --font-heading etc.
- **Contenteditable attributes required:** All text elements have contenteditable="true" and data-field

**Key Patterns to Preserve:**
- Slide saves to `.slide-builder/single/slide.html` (same location for template and custom)
- status.yaml updated with built_count: 1, last_action
- Auto-save script embedded in slide HTML
- Viewport meta tag and dimensions already set

[Source: notes/sprint-artifacts/3-3-custom-slide-building.md#Dev-Notes]

### Browser Open Commands

**Cross-Platform Commands:**

| Platform | Command | Example |
|----------|---------|---------|
| macOS | `open` | `open .slide-builder/single/slide.html` |
| Linux | `xdg-open` | `xdg-open .slide-builder/single/slide.html` |
| Windows | `start` | `start .slide-builder/single/slide.html` |

**In Claude Code context:**
- Use Bash tool with `open` command (macOS detected from environment)
- Provide absolute path for reliability

### Testing Standards

Per Architecture test strategy:
- **Cross-browser test:** Verify slide renders correctly in Chrome, Firefox, Safari
- **Visual inspection:** All elements display as designed with no layout issues
- **Functional test:** Text editing works via contenteditable
- **Dependency check:** No external resources except Google Fonts

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story 3.4: Slide Preview in Browser] - AC definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Services and Modules] - Preview Handler module
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows and Sequencing] - Phase 4: Preview and State Update
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Non-Functional Requirements] - NFR4 preview timing
- [Source: notes/architecture.md#HTML Slide Pattern] - Required HTML structure
- [Source: notes/architecture.md#ADR-003: HTML Slides with Contenteditable] - Architecture decision
- [Source: notes/epics.md#Story 3.4: Slide Preview in Browser] - User story and context
- [Source: notes/prd.md#Slide Output] - FR31 browser compatibility

## Dev Agent Record

### Context Reference

- [3-4-slide-preview-in-browser.context.xml](./3-4-slide-preview-in-browser.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**2026-01-27 Implementation Plan:**
- Task 1-2: Enhance build-one Phase 4 with browser open functionality
  - Current Phase 4 shows path but uses manual instruction for browser
  - Need to: 1) Display absolute path, 2) Execute platform-specific open command, 3) Add fallback
- Task 3-5: Verify existing slide HTML structure meets requirements (viewport, dimensions, contenteditable)
- Task 6: Cross-browser testing (manual)
- Task 7: Update status.yaml with preview action

**Approach:** Modify `.slide-builder/workflows/build-one/instructions.md` Phase 4 to:
1. Show absolute file path after slide save
2. Add platform detection logic (darwin/linux/windows)
3. Execute `open` command on macOS when user accepts
4. Include fallback message if command fails

### Completion Notes

**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### Completion Notes List

- Tasks 1-2: Enhanced build-one Phase 4 with browser preview functionality
  - Added absolute path display for easy copy-paste
  - Added platform-specific browser open commands (open/xdg-open/start)
  - Added fallback message if browser open fails
- Tasks 3-5: Verified existing slide.html meets all requirements
  - Viewport meta: width=1920, height=1080 ✓
  - Slide dimensions: 1920x1080 with overflow hidden ✓
  - Viewport auto-scaling via scaleSlide() ✓
  - All CSS/JS embedded (self-contained) ✓
  - Google Fonts with preconnect ✓
  - All text elements have contenteditable="true" and data-field ✓
- Task 7: Status update and completion message already in Phase 4
- Browser open tested successfully via `open` command on macOS
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### File List

**Modified:**
- `.slide-builder/workflows/build-one/instructions.md` - Enhanced Phase 4 with browser preview functionality

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete - enhanced build-one Phase 4 with browser preview | Dev Agent (Claude Opus 4.5) |
| 2026-01-27 | Frontend Test Gate PASSED - ready for review | Vishal |
| 2026-01-27 | Story marked DONE - all ACs met | Dev Agent |
