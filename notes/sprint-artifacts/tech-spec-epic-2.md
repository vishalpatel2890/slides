# Epic Technical Specification: Theme Creation

Date: 2026-01-26
Author: Vishal
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the core value proposition of Slide Builder: the ability to create a complete, brand-perfect theme from user-provided assets with minimal effort. This epic implements the AI-first theme extraction pipeline that analyzes brand assets (website URLs, PDFs, images), generates a complete theme.json with all visual primitives, produces a 6-slide sample deck for validation, and enables high-level gestalt feedback to refine the theme until approved.

The theme system is foundational because all subsequent epics (Single Slide Workflow, Deck Mode, Editing, Export) depend on having a verified theme.json and layout templates. This epic transforms raw brand assets into reusable design DNA that ensures every generated slide matches the user's brand identity without manual configuration.

## Objectives and Scope

**In Scope:**

- Brand asset input collection (website URL, PDF, images, brief description)
- AI-powered extraction of brand primitives (colors, typography, shapes, personality)
- Complete theme.json generation with all required schema sections
- 6-slide sample deck generation demonstrating all theme primitives
- Gestalt feedback loop for theme refinement ("too corporate", "colors off")
- Theme approval flow with template creation
- Theme versioning to theme-history/

**Out of Scope:**

- Theme viewing (`/theme` command - Epic 6)
- Theme editing (`/theme-edit` command - Epic 6)
- Theme rollback functionality (Epic 6)
- Slide building or planning (Epic 3, 5)
- Google Slides export (Epic 7)
- Contenteditable text editing (Epic 3)

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-002):**

This epic implements the hybrid Template + Skill Generation approach. During `/setup`, the frontend-design skill generates sample slides that, once approved, become the layout templates used by Epic 3+ for fast, brand-consistent slide generation.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| Theme Extraction Pipeline | Novel Pattern 1 | WebFetch for URLs, Claude Vision for PDFs/images |
| Theme JSON Schema | Data Architecture/theme.json | meta, colors, typography, shapes, layouts sections |
| Sample Generation | ADR-002 Hybrid Approach | frontend-design skill for 6 sample slides |
| Template Storage | Project Structure | `.slide-builder/samples/` → `.slide-builder/templates/` |
| Version History | Project Structure | `.slide-builder/theme-history/` |

**Constraints from Architecture:**

- Theme must include ALL schema sections (colors, typography, shapes, layouts)
- Sample deck must test ALL primitives (per PRD Table)
- CSS variables pattern: `--color-primary`, `--font-heading`, etc.
- Approved samples become layout templates (copy, don't reference)
- Brand personality informs default choices when signals conflict

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Asset Collector** | Gathers and validates brand inputs from user | User prompts | Validated asset list (URLs, file paths, description) |
| **Brand Analyzer** | Extracts visual primitives from each asset type | Asset list | Raw extraction data (colors, fonts, patterns) |
| **Theme Synthesizer** | Merges extractions into coherent theme.json | Raw extractions + brand description | Complete theme.json |
| **Sample Generator** | Creates 6-slide sample deck using theme | theme.json | 6 HTML files in samples/ |
| **Feedback Interpreter** | Translates gestalt feedback to theme adjustments | User feedback string | Theme modification instructions |
| **Template Finalizer** | Copies approved samples to templates/ | Approved samples | Layout template files |

**Module Details:**

**1. Asset Collector (Story 2.1)**
- Prompts user for website URL (optional), PDF paths (optional), image paths (optional), brand description (required)
- Validates at least one visual asset provided
- Stores source list for theme.json meta.sources
- Confirms all inputs before proceeding to analysis

**2. Brand Analyzer (Story 2.2)**
- **For Website URLs:** Uses WebFetch to retrieve page, analyzes HTML/CSS for colors, font declarations, layout patterns
- **For PDFs/Images:** Uses Claude Vision to extract dominant colors, typography styles, shape characteristics
- **For All Sources:** Infers brand personality (bold, minimal, corporate, playful) from visual weight and color temperature
- Outputs structured extraction data per source

**3. Theme Synthesizer (Story 2.3)**
- Merges multiple extraction sources with weighting (website > PDF > images for conflicts)
- Uses brand description to resolve ambiguity
- Generates complete theme.json with all required sections
- Applies defaults for any missing primitives based on brand personality

**4. Sample Generator (Story 2.4)**
- Invokes frontend-design skill 6 times with theme context
- Each slide targets specific primitives per PRD sample deck table
- Saves to `.slide-builder/samples/sample-{n}-{type}.html`
- Opens slides in browser for user preview

**5. Feedback Interpreter (Story 2.5)**
- Parses natural language feedback ("too corporate", "bolder colors", "warmer feel")
- Maps to specific theme adjustments (color temperature, contrast, corner radius, font weight)
- Returns modification instructions for Theme Synthesizer re-run

**6. Template Finalizer (Story 2.5)**
- On user approval, copies sample files to templates/
- Renames: `sample-1-title.html` → `layout-title.html`
- Updates theme.json layouts section with file references
- Saves theme version to theme-history/

### Data Models and Contracts

**theme.json Schema (Complete):**

```json
{
  "meta": {
    "name": "string",           // User's brand name or "Brand Theme"
    "version": "string",        // Semantic version, starts "1.0"
    "created": "YYYY-MM-DD",    // Creation date
    "sources": ["string"]       // Asset sources used (URLs, file names)
  },
  "colors": {
    "primary": "#RRGGBB",       // Main brand color
    "secondary": "#RRGGBB",     // Supporting brand color
    "accent": "#RRGGBB",        // Highlight/CTA color
    "background": {
      "default": "#RRGGBB",     // Main slide background
      "alt": "#RRGGBB"          // Alternate/contrast background
    },
    "text": {
      "heading": "#RRGGBB",     // Heading text color
      "body": "#RRGGBB"         // Body text color
    },
    "semantic": {
      "success": "#RRGGBB",     // Optional: positive indicators
      "warning": "#RRGGBB",     // Optional: caution indicators
      "error": "#RRGGBB"        // Optional: negative indicators
    }
  },
  "typography": {
    "fonts": {
      "heading": "string",      // Font family for headings
      "body": "string",         // Font family for body text
      "mono": "string"          // Monospace font for code
    },
    "scale": {
      "hero": "string",         // Hero text size (e.g., "72px")
      "h1": "string",           // Primary heading size
      "h2": "string",           // Secondary heading size
      "h3": "string",           // Tertiary heading size
      "body": "string",         // Body text size
      "small": "string"         // Small/caption text size
    },
    "weights": {
      "normal": "number",       // Normal weight (400)
      "medium": "number",       // Medium weight (500)
      "bold": "number"          // Bold weight (700)
    }
  },
  "shapes": {
    "boxes": {
      "default": {
        "cornerRadius": "string",   // e.g., "8px"
        "border": "string",         // e.g., "1px solid #E5E7EB"
        "shadow": "string"          // e.g., "0 4px 6px rgba(0,0,0,0.1)"
      },
      "callout": {
        "cornerRadius": "string",
        "border": "string",
        "shadow": "string"
      }
    },
    "arrows": {
      "default": {
        "strokeWidth": "string",    // e.g., "2px"
        "headType": "string",       // "triangle" | "arrow" | "circle"
        "curve": "string"           // "straight" | "smooth" | "stepped"
      }
    },
    "lines": {
      "default": {
        "strokeWidth": "string",
        "style": "string"           // "solid" | "dashed" | "dotted"
      }
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
  },
  "personality": {
    "classification": "string",   // "bold" | "minimal" | "corporate" | "playful"
    "notes": "string"             // AI reasoning for classification
  }
}
```

**Extraction Data Structure (Internal):**

```yaml
source: "website.com"
type: website | pdf | image
colors_found:
  - hex: "#2563EB"
    usage: "primary button"
    confidence: 0.95
fonts_found:
  - family: "Inter"
    usage: "headings"
    weights: [400, 600, 700]
shapes_observed:
  - element: "cards"
    corner_radius: "8px"
    shadow: true
personality_signals:
  - signal: "high contrast colors"
    suggests: "bold"
```

**Sample Slide Naming Convention:**

| File Name | Layout Type | Primitives Tested |
|-----------|-------------|-------------------|
| `sample-1-title.html` | Title | Hero typography, primary color, background |
| `sample-2-list.html` | List/Agenda | Body text, bullets, spacing |
| `sample-3-flow.html` | Process Flow | Arrows, boxes, connectors |
| `sample-4-columns.html` | Comparison | Multiple box styles, alignment |
| `sample-5-callout.html` | Key Insight | Callout box, accent color, emphasis |
| `sample-6-code.html` | Technical | Mono font, alt background |

### APIs and Interfaces

**Slash Command Interface:**

| Command | Action | Inputs | Outputs |
|---------|--------|--------|---------|
| `/setup` | Initiates theme creation workflow | None | Completed theme.json + templates |

**Internal Tool Interfaces:**

**WebFetch (for website analysis):**
```
Input: URL string
Output: HTML content for CSS/style extraction
Usage: Extract color values from CSS, font-family declarations, layout patterns
```

**Claude Vision (for PDF/image analysis):**
```
Input: File path to PDF or image
Output: Visual analysis including dominant colors, typography observations, shape patterns
Usage: Identify brand colors, font styles, visual weight
```

**frontend-design skill (for sample generation):**
```
Input:
  - Theme JSON object
  - Slide type (title, list, flow, etc.)
  - Content description
Output: Complete HTML file with embedded CSS using theme variables
Usage: Generate each of the 6 sample slides
```

**File System Interface:**

```
Write Operations:
- .slide-builder/theme.json (theme file)
- .slide-builder/samples/sample-{n}-{type}.html (6 sample slides)
- .slide-builder/templates/layout-{type}.html (7 layout templates)
- .slide-builder/theme-history/theme-v{n}-{date}.json (version history)

Read Operations:
- Brand asset files (PDFs, images) for vision analysis
```

### Workflows and Sequencing

**Complete /setup Workflow Sequence:**

```
Phase 1: Asset Collection (Story 2.1)
┌─────────────────────────────────────────────────────────────┐
│ 1. Display welcome and explain inputs needed                │
│ 2. Prompt: "Website URL? (optional, press Enter to skip)"   │
│ 3. Prompt: "PDF file paths? (optional)"                     │
│ 4. Prompt: "Image file paths? (optional)"                   │
│ 5. Prompt: "Brief brand description? (required)"            │
│ 6. Validate: At least one visual asset + description        │
│ 7. Confirm inputs with user before proceeding               │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Brand Analysis (Story 2.2)
┌─────────────────────────────────────────────────────────────┐
│ For each asset type (parallel where possible):              │
│                                                             │
│ Website URL:                                                │
│   → WebFetch to retrieve page                               │
│   → Parse CSS for colors, fonts, spacing patterns           │
│   → Store extraction data                                   │
│                                                             │
│ PDF Files:                                                  │
│   → Claude Vision analysis                                  │
│   → Extract dominant colors, typography, shapes             │
│   → Store extraction data                                   │
│                                                             │
│ Image Files:                                                │
│   → Claude Vision analysis                                  │
│   → Extract color palette, visual style                     │
│   → Store extraction data                                   │
│                                                             │
│ Infer brand personality from combined signals               │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Theme Synthesis (Story 2.3)
┌─────────────────────────────────────────────────────────────┐
│ 1. Merge extraction data (website > PDF > images priority)  │
│ 2. Resolve conflicts using brand description context        │
│ 3. Apply personality-based defaults for missing values      │
│ 4. Generate complete theme.json                             │
│ 5. Write to .slide-builder/theme.json                       │
│ 6. Display extracted primitives summary to user             │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Sample Generation (Story 2.4)
┌─────────────────────────────────────────────────────────────┐
│ For each of 6 sample slides:                                │
│   1. Invoke frontend-design skill with:                     │
│      - Full theme.json                                      │
│      - Slide type (title, list, flow, etc.)                 │
│      - Sample content appropriate for type                  │
│   2. Save to .slide-builder/samples/sample-{n}-{type}.html  │
│   3. Report progress                                        │
│                                                             │
│ After all 6 generated:                                      │
│   → Open samples in browser for preview                     │
│   → Display "Review your sample deck" message               │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: Feedback Loop (Story 2.5)
┌─────────────────────────────────────────────────────────────┐
│ LOOP (max 3 iterations recommended):                        │
│                                                             │
│ 1. Ask: "How does this look? (Perfect / feedback)"          │
│                                                             │
│ IF feedback provided:                                       │
│   → Interpret gestalt feedback                              │
│   → Map to theme adjustments                                │
│   → Update theme.json                                       │
│   → Regenerate all 6 samples                                │
│   → Return to step 1                                        │
│                                                             │
│ IF "Perfect" or approved:                                   │
│   → Exit loop, proceed to finalization                      │
│                                                             │
│ IF 3+ iterations and still not satisfied:                   │
│   → Offer direct theme.json editing as escape hatch         │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 6: Template Finalization (Story 2.5)
┌─────────────────────────────────────────────────────────────┐
│ 1. Copy samples to templates with layout naming:            │
│    sample-1-title.html → layout-title.html                  │
│    sample-2-list.html → layout-list.html                    │
│    sample-3-flow.html → layout-flow.html                    │
│    sample-4-columns.html → layout-columns-2.html            │
│    sample-5-callout.html → layout-callout.html              │
│    sample-6-code.html → layout-code.html                    │
│                                                             │
│ 2. Update theme.json layouts section with file refs         │
│ 3. Save theme to theme-history/theme-v1-{date}.json         │
│ 4. Update status.yaml with completion                       │
│ 5. Display success message with next steps                  │
└─────────────────────────────────────────────────────────────┘
```

**Feedback Interpretation Mapping:**

| User Feedback | Theme Adjustments |
|---------------|-------------------|
| "Too corporate" | Softer colors (+10% saturation reduction), larger corner radius (+4px), warmer text colors |
| "Not bold enough" | Higher contrast (darken primary by 15%), reduce corner radius (-4px), increase font weights |
| "Colors off" | Re-weight extraction sources, ask clarifying question about desired palette |
| "Too busy" | Increase whitespace (larger margins), reduce shadow intensity, simplify shapes |
| "Too plain" | Add accent color usage, increase shadow depth, add subtle gradients |
| "Fonts don't feel right" | Re-analyze sources for alternate fonts, ask for specific preference |

## Non-Functional Requirements

### Performance

| Requirement | Target | Source | Notes |
|-------------|--------|--------|-------|
| Website fetch + analysis | < 30 seconds | NFR1 | WebFetch network latency + CSS parsing |
| PDF/Image analysis | < 15 seconds per file | NFR1 | Claude Vision processing |
| Theme synthesis | < 5 seconds | Local | JSON generation, no network |
| Single sample slide generation | < 30 seconds | NFR2 | frontend-design skill invocation |
| Full sample deck (6 slides) | < 3 minutes | NFR1 | Sequential generation |
| Feedback iteration (theme update + regenerate) | < 3 minutes | NFR5 | Must feel responsive |
| File write operations | < 1 second | Local | theme.json, samples, templates |

**Performance Notes:**
- Per PRD NFR1: Sample deck generation should complete within "reasonable time for user to wait"
- Per PRD NFR5: Theme feedback loop iteration should "feel responsive"
- Website analysis is network-bound; provide progress indication
- Sample generation is the longest operation; show per-slide progress

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| Brand asset privacy | All analysis performed locally via Claude; no assets uploaded to external services | NFR12, NFR13 |
| Theme file exposure | theme.json contains no secrets; safe to version if user chooses | NFR13 |
| Source URLs logged | Only domain names stored in meta.sources, not full URLs with query params | Best practice |
| PDF/Image content | Files read locally, content not persisted beyond theme extraction | NFR13 |

**Security Patterns:**
- Per PRD NFR12: "No brand assets or slide content transmitted to external services"
- Per PRD NFR13: "Theme files and slide content remain local to user's machine"
- WebFetch retrieves public website content only (no auth required)
- No credentials involved in Epic 2 (OAuth is Epic 7)

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| WebFetch fails (network error) | Graceful degradation - continue with other assets; warn user | NFR14 |
| PDF/Image file not found | Skip file, warn user, continue with remaining assets | NFR14 |
| No visual assets provided | Block progress - at least one required | FR validation |
| Theme synthesis fails | Retry with defaults; show extracted data for debugging | NFR17 |
| Sample generation partially fails | Save successful samples; retry failed ones; allow manual continue | NFR14 |
| Feedback loop stuck | After 3 iterations, offer direct JSON editing escape hatch | PRD UX |

**Recovery Patterns:**
- Per PRD NFR14: "Partial deck builds are recoverable"
- Theme.json saved after synthesis; samples saved individually
- Each phase is checkpointed; resume from last successful phase
- Human-readable YAML/JSON allows manual inspection and recovery (NFR17)

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Asset collection progress | Console output | "Analyzing website...", "Reading PDF..." |
| Extraction results | Console summary | Display found colors, fonts, personality |
| Sample generation progress | Console output | "Generating slide 1 of 6..." |
| Theme file location | Console output | Path to theme.json after creation |
| Feedback iteration count | Console output | "Iteration 2 of 3 recommended" |
| Completion status | status.yaml | `last_action: "Theme setup completed"` |

**Logging Strategy:**
- Real-time console output for user feedback during long operations
- status.yaml updated at each major phase completion
- No external logging services (local-first architecture per ADR-005)
- Extraction data available in theme.json personality.notes for debugging

## Dependencies and Integrations

**NPM Dependencies (from package.json):**

| Package | Version | Purpose | Used in Epic 2 |
|---------|---------|---------|----------------|
| puppeteer | ^23.0.0 | HTML-to-image conversion | No (Epic 7) |
| googleapis | ^140.0.0 | Google Slides API | No (Epic 7) |

**Note:** Epic 2 does not use npm dependencies directly. All operations use Claude Code built-in capabilities.

**Claude Code Built-in Tools:**

| Tool | Purpose | Usage in Epic 2 |
|------|---------|-----------------|
| WebFetch | Retrieve website HTML/CSS | Story 2.1, 2.2 - website brand analysis |
| Claude Vision (Read) | Analyze PDF/image files | Story 2.2 - visual asset extraction |
| frontend-design skill | Generate HTML slides | Story 2.4 - sample deck generation |
| File System (Write) | Save theme and samples | Stories 2.3, 2.4, 2.5 |

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Claude Code | Current | Framework runtime environment |
| Modern browser | Any | Preview sample slides |
| File system access | N/A | Read brand assets, write outputs |

**Integration Points:**

| Integration | Method | Direction | Epic 2 Scope |
|-------------|--------|-----------|--------------|
| User's website | WebFetch HTTP GET | Inbound (read) | Extract CSS/styles |
| Local PDF files | Claude Vision via Read | Inbound (read) | Extract visual patterns |
| Local image files | Claude Vision via Read | Inbound (read) | Extract color palette |
| File system | Write tool | Outbound (write) | Save theme.json, samples, templates |
| Browser | File open (optional) | Outbound | Preview samples |

**External Service Dependencies:**

| Service | Required? | Purpose | Fallback |
|---------|-----------|---------|----------|
| User's website | Optional | Brand extraction source | Use PDF/images instead |
| Google Fonts | Optional | Font rendering in samples | System fonts |

**No external APIs called** - all processing uses Claude's native capabilities.

## Acceptance Criteria (Authoritative)

### Story 2.1: Brand Asset Input Collection

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC2.1.1 | Given the user runs `/setup`, when prompted for brand inputs, then they can provide: website URL (optional), PDF file paths (optional), image file paths (optional), brief brand description (required) |
| AC2.1.2 | At least one visual asset (URL, PDF, or image) must be provided alongside the description |
| AC2.1.3 | The system confirms all inputs before proceeding to analysis |
| AC2.1.4 | Given a website URL is provided, when processing inputs, then the system fetches and analyzes the page via WebFetch |
| AC2.1.5 | Given PDF or image files are provided, when processing inputs, then the system analyzes them via Claude Vision |

### Story 2.2: Brand Primitive Extraction

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC2.2.1 | Given brand assets have been collected, when extraction runs, then the system identifies: primary, secondary, accent colors; background colors (default, alt); text colors (heading, body) |
| AC2.2.2 | The system identifies font families (heading, body, mono) and typography scale (hero, h1, h2, body sizes) |
| AC2.2.3 | The system identifies shape styles (corner radius, shadows, borders) and arrow styles (stroke width, head type) |
| AC2.2.4 | The system infers brand personality (bold, minimal, corporate, playful) from visual signals |
| AC2.2.5 | Given conflicting signals from multiple sources, when making decisions, then the system uses the brief description to resolve ambiguity |

### Story 2.3: Theme File Generation

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC2.3.1 | Given brand primitives have been extracted, when the theme file is generated, then `.slide-builder/theme.json` contains: meta (name, version, created, sources), colors, typography, shapes, layouts sections |
| AC2.3.2 | The theme file is valid JSON |
| AC2.3.3 | All CSS custom properties can be derived from the theme (--color-primary, --font-heading, etc.) |
| AC2.3.4 | The theme includes personality classification with reasoning notes |

### Story 2.4: Sample Deck Generation

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC2.4.1 | Given a theme.json has been generated, when sample deck generation runs, then 6 HTML slides are created in `.slide-builder/samples/` |
| AC2.4.2 | Sample slides include: title (hero typography, primary color), list (body text, bullets), flow (arrows, boxes), columns (multiple box styles), callout (accent color, emphasis), code (mono font, alt background) |
| AC2.4.3 | Each slide renders at 1920x1080 (16:9) |
| AC2.4.4 | Each slide uses theme primitives via CSS variables |
| AC2.4.5 | Slides can be opened in browser for preview |

### Story 2.5: Theme Feedback Loop

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC2.5.1 | Given the sample deck is displayed, when the user provides gestalt feedback (e.g., "too corporate", "colors off"), then the system interprets the feedback and adjusts theme primitives |
| AC2.5.2 | The system regenerates the sample deck with updated theme for re-validation |
| AC2.5.3 | Given the user approves the samples ("Perfect"), then the theme is locked (saved to theme.json) |
| AC2.5.4 | Upon approval, sample slides are copied to templates/ as layout templates (layout-title.html, layout-list.html, etc.) |
| AC2.5.5 | A version entry is created in theme-history/ with timestamp |
| AC2.5.6 | Given feedback exceeds 3 rounds, then direct theme.json editing is offered as escape hatch |

## Traceability Mapping

| AC | Spec Section | Component/Module | Test Idea |
|----|--------------|------------------|-----------|
| AC2.1.1 | Services/Asset Collector | Input prompts | Run /setup, verify all 4 input types prompted |
| AC2.1.2 | Services/Asset Collector | Validation | Try with only description, verify rejection |
| AC2.1.3 | Workflows/Phase 1 | Confirmation step | Provide inputs, verify summary shown before proceed |
| AC2.1.4 | APIs/WebFetch | Website analysis | Provide URL, verify WebFetch called |
| AC2.1.5 | APIs/Claude Vision | PDF/Image analysis | Provide PDF path, verify vision analysis runs |
| AC2.2.1 | Services/Brand Analyzer | Color extraction | Analyze test website, verify colors extracted |
| AC2.2.2 | Services/Brand Analyzer | Typography extraction | Analyze test PDF, verify fonts identified |
| AC2.2.3 | Services/Brand Analyzer | Shape extraction | Analyze test image, verify shapes noted |
| AC2.2.4 | Data Models/personality | Personality inference | Provide bold brand, verify "bold" classification |
| AC2.2.5 | Services/Theme Synthesizer | Conflict resolution | Provide conflicting sources, verify description used |
| AC2.3.1 | Data Models/theme.json | Schema completeness | Generate theme, verify all sections present |
| AC2.3.2 | Data Models/theme.json | JSON validity | Parse generated theme.json with JSON.parse |
| AC2.3.3 | Data Models/theme.json | CSS variable derivation | Check theme has values for all CSS var patterns |
| AC2.3.4 | Data Models/personality | Classification | Verify personality.classification and .notes exist |
| AC2.4.1 | Services/Sample Generator | 6 slides created | Run setup, count files in samples/ |
| AC2.4.2 | Data Models/Sample naming | Slide types | Verify all 6 slide types present |
| AC2.4.3 | NFR/Performance | Slide dimensions | Open slide, verify 1920x1080 viewport |
| AC2.4.4 | APIs/frontend-design | CSS variables | Inspect slide HTML for --color-primary usage |
| AC2.4.5 | APIs/File System | Browser preview | Open sample HTML in browser, verify renders |
| AC2.5.1 | Services/Feedback Interpreter | Gestalt interpretation | Give "too corporate" feedback, verify theme changes |
| AC2.5.2 | Workflows/Phase 5 | Regeneration loop | After feedback, verify new samples generated |
| AC2.5.3 | Services/Template Finalizer | Theme lock | Approve samples, verify theme.json updated |
| AC2.5.4 | Workflows/Phase 6 | Template copy | After approval, verify templates/ has layout files |
| AC2.5.5 | Data Architecture/theme-history | Version history | After approval, verify theme-history/ has entry |
| AC2.5.6 | Workflows/Phase 5 | Escape hatch | Run 4 feedback rounds, verify JSON edit offered |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Website CSS obfuscated or minimized | Medium - color/font extraction less accurate | Medium | Fall back to visual analysis via screenshot; use PDF/images as backup |
| **R2:** User provides low-quality brand assets | High - theme won't match brand | Medium | Request multiple asset types; explain quality requirements upfront |
| **R3:** frontend-design skill produces inconsistent styles | High - samples don't match theme | Low | Provide detailed theme context; validate CSS variable usage |
| **R4:** Feedback interpretation misaligns with user intent | Medium - extra iterations needed | Medium | Confirm interpretation before regenerating; ask clarifying questions |
| **R5:** 6-slide generation takes too long | Medium - user abandons setup | Low | Show progress; allow partial preview; optimize prompts |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | User has at least one accessible brand asset (URL, PDF, or image) | Cannot proceed with setup |
| **A2** | Website URLs are publicly accessible (no auth required) | WebFetch will fail; need PDF/image fallback |
| **A3** | PDF files contain visible brand elements (not just text) | Extraction will be poor; need clarifying questions |
| **A4** | User can preview HTML files in a browser | Cannot validate samples visually |
| **A5** | frontend-design skill respects provided CSS variables | Samples won't match theme; need regeneration |
| **A6** | 1-3 feedback rounds sufficient for most users | May need higher iteration cap or better first-pass |

### Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| **Q1** | Should we generate a 7th sample slide (columns-3) in addition to columns-2? | Vishal | Open - PRD shows 7 templates but 6 samples |
| **Q2** | How should we handle websites with multiple color schemes (light/dark mode)? | Dev | Open - recommend extracting primary scheme only |
| **Q3** | Should extraction data be persisted for debugging, or discarded after synthesis? | Dev | Recommend: Store in theme.json as personality.notes |
| **Q4** | What's the minimum asset quality threshold before warning user? | Dev | Open - start permissive, tighten based on feedback |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Asset Collector, Brand Analyzer, etc.) | Manual verification per module |
| **Integration** | Full /setup workflow end-to-end | Run complete setup with test assets |
| **Acceptance** | All ACs per story | Manual testing per AC table |

### Test Approach by Story

**Story 2.1: Brand Asset Input Collection**
- Run `/setup`, verify all input prompts appear
- Test with URL only, PDF only, image only - each should succeed
- Test with description only - should fail with clear error
- Test with all inputs - should confirm and proceed

**Story 2.2: Brand Primitive Extraction**
- Provide known website (e.g., Anthropic.com) - verify reasonable colors extracted
- Provide test PDF with known colors - verify extraction accuracy
- Provide test image - verify color palette extracted
- Verify personality classification appears

**Story 2.3: Theme File Generation**
- After extraction, open `.slide-builder/theme.json`
- Verify JSON is valid (parseable)
- Verify all schema sections present (meta, colors, typography, shapes, layouts)
- Verify no null or placeholder values

**Story 2.4: Sample Deck Generation**
- After theme generated, verify 6 files in `samples/`
- Open each sample in browser - verify renders correctly
- Verify 1920x1080 dimensions
- Inspect HTML for CSS variable usage (--color-primary, etc.)

**Story 2.5: Theme Feedback Loop**
- Give feedback "make it bolder" - verify theme changes (higher contrast, etc.)
- Give feedback "colors off" - verify clarifying question or re-extraction
- Approve samples - verify templates/ created
- Verify theme-history/ has version entry
- Run 4 iterations - verify escape hatch offered

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 2.1 | 5 | Input flow verification |
| 2.2 | 5 | Extraction result inspection |
| 2.3 | 4 | Theme file validation |
| 2.4 | 5 | Sample file verification + browser preview |
| 2.5 | 6 | Feedback loop + template creation verification |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Website returns 404 | Warn user, continue with other assets |
| PDF file path invalid | Error with clear message, re-prompt |
| Image file corrupted | Skip file, warn user, continue |
| All extractions fail | Error with guidance to check asset quality |
| User approves on first iteration | Skip feedback loop, proceed to finalization |
| User gives contradictory feedback | Ask clarifying question |
| Brand has only 1 color | Generate harmonious palette from single color |

### Definition of Done

Epic 2 is complete when:
1. `/setup` command successfully collects brand assets
2. Theme extraction produces complete theme.json with all sections
3. 6 sample slides are generated and viewable in browser
4. Feedback loop allows refinement (tested with at least 1 iteration)
5. Approved samples become templates in templates/
6. Theme version saved to theme-history/
7. All 25 acceptance criteria pass manual verification
8. status.yaml shows setup completion
