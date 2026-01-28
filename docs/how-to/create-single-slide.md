# Create a single slide

Build one slide quickly for immediate needs.

## Prerequisites

A configured theme.

## Steps

1. Plan the slide:
   ```
   /sb:plan-one
   ```

2. Describe what you need:
   ```
   A comparison slide showing current state vs future state.
   Current: Manual processes, siloed data.
   Future: Automated workflows, unified platform.
   ```

3. Review the plan and template match

4. Build the slide:
   ```
   /sb:build-one
   ```

5. View the result:
   ```bash
   open output/singles/slide.html
   ```

6. Edit text directly in the browser

7. For layout changes:
   ```
   /sb:edit
   ```

## Output location

Single slides save to:
```
output/singles/
├── plan.yaml
└── slide.html
```

## Template matching

Descriptions match to templates via keywords:

| Intent | Matched template |
|--------|-----------------|
| "title", "opening" | Title slide |
| "agenda", "list" | Agenda template |
| "comparison", "versus" | Comparison template |
| "process", "steps" | Process flow |
| "statistic", "highlight" | Callout template |
| "code", "technical" | Technical template |

For unmatched descriptions, a custom layout generates.

## Related

- [Plan a deck](plan-deck.md)
- [Edit slides](edit-slides.md)
