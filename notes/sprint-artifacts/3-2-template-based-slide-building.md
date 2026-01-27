# Story 3.2: Template-Based Slide Building

Status: done

## Story

As a **system**,
I want **to generate a slide using an existing layout template**,
So that **brand consistency is guaranteed and generation is fast**.

## Acceptance Criteria

1. **AC3.2.1:** Given a single-slide plan exists with a matching template, when the user runs `/build-one`, then the system loads the matching template from `.slide-builder/templates/`
2. **AC3.2.2:** The system injects slide content into template placeholders based on plan.yaml
3. **AC3.2.3:** The system applies theme CSS variables from theme.json to the slide
4. **AC3.2.4:** The slide is saved to `.slide-builder/single/slide.html`
5. **AC3.2.5:** The slide renders at 1920x1080 (16:9)
6. **AC3.2.6:** All text elements have `contenteditable="true"` and `data-field` attributes
7. **AC3.2.7:** status.yaml is updated with built_count and last_action

## Frontend Test Gate

**Gate ID**: 3-2-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Templates exist at `.slide-builder/templates/layout-*.html` (from Epic 2)
- [ ] A plan.yaml exists at `.slide-builder/single/plan.yaml` with suggested_template (from Story 3.1 /plan-one)
- [ ] Claude Code CLI running
- [ ] Starting state: No existing slide.html in `.slide-builder/single/`

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:build-one` | Claude Code CLI | System checks for plan.yaml existence |
| 2 | Observe plan verification | Claude Code CLI | "Plan found" or error if missing |
| 3 | Observe template decision | Claude Code CLI | System reads suggested_template from plan.yaml |
| 4 | Verify template loading | Claude Code CLI | System loads matching template from templates/ |
| 5 | Observe content injection | Claude Code CLI | System injects content from plan.yaml key_points |
| 6 | Observe theme application | Claude Code CLI | System applies CSS variables from theme.json |
| 7 | Verify slide save | File system | slide.html created at `.slide-builder/single/` |
| 8 | Open slide.html in browser | Chrome/Firefox | Slide renders at 1920x1080 |
| 9 | Inspect HTML for contenteditable | Browser DevTools | All text elements have contenteditable="true" |
| 10 | Inspect HTML for data-field | Browser DevTools | All text elements have data-field attributes |
| 11 | Verify CSS variables | Browser DevTools :root | --color-primary, --font-heading, etc. from theme |
| 12 | Verify status.yaml updated | File system | built_count: 1, last_action recorded |

### Success Criteria (What User Sees)
- [ ] Plan verification message appears before build
- [ ] Template decision logged (e.g., "Using layout-flow template")
- [ ] Slide generated and saved to `.slide-builder/single/slide.html`
- [ ] Slide renders at exactly 1920x1080 (16:9 aspect ratio)
- [ ] All text elements are clickable and editable (contenteditable works)
- [ ] Theme colors visible in slide (primary, secondary, accent colors applied)
- [ ] Theme fonts applied (heading and body fonts from theme.json)
- [ ] status.yaml shows built_count: 1
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Does the generated slide use the correct layout template as specified in plan.yaml?
2. Is the content from plan.yaml (key_points, intent) reflected accurately in the slide?
3. Are the theme colors and fonts applied consistently?
4. Is text editing working correctly via contenteditable?

## Tasks / Subtasks

- [x] **Task 1: Create build-one Workflow Structure** (AC: 1, 7)
  - [x] 1.1: Create `.slide-builder/workflows/build-one/` directory
  - [x] 1.2: Create `workflow.yaml` with name, description, instructions path
  - [x] 1.3: Create `instructions.md` skeleton with workflow phases

- [x] **Task 2: Implement State Verification (Phase 1)** (AC: 1)
  - [x] 2.1: Check status.yaml for current mode
  - [x] 2.2: If mode != "single" and single/plan.yaml doesn't exist: error "No single slide plan. Run /plan-one first."
  - [x] 2.3: If single/plan.yaml exists: load plan and continue

- [x] **Task 3: Implement Template Decision (Phase 2)** (AC: 1, 2)
  - [x] 3.1: Read suggested_template from plan.yaml
  - [x] 3.2: If template name (not "custom"): check template exists in templates/
  - [x] 3.3: If template exists: proceed to Template Build (Phase 3A)
  - [x] 3.4: If template missing: log warning and fall back to Custom Build (Phase 3B - Story 3.3)
  - [x] 3.5: If "custom": proceed to Custom Build (Phase 3B - Story 3.3)

- [x] **Task 4: Implement Template Build (Phase 3A)** (AC: 1, 2, 3, 5, 6)
  - [x] 4.1: Load template HTML from templates/layout-{name}.html
  - [x] 4.2: Load theme.json for CSS variables
  - [x] 4.3: Inject theme CSS variables into :root section:
    - --color-primary, --color-secondary, --color-accent
    - --color-bg-default, --color-bg-alt
    - --color-text-heading, --color-text-body
    - --font-heading, --font-body, --font-mono
    - --font-scale-hero, --font-scale-h1, --font-scale-h2, --font-scale-body
    - Shape variables (corner radius, shadow)
  - [x] 4.4: Generate content based on plan.yaml:
    - Title from intent
    - Body content from key_points
    - Visual elements from visual_guidance
  - [x] 4.5: Ensure all text elements have contenteditable="true" + data-field attributes
  - [x] 4.6: Add auto-save JavaScript for contenteditable elements
  - [x] 4.7: Validate slide dimensions are 1920x1080

- [x] **Task 5: Save Slide and Update State (Phase 4)** (AC: 4, 7)
  - [x] 5.1: Save generated HTML to `.slide-builder/single/slide.html`
  - [x] 5.2: Update status.yaml:
    - built_count: 1
    - last_action: "Built slide using [template] template"
    - Add to history array
  - [x] 5.3: Display slide file path to user
  - [x] 5.4: Offer to open in browser

- [x] **Task 6: Register Slash Command** (AC: 1)
  - [x] 6.1: Add `/sb:build-one` command registration in BMAD skill configuration
  - [x] 6.2: Verify command invokes build-one workflow
  - [x] 6.3: Ensure command works in both single and deck modes (single for this story)

- [x] **Task 7: Testing and Validation** (AC: 1-7)
  - [x] 7.1: Test with plan.yaml having suggested_template: "layout-flow"
  - [x] 7.2: Test with plan.yaml having suggested_template: "layout-list"
  - [x] 7.3: Verify slide.html created with correct dimensions
  - [x] 7.4: Verify all text elements have contenteditable and data-field
  - [x] 7.5: Verify CSS variables injected from theme.json
  - [x] 7.6: Verify status.yaml shows built_count: 1
  - [x] 7.7: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - System Architecture Alignment:**

This story implements the `/build-one` command for template-based slide generation (Epic 3). Key architectural decisions:

- **Hybrid Template + Skill Generation (ADR-002):** When suggested_template is a valid template name, use the template for fast, brand-consistent generation. Only fall back to frontend-design skill when template: "custom" or template file missing.
- **HTML Slide Pattern (ADR-003):** All generated slides must follow the standard HTML structure with contenteditable attributes and data-field selectors.
- **Dual-Mode State (Novel Pattern 4):** In single mode, build from `.slide-builder/single/plan.yaml` and save to `.slide-builder/single/slide.html`.

**Template Matching (from Tech Spec):**

| suggested_template | Template File |
|-------------------|---------------|
| layout-title | templates/layout-title.html |
| layout-list | templates/layout-list.html |
| layout-flow | templates/layout-flow.html |
| layout-columns-2 | templates/layout-columns-2.html |
| layout-columns-3 | templates/layout-columns-3.html |
| layout-callout | templates/layout-callout.html |
| layout-code | templates/layout-code.html |

**Required HTML Slide Structure (from Tech Spec):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>{{slide_title}}</title>
  <style>
    :root {
      --color-primary: {{theme.colors.primary}};
      --color-secondary: {{theme.colors.secondary}};
      --color-accent: {{theme.colors.accent}};
      --color-bg-default: {{theme.colors.background.default}};
      --color-bg-alt: {{theme.colors.background.alt}};
      --color-text-heading: {{theme.colors.text.heading}};
      --color-text-body: {{theme.colors.text.body}};
      --font-heading: {{theme.typography.fonts.heading}};
      --font-body: {{theme.typography.fonts.body}};
      --font-mono: {{theme.typography.fonts.mono}};
      /* ... all theme variables */
    }
    body { margin: 0; width: 1920px; height: 1080px; }
    .slide { width: 100%; height: 100%; position: relative; }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="single">
    <!-- All text MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Slide Title</h1>
    <p contenteditable="true" data-field="body">Body content</p>
    <!-- Visual elements -->
    <div class="diagram">...</div>
  </div>
  <script>
    // Auto-save script for contenteditable - per Tech Spec
    const saveEdits = () => {
      const edits = [];
      document.querySelectorAll('[contenteditable]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field) {
          edits.push({ selector: `[data-field='${field}']`, content: el.innerHTML });
        }
      });
      localStorage.setItem('slide-edits', JSON.stringify({
        slide: 'single',
        edits: edits,
        lastModified: new Date().toISOString()
      }));
    };

    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('blur', saveEdits);
      el.addEventListener('input', () => setTimeout(saveEdits, 1000));
    });

    // Restore edits on load
    const stored = localStorage.getItem('slide-edits');
    if (stored) {
      const data = JSON.parse(stored);
      data.edits.forEach(edit => {
        const el = document.querySelector(edit.selector);
        if (el) el.innerHTML = edit.content;
      });
    }
  </script>
</body>
</html>
```

**Complete /build-one Workflow (from Tech Spec - Single Mode):**

```
Phase 1: State Verification
├── Check status.yaml for mode
├── If mode != "single" and single/plan.yaml doesn't exist:
│   → Error: "No single slide plan. Run /plan-one first." → HALT
└── If single/plan.yaml exists: load plan → Continue

Phase 2: Template Decision
├── Read suggested_template from plan.yaml
├── If template name (not "custom"):
│   → Check template exists in templates/
│   → If exists → Go to Template Build (Phase 3A)
│   → If missing → Fall back to Custom Build (Phase 3B)
└── If "custom" → Go to Custom Build (Phase 3B)

Phase 3A: Template Build (THIS STORY)
├── Load template HTML from templates/layout-{name}.html
├── Load theme.json for CSS variables
├── Inject theme CSS variables into :root
├── Generate content based on plan.yaml
├── Ensure all text has contenteditable + data-field
├── Add auto-save JavaScript
└── Save to .slide-builder/single/slide.html → Go to Phase 4

Phase 3B: Custom Build (Story 3.3)
└── [Handled by Story 3.3 - Custom Slide Building]

Phase 4: Preview and State Update
├── Update status.yaml: built_count: 1, last_action, history
├── Display slide file path
├── Ask: "Open in browser? (y/n)"
└── Display: "Slide ready. Edit text directly in browser."
```

**Key Constraints (from Tech Spec NFRs):**

- Per NFR2: Template-based slide generation should complete < 5 seconds
- Per Architecture: Slides MUST render at 1920x1080 (16:9 standard)
- Per Architecture: All text elements MUST have contenteditable="true" and data-field attributes
- Per Architecture: Slides MUST use theme CSS variables
- Per Architecture: Slides MUST be self-contained HTML (no external dependencies except Google Fonts)

### Project Structure Notes

**Workflow Location (from Architecture):**

```
.slide-builder/
├── workflows/
│   └── build-one/              # NEW - this story creates
│       ├── workflow.yaml       # Workflow config
│       └── instructions.md     # Execution instructions
├── templates/                  # INPUT - layout templates from Epic 2
│   ├── layout-title.html
│   ├── layout-list.html
│   ├── layout-flow.html
│   └── ...
├── single/                     # INPUT/OUTPUT
│   ├── plan.yaml              # INPUT - from /plan-one
│   └── slide.html             # OUTPUT - generated slide
├── theme.json                  # INPUT - theme primitives
└── status.yaml                 # UPDATED - build tracking
```

**Template Files (from Epic 2 /setup):**

The 7 layout templates were generated during the `/setup` workflow and stored in `.slide-builder/templates/`. Each template:
- Uses {{placeholder}} syntax for content injection
- Has theme CSS variable references in :root
- Contains contenteditable text elements with data-field attributes
- Follows 1920x1080 dimensions

### Learnings from Previous Story

**From Story 3-1-single-slide-planning (Status: done)**

- **Workflow structure established:** plan-one workflow created at `.slide-builder/workflows/plan-one/` - follow same pattern
- **5-phase workflow pattern:** Theme Verification → Intent Capture → Template Matching → Confirmation → State Persistence - build-one follows similar phased approach
- **Template matching rules implemented:** Keywords map to 7 template types - reuse for template decision in build-one
- **plan.yaml schema verified:** Contains intent, suggested_template, key_points, audience context - these fields available for content generation
- **status.yaml pattern:** mode: "single", current_slide, total_slides, last_action, history - extend with built_count
- **BMAD XML pattern consistent:** Steps use `<step>`, `<action>`, `<check>`, `<ask>`, `<output>` tags - continue this convention
- **Command registration pattern:** `/sb:plan-one` at `.claude/commands/sb/plan-one.md` - create `/sb:build-one` similarly
- **Test Gate PASSED:** plan.yaml validated working - ready for use as input to build-one

**Key Interfaces from Previous Story:**
- plan.yaml at `.slide-builder/single/plan.yaml` is the source of truth for build
- suggested_template field determines which template to load
- key_points, intent, visual_guidance fields provide content for slide
- status.yaml must be updated after build completes

[Source: notes/sprint-artifacts/3-1-single-slide-planning.md#Dev-Agent-Record]

### Testing Standards

Per Architecture test strategy:
- **Unit test:** Template loading, CSS variable injection, content generation
- **Integration test:** Full /build-one workflow from plan to saved slide
- **Cross-browser:** Verify slide renders correctly in Chrome, Firefox, Safari

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story 3.2: Template-Based Slide Building] - AC definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Services and Modules] - Template Builder module
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Data Models and Contracts] - HTML Slide Structure
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows and Sequencing] - Complete /build-one workflow
- [Source: notes/architecture.md#Pattern 2: Template-or-Custom Decision] - Template matching logic
- [Source: notes/architecture.md#HTML Slide Pattern] - Required HTML structure
- [Source: notes/architecture.md#State File Patterns] - status.yaml schema
- [Source: notes/epics.md#Story 3.2: Template-Based Slide Building] - User story and context
- [Source: notes/prd.md#Building] - FR22-29 requirements

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/3-2-template-based-slide-building.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1: Created build-one workflow structure at .slide-builder/workflows/build-one/
- Task 2-3: Workflow instructions implement state verification and template decision phases
- Task 4: Generated slide.html with all CSS variables injected, contenteditable attributes on all text, auto-save script
- Task 5: Updated status.yaml with built_count: 1 and history entry
- Task 6: Updated /sb:build-one command to reference new build-one workflow

### Completion Notes List

- Created dedicated build-one workflow (separate from generic build workflow)
- Template mapping: layout-title -> 01-title.html implemented in workflow.yaml
- All text elements have contenteditable="true" and unique data-field attributes
- CSS variables injected from theme.json into :root
- Auto-save JavaScript stores edits to localStorage
- Slide dimensions: 1920x1080 viewport meta and body dimensions
- status.yaml updated with built_count: 1
- Added viewport auto-scaling to all slides and templates (fixes off-center issue when browser < 1920px)
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### File List

**Created:**
- .slide-builder/workflows/build-one/workflow.yaml
- .slide-builder/workflows/build-one/instructions.md
- .slide-builder/single/slide.html

**Modified:**
- .claude/commands/sb/build-one.md (updated to reference build-one workflow)
- .slide-builder/status.yaml (added built_count, updated last_action, added history entry)
- .slide-builder/templates/01-title.html (added viewport scaling)
- .slide-builder/templates/02-agenda.html (added viewport scaling)
- .slide-builder/templates/03-flow.html (added viewport scaling)
- .slide-builder/templates/04-comparison.html (added viewport scaling)
- .slide-builder/templates/05-callout.html (added viewport scaling)
- .slide-builder/templates/06-technical.html (added viewport scaling)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete, Test Gate PASSED | Dev Agent (Claude Opus 4.5) |
| 2026-01-27 | Story marked done | Dev Agent |
