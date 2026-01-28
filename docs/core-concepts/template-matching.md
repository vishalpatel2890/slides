# Template matching

How slide descriptions map to catalog templates.

## Matching algorithm

1. **Keyword extraction**: Identify significant words from description
2. **Use case comparison**: Match against template use_cases
3. **Score calculation**: Count matching keywords per template
4. **Selection**: Choose highest-scoring template
5. **Fallback**: Generate custom if no match above threshold

## Example matching

**User description**:
```
Create a slide comparing our pricing with competitors
```

**Extracted keywords**: comparing, pricing, competitors

**Template scores**:
| Template | Use cases | Matches | Score |
|----------|-----------|---------|-------|
| comparison | comparison, versus, before-after | comparing | 1 |
| callout | statistic, quote, highlight | - | 0 |
| agenda | agenda, list, overview | - | 0 |

**Selected**: comparison (highest score)

## Use case keywords

Effective use_cases include:
- Primary intent verbs
- Content type nouns
- Synonym variations

```json
{
  "use_cases": [
    "comparison",    // Primary intent
    "versus",        // Synonym
    "before-after",  // Variation
    "side-by-side",  // Alternative
    "columns"        // Structure
  ]
}
```

## Match threshold

Templates need minimum score to match:
- Score ≥ 1: Template selected
- Score = 0: Custom generation

## Boosting matches

Mention template explicitly for guaranteed match:
```
Use the process-flow template for onboarding steps.
```

## Custom generation fallback

When no template matches:
1. Frontend-design skill invoked
2. Custom HTML/CSS generated
3. Theme variables applied
4. One-off slide created (not cataloged)

## Adding keywords

Improve matching by updating `catalog.json`:

```json
{
  "id": "process-flow",
  "use_cases": [
    "flow", "process", "steps", "timeline",
    "roadmap", "journey", "phases", "stages"
  ]
}
```

## Related

- [Catalog system](catalog.md)
- [Templates](templates.md)
- [How-to: Use templates](../how-to/use-templates.md)
