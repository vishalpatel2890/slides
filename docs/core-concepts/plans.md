# Plans

The planning system structures presentations before generation.

## Plan structure

Plans are YAML files defining deck content:

```yaml
name: "Q4 Product Roadmap"
slug: "q4-product-roadmap"
audience: "Executive leadership"
goal: "Secure budget approval"
narrative:
  hook: "Transform how we serve customers"
  problem: "Current limitations"
  solution: "Proposed roadmap"
  evidence: "Success metrics"
  action: "Approval request"

slides:
  - number: 1
    template: title
    intent: "Opening with vision statement"
    content:
      title: "Q4 Product Roadmap"
      subtitle: "Transforming Customer Experience"

  - number: 2
    template: agenda
    intent: "Set discussion expectations"
    content:
      items:
        - "Current State"
        - "Proposed Roadmap"
        - "Resource Requirements"
```

## Deck metadata

| Field | Purpose |
|-------|---------|
| name | Human-readable title |
| slug | URL-safe identifier |
| audience | Target viewers |
| goal | Presentation objective |
| narrative | Story structure |

## Slide entries

Each slide entry includes:

| Field | Purpose |
|-------|---------|
| number | Position in deck |
| template | Template to use |
| intent | Purpose of this slide |
| content | Content specifications |

## Plan locations

| Mode | Location |
|------|----------|
| Deck | `output/{deck-slug}/plan.yaml` |
| Single | `output/singles/plan.yaml` |

## Planning workflows

**Full deck**: `/sb:plan-deck`
- Generates complete deck structure
- Includes narrative arc
- Assigns templates per slide

**Single slide**: `/sb:plan-one`
- Creates minimal plan
- Focuses on one slide
- Direct template matching

## Plan modification

After planning, you can:
- Add slides
- Remove slides
- Reorder slides
- Change templates
- Update content specifications

Confirm changes before building.

## Related

- [How-to: Plan a deck](../how-to/plan-deck.md)
- [Workflows](workflows.md)
