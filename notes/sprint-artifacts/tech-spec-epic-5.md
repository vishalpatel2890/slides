# Epic Technical Specification: Full Deck Mode

Date: 2026-01-27
Author: Vishal
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 enables users to plan and build complete presentation decks with multiple slides through a structured, narrative-first workflow. While Epic 3 established the single-slide quick path, Epic 5 extends this to handle the full "Demo Tomorrow" use case where Solutions Consultants need a cohesive 8-10 slide presentation.

The core innovation is the **narrative-first planning** approach: users describe their presentation purpose, audience, and key points, and the system proposes a complete narrative structure with slide-by-slide breakdown. This captures the "story" before any slides are built, ensuring the final deck tells a coherent narrative rather than a disjointed collection of slides.

Epic 5 builds on Epic 2's theme system, Epic 3's slide building infrastructure (template-based and custom), and Epic 4's editing capabilities. The deck mode introduces new concepts: plan.yaml with rich per-slide context, incremental vs batch building, and progress tracking across multiple slides.

## Objectives and Scope

**In Scope:**

- `/plan-deck` command to initiate narrative-first deck planning
- Audience and purpose capture (who, why, what outcome)
- AI-proposed narrative structure with slide-by-slide breakdown
- Plan modification: add, remove, reorder slides
- Individual slide description editing within the plan
- Deck plan persistence in `.slide-builder/deck/plan.yaml`
- `/build-one` behavior in deck mode (builds next unbuilt slide)
- `/build-all` command to batch-generate all remaining slides
- Build progress tracking (which slides complete)
- status.yaml updates for deck mode operations
- Error handling and partial build recovery

**Out of Scope:**

- Single slide mode (`/plan-one` - Epic 3)
- Theme creation and management (`/setup`, `/theme`, `/theme-edit` - Epics 2, 6)
- Slide editing and text preservation (`/edit` - Epic 4)
- Google Slides export (`/export` - Epic 7)
- Multiple deck profiles (Growth feature)
- Real-time collaboration (Vision feature)
- Deck templates library (Growth feature)

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-001, ADR-002, ADR-003):**

This epic implements the **Dual-Mode State Management** pattern from Architecture Novel Pattern 4. The system detects operating mode from status.yaml and routes `/build-one` to either single or deck mode accordingly. Deck mode uses a separate directory structure (`.slide-builder/deck/`) with its own plan.yaml and slides/ folder.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| Dual-Mode State | Novel Pattern 4 | Mode detection via status.yaml |
| plan.yaml (deck) | Data Architecture | Rich context: audience, storyline, per-slide intent |
| Template-or-Custom Decision | Novel Pattern 2 | Match slide intent to templates, fall back to skill |
| status.yaml | State File Patterns | Track mode, current_slide, total_slides, built_count |
| HTML Slide Pattern | Implementation Patterns | All slides follow standard structure |
| frontend-design Skill | Technology Stack | Generate slides per plan intent |

**Constraints from Architecture:**

- Deck mode MUST use `.slide-builder/deck/` directory exclusively
- plan.yaml MUST follow the documented schema with rich per-slide context
- Mode MUST be set to "deck" in status.yaml when deck planning starts
- Each slide MUST be saved as `deck/slides/slide-{n}.html` with matching state file
- Build progress MUST be tracked via slide status in plan.yaml and status.yaml
- Template selection MUST follow the intent-to-template mapping pattern
- Batch builds MUST continue on error (don't abort entire batch)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Deck Plan Initiator** | Captures audience, purpose, key points from user | User input via prompts | Initial plan context |
| **Narrative Generator** | Proposes slide-by-slide breakdown with storyline | Purpose, audience, key points | Proposed slide array |
| **Plan Modifier** | Handles add/remove/reorder/modify operations | Modification commands, current plan | Updated plan.yaml |
| **Mode Switcher** | Sets status.yaml to deck mode, initializes deck directory | Plan confirmation | status.yaml update |
| **Deck Build Router** | Routes /build-one to next unbuilt slide in deck | status.yaml, plan.yaml | Target slide number |
| **Slide Builder** | Generates individual slides (reuses Epic 3 logic) | Slide intent, theme, template | slide-{n}.html |
| **Batch Builder** | Orchestrates /build-all across all pending slides | plan.yaml | Multiple slide files |
| **Progress Tracker** | Updates plan.yaml status and status.yaml counts | Build results | Updated state files |

**Module Details:**

**1. Deck Plan Initiator (Story 5.1)**
- Prompts user for: presentation purpose, target audience, key points, desired length
- Validates theme.json exists (prerequisite)
- Stores raw input for Narrative Generator
- Sets initial status.yaml mode to "deck" (pending confirmation)

**2. Narrative Generator (Story 5.1)**
- Analyzes user inputs to determine storyline arc
- Proposes opening_hook, tension, resolution, call_to_action
- Generates 6-10 slide breakdown with:
  - number, intent, suggested template
  - storyline_role, key_points, tone
  - visual_guidance (where applicable)
- Returns structured proposal for user review

**3. Plan Modifier (Story 5.2)**
- Parses modification commands:
  - "Add a slide about ROI after slide 3"
  - "Remove slide 5"
  - "Move slide 7 to position 2"
  - "Change slide 3 to focus on security"
- Renumbers all slides after structural changes
- Preserves built slides (warns if reordering affects built slides)
- Saves updated plan.yaml after each modification

**4. Mode Switcher (Story 5.1)**
- Updates status.yaml: mode: "deck"
- Ensures `.slide-builder/deck/slides/` directory exists
- Clears any stale single-mode references
- Initializes total_slides and built_count

**5. Deck Build Router (Story 5.3)**
- Reads plan.yaml to find slides with status: "pending"
- Returns first pending slide number
- If all slides built, returns null with "All slides built" message
- Updates current_slide in status.yaml

**6. Slide Builder (Stories 5.3, 5.4)**
- Reuses Epic 3 template-or-custom logic
- Loads slide context from plan.yaml (intent, key_points, tone, etc.)
- Matches intent to template or invokes frontend-design skill
- Generates slide-{n}.html with contenteditable elements
- Creates corresponding slide-{n}-state.json (empty initially)

**7. Batch Builder (Story 5.4)**
- Iterates through all pending slides in order
- Calls Slide Builder for each
- Continues on error (marks failed slide, proceeds to next)
- Reports progress during execution
- Returns summary: built count, failed count, time elapsed

**8. Progress Tracker (Stories 5.3, 5.4)**
- Updates plan.yaml slide status: "pending" → "built"
- Updates status.yaml: built_count, last_action, history
- Logs each build to history array with timestamp

### Data Models and Contracts

**plan.yaml (Deck Mode) - Full Schema:**

```yaml
# Deck Metadata
deck_name: "Acme + CustomerCo Partnership"
created: "2026-01-27"
last_modified: "2026-01-27T14:30:00Z"

# Audience Context
audience: "CustomerCo executives, technical decision makers"
audience_knowledge_level: intermediate   # beginner | intermediate | expert
audience_priorities:
  - "ROI"
  - "time-to-value"
  - "risk mitigation"

# Purpose & Outcome
purpose: "Partnership pitch to close Q4 deal"
desired_outcome: "Approve POC budget and assign technical sponsor"
key_message: "We reduce their integration costs by 40%"

# Narrative Structure
storyline:
  opening_hook: "Their biggest competitor just shipped with our platform"
  tension: "Manual integrations are slowing their roadmap by 3 months"
  resolution: "Our platform automates 80% of integration work"
  call_to_action: "Start 2-week POC next sprint"

recurring_themes:
  - "speed"
  - "simplicity"
  - "proven results"

# Slide Breakdown with Rich Context
slides:
  - number: 1
    intent: "Title - Partnership framing"
    template: "layout-title"
    status: pending                      # pending | built | failed

    # Rich context for building agent
    storyline_role: "opening"            # opening | tension | evidence | resolution | cta
    key_points:
      - "Position as strategic partnership, not vendor"
      - "Emphasize shared goals"
    visual_guidance: "Side-by-side logos, clean and equal"
    tone: "warm"                         # professional | bold | warm | technical | urgent

    # Technical details
    technical_depth: "none"              # none | overview | detailed | deep-dive

    # Speaker context
    speaker_notes_hint: "Start with relationship, not product"
    transition_to_next: "Let's talk about your current challenges"

  - number: 2
    intent: "Problem statement - Integration pain"
    template: "layout-list"
    status: pending
    storyline_role: "tension"
    key_points:
      - "Manual integrations take 3+ months"
      - "Engineering time diverted from core product"
      - "Competitor shipped faster"
    tone: "urgent"
    # ... additional fields as needed
```

**status.yaml Updates (Deck Mode):**

```yaml
mode: deck
current_slide: 0                    # Current slide being built (0 = none yet)
total_slides: 7                     # Total slides in plan
built_count: 0                      # Successfully built slides

last_action: "Deck plan created with 7 slides"
last_modified: "2026-01-27T14:30:00Z"

history:
  - action: "Deck planning started"
    timestamp: "2026-01-27T14:00:00Z"
  - action: "Deck plan created with 7 slides"
    timestamp: "2026-01-27T14:30:00Z"
```

**Slide File Structure:**

```
.slide-builder/deck/
├── plan.yaml                    # Deck narrative and slide breakdown
└── slides/
    ├── slide-1.html             # Generated slides
    ├── slide-1-state.json       # Text edit state (for Epic 4)
    ├── slide-2.html
    ├── slide-2-state.json
    └── ...
```

**Slide Status Enum:**

| Status | Meaning |
|--------|---------|
| `pending` | Slide planned but not yet built |
| `built` | Slide successfully generated |
| `failed` | Build attempted but failed (retry available) |

### APIs and Interfaces

**Slash Command Interface:**

| Command | Action | Mode Requirement |
|---------|--------|------------------|
| `/plan-deck` | Initiate deck planning workflow | Theme must exist |
| `/build-one` | Build next unbuilt slide | Deck plan must exist |
| `/build-all` | Build all remaining slides | Deck plan must exist |

**Command Parsing:**

```
/plan-deck                        → Start deck planning workflow
/plan-deck "Q4 Partnership"       → Start with deck name pre-filled
/build-one                        → Build next pending slide from plan
/build-all                        → Build all pending slides in sequence
```

**Plan Modification Commands (within /plan-deck workflow):**

```
"Add a slide about ROI after slide 3"    → Insert new slide at position 4
"Remove slide 5"                          → Delete slide, renumber remaining
"Move slide 7 to position 2"              → Reorder slides
"Change slide 3 to focus on security"     → Update slide intent/description
"done" / "looks good"                     → Finalize plan
```

**Internal Module Interfaces:**

**Narrative Generator:**
```
Input:
  - purpose: string
  - audience: string
  - audience_knowledge_level: string
  - key_points: string[]
  - desired_length: number (optional, default 6-10)
Output:
  - storyline: { opening_hook, tension, resolution, call_to_action }
  - slides: SlideDefinition[]
```

**Deck Build Router:**
```
Input:
  - plan_yaml: PlanYaml object
  - status_yaml: StatusYaml object
Output:
  - next_slide_number: number | null
  - slide_context: SlideDefinition | null
  - message: string (if all built)
```

**Batch Builder:**
```
Input:
  - plan_yaml: PlanYaml object
  - theme_json: ThemeJson object
Output:
  - results: BuildResult[]
  - summary: {
      total: number,
      built: number,
      failed: number,
      elapsed_ms: number
    }
```

**File System Interface:**

```
Read Operations:
- .slide-builder/theme.json (prerequisite check)
- .slide-builder/status.yaml (mode detection)
- .slide-builder/deck/plan.yaml (slide context)

Write Operations:
- .slide-builder/deck/plan.yaml (create/update plan)
- .slide-builder/deck/slides/slide-{n}.html (generated slides)
- .slide-builder/deck/slides/slide-{n}-state.json (empty state for Epic 4)
- .slide-builder/status.yaml (mode, progress tracking)
```

### Workflows and Sequencing

**Complete /plan-deck Workflow:**

```
Phase 1: Prerequisites & Input Collection
┌─────────────────────────────────────────────────────────────┐
│ 1. Check theme.json exists                                   │
│    → If missing: Error "Run /setup first to create theme"    │
│ 2. Check for existing deck plan                              │
│    → If exists: "Existing plan found. [c]ontinue or [n]ew?"  │
│ 3. Prompt for presentation purpose                           │
│    → "What is this presentation for?"                        │
│ 4. Prompt for target audience                                │
│    → "Who is the audience?"                                  │
│ 5. Prompt for key points (bullet list)                       │
│    → "What are the key points to convey?"                    │
│ 6. Optionally prompt for desired length                      │
│    → Default: 6-10 slides                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Narrative Generation
┌─────────────────────────────────────────────────────────────┐
│ 1. Analyze inputs for storyline arc                          │
│ 2. Generate storyline structure:                             │
│    - opening_hook: How to grab attention                     │
│    - tension: The problem being addressed                    │
│    - resolution: How solution resolves tension               │
│    - call_to_action: Specific next step                      │
│ 3. Generate slide breakdown (6-10 slides):                   │
│    - For each slide: number, intent, template, storyline_role│
│    - Include key_points, tone, visual_guidance               │
│ 4. Display proposed narrative to user                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Plan Refinement
┌─────────────────────────────────────────────────────────────┐
│ 1. Display slide-by-slide breakdown                          │
│ 2. Prompt: "Make changes or type 'done' to finalize"         │
│ 3. Process modification commands:                            │
│    - Add/remove/reorder slides                               │
│    - Modify individual slide descriptions                    │
│ 4. After each change: redisplay updated plan                 │
│ 5. Renumber slides after structural changes                  │
│ 6. Loop until user confirms "done"                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Plan Persistence
┌─────────────────────────────────────────────────────────────┐
│ 1. Write plan.yaml to .slide-builder/deck/                   │
│ 2. Create deck/slides/ directory if needed                   │
│ 3. Update status.yaml:                                       │
│    - mode: "deck"                                            │
│    - total_slides: {count}                                   │
│    - built_count: 0                                          │
│    - current_slide: 0                                        │
│ 4. Add to history: "Deck plan created with N slides"         │
│ 5. Display success message with next steps:                  │
│    "Plan saved! Run /build-one or /build-all to start"       │
└─────────────────────────────────────────────────────────────┘
```

**Complete /build-one Workflow (Deck Mode):**

```
Phase 1: Mode Detection & Routing
┌─────────────────────────────────────────────────────────────┐
│ 1. Read status.yaml for current mode                         │
│ 2. If mode == "deck":                                        │
│    → Proceed with deck build flow                            │
│ 3. If mode == "single":                                      │
│    → Route to Epic 3 single slide build                      │
│ 4. If mode == null:                                          │
│    → Error "No plan found. Run /plan-one or /plan-deck"      │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Find Next Slide
┌─────────────────────────────────────────────────────────────┐
│ 1. Read deck/plan.yaml                                       │
│ 2. Find first slide with status: "pending"                   │
│ 3. If no pending slides:                                     │
│    → "All slides built! Run /export when ready."             │
│    → Exit workflow                                           │
│ 4. Extract slide context:                                    │
│    - intent, template, key_points, tone, etc.                │
│ 5. Update status.yaml: current_slide = {number}              │
│ 6. Display: "Building slide {n}: {intent}"                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Template Decision
┌─────────────────────────────────────────────────────────────┐
│ 1. Check slide template field                                │
│ 2. If template specified and exists:                         │
│    → Use template-based generation                           │
│ 3. If template == "custom" or no match:                      │
│    → Use frontend-design skill                               │
│ 4. Load theme.json for style consistency                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Slide Generation
┌─────────────────────────────────────────────────────────────┐
│ 1. Prepare generation context:                               │
│    - Slide intent and key_points                             │
│    - Theme primitives                                        │
│    - Template or custom instruction                          │
│    - Constraints: 1920x1080, contenteditable, data-field     │
│ 2. Generate slide HTML                                       │
│ 3. Validate output:                                          │
│    - Has required attributes                                 │
│    - Uses theme CSS variables                                │
│    - Renders at correct dimensions                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: Save & Update Progress
┌─────────────────────────────────────────────────────────────┐
│ 1. Save slide to deck/slides/slide-{n}.html                  │
│ 2. Create empty slide-{n}-state.json                         │
│ 3. Update plan.yaml: slide status → "built"                  │
│ 4. Update status.yaml:                                       │
│    - built_count++                                           │
│    - last_action: "Built slide {n}: {intent}"                │
│    - Add to history                                          │
│ 5. Display success:                                          │
│    "Slide {n} built ({built}/{total})"                       │
│    "Open deck/slides/slide-{n}.html to preview"              │
│ 6. Show remaining slides count                               │
└─────────────────────────────────────────────────────────────┘
```

**Complete /build-all Workflow:**

```
Phase 1: Prerequisites
┌─────────────────────────────────────────────────────────────┐
│ 1. Check mode == "deck"                                      │
│    → If not: Error "/build-all is for deck mode only"        │
│ 2. Read plan.yaml                                            │
│ 3. Count pending slides                                      │
│ 4. If zero pending:                                          │
│    → "All slides already built!"                             │
│ 5. Display: "Building {n} remaining slides..."               │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Batch Generation Loop
┌─────────────────────────────────────────────────────────────┐
│ For each pending slide (in order):                           │
│   1. Display progress: "Building slide {n} of {total}..."    │
│   2. Execute slide generation (same as /build-one Phase 3-4) │
│   3. If success:                                             │
│      → Save slide, update status to "built"                  │
│      → Continue to next slide                                │
│   4. If error:                                               │
│      → Log error                                             │
│      → Mark status as "failed"                               │
│      → Continue to next slide (don't abort batch)            │
│   5. Update progress display                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Summary & Completion
┌─────────────────────────────────────────────────────────────┐
│ 1. Calculate summary:                                        │
│    - Total attempted                                         │
│    - Successfully built                                      │
│    - Failed (with slide numbers)                             │
│ 2. Update status.yaml:                                       │
│    - built_count = final count                               │
│    - last_action: "Batch built {n} slides"                   │
│ 3. Display results:                                          │
│    "Build complete!"                                         │
│    "Built: {n}/{total} slides"                               │
│    If failed: "Failed slides: {list} - retry with /build-one"│
│ 4. Suggest next steps:                                       │
│    "Review slides in deck/slides/"                           │
│    "Use /edit {n} to refine any slide"                       │
│    "Run /export when ready"                                  │
└─────────────────────────────────────────────────────────────┘
```

**Plan Modification Flow:**

```
User: "Add a slide about ROI after slide 3"
         ↓
Parse command:
  - Action: "add"
  - Position: after slide 3 (= position 4)
  - Content: "ROI"
         ↓
Generate new slide entry:
  - number: 4
  - intent: "ROI analysis"
  - template: "layout-columns-2" (inferred)
  - status: pending
  - storyline_role: "evidence"
  - key_points: (AI-generated based on context)
         ↓
Renumber subsequent slides:
  - Old slide 4 → slide 5
  - Old slide 5 → slide 6
  - etc.
         ↓
If any renumbered slides have status "built":
  - Warn: "Note: Slide files not renamed. Built slides unchanged."
         ↓
Save updated plan.yaml
         ↓
Display updated plan to user
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source | Notes |
|-------------|--------|--------|-------|
| Plan generation | < 30 seconds | NFR1 | Narrative structure + slide breakdown |
| Single slide build | < 30 seconds | NFR2 | Template or custom generation |
| Batch build (per slide) | < 30 seconds each | Derived | Sequential, not parallel |
| Full 10-slide deck batch | < 5 minutes | Derived | Including progress updates |
| Plan modification | < 2 seconds | Local | Add/remove/reorder operations |
| Plan save | < 1 second | Local | YAML file write |
| Progress update display | Real-time | UX | User sees each slide complete |

**Performance Notes:**
- Per PRD NFR1: "Sample deck generation (6 slides) completes within reasonable time" - same applies to deck builds
- Per PRD NFR2: "Single slide generation completes within reasonable time for interactive use"
- Batch builds show per-slide progress to maintain user confidence
- Plan modifications are local file operations (fast)
- Template-based slides are faster than custom (no skill invocation)

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| Deck content privacy | All operations local; no network transmission | NFR12, NFR13 |
| Plan data sensitivity | plan.yaml stored locally only | NFR13 |
| Audience information | Not transmitted externally | NFR13 |
| Theme exposure | theme.json contains styling only, no secrets | Local-first |

**Security Patterns:**
- Per PRD NFR12: "No brand assets or slide content transmitted to external services"
- Per PRD NFR13: "Theme files and slide content remain local to user's machine"
- Deck plans may contain sensitive business information (audience, strategy) - all local
- No credentials or authentication involved in Epic 5 operations

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| Theme missing | Error: "Run /setup first to create theme" | Prerequisite |
| Plan missing | Error: "Run /plan-deck first" | Prerequisite |
| Partial batch failure | Continue building; mark failed slides; summary at end | NFR14 |
| Single slide failure | Mark as "failed" in plan.yaml; allow retry | NFR14 |
| Interrupted batch build | Resume from last pending slide | NFR14 |
| Plan file corrupted | Human-readable YAML for manual recovery | NFR17 |
| Directory missing | Auto-create deck/slides/ on first build | Graceful handling |

**Recovery Patterns:**
- Per PRD NFR14: "Partial deck builds are recoverable (resume from last completed slide)"
- Per PRD NFR17: "State files are human-readable YAML for manual recovery if needed"
- Batch builds NEVER abort on single slide failure
- Failed slides tracked in plan.yaml for easy retry
- Resume capability: just run /build-one or /build-all again

**Failure Modes:**

```
Single Slide Failure:
┌─────────────────────────────────────────┐
│ 1. Slide generation fails                │
│ 2. Mark plan.yaml slide status: "failed" │
│ 3. Log error to console                  │
│ 4. Display: "Slide {n} failed: {error}"  │
│ 5. Suggest: "Retry with /build-one"      │
└─────────────────────────────────────────┘

Batch Failure Recovery:
┌─────────────────────────────────────────┐
│ 1. Some slides fail during /build-all    │
│ 2. Built slides saved normally           │
│ 3. Failed slides marked in plan.yaml     │
│ 4. Summary shows: "Built 7/10, Failed 3" │
│ 5. User can retry: /build-one (targets   │
│    first pending/failed slide)           │
└─────────────────────────────────────────┘
```

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Plan creation started | Console | "Starting deck planning..." |
| Narrative generated | Console | "Generated storyline with {n} slides" |
| Plan modification | Console | "Added slide 4: ROI analysis" |
| Plan saved | Console + status.yaml | "Plan saved to deck/plan.yaml" |
| Build started | Console | "Building slide {n}/{total}: {intent}" |
| Build progress (batch) | Console | "Building slide 3 of 10..." |
| Build completed | Console + status.yaml | "Slide {n} built successfully" |
| Build failed | Console + plan.yaml | "Error building slide {n}: {reason}" |
| Batch summary | Console | "Build complete: 10/10 slides" |

**Logging Strategy:**
- Real-time console output for user feedback during planning and building
- status.yaml history entry for each significant action
- plan.yaml slide status tracks build state
- No external logging (local-first per ADR-005)

**Status Tracking in status.yaml:**

```yaml
# After successful batch build
mode: deck
current_slide: 7
total_slides: 7
built_count: 7
last_action: "Batch built 7 slides"
last_modified: "2026-01-27T15:30:00Z"
history:
  - action: "Deck plan created with 7 slides"
    timestamp: "2026-01-27T14:30:00Z"
  - action: "Built slide 1: Title - Partnership framing"
    timestamp: "2026-01-27T15:00:00Z"
  - action: "Built slide 2: Problem statement"
    timestamp: "2026-01-27T15:05:00Z"
  # ... continues for each slide
  - action: "Batch build complete: 7/7 slides"
    timestamp: "2026-01-27T15:30:00Z"
```

## Dependencies and Integrations

**NPM Dependencies (from package.json):**

| Package | Version | Purpose | Used in Epic 5 |
|---------|---------|---------|----------------|
| puppeteer | ^23.0.0 | HTML-to-image conversion | No (Epic 7) |
| googleapis | ^140.0.0 | Google Slides API | No (Epic 7) |

**Note:** Epic 5 does not require npm dependencies. All operations use Claude Code built-in capabilities.

**Claude Code Built-in Tools:**

| Tool | Purpose | Usage in Epic 5 |
|------|---------|-----------------|
| frontend-design skill | Generate slide layouts | Stories 5.3, 5.4 |
| File System (Read) | Load theme, status, plan | All stories |
| File System (Write) | Save plan, slides, status | All stories |
| Bash (optional) | Open browser for preview | After build |

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Claude Code | Current | Framework runtime environment |
| Modern browser | Chrome/Firefox/Safari | Slide preview (optional) |
| File system access | N/A | Read/write slides and state |

**Epic Dependencies:**

| Dependency | From Epic | Required By | Relationship |
|------------|-----------|-------------|--------------|
| theme.json | Epic 2 | Story 5.1 | MUST exist before /plan-deck |
| status.yaml | Epic 1 | All stories | Mode tracking and progress |
| Template files | Epic 2 | Stories 5.3, 5.4 | Optional (fallback to custom) |
| HTML Slide Pattern | Epic 3 | Stories 5.3, 5.4 | Slide generation reuses pattern |
| contenteditable pattern | Epic 3 | Stories 5.3, 5.4 | All slides must support editing |
| slide-state.json pattern | Epic 3 | Stories 5.3, 5.4 | Created for Epic 4 compatibility |

**Integration Points:**

| Integration | Method | Direction | Epic 5 Scope |
|-------------|--------|-----------|--------------|
| Theme system | File read | Inbound | Load theme for slide generation |
| Status tracking | File read/write | Bidirectional | Mode, progress tracking |
| Plan storage | File read/write | Bidirectional | Create/update/read plan.yaml |
| Slide files | File write | Outbound | Generate slide HTML files |
| frontend-design skill | Skill invocation | Outbound | Generate custom slides |
| Browser | File open | Outbound | Preview after build (optional) |

**Data Flow:**

```
/plan-deck command
     ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │────→│ Prerequisite    │
│ (Epic 2)       │     │ Check           │
└────────────────┘     └────────┬────────┘
                                ↓
                       ┌─────────────────┐
User Input ──────────→│ Narrative       │
  (purpose, audience)  │ Generator       │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │ Plan Modifier   │←── User modifications
                       └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ plan.yaml      │←────│ Plan Persister  │
│ (created)      │     └─────────────────┘
└────────────────┘
        ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │←────│ Mode Switcher   │
│ (mode: deck)   │     └─────────────────┘
└────────────────┘

/build-one or /build-all command
     ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │────→│ Mode Detection  │
│ plan.yaml      │     └────────┬────────┘
└────────────────┘              ↓
                       ┌─────────────────┐
┌────────────────┐     │ Deck Build      │
│ theme.json     │────→│ Router          │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ templates/     │────→│ Slide Builder   │
│ (Epic 2)       │     │ (or skill)      │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ slide-{n}.html │←────│ Save & Track    │
│ slide-{n}-     │     │ Progress        │
│ state.json     │     └─────────────────┘
└────────────────┘
        ↓
┌────────────────┐
│ plan.yaml      │ (status: built)
│ status.yaml    │ (built_count++)
└────────────────┘
```

**External Service Dependencies:**

| Service | Required? | Purpose | Fallback |
|---------|-----------|---------|----------|
| Google Fonts | Optional | Font rendering in slides | System fonts |

**No external APIs called** - all processing uses local files and Claude's native capabilities.

## Acceptance Criteria (Authoritative)

### Story 5.1: Deck Planning Initiation

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC5.1.1 | Given a theme exists, when the user runs `/plan-deck`, then they are prompted for presentation purpose |
| AC5.1.2 | The user is prompted for target audience (e.g., "Technical decision makers") |
| AC5.1.3 | The user is prompted for key points to convey (bullet list) |
| AC5.1.4 | The user can optionally specify desired length (defaults to 6-10 slides) |
| AC5.1.5 | After collecting inputs, the system proposes a narrative structure with slide-by-slide breakdown |
| AC5.1.6 | Each slide in the proposal shows: number, title/purpose, key content description, suggested template |
| AC5.1.7 | The deck plan is saved to `.slide-builder/deck/plan.yaml` |
| AC5.1.8 | status.yaml is updated with mode: "deck" and total_slides count |
| AC5.1.9 | Given no theme exists, when user runs `/plan-deck`, then error message directs them to run `/setup` first |

### Story 5.2: Plan Modification

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC5.2.1 | Given a deck plan has been proposed, when the user requests to add a slide, then a new slide is inserted at the specified position |
| AC5.2.2 | When the user requests to remove a slide, then the slide is deleted and remaining slides are renumbered |
| AC5.2.3 | When the user requests to reorder slides (e.g., "Move slide 7 to position 2"), then slides are reordered accordingly |
| AC5.2.4 | When the user requests to modify a slide description, then the slide intent/description is updated |
| AC5.2.5 | After each modification, the updated plan is displayed to the user |
| AC5.2.6 | Slide numbers are automatically renumbered after structural changes |
| AC5.2.7 | The plan.yaml file is saved after each modification |
| AC5.2.8 | If built slides exist and would be affected by reorder, a warning is displayed |

### Story 5.3: Incremental Slide Building

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC5.3.1 | Given a deck plan exists with unbuilt slides, when the user runs `/build-one`, then the system identifies the next unbuilt slide from plan.yaml |
| AC5.3.2 | The system generates the slide using template or frontend-design skill based on intent |
| AC5.3.3 | The slide is saved to `.slide-builder/deck/slides/slide-{n}.html` |
| AC5.3.4 | A corresponding empty slide-{n}-state.json is created for Epic 4 compatibility |
| AC5.3.5 | plan.yaml slide status is updated to "built" |
| AC5.3.6 | status.yaml is updated with built_count and last_action |
| AC5.3.7 | The user is shown remaining slide count after each build |
| AC5.3.8 | Given all slides are already built, when the user runs `/build-one`, then message indicates "All slides built" with next steps |

### Story 5.4: Batch Slide Building

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC5.4.1 | Given a deck plan exists with unbuilt slides, when the user runs `/build-all`, then the system iterates through all unbuilt slides in order |
| AC5.4.2 | Each slide is generated using template or frontend-design skill |
| AC5.4.3 | Each slide is saved to deck/slides/ directory |
| AC5.4.4 | Progress is reported during generation (e.g., "Building slide 3 of 7...") |
| AC5.4.5 | plan.yaml statuses are updated as each slide completes |
| AC5.4.6 | If an error occurs during batch generation, the error is logged and generation continues with the next slide |
| AC5.4.7 | Failed slides are marked in plan.yaml for retry |
| AC5.4.8 | Final summary shows total slides built and any failures |
| AC5.4.9 | status.yaml is updated with final built_count and batch action in history |

## Traceability Mapping

| AC | Spec Section | Component/Module | Test Idea |
|----|--------------|------------------|-----------|
| AC5.1.1 | Services/Deck Plan Initiator | Prerequisite check | Run `/plan-deck` with theme, verify purpose prompt |
| AC5.1.2 | Services/Deck Plan Initiator | Input collection | Verify audience prompt appears |
| AC5.1.3 | Services/Deck Plan Initiator | Input collection | Verify key points prompt accepts bullet list |
| AC5.1.4 | Services/Deck Plan Initiator | Input collection | Skip length prompt, verify default 6-10 slides |
| AC5.1.5 | Services/Narrative Generator | Storyline generation | Provide inputs, verify narrative structure proposed |
| AC5.1.6 | Services/Narrative Generator | Slide breakdown | Check proposal shows number, intent, template for each |
| AC5.1.7 | Services/Mode Switcher | Plan persistence | After confirm, verify deck/plan.yaml exists with content |
| AC5.1.8 | Services/Mode Switcher | Status update | Check status.yaml has mode: deck, total_slides set |
| AC5.1.9 | Services/Deck Plan Initiator | Error handling | Delete theme.json, run `/plan-deck`, verify error |
| AC5.2.1 | Services/Plan Modifier | Add slide | Request "add slide about X after 3", verify slide 4 added |
| AC5.2.2 | Services/Plan Modifier | Remove slide | Request "remove slide 5", verify removed and renumbered |
| AC5.2.3 | Services/Plan Modifier | Reorder | Request "move slide 7 to 2", verify correct order |
| AC5.2.4 | Services/Plan Modifier | Modify | Request "change slide 3 to focus on Y", verify updated |
| AC5.2.5 | Workflows/Phase 3 | Display update | After each change, verify plan redisplayed |
| AC5.2.6 | Services/Plan Modifier | Renumbering | After add/remove, verify sequential numbering |
| AC5.2.7 | Services/Plan Modifier | Persistence | After modification, verify plan.yaml updated on disk |
| AC5.2.8 | Services/Plan Modifier | Built slide warning | Build slide 1, then reorder, verify warning shown |
| AC5.3.1 | Services/Deck Build Router | Next slide detection | Create plan with 5 pending, run `/build-one`, verify slide 1 selected |
| AC5.3.2 | Services/Slide Builder | Generation | Check slide uses correct template or custom generation |
| AC5.3.3 | Services/Slide Builder | File save | Verify deck/slides/slide-1.html created |
| AC5.3.4 | Services/Slide Builder | State file | Verify deck/slides/slide-1-state.json created |
| AC5.3.5 | Services/Progress Tracker | Plan update | After build, verify plan.yaml slide status is "built" |
| AC5.3.6 | Services/Progress Tracker | Status update | After build, verify status.yaml built_count incremented |
| AC5.3.7 | Workflows/Phase 5 | Progress display | After build, verify "3/7 slides built" message |
| AC5.3.8 | Services/Deck Build Router | All built check | Build all slides, run `/build-one`, verify "All built" message |
| AC5.4.1 | Services/Batch Builder | Iteration | Create 5 pending, run `/build-all`, verify all 5 attempted |
| AC5.4.2 | Services/Slide Builder | Generation | Verify each slide generated correctly |
| AC5.4.3 | Services/Batch Builder | File saves | After batch, verify all slide-{n}.html files exist |
| AC5.4.4 | Services/Batch Builder | Progress display | During batch, verify "Building 3 of 5..." messages |
| AC5.4.5 | Services/Progress Tracker | Plan updates | After batch, verify all slide statuses updated |
| AC5.4.6 | Services/Batch Builder | Error handling | Force one slide to fail, verify batch continues |
| AC5.4.7 | Services/Batch Builder | Failed marking | After failure, verify plan.yaml shows status: "failed" |
| AC5.4.8 | Services/Batch Builder | Summary | After batch, verify "Built 4/5, Failed 1" summary |
| AC5.4.9 | Services/Progress Tracker | History | After batch, verify status.yaml history has batch entry |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Narrative generation produces poor storyline structure | Medium - user must heavily edit plan | Low | Use rich context from user inputs; allow full plan modification |
| **R2:** Template matching fails for many slide intents | Medium - increased build time (skill calls) | Medium | Expand template matching keywords; fall back gracefully to skill |
| **R3:** Batch build takes too long for large decks | Medium - poor UX for 15+ slide decks | Low | Show progress; allow cancellation; resume from last built |
| **R4:** Plan modifications don't persist correctly | High - lost planning work | Low | Save after each modification; verify file writes |
| **R5:** Slide renumbering breaks references in built slides | Medium - confusion | Medium | Warn user about built slides; don't rename slide files |
| **R6:** Large plans exceed reasonable YAML size | Low - unlikely with 10-15 slides | Very Low | No current mitigation needed; monitor |
| **R7:** Concurrent /build-one calls during /build-all | Low - rare edge case | Very Low | Status.yaml tracks current_slide; sequential execution |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | theme.json exists from Epic 2 before /plan-deck runs | Workflow fails; clear error needed |
| **A2** | Users understand narrative-first approach | May expect to specify layouts directly; clarify in prompts |
| **A3** | 6-10 slides is appropriate default range | May need adjustment based on user feedback |
| **A4** | Slide intent is sufficient context for generation | May need more detailed prompts; plan.yaml supports rich context |
| **A5** | Template selection via intent keywords is reliable | May need ML-based matching in future; fallback to skill works |
| **A6** | Users will primarily use /build-all for full decks | /build-one available for incremental review |
| **A7** | Slide files named slide-{n}.html remain stable after build | Renumbering in plan doesn't rename files |
| **A8** | Empty state JSON is sufficient for Epic 4 compatibility | May need to pre-populate with field selectors |

### Open Questions

| ID | Question | Owner | Status | Recommendation |
|----|----------|-------|--------|----------------|
| **Q1** | Should plan modifications be undoable? | Dev | Open | Recommend: Version plan.yaml on each change (simple backup) |
| **Q2** | How to handle reordering when slides are already built? | Dev | Recommend | Warn user; keep slide files as-is; note discrepancy |
| **Q3** | Should /build-all support parallelism for speed? | Dev | Deferred | Sequential for MVP; parallel is Growth feature |
| **Q4** | What happens if user changes theme after plan created? | Dev | Open | Recommend: Rebuild slides with new theme on next build |
| **Q5** | Should deck name be required or optional? | Dev | Recommend | Optional with default "Untitled Deck" |
| **Q6** | How detailed should speaker_notes_hint be in generated plans? | Dev | Open | Brief hints; full speaker notes are Growth feature |
| **Q7** | Should we support importing existing plan.yaml from file? | Dev | Deferred | Not in MVP; manual edit is power user path |
| **Q8** | How to handle /plan-deck when existing deck has built slides? | Dev | Recommend | Warn and ask: "Overwrite existing deck? Built slides will be kept." |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Narrative Generator, Plan Modifier, etc.) | Manual verification per module |
| **Integration** | Full workflows (/plan-deck, /build-one, /build-all) | End-to-end testing with various scenarios |
| **Acceptance** | All ACs per story | Manual testing per AC table |
| **Regression** | Epic 3 functionality (single slide mode, template builds) | Verify Epic 3 patterns still work |

### Test Approach by Story

**Story 5.1: Deck Planning Initiation**
- Run `/plan-deck` with theme present, verify all prompts appear in order
- Provide minimal inputs (purpose only), verify defaults applied
- Provide full inputs including desired length, verify respected
- Check proposed narrative has storyline structure (hook, tension, resolution, CTA)
- Check each slide has number, intent, template, storyline_role
- Verify plan.yaml created in correct location with correct schema
- Verify status.yaml updated: mode=deck, total_slides set
- Delete theme.json, run `/plan-deck`, verify clear error message

**Story 5.2: Plan Modification**
- After proposal, request "add slide about ROI after 3", verify inserted at position 4
- Request "remove slide 5", verify removed and slides 6+ renumbered
- Request "move slide 7 to position 2", verify correct reordering
- Request "change slide 3 to focus on security", verify description updated
- Verify plan redisplayed after each modification
- Build slide 1, then request reorder, verify warning about built slides
- After modifications, verify plan.yaml updated on disk immediately

**Story 5.3: Incremental Slide Building**
- Create plan with 5 slides, run `/build-one`, verify slide 1 built
- Run again, verify slide 2 built (not slide 1 again)
- Check deck/slides/slide-1.html exists with correct structure
- Check deck/slides/slide-1-state.json created (empty or minimal)
- Check plan.yaml slide 1 status changed to "built"
- Check status.yaml built_count incremented
- Build all 5 slides, run `/build-one`, verify "All slides built" message

**Story 5.4: Batch Slide Building**
- Create plan with 7 slides, run `/build-all`
- Verify progress messages: "Building 1 of 7", "Building 2 of 7", etc.
- Verify all 7 slide files created in deck/slides/
- Verify all 7 state.json files created
- Verify plan.yaml shows all status: "built"
- Verify summary: "Build complete: 7/7 slides"
- Force one slide to fail (e.g., corrupted template), verify:
  - Batch continues past failure
  - Failed slide marked status: "failed"
  - Summary shows "Built 6/7, Failed 1"
  - Remaining slides built successfully

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 5.1 | 9 | Input collection + narrative generation + persistence |
| 5.2 | 8 | Plan modification operations + file updates |
| 5.3 | 8 | Incremental build + progress tracking |
| 5.4 | 9 | Batch build + error handling + summary |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No theme exists | Error: "Run /setup first to create theme" |
| Empty key points | Proceed with minimal narrative; suggest adding details |
| Very long deck (15+ slides) | Allow but may be slow; show progress |
| All slides already built | "All slides built! Run /export when ready." |
| Existing deck plan present | "Existing plan found. [c]ontinue editing or [n]ew plan?" |
| User cancels during batch | Stop gracefully; preserve built slides |
| Slide number out of range | "Invalid slide number. Valid range: 1-{total}" |
| Template file missing | Fall back to frontend-design skill |
| Plan.yaml corrupted | Error with guidance; suggest manual recovery |

### Regression Tests (Epic 3 Compatibility)

| Test | Purpose |
|------|---------|
| Single mode still works | After deck mode use, `/plan-one` + `/build-one` still function |
| Template-based generation | Verify template slides still generated correctly |
| Custom slide generation | Verify frontend-design skill invocation still works |
| contenteditable present | All generated slides have contenteditable attributes |
| data-field present | All generated slides have data-field attributes |
| Theme variables applied | Slides use CSS variables from theme.json |
| Slide dimensions | All slides render at 1920x1080 |

### Definition of Done

Epic 5 is complete when:
1. `/plan-deck` successfully captures audience, purpose, and key points
2. System generates narrative structure with 6-10 slide breakdown
3. Users can add, remove, reorder, and modify slides in the plan
4. Plan persists to deck/plan.yaml with correct schema
5. `/build-one` in deck mode builds next unbuilt slide
6. `/build-all` generates all pending slides with progress reporting
7. Batch builds continue on failure; failed slides marked for retry
8. Progress tracking works: status.yaml and plan.yaml updated correctly
9. All 34 acceptance criteria pass manual verification
10. Epic 3 regression tests pass (single mode, templates still work)
