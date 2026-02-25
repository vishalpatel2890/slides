# Plan schema

<context>
This document defines the canonical YAML schema for Slide Builder deck and slide plans. Use this as the authoritative reference when creating, validating, or reading plan files.

Audience: AI agents (plan-deck, plan-one, build workflows) and developers extending Slide Builder.
</context>

<success_criteria>
A valid plan file:
1. Contains all required fields with correct types
2. Has at least 1 slide (for decks) with all required slide fields
3. Uses ISO 8601 timestamps for created/last_modified
4. Links slides to valid agenda sections via agenda_section_id
5. May use legacy field names (intent, template, visual_guidance) - see Backward Compatibility
</success_criteria>

---

## Critical Requirements

<critical>
Validate ALL of these before accepting a plan file as valid.
</critical>

| # | Requirement | Validation Rule |
|---|-------------|-----------------|
| 1 | Timestamps | created and last_modified must be ISO 8601 format |
| 2 | Minimum slides | Full deck: minimum 1 slide; Single slide: exactly 1 slide |
| 3 | Sequential numbering | Slide numbers must be 1-indexed and sequential (1, 2, 3...) |
| 4 | Required arrays | audience.priorities and key_points must have at least 1 item |
| 5 | One-line descriptions | description field must be single-line (no newlines) |
| 6 | Multi-line design plans | design_plan must be multi-line with layout/typography/color/spacing/animation |
| 7 | Valid enums | knowledge_level, status, storyline_role must use exact values from schema |
| 8 | Agenda linking | Every slide's agenda_section_id must reference an existing agenda section |

---

## Full Deck Plan Schema

<example title="Full deck plan structure">
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
</example>

<important>
The slides array is required and must contain at least 1 slide for a valid deck plan.
</important>

---

## Single Slide Plan Schema

<example title="Single slide plan structure">
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
</example>

<important>
Single slide plans have a simpler structure with fewer required fields than full deck plans.
</important>

---

## Required Fields Reference

<reference title="Deck-level required fields">
| Field Path | Type | Format/Options | Example |
|------------|------|----------------|---------|
| deck_name | string | Any non-empty string | "Product Launch" |
| created | string | ISO 8601 timestamp | "2026-02-16T10:00:00Z" |
| last_modified | string | ISO 8601 timestamp | "2026-02-16T10:00:00Z" |
| audience.description | string | Who will view this | "Sales team" |
| audience.knowledge_level | enum | beginner \| intermediate \| expert | "intermediate" |
| audience.priorities | string[] | Min 1 item | ["Revenue impact"] |
| purpose | string | Presentation objective | "Enable team to sell" |
| desired_outcome | string | What should happen after | "Team confident pitching" |
| key_message | string | Core takeaway | "ProductX is the future" |
| slides | array | Min 1 slide | See Slide Fields |
</reference>

<reference title="Slide-level required fields">
| Field | Type | Format/Options | Validation |
|-------|------|----------------|------------|
| number | integer | 1-indexed | Sequential: 1, 2, 3... |
| description | string | One-line title | No newlines |
| suggested_template | string | Template ID | Must exist in catalog |
| status | enum | pending \| built | Exact match |
| storyline_role | enum | opening \| tension \| evidence \| resolution \| cta | Exact match |
| agenda_section_id | string | Links to agenda section | Must reference existing section |
| key_points | string[] | Talking points | Min 1 item |
| design_plan | string | Multi-line design notes | Must include: layout, typography, color, spacing, animation |
</reference>

<reference title="Optional slide fields">
| Field | Type | Options | Default |
|-------|------|---------|---------|
| background_mode | enum | dark \| light | (none) |
| tone | enum | professional \| bold \| warm \| technical \| urgent | (none) |
</reference>

---

## Backward Compatibility

<important>
Legacy plans may use older field names. Accept both legacy and current names, but always normalize to current names before saving.
</important>

<reference title="Legacy field mappings">
| Legacy Field | Current Field | Usage |
|--------------|---------------|-------|
| intent | description | Read either, write as description |
| template | suggested_template | Read either, write as suggested_template |
| visual_guidance | design_plan | Read either, write as design_plan |
</reference>

<example title="Legacy plan with old field names">
```yaml
slides:
  - number: 1
    intent: "Title slide"              # Legacy ← maps to description
    template: "title"                  # Legacy ← maps to suggested_template
    visual_guidance: "Bold hero text"  # Legacy ← maps to design_plan
    status: pending
    storyline_role: opening
    agenda_section_id: "agenda-1"
    key_points: ["ProductX launches Q1"]
```

**Action:** Normalize to current field names when loading this plan.
</example>

---

## Validation Guidance

<steps>
When validating a plan file:

1. **Parse YAML** - Ensure file is valid YAML syntax
2. **Check deck-level fields** - Verify all required fields from Deck-level reference table exist
3. **Check timestamps** - Verify created/last_modified are ISO 8601 format
4. **Check audience arrays** - Verify priorities array has at least 1 item
5. **Check slides array** - Verify it exists and has at least 1 slide
6. **For each slide:**
   - Verify all required fields from Slide-level reference table exist
   - Verify number is sequential (1, 2, 3...)
   - Verify description is one-line (no \n or \r)
   - Verify status is exactly "pending" or "built"
   - Verify storyline_role is one of the 5 valid options
   - Verify agenda_section_id references an existing agenda section
   - Verify key_points array has at least 1 item
   - Verify design_plan is multi-line and includes required elements
7. **Normalize legacy fields** - Convert intent→description, template→suggested_template, visual_guidance→design_plan
8. **Report results** - List all validation errors with field paths and expected formats
</steps>

<critical>
Never accept a plan with missing required fields or invalid enum values. Report specific errors and halt processing.
</critical>

---

## Complete Valid Example

<example title="Complete deck plan with 2 slides">
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
</example>

<important>
This example demonstrates:
- All required deck-level fields populated
- Proper ISO 8601 timestamps
- audience.priorities with multiple items
- 2 complete slides with all required fields
- Multi-line design_plan with layout, typography, color, spacing, animation
- background_mode as optional field
- Slides linked to agenda sections via agenda_section_id
</important>

---

## Quick Reference

<reference title="Common validation errors">
| Error | Cause | Fix |
|-------|-------|-----|
| "Missing required field: deck_name" | Top-level field missing | Add deck_name: "Your Title" |
| "Invalid timestamp format" | Not ISO 8601 | Use format: "2026-02-16T10:00:00Z" |
| "knowledge_level must be beginner, intermediate, or expert" | Typo or invalid value | Use exact enum value |
| "Slide 3: description cannot be multi-line" | Newlines in description | Make description single-line |
| "Slide 2: key_points array is empty" | No talking points | Add at least 1 key point |
| "Slide 1: agenda_section_id 'agenda-5' not found" | References non-existent section | Use valid section ID from agenda |
| "Slide numbers not sequential" | Gaps in numbering (1, 2, 4) | Use 1, 2, 3, 4... |
</reference>

<reference title="Field type quick lookup">
| Type | Examples | Notes |
|------|----------|-------|
| string | "Product Launch" | Any text, quoted |
| integer | 1, 2, 3 | Whole numbers, no quotes |
| enum | "beginner" \| "intermediate" \| "expert" | Exact match required, quoted |
| string[] | ["Item 1", "Item 2"] | Array of strings, min 1 |
| ISO 8601 | "2026-02-16T10:00:00Z" | Standard timestamp format |
</reference>
