# Slide Builder - Product Requirements Document

**Author:** Vishal
**Date:** 2026-01-26
**Version:** 1.0

---

## Executive Summary

Slide Builder is an agentic framework for Claude Code that enables Solutions Consultants to create customer-ready presentation slides through a structured, repeatable workflow. The framework follows BMAD architectural patterns (workflow.yaml + instructions.md, phase-based execution, checkpoint approvals) to deliver brand-perfect slides that tell precise stories without visual compromise.

The system guides users through: (1) theme setup using their brand assets, (2) slide planning to structure the narrative, (3) individual or batch slide generation in HTML/JS, (4) human-in-the-loop editing, and (5) seamless export to Google Slides.

### What Makes This Special

**Zero Visual Compromise** - Unlike generic AI slide generators that produce cookie-cutter outputs, Slide Builder uses the user's exact brand theme (colors, typography, shapes, arrow styles) extracted from their own assets. Every slide looks like it was hand-crafted by a designer who knows the brand intimately.

**Story-First Architecture** - The planning phase ensures slides tell the exact story the SC wants to tell. No fighting with AI to "get it right" - the structured workflow captures intent upfront and executes faithfully.

**BMAD-Powered Repeatability** - Following the proven BMAD pattern means consistent, high-quality results every time. Checkpoints ensure human approval at critical moments. State tracking means you can build one slide at a time or batch-generate an entire deck.

---

## Project Classification

**Technical Type:** Developer Tool / CLI Framework
**Domain:** General (Productivity/Sales Enablement)
**Complexity:** Low (no regulatory requirements)

This is an agentic framework that extends Claude Code with specialized workflows for slide generation. It combines:
- **Developer Tool patterns**: Workflow definitions, state management, extensible commands
- **CLI Tool patterns**: Slash commands (`/setup`, `/edit`, `/build`), terminal-based interaction
- **Web App output**: HTML/JS slides with editable elements, browser-based preview and export

---

## Theme System Architecture

The theme system is the foundation of Slide Builder's value proposition. It captures brand DNA and applies it consistently across all generated slides.

### Theme Primitive Schema

The theme file (`.slide-builder/theme.json`) contains:

| Category | What It Captures |
|----------|------------------|
| **Colors** | Primary, secondary, accent, backgrounds, text colors, semantic colors (success, warning, error) |
| **Typography** | Font families (heading, body, mono), size scale, weight patterns |
| **Shapes** | Box styles (corner radius, borders, shadows), arrow styles (weight, heads, curves), line styles |
| **Icons** | Style (outline/filled), default sizes, stroke weight |
| **Layout** | Slide dimensions (1920x1080), grid system, spacing scale |
| **Semantic Styles** | Intent-to-primitive mappings (e.g., "key point" → callout box + accent color) |

### Theme Setup UX Philosophy

**Core Principle: AI does the work, user is creative director.**

The setup experience is NOT configuration. It's creative collaboration:

1. **User provides inputs once** - Website URL, brand PDF, example slides, brief description
2. **AI makes all decisions** - Extracts colors, fonts, infers brand personality, generates complete theme
3. **AI presents sample deck** - 6 slides demonstrating all primitives in context
4. **User gives gestalt feedback** - "Too corporate", "Not bold enough", "Colors feel off"
5. **AI interprets and refines** - Translates high-level feedback into theme adjustments
6. **Repeat until approved** - Target: 1-3 feedback rounds

**What users NEVER do:**
- Read or edit JSON
- Pick from numbered options
- Specify pixel values, hex codes, or percentages
- Give micro-feedback on individual primitives

**Sample Deck Contents:**

| Slide | Tests These Primitives |
|-------|----------------------|
| Title Slide | Hero typography, primary color, background |
| Agenda/List | Body text, bullet styling, spacing |
| Process Flow | Arrows, boxes, connectors, layout |
| Comparison | Multiple box styles, alignment |
| Key Insight | Callout box, emphasis, accent color, icons |
| Technical/Code | Mono font, dark background variant |

### Theme Lifecycle

- **`/setup`** - Full setup flow for new theme
- **`/theme`** - View current theme summary
- **`/theme-edit`** - Modify existing theme with visual feedback loop
- **Theme versioning** - All changes tracked with history for rollback

### Layout Templates

The theme includes **layout templates** established during setup via the sample deck:

| Layout Template | Use Case |
|-----------------|----------|
| `layout:title` | Title slides with hero text |
| `layout:list` | Bullet lists with optional imagery |
| `layout:flow-horizontal` | Left-to-right process flows, timelines |
| `layout:columns-2` | Two-column comparisons |
| `layout:columns-3` | Three-column content (pain points, features) |
| `layout:centered-callout` | Key insights, CTAs, emphasis moments |
| `layout:code-showcase` | Technical content with code blocks |

**Layout Flexibility:**
- Claude can use templates for common patterns (fast)
- Claude can modify templates ("columns-3 but unequal widths")
- Claude can build fully custom layouts for complex stories (flexible)

User never thinks about layouts - they describe the STORY, Claude picks the right layout.

---

## Command Structure

### Dual-Mode Operation

Slide Builder supports two distinct modes:

**Single Slide Mode** - Quick, tactical
- "I need one architecture diagram for my existing deck"
- Minimal state, fast iteration
- Output: One slide/image to grab and use elsewhere

**Full Deck Mode** - Structured, comprehensive
- "I need a 10-slide pitch deck for CustomerCo"
- Full planning, state tracking, batch operations
- Output: Complete presentation for export

### Command Reference

| Command | Description |
|---------|-------------|
| **Theme** | |
| `/setup` | Create theme via brand assets + sample deck feedback loop |
| `/theme` | View current theme summary |
| `/theme-edit` | Modify existing theme with visual feedback |
| **Planning** | |
| `/plan` | Smart router - asks "one slide or full deck?" |
| `/plan-one` | Plan a single slide (quick path) |
| `/plan-deck` | Plan a full deck with narrative structure |
| **Building** | |
| `/build-one` | Build single slide (next in deck plan, or the one-off slide) |
| `/build-all` | Build all remaining slides in deck plan |
| **Editing** | |
| `/edit [n]` | Edit slide n - text inline, layout via prompt |
| **Export** | |
| `/export` | Send completed deck to Google Slides |

### State Management

```
.slide-builder/
├── theme.json           # Shared across all modes
├── status.yaml          # Global workflow state tracking
├── single/              # Single slide mode
│   ├── plan.yaml        # Rich slide intent with agent context
│   └── slide.html
└── deck/                # Deck mode
    ├── plan.yaml        # Narrative structure with rich per-slide context
    └── slides/
        ├── slide-1.html
        ├── slide-2.html
        └── ...
```

### Story-First Planning

The `/plan-deck` workflow captures **narrative intent** with rich context for AI agents:

**Deck Plan Structure:**
- **Audience Context**: Who they are, knowledge level, what they care about
- **Purpose/Outcome**: The goal, desired outcome, key message to remember
- **Narrative Structure**: Opening hook, tension, resolution, call-to-action
- **Per-Slide Rich Context**: storyline role, key points, visual guidance, tone, technical depth, speaker notes hints

**Single Slide Plan Structure:**
- **Core Intent**: What the slide should convey, suggested template
- **Audience Context**: Who will see it, their knowledge level, usage context
- **Content Details**: Key points, visual guidance, tone
- **Technical Details**: Depth level, include/exclude elements, data sources

```
Example Deck Plan:
deck_name: "Acme + CustomerCo Partnership"
audience: "CustomerCo executives"
audience_knowledge_level: "intermediate"
audience_priorities: ["ROI", "time-to-value", "risk mitigation"]
desired_outcome: "Approve POC budget and assign technical sponsor"
key_message: "We reduce their integration costs by 40%"

storyline:
  opening_hook: "Their biggest competitor just shipped with our platform"
  tension: "Manual integrations are slowing their roadmap"
  resolution: "Our platform automates 80% of the work"
  call_to_action: "Start 2-week POC next sprint"

slides:
  - number: 1
    intent: "Title - Partnership framing"
    storyline_role: "opening"
    key_points: ["Position as strategic partner", "Emphasize shared goals"]
    tone: "warm"
```

Claude uses this rich context to build slides that precisely match intent.

### Editing Model

- **Text edits**: Direct in browser via `contenteditable` - changes auto-saved
- **Layout edits**: Prompt-based via `/edit` - Claude regenerates preserving text edits
- **All edits are prompt-based** - no drag-and-drop UI in MVP

---

## Success Criteria

### Primary Success Metrics

**1. Slides Ship Without Manual Design Work**
- Generated slides are customer-ready without needing Figma/PowerPoint touch-ups
- SC can send deck directly to customer after content review
- Zero "design debt" - no "I'll fix the visuals later" moments

**2. Theme Setup Completes in ≤3 Feedback Rounds**
- AI's first pass is close enough that refinement is minor
- Users don't abandon setup due to tedious iteration
- Theme feels "right" quickly

**3. Brand Fidelity Test**
- Slides pass the "would this fool a designer?" test
- Output matches reference brand materials in look and feel
- No generic AI aesthetic - slides feel custom

**4. Story Coherence**
- Deck tells the narrative the SC intended
- Slide flow makes logical sense
- Key points land with visual emphasis

### User Experience Success

**The "Demo Tomorrow" Test:**
A Solutions Consultant has a customer demo tomorrow. They need 8-10 custom slides. Success means:
- They can complete the full workflow (setup → plan → build → export) in a single session
- The output requires only content tweaks, not visual fixes
- They feel confident presenting these slides to the customer

**The "Reuse" Test:**
- Once theme is set up, building a new deck reuses the theme seamlessly
- Second deck takes significantly less effort than first
- Theme evolves over time as user refines preferences

---

## Product Scope

### MVP - Minimum Viable Product

**Core Theme System**
- `/setup` workflow with AI-first theme generation
- Brand extraction from website URL, PDF, images
- Sample deck generation (6 slides) for visual validation
- Gestalt feedback loop (high-level, not micro-inputs)
- Theme file persistence (`.slide-builder/theme.json`)
- `/theme` to view current theme summary
- `/theme-edit` for refining existing themes via visual feedback loop
- Theme versioning with change history

**Single Slide Mode**
- `/plan-one` for quick single-slide planning
- `/build-one` generates HTML/JS slide
- Basic text editing via `contenteditable`
- Slide preview in browser

**Deck Mode**
- `/plan-deck` for narrative-first deck planning
- `/build-one` builds next slide in plan
- `/build-all` batch generates remaining slides
- Plan and build state tracking

**Editing**
- `/edit` for prompt-based layout changes
- Text edits persist across layout regenerations
- All modifications are prompt-based (no visual editor)

**Export**
- `/export` converts HTML slides to images
- Upload to Google Slides via API
- Each image sized to full slide dimensions

### Growth Features (Post-MVP)

**Enhanced Theme Management**
- Multiple theme profiles per project (switch between brands)
- Theme import/export for sharing

**Collaboration & Sharing**
- Team theme sharing
- Deck templates library (reusable narrative structures)
- Export to PowerPoint format

**Advanced Editing**
- Visual resize/reposition handles (optional)
- CSS override panel for power users
- Batch edit across multiple slides

**Intelligence**
- Layout suggestions based on content analysis
- Auto-improvement suggestions ("This slide is text-heavy, split it?")
- Brand consistency checker

### Vision (Future)

**Platform Expansion**
- Web-based UI (beyond CLI)
- Real-time collaboration
- Presentation mode with speaker notes

**AI Enhancement**
- Voice-to-slide generation
- Automatic content from documents/URLs
- Dynamic data-connected slides

**Enterprise Features**
- Organization-wide theme governance
- Analytics on slide usage and effectiveness
- Integration with CRM for personalized decks

---

## User Experience Principles

### Core Philosophy

**AI Does the Work, User Directs**
- User provides intent and feedback, never configuration
- AI makes opinionated decisions, user course-corrects
- No JSON, no pixel values, no micro-decisions

**Show, Don't Ask**
- Present output, not options
- Generate samples for reaction, don't ask for specs
- Visual feedback over verbal configuration

**Story First, Always**
- User thinks in narrative, not slides
- Planning captures intent ("what's the story?"), not implementation ("what layout?")
- Claude translates story to visual execution

**Minimal Friction**
- Single-slide mode for quick needs (most common use case)
- Text edits inline, no round-trip to AI
- Export should feel like "save" not "process"

### Key Interactions

**Theme Setup (`/setup`)**
```
User: provides brand assets + brief description
      ↓
AI:   analyzes, generates complete theme + sample deck
      ↓
User: "Too corporate" / "Colors off" / "Perfect"
      ↓
AI:   interprets, refines, regenerates
      ↓
      Loop until "Perfect" → Theme locked
```

**Single Slide (`/plan-one` → `/build-one`)**
```
User: "I need an architecture diagram showing X"
      ↓
AI:   confirms understanding, builds slide
      ↓
User: views in browser, edits text inline if needed
      ↓
User: screenshots/saves image for use elsewhere
```

**Deck Building (`/plan-deck` → `/build-all`)**
```
User: describes presentation purpose + audience
      ↓
AI:   proposes narrative structure (6-10 slides)
      ↓
User: adjusts story flow ("add ROI slide", "cut the timeline")
      ↓
AI:   finalizes plan
      ↓
User: `/build-all` or `/build-one` incrementally
      ↓
      Review each slide, `/edit` as needed
      ↓
User: `/export` to Google Slides
```

**Editing (`/edit`)**
```
Text changes:  Click on text in browser → type → auto-saved
Layout changes: `/edit 3` → "Move diagram to the right" → AI regenerates
```

### Visual Design of Output

**Slide Characteristics:**
- 1920x1080 (16:9 standard)
- Clean, professional aesthetic matching user's brand
- Generous whitespace - not cramped
- Clear visual hierarchy - one main point per slide
- Consistent element placement across slides

---

## Functional Requirements

### Theme Management

- **FR1**: Users can create a new theme by providing brand assets (website URL, PDF, images) and a brief description
- **FR2**: System extracts colors, typography, and visual patterns from provided brand assets
- **FR3**: System generates a complete theme file with all primitives (colors, typography, shapes, icons, layouts)
- **FR4**: System generates a 6-slide sample deck demonstrating all theme primitives
- **FR5**: Users can provide high-level feedback on sample deck ("too corporate", "colors off")
- **FR6**: System interprets gestalt feedback and updates theme accordingly
- **FR7**: System regenerates sample deck after theme updates for re-validation
- **FR8**: Users can view current theme summary via `/theme` command
- **FR9**: Users can modify existing theme via `/theme-edit` with same feedback loop
- **FR10**: System maintains theme version history with timestamps and change notes
- **FR11**: Users can rollback to previous theme version

### Planning - Single Slide

- **FR12**: Users can initiate single-slide planning via `/plan-one`
- **FR13**: Users can describe desired slide content in natural language
- **FR14**: System confirms understanding and captures slide intent
- **FR15**: Single-slide plan persists for building

### Planning - Full Deck

- **FR16**: Users can initiate deck planning via `/plan-deck`
- **FR17**: Users can describe presentation purpose, audience, and key points
- **FR18**: System proposes narrative structure with slide-by-slide breakdown
- **FR19**: Users can add, remove, or reorder slides in the plan
- **FR20**: Users can modify individual slide descriptions in the plan
- **FR21**: Deck plan persists with full narrative structure

### Building

- **FR22**: Users can build a single slide via `/build-one`
- **FR23**: In deck mode, `/build-one` builds the next unbuilt slide in plan
- **FR24**: In single mode, `/build-one` builds the planned slide
- **FR25**: Users can build all remaining slides via `/build-all` (deck mode only)
- **FR26**: System generates HTML/JS slides using theme primitives
- **FR27**: System selects appropriate layout template based on content type
- **FR28**: System can create custom layouts for complex content
- **FR29**: Generated slides render at 1920x1080 (16:9)
- **FR30**: System tracks build progress (which slides are complete)

### Slide Output

- **FR31**: Generated slides are valid HTML/JS viewable in any modern browser
- **FR32**: All text elements in slides are editable via `contenteditable`
- **FR33**: Text edits are auto-saved to slide state file
- **FR34**: Slides include all visual elements (boxes, arrows, icons, images) as specified
- **FR35**: Slides follow theme primitives consistently (colors, fonts, shapes)
- **FR36**: Each slide is a self-contained HTML file

### Editing

- **FR37**: Users can edit any slide via `/edit [slide-number]`
- **FR38**: Users can describe layout changes in natural language
- **FR39**: System regenerates slide layout while preserving user's text edits
- **FR40**: Users can edit text directly in browser without AI round-trip
- **FR41**: Text edits persist across layout regenerations

### Export

- **FR42**: Users can export deck to Google Slides via `/export`
- **FR43**: System converts HTML slides to images (PNG/JPG)
- **FR44**: System creates new Google Slides presentation via API
- **FR45**: System uploads each slide image at full slide dimensions
- **FR46**: Export process provides progress feedback
- **FR47**: System returns link to created Google Slides presentation

### Framework Architecture (BMAD Pattern)

- **FR48**: Each command maps to a workflow definition (workflow.yaml)
- **FR49**: Workflows have associated instruction files (instructions.md)
- **FR50**: Workflows execute in phases with checkpoint approvals
- **FR51**: State is persisted in YAML status files
- **FR52**: Framework is extensible for new workflows/commands

---

## Non-Functional Requirements

### Performance

- **NFR1**: Sample deck generation (6 slides) completes within reasonable time for user to wait
- **NFR2**: Single slide generation completes within reasonable time for interactive use
- **NFR3**: Text auto-save occurs within 1 second of edit completion
- **NFR4**: Slide preview renders immediately in browser (no loading delay)
- **NFR5**: Theme feedback loop iteration (change → regenerate) should feel responsive

### Integration

- **NFR6**: Google Slides API integration via OAuth 2.0
- **NFR7**: User authenticates once, credentials stored securely for session
- **NFR8**: Export handles Google API rate limits gracefully
- **NFR9**: System works within Claude Code CLI environment
- **NFR10**: HTML-to-image conversion uses headless browser (Puppeteer or similar)

### Security

- **NFR11**: Google API credentials stored securely (not in plain text)
- **NFR12**: No brand assets or slide content transmitted to external services (except Google for export)
- **NFR13**: Theme files and slide content remain local to user's machine

### Reliability

- **NFR14**: Partial deck builds are recoverable (resume from last completed slide)
- **NFR15**: Theme changes don't corrupt existing slides
- **NFR16**: Export failure doesn't lose local slide data
- **NFR17**: State files are human-readable YAML for manual recovery if needed

### Compatibility

- **NFR18**: Generated HTML slides render correctly in Chrome, Firefox, Safari
- **NFR19**: Slides are responsive but optimized for 1920x1080 presentation
- **NFR20**: Framework runs on macOS and Linux (Windows nice-to-have)

---

## Summary

| Metric | Count |
|--------|-------|
| Functional Requirements | 52 |
| Non-Functional Requirements | 20 |
| Commands (MVP) | 10 |
| Layout Templates | 7 |

### Product Value

Slide Builder transforms how Solutions Consultants create customer-ready presentations:

- **Before**: Hours in PowerPoint/Figma fighting to match brand guidelines
- **After**: Describe your story, AI builds brand-perfect slides

The magic is in the **low-effort theme setup** - provide brand assets, give high-level feedback on samples, and the system captures your visual DNA. Every slide thereafter is automatically on-brand.

### Recommended Next Steps

1. **Architecture** - Define technical approach for theme extraction, HTML generation, and Google Slides integration
2. **UX Design** - Design the sample deck template and feedback interaction patterns
3. **Epic Breakdown** - Split MVP into implementable stories

---

_This PRD captures the essence of Slide Builder - an agentic framework that lets Solutions Consultants create customer-ready, brand-perfect slides through AI-powered workflows, eliminating design friction while preserving creative control._

_Created through collaborative discovery between Vishal and AI facilitator._
