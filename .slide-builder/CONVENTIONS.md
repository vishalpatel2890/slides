# Slide Builder Conventions

This document defines the conventions and patterns used in Slide Builder.

## Command-to-Workflow Mapping

Slide Builder commands are organized into three namespaces by purpose:

### Create Commands (/sb-create:)
Day-to-day deck creation workflow

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb-create:plan` | `.slide-builder/workflows/plan/` | Smart router (single or deck) |
| `/sb-create:plan-one` | `.slide-builder/workflows/plan-one/` | Plan a single slide |
| `/sb-create:plan-deck` | `.slide-builder/workflows/plan-deck/` | Plan a full deck |
| `/sb-create:build-one` | `.slide-builder/workflows/build-one/` | Build next/single slide |
| `/sb-create:build-all` | `.slide-builder/workflows/build-all/` | Build all remaining slides |
| `/sb-create:edit` | `.slide-builder/workflows/edit/` | Edit slide layout |
| `/sb-create:add-slide` | `.slide-builder/workflows/add-slide/` | Add a new slide to existing deck |
| `/sb-create:animate` | `.slide-builder/workflows/animate/` | Generate animation groups |
| `/sb-create:export` | `.slide-builder/workflows/export/` | Export to Google Slides |
| `/sb-create:use-template` | `.slide-builder/workflows/use-template-deck/` | Instantiate a deck template |
| `/sb-create:refresh` | `.slide-builder/workflows/refresh/` | Regenerate viewer/manifest |

### Manage Commands (/sb-manage:)
Catalog and template management

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb-manage:add-slide-template` | `.slide-builder/workflows/add-slide-template/` | Create new slide template |
| `/sb-manage:add-deck-template` | `.slide-builder/workflows/add-deck-template/` | Create new deck template |
| `/sb-manage:edit-deck-template` | `.slide-builder/workflows/edit-deck-template/` | Edit existing deck template |
| `/sb-manage:update-brand-assets` | `.slide-builder/workflows/update-brand-assets/` | Manage brand asset catalog (icons, logos, images) |
| `/sb-manage:delete-deck` | `.slide-builder/workflows/delete-deck/` | Delete a deck and files |
| `/sb-manage:optimize-instructions` | `.slide-builder/workflows/optimize-instructions/` | Optimize workflow instructions |

### Brand Commands (/sb-brand:)
Theme and brand management

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb-brand:setup` | `.slide-builder/workflows/setup/` | Create brand theme from assets |
| `/sb-brand:theme` | `.slide-builder/workflows/theme/` | Display current theme summary |
| `/sb-brand:theme-edit` | `.slide-builder/workflows/theme-edit/` | Modify existing theme |

### Meta Commands (/sb:)
Help and discovery

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb` | `.claude/skills/sb/` | Smart entry point - detects context and routes to appropriate workflow |
| `/sb:help` | N/A (static) | Show all commands organized by namespace |
| `/sb:status` | `.slide-builder/workflows/status/` | Display unified slide queue status dashboard |

**Smart Entry Point (`/sb`):**
The `/sb` command is the recommended starting point for Slide Builder. It:
1. Reads `status.yaml` to detect current state (no theme, no decks, in-progress, all complete)
2. Presents context-aware options using AskUserQuestion
3. Routes to the appropriate workflow based on user selection

Use `/sb` when you're unsure which command to run - it will guide you based on your current project state.

## Workflow Execution Pattern

All workflows follow the BMAD pattern:

1. **Load** `workflow.yaml` from the workflow directory
2. **Read** `instructions.md` for step-by-step execution
3. **Execute** steps in numerical order
4. **Pause** at `<template-output>` and `<ask>` tags for user interaction
5. **Update** `.slide-builder/status.yaml` with progress

## Design Standards

The design standards file (`.slide-builder/config/design-standards.md`) contains professional presentation design guidelines for 1920x1080 slides. These standards ensure readability when slides are scaled to fit laptop screens (typically 50% zoom).

**Key Standards:**
- Typography minimums (body text 24px+, labels 18px+)
- Spacing requirements (60px+ slide padding)
- Content density limits (max 6 bullets, max 15 words per bullet)
- Visual hierarchy rules (1.25-1.33 scale ratio)

**Integration:**
- `build-one` workflow loads standards in Phase 2.5 before HTML generation
- `setup` workflow references standards when deriving typography scale
- `theme-edit` workflow validates changes against standards minimums

## File Structure

```
.slide-builder/
├── config/              # Shareable brand assets (zip to share)
│   ├── theme.json       # Brand theme primitives
│   ├── design-standards.md  # Professional design guidelines (typography, spacing, density)
│   ├── theme-history/   # Version snapshots
│   └── catalog/         # Template catalog for slide layouts
│       ├── slide-templates.json  # Slide template manifest with metadata
│       ├── deck-templates.json   # Deck template manifest
│       ├── slide-templates/      # Individual slide template HTML files
│       │   ├── title.html
│       │   ├── agenda.html
│       │   └── ...
│       ├── deck-templates/       # Multi-slide deck templates
│       │   └── {template-slug}/
│       │       ├── template-config.yaml
│       │       └── slides/*.html
│       └── brand-assets/         # Brand visual assets
│           ├── icons/            # Icon catalog
│           │   ├── icon-catalog.json
│           │   ├── dark/         # Dark icons for light backgrounds
│           │   └── white/        # White icons for dark backgrounds
│           ├── images/           # Brand images
│           └── logos/            # Brand logos
├── templates/           # Framework templates (NOT shareable)
│   └── viewer-template.html  # Master template for deck viewer generation
├── workflows/           # Core framework (versioned)
│   ├── setup/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── theme/
│   ├── theme-edit/
│   ├── plan/
│   ├── plan-one/
│   ├── plan-deck/
│   ├── build-one/
│   ├── build-all/
│   ├── edit/
│   ├── export/
│   ├── optimize-instructions/
│   ├── add-slide-template/
│   ├── add-deck-template/
│   ├── edit-deck-template/
│   ├── animate/
│   ├── use-template-deck/
│   ├── delete-deck/
│   ├── add-slide/
│   └── update-brand-assets/
├── status.yaml          # Runtime session state
├── CONVENTIONS.md       # This file
├── single/              # Single slide mode workspace
│   ├── plan.yaml
│   └── slide.html
├── deck/                # Deck mode workspace
│   ├── plan.yaml
│   └── slides/
│       ├── slide-1.html
│       └── ...
└── credentials/         # OAuth tokens (gitignored)

.claude/commands/
├── sb/                  # Meta commands (help)
│   └── help.md          # Master help showing all namespaces
├── sb-create/           # Day-to-day creation commands (11)
│   ├── plan.md
│   ├── plan-one.md
│   ├── plan-deck.md
│   ├── build-one.md
│   ├── build-all.md
│   ├── edit.md
│   ├── add-slide.md
│   ├── animate.md
│   ├── export.md
│   ├── use-template.md
│   └── refresh.md
├── sb-manage/           # Catalog/template management (6)
│   ├── add-slide-template.md
│   ├── add-deck-template.md
│   ├── edit-deck-template.md
│   ├── update-brand-assets.md
│   ├── delete-deck.md
│   └── optimize-instructions.md
└── sb-brand/            # Brand/theme management (3)
    ├── setup.md
    ├── theme.md
    └── theme-edit.md
```

## Adding New Commands

To add a new command:

1. **Determine the appropriate namespace:**
   - `/sb-create:` - Day-to-day deck creation (planning, building, editing, exporting)
   - `/sb-manage:` - Template and catalog management (power user operations)
   - `/sb-brand:` - Brand theme setup and editing (one-time or occasional)
   - `/sb:` - Meta commands only (help, discovery)

2. **Create workflow directory:** `.slide-builder/workflows/{command-name}/`
3. **Add `workflow.yaml`** with BMAD schema (name, description, instructions path)
4. **Add `instructions.md`** with workflow steps
5. **Create skill registration** in the appropriate namespace folder:
   - `.claude/commands/sb-create/{command-name}.md` for create commands
   - `.claude/commands/sb-manage/{command-name}.md` for manage commands
   - `.claude/commands/sb-brand/{command-name}.md` for brand commands
6. **Update this CONVENTIONS.md** with the new mapping in the appropriate section
7. **Update `/sb:help`** to include the new command in its namespace section

## Workflow YAML Schema

```yaml
name: workflow-name
description: "Brief description"
author: "Slide Builder"

installed_path: "{project-root}/.slide-builder/workflows/{name}"
instructions: "{installed_path}/instructions.md"

variables:
  workflow_version: "1.0"

template: false  # true if workflow produces document output
standalone: true
```

## State Management

- `status.yaml`: Tracks current mode, deck registry, progress, history
- `plan.yaml`: Stores slide plan (single or deck mode, per-deck in `output/{slug}/plan.yaml`)
- State files use ISO 8601 timestamps
- History array captures action trail for debugging/resume

### status.yaml Schema

The status file has two layers: **global state** (shared across all decks) and a **deck registry** (per-deck state).

**Global State (top-level):**

| Field | Type | Description |
|-------|------|-------------|
| `mode` | enum | `setup`, `ready`, `single`, `deck` |
| `setup_phase` | string | Setup workflow progress |
| `workflow_version` | string | Framework version |
| `feedback_iteration` | number | Theme feedback loop counter |
| `assets` | object | Collected brand assets (urls, pdfs, images, description) |
| `extraction` | object | Analysis status per asset type |
| `theme` | object | Theme file path, version, status, personality, confidence |
| `brand_colors` | object | Extracted brand color palette |
| `catalog` | string | Path to catalog.json manifest (authoritative template data lives in that file) |
| `last_modified` | string | ISO 8601 timestamp of last change |
| `history` | array | Global action trail (append-only) |

**Deck Registry (`decks:` section):**

Multiple decks are tracked simultaneously. Each deck is keyed by its slug (kebab-case).

```yaml
decks:
  my-deck-slug:
    name: "Human Readable Deck Name"
    status: building              # planned | building | complete
    total_slides: 10
    built_count: 5
    current_slide: 5
    output_folder: "output/my-deck-slug"
    created_at: "2026-01-15T10:00:00Z"
    last_modified: "2026-01-16T14:30:00Z"
    last_action: "Built slide 5: Section Title"
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name from plan.yaml `deck_name` |
| `status` | enum | `planned` → `building` → `complete` |
| `total_slides` | number | Total slides in the deck plan |
| `built_count` | number | Number of slides built so far |
| `current_slide` | number | Last slide built or being built |
| `output_folder` | string | Path to deck output directory |
| `created_at` | string | ISO 8601 timestamp when deck was planned |
| `last_modified` | string | ISO 8601 timestamp of last deck change |
| `last_action` | string | Description of last action on this deck |

**Deck Status Lifecycle:**

```
planned → building → complete
```

- `planned`: Set when `/sb:plan-deck` creates the entry
- `building`: Set when first slide is built
- `complete`: Set when `built_count == total_slides`

**Deck Selection Protocol:**

Workflows that operate on a deck follow this pattern:
1. Read all entries from `decks:` registry
2. Filter by eligible status (e.g., build needs `planned` or `building`)
3. If zero eligible: halt with guidance
4. If one eligible: auto-select silently
5. If multiple eligible: present numbered list, ask user to choose

**Note:** There is no single `active_deck` pointer. Multiple decks can be active simultaneously. Single-mode slides (`mode: single`) do not appear in the deck registry.

## Template Catalog

The catalog system provides a unified registry of reusable slide templates with rich metadata for agent-driven template selection.

### Catalog Location

```
.slide-builder/config/catalog/
├── slide-templates.json     # Template manifest
├── slide-templates/         # Template HTML files
│   ├── title.html
│   ├── agenda.html
│   └── ...
└── ...
```

### Catalog Manifest Schema (slide-templates.json)

```json
{
  "version": "1.0",
  "generated": "YYYY-MM-DD",
  "lastModified": "ISO-timestamp",
  "templates": [
    {
      "id": "template-slug",
      "name": "Human Readable Name",
      "description": "Purpose and when to use",
      "use_cases": ["keyword1", "keyword2"],
      "file": "slide-templates/template-slug.html",
      "preview": null,
      "created_at": "ISO-timestamp",
      "source": "setup|add-slide-template"
    }
  ]
}
```

### Template Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique slug identifier (kebab-case) |
| `name` | string | Human-readable display name |
| `description` | string | Purpose and when to use this template |
| `use_cases` | array | Keywords for matching (agent uses these) |
| `file` | string | Path to file within catalog directory (e.g., "slide-templates/title.html") |
| `preview` | string\|null | Optional thumbnail path (future use) |
| `created_at` | string | ISO 8601 timestamp of creation |
| `source` | string | Origin: "setup" for initial, "add-slide-template" for user-created |

### Template Naming Conventions

- Template IDs use kebab-case slugs (e.g., "process-flow")
- HTML files are in `slide-templates/` folder: `slide-templates/{id}.html`
- No numeric prefixes - manifest provides ordering if needed

## Icon Catalog

The icon catalog system ensures brand-certified icons are used consistently across all generated slides.

### Icon Catalog Location

```
.slide-builder/config/catalog/brand-assets/icons/
├── icon-catalog.json   # Icon manifest (generated by /sb-manage:update-brand-assets)
├── dark/               # Dark icons for light backgrounds
│   ├── icons8-{id}-50.png
│   └── icons8-{id}-100.png
└── white/              # White icons for dark backgrounds
    ├── icons8-{id}-50.png
    └── icons8-{id}-100.png
```

### Icon Catalog Manifest Schema (icon-catalog.json)

```json
{
  "version": "1.0",
  "generated": "YYYY-MM-DD",
  "lastModified": "ISO-timestamp",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/icons",
    "variants": { "dark": "dark/", "white": "white/" },
    "sizes": ["50", "100"]
  },
  "naming_pattern": "icons8-{id}-{size}.png",
  "fallback_behavior": "omit",
  "icons": [
    {
      "id": "icon-slug",
      "name": "Human Readable Name",
      "description": "What this icon represents",
      "file_pattern": "icons8-{id}-{size}.png",
      "tags": ["semantic", "keywords", "for", "matching"]
    }
  ]
}
```

### Icon Variant Selection Rules

| Slide Background Mode | Icon Variant | Reason |
|-----------------------|--------------|--------|
| `dark` | `white/` folder | White icons visible on dark backgrounds |
| `light` | `dark/` folder | Dark icons visible on light backgrounds |

### Icon Size Guidelines

| Size | Use Case |
|------|----------|
| 50px | Small decorative icons, list items, compact layouts |
| 100px | Feature icons, hero elements, prominent displays |

### Icon Selection Algorithm

1. Match slide's icon concept against `icon.id` (exact match, case-insensitive)
2. If no ID match, search `icon.tags` array (case-insensitive)
3. If no match found → **OMIT icon entirely** (fallback_behavior: "omit")

### Icon Usage in Generated HTML

```html
<img src=".slide-builder/config/catalog/brand-assets/icons/white/icons8-brainstorm-100.png"
     alt="Brainstorm"
     class="icon"
     data-animatable="true">
```

### Managing Icons

Use `/sb-manage:update-brand-assets` to manage icons:
- **Scan & Catalog**: Discover existing icons in the folder and add semantic tags
- **Import New Icon**: Add new icon files with metadata
- **View Catalog**: Display current icon inventory

See also the [Managing Brand Assets](#managing-brand-assets) section for unified asset management.

### Icon Integration with build-one

The `build-one` workflow loads the icon catalog in Phase 2.6:
- If catalog exists → enforce icon-only rules, no emoji/SVG generation
- If catalog missing → warn user, recommend `/sb-manage:update-brand-assets`, proceed without constraints

## Logo Catalog

The logo catalog system ensures brand-certified logos are used consistently across all generated slides.

### Logo Catalog Location

```
.slide-builder/config/catalog/brand-assets/logos/
├── logo-catalog.json   # Logo manifest (generated by /sb-manage:update-brand-assets)
├── {logo-name}-dark.png    # Dark variant for light backgrounds
└── {logo-name}-white.png   # Light/white variant for dark backgrounds
```

### Logo Catalog Manifest Schema (logo-catalog.json)

```json
{
  "version": "1.0",
  "generated": "YYYY-MM-DD",
  "lastModified": "ISO-timestamp",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/logos"
  },
  "fallback_behavior": "omit",
  "logos": [
    {
      "id": "primary-mark",
      "name": "Primary Brand Mark",
      "description": "Main brand symbol for headers and footers",
      "variants": [
        {
          "variant_id": "dark",
          "file": "amperity-mark-black.png",
          "usage": "Use on light backgrounds"
        },
        {
          "variant_id": "light",
          "file": "amperity-mark-white.png",
          "usage": "Use on dark backgrounds"
        }
      ],
      "placement_rules": [
        "Bottom-right corner preferred",
        "Max height 60px on content slides",
        "Max height 120px on title slides"
      ],
      "tags": ["brand", "mark", "primary", "logo"]
    }
  ]
}
```

### Logo Variant Selection Rules

| Slide Background Mode | Logo Variant | Reason |
|-----------------------|--------------|--------|
| `dark` | `light` variant (white logo) | Light logos visible on dark backgrounds |
| `light` | `dark` variant (dark/black logo) | Dark logos visible on light backgrounds |

### Logo Selection Algorithm

1. Match slide's logo concept against `logo.id` (exact match, case-insensitive)
2. If no ID match, search `logo.tags` array (case-insensitive)
3. If match found → select appropriate variant based on `background_mode`
4. If no match found → **OMIT logo entirely** (fallback_behavior: "omit")

### Logo Usage in Generated HTML

```html
<img src=".slide-builder/config/catalog/brand-assets/logos/amperity-mark-white.png"
     alt="Brand Logo"
     class="logo"
     data-animatable="true">
```

### Logo Integration with build-one

The `build-one` workflow loads the logo catalog in Phase 2.7:
- If catalog exists → enforce logo-only rules, never draw or recreate logos
- If catalog missing → proceed without logo constraints

## Images Catalog

The images catalog system manages decorative images, hero images, and brand imagery for consistent use across slides.

### Images Catalog Location

```
.slide-builder/config/catalog/brand-assets/images/
├── images-catalog.json   # Images manifest (generated by /sb-manage:update-brand-assets)
├── {image-name}.png      # Individual image files
└── ...
```

### Images Catalog Manifest Schema (images-catalog.json)

```json
{
  "version": "1.0",
  "generated": "YYYY-MM-DD",
  "lastModified": "ISO-timestamp",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/images"
  },
  "fallback_behavior": "omit",
  "categories": ["decorative", "hero", "background", "diagram", "photo", "illustration"],
  "images": [
    {
      "id": "icon-col1",
      "name": "Column Decorative 1",
      "description": "Decorative element for column layouts",
      "file": "icon-col1.png",
      "category": "decorative",
      "dimensions": {
        "width": 200,
        "height": 200
      },
      "tags": ["column", "visual", "decorative", "brand"]
    }
  ]
}
```

### Image Categories

| Category | Description | Use Case |
|----------|-------------|----------|
| `decorative` | Visual accents and flourishes | Column layouts, section dividers |
| `hero` | Large featured images | Title slides, section openers |
| `background` | Full-slide backgrounds | Cover slides, mood slides |
| `diagram` | Pre-made diagrams | Technical slides, process flows |
| `photo` | Photography assets | People, places, products |
| `illustration` | Custom illustrations | Conceptual, branded graphics |

### Image Selection Algorithm

1. Match concept to `image.id` (exact match, case-insensitive)
2. If no ID match, search `image.category` (exact match)
3. If no category match, search `image.tags` array (case-insensitive)
4. If no match found → **OMIT image entirely** (fallback_behavior: "omit")

### Image Usage in Generated HTML

```html
<img src=".slide-builder/config/catalog/brand-assets/images/icon-col1.png"
     alt="Column Decorative"
     class="decorative-image"
     data-animatable="true">
```

### Images Integration with build-one

The `build-one` workflow loads the images catalog in Phase 2.8:
- If catalog exists → only use catalog images, never generate substitutes
- If catalog missing → proceed without image constraints

### Managing Brand Assets

Use `/sb-manage:update-brand-assets` to:
- **Classify & Import**: Auto-detect asset type (icon, logo, image) and add to appropriate catalog
- **Scan & Catalog**: Discover existing assets and add semantic metadata
- **View Catalogs**: Display current icon, logo, and image inventories

## Deck Templates

Deck templates are pre-built multi-slide collections that can be instantiated with new content. Unlike slide templates (single slides), deck templates define complete presentation structures with content sourcing instructions.

### Deck Template Location

```
.slide-builder/config/catalog/deck-templates/
├── deck-templates.json          # Manifest of all deck templates
└── {template-slug}/
    ├── template-config.yaml     # Template metadata + content sourcing instructions
    └── slides/
        ├── slide-1.html         # Pre-built slide with constraint comments
        ├── slide-2.html
        └── slide-N.html
```

### Deck Template Manifest Schema (deck-templates.json)

```json
{
  "version": "1.0",
  "generated": "YYYY-MM-DD",
  "lastModified": "ISO-timestamp",
  "templates": [
    {
      "id": "template-slug",
      "name": "Human Readable Name",
      "description": "Purpose and typical use cases",
      "use_cases": ["keyword1", "keyword2"],
      "slide_count": 8,
      "folder": "template-slug",
      "preview": null,
      "created_at": "ISO-timestamp",
      "source": "manual"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique slug identifier (kebab-case) |
| `name` | string | Human-readable display name |
| `description` | string | Purpose and when to use this template |
| `use_cases` | array | Keywords for matching (agent uses these) |
| `slide_count` | number | Total slides in the deck template |
| `folder` | string | Folder name within deck-templates directory |
| `preview` | string\|null | Optional thumbnail path (future use) |
| `created_at` | string | ISO 8601 timestamp of creation |
| `source` | string | Origin: "manual" for hand-created templates |

### Template Config Schema (template-config.yaml)

Each deck template folder contains a `template-config.yaml` with content sourcing instructions:

```yaml
# Deck Template Configuration
name: Client Pitch Deck
description: "Standard pitch deck structure for client presentations"
version: "1.0"
slide_count: 8

# Global context requirements (user must provide these)
required_context:
  - name: client_name
    type: string
    description: "Name of the client company"
    prompt: "What is the client company name?"
  - name: client_industry
    type: string
    description: "Industry vertical"
    prompt: "What industry is the client in?"

# Optional context (agent can infer or ask)
optional_context:
  - name: meeting_date
    type: date
    default: "{{today}}"
  - name: presenter_name
    type: string
    default: "{{user_name}}"

# Content sourcing instructions per slide
slides:
  - number: 1
    name: "Title Slide"
    file: "slides/slide-1.html"
    instructions: |
      Replace title with: "{{client_name}} Partnership Opportunity"
      Replace subtitle with meeting date and presenter
    content_sources: []

  - number: 2
    name: "Client Overview"
    file: "slides/slide-2.html"
    instructions: |
      Research client using web search
      Fill company description and key stats
    content_sources:
      - type: web_search
        query: "{{client_name}} company overview"
        extract: ["description", "revenue", "employees"]
      - type: user_input
        field: company-description
        fallback: "Ask user for description if search fails"

# Quality checkpoints
checkpoints:
  after_each_slide: true
  validation_rules:
    - "All required fields must be populated"
    - "No placeholder text remaining"
    - "Content length within constraints"
  user_interaction:
    on_incomplete: "ask"
    on_uncertain: "ask"
    on_quality_fail: "ask"
```

**Context Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Variable name for template substitution |
| `type` | string | Data type: string, date, number |
| `description` | string | Human-readable description |
| `prompt` | string | Question to ask user (required_context only) |
| `default` | string | Default value (optional_context only) |

**Slide Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `number` | number | Slide order (1-indexed) |
| `name` | string | Slide display name |
| `file` | string | Path to HTML file relative to template folder |
| `instructions` | string | Agent instructions for content replacement |
| `content_sources` | array | Data sources for populating fields |

**Content Source Types:**

| Type | Description |
|------|-------------|
| `web_search` | Search web for data, extract specified fields |
| `file` | Read content from local file |
| `mcp_tool` | Invoke MCP tool for data |
| `user_input` | Prompt user directly for content |

### HTML Constraint Comment Syntax

Constraints are embedded in HTML comments adjacent to content elements to guide content replacement:

```html
<!-- slide-field: title, max-length=60, type=headline, required=true -->
<h1 class="title" contenteditable="true" data-field="title">
  Partnership Opportunity
</h1>

<!-- slide-field: subtitle, max-length=100, type=subhead, required=false -->
<p class="subtitle" contenteditable="true" data-field="subtitle">
  Building the Future Together
</p>

<!-- slide-field: key-stat, max-length=30, type=metric, format=currency, required=true -->
<div class="stat-value" contenteditable="true" data-field="key-stat">
  $10M+
</div>
```

**Constraint Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `max-length` | number | Maximum character count |
| `min-length` | number | Minimum character count (optional) |
| `type` | enum | Content type: `headline`, `subhead`, `body`, `metric`, `label`, `quote` |
| `required` | boolean | Must be populated (true) or optional (false) |
| `format` | string | Special formatting: `currency`, `percentage`, `date` |
| `preserve-html` | boolean | Allow HTML tags in content (default: false) |

**Comment Format:**
```
<!-- slide-field: {field-name}, {attr1}={value1}, {attr2}={value2}, ... -->
```

The field name must match the `data-field` attribute on the adjacent element.

### Deck Template Naming Conventions

- Template folder names use kebab-case (e.g., "client-pitch", "weekly-report")
- Manifest `id` matches folder name
- Slide HTML files use numeric prefix: `slide-1.html`, `slide-2.html`
- Config file always named `template-config.yaml`

## Enhanced Planning Patterns (Story 13.4)

The plan-deck workflow includes an enhanced planning system with agenda structure and deep discovery for each section.

### AskUserQuestion Tool Usage

The AskUserQuestion tool enables structured user input during planning workflows.

**Preferred Pattern:** Use the `<ask>` DSL (see "`<ask>` DSL Pattern for User Prompts" section below) instead of calling AskUserQuestion directly in workflow instructions. The DSL provides:
- Automatic handling of terminal color issues
- Cleaner, more declarative syntax
- Engine-enforced consistency

**Tool Constraints (when using directly):**
- Maximum 4 questions per tool call
- Maximum 4 options per question
- User can always select "Other" to provide custom input
- Use `multiSelect: true` for selections where multiple options can apply
- Use `multiSelect: false` for single-choice decisions

**DSL Example (recommended):**
```xml
<ask context="**Message Framing: {{section.title}}**

Which message framing resonates best?"
     header="Message">
  <choice label="Direct" description="Statement about audience's current situation" />
  <choice label="Question" description="Engage with a thought-provoking question" />
  <choice label="Story" description="Open with a relatable scenario" />
  <choice label="Data" description="Lead with a surprising statistic" />
</ask>
```

**Multi-select DSL Example:**
```xml
<ask context="Which discovery areas would you like to explore for this section?"
     header="Discovery"
     multiSelect="true">
  <choice label="Diagram Style" description="Specify diagram types like flowchart, timeline" />
  <choice label="Visual Metaphor" description="Guide imagery theme like journey, growth" />
  <choice label="Deep Research" description="Search for statistics, quotes, case studies" />
</ask>
```

### `<ask>` DSL Pattern for User Prompts

The `<ask>` DSL provides a declarative way to prompt users in workflows, supporting both choice-based and freeform input modes.

#### Why Use the DSL?

The AskUserQuestion tool's `question` field renders with white text in Claude Code terminals. On light backgrounds, this text is invisible. The DSL pattern solves this by:

1. **Separating context from choices** - Descriptive text is output as plain text (always visible)
2. **Providing consistent structure** - All prompts follow the same pattern
3. **Engine-enforced behavior** - The workflow engine handles the output/tool-call sequence automatically

#### `<ask>` Element Schema (Choice Mode)

When `<ask>` contains `<choice>` children, it operates in **choice mode**:

```xml
<ask context="Multi-line descriptive text shown to user before choices.

Can include:
- Markdown formatting (**bold**, *italic*)
- Variable interpolation ({{section.title}})
- Bullet points and structure"
     header="Tag"
     multiSelect="false">
  <choice label="Option A" description="What this option means" />
  <choice label="Option B" description="What this option means" />
</ask>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `context` | No | (none) | Multi-line text output before choices. Supports markdown and `{{variables}}`. |
| `header` | No | "Select" | Short tag/chip label (max 12 characters) |
| `multiSelect` | No | `false` | Allow multiple selections when `true` |

#### `<choice>` Element Schema

```xml
<choice label="Button Text" description="Explanation shown to user" />
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `label` | Yes | Button/chip text (1-5 words, concise) |
| `description` | Yes | Explanation of what selecting this option means |

**Constraints:**
- Minimum 2 choices, maximum 4 choices per `<ask>`
- User can always select "Other" to provide custom input (tool adds this automatically)

#### `<ask>` Element (Freeform Mode)

When `<ask>` has no `<choice>` children, it operates in **freeform mode** (backwards compatible):

```xml
<ask>Describe your slide intent. What message should this slide convey?</ask>
```

The engine displays the text and waits for free-text user input.

#### When to Use Each Pattern

| Use Case | Pattern | Example |
|----------|---------|---------|
| Select from predefined options | Choice mode | Message framing, template selection, approval gates |
| Open-ended user input | Freeform mode | Slide descriptions, custom content, explanations |
| Yes/no decisions | Choice mode | "Approve" / "Revise" choices |
| Multiple selections allowed | Choice mode + `multiSelect="true"` | Discovery areas, feature toggles |

#### Migration Pattern: Before/After

**Before (manual workaround - deprecated):**
```xml
<output>
**Message Framing: {{section.title}}**

Which message framing resonates best?
</output>

<action>Use AskUserQuestion tool:
  {
    "questions": [{
      "question": "Select one:",
      "header": "Message",
      "options": [
        {"label": "Direct", "description": "Statement about audience's current situation"},
        {"label": "Question", "description": "Engage with a thought-provoking question"}
      ],
      "multiSelect": false
    }]
  }
</action>
```

**After (DSL pattern - recommended):**
```xml
<ask context="**Message Framing: {{section.title}}**

Which message framing resonates best?"
     header="Message">
  <choice label="Direct" description="Statement about audience's current situation" />
  <choice label="Question" description="Engage with a thought-provoking question" />
</ask>
```

#### How the Engine Processes Choice Mode

When workflow.xml encounters an `<ask>` with `<choice>` children:

1. **Output context** - If `context` attribute exists, output as plain text (visible on all terminals)
2. **Transform choices** - Convert `<choice>` elements to AskUserQuestion `options` array
3. **Call tool** - Invoke AskUserQuestion with:
   - `question`: "Select:" (minimal, invisible text is harmless)
   - `header`: From attribute or "Select"
   - `options`: Transformed from `<choice>` elements
   - `multiSelect`: From attribute or `false`
4. **Wait** - Pause for user response

This sequence ensures descriptive context is always visible, regardless of terminal theme.

### Agenda Structure Schema

After context collection, the planning workflow generates an agenda structure stored in plan.yaml:

```yaml
agenda:
  total_sections: 5
  sections:
    - id: "agenda-1"
      title: "Opening Hook"
      narrative_role: "opening"   # opening | context | problem | solution | evidence | cta
      estimated_slides: 1
      description: "Grab attention with key insight about audience's situation"
      discovery:
        key_message: "What if you could build presentations in minutes?"
        key_message_framing: "question"

    - id: "agenda-2"
      title: "The Problem"
      narrative_role: "problem"
      estimated_slides: 2
      description: "Establish pain point and urgency"
      discovery:
        key_message: "Manual slide creation wastes 3+ hours per deck"
        key_message_framing: "data"
```

**Agenda Section Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (agenda-1, agenda-2, etc.) |
| `title` | string | Section name displayed to user |
| `narrative_role` | enum | opening, context, problem, solution, evidence, cta |
| `estimated_slides` | number | How many slides this section generates (1-3) |
| `description` | string | One-sentence purpose description |
| `discovery` | object | Deep discovery data (see below) |

### Discovery Object Schema

Each agenda section includes a discovery object capturing user choices during planning:

```yaml
discovery:
  # Required - collected during section message discovery (Step 2.6)
  key_message: "The main message or hook for this section"
  key_message_framing: "direct | question | story | data"
```

**Discovery Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key_message` | string | Yes | The core message for slides in this section |
| `key_message_framing` | enum | Yes | How the message is framed (direct/question/story/data) |

### Slide Generation Integration

When building slides, the build-one workflow uses section context to enhance generation:

1. **Read agenda_section_id** from the slide in plan.yaml
2. **Find matching section** in `agenda.sections` array
3. **Extract discovery data** to enrich slide generation:
   - `key_message` → Informs slide title/headline generation

**Build-one Phase 1A.5 Flow:**
```
slide.agenda_section_id exists?
    ↓ Yes
Find section in agenda.sections where id == agenda_section_id
    ↓ Found
Extract discovery data:
  - enriched_key_message = section.discovery.key_message
    ↓
Use enriched context in Phase 3A/3B content generation
```

### Backwards Compatibility

Plans created before Story 13.4 (without agenda section) continue to work:
- Build-one checks for `agenda_section_id` field presence
- If missing or no matching section found, uses original slide context
- No migration required for existing plan.yaml files

## Workflow Rules Schema (theme.json)

The `workflowRules` section in theme.json centralizes all brand-specific rules for slide generation workflows. This ensures brand consistency and enables framework reusability across different brands.

### Location

The workflowRules section lives in theme.json as a top-level key:

```
.slide-builder/config/theme.json
└── workflowRules
    ├── description    # What this section is for
    ├── rhythm         # Background mode alternation rules
    ├── colorSchemes   # Dark/light mode color mappings
    ├── narrativeDefaults  # Storyline role defaults
    └── designPlanPatterns # Reusable text templates
```

### workflowRules.rhythm Schema

Controls background mode alternation for visual contrast and rhythm:

```json
{
  "rhythm": {
    "description": "Background mode alternation rules for visual contrast",
    "defaultMode": "dark",           // Default background mode
    "maxConsecutiveDark": 3,         // Max consecutive dark slides allowed
    "maxConsecutiveLight": 2,        // Max consecutive light slides allowed
    "forceBreakAfter": 2,            // Force alternate after N consecutive same mode
    "roleOverrides": {               // Storyline roles with fixed background modes
      "opening": "dark",
      "cta": "dark",
      "evidence": "light"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `defaultMode` | enum | Default background mode: `dark` or `light` |
| `maxConsecutiveDark` | number | Maximum consecutive dark slides before forcing light |
| `maxConsecutiveLight` | number | Maximum consecutive light slides before forcing dark |
| `forceBreakAfter` | number | Force alternate background after this many consecutive |
| `roleOverrides` | object | Map of storyline role → forced background mode |

### workflowRules.colorSchemes Schema

Maps background modes to actual theme color references:

```json
{
  "colorSchemes": {
    "dark": {
      "background": "colors.background.dark",
      "textHeading": "colors.text.onDark",
      "textBody": "colors.text.body",
      "accent": "colors.accent",
      "description": "Off-Black background with white text and Amp Yellow accents"
    },
    "light": {
      "background": "colors.background.light",
      "textHeading": "colors.text.onLight",
      "textBody": "colors.text.onLight",
      "accent": "colors.brand.dusk",
      "description": "White background with off-black text and Dusk accents"
    }
  }
}
```

**Color Reference Syntax:** Values like `"colors.background.dark"` are JSON paths within theme.json. Workflows resolve these at runtime to get actual hex values (e.g., `#0C0C0C`).

| Field | Type | Description |
|-------|------|-------------|
| `background` | string | Theme path to background color |
| `textHeading` | string | Theme path to heading text color |
| `textBody` | string | Theme path to body text color |
| `accent` | string | Theme path to accent color |
| `description` | string | Human-readable description for design plan generation |

### workflowRules.narrativeDefaults Schema

Defines default settings for each storyline role (opening, context, problem, solution, evidence, cta):

```json
{
  "narrativeDefaults": {
    "opening": {
      "backgroundMode": "dark",
      "defaultTone": "bold",
      "designHint": "Bold first impression, hero typography, full visual impact"
    },
    "evidence": {
      "backgroundMode": "light",
      "defaultTone": "professional",
      "designHint": "Better readability for data, charts, and detailed content"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `backgroundMode` | enum | `dark`, `light`, or `alternate` (follow rhythm rules) |
| `defaultTone` | string | Voice/tone for content: `bold`, `professional`, `urgent`, `confident` |
| `designHint` | string | Guidance text for slide generation |

### workflowRules.designPlanPatterns Schema

Reusable text templates for design_plan generation in plan.yaml:

```json
{
  "designPlanPatterns": {
    "colorSectionDark": "**Color:** Off-Black background, white text, Amp Yellow accents",
    "colorSectionLight": "**Color:** White background, off-black text, Dusk accents"
  }
}
```

### Agent Responsibilities

| Agent Type | Responsibility |
|------------|----------------|
| **Brand Agents** (setup, theme-edit) | CREATE and UPDATE theme.json including workflowRules |
| **Builder Agents** (plan-deck, build-one, edit) | REFERENCE theme.json religiously - no fallbacks |
| **Manage Agents** (add-slide-template, etc.) | REFERENCE theme.json for consistency |

### Strict Enforcement

Workflows MUST NOT contain fallback logic to hardcoded values. If theme.json is missing workflowRules:

1. **plan-deck**: HALT with error directing user to run `/sb-brand:setup`
2. **build-one**: HALT with error directing user to run `/sb-brand:theme-edit`

No hardcoded hex values or rhythm rules should exist in workflow instruction files.

## Brand Guidelines Pipeline (Epic 16)

The brand guidelines pipeline enables comprehensive brand knowledge extraction from large PDF documents.

### PDF Chunking Configuration

Large brand guideline PDFs (60-100+ pages) are processed in chunks to avoid context window limits.

**Configuration (workflow.yaml):**
```yaml
pdf_chunk_size: 1  # One page at a time for optimal context management
brand_knowledge_file: "{config_path}/brand-knowledge.json"
```

**Chunk Processing Behavior:**
- Each page is processed individually
- 10-page PDF → 10 chunks (page 1, page 2, ... page 10)
- Extract findings from each page, discard raw content, move to next

**Context Management Strategy (to avoid API limits):**
- Extract findings immediately, discard raw image data
- Process → Extract → Summarize → Move on (don't accumulate raw content)
- Only the structured findings are kept in context, not the source images

**Image Pre-Check Pattern:**
1. Probe page metadata first (no text, no images loaded)
2. Check image dimensions from metadata
3. If all images ≤ 2000px → load with images
4. If any image > 2000px → load text-only (skip images for that page)
5. Fallback: if load still fails, retry text-only

This avoids the API 400 error: "image dimensions exceed max allowed size for many-image requests: 2000 pixels"

**Batch Checkpointing (to avoid "Input is too long" error):**
- Every 10 pages, save findings to a checkpoint file
- Reset batch findings to clear conversation context
- Checkpoint files: `.slide-builder/config/brand-extraction-temp/batch-N.json`
- At end: merge all batches into final `brand-knowledge.json`
- Clean up temp files after merge

```
Page 1-10:   → batch-1.json (checkpoint, clear context)
Page 11-20:  → batch-2.json (checkpoint, clear context)
Page 21-30:  → batch-3.json (checkpoint, clear context)
...
Final:       → Merge all batches → brand-knowledge.json
```

**Progress Output Format:**
```
📄 Processing pages X-Y of Z...
```

**Status Tracking (status.yaml):**
```yaml
pdf_chunking:
  current_pdf: "/path/to/brand-guidelines.pdf"
  total_pages: 87
  chunk_size: 3
  total_chunks: 29
  current_chunk: 15
  status: "in-progress"  # in-progress | complete
```

### Chunk Results Storage

Chunk results are stored in `{{pdf_chunk_results}}` array for subsequent brand knowledge extraction:

```yaml
pdf_chunk_results:
  - pdf_path: "/path/to/brand-guidelines.pdf"
    chunk_number: 1
    total_chunks: 29
    page_range: "1-3"
    start_page: 1
    end_page: 3
    content: "[extracted text and image descriptions]"
  - pdf_path: "/path/to/brand-guidelines.pdf"
    chunk_number: 2
    # ...
```

### Brand Knowledge Schema (brand-knowledge.json)

The brand knowledge file stores comprehensive brand guidelines extracted from PDFs.

**Location:** `.slide-builder/config/brand-knowledge.json`

**Schema:**
```json
{
  "meta": {
    "version": "1.0",
    "extracted_from": ["brand-guidelines.pdf"],
    "extracted_at": "2026-01-30T10:30:00Z",
    "page_count": 87,
    "chunks_processed": 29
  },
  "colors": {
    "palette": {
      "primary": { "hex": "#2563EB", "usage": "Primary brand color description" },
      "secondary": { "hex": "#1E40AF", "usage": "Supporting elements" },
      "accent": { "hex": "#F59E0B", "usage": "Highlights, attention grabbers" }
    },
    "rules": ["Usage rules from brand guidelines"],
    "restrictions": ["What to avoid with colors"]
  },
  "typography": {
    "hierarchy": {
      "h1": { "font": "Inter", "weight": 700, "usage": "Slide titles only" },
      "h2": { "font": "Inter", "weight": 600, "usage": "Section headers" },
      "body": { "font": "Inter", "weight": 400, "usage": "All body text" }
    },
    "rules": ["Typography usage guidelines"],
    "restrictions": ["Typography restrictions"]
  },
  "spacing": {
    "principles": ["Spacing philosophy from guidelines"],
    "rules": ["Specific spacing rules"]
  },
  "tone_of_voice": {
    "personality": ["confident", "approachable", "expert"],
    "guidelines": ["Writing style guidance"],
    "examples": {
      "do": ["Good examples"],
      "dont": ["Bad examples"]
    }
  },
  "imagery": {
    "photo_style": ["Photo guidelines"],
    "illustration_style": ["Illustration guidelines"],
    "restrictions": ["Imagery restrictions"]
  },
  "logo": {
    "usage": ["Logo placement rules"],
    "restrictions": ["Logo restrictions"]
  },
  "layouts": {
    "principles": ["Layout philosophy"],
    "patterns": {
      "title_slides": "Layout guidance for titles",
      "content_slides": "Layout guidance for content"
    }
  },
  "dos_and_donts": {
    "do": ["General do's"],
    "dont": ["General don'ts"]
  }
}
```

### MCP Tool Integration

PDF reading uses the `mcp__pdf-reader__read_pdf` MCP tool:

```
ToolSearch query: "pdf"
→ Returns: mcp__pdf-reader__read_pdf

Tool call for page count:
  mcp__pdf-reader__read_pdf({
    file_path: "/path/to/file.pdf",
    include_page_count: true,
    pages: "1"  // Minimal read for metadata
  })

Tool call for chunk reading:
  mcp__pdf-reader__read_pdf({
    file_path: "/path/to/file.pdf",
    include_full_text: true,
    include_images: true,
    pages: "1-3"  // Page range string
  })
```

**Page Range Formats:**
- Single page: `"5"` or `[5]`
- Range: `"1-3"` or `[1, 2, 3]`
- Mixed: `"1,3,5-7"`
