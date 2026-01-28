# Plan a deck

Create a comprehensive plan for a multi-slide presentation.

## Prerequisites

A configured theme.

## Steps

1. Run the deck planning workflow:
   ```
   /sb:plan-deck
   ```

2. Provide presentation context:
   ```
   Topic: Q4 Product Roadmap
   Audience: Executive leadership
   Goal: Secure budget approval
   Key points: Achievements, roadmap, resource needs
   ```

3. Review the generated plan:
   - Deck metadata
   - Narrative structure
   - Slide-by-slide breakdown

4. Request adjustments if needed:
   - "Add a competitive analysis slide"
   - "Move timeline earlier"
   - "Remove the technical details slide"

5. Confirm the plan

## Plan structure

Generated plans include:

```yaml
name: "Q4 Product Roadmap"
slug: "q4-product-roadmap"
audience: "Executive leadership"
goal: "Secure budget approval"

slides:
  - number: 1
    template: title
    intent: "Opening with roadmap vision"

  - number: 2
    template: agenda
    intent: "Set discussion expectations"
```

## Plan file location

Plans save to:
- Deck mode: `output/{deck-slug}/plan.yaml`
- Single mode: `output/singles/plan.yaml`

## After planning

Build slides from the plan:
```
/sb:build-one    # One at a time
/sb:build-all    # All at once
```

## Related

- [Build slides from a plan](build-slides.md)
- [Create a single slide](create-single-slide.md)
