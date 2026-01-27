# Slide Builder - Architecture

## Executive Summary

Slide Builder is an **agentic framework extension for Claude Code** that follows BMAD architectural patterns to deliver a structured slide generation workflow. The architecture mirrors BMAD's own structure: workflow definitions in YAML, instructions in Markdown, state tracking in YAML status files, and slash commands as the user interface.

The system is built as a **Claude Code skill/workflow collection** - not a standalone application. It leverages Claude's native capabilities for content generation while using local file operations for state persistence, Puppeteer for HTML-to-image conversion, and Google Slides API for export.

## Project Initialization

This project is a **Claude Code extension** following the BMAD pattern. No traditional starter template applies - instead, we scaffold the `.slide-builder/` directory structure that mirrors `.bmad/`:

```bash
# Initialize Slide Builder framework structure
mkdir -p .slide-builder/{workflows,templates,samples}
mkdir -p .slide-builder/deck/slides
mkdir -p .slide-builder/single
```

The framework files (workflows, instructions, templates) are the "starter" - they establish the agentic architecture.

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
| -------- | -------- | ------- | ----------- | --------- |
| Slide Generation | Hybrid: Templates + frontend-design skill | N/A | FR4, FR26-28 | Brand consistency via templates, flexibility via skill for novel slides |
| Theme Extraction | Claude vision + reasoning | N/A | FR1-3 | Native capabilities, no external deps, captures brand personality |
| Workflow-Skill Integration | Instructions invoke skills via action tags | N/A | FR48-50 | Mirrors BMAD pattern - workflows orchestrate, skills execute |
| Framework Pattern | BMAD-mirror structure | N/A | FR48-52 | 100% alignment with BMAD architecture |
| State Format | YAML files (plan.yaml, status.yaml) | N/A | FR51 | Human-readable, matches BMAD pattern |
| HTML-to-Image | Puppeteer headless browser | Latest | FR43 | Standard tool for HTML screenshots |
| Google Slides API | OAuth 2.0 + googleapis | Latest | FR42-47 | Official API for slide creation |
| Text Edit Persistence | JSON state file per slide | N/A | FR33, FR41 | Tracks contenteditable changes |

## Project Structure

```
slide-builder/                          # Project root
├── .slide-builder/                     # Framework directory (mirrors .bmad/)
│   ├── workflows/                      # Workflow definitions
│   │   ├── setup/                      # Theme setup workflow
│   │   │   ├── workflow.yaml           # Workflow config
│   │   │   └── instructions.md         # Execution instructions
│   │   ├── plan-one/                   # Single slide planning
│   │   │   ├── workflow.yaml
│   │   │   └── instructions.md
│   │   ├── plan-deck/                  # Deck planning
│   │   │   ├── workflow.yaml
│   │   │   └── instructions.md
│   │   ├── build/                      # Slide building
│   │   │   ├── workflow.yaml
│   │   │   └── instructions.md
│   │   ├── edit/                       # Slide editing
│   │   │   ├── workflow.yaml
│   │   │   └── instructions.md
│   │   └── export/                     # Google Slides export
│   │       ├── workflow.yaml
│   │       └── instructions.md
│   │
│   ├── templates/                      # Generated HTML templates (from /setup)
│   │   ├── layout-title.html           # Title slide template
│   │   ├── layout-list.html            # Bullet list template
│   │   ├── layout-flow.html            # Process flow template
│   │   ├── layout-columns-2.html       # Two-column template
│   │   ├── layout-columns-3.html       # Three-column template
│   │   ├── layout-callout.html         # Centered callout template
│   │   └── layout-code.html            # Code showcase template
│   │
│   ├── samples/                        # Sample deck generated during setup
│   │   ├── sample-1-title.html
│   │   ├── sample-2-list.html
│   │   ├── sample-3-flow.html
│   │   ├── sample-4-columns.html
│   │   ├── sample-5-callout.html
│   │   └── sample-6-code.html
│   │
│   ├── theme.json                      # Generated theme primitives
│   ├── theme-history/                  # Theme version history
│   │   └── theme-v1-2026-01-26.json
│   │
│   ├── single/                         # Single slide mode
│   │   ├── plan.yaml                   # Single slide intent
│   │   ├── slide.html                  # Generated slide
│   │   └── slide-state.json            # Text edit state
│   │
│   ├── deck/                           # Deck mode
│   │   ├── plan.yaml                   # Deck narrative plan
│   │   ├── status.yaml                 # Build progress
│   │   └── slides/                     # Generated slides
│   │       ├── slide-1.html
│   │       ├── slide-1-state.json      # Text edits for slide 1
│   │       ├── slide-2.html
│   │       └── ...
│   │
│   └── credentials/                    # API credentials (gitignored)
│       └── google-oauth.json
│
├── .gitignore                          # Ignore credentials, node_modules
├── package.json                        # Dependencies (puppeteer, googleapis)
└── README.md                           # Setup instructions
```

## FR Category to Architecture Mapping

| FR Category | Architecture Component | Key Files |
|-------------|----------------------|-----------|
| Theme Management (FR1-11) | `/setup` workflow + theme.json | `workflows/setup/`, `theme.json`, `theme-history/` |
| Planning - Single (FR12-15) | `/plan-one` workflow | `workflows/plan-one/`, `single/plan.yaml` |
| Planning - Deck (FR16-21) | `/plan-deck` workflow | `workflows/plan-deck/`, `deck/plan.yaml` |
| Building (FR22-30) | `/build` workflow + templates | `workflows/build/`, `templates/`, `deck/slides/` |
| Slide Output (FR31-36) | HTML generation + state files | `templates/*.html`, `*-state.json` |
| Editing (FR37-41) | `/edit` workflow + state preservation | `workflows/edit/`, `*-state.json` |
| Export (FR42-47) | `/export` workflow + Puppeteer + Google API | `workflows/export/`, `credentials/` |
| Framework (FR48-52) | BMAD-pattern structure | All `workflow.yaml` + `instructions.md` files |

## Technology Stack Details

### Core Technologies

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Claude Code** | Runtime environment | Framework runs as Claude Code skills/workflows |
| **Claude Vision** | Brand asset analysis | Extracts colors, typography from PDFs/images |
| **frontend-design skill** | HTML slide generation | Invoked for template creation and custom slides |
| **HTML/CSS/JS** | Slide format | Self-contained slides, contenteditable for text |
| **YAML** | State files | plan.yaml, status.yaml, workflow.yaml |
| **JSON** | Theme + edit state | theme.json, *-state.json |

### Dependencies (package.json)

```json
{
  "name": "slide-builder",
  "dependencies": {
    "puppeteer": "latest",
    "googleapis": "latest"
  }
}
```

### Integration Points

| Integration | Method | Purpose |
|-------------|--------|---------|
| **Brand Assets → Theme** | Claude vision + WebFetch | Extract primitives from PDFs, images, websites |
| **Theme → Templates** | frontend-design skill | Generate brand-verified HTML templates |
| **Templates → Slides** | Template injection | Fill templates with slide content |
| **Custom → Slides** | frontend-design skill | Generate novel slide layouts |
| **HTML → Images** | Puppeteer CLI | Screenshot slides at 1920x1080 |
| **Images → Google Slides** | googleapis OAuth | Upload images to new presentation |

## Novel Pattern Designs

### Pattern 1: Theme Extraction Pipeline

**Problem:** Extract complete brand DNA from diverse inputs (websites, PDFs, images)

**Solution:**

```
Input Sources:
├── Website URL → WebFetch → HTML/CSS analysis
├── PDF files → Claude vision → Visual analysis
├── Image files → Claude vision → Color/style extraction
└── User description → Context for interpretation

Processing:
├── Color extraction (primary, secondary, accent, backgrounds)
├── Typography detection (fonts, weights, scales)
├── Shape inference (corner radius, shadows, borders)
├── Brand personality classification (bold, minimal, corporate, playful)
└── Semantic style mapping (what style for "emphasis", "warning", etc.)

Output:
└── theme.json (complete primitive schema)
```

### Pattern 2: Template-or-Custom Decision

**Problem:** Decide whether to use a pre-built template or invoke frontend-design skill

**Solution:**

```
Input: Slide intent from plan.yaml

Decision Logic:
├── Parse intent for content type keywords
├── Match against template patterns:
│   ├── "title", "intro", "opening" → layout-title
│   ├── "list", "bullets", "points" → layout-list
│   ├── "flow", "process", "timeline", "steps" → layout-flow
│   ├── "compare", "vs", "two" → layout-columns-2
│   ├── "three", "triad", "options" → layout-columns-3
│   ├── "key", "insight", "callout", "cta" → layout-callout
│   └── "code", "technical", "api" → layout-code
├── If match found → Use template
├── If no match → Invoke frontend-design skill
└── Log decision in status.yaml
```

### Pattern 3: Text Edit Persistence

**Problem:** Preserve user's text edits when layout is regenerated via `/edit`

**Solution:**

```
State File (slide-1-state.json):
{
  "slide": 1,
  "edits": [
    { "selector": "[data-field='title']", "content": "User's edited title" },
    { "selector": "[data-field='bullet-1']", "content": "Edited bullet point" }
  ],
  "lastModified": "2026-01-26T10:30:00Z"
}

On Layout Regeneration:
1. Read state file
2. Generate new layout HTML
3. Apply saved edits to matching selectors
4. Save updated HTML
5. Preserve state file
```

### Pattern 4: Dual-Mode State Management

**Problem:** Support both single-slide and deck modes without collision

**Solution:**

```
Mode Detection:
├── Check for .slide-builder/deck/plan.yaml existence
├── Check for .slide-builder/single/plan.yaml existence
├── If both exist → Prompt user which mode
├── If deck exists → Deck mode
├── If single exists → Single mode
└── If neither → Prompt for mode selection

State Isolation:
├── single/ directory → Completely independent
└── deck/ directory → Completely independent

/build-one behavior:
├── In deck mode → Build next slide from deck/plan.yaml
└── In single mode → Build slide from single/plan.yaml
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Workflow File Pattern

Every workflow follows this structure:

```yaml
# workflow.yaml
name: workflow-name
description: "What this workflow does"
instructions: "{installed_path}/instructions.md"
# ... other config
```

```markdown
# instructions.md
<workflow>
<step n="1" goal="Step description">
  <action>What to do</action>
  <template-output>section_name</template-output>
</step>
</workflow>
```

### HTML Slide Pattern

Every generated slide MUST follow this structure:

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
      --color-secondary: {{theme.colors.secondary}};
      --font-heading: {{theme.typography.fonts.heading}};
      /* ... all theme variables */
    }
    /* Slide-specific styles */
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_number}}">
    <!-- All text elements MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Title Here</h1>
    <p contenteditable="true" data-field="body">Body text</p>
    <!-- Non-text elements -->
    <div class="diagram">...</div>
  </div>
  <script>
    // Auto-save script for contenteditable elements
    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('blur', () => {
        // Save to state file via postMessage or localStorage
      });
    });
  </script>
</body>
</html>
```

### State File Patterns

**status.yaml** (global workflow tracking):
```yaml
# Current operating mode
mode: deck | single | null          # null = no active session

# Slide tracking (relevant in deck mode)
current_slide: 0                    # Current slide being worked on
total_slides: 0                     # Total slides in plan
built_count: 0                      # Number of slides successfully built

# Last action tracking
last_action: "Built slide 1"        # Description of most recent action
last_modified: 2026-01-26T10:30:00Z # ISO 8601 timestamp

# Action history (audit trail)
history:
  - action: "Theme created"
    timestamp: 2026-01-26T09:00:00Z
  - action: "Plan created with 7 slides"
    timestamp: 2026-01-26T09:15:00Z
```

**plan.yaml (deck mode)** - Rich context for AI agents:
```yaml
# Deck Metadata
deck_name: "Acme + CustomerCo Partnership"
created: 2026-01-26
last_modified: 2026-01-26T10:30:00Z

# Audience Context
audience: "CustomerCo executives, technical decision makers"
audience_knowledge_level: intermediate   # beginner | intermediate | expert
audience_priorities:                     # What they care about most
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
    status: pending                      # pending | built

    # Rich context for building agent
    storyline_role: "opening"            # opening | tension | evidence | resolution | cta
    key_points:
      - "Position as strategic partnership, not vendor"
      - "Emphasize shared goals"
    visual_guidance: "Side-by-side logos, clean and equal"
    tone: "warm"                         # professional | bold | warm | technical

    # Technical details (if applicable)
    technical_depth: "none"              # none | overview | detailed | deep-dive

    # Speaker context
    speaker_notes_hint: "Start with relationship, not product"
    transition_to_next: "Let's talk about your current challenges"
```

**plan.yaml (single mode)** - Rich context for standalone slides:
```yaml
# Slide Metadata
created: 2026-01-26T10:30:00Z
last_modified: 2026-01-26T10:45:00Z

# Core Intent
intent: "Architecture diagram showing our 3-tier system with data flow"
suggested_template: "layout-flow"        # or "custom" for novel layouts

# Audience Context
audience: "Engineering team"
audience_knowledge_level: "expert"
context: "Inserted into existing technical review deck"

# Content Details
key_points:
  - "Frontend connects to API Gateway"
  - "API Gateway routes to microservices"
  - "All services use shared PostgreSQL"
visual_guidance: "Left-to-right flow, use arrows, highlight API layer"
tone: "technical"

# Technical Details
technical_depth: "detailed"
technical_notes: "Show Redis cache layer, mention 99.9% uptime SLA"
include_elements:
  - "Load balancer"
  - "API Gateway"
  - "Auth service"
  - "PostgreSQL cluster"
exclude_elements:
  - "Logging infrastructure"
  - "CI/CD pipeline"

# Data Sources
data_sources:
  - "architecture.md"
specific_data:
  response_time: "< 100ms p99"
  uptime: "99.9%"

# Output Preferences
style_overrides:
  color_emphasis: "accent"
  text_density: "balanced"
agent_notes: "This replaces an outdated diagram - focus on the new cache layer"
```

**theme.json:**
```json
{
  "meta": {
    "name": "Brand Theme",
    "version": "1.0",
    "created": "2026-01-26",
    "sources": ["website.com", "brand.pdf"]
  },
  "colors": {
    "primary": "#2563EB",
    "secondary": "#1E40AF",
    "accent": "#F59E0B",
    "background": { "default": "#FFFFFF", "alt": "#F8FAFC" },
    "text": { "heading": "#0F172A", "body": "#334155" }
  },
  "typography": {
    "fonts": { "heading": "Inter", "body": "Inter", "mono": "JetBrains Mono" },
    "scale": { "hero": "72px", "h1": "48px", "h2": "36px", "body": "18px" }
  },
  "shapes": {
    "boxes": {
      "default": { "cornerRadius": "8px", "shadow": "0 4px 6px rgba(0,0,0,0.1)" },
      "callout": { "cornerRadius": "12px", "shadow": "0 10px 25px rgba(0,0,0,0.1)" }
    },
    "arrows": {
      "default": { "strokeWidth": "2px", "headType": "triangle", "curve": "smooth" }
    }
  },
  "layouts": {
    "title": { "file": "layout-title.html" },
    "list": { "file": "layout-list.html" },
    "flow": { "file": "layout-flow.html" },
    "columns-2": { "file": "layout-columns-2.html" },
    "columns-3": { "file": "layout-columns-3.html" },
    "callout": { "file": "layout-callout.html" },
    "code": { "file": "layout-code.html" }
  }
}
```

## Consistency Rules

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Workflow folders | kebab-case | `plan-one/`, `plan-deck/` |
| Workflow files | lowercase with extension | `workflow.yaml`, `instructions.md` |
| Template files | `layout-{name}.html` | `layout-title.html`, `layout-flow.html` |
| Slide files | `slide-{n}.html` | `slide-1.html`, `slide-2.html` |
| State files | `{name}-state.json` | `slide-1-state.json` |
| CSS variables | `--{category}-{name}` | `--color-primary`, `--font-heading` |
| Data attributes | `data-{purpose}` | `data-field="title"`, `data-slide-id="1"` |

### Code Organization

```
Workflow structure:
├── workflow.yaml       # Configuration only
└── instructions.md     # All execution logic

No separate code files - Claude executes instructions directly.
Templates and state files are data, not code.
```

### Error Handling

| Scenario | Handling |
|----------|----------|
| Theme not found | Prompt user to run `/setup` first |
| Plan not found | Prompt user to run `/plan-one` or `/plan-deck` first |
| Template missing | Fall back to frontend-design skill |
| Export auth fails | Guide user through OAuth re-authentication |
| Puppeteer fails | Provide manual screenshot instructions |

### Logging Strategy

All significant actions logged to `status.yaml`:

```yaml
last_action: "Built slide 3 using layout-columns-3 template"
last_modified: 2026-01-26T10:30:00Z
history:
  - action: "Theme created"
    timestamp: 2026-01-26T09:00:00Z
  - action: "Plan created with 7 slides"
    timestamp: 2026-01-26T09:15:00Z
```

## Data Architecture

### Primary Data Entities

```
status.yaml (global)
├── Operating mode (deck | single | null)
├── Slide tracking (current, total, built count)
├── Last action + timestamp
└── Action history array (audit trail)

theme.json
├── Primitives (colors, typography, shapes)
├── Semantic styles (intent → primitive mappings)
└── Layout references (template file paths)

plan.yaml (deck mode)
├── Deck metadata (name, created, last_modified)
├── Audience context (audience, knowledge_level, priorities)
├── Purpose/outcome (purpose, desired_outcome, key_message)
├── Narrative structure (storyline, recurring_themes)
└── Slides array with rich per-slide context:
    ├── Core: number, intent, template, status
    ├── Agent context: storyline_role, key_points, visual_guidance, tone
    ├── Technical: technical_depth, technical_notes, data_sources
    └── Speaker: speaker_notes_hint, transition_to_next

plan.yaml (single mode)
├── Metadata (created, last_modified)
├── Core intent (intent, suggested_template)
├── Audience context (audience, knowledge_level, context)
├── Content details (key_points, visual_guidance, tone)
├── Technical details (depth, notes, include/exclude elements)
├── Data sources (sources, specific_data)
└── Output preferences (style_overrides, agent_notes)

slide-n.html
├── HTML structure with theme CSS variables
└── Content with contenteditable elements

slide-n-state.json
├── Text edits keyed by data-field selector
└── Modification timestamps
```

### Data Flow

```
User Input → Theme Extraction → theme.json
                                    ↓
User Narrative → Plan Creation → plan.yaml
                                    ↓
Plan + Theme → Slide Building → slide-n.html
                                    ↓
User Edits → State Capture → slide-n-state.json
                                    ↓
HTML Slides → Puppeteer → PNG Images
                                    ↓
PNG Images → Google API → Slides Presentation
```

## API Contracts

### Google Slides API Usage

```javascript
// Authentication (one-time)
OAuth2 scope: 'https://www.googleapis.com/auth/presentations'

// Create presentation
POST https://slides.googleapis.com/v1/presentations
Body: { title: "Deck Name" }
Response: { presentationId: "..." }

// Add slide with image
POST https://slides.googleapis.com/v1/presentations/{id}:batchUpdate
Body: {
  requests: [{
    createSlide: { slideLayoutReference: { predefinedLayout: "BLANK" } }
  }, {
    createImage: {
      url: "image_url_or_base64",
      elementProperties: {
        pageObjectId: "slide_id",
        size: { width: { magnitude: 1920, unit: "PT" }, height: { magnitude: 1080, unit: "PT" } }
      }
    }
  }]
}
```

## Security Architecture

| Concern | Mitigation |
|---------|------------|
| Google credentials | Stored in `.slide-builder/credentials/` (gitignored) |
| Brand assets | Processed locally, never uploaded |
| Slide content | Local files only, exported only on user command |
| API tokens | OAuth refresh tokens, not hardcoded |

### Version Control Strategy (Open Source)

The framework is designed for open source distribution. Only the **framework code** is versioned; all **user-generated content** is gitignored.

**Versioned (the framework):**
- `.slide-builder/workflows/` - Workflow definitions (the product)
- `package.json` - Dependencies
- Documentation and README

**Gitignored (user content):**
| Directory/File | Reason |
|----------------|--------|
| `credentials/` | OAuth tokens (security) |
| `theme.json` | User's brand configuration |
| `theme-history/` | Theme version snapshots |
| `templates/` | Generated from user's theme during /setup |
| `samples/` | Sample slides from theme setup |
| `single/` | User's single slide workspace |
| `deck/` | User's deck slides |

**.gitignore entries:**
```
node_modules/
.slide-builder/credentials/
.slide-builder/theme.json
.slide-builder/theme-history/
.slide-builder/templates/
.slide-builder/samples/
.slide-builder/single/
.slide-builder/deck/
```

See **ADR-006** for the full decision rationale.

## Performance Considerations

| Operation | Optimization |
|-----------|-------------|
| Template slides | Instant (no AI invocation) |
| Custom slides | Single frontend-design skill call |
| Puppeteer screenshots | Batch process all slides in one session |
| Google upload | Parallel image uploads with rate limiting |

## Deployment Architecture

This is a **local-first** Claude Code extension. No server deployment.

```
User's Machine
├── Claude Code (runtime)
├── .slide-builder/ (framework + data)
├── Node.js (for puppeteer, googleapis)
└── Browser (slide preview)

External Services (user-initiated only)
└── Google Slides API (export only)
```

## Development Environment

### Prerequisites

- Claude Code CLI installed
- Node.js 18+ (for puppeteer, googleapis)
- Chrome/Chromium (for puppeteer)
- Google Cloud project with Slides API enabled (for export)

### Setup Commands

```bash
# Initialize framework structure
mkdir -p .slide-builder/{workflows,templates,samples,single,deck/slides,credentials,theme-history}

# Install dependencies
npm init -y
npm install puppeteer googleapis

# Create .gitignore
echo ".slide-builder/credentials/" >> .gitignore
echo "node_modules/" >> .gitignore
```

### First-Time Setup

1. Run `/setup` to create theme from brand assets
2. Review sample deck and provide feedback
3. Theme saved, ready for slide generation

## Architecture Decision Records (ADRs)

### ADR-001: BMAD Pattern Alignment

**Decision:** Mirror BMAD's workflow.yaml + instructions.md architecture exactly.

**Rationale:** 100% alignment requirement from PRD. Proven pattern for agentic workflows. User is familiar with BMAD.

**Consequences:** Framework structure matches `.bmad/`, workflows are YAML-configured, instructions are Markdown-based.

### ADR-002: Hybrid Template + Skill Generation

**Decision:** Generate HTML templates during `/setup` using frontend-design skill. Use templates for matching content, invoke skill for novel slides.

**Rationale:** Balances brand consistency (templates are user-verified) with flexibility (custom slides still possible). Most slides (80%+) will use templates.

**Consequences:** Setup phase is longer (generates 6+ templates), but build phase is faster for typical slides.

### ADR-003: HTML Slides with Contenteditable

**Decision:** Generate self-contained HTML files with `contenteditable` attributes on text elements.

**Rationale:** Browser-native editing, no custom editor needed. State persists in JSON files. Easy to screenshot for export.

**Consequences:** Must track edits in separate state files. Must reapply edits on layout regeneration.

### ADR-004: Puppeteer for Image Export

**Decision:** Use Puppeteer headless browser for HTML-to-image conversion.

**Rationale:** Standard tool, reliable screenshots, supports full CSS/JS rendering.

**Consequences:** Requires Node.js and Chrome installed. Adds dependency but universally available.

### ADR-005: Local-First Architecture

**Decision:** All data stays local. External services only for user-initiated export.

**Rationale:** Brand assets are sensitive. Slides contain confidential content. User controls when/what gets exported.

**Consequences:** No sync, no collaboration (MVP). Future versions could add optional cloud features.

### ADR-006: Open Source Content Strategy

**Decision:** Gitignore all user-generated content; version only the framework (workflows/).

**Context:** Slide Builder is intended for open source distribution. The repository should contain the reusable framework, not any specific user's brand themes or generated slides.

**Rationale:**
1. **Framework vs Content Separation** - The product is the workflow definitions, not the output they produce
2. **Brand Privacy** - Users' brand themes contain proprietary colors, fonts, and styling decisions
3. **Clean Cloning** - New users get an empty scaffold ready for their own `/setup`
4. **No Accidental Commits** - Prevents users from accidentally pushing their client presentation content

**What's Versioned:**
- `.slide-builder/workflows/` - The framework code
- `package.json`, `.gitignore` - Project configuration
- `notes/`, `README.md` - Documentation

**What's Gitignored:**
- `credentials/` - Security (OAuth tokens)
- `theme.json`, `theme-history/` - User's brand configuration
- `templates/` - Generated from user's theme
- `samples/`, `single/`, `deck/` - User's slides

**Consequences:**
- Contributors clone repo and run `/setup` with their own brand assets
- Example themes could be provided separately (e.g., `examples/` repo or docs)
- CI/CD must scaffold directories before running tests

---

## Summary

| Metric | Count |
|--------|-------|
| Key Decisions | 8 |
| Novel Patterns | 4 |
| ADRs | 6 |
| Workflows | 6 |
| HTML Templates | 7 |

### Recommended Next Steps

1. **Epic Breakdown** - Split MVP into implementable stories using `/bmad:bmm:workflows:create-epics-and-stories`
2. **Scaffold Framework** - Create the `.slide-builder/` directory structure
3. **Build `/setup` Workflow First** - This creates templates that all other workflows depend on

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-01-26_
_For: Vishal_
