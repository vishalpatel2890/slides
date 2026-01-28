# Slide Builder Conventions

This document defines the conventions and patterns used in Slide Builder.

## Command-to-Workflow Mapping

All Slide Builder commands are prefixed with `sb:` to avoid collision with built-in Claude Code commands.

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb:setup` | `.slide-builder/workflows/setup/` | Create brand theme from assets |
| `/sb:theme` | `.slide-builder/workflows/theme/` | Display current theme summary |
| `/sb:theme-edit` | `.slide-builder/workflows/theme-edit/` | Modify existing theme |
| `/sb:plan` | `.slide-builder/workflows/plan/` | Smart router (single or deck) |
| `/sb:plan-one` | `.slide-builder/workflows/plan-one/` | Plan a single slide |
| `/sb:plan-deck` | `.slide-builder/workflows/plan-deck/` | Plan a full deck |
| `/sb:build-one` | `.slide-builder/workflows/build/` | Build next/single slide |
| `/sb:build-all` | `.slide-builder/workflows/build/` | Build all remaining slides |
| `/sb:edit` | `.slide-builder/workflows/edit/` | Edit slide layout |
| `/sb:export` | `.slide-builder/workflows/export/` | Export to Google Slides |
| `/sb:add-template` | `.slide-builder/workflows/add-template/` | Create new template via conversation |

## Workflow Execution Pattern

All workflows follow the BMAD pattern:

1. **Load** `workflow.yaml` from the workflow directory
2. **Read** `instructions.md` for step-by-step execution
3. **Execute** steps in numerical order
4. **Pause** at `<template-output>` and `<ask>` tags for user interaction
5. **Update** `.slide-builder/status.yaml` with progress

## File Structure

```
.slide-builder/
├── config/              # Shareable brand assets (zip to share)
│   ├── theme.json       # Brand theme primitives
│   ├── theme-history/   # Version snapshots
│   └── catalog/         # Template catalog for slide layouts
│       ├── catalog.json # Template manifest with metadata
│       └── *.html       # Template HTML files
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
│   └── add-template/
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

.claude/commands/sb/     # Claude Code skill registrations
├── setup.md
├── theme.md
├── theme-edit.md
├── plan.md
├── plan-one.md
├── plan-deck.md
├── build-one.md
├── build-all.md
├── edit.md
├── export.md
└── add-template.md
```

## Adding New Commands

To add a new command:

1. Create workflow directory: `.slide-builder/workflows/{command-name}/`
2. Add `workflow.yaml` with BMAD schema (name, description, instructions path)
3. Add `instructions.md` with workflow steps
4. Create skill registration: `.claude/commands/sb/{command-name}.md`
5. Update this CONVENTIONS.md with the new mapping

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

- `status.yaml`: Tracks current mode (single/deck), progress, history
- `plan.yaml`: Stores slide plan (single or deck mode)
- State files use ISO 8601 timestamps
- History array captures action trail for debugging/resume

## Template Catalog

The catalog system provides a unified registry of reusable slide templates with rich metadata for agent-driven template selection.

### Catalog Location

```
.slide-builder/config/catalog/
├── catalog.json    # Template manifest
├── title.html      # Template files...
├── agenda.html
└── ...
```

### Catalog Manifest Schema (catalog.json)

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
      "file": "template-slug.html",
      "preview": null,
      "created_at": "ISO-timestamp",
      "source": "setup|add-template"
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
| `file` | string | Filename within catalog directory |
| `preview` | string\|null | Optional thumbnail path (future use) |
| `created_at` | string | ISO 8601 timestamp of creation |
| `source` | string | Origin: "setup" for initial, "add-template" for user-created |

### Template Naming Conventions

- Template IDs use kebab-case slugs (e.g., "process-flow")
- HTML files match ID: `{id}.html`
- No numeric prefixes - manifest provides ordering if needed

## Enhanced Planning Patterns (Story 13.4)

The plan-deck workflow includes an enhanced planning system with agenda structure and deep discovery for each section.

### AskUserQuestion Tool Usage

The AskUserQuestion tool enables structured user input during planning workflows.

**Constraints:**
- Maximum 4 questions per tool call
- Maximum 4 options per question
- User can always select "Other" to provide custom input
- Use `multiSelect: true` for selections where multiple options can apply
- Use `multiSelect: false` for single-choice decisions

**Example (single-select for message framing):**
```json
{
  "questions": [{
    "question": "Which message framing resonates best for 'Opening Hook'?",
    "header": "Message",
    "options": [
      {"label": "Direct", "description": "Statement about audience's current situation"},
      {"label": "Question", "description": "Engage with a thought-provoking question"},
      {"label": "Story", "description": "Open with a relatable scenario"},
      {"label": "Data", "description": "Lead with a surprising statistic"}
    ],
    "multiSelect": false
  }]
}
```

**Example (multi-select for discovery areas):**
```json
{
  "questions": [{
    "question": "Want to define specific visual/content guidance? (Optional)",
    "header": "Discovery",
    "options": [
      {"label": "Diagram Style", "description": "Specify diagram types like flowchart, timeline"},
      {"label": "Visual Metaphor", "description": "Guide imagery theme like journey, growth"},
      {"label": "Deep Research", "description": "Search for statistics, quotes, case studies"}
    ],
    "multiSelect": true
  }]
}
```

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
        diagram_requirements: []
        visual_metaphor: []
        research_findings: []

    - id: "agenda-2"
      title: "The Problem"
      narrative_role: "problem"
      estimated_slides: 2
      description: "Establish pain point and urgency"
      discovery:
        key_message: "Manual slide creation wastes 3+ hours per deck"
        key_message_framing: "data"
        diagram_requirements:
          - "Comparison"
        visual_metaphor:
          - "Transformation"
        research_findings:
          - source: "https://example.com/research"
            content: "87% of professionals cite presentations as time-consuming"
            selected: true
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

  # Optional - user selects which discovery areas to explore
  diagram_requirements:
    - "Flowchart"       # Process flow, steps, decision points
    - "Timeline"        # Chronological sequence, phases
    - "Comparison"      # Side-by-side, before/after
    - "Hierarchy"       # Org chart, tree structure

  visual_metaphor:
    - "Journey"         # Path, roadmap, progression
    - "Growth"          # Seeds, trees, upward arrows
    - "Transformation"  # Before/after, metamorphosis
    - "Technology"      # Modern, digital, abstract tech

  # Optional - web search results selected by user
  research_findings:
    - source: "https://example.com/study"
      content: "67% of executives prefer visual presentations"
      selected: true
```

**Discovery Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key_message` | string | Yes | The core message for slides in this section |
| `key_message_framing` | enum | Yes | How the message is framed (direct/question/story/data) |
| `diagram_requirements` | array | No | Diagram styles to use (null if not selected) |
| `visual_metaphor` | array | No | Visual themes to incorporate (null if not selected) |
| `research_findings` | array | No | Supporting data from web search (empty if skipped) |

### Slide Generation Integration

When building slides, the build-one workflow uses section context to enhance generation:

1. **Read agenda_section_id** from the slide in plan.yaml
2. **Find matching section** in `agenda.sections` array
3. **Extract discovery data** to enrich slide generation:
   - `key_message` → Informs slide title/headline generation
   - `diagram_requirements` → Guides layout and visual structure choice
   - `visual_metaphor` → Influences imagery and iconography suggestions
   - `research_findings` → Provides content to include (statistics, quotes)

**Build-one Phase 1A.5 Flow:**
```
slide.agenda_section_id exists?
    ↓ Yes
Find section in agenda.sections where id == agenda_section_id
    ↓ Found
Extract discovery data:
  - enriched_key_message = section.discovery.key_message
  - enriched_visual_guidance = slide.visual_guidance + diagram hints
  - available_research = section.discovery.research_findings
    ↓
Use enriched context in Phase 3A/3B content generation
```

### Backwards Compatibility

Plans created before Story 13.4 (without agenda section) continue to work:
- Build-one checks for `agenda_section_id` field presence
- If missing or no matching section found, uses original slide context
- No migration required for existing plan.yaml files
