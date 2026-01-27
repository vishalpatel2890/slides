# Story 3.3: Custom Slide Building

Status: done

## Story

As a **system**,
I want **to generate a custom slide layout for complex content**,
So that **users aren't limited to predefined templates**.

## Acceptance Criteria

1. **AC3.3.1:** Given a single-slide plan exists with no matching template (suggested_template: "custom"), when the user runs `/build-one`, then the system invokes the frontend-design skill
2. **AC3.3.2:** The frontend-design skill receives: full theme.json, slide intent, content requirements
3. **AC3.3.3:** The generated custom slide follows all theme primitives (colors, fonts, shapes)
4. **AC3.3.4:** The custom slide renders at 1920x1080
5. **AC3.3.5:** All text elements in the custom slide have contenteditable attributes
6. **AC3.3.6:** Given a complex diagram or unique layout is requested, when the frontend-design skill generates the slide, then the output is production-quality, not placeholder

## Frontend Test Gate

**Gate ID**: 3-3-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Build-one workflow exists at `.slide-builder/workflows/build-one/` (from Story 3.2)
- [ ] A plan.yaml exists at `.slide-builder/single/plan.yaml` with `suggested_template: "custom"` (create via /plan-one with complex intent)
- [ ] Claude Code CLI running
- [ ] Starting state: No existing slide.html in `.slide-builder/single/` (or delete existing)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Create plan with custom intent | Run `/sb:plan-one` | Plan slide with: "A Venn diagram showing overlap of 3 concepts" or similar complex layout |
| 2 | Verify plan.yaml | `.slide-builder/single/plan.yaml` | suggested_template: "custom" (not a layout-* template) |
| 3 | Run `/sb:build-one` | Claude Code CLI | System detects custom template requirement |
| 4 | Observe skill invocation | Claude Code CLI | "Invoking frontend-design skill for custom layout" or similar |
| 5 | Verify theme passed to skill | Claude Code CLI | System passes full theme.json to skill |
| 6 | Verify intent passed to skill | Claude Code CLI | System passes intent and key_points from plan.yaml |
| 7 | Observe slide generation | Claude Code CLI | Custom HTML slide generated (may take up to 30 seconds per NFR2) |
| 8 | Verify slide saved | File system | slide.html created at `.slide-builder/single/slide.html` |
| 9 | Open slide.html in browser | Chrome/Firefox | Slide renders at 1920x1080 |
| 10 | Inspect for theme compliance | Browser DevTools | CSS variables from theme.json applied (--color-primary, --font-heading, etc.) |
| 11 | Inspect for contenteditable | Browser DevTools | All text elements have contenteditable="true" |
| 12 | Inspect for data-field | Browser DevTools | All text elements have data-field attributes |
| 13 | Verify production quality | Visual inspection | Layout is complete, not placeholder; diagram/visual is meaningful |
| 14 | Verify status.yaml updated | File system | built_count: 1, last_action includes "custom" |

### Success Criteria (What User Sees)
- [ ] Custom slide intent detected (suggested_template: "custom")
- [ ] frontend-design skill invoked with theme + intent context
- [ ] Slide generated and saved to `.slide-builder/single/slide.html`
- [ ] Slide renders at exactly 1920x1080 (16:9 aspect ratio)
- [ ] All text elements are clickable and editable (contenteditable works)
- [ ] Theme colors visible in slide (primary, secondary, accent colors from theme.json)
- [ ] Theme fonts applied (heading and body fonts from theme.json)
- [ ] Custom layout matches the requested intent (e.g., actual Venn diagram, not generic layout)
- [ ] status.yaml shows built_count: 1 with custom build noted
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Does the custom slide accurately represent the complex intent requested?
2. Is the visual quality production-ready, not placeholder?
3. Are the theme colors and fonts applied consistently throughout?
4. Is text editing working correctly via contenteditable?

## Tasks / Subtasks

- [x] **Task 1: Extend build-one Workflow for Custom Build Path** (AC: 1)
  - [x] 1.1: Update `.slide-builder/workflows/build-one/instructions.md` to add Phase 3B: Custom Build
  - [x] 1.2: Add condition in Phase 2 (Template Decision) to route to Phase 3B when suggested_template: "custom"
  - [x] 1.3: Add fallback route when template file is missing

- [x] **Task 2: Implement Custom Build Logic (Phase 3B)** (AC: 1, 2, 3, 4, 5)
  - [x] 2.1: Load theme.json completely for skill context
  - [x] 2.2: Prepare frontend-design skill invocation context:
    - Full theme object (colors, typography, shapes)
    - Slide intent from plan.yaml
    - Key points and content requirements from plan.yaml
    - Visual guidance from plan.yaml
    - Constraints: 1920x1080 dimensions, contenteditable required
  - [x] 2.3: Invoke frontend-design skill with prepared context
  - [x] 2.4: Capture generated HTML output

- [x] **Task 3: Validate and Post-Process Custom Slide** (AC: 3, 5)
  - [x] 3.1: Validate generated HTML has contenteditable on text elements
  - [x] 3.2: If missing, add contenteditable="true" to text elements (h1, h2, h3, p, li, span with text)
  - [x] 3.3: Validate data-field attributes exist on contenteditable elements
  - [x] 3.4: If missing, generate unique data-field values based on element type and position
  - [x] 3.5: Validate CSS variables from theme are used
  - [x] 3.6: Validate dimensions (viewport 1920x1080)

- [x] **Task 4: Add Auto-Save Script and Viewport Scaling** (AC: 5)
  - [x] 4.1: Check if auto-save JavaScript exists in generated slide
  - [x] 4.2: If missing, inject the standard auto-save script (from Story 3.2 pattern)
  - [x] 4.3: Add viewport auto-scaling CSS (from Story 3.2 template modifications)
  - [x] 4.4: Ensure script handles all contenteditable elements with data-field

- [x] **Task 5: Save Custom Slide and Update State** (AC: 1)
  - [x] 5.1: Save validated HTML to `.slide-builder/single/slide.html`
  - [x] 5.2: Update status.yaml:
    - built_count: 1
    - last_action: "Built custom slide via frontend-design skill"
    - Add to history array
  - [x] 5.3: Display slide file path to user
  - [x] 5.4: Log "Custom layout generated" for observability

- [x] **Task 6: Testing and Validation** (AC: 1-6)
  - [x] 6.1: Test with plan.yaml having suggested_template: "custom" (e.g., Venn diagram intent)
  - [x] 6.2: Test with complex diagram request (flowchart with multiple branches)
  - [x] 6.3: Test with unique layout request (comparison matrix)
  - [x] 6.4: Verify slide.html created with correct dimensions
  - [x] 6.5: Verify all text elements have contenteditable and data-field
  - [x] 6.6: Verify CSS variables match theme.json
  - [x] 6.7: Verify status.yaml shows custom build in last_action
  - [x] 6.8: Run Frontend Test Gate checklist
  - [x] 6.9: Cross-browser test: Chrome, Firefox, Safari

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - System Architecture Alignment:**

This story implements the Custom Build path (Phase 3B) of the `/build-one` workflow. When suggested_template is "custom" or the template file is missing, the system invokes the frontend-design skill to generate a custom HTML slide.

- **Hybrid Template + Skill Generation (ADR-002):** Template-based builds (Story 3.2) are preferred for speed; custom builds via skill are used for novel layouts that don't match templates.
- **HTML Slide Pattern (ADR-003):** Custom slides MUST follow the same structure as template slides: contenteditable attributes, data-field selectors, theme CSS variables.
- **Custom Builder Module (from Tech Spec):** Generates custom layout via frontend-design skill when templates don't match.

**Custom Build Flow (from Tech Spec):**

```
Phase 3B: Custom Build
┌─────────────────────────────────────────────────────────────┐
│ 1. Load theme.json completely                               │
│ 2. Prepare frontend-design skill invocation:                │
│    - Full theme object                                      │
│    - Intent and content from plan.yaml                      │
│    - Constraints: 1920x1080, contenteditable required       │
│ 3. Invoke frontend-design skill                             │
│ 4. Validate response:                                       │
│    - Has contenteditable on text elements                   │
│    - Has data-field attributes                              │
│    - Uses theme CSS variables                               │
│ 5. Add auto-save JavaScript if missing                      │
│ 6. Save to .slide-builder/single/slide.html                 │
│ 7. → Go to Phase 4                                          │
└─────────────────────────────────────────────────────────────┘
```

**frontend-design Skill Interface (from Tech Spec):**

```
Input:
  - Theme JSON object (complete)
  - Slide intent description
  - Content requirements (key_points, visual_guidance)
  - Dimension constraints (1920x1080)
Output: Complete HTML slide with embedded CSS
Usage: Generate custom layouts when templates don't match
```

**Key Constraints (from Tech Spec NFRs):**

- Per NFR2: Custom slide generation should complete < 30 seconds (frontend-design skill invocation)
- Per Architecture: Slides MUST render at 1920x1080 (16:9 standard)
- Per Architecture: All text elements MUST have contenteditable="true" and data-field attributes
- Per Architecture: Slides MUST use theme CSS variables from theme.json
- Per Architecture: Slides MUST be self-contained HTML (no external dependencies except Google Fonts)

**Acceptance Criteria Mapping (from Tech Spec):**

| AC# | Acceptance Criterion | Test Approach |
|-----|---------------------|---------------|
| AC3.3.1 | Skill invoked when suggested_template: "custom" | Plan "Venn diagram", verify skill called |
| AC3.3.2 | Skill receives theme + intent | Verify skill receives theme + intent in context |
| AC3.3.3 | Custom slide follows theme primitives | Inspect CSS variables in generated HTML |
| AC3.3.4 | Custom slide renders at 1920x1080 | Open in browser, check viewport |
| AC3.3.5 | All text elements have contenteditable | Inspect HTML for attributes |
| AC3.3.6 | Output is production-quality | Visual inspection of complex diagram output |

### Project Structure Notes

**Workflow Location (existing from Story 3.2):**

```
.slide-builder/
├── workflows/
│   └── build-one/              # EXISTING - extend for custom build
│       ├── workflow.yaml       # Workflow config
│       └── instructions.md     # MODIFY - add Phase 3B
├── templates/                  # INPUT - layout templates (may be missing for custom)
├── single/
│   ├── plan.yaml              # INPUT - from /plan-one with suggested_template: "custom"
│   └── slide.html             # OUTPUT - custom generated slide
├── theme.json                  # INPUT - full theme for skill context
└── status.yaml                 # UPDATED - build tracking
```

**No New Files Created** - This story extends the existing build-one workflow with custom build logic.

### Learnings from Previous Story

**From Story 3-2-template-based-slide-building (Status: review)**

- **Build-one workflow structure established:** Workflow exists at `.slide-builder/workflows/build-one/` - extend with Phase 3B
- **Template decision logic implemented:** Phase 2 routes to Phase 3A for templates - add routing to Phase 3B for custom
- **Auto-save script pattern established:** JavaScript for contenteditable persistence - reuse in custom slides
- **Viewport auto-scaling added:** All templates have scaling CSS - apply same pattern to custom slides
- **status.yaml update pattern:** built_count, last_action, history - follow same pattern for custom builds
- **data-field attribute pattern:** Each text element has unique data-field - validate/add in custom slides
- **Test Gate PASSED:** Template-based build verified working - custom build should produce same quality output

**Key Interfaces from Previous Story:**
- `plan.yaml` field `suggested_template` determines build path ("custom" routes to Phase 3B)
- Template build saves to `.slide-builder/single/slide.html` - custom build saves to same location
- status.yaml updated with built_count: 1 - custom build follows same pattern
- Auto-save script pattern: saveEdits() function with localStorage - inject if missing in custom output

[Source: notes/sprint-artifacts/3-2-template-based-slide-building.md#Dev-Agent-Record]

### Testing Standards

Per Architecture test strategy:
- **Unit test:** Skill invocation with correct context, HTML validation/post-processing
- **Integration test:** Full /build-one workflow from custom plan to saved slide
- **Cross-browser:** Verify custom slide renders correctly in Chrome, Firefox, Safari
- **Quality test:** Visual inspection of complex diagrams (Venn, flowchart, matrix)

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story 3.3: Custom Slide Building] - AC definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Services and Modules] - Custom Builder module
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows and Sequencing] - Phase 3B: Custom Build
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#APIs and Interfaces] - frontend-design skill interface
- [Source: notes/architecture.md#Pattern 2: Template-or-Custom Decision] - Decision logic
- [Source: notes/architecture.md#HTML Slide Pattern] - Required HTML structure
- [Source: notes/architecture.md#ADR-002: Hybrid Template + Skill Generation] - Architecture decision
- [Source: notes/epics.md#Story 3.3: Custom Slide Building] - User story and context
- [Source: notes/prd.md#Building] - FR28 custom layouts requirement

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/3-3-custom-slide-building.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1: Extended build-one instructions.md with Phase 3B for custom builds
- Task 2-5: Phase 3B implements full custom build logic including skill invocation, validation, script injection
- Task 6: Generated Venn diagram slide with suggested_template: "custom" - all acceptance criteria verified

### Completion Notes List

- Extended build-one workflow with Phase 3B: Custom Build via frontend-design skill
- Phase 2 now routes to Phase 3B when suggested_template is "custom" or template file missing
- Phase 3B includes: theme loading, skill context preparation, frontend-design invocation, HTML validation/post-processing
- Validation steps check for: contenteditable attributes, data-field attributes, CSS variables, 1920x1080 dimensions
- Auto-save script and viewport scaling script injection if missing from generated output
- Phase 4 updated to handle both template and custom build outputs
- Test Venn diagram slide generated with actual SVG circles, full theme integration, all contenteditable elements
- ✅ Test Gate PASSED by Vishal (2026-01-27)

### File List

**Modified:**
- .slide-builder/workflows/build-one/instructions.md (added Phase 3B: Custom Build)
- .slide-builder/single/plan.yaml (updated for Venn diagram test)
- .slide-builder/single/slide.html (custom Venn diagram slide generated)
- .slide-builder/status.yaml (updated last_action, history)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete, Test Gate PASSED | Dev Agent (Claude Opus 4.5) |
