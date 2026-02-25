# Plan schema

Specification for deck and slide plan YAML files.

## Full deck plan

```yaml
# Metadata
deck_name: "string"            # Required: Human-readable title
created: "string"              # Required: ISO 8601 timestamp
last_modified: "string"        # Required: ISO 8601 timestamp

# Audience context
audience:
  description: "string"        # Required: Who will view this presentation
  knowledge_level: "string"    # Required: beginner | intermediate | expert
  priorities: ["string"]       # Required: What the audience cares about

# Purpose and messaging
purpose: "string"              # Required: Presentation objective
desired_outcome: "string"      # Required: What should happen after
key_message: "string"          # Required: Core takeaway

# Storyline structure
storyline:
  opening_hook: "string"       # Opening attention-grabber
  tension: "string"            # Challenge or pain point
  resolution: "string"         # Proposed approach
  call_to_action: "string"     # Desired next step

recurring_themes: ["string"]   # Themes that recur across slides

# Agenda structure (optional, from plan-deck discovery)
agenda:
  total_sections: integer
  sections:
    - id: "string"             # e.g., "agenda-1"
      title: "string"
      narrative_role: "string" # opening | context | problem | solution | evidence | cta
      estimated_slides: integer
      description: "string"
      discovery:               # Optional: Per-section discovery data
        key_message: "string"
        key_message_framing: "string"  # direct | question | story | data
        content_types: ["string"]
        visual_treatment: {}
        research_findings: ["string"]

# Slide definitions
slides:                        # Required: Array of slides
  - number: integer            # Required: Position (1-indexed)
    description: "string"      # Required: Short one-line title or explainer
    suggested_template: "string" # Required: Template ID from catalog
    status: "string"           # Required: pending | built
    storyline_role: "string"   # Required: opening | tension | evidence | resolution | cta
    agenda_section_id: "string" # Required: Link to parent agenda section
    key_points: ["string"]     # Required: Detailed talking points (min 1)
    design_plan: "string"      # Required: Multiline visual design notes (layout, typography, color, spacing, animation)
    background_mode: "string"  # Optional: dark | light
    tone: "string"             # Optional: professional | bold | warm | technical | urgent
```

## Single slide plan

```yaml
created: "string"              # ISO 8601 timestamp
last_modified: "string"        # ISO 8601 timestamp
description: "string"          # Required: Short one-line title
suggested_template: "string"   # Required: Template ID or "custom"
audience: "string"             # Optional: Who will view this slide
key_points: ["string"]         # Required: Detailed talking points
visual_guidance: "string"      # Optional: Design hints
tone: "string"                 # Optional: professional | bold | warm | technical
```

## Slide fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | integer | Yes | Position in deck (1-indexed) |
| description | string | Yes | Short one-line title or explainer |
| suggested_template | string | Yes | Template ID from catalog |
| status | string | Yes | `pending` or `built` |
| storyline_role | string | Yes | Narrative function of this slide |
| agenda_section_id | string | Yes | Link to parent agenda section |
| key_points | string[] | Yes | Detailed talking points (min 1 item) |
| design_plan | string | Yes | Multiline visual design notes (layout, typography, color, spacing, animation) |
| background_mode | string | No | `dark` or `light` |
| tone | string | No | Voice: professional, bold, warm, technical, urgent |

## Backward compatibility

Legacy plans may use `intent` instead of `description`, `template` instead of `suggested_template`, and `visual_guidance` instead of `design_plan`. The plan editor and build workflows treat these as equivalent:
- `intent` is read as `description`
- `template` is read as `suggested_template`
- `visual_guidance` is read as `design_plan`

New plans should always use the canonical field names.

## Example complete plan

```yaml
deck_name: "Product Launch"
created: "2026-02-16T10:00:00Z"
last_modified: "2026-02-16T10:00:00Z"

audience:
  description: "Sales team"
  knowledge_level: "intermediate"
  priorities:
    - "Revenue impact"
    - "Competitive positioning"

purpose: "Enable team to sell new product"
desired_outcome: "Team confident pitching ProductX"
key_message: "ProductX is the future of customer engagement"

storyline:
  opening_hook: "The future of customer engagement"
  tension: "Current limitations holding back growth"
  resolution: "ProductX capabilities address every gap"
  call_to_action: "Start selling today"

recurring_themes:
  - "Customer-centric innovation"
  - "Measurable results"

slides:
  - number: 1
    status: pending
    storyline_role: "opening"
    agenda_section_id: "agenda-1"
    tone: "bold"
    background_mode: dark
    suggested_template: "title"
    description: "Title slide: ProductX Launch — Sales Enablement"
    design_plan: |
      **Layout:** Full-bleed hero typography, centered. Product tag in top-left.
      **Typography:** Hero title "ProductX Launch" in 72-80px bold.
      Subtitle "The Future of Customer Engagement" in 32px medium weight.
      **Visual Elements:** Subtle gradient accent on key words.
      **Color:** Dark background, white text, brand accent highlights.
      **Spacing:** Generous vertical centering, title in upper-center third.
      **Animation hint:** Title fades in, then subtitle, then tag.
    key_points:
      - "ProductX launches Q1 2026"
      - "3x faster than competitors"
      - "The future of customer engagement"

  - number: 2
    status: pending
    storyline_role: "opening"
    agenda_section_id: "agenda-1"
    tone: "professional"
    background_mode: light
    suggested_template: "agenda"
    description: "Session agenda overview"
    design_plan: |
      **Layout:** Numbered list with section icons, left-aligned.
      **Typography:** Section titles in 28px semibold, descriptions in 20px regular.
      **Visual Elements:** Numbered circles or icons for each section.
      **Color:** Light background, dark text, accent color on active section.
      **Spacing:** Even vertical distribution across sections.
      **Animation hint:** Sections appear sequentially top to bottom.
    key_points:
      - "Product Overview"
      - "Key Features"
      - "Competitive Positioning"
      - "Q&A"
```
