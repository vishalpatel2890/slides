# Epic Technical Specification: Single Slide Workflow

Date: 2026-01-27
Author: Vishal
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 delivers the fastest path to value in Slide Builder: the ability to plan, build, and preview a single branded slide. This epic implements the "quick win" workflow where a Solutions Consultant describes what they need in natural language, and the system produces a complete, brand-perfect HTML slide using the theme established in Epic 2.

The Single Slide Workflow is the most common use case - a user needs one architecture diagram, one process flow, or one key insight slide for an existing presentation. Rather than planning an entire deck, they describe their need once, get a slide immediately, and can edit text inline. This epic establishes the core slide generation patterns (template matching, custom layout fallback, HTML structure with contenteditable) that Epic 5 (Full Deck Mode) will reuse for multi-slide generation.

## Objectives and Scope

**In Scope:**

- `/plan-one` command to capture single slide intent via natural language
- Template matching logic to select appropriate layout template from Epic 2
- `/build-one` command to generate slide HTML using template or custom layout
- Custom slide generation via frontend-design skill when no template matches
- Slide preview in browser at 1920x1080 (16:9)
- Contenteditable text elements for inline editing
- Auto-save of text edits to slide-state.json
- State management for single slide mode (single/plan.yaml, single/slide.html)

**Out of Scope:**

- Full deck planning (`/plan-deck` - Epic 5)
- Batch slide building (`/build-all` - Epic 5)
- Layout editing via `/edit` command (Epic 4)
- Text edit preservation across layout regeneration (Epic 4)
- Theme viewing/editing (`/theme`, `/theme-edit` - Epic 6)
- Google Slides export (`/export` - Epic 7)

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-002 and ADR-003):**

This epic implements the hybrid Template + Skill Generation approach from the architecture. When building a slide, the system first attempts to match the user's intent against the 7 layout templates created during Epic 2's `/setup` workflow. If a match is found, the template is used for fast, brand-consistent generation. If no template matches, the frontend-design skill is invoked to create a custom layout.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| Template-or-Custom Decision | Novel Pattern 2 | Intent keyword matching → template or skill |
| HTML Slide Pattern | Implementation Patterns | Self-contained HTML with CSS variables, contenteditable, data-field |
| Text Edit Persistence | Novel Pattern 3 | slide-state.json with selector → content mapping |
| Dual-Mode State | Novel Pattern 4 | status.yaml mode: "single", single/plan.yaml |
| State File Pattern | Implementation Patterns/status.yaml | Mode, last_action, history tracking |

**Constraints from Architecture:**

- All slides MUST render at 1920x1080 (16:9 standard)
- All text elements MUST have `contenteditable="true"` and `data-field` attributes
- Slides MUST use theme CSS variables (--color-primary, --font-heading, etc.)
- Slides MUST be self-contained HTML (no external dependencies except Google Fonts)
- State files MUST be human-readable YAML/JSON
- Mode detection based on existing plan.yaml files (single vs deck)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Intent Capture** | Collects and confirms user's slide description | User natural language description | Structured plan.yaml with intent, template suggestion |
| **Template Matcher** | Matches intent keywords to layout templates | plan.yaml intent | Template name or "custom" flag |
| **Template Builder** | Generates slide by injecting content into template | Template HTML + theme.json + content | Complete slide.html |
| **Custom Builder** | Generates custom layout via frontend-design skill | theme.json + intent + content | Complete slide.html |
| **Preview Handler** | Opens generated slide in browser | slide.html path | Browser window with slide |
| **Edit Tracker** | Captures and persists contenteditable changes | DOM blur events | slide-state.json |

**Module Details:**

**1. Intent Capture (Story 3.1)**
- Prompts user to describe their slide need in natural language
- Parses description for key elements: purpose, content type, visual elements
- Confirms understanding by summarizing back to user
- Saves structured intent to `.slide-builder/single/plan.yaml`
- Updates status.yaml with mode: "single"

**2. Template Matcher (Story 3.2)**
- Scans intent for template-matching keywords:
  - "title", "intro", "opening" → layout-title
  - "list", "bullets", "points", "agenda" → layout-list
  - "flow", "process", "timeline", "steps" → layout-flow
  - "compare", "vs", "two", "side-by-side" → layout-columns-2
  - "three", "triad", "options" → layout-columns-3
  - "key", "insight", "callout", "cta", "highlight" → layout-callout
  - "code", "technical", "api", "snippet" → layout-code
- Returns template name if match found, "custom" if no match
- Logs decision in plan.yaml suggested_template field

**3. Template Builder (Story 3.2)**
- Loads template HTML from `.slide-builder/templates/`
- Injects theme CSS variables from theme.json
- Populates content placeholders based on intent
- Ensures all text elements have contenteditable and data-field attributes
- Saves to `.slide-builder/single/slide.html`

**4. Custom Builder (Story 3.3)**
- Invokes frontend-design skill with full context:
  - Complete theme.json for brand consistency
  - User's intent and content requirements
  - Slide dimension constraints (1920x1080)
- Validates output has required attributes (contenteditable, data-field)
- Saves to `.slide-builder/single/slide.html`

**5. Preview Handler (Story 3.4)**
- Provides file path to generated slide
- Offers to open in default browser
- Confirms slide is viewable

**6. Edit Tracker (Story 3.5)**
- JavaScript embedded in slide HTML
- Listens for blur events on contenteditable elements
- Saves edits to localStorage immediately
- Syncs to `.slide-builder/single/slide-state.json` periodically

### Data Models and Contracts

**plan.yaml (Single Slide Mode):**

```yaml
# Slide Metadata
created: 2026-01-27T10:30:00Z
last_modified: 2026-01-27T10:45:00Z

# Core Intent
intent: "Architecture diagram showing our 3-tier system with data flow"
suggested_template: "layout-flow"  # or "custom" for novel layouts

# Audience Context
audience: "Engineering team"
audience_knowledge_level: "expert"  # beginner | intermediate | expert
context: "Inserted into existing technical review deck"

# Content Details
key_points:
  - "Frontend connects to API Gateway"
  - "API Gateway routes to microservices"
  - "All services use shared PostgreSQL"
visual_guidance: "Left-to-right flow, use arrows, highlight API layer"
tone: "technical"  # professional | bold | warm | technical

# Technical Details (if applicable)
technical_depth: "detailed"  # none | overview | detailed | deep-dive
include_elements:
  - "Load balancer"
  - "API Gateway"
  - "Auth service"
  - "PostgreSQL cluster"
exclude_elements:
  - "Logging infrastructure"
  - "CI/CD pipeline"
```

**slide-state.json:**

```json
{
  "slide": "single",
  "edits": [
    {
      "selector": "[data-field='title']",
      "content": "User's edited title text"
    },
    {
      "selector": "[data-field='bullet-1']",
      "content": "User's edited bullet point"
    }
  ],
  "lastModified": "2026-01-27T10:45:00Z"
}
```

**status.yaml Updates:**

```yaml
mode: single                          # single | deck | null
current_slide: 1                      # Always 1 for single mode
total_slides: 1                       # Always 1 for single mode
built_count: 1                        # 0 or 1 for single mode
last_action: "Built single slide using layout-flow template"
last_modified: 2026-01-27T10:45:00Z
history:
  - action: "Single slide planned"
    timestamp: 2026-01-27T10:30:00Z
  - action: "Slide built using layout-flow"
    timestamp: 2026-01-27T10:45:00Z
```

**HTML Slide Structure (Required Pattern):**

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
    // Auto-save script for contenteditable
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

### APIs and Interfaces

**Slash Command Interface:**

| Command | Action | Inputs | Outputs |
|---------|--------|--------|---------|
| `/plan-one` | Capture single slide intent | User description | plan.yaml created, ready for build |
| `/build-one` | Generate slide from plan | Existing plan.yaml | slide.html created |

**Internal Tool Interfaces:**

**Theme Loader:**
```
Input: None (reads from .slide-builder/theme.json)
Output: Complete theme object with all primitives
Usage: Provides CSS variables and design constraints for slide generation
```

**Template Loader:**
```
Input: Template name (e.g., "layout-flow")
Output: Template HTML content
Location: .slide-builder/templates/layout-{name}.html
Usage: Base HTML for template-based generation
```

**frontend-design Skill (for custom slides):**
```
Input:
  - Theme JSON object (complete)
  - Slide intent description
  - Content requirements
  - Dimension constraints (1920x1080)
Output: Complete HTML slide with embedded CSS
Usage: Generate custom layouts when templates don't match
```

**File System Interface:**

```
Write Operations:
- .slide-builder/single/plan.yaml (slide intent)
- .slide-builder/single/slide.html (generated slide)
- .slide-builder/single/slide-state.json (text edits)
- .slide-builder/status.yaml (mode and progress)

Read Operations:
- .slide-builder/theme.json (theme primitives)
- .slide-builder/templates/layout-*.html (layout templates)
```

### Workflows and Sequencing

**Complete /plan-one Workflow:**

```
Phase 1: Theme Verification
┌─────────────────────────────────────────────────────────────┐
│ 1. Check for .slide-builder/theme.json existence           │
│ 2. If not found:                                            │
│    → Error: "No theme found. Run /setup first."             │
│    → HALT                                                   │
│ 3. If found:                                                │
│    → Load theme for context                                 │
│    → Continue to Phase 2                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Intent Capture
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "Describe the slide you need"                    │
│ 2. User provides description (e.g., "An architecture        │
│    diagram showing our 3-tier system")                      │
│ 3. Parse description for:                                   │
│    - Slide purpose                                          │
│    - Content type (diagram, list, comparison, etc.)         │
│    - Key elements to include                                │
│    - Visual guidance (if provided)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Template Matching
┌─────────────────────────────────────────────────────────────┐
│ 1. Scan intent for template keywords                        │
│ 2. Match against available templates:                       │
│    - layout-title, layout-list, layout-flow                 │
│    - layout-columns-2, layout-columns-3                     │
│    - layout-callout, layout-code                            │
│ 3. If match found → Set suggested_template                  │
│ 4. If no match → Set suggested_template: "custom"           │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Confirmation
┌─────────────────────────────────────────────────────────────┐
│ 1. Display understanding summary:                           │
│    - "I understand you need: [purpose]"                     │
│    - "Key content: [elements]"                              │
│    - "I'll use: [template] template" or "custom layout"    │
│ 2. Ask: "Is this correct? (y/n)"                           │
│ 3. If no → Return to Phase 2 for clarification              │
│ 4. If yes → Save and continue                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: State Persistence
┌─────────────────────────────────────────────────────────────┐
│ 1. Save plan.yaml to .slide-builder/single/                 │
│ 2. Update status.yaml:                                      │
│    - mode: "single"                                         │
│    - last_action: "Single slide planned"                    │
│    - Add to history                                         │
│ 3. Display: "Plan saved. Run /build-one to generate."       │
└─────────────────────────────────────────────────────────────┘
```

**Complete /build-one Workflow (Single Mode):**

```
Phase 1: State Verification
┌─────────────────────────────────────────────────────────────┐
│ 1. Check status.yaml for mode                               │
│ 2. If mode != "single" and single/plan.yaml doesn't exist:  │
│    → Error: "No single slide plan. Run /plan-one first."    │
│    → HALT                                                   │
│ 3. If single/plan.yaml exists:                              │
│    → Load plan                                              │
│    → Continue to Phase 2                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Template Decision
┌─────────────────────────────────────────────────────────────┐
│ 1. Read suggested_template from plan.yaml                   │
│ 2. If template name (not "custom"):                         │
│    → Check template exists in templates/                    │
│    → If exists → Go to Template Build (Phase 3A)            │
│    → If missing → Fall back to Custom Build (Phase 3B)      │
│ 3. If "custom":                                             │
│    → Go to Custom Build (Phase 3B)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3A: Template Build
┌─────────────────────────────────────────────────────────────┐
│ 1. Load template HTML from templates/layout-{name}.html     │
│ 2. Load theme.json for CSS variables                        │
│ 3. Inject theme CSS variables into :root                    │
│ 4. Generate content based on plan.yaml:                     │
│    - Title from intent                                      │
│    - Body content from key_points                           │
│    - Visual elements from guidance                          │
│ 5. Ensure all text has contenteditable + data-field         │
│ 6. Add auto-save JavaScript                                 │
│ 7. Save to .slide-builder/single/slide.html                 │
│ 8. → Go to Phase 4                                          │
└─────────────────────────────────────────────────────────────┘

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
                              ↓
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

**Text Auto-Save Flow:**

```
User edits text in browser
         ↓
Blur event fires on contenteditable element
         ↓
JavaScript captures all contenteditable content
         ↓
Save to localStorage immediately (sync)
         ↓
Periodic sync to slide-state.json (async, every 5s)
         ↓
On page reload: restore from localStorage/file
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source | Notes |
|-------------|--------|--------|-------|
| Intent parsing and plan save | < 2 seconds | Local | JSON/YAML operations, no network |
| Template matching | < 100ms | Local | Keyword matching in memory |
| Template-based slide generation | < 5 seconds | Local | Template injection, no AI call |
| Custom slide generation | < 30 seconds | NFR2 | frontend-design skill invocation |
| Slide preview in browser | < 1 second | NFR4 | File open, no processing |
| Text auto-save to localStorage | < 100ms | NFR3 | Synchronous browser operation |
| Text sync to state file | < 1 second | NFR3 | Async file write |

**Performance Notes:**
- Per PRD NFR2: "Single slide generation completes within reasonable time for interactive use"
- Per PRD NFR3: "Text auto-save occurs within 1 second of edit completion"
- Per PRD NFR4: "Slide preview renders immediately in browser (no loading delay)"
- Template-based builds are significantly faster than custom builds
- Custom builds require frontend-design skill; show progress indicator

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| Slide content privacy | All slides stored locally, never transmitted | NFR12, NFR13 |
| Theme file exposure | theme.json contains no secrets; styling only | NFR13 |
| State file exposure | plan.yaml and slide-state.json are local only | NFR13 |
| Browser localStorage | Used for edit persistence; cleared on browser clear | Standard behavior |
| Cross-origin content | Slides are self-contained; no external scripts except fonts | NFR18 |

**Security Patterns:**
- Per PRD NFR12: "No brand assets or slide content transmitted to external services"
- Per PRD NFR13: "Theme files and slide content remain local to user's machine"
- No credentials involved in Epic 3 (OAuth is Epic 7)
- All file operations are local read/write only

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| Theme.json missing | Block with clear error: "Run /setup first" | Prerequisite check |
| Plan.yaml missing | Block with clear error: "Run /plan-one first" | Prerequisite check |
| Template file missing | Fall back to custom generation via skill | NFR14 |
| Custom build fails | Retry once; show error with context | NFR14 |
| Browser edit not saved | localStorage provides immediate persistence | NFR3 |
| State file write fails | Continue with localStorage; warn user | NFR17 |
| Slide HTML corrupted | Regenerate from plan.yaml | NFR14 |

**Recovery Patterns:**
- Per PRD NFR14: "Partial deck builds are recoverable"
- plan.yaml is the source of truth; slide.html can always be regenerated
- localStorage provides redundant edit storage
- Human-readable YAML/JSON allows manual inspection (NFR17)

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Plan creation | Console + status.yaml | "Single slide planned" with timestamp |
| Template decision | Console + plan.yaml | "Using layout-flow template" or "custom layout" |
| Build progress | Console | "Generating slide..." with spinner for custom builds |
| Build completion | Console + status.yaml | Path to slide.html, "Slide ready" message |
| Edit saves | Console (optional) | "Edits saved" on successful file sync |
| Errors | Console | Clear error messages with next steps |

**Logging Strategy:**
- Real-time console output for user feedback
- status.yaml updated at each workflow phase
- No external logging services (local-first per ADR-005)
- Edit tracking visible in slide-state.json for debugging

## Dependencies and Integrations

**NPM Dependencies (from package.json):**

| Package | Version | Purpose | Used in Epic 3 |
|---------|---------|---------|----------------|
| puppeteer | ^23.0.0 | HTML-to-image conversion | No (Epic 7) |
| googleapis | ^140.0.0 | Google Slides API | No (Epic 7) |

**Note:** Epic 3 does not require npm dependencies. All operations use Claude Code built-in capabilities and browser-native features.

**Claude Code Built-in Tools:**

| Tool | Purpose | Usage in Epic 3 |
|------|---------|-----------------|
| frontend-design skill | Generate custom HTML slides | Story 3.3 - custom layout generation |
| File System (Read) | Load templates, theme, plans | Stories 3.1-3.5 |
| File System (Write) | Save plans, slides, state | Stories 3.1-3.5 |
| Bash (optional) | Open browser for preview | Story 3.4 |

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Claude Code | Current | Framework runtime environment |
| Modern browser | Chrome/Firefox/Safari | Slide preview and text editing |
| File system access | N/A | Read theme/templates, write slides |

**Epic Dependencies:**

| Dependency | From Epic | Required By | Relationship |
|------------|-----------|-------------|--------------|
| theme.json | Epic 2 | Stories 3.1-3.5 | MUST exist before /plan-one |
| templates/*.html | Epic 2 | Story 3.2 | Required for template-based builds |
| status.yaml | Epic 1 | All stories | Mode and progress tracking |
| .slide-builder/ directory | Epic 1 | All stories | Framework structure |

**Integration Points:**

| Integration | Method | Direction | Epic 3 Scope |
|-------------|--------|-----------|--------------|
| Theme system | File read | Inbound | Load theme.json for CSS variables |
| Template system | File read | Inbound | Load layout templates from Epic 2 |
| frontend-design skill | Skill invocation | Outbound | Generate custom layouts |
| File system | Write tool | Outbound | Save plan, slide, state files |
| Browser | File open | Outbound | Preview slides |

**External Service Dependencies:**

| Service | Required? | Purpose | Fallback |
|---------|-----------|---------|----------|
| Google Fonts | Optional | Font rendering in slides | System fonts |

**No external APIs called** - all processing uses local files and Claude's native capabilities.

## Acceptance Criteria (Authoritative)

### Story 3.1: Single Slide Planning

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC3.1.1 | Given a theme exists (theme.json), when the user runs `/plan-one`, then they are prompted to describe the slide they want |
| AC3.1.2 | Given the user describes their slide (e.g., "An architecture diagram showing our 3-tier system"), when the description is submitted, then the system confirms understanding by summarizing: slide purpose, key content elements, suggested layout template (or "custom") |
| AC3.1.3 | The intent is saved to `.slide-builder/single/plan.yaml` with all required fields (intent, suggested_template, key_points, created timestamp) |
| AC3.1.4 | status.yaml is updated with mode: "single" and last_action recorded |
| AC3.1.5 | Given no theme exists, when user runs `/plan-one`, then error message directs them to run `/setup` first |

### Story 3.2: Template-Based Slide Building

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC3.2.1 | Given a single-slide plan exists with a matching template, when the user runs `/build-one`, then the system loads the matching template from `.slide-builder/templates/` |
| AC3.2.2 | The system injects slide content into template placeholders based on plan.yaml |
| AC3.2.3 | The system applies theme CSS variables from theme.json to the slide |
| AC3.2.4 | The slide is saved to `.slide-builder/single/slide.html` |
| AC3.2.5 | The slide renders at 1920x1080 (16:9) |
| AC3.2.6 | All text elements have `contenteditable="true"` and `data-field` attributes |
| AC3.2.7 | status.yaml is updated with built_count and last_action |

### Story 3.3: Custom Slide Building

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC3.3.1 | Given a single-slide plan exists with no matching template (suggested_template: "custom"), when the user runs `/build-one`, then the system invokes the frontend-design skill |
| AC3.3.2 | The frontend-design skill receives: full theme.json, slide intent, content requirements |
| AC3.3.3 | The generated custom slide follows all theme primitives (colors, fonts, shapes) |
| AC3.3.4 | The custom slide renders at 1920x1080 |
| AC3.3.5 | All text elements in the custom slide have contenteditable attributes |
| AC3.3.6 | Given a complex diagram or unique layout is requested, when the frontend-design skill generates the slide, then the output is production-quality, not placeholder |

### Story 3.4: Slide Preview in Browser

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC3.4.1 | Given a slide has been built, when the build completes, then the system provides the file path and offers to open in browser |
| AC3.4.2 | Given the user opens the slide HTML file, when viewed in Chrome, Firefox, or Safari, then the slide renders correctly at 1920x1080 |
| AC3.4.3 | All elements display as designed with no layout issues |
| AC3.4.4 | Text is editable via click (contenteditable works) |
| AC3.4.5 | Slides are self-contained (no external dependencies except Google Fonts) |

### Story 3.5: Text Auto-Save

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC3.5.1 | Given a slide is open in the browser, when the user edits text via contenteditable, then changes are captured on blur event |
| AC3.5.2 | Edits are saved to `.slide-builder/single/slide-state.json` |
| AC3.5.3 | State file includes: selector (data-field attribute value), content (edited text), lastModified timestamp |
| AC3.5.4 | Given the user reopens the slide later, when the slide loads, then saved edits are applied from state file |
| AC3.5.5 | Text auto-save occurs within 1 second of edit completion (NFR3) |

## Traceability Mapping

| AC | Spec Section | Component/Module | Test Idea |
|----|--------------|------------------|-----------|
| AC3.1.1 | Services/Intent Capture | Theme check + prompt | Run /plan-one with theme, verify prompt appears |
| AC3.1.2 | Workflows/Phase 4 | Confirmation display | Describe slide, verify summary shown with template suggestion |
| AC3.1.3 | Data Models/plan.yaml | Plan persistence | Check plan.yaml created with all fields |
| AC3.1.4 | Data Models/status.yaml | Mode tracking | Check status.yaml shows mode: "single" |
| AC3.1.5 | Workflows/Phase 1 | Theme verification | Remove theme.json, run /plan-one, verify error |
| AC3.2.1 | Services/Template Builder | Template loading | Plan "bullet list", build, verify layout-list.html used |
| AC3.2.2 | Services/Template Builder | Content injection | Check slide.html has content from plan |
| AC3.2.3 | Data Models/HTML Slide | CSS variables | Inspect :root for --color-primary, etc. |
| AC3.2.4 | APIs/File System | Slide save | Verify .slide-builder/single/slide.html exists |
| AC3.2.5 | Constraints | Dimensions | Open slide, check viewport 1920x1080 |
| AC3.2.6 | Data Models/HTML Slide | Attributes | Inspect HTML for contenteditable and data-field |
| AC3.2.7 | Data Models/status.yaml | Build tracking | Check status.yaml built_count: 1 |
| AC3.3.1 | Services/Custom Builder | Skill invocation | Plan "Venn diagram", verify skill called |
| AC3.3.2 | APIs/frontend-design | Input params | Verify skill receives theme + intent |
| AC3.3.3 | Constraints | Theme consistency | Inspect custom slide for theme colors/fonts |
| AC3.3.4 | Constraints | Dimensions | Open custom slide, check 1920x1080 |
| AC3.3.5 | Data Models/HTML Slide | Contenteditable | Inspect custom HTML for attributes |
| AC3.3.6 | Services/Custom Builder | Quality | Visual inspection of complex diagram output |
| AC3.4.1 | Workflows/Phase 4 | Preview offer | After build, verify path shown and offer to open |
| AC3.4.2 | NFR/Compatibility | Browser rendering | Open in Chrome, Firefox, Safari |
| AC3.4.3 | NFR/Compatibility | Layout quality | Visual inspection for issues |
| AC3.4.4 | Data Models/HTML Slide | Editing | Click text in browser, verify editable |
| AC3.4.5 | Constraints | Self-contained | Check HTML has no external script/CSS (except fonts) |
| AC3.5.1 | Services/Edit Tracker | Event capture | Edit text, blur, check localStorage |
| AC3.5.2 | Data Models/slide-state.json | File save | Check slide-state.json created |
| AC3.5.3 | Data Models/slide-state.json | Schema | Verify selector, content, lastModified fields |
| AC3.5.4 | Services/Edit Tracker | Restore | Edit, reload page, verify edits restored |
| AC3.5.5 | NFR/Performance | Timing | Edit text, measure time to localStorage save |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Template matching fails to identify correct layout | Medium - user gets custom build instead | Medium | Expand keyword list; allow user to specify template in description |
| **R2:** frontend-design skill produces inconsistent styles | High - custom slides don't match theme | Low | Provide detailed theme context; validate CSS variable usage |
| **R3:** Contenteditable inconsistencies across browsers | Medium - editing experience varies | Low | Use standard HTML5 contenteditable; test in Chrome/Firefox/Safari |
| **R4:** localStorage cleared by user | Medium - unsaved edits lost | Low | Also persist to slide-state.json; warn user about browser clearing |
| **R5:** Large/complex diagrams exceed skill capabilities | High - slide quality suffers | Medium | Provide guidance on complexity; suggest breaking into multiple slides |
| **R6:** Template HTML structure changes break content injection | High - builds fail | Low | Version templates; validate structure before injection |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | theme.json exists from Epic 2 before any Epic 3 workflow runs | Workflow fails; need clear error message |
| **A2** | Templates created in Epic 2 are stable and well-structured | Content injection fails; need template validation |
| **A3** | Users have a modern browser (Chrome, Firefox, Safari) for preview | Slides may not render correctly; need compatibility fallback |
| **A4** | localStorage is available and not disabled | Auto-save fails; need to detect and warn |
| **A5** | frontend-design skill produces consistent, theme-aware output | Custom slides may not match brand; need validation |
| **A6** | Plan.yaml structure is sufficient for all slide types | May need to extend schema for complex slides |
| **A7** | Single slide per plan is the common use case | Users wanting multiple single slides need to re-run /plan-one |

### Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| **Q1** | Should template matching be case-insensitive? | Dev | Recommend: Yes, normalize to lowercase |
| **Q2** | What happens if user runs /plan-one while a plan already exists? | Dev | Recommend: Warn and offer to overwrite |
| **Q3** | Should slide-state.json sync happen on every keystroke or on blur only? | Dev | Recommend: Blur + periodic (5s) for balance |
| **Q4** | How should we handle slides that span multiple screens (scrolling)? | Dev | Recommend: Enforce 1920x1080 constraint, warn if content too dense |
| **Q5** | Should auto-save include position/styling changes or just text? | Dev | Recommend: Text only for MVP; styling via /edit (Epic 4) |
| **Q6** | What's the fallback if frontend-design skill is unavailable? | Dev | Recommend: Error with guidance to retry |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Intent Capture, Template Matcher, etc.) | Manual verification per module |
| **Integration** | Full /plan-one → /build-one workflow | End-to-end testing with various intents |
| **Acceptance** | All ACs per story | Manual testing per AC table |
| **Cross-browser** | Slide rendering and editing | Chrome, Firefox, Safari testing |

### Test Approach by Story

**Story 3.1: Single Slide Planning**
- Run `/plan-one` with theme present, verify prompt appears
- Describe "a bullet list of 5 key features" - verify template: layout-list suggested
- Describe "complex architecture diagram" - verify template: custom suggested
- Check plan.yaml has all required fields
- Check status.yaml updated with mode: single
- Remove theme.json, run /plan-one, verify error directs to /setup

**Story 3.2: Template-Based Slide Building**
- Plan "title slide" → build → verify layout-title.html template used
- Plan "process flow" → build → verify layout-flow.html template used
- Open slide.html, verify 1920x1080 dimensions
- Inspect HTML for contenteditable and data-field on all text
- Verify CSS variables injected from theme.json
- Check status.yaml shows built_count: 1

**Story 3.3: Custom Slide Building**
- Plan "Venn diagram showing overlap of 3 concepts" → build → verify frontend-design skill invoked
- Verify custom slide has theme colors (--color-primary, etc.)
- Verify custom slide renders at 1920x1080
- Verify all text in custom slide is contenteditable
- Visual inspection: diagram is production-quality, not placeholder

**Story 3.4: Slide Preview in Browser**
- After build, verify file path displayed
- Open slide.html in Chrome - verify renders correctly
- Open same file in Firefox - verify identical rendering
- Open same file in Safari - verify identical rendering
- Click on title text - verify cursor appears and text is editable
- Check no external script/CSS errors in console

**Story 3.5: Text Auto-Save**
- Open slide in browser
- Edit title text, click away (blur)
- Check localStorage for 'slide-edits' key
- Check .slide-builder/single/slide-state.json created
- Verify state file has selector, content, lastModified
- Reload page - verify edited title persists
- Time the save: should complete within 1 second

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 3.1 | 5 | Intent flow verification + state file checks |
| 3.2 | 7 | Template selection + slide HTML inspection |
| 3.3 | 6 | Custom build verification + skill output validation |
| 3.4 | 5 | Browser compatibility testing |
| 3.5 | 5 | Edit persistence verification |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No theme.json exists | Error: "No theme found. Run /setup first." |
| No plan.yaml exists | Error: "No plan found. Run /plan-one first." |
| Template file missing | Fall back to custom build via skill |
| Intent matches multiple templates | Use first match in priority order |
| Very long intent description | Parse key elements, summarize back |
| Empty intent description | Prompt for more detail |
| localStorage disabled | Warn user; attempt file-only save |
| Browser closed during edit | localStorage preserved; restore on reopen |
| Slide file manually deleted | Regenerate with /build-one |
| Plan modified after build | Next /build-one uses updated plan |

### Definition of Done

Epic 3 is complete when:
1. `/plan-one` command successfully captures slide intent and saves plan.yaml
2. `/build-one` correctly selects template or invokes custom build
3. Generated slides render at 1920x1080 in Chrome, Firefox, Safari
4. All text elements are contenteditable with data-field attributes
5. Text edits auto-save to localStorage and slide-state.json
6. Edits persist across page reloads
7. All 28 acceptance criteria pass manual verification
8. status.yaml correctly tracks mode and build progress
