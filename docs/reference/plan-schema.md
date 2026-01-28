# Plan schema

Specification for deck and slide plan YAML files.

## Full deck plan

```yaml
# Metadata
name: "string"              # Required: Human-readable title
slug: "string"              # Required: URL-safe identifier
audience: "string"          # Required: Target audience description
goal: "string"              # Required: Presentation objective

# Narrative structure (optional)
narrative:
  hook: "string"            # Opening attention-grabber
  problem: "string"         # Challenge or pain point
  solution: "string"        # Proposed approach
  evidence: "string"        # Supporting proof
  action: "string"          # Call to action

# Slide definitions
slides:                     # Required: Array of slides
  - number: integer         # Required: Position (1-indexed)
    template: "string"      # Required: Template ID or "custom"
    intent: "string"        # Required: Purpose of this slide
    content:                # Optional: Content specifications
      title: "string"
      subtitle: "string"
      items: ["string"]
      # Template-specific fields
```

## Single slide plan

```yaml
template: "string"          # Required: Template ID or "custom"
intent: "string"            # Required: Purpose of slide
content:                    # Optional: Content specifications
  title: "string"
  subtitle: "string"
  # Template-specific fields
```

## Field descriptions

### Metadata fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Display title for deck |
| slug | string | Yes | Directory name (lowercase, hyphenated) |
| audience | string | Yes | Who will view this presentation |
| goal | string | Yes | What the presentation aims to achieve |

### Narrative fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hook | string | No | Opening statement to capture attention |
| problem | string | No | Challenge being addressed |
| solution | string | No | Proposed approach |
| evidence | string | No | Proof points and validation |
| action | string | No | Desired next step from audience |

### Slide fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | integer | Yes | Position in deck (1-indexed) |
| template | string | Yes | Template ID from catalog |
| intent | string | Yes | What this slide accomplishes |
| content | object | No | Content specifications |

## Template-specific content

### title

```yaml
content:
  title: "Main heading"
  subtitle: "Supporting text"
```

### agenda

```yaml
content:
  title: "Agenda"
  items:
    - "First item"
    - "Second item"
```

### comparison

```yaml
content:
  title: "Comparison"
  left:
    heading: "Option A"
    points: ["Point 1", "Point 2"]
  right:
    heading: "Option B"
    points: ["Point 1", "Point 2"]
```

### callout

```yaml
content:
  metric: "23%"
  label: "Revenue growth"
  context: "Year over year"
```

## Example complete plan

```yaml
name: "Product Launch"
slug: "product-launch"
audience: "Sales team"
goal: "Enable team to sell new product"

narrative:
  hook: "The future of customer engagement"
  problem: "Current limitations"
  solution: "New product capabilities"
  evidence: "Beta customer results"
  action: "Start selling today"

slides:
  - number: 1
    template: title
    intent: "Opening impact statement"
    content:
      title: "Introducing ProductX"
      subtitle: "The future of customer engagement"

  - number: 2
    template: agenda
    intent: "Set expectations"
    content:
      title: "Today's Agenda"
      items:
        - "Product Overview"
        - "Key Features"
        - "Competitive Positioning"
        - "Q&A"
```
