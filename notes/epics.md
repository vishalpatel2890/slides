# Slide Builder - Epic Breakdown

**Author:** Vishal
**Date:** 2026-01-26
**Project Level:** Developer Tool / CLI Framework
**Target Scale:** MVP (Single User, Local-First)

---

## Overview

This document provides the complete epic and story breakdown for Slide Builder, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. Architecture context has been incorporated. UX Design context can be added later via update workflow.

**Workflow Mode:** CREATE (Initial epic breakdown)
**Available Context:** PRD + Architecture

---

## Functional Requirements Inventory

| FR | Description |
|----|-------------|
| **Theme Management** | |
| FR1 | Users can create a new theme by providing brand assets (website URL, PDF, images) and a brief description |
| FR2 | System extracts colors, typography, and visual patterns from provided brand assets |
| FR3 | System generates a complete theme file with all primitives (colors, typography, shapes, icons, layouts) |
| FR4 | System generates a 6-slide sample deck demonstrating all theme primitives |
| FR5 | Users can provide high-level feedback on sample deck ("too corporate", "colors off") |
| FR6 | System interprets gestalt feedback and updates theme accordingly |
| FR7 | System regenerates sample deck after theme updates for re-validation |
| FR8 | Users can view current theme summary via `/theme` command |
| FR9 | Users can modify existing theme via `/theme-edit` with same feedback loop |
| FR10 | System maintains theme version history with timestamps and change notes |
| FR11 | Users can rollback to previous theme version |
| **Planning - Single Slide** | |
| FR12 | Users can initiate single-slide planning via `/plan-one` |
| FR13 | Users can describe desired slide content in natural language |
| FR14 | System confirms understanding and captures slide intent |
| FR15 | Single-slide plan persists for building |
| **Planning - Full Deck** | |
| FR16 | Users can initiate deck planning via `/plan-deck` |
| FR17 | Users can describe presentation purpose, audience, and key points |
| FR18 | System proposes narrative structure with slide-by-slide breakdown |
| FR19 | Users can add, remove, or reorder slides in the plan |
| FR20 | Users can modify individual slide descriptions in the plan |
| FR21 | Deck plan persists with full narrative structure |
| **Building** | |
| FR22 | Users can build a single slide via `/build-one` |
| FR23 | In deck mode, `/build-one` builds the next unbuilt slide in plan |
| FR24 | In single mode, `/build-one` builds the planned slide |
| FR25 | Users can build all remaining slides via `/build-all` (deck mode only) |
| FR26 | System generates HTML/JS slides using theme primitives |
| FR27 | System selects appropriate layout template based on content type |
| FR28 | System can create custom layouts for complex content |
| FR29 | Generated slides render at 1920x1080 (16:9) |
| FR30 | System tracks build progress (which slides are complete) |
| **Slide Output** | |
| FR31 | Generated slides are valid HTML/JS viewable in any modern browser |
| FR32 | All text elements in slides are editable via `contenteditable` |
| FR33 | Text edits are auto-saved to slide state file |
| FR34 | Slides include all visual elements (boxes, arrows, icons, images) as specified |
| FR35 | Slides follow theme primitives consistently (colors, fonts, shapes) |
| FR36 | Each slide is a self-contained HTML file |
| **Editing** | |
| FR37 | Users can edit any slide via `/edit [slide-number]` |
| FR38 | Users can describe layout changes in natural language |
| FR39 | System regenerates slide layout while preserving user's text edits |
| FR40 | Users can edit text directly in browser without AI round-trip |
| FR41 | Text edits persist across layout regenerations |
| **Export** | |
| FR42 | Users can export deck to Google Slides via `/export` |
| FR43 | System converts HTML slides to images (PNG/JPG) |
| FR44 | System creates new Google Slides presentation via API |
| FR45 | System uploads each slide image at full slide dimensions |
| FR46 | Export process provides progress feedback |
| FR47 | System returns link to created Google Slides presentation |
| **Framework Architecture** | |
| FR48 | Each command maps to a workflow definition (workflow.yaml) |
| FR49 | Workflows have associated instruction files (instructions.md) |
| FR50 | Workflows execute in phases with checkpoint approvals |
| FR51 | State is persisted in YAML status files |
| FR52 | Framework is extensible for new workflows/commands |

**Total:** 52 Functional Requirements

---

## FR Coverage Map

| Epic | Title | FRs Covered |
|------|-------|-------------|
| 1 | Foundation & Framework | FR48-52 |
| 2 | Theme Creation | FR1-7 |
| 3 | Single Slide Workflow | FR12-15, FR22, FR24, FR26-29, FR31-36 |
| 4 | Slide Editing | FR37-41 |
| 5 | Full Deck Mode | FR16-21, FR23, FR25, FR30 |
| 6 | Theme Management | FR8-11 |
| 7 | Google Slides Export | FR42-47 |

**Coverage Validation:** All 52 FRs mapped to epics ✓

---

## Epics Summary

| Epic | Title | Stories | User Value |
|------|-------|---------|------------|
| 1 | Foundation & Framework | 4 | Framework scaffolded, ready for workflows |
| 2 | Theme Creation | 5 | User has brand-perfect theme from their assets |
| 3 | Single Slide Workflow | 5 | User can create and view a single branded slide |
| 4 | Slide Editing | 3 | User can refine slides with text and layout changes |
| 5 | Full Deck Mode | 4 | User can plan and build a complete presentation |
| 6 | Theme Management | 4 | User can view, edit, and version their themes |
| 7 | Google Slides Export | 4 | User can export deck to Google Slides |

**Total:** 7 Epics, 29 Stories

---

## Epic 1: Foundation & Framework

**Goal:** Establish the project structure, BMAD-pattern workflow framework, and core infrastructure that enables all subsequent workflows.

**User Value:** Framework is scaffolded and ready for theme creation and slide generation workflows.

**FRs Covered:** FR48, FR49, FR50, FR51, FR52

### Story 1.1: Project Structure Scaffolding

As a **developer**,
I want **the Slide Builder directory structure created following BMAD patterns**,
So that **all workflows have a consistent home and state files have designated locations**.

**Acceptance Criteria:**

**Given** the user runs the initialization command
**When** the scaffolding completes
**Then** the following directory structure exists:
```
.slide-builder/
├── workflows/
├── templates/
├── samples/
├── single/
├── deck/slides/
├── credentials/
└── theme-history/
```

**And** a `.gitignore` file includes `.slide-builder/credentials/` and `node_modules/`
**And** a `package.json` exists with puppeteer and googleapis dependencies

**Prerequisites:** None (first story)

**Technical Notes:**
- Per Architecture: Mirror `.bmad/` structure exactly
- Create all directories in single mkdir -p command
- Initialize npm and install dependencies

**Frontend Test Hint:** Run `/setup` and verify no "directory not found" errors occur; check file explorer shows structure.

---

### Story 1.2: Workflow Definition Pattern

As a **developer**,
I want **a standardized workflow pattern with workflow.yaml and instructions.md files**,
So that **all commands follow the same BMAD execution model**.

**Acceptance Criteria:**

**Given** a workflow directory (e.g., `.slide-builder/workflows/setup/`)
**When** the workflow is invoked
**Then** the system reads `workflow.yaml` for configuration
**And** loads `instructions.md` for execution logic
**And** follows the step-by-step instructions with checkpoint approvals

**Given** the workflow.yaml contains phase definitions
**When** executing the workflow
**Then** each phase completes before the next begins
**And** user approval is requested at checkpoint tags

**Prerequisites:** Story 1.1

**Technical Notes:**
- Per Architecture ADR-001: 100% BMAD pattern alignment
- workflow.yaml contains: name, description, instructions path, config
- instructions.md contains: `<workflow><step n="N">` XML structure

**Frontend Test Hint:** Create a test workflow, invoke it via slash command, verify steps execute in order with checkpoints.

---

### Story 1.3: State File Management

As a **developer**,
I want **YAML-based state files for tracking workflow progress**,
So that **builds are recoverable and progress is human-readable**.

**Acceptance Criteria:**

**Given** a workflow is executing
**When** state changes occur (slide built, plan created, etc.)
**Then** the state is written to appropriate YAML file (status.yaml, plan.yaml)
**And** the file includes timestamps and action descriptions

**Given** a previous workflow was interrupted
**When** the user resumes
**Then** the system reads the state file and continues from last checkpoint

**Given** a user wants to inspect progress
**When** they open any state YAML file
**Then** the content is human-readable with clear structure

**Prerequisites:** Story 1.1

**Technical Notes:**
- Per Architecture: status.yaml tracks mode, current_slide, total_slides, built_count, last_action, history
- plan.yaml tracks deck_name, audience, purpose, slides array with intent and status
- All timestamps in ISO 8601 format

**Frontend Test Hint:** Run a partial build, check status.yaml shows correct progress, resume and verify continuation.

---

### Story 1.4: Slash Command Registration

As a **user**,
I want **slash commands (`/setup`, `/plan`, `/build`, etc.) to invoke workflows**,
So that **I can use the framework through simple CLI commands**.

**Acceptance Criteria:**

**Given** the Slide Builder framework is installed
**When** the user types `/setup` in Claude Code
**Then** the setup workflow is invoked

**Given** any registered slash command is entered
**When** the command is recognized
**Then** the corresponding workflow.yaml is loaded and executed

**And** unrecognized commands show helpful error with available commands list

**Prerequisites:** Story 1.2

**Technical Notes:**
- Commands map to workflow directories: `/setup` → `workflows/setup/`
- Per PRD: `/setup`, `/theme`, `/theme-edit`, `/plan`, `/plan-one`, `/plan-deck`, `/build-one`, `/build-all`, `/edit`, `/export`
- Framework extensible for new commands (FR52)

**Frontend Test Hint:** Type `/setup` and verify workflow begins; type invalid command and verify error lists valid options.

---

## Epic 2: Theme Creation

**Goal:** Enable users to create a complete brand theme by providing assets and giving high-level feedback on generated samples.

**User Value:** User has a brand-perfect theme.json and verified layout templates ready for slide generation.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

### Story 2.1: Brand Asset Input Collection

As a **Solutions Consultant**,
I want **to provide my brand assets (website URL, PDF, images) and a brief description**,
So that **the system can extract my brand's visual DNA**.

**Acceptance Criteria:**

**Given** the user runs `/setup`
**When** prompted for brand inputs
**Then** they can provide:
- Website URL (optional)
- PDF file path (optional)
- Image file paths (optional)
- Brief brand description (required)

**And** at least one visual asset (URL, PDF, or image) must be provided
**And** the system confirms all inputs before proceeding

**Given** a website URL is provided
**When** processing inputs
**Then** the system fetches and analyzes the page via WebFetch

**Given** PDF or image files are provided
**When** processing inputs
**Then** the system analyzes them via Claude vision

**Prerequisites:** Epic 1 complete

**Technical Notes:**
- Per Architecture Pattern 1: Multiple input sources processed in parallel
- WebFetch for URLs, Claude vision for PDFs/images
- Store input source list in theme.json meta.sources

**Frontend Test Hint:** Run `/setup`, provide a website URL, verify system acknowledges and begins analysis.

---

### Story 2.2: Brand Primitive Extraction

As a **system**,
I want **to extract colors, typography, and visual patterns from brand assets**,
So that **I can generate a complete theme file**.

**Acceptance Criteria:**

**Given** brand assets have been collected
**When** the extraction process runs
**Then** the system identifies:
- Primary, secondary, accent colors
- Background colors (default, alternate)
- Text colors (heading, body)
- Font families (heading, body, mono)
- Typography scale (hero, h1, h2, body sizes)
- Shape styles (corner radius, shadows, borders)
- Arrow styles (stroke width, head type)

**And** the system infers brand personality (bold, minimal, corporate, playful)
**And** creates semantic style mappings (what style for "emphasis", "callout", etc.)

**Given** conflicting signals from multiple sources
**When** making decisions
**Then** the system uses the brief description to resolve ambiguity
**And** documents reasoning in extraction notes

**Prerequisites:** Story 2.1

**Technical Notes:**
- Per Architecture theme.json schema: colors, typography, shapes, layouts sections
- Use Claude vision for PDF/image analysis
- Use WebFetch + CSS parsing for website analysis
- Brand personality guides default choices

**Frontend Test Hint:** After extraction, system displays extracted primitives; user can see colors, fonts identified.

---

### Story 2.3: Theme File Generation

As a **system**,
I want **to generate a complete theme.json with all primitives**,
So that **slides can be generated consistently**.

**Acceptance Criteria:**

**Given** brand primitives have been extracted
**When** the theme file is generated
**Then** `.slide-builder/theme.json` contains:
- meta: name, version, created date, sources list
- colors: primary, secondary, accent, background (default/alt), text (heading/body)
- typography: fonts (heading/body/mono), scale (hero/h1/h2/body)
- shapes: boxes (default/callout with cornerRadius, shadow), arrows (strokeWidth, headType)
- layouts: references to template files

**And** the theme file is valid JSON
**And** all CSS custom properties can be derived from the theme

**Prerequisites:** Story 2.2

**Technical Notes:**
- Per Architecture: Theme stored at `.slide-builder/theme.json`
- CSS variables pattern: `--color-primary`, `--font-heading`, etc.
- Version starts at "1.0"

**Frontend Test Hint:** Open theme.json and verify all sections populated; no null or placeholder values.

---

### Story 2.4: Sample Deck Generation

As a **user**,
I want **to see a 6-slide sample deck demonstrating my theme**,
So that **I can visually validate the extracted brand before building real slides**.

**Acceptance Criteria:**

**Given** a theme.json has been generated
**When** the sample deck generation runs
**Then** 6 HTML slides are created in `.slide-builder/samples/`:

| Slide | Purpose | Tests |
|-------|---------|-------|
| sample-1-title.html | Title slide | Hero typography, primary color, background |
| sample-2-list.html | Agenda/List | Body text, bullet styling, spacing |
| sample-3-flow.html | Process flow | Arrows, boxes, connectors |
| sample-4-columns.html | Comparison | Multiple box styles, alignment |
| sample-5-callout.html | Key insight | Callout box, accent color, emphasis |
| sample-6-code.html | Technical | Mono font, dark background variant |

**And** each slide renders at 1920x1080
**And** each slide uses theme primitives via CSS variables
**And** slides open in browser for preview

**Prerequisites:** Story 2.3

**Technical Notes:**
- Per Architecture: Invoke frontend-design skill to generate sample slides
- Slides saved to `.slide-builder/samples/`
- These become layout templates after approval (copied to templates/)
- Per PRD: Sample deck demonstrates ALL primitives

**Frontend Test Hint:** Open each sample-N.html in browser; verify they display correctly with brand colors/fonts.

---

### Story 2.5: Theme Feedback Loop

As a **user**,
I want **to provide high-level feedback ("too corporate", "colors off") and see updated samples**,
So that **the theme matches my vision without micro-managing details**.

**Acceptance Criteria:**

**Given** the sample deck is displayed
**When** the user provides gestalt feedback
**Then** the system interprets the feedback and adjusts theme primitives:
- "Too corporate" → Softer colors, rounded corners, warmer tones
- "Not bold enough" → Higher contrast, stronger colors, sharper edges
- "Colors off" → Re-extract with different weights, ask for clarification

**And** the system regenerates the sample deck with updated theme
**And** presents new samples for re-validation

**Given** the user approves the samples
**When** they confirm "Perfect" or "Approved"
**Then** the theme is locked (saved to theme.json)
**And** sample slides are copied to templates/ as layout templates
**And** setup workflow completes with success message

**Given** feedback exceeds 3 rounds
**When** user is still not satisfied
**Then** offer direct theme.json editing as escape hatch (power user path)

**Prerequisites:** Story 2.4

**Technical Notes:**
- Per PRD: Target 1-3 feedback rounds
- Per Architecture ADR-002: Templates generated during setup, reused during build
- Copy approved samples to templates/ with layout-{name}.html naming
- Save theme version to theme-history/

**Frontend Test Hint:** Give feedback "make it bolder", see new samples with higher contrast; approve and verify templates created.

---

## Epic 3: Single Slide Workflow

**Goal:** Enable users to quickly plan, build, and view a single slide using their theme.

**User Value:** User can create a brand-perfect slide in the fastest possible path.

**FRs Covered:** FR12, FR13, FR14, FR15, FR22, FR24, FR26, FR27, FR28, FR29, FR31, FR32, FR33, FR34, FR35, FR36

### Story 3.1: Single Slide Planning

As a **Solutions Consultant**,
I want **to describe a single slide I need in natural language**,
So that **I can quickly get one slide without planning a full deck**.

**Acceptance Criteria:**

**Given** a theme exists (theme.json)
**When** the user runs `/plan-one`
**Then** they are prompted to describe the slide they want

**Given** the user describes their slide (e.g., "An architecture diagram showing our 3-tier system")
**When** the description is submitted
**Then** the system confirms understanding by summarizing:
- Slide purpose
- Key content elements
- Suggested layout template (or "custom" if no template fits)

**And** the intent is saved to `.slide-builder/single/plan.yaml`
**And** status.yaml is updated with mode: "single"

**Given** no theme exists
**When** user runs `/plan-one`
**Then** error message directs them to run `/setup` first

**Prerequisites:** Epic 2 complete (theme exists)

**Technical Notes:**
- Per Architecture Pattern 2: Match intent against template patterns
- Single mode uses `.slide-builder/single/` directory
- plan.yaml contains: intent, suggested_template, created timestamp

**Frontend Test Hint:** Run `/plan-one`, describe "a timeline showing 3 project phases", verify plan.yaml created.

---

### Story 3.2: Template-Based Slide Building

As a **system**,
I want **to generate a slide using an existing layout template**,
So that **brand consistency is guaranteed and generation is fast**.

**Acceptance Criteria:**

**Given** a single-slide plan exists with a matching template
**When** the user runs `/build-one`
**Then** the system:
1. Loads the matching template from `.slide-builder/templates/`
2. Injects slide content into template placeholders
3. Applies theme CSS variables
4. Saves to `.slide-builder/single/slide.html`

**And** the slide renders at 1920x1080 (16:9)
**And** all text elements have `contenteditable="true"` and `data-field` attributes
**And** status.yaml is updated with last_action

**Given** the slide is generated
**When** the user opens it in browser
**Then** it displays correctly with no layout issues

**Prerequisites:** Story 3.1

**Technical Notes:**
- Per Architecture: Template files use {{theme.colors.primary}} style placeholders
- Per Architecture HTML Slide Pattern: Include auto-save script for contenteditable
- Layout template decision logged in status.yaml

**Frontend Test Hint:** Run `/build-one`, open slide.html in browser, verify correct layout and brand styling.

---

### Story 3.3: Custom Slide Building

As a **system**,
I want **to generate a custom slide layout for complex content**,
So that **users aren't limited to predefined templates**.

**Acceptance Criteria:**

**Given** a single-slide plan exists with no matching template
**When** the user runs `/build-one`
**Then** the system:
1. Invokes the frontend-design skill with slide intent and theme
2. Generates custom HTML layout
3. Applies theme CSS variables
4. Saves to `.slide-builder/single/slide.html`

**And** the custom slide follows all theme primitives (colors, fonts, shapes)
**And** the slide renders at 1920x1080
**And** all text elements have contenteditable attributes

**Given** a complex diagram or unique layout is requested
**When** the frontend-design skill generates the slide
**Then** the output is production-quality, not placeholder

**Prerequisites:** Story 3.1, Story 3.2

**Technical Notes:**
- Per Architecture ADR-002: Custom slides via frontend-design skill when templates don't match
- Pass full theme.json to skill for consistency
- Log "custom layout generated" in status.yaml

**Frontend Test Hint:** Plan a complex slide ("Venn diagram showing overlap of 3 concepts"), build it, verify custom layout generated.

---

### Story 3.4: Slide Preview in Browser

As a **user**,
I want **to preview my generated slide in a web browser**,
So that **I can see exactly how it looks before using it**.

**Acceptance Criteria:**

**Given** a slide has been built
**When** the build completes
**Then** the system provides the file path and offers to open in browser

**Given** the user opens the slide HTML file
**When** viewed in Chrome, Firefox, or Safari
**Then** the slide renders correctly at 1920x1080
**And** all elements display as designed
**And** text is editable via click

**And** slides are self-contained (no external dependencies except Google Fonts)

**Prerequisites:** Story 3.2 or 3.3

**Technical Notes:**
- Per Architecture: Slides are self-contained HTML files
- Per NFR18: Must work in Chrome, Firefox, Safari
- Include viewport meta tag for correct sizing

**Frontend Test Hint:** Open slide.html in multiple browsers, verify consistent rendering.

---

### Story 3.5: Text Auto-Save

As a **user**,
I want **my text edits to be automatically saved**,
So that **I don't lose changes when I close the browser**.

**Acceptance Criteria:**

**Given** a slide is open in the browser
**When** the user edits text via contenteditable
**Then** changes are captured on blur event

**And** edits are saved to `.slide-builder/single/slide-state.json`
**And** state file includes:
- selector (data-field attribute value)
- content (edited text)
- lastModified timestamp

**Given** the user reopens the slide later
**When** the slide loads
**Then** saved edits are applied from state file

**Prerequisites:** Story 3.2 or 3.3

**Technical Notes:**
- Per Architecture Pattern 3: State file per slide tracks edits
- Use localStorage as intermediate, sync to file on interval
- JSON structure: { slide: 1, edits: [{selector, content}], lastModified }

**Frontend Test Hint:** Edit slide title in browser, close browser, reopen slide, verify edit persisted.

---

## Epic 4: Slide Editing

**Goal:** Enable users to refine slides through both inline text editing and prompt-based layout changes.

**User Value:** User can perfect any slide without regenerating from scratch.

**FRs Covered:** FR37, FR38, FR39, FR40, FR41

### Story 4.1: Edit Command Invocation

As a **user**,
I want **to invoke editing on a specific slide via `/edit [n]`**,
So that **I can refine any slide in my deck or single slide**.

**Acceptance Criteria:**

**Given** slides exist (single mode or deck mode)
**When** the user runs `/edit` (no number, single mode)
**Then** the single slide is loaded for editing

**When** the user runs `/edit 3` (deck mode)
**Then** slide 3 is loaded for editing

**Given** an invalid slide number is provided
**When** `/edit 99` is run but only 5 slides exist
**Then** error message shows valid range (1-5)

**And** the current slide content is displayed
**And** user is prompted for edit instructions

**Prerequisites:** Epic 3 complete (slides exist)

**Technical Notes:**
- Per Architecture Pattern 4: Detect mode from state files
- Load slide HTML and state JSON
- Display current layout summary

**Frontend Test Hint:** Run `/edit` on existing slide, verify current content displayed and edit prompt appears.

---

### Story 4.2: Natural Language Layout Changes

As a **user**,
I want **to describe layout changes in plain English**,
So that **I can modify slide structure without technical knowledge**.

**Acceptance Criteria:**

**Given** a slide is loaded for editing
**When** the user describes a layout change (e.g., "Move the diagram to the right", "Add a fourth column", "Make the title bigger")
**Then** the system:
1. Reads current slide HTML
2. Reads existing text edits from state file
3. Regenerates layout based on instruction
4. Preserves all user text edits by reapplying them
5. Saves updated HTML

**And** the regenerated slide maintains theme consistency
**And** user text content is not lost

**Given** the user makes multiple edit requests
**When** each request is processed
**Then** previous text edits continue to persist

**Prerequisites:** Story 4.1

**Technical Notes:**
- Per Architecture Pattern 3: Read state file → generate → reapply edits
- Use data-field selectors to match content
- Invoke frontend-design skill for layout regeneration

**Frontend Test Hint:** Edit a slide title, run `/edit` with "add a subtitle", verify title edit preserved and subtitle added.

---

### Story 4.3: Edit Preservation Across Regenerations

As a **user**,
I want **my text edits to survive layout regenerations**,
So that **I don't have to re-enter content when I change the layout**.

**Acceptance Criteria:**

**Given** a slide has user text edits in state file
**When** a layout regeneration occurs via `/edit`
**Then** the system:
1. Reads all edits from slide-state.json
2. Generates new layout HTML
3. Matches data-field selectors to new HTML elements
4. Injects saved content into matching elements
5. Saves updated HTML and preserves state file

**Given** a field is removed in the new layout
**When** no matching selector exists
**Then** the orphaned edit is preserved in state file (not deleted)
**And** a warning is logged

**Given** new fields are added in the new layout
**When** they have no saved edits
**Then** they use default generated content

**Prerequisites:** Story 4.2

**Technical Notes:**
- Per Architecture: State file uses data-field selectors
- Never delete state entries, only add/update
- Log warnings for orphaned edits to status.yaml

**Frontend Test Hint:** Edit 3 text fields, change layout via `/edit`, verify all 3 edits appear in new layout.

---

## Epic 5: Full Deck Mode

**Goal:** Enable users to plan and build complete presentation decks with multiple slides.

**User Value:** User can create a full, cohesive presentation following their narrative structure.

**FRs Covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR23, FR25, FR30

### Story 5.1: Deck Planning Initiation

As a **Solutions Consultant**,
I want **to describe my presentation purpose and audience**,
So that **the system can propose an appropriate narrative structure**.

**Acceptance Criteria:**

**Given** a theme exists
**When** the user runs `/plan-deck`
**Then** they are prompted for:
- Presentation purpose (e.g., "Partnership pitch to CustomerCo")
- Target audience (e.g., "Technical decision makers")
- Key points to convey (bullet list)
- Desired length (optional, defaults to 6-10 slides)

**And** the system proposes a narrative structure with slide-by-slide breakdown

**Given** the narrative is proposed
**When** displayed to user
**Then** each slide shows:
- Slide number
- Title/purpose
- Key content description
- Suggested template

**Prerequisites:** Epic 2 complete

**Technical Notes:**
- Per PRD: Story-first planning captures narrative, not layout
- Per Architecture: Save to `.slide-builder/deck/plan.yaml`
- status.yaml updated with mode: "deck"

**Frontend Test Hint:** Run `/plan-deck`, describe a pitch, verify narrative structure proposed with 6-10 slides.

---

### Story 5.2: Plan Modification

As a **user**,
I want **to add, remove, and reorder slides in my plan**,
So that **the narrative matches my exact intent**.

**Acceptance Criteria:**

**Given** a deck plan has been proposed
**When** the user requests changes
**Then** they can:
- Add a slide: "Add a slide about ROI after slide 3"
- Remove a slide: "Remove slide 5"
- Reorder slides: "Move the timeline to be slide 2"
- Modify description: "Change slide 3 to focus on security"

**And** the plan is updated and redisplayed
**And** plan.yaml is saved with changes

**Given** multiple modifications are requested
**When** all changes are made
**Then** slide numbers are automatically renumbered
**And** the narrative flow is maintained

**Prerequisites:** Story 5.1

**Technical Notes:**
- Plan modifications update plan.yaml
- Renumber all slides after changes
- Preserve any already-built slides (don't change their numbers)

**Frontend Test Hint:** Create plan, add a slide, remove a slide, verify plan updates correctly.

---

### Story 5.3: Incremental Slide Building

As a **user**,
I want **to build slides one at a time with `/build-one`**,
So that **I can review and approve each slide before continuing**.

**Acceptance Criteria:**

**Given** a deck plan exists with unbuilt slides
**When** the user runs `/build-one`
**Then** the system:
1. Identifies the next unbuilt slide from plan.yaml
2. Generates the slide (template or custom)
3. Saves to `.slide-builder/deck/slides/slide-{n}.html`
4. Updates plan.yaml slide status to "built"
5. Updates status.yaml with progress

**And** the built slide is displayed/opened for preview
**And** the user is shown remaining slide count

**Given** all slides are already built
**When** the user runs `/build-one`
**Then** message indicates "All slides built" with next steps

**Prerequisites:** Story 5.1

**Technical Notes:**
- Per Architecture: deck/slides/ directory for slide storage
- Each slide has corresponding state JSON
- Track build progress in status.yaml

**Frontend Test Hint:** Run `/build-one` multiple times, verify slides build in order, status shows progress.

---

### Story 5.4: Batch Slide Building

As a **user**,
I want **to build all remaining slides at once with `/build-all`**,
So that **I can generate my entire deck quickly**.

**Acceptance Criteria:**

**Given** a deck plan exists with unbuilt slides
**When** the user runs `/build-all`
**Then** the system:
1. Iterates through all unbuilt slides in order
2. Generates each slide (template or custom)
3. Saves each to deck/slides/
4. Updates plan.yaml statuses
5. Reports progress during generation

**And** all slides are generated
**And** summary shows total slides built and time taken
**And** user is prompted to review

**Given** an error occurs during batch generation
**When** a specific slide fails
**Then** the error is logged
**And** generation continues with next slide
**And** failed slide is marked for retry

**Prerequisites:** Story 5.3

**Technical Notes:**
- Per NFR14: Partial builds are recoverable
- Log each slide completion to status.yaml history
- Continue on error, don't abort entire batch

**Frontend Test Hint:** Create 5-slide plan, run `/build-all`, verify all 5 slides generated.

---

## Epic 6: Theme Management

**Goal:** Enable users to view, modify, and version their themes for ongoing refinement.

**User Value:** User can evolve their brand theme over time without starting over.

**FRs Covered:** FR8, FR9, FR10, FR11

### Story 6.1: Theme Summary View

As a **user**,
I want **to view my current theme summary via `/theme`**,
So that **I can see what brand settings are in use**.

**Acceptance Criteria:**

**Given** a theme.json exists
**When** the user runs `/theme`
**Then** the system displays a human-readable summary:
- Theme name and version
- Creation date and sources
- Primary, secondary, accent colors (with swatches if terminal supports)
- Font families
- Shape styles (corner radius, shadow style)
- Available layout templates

**And** the output is formatted for terminal readability
**And** path to full theme.json is shown

**Given** no theme exists
**When** the user runs `/theme`
**Then** message directs them to run `/setup`

**Prerequisites:** Epic 2 complete

**Technical Notes:**
- Read theme.json and format for display
- Use ANSI colors for color swatches if supported
- Show template file list from layouts section

**Frontend Test Hint:** Run `/theme`, verify all theme sections displayed in readable format.

---

### Story 6.2: Theme Editing

As a **user**,
I want **to modify my theme via `/theme-edit` with the same feedback loop**,
So that **I can refine my brand settings without full re-setup**.

**Acceptance Criteria:**

**Given** a theme exists
**When** the user runs `/theme-edit`
**Then** they can describe desired changes:
- "Make the colors warmer"
- "Use a bolder font for headings"
- "Increase the corner radius"

**And** the system interprets feedback and updates theme.json
**And** sample slides are regenerated for validation
**And** user can approve or provide more feedback

**Given** the user approves changes
**When** confirmed
**Then** theme.json is updated
**And** templates are regenerated if needed
**And** a version entry is created in theme-history

**Prerequisites:** Story 6.1

**Technical Notes:**
- Per PRD: Same feedback loop as setup
- Per Architecture: Save to theme-history before modifying
- Update templates if shape/layout changes

**Frontend Test Hint:** Run `/theme-edit`, request "bolder colors", verify samples regenerate with changes.

---

### Story 6.3: Theme Version History

As a **system**,
I want **to maintain theme version history with timestamps**,
So that **users can track changes and rollback if needed**.

**Acceptance Criteria:**

**Given** a theme change is made (setup or edit)
**When** the theme is saved
**Then** a timestamped copy is saved to `.slide-builder/theme-history/`:
- Filename: `theme-v{N}-{YYYY-MM-DD}.json`
- Version number increments automatically
- Original theme.json includes change notes

**And** the theme.json meta.version is updated
**And** history directory maintains all versions

**Given** the user wants to see history
**When** they list theme-history directory
**Then** all previous versions are visible with dates

**Prerequisites:** Story 6.2

**Technical Notes:**
- Per Architecture: theme-history/ directory
- Per NFR15: Theme changes don't corrupt existing slides
- Existing slides keep working with their embedded CSS variables

**Frontend Test Hint:** Make 3 theme edits, verify theme-history/ has 3 version files with correct dates.

---

### Story 6.4: Theme Rollback

As a **user**,
I want **to rollback to a previous theme version**,
So that **I can undo unwanted changes**.

**Acceptance Criteria:**

**Given** theme history exists with multiple versions
**When** the user requests rollback (e.g., "rollback to version 2")
**Then** the system:
1. Copies specified version from history to theme.json
2. Regenerates sample slides with restored theme
3. Displays samples for confirmation

**And** user can approve or cancel rollback
**And** the rolled-back state becomes a new version (not overwrite)

**Given** invalid version is requested
**When** version doesn't exist in history
**Then** error shows available versions

**Prerequisites:** Story 6.3

**Technical Notes:**
- Rollback creates new version entry (v4 might be rollback to v2)
- Never delete history entries
- Regenerate templates after rollback

**Frontend Test Hint:** Create 3 versions, rollback to v1, verify theme matches v1 and v4 created in history.

---

## Epic 7: Google Slides Export

**Goal:** Enable users to export their completed decks to Google Slides for sharing and presentation.

**User Value:** User gets their slides in Google Slides, ready for presenting or sharing.

**FRs Covered:** FR42, FR43, FR44, FR45, FR46, FR47

### Story 7.1: Google OAuth Setup

As a **user**,
I want **to authenticate with Google once**,
So that **I can export decks without repeated login prompts**.

**Acceptance Criteria:**

**Given** the user runs `/export` for the first time
**When** no credentials exist
**Then** the system:
1. Guides user through OAuth flow
2. Opens browser for Google authentication
3. Requests presentations scope
4. Saves tokens to `.slide-builder/credentials/google-oauth.json`

**And** tokens are stored securely (gitignored)
**And** subsequent exports use saved tokens

**Given** tokens have expired
**When** export is attempted
**Then** tokens are refreshed automatically
**Or** user is prompted to re-authenticate if refresh fails

**Prerequisites:** Epic 5 complete (slides exist)

**Technical Notes:**
- Per Architecture: googleapis OAuth 2.0
- Scope: https://www.googleapis.com/auth/presentations
- Per NFR7: Credentials stored securely
- Per NFR11: Not in plain text in repo

**Frontend Test Hint:** Run `/export` first time, complete OAuth, verify credentials file created (gitignored).

---

### Story 7.2: HTML to Image Conversion

As a **system**,
I want **to convert HTML slides to images**,
So that **they can be uploaded to Google Slides**.

**Acceptance Criteria:**

**Given** slides exist (single or deck mode)
**When** export process runs
**Then** the system:
1. Launches Puppeteer headless browser
2. Opens each slide HTML file
3. Sets viewport to 1920x1080
4. Takes screenshot at full resolution
5. Saves as PNG to temp directory

**And** all slides are converted
**And** images are 1920x1080 resolution
**And** progress is reported during conversion

**Given** Puppeteer is not installed
**When** conversion fails
**Then** helpful error guides user to install dependencies

**Prerequisites:** Story 7.1

**Technical Notes:**
- Per Architecture ADR-004: Puppeteer for screenshots
- Per NFR10: Headless browser conversion
- Batch process all slides in one browser session for efficiency

**Frontend Test Hint:** Run export, verify PNG files created at correct resolution.

---

### Story 7.3: Google Slides Creation

As a **system**,
I want **to create a new Google Slides presentation and upload images**,
So that **users get their deck in a shareable format**.

**Acceptance Criteria:**

**Given** slide images have been generated
**When** the upload process runs
**Then** the system:
1. Creates new presentation via Google Slides API
2. For each image:
   - Creates a blank slide
   - Uploads image at full size (1920x1080)
   - Positions image to cover entire slide
3. Returns presentation URL

**And** slides appear in correct order
**And** images are full-bleed (no borders/margins)

**Given** API rate limits are hit
**When** uploads are throttled
**Then** system waits and retries
**And** progress updates show wait status

**Prerequisites:** Story 7.2

**Technical Notes:**
- Per Architecture API Contracts: POST /presentations, batchUpdate
- Per NFR8: Handle rate limits gracefully
- Per NFR16: Export failure doesn't lose local data

**Frontend Test Hint:** Complete export, open Google Slides link, verify all slides present at full quality.

---

### Story 7.4: Export Progress and Completion

As a **user**,
I want **to see progress during export and get the final link**,
So that **I know the export is working and can access my slides**.

**Acceptance Criteria:**

**Given** an export is in progress
**When** each step completes
**Then** the user sees:
- "Converting slide 1 of 7..."
- "Converting slide 2 of 7..."
- "Uploading to Google Slides..."
- "Creating presentation..."
- "Uploading slide 1 of 7..."

**And** final message shows:
- "Export complete!"
- Google Slides URL (clickable in terminal)
- Total slides exported

**Given** an error occurs
**When** export fails partway
**Then** error message includes:
- Which step failed
- Suggested fix
- Note that local slides are preserved

**Prerequisites:** Story 7.3

**Technical Notes:**
- Per FR46: Progress feedback during export
- Per FR47: Return link when done
- Log export completion to status.yaml

**Frontend Test Hint:** Run `/export`, verify progress messages appear, final URL is provided and works.

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Create theme from brand assets | 2 | 2.1 |
| FR2 | Extract colors, typography, patterns | 2 | 2.2 |
| FR3 | Generate complete theme file | 2 | 2.3 |
| FR4 | Generate 6-slide sample deck | 2 | 2.4 |
| FR5 | Provide high-level feedback | 2 | 2.5 |
| FR6 | Interpret gestalt feedback | 2 | 2.5 |
| FR7 | Regenerate samples after updates | 2 | 2.5 |
| FR8 | View theme summary | 6 | 6.1 |
| FR9 | Modify theme via /theme-edit | 6 | 6.2 |
| FR10 | Theme version history | 6 | 6.3 |
| FR11 | Rollback to previous version | 6 | 6.4 |
| FR12 | Initiate single-slide planning | 3 | 3.1 |
| FR13 | Describe slide in natural language | 3 | 3.1 |
| FR14 | Confirm understanding | 3 | 3.1 |
| FR15 | Persist single-slide plan | 3 | 3.1 |
| FR16 | Initiate deck planning | 5 | 5.1 |
| FR17 | Describe presentation purpose | 5 | 5.1 |
| FR18 | Propose narrative structure | 5 | 5.1 |
| FR19 | Add/remove/reorder slides | 5 | 5.2 |
| FR20 | Modify slide descriptions | 5 | 5.2 |
| FR21 | Persist deck plan | 5 | 5.1 |
| FR22 | Build single slide | 3 | 3.2, 3.3 |
| FR23 | Build next unbuilt slide | 5 | 5.3 |
| FR24 | Build planned slide (single mode) | 3 | 3.2, 3.3 |
| FR25 | Build all remaining slides | 5 | 5.4 |
| FR26 | Generate HTML/JS slides | 3 | 3.2, 3.3 |
| FR27 | Select appropriate template | 3 | 3.2 |
| FR28 | Create custom layouts | 3 | 3.3 |
| FR29 | Render at 1920x1080 | 3 | 3.2, 3.3 |
| FR30 | Track build progress | 5 | 5.3, 5.4 |
| FR31 | Valid HTML/JS in browsers | 3 | 3.4 |
| FR32 | Text editable via contenteditable | 3 | 3.5 |
| FR33 | Auto-save text edits | 3 | 3.5 |
| FR34 | Include visual elements | 3 | 3.2, 3.3 |
| FR35 | Follow theme primitives | 3 | 3.2, 3.3 |
| FR36 | Self-contained HTML files | 3 | 3.4 |
| FR37 | Edit slide via /edit | 4 | 4.1 |
| FR38 | Describe layout changes | 4 | 4.2 |
| FR39 | Regenerate preserving edits | 4 | 4.3 |
| FR40 | Edit text in browser | 3 | 3.5 |
| FR41 | Edits persist across regenerations | 4 | 4.3 |
| FR42 | Export to Google Slides | 7 | 7.3 |
| FR43 | Convert HTML to images | 7 | 7.2 |
| FR44 | Create Google presentation | 7 | 7.3 |
| FR45 | Upload at full dimensions | 7 | 7.3 |
| FR46 | Progress feedback | 7 | 7.4 |
| FR47 | Return presentation link | 7 | 7.4 |
| FR48 | Command maps to workflow | 1 | 1.4 |
| FR49 | Workflows have instructions | 1 | 1.2 |
| FR50 | Phase execution with checkpoints | 1 | 1.2 |
| FR51 | State in YAML files | 1 | 1.3 |
| FR52 | Extensible framework | 1 | 1.4 |

**Coverage Validation:** All 52 FRs mapped to specific stories ✓

---

## Summary

**✅ Epic Breakdown Complete**

**Created:** epics.md with complete epic and story breakdown

| Metric | Count |
|--------|-------|
| Epics | 7 |
| Stories | 29 |
| Functional Requirements Covered | 52/52 |
| Architecture Decisions Incorporated | 8 |

**Context Incorporated:**
- ✅ PRD requirements
- ✅ Architecture technical decisions

**Epic Sequence:**
1. **Foundation & Framework** - Scaffolding and workflow patterns
2. **Theme Creation** - Brand extraction and sample validation
3. **Single Slide Workflow** - Fastest path to value
4. **Slide Editing** - Refinement capabilities
5. **Full Deck Mode** - Complete presentations
6. **Theme Management** - Ongoing brand evolution
7. **Google Slides Export** - Final delivery

**Next Steps:**
- Consider running UX Design workflow if detailed interaction specs needed
- Ready for Phase 4: Sprint Planning with `/bmad:bmm:workflows:sprint-planning`

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design workflow to incorporate interaction details if needed._

---

## Epic 8: Slide Viewer & Output Architecture

**Goal:** Enable users to view all deck slides in a unified viewer with gallery and presentation modes, while restructuring output to a clean `output/` directory at project root.

**User Value:** User can see all slides at a glance, present them sequentially, and have organized output separate from working files.

**FRs Covered:** New feature (extends FR31 slide viewing capabilities)

### Story 8.1: Output Folder Architecture

As a **slide builder user**,
I want **slides to be saved to a clean output folder structure**,
So that **viewable content is separate from working files and organized by deck**.

**Acceptance Criteria:**

**Given** a deck with deck_name "Claude Code Fundamentals"
**When** I run /sb:build-one or /sb:build-all
**Then** slides are saved to `output/claude-code-fundamentals/slides/slide-N.html`

**And** plan.yaml is copied to `output/claude-code-fundamentals/`
**And** single slides are saved to `output/singles/{slide-name}.html`
**And** the slug is generated correctly (lowercase, hyphens, no special chars)

**Prerequisites:** None (foundation story for Epic 8)

**Technical Notes:**
- Modify build-one and build-all workflow.yaml and instructions.md
- Add slug generation: lowercase, replace spaces with hyphens, remove special chars
- Create output directories if they don't exist
- Update status.yaml to track output_folder

**Files to Modify:**
- `.slide-builder/workflows/build-one/workflow.yaml`
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-all/workflow.yaml`
- `.slide-builder/workflows/build-all/instructions.md`
- `.slide-builder/status.yaml`

---

### Story 8.2: Core Viewer Component

As a **slide builder user**,
I want **an auto-generated viewer that shows all slides in gallery and presentation modes**,
So that **I can see all slides at a glance and present them sequentially**.

**Acceptance Criteria:**

**Given** slides exist in `output/{deck-slug}/slides/`
**When** I open `output/{deck-slug}/index.html`
**Then** I see a gallery grid of all slide thumbnails

**And** clicking a thumbnail enters presentation mode showing that slide
**And** prev/next buttons navigate between slides
**And** a close button returns to gallery view
**And** the viewer is auto-regenerated after each slide build

**Prerequisites:** Story 8.1 (Output Folder Architecture)

**Technical Notes:**
- Create viewer-template.html in `.slide-builder/templates/`
- Use iframe + CSS transform scale(0.208) for thumbnails (per samples/index.html pattern)
- Add viewer generation step to build-one and build-all instructions
- Scan for slide-*.html files, sort numerically, generate viewer

**Files to Create:**
- `.slide-builder/templates/viewer-template.html`

**Files to Modify:**
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-all/instructions.md`

**Reference Code:**
- `.slide-builder/samples/index.html:106-147` - Gallery CSS and iframe thumbnail pattern

---

### Story 8.3: Presentation Mode Polish

As a **slide builder user**,
I want **enhanced presentation mode with sidebar, keyboard nav, and smooth transitions**,
So that **I have a polished, professional presentation experience**.

**Acceptance Criteria:**

**Given** I am in presentation mode
**When** I press ArrowRight
**Then** the next slide displays with a smooth transition

**And** a thumbnail sidebar shows all slides with the current one highlighted
**And** clicking a sidebar thumbnail jumps to that slide
**And** Escape returns to gallery
**And** F toggles fullscreen
**And** number keys 1-9 jump to that slide
**And** Home/End go to first/last slide

**Prerequisites:** Story 8.2 (Core Viewer Component)

**Technical Notes:**
- Add CSS transitions on iframe opacity for smooth slide changes
- Implement thumbnail sidebar (200px fixed left)
- Use Fullscreen API with graceful fallback
- Match theme.json colors (dark background #0a0a0a, lime accent #d4e94c)
- Keyboard handling: ArrowLeft/Right, Escape, F, Home, End, 1-9

**Files to Modify:**
- `.slide-builder/templates/viewer-template.html`

---

## Epic 8 Story Map

```
Epic 8: Slide Viewer & Output Architecture
│
├── Story 8.1: Output Folder Architecture [Foundation]
│   └── Restructure where slides are saved
│       ├── Deck → output/{deck-slug}/slides/
│       ├── Single → output/singles/
│       └── Modify build workflows
│
├── Story 8.2: Core Viewer Component [Depends on 8.1]
│   └── Gallery + basic presentation
│       ├── Viewer template
│       ├── Gallery view (thumbnails)
│       ├── Presentation view (single slide)
│       └── Auto-generation on build
│
└── Story 8.3: Presentation Mode Polish [Depends on 8.2]
    └── Enhanced navigation & UX
        ├── Thumbnail sidebar
        ├── Keyboard navigation
        ├── Transitions
        └── Fullscreen support
```

**Dependencies:** Story 8.1 → Story 8.2 → Story 8.3 (sequential)

---

## Epic 9: Dynamic Viewer Loading

**Goal:** Enable the slide viewer to dynamically load slide data from a manifest file instead of static embedded data, eliminating the need for manual viewer regeneration.

**User Value:** User sees new or updated slides immediately upon page refresh without running regeneration scripts.

**FRs Covered:** Enhancement to FR31 (slide viewing), extends Epic 8

### Story 9.1: Dynamic Manifest-Based Viewer

As a **slide builder user**,
I want **the viewer to dynamically load slides from a manifest.json file on page load**,
So that **I don't need to manually regenerate the viewer when slides are added or modified**.

**Acceptance Criteria:**

**Given** a valid `slides/manifest.json` exists
**When** I open `index.html` via `file://` protocol
**Then** all slides from manifest are displayed in gallery

**And** the slide counter shows correct total from manifest
**And** presentation mode works with dynamically loaded slides
**And** cache-busting ensures modified slide content appears immediately on refresh

**Given** no manifest exists
**When** I open `index.html`
**Then** a user-friendly error message is displayed

**Given** `regenerate-viewer.js` is run
**When** it completes
**Then** both `index.html` and `slides/manifest.json` are created/updated

**Prerequisites:** Epic 8 complete (viewer exists)

**Technical Notes:**
- Create manifest.json format: `{deckName, generatedAt, slides: [{number, filename, title}]}`
- Modify viewer-template.html to fetch manifest via `fetch()` API
- Add cache-busting query param `?t=${Date.now()}` to all iframe URLs
- Update regenerate-viewer.js to generate manifest.json
- Create standalone generate-manifest.js utility
- Works with `file://` protocol (no server required)

**Files to Create:**
- `scripts/generate-manifest.js`
- `output/{deck-slug}/slides/manifest.json`

**Files to Modify:**
- `.slide-builder/templates/viewer-template.html`
- `scripts/regenerate-viewer.js`

**Key Code Locations:**
- Title extraction: `scripts/regenerate-viewer.js:26`
- Slide discovery: `scripts/regenerate-viewer.js:76`
- Gallery rendering: `.slide-builder/templates/viewer-template.html:347`

---

## Epic 9 Summary

| Story | Description | Status |
|-------|-------------|--------|
| 9.1 | Dynamic Manifest-Based Viewer | Ready |

**Dependencies:** Requires Epic 8 completion (viewer infrastructure)

---

## Epic 11: Template Catalog System

**Goal:** Unify samples and templates into a catalog with manifest-based discovery, enabling agent-driven template selection and user-driven template creation.

**User Value:** User can leverage existing templates intelligently and create new reusable templates on demand.

**Slug:** catalog-system

**FRs Covered:** Enhancement to FR3, FR4, FR26, FR27 (theme and template management)

### Epic Scope

**In Scope:**
- Create `config/catalog/` directory structure with manifest
- Define catalog.json schema with template metadata
- Refactor setup workflow to populate initial catalog (6 starter templates)
- Create `/sb:add-template` skill with deep conversational discovery
- Update build-one, plan-one, plan-deck, edit workflows to use catalog
- Remove deprecated `config/samples/` and `config/templates/` directories

**Out of Scope:**
- Template versioning/history
- Template sharing between projects
- Visual template browser UI
- Automatic template recommendations based on content analysis

### Success Criteria

1. `config/catalog/` exists with catalog.json and 6 HTML template files
2. catalog.json follows defined schema with all metadata fields
3. `/sb:setup` populates catalog instead of samples/templates
4. `/sb:add-template` creates new templates via conversational discovery
5. `/sb:build-one` reads catalog.json for template selection
6. Old directories (`config/samples/`, `config/templates/`) removed
7. CONVENTIONS.md documents new catalog structure

### Dependencies

- Epic 2 (Theme Creation) - Setup workflow refactoring
- Epic 3 (Single Slide) - Build workflow integration
- Epic 8 (Viewer) - Output path awareness

---

### Story 11.1: Core Catalog Infrastructure

As a **system**,
I want **a catalog directory with a structured manifest file**,
So that **templates are discoverable and have rich metadata for agent decision-making**.

**Acceptance Criteria:**

**AC #1:** Given the catalog infrastructure is created, when I check `.slide-builder/config/catalog/`, then it exists with a `catalog.json` file

**AC #2:** Given catalog.json exists, when I read it, then it follows schema:
```json
{
  "version": "1.0",
  "generated": "ISO-date",
  "lastModified": "ISO-timestamp",
  "templates": [{
    "id": "string",
    "name": "string",
    "description": "string",
    "use_cases": ["array"],
    "file": "string",
    "preview": null,
    "created_at": "ISO-timestamp",
    "source": "setup|add-template"
  }]
}
```

**AC #3:** Given CONVENTIONS.md is updated, when I read it, then it documents the catalog structure and replaces samples/templates references

**Prerequisites:** None (foundation story)

**Technical Notes:**
- Create `config/catalog/` directory
- Initialize catalog.json with empty templates array
- Update CONVENTIONS.md file structure section
- No template files created yet (Story 10.2 populates)

---

### Story 11.2: Refactor Setup Workflow for Catalog

As a **user running /sb:setup**,
I want **the workflow to generate starter templates directly into the catalog**,
So that **I have a unified template system from the start**.

**Acceptance Criteria:**

**AC #1:** Given I run `/sb:setup` and approve the theme, when sample generation completes, then 6 templates exist in `config/catalog/`:
- title.html, agenda.html, process-flow.html, comparison.html, callout.html, technical.html

**AC #2:** Given templates are generated, when I read catalog.json, then it contains 6 entries with:
- Unique IDs matching filenames
- Descriptive names and descriptions
- Relevant use_cases arrays
- source: "setup"

**AC #3:** Given setup completes, when I check status.yaml, then it reflects catalog structure (not templates/samples)

**AC #4:** Given the old directories exist, when setup completes successfully, then `config/samples/` and `config/templates/` are removed

**Prerequisites:** Story 10.1

**Technical Notes:**
- Modify setup/instructions.md Phase 4 to output to catalog/
- Generate catalog.json alongside templates
- Update status.yaml schema for catalog tracking
- Delete old directories at end of setup

---

### Story 11.3: Create /sb:add-template Skill

As a **user**,
I want **to create new templates via `/sb:add-template` with conversational discovery**,
So that **I can expand my template library for specific use cases**.

**Acceptance Criteria:**

**AC #1:** Given I run `/sb:add-template`, when the workflow starts, then I'm warmly welcomed and asked what kind of template I need

**AC #2:** Given I describe a template need, when the agent explores my requirements, then it asks about:
- Content type (data viz, text-heavy, mixed)
- Visual elements needed (charts, icons, columns)
- Reference examples or inspiration

**AC #3:** Given discovery is complete, when I confirm the spec, then:
- HTML template is generated via frontend-design skill
- Template file is saved to catalog/
- catalog.json is updated with new entry
- source is set to "add-template"

**AC #4:** Given template generation completes, when I'm offered a preview, then I can open it in browser

**Prerequisites:** Story 10.1

**Technical Notes:**
- Create `workflows/add-template/workflow.yaml` and `instructions.md`
- Create `.claude/commands/sb/add-template.md` skill registration
- Use frontend-design skill for HTML generation
- Deep conversational discovery (5+ exchange minimum)

---

### Story 11.4: Update Dependent Workflows for Catalog

As a **system**,
I want **build-one, plan-one, plan-deck, and edit workflows to use the catalog**,
So that **template selection is metadata-driven and consistent**.

**Acceptance Criteria:**

**AC #1:** Given I run `/sb:build-one` with a template type, when the workflow selects a template, then it:
- Reads catalog.json
- Matches against template `id` or `use_cases`
- Uses the matched template file

**AC #2:** Given I run `/sb:plan-one`, when I'm shown template options, then they come from catalog.json with names and descriptions

**AC #3:** Given I run `/sb:plan-deck`, when templates are suggested for slides, then suggestions reference catalog entries

**AC #4:** Given I run `/sb:edit`, when template info is needed, then it reads from catalog manifest

**AC #5:** Given a template type has no catalog match, when selection fails, then fallback to custom generation via frontend-design skill

**Prerequisites:** Stories 10.1, 10.2

**Technical Notes:**
- Modify build-one/instructions.md template mapping section
- Modify plan-one/instructions.md template display
- Modify plan-deck/instructions.md template suggestions
- Modify edit/instructions.md template awareness
- Add catalog_path variables to workflow.yaml files

---

## Epic 11 Story Map

```
Epic 11: Template Catalog System (10 points)
│
├── Story 11.1: Core Catalog Infrastructure (2 points)
│   Dependencies: None
│   └── Create catalog/ directory, catalog.json schema, update CONVENTIONS.md
│
├── Story 11.2: Refactor Setup Workflow (3 points)
│   Dependencies: Story 11.1
│   └── Setup generates to catalog/, removes old directories
│
├── Story 11.3: Create /sb:add-template Skill (3 points)
│   Dependencies: Story 11.1
│   └── New workflow with conversational template creation
│
└── Story 11.4: Update Dependent Workflows (2 points)
    Dependencies: Stories 11.1, 11.2
    └── build-one, plan-one, plan-deck, edit use catalog
```

**Total Points:** 10
**Implementation Sequence:** 11.1 → 11.2 (and 11.3 in parallel) → 11.4

---

## Epic 12: Slide Download & Export

**Slug:** download-export
**Date Added:** 2026-01-28
**Tech Spec:** [tech-spec.md](./tech-spec.md)

### Goal

Enable users to download slides as PNG images and PDF documents directly from the viewer, supporting both single slide and batch export with full offline (`file://` protocol) capability.

### Scope

**In Scope:**
- Download dropdown menu in presentation header
- Single slide PNG export
- All slides PNG export (bundled as ZIP)
- Deck PDF export (all slides as pages)
- Progress modal with progress bar for batch operations
- Inline library bundling for offline support

**Out of Scope:**
- Gallery view download options
- Server-side rendering
- Customizable export settings
- Cloud storage integration

### Success Criteria

1. Download button visible in presentation header with dropdown menu
2. Single slide downloads as 1920x1080 PNG
3. All slides download as ZIP containing individual PNGs
4. PDF export creates multi-page landscape PDF
5. All features work with `file://` protocol (true offline)
6. Progress bar updates during batch operations

### Dependencies

- Epic 8 (Slide Viewer) must be complete - viewer template exists
- Epic 9 (Dynamic Viewer Loading) complete - manifest system in place

---

## Epic 12 Stories

### Story 12.1: Download Menu UI

**User Story:**
As a presenter,
I want a download button in the presentation header,
So that I can access export options while viewing slides.

**Acceptance Criteria:**
- [ ] Download button visible in presentation header (next to close button)
- [ ] Dropdown menu opens on click
- [ ] Menu shows three options with icons (PNG, ZIP, PDF)
- [ ] Menu closes when clicking outside
- [ ] Keyboard shortcut 'D' opens menu
- [ ] Styling matches existing nav buttons

**Technical Notes:**
- Modify `.slide-builder/config/templates/viewer-template.html`
- Add CSS for `.download-btn`, `.download-menu`, `.download-menu-item`
- Add `toggleDownloadMenu()` JavaScript function
- Follow existing button styling patterns

---

### Story 12.2: Single Slide PNG Export

**User Story:**
As a presenter,
I want to download the current slide as a PNG image,
So that I can share it in documents or emails.

**Acceptance Criteria:**
- [ ] Clicking "Download Current Slide" triggers download
- [ ] Downloaded PNG is named `{deckName}-slide-{N}.png`
- [ ] PNG dimensions are 1920x1080
- [ ] PNG accurately captures slide content (text, SVGs, backgrounds)
- [ ] Works with `file://` protocol

**Technical Notes:**
- Inline html2canvas v1.4.1 library
- Implement `captureSlide(slideNumber)` helper function
- Implement `downloadCurrentSlide()` function
- Access slide via `iframe.contentDocument.querySelector('.slide')`

---

### Story 12.3: Batch PNG Export (ZIP)

**User Story:**
As a presenter,
I want to download all slides as PNG images in a ZIP file,
So that I can archive the deck or use slides individually.

**Acceptance Criteria:**
- [ ] Clicking "Download All as PNG" shows progress modal
- [ ] Progress bar updates as slides are processed
- [ ] ZIP file downloads when complete
- [ ] ZIP contains all slides as numbered PNGs
- [ ] Modal dismisses after download
- [ ] Works with `file://` protocol

**Technical Notes:**
- Inline JSZip v3.10.1 library
- Add progress modal HTML/CSS
- Implement `showProgressModal()`, `updateProgress()`, `hideProgressModal()`
- Implement `downloadAllSlidesPNG()` function
- Process slides sequentially to manage memory

---

### Story 12.4: PDF Export

**User Story:**
As a presenter,
I want to download the entire deck as a PDF,
So that I can share a complete document version.

**Acceptance Criteria:**
- [ ] Clicking "Download as PDF" shows progress modal
- [ ] Progress bar updates during generation
- [ ] PDF file downloads when complete
- [ ] PDF contains all slides as pages
- [ ] PDF pages are landscape 1920x1080
- [ ] PDF file size is reasonable (<50MB for 14 slides)
- [ ] Works with `file://` protocol

**Technical Notes:**
- Inline jsPDF v2.5.1 library
- Implement `downloadDeckPDF()` function
- Use jsPDF with custom page size [1920, 1080] in landscape
- Render each slide as PNG, then embed in PDF

---

## Epic 12 Story Map

```
Epic 12: Slide Download & Export (8 points)
│
├── Story 12.1: Download Menu UI (2 points)
│   Dependencies: None
│   └── Add download button, dropdown menu, keyboard shortcut
│
├── Story 12.2: Single Slide PNG Export (2 points)
│   Dependencies: Story 12.1
│   └── html2canvas integration, single PNG download
│
├── Story 12.3: Batch PNG Export (ZIP) (2 points)
│   Dependencies: Story 12.1, 12.2
│   └── JSZip integration, progress modal, batch processing
│
└── Story 12.4: PDF Export (2 points)
    Dependencies: Story 12.1, 12.2
    └── jsPDF integration, multi-page PDF generation
```

**Total Points:** 8
**Implementation Sequence:** 12.1 → 12.2 → 12.3 (and 12.4 in parallel)

---

## Epic 13: Enhanced Planning Sessions

**Slug:** enhanced-planning
**Date Added:** 2026-01-28
**Tech Spec:** [tech-spec-enhanced-planning.md](./tech-spec-enhanced-planning.md)

### Goal

Enable deeper planning during planning sessions by transforming `/sb:plan-deck` from a single-pass flow into a two-phase model with agenda structure generation and per-section deep discovery using Claude Code's multi-select UI.

### Scope

**In Scope:**
- Agenda structure generation with 4-8 proposed sections
- Multi-select section confirmation via AskUserQuestion
- Per-section deep discovery loop (message options, content types, visual treatment)
- On-demand web research integration via WebSearch
- Enhanced plan.yaml schema with agenda and discovery data
- Lighter discovery pattern for plan-one

**Out of Scope:**
- AI-generated images or mockups
- Automatic slide generation from agenda
- Third-party integrations
- Persistent research database

### Success Criteria

1. After context collection, agent proposes 4-8 agenda sections with narrative roles
2. User can select/deselect sections via Claude Code multi-select UI
3. For each section, structured discovery presents message, content, and visual options
4. Research available on-demand via WebSearch
5. plan.yaml contains full agenda and discovery data per section
6. Existing modification loop and save functionality unchanged

### Dependencies

- Epic 5 (Full Deck Mode) - plan-deck workflow exists
- Claude Code AskUserQuestion tool available
- WebSearch tool available

---

## Epic 13 Stories

### Story 13.1: Agenda Structure Generation

**User Story:**
As a presentation planner,
I want the agent to propose a high-level agenda with 4-8 sections after I provide my purpose and audience,
So that I can structure my presentation around clear narrative stages before diving into details.

**Acceptance Criteria:**
- [ ] After context collection, agent proposes 4-8 agenda sections
- [ ] Each section has: id, title, narrative_role, estimated_slides, description
- [ ] User can select/deselect sections via multi-select
- [ ] User can add custom sections via "Other" option
- [ ] Confirmed agenda stored for Phase 2

**Technical Notes:**
- Insert new step 2.5 after context collection in plan-deck/instructions.md
- Use AskUserQuestion with multiSelect: true, up to 4 options per call
- Generate sections based on purpose/audience/key_points analysis

---

### Story 13.2: Section Message Discovery

**User Story:**
As a presentation planner,
I want to choose from multiple message framing options for each agenda section,
So that I can find the most compelling way to communicate each part of my story.

**Acceptance Criteria:**
- [ ] For each section, 3-4 message framings presented
- [ ] Options include: direct, question, story, data framings
- [ ] Single-select UI (not multi-select) for message choice
- [ ] Selection stored in section.discovery.key_message

**Technical Notes:**
- Add step 2.6 with for-each loop over agenda_sections
- Use AskUserQuestion with multiSelect: false
- Message options should be contextual to section.title and narrative_role

---

### Story 13.3: Content & Visual Discovery

**User Story:**
As a presentation planner,
I want to select supporting content types and visual treatment options for each section, with optional research,
So that each part of my presentation has rich context for slide generation.

**Acceptance Criteria:**
- [ ] Content type multi-select with 4 options
- [ ] Visual treatment multi-select with diagram/metaphor/imagery options
- [ ] On-demand research via WebSearch when requested
- [ ] Research results presented as selectable findings
- [ ] Single refinement opportunity before advancing

**Technical Notes:**
- Continue step 2.6 with additional AskUserQuestion calls
- Research uses WebSearch tool, results presented via AskUserQuestion
- Store all selections in section.discovery object

---

### Story 13.4: Schema & Integration

**User Story:**
As a slide builder system,
I want the enhanced plan.yaml schema to include all agenda and discovery data,
So that slide generation can use the rich context gathered during planning.

**Acceptance Criteria:**
- [ ] plan.yaml schema includes agenda and discovery data
- [ ] Slide generation uses section context
- [ ] CONVENTIONS.md documents new patterns
- [ ] plan-one has lighter discovery option

**Technical Notes:**
- Modify step 3 (narrative generation) to use agenda sections
- Update plan.yaml write in step 5
- Update CONVENTIONS.md with AskUserQuestion patterns

---

## Epic 13 Story Map

```
Epic 13: Enhanced Planning Sessions (8 points)
│
├── Story 13.1: Agenda Structure Generation (2 points)
│   Dependencies: None
│   └── Add agenda proposal and multi-select confirmation after context collection
│
├── Story 13.2: Section Message Discovery (2 points)
│   Dependencies: Story 13.1
│   └── Per-section key message options with single-select UI
│
├── Story 13.3: Content & Visual Discovery (2 points)
│   Dependencies: Story 13.2
│   └── Content types, visual treatment multi-select, on-demand research
│
└── Story 13.4: Schema & Integration (2 points)
    Dependencies: Stories 13.1, 13.2, 13.3
    └── Enhanced plan.yaml, slide generation from sections, CONVENTIONS.md
```

**Total Points:** 8
**Implementation Sequence:** 13.1 → 13.2 → 13.3 → 13.4

---

