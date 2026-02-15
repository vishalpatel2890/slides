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

## Transparent Selection Process

Template selection in Slide Builder uses LLM semantic scoring to provide transparent, explainable decisions.

### How It Works

1. **LLM Semantic Scoring**: Every template is evaluated against the slide intent using semantic similarity
2. **Confidence Scoring**: Each template receives a 0-100% confidence score
3. **Reasoning Display**: The system shows why each template was considered
4. **User Override**: After seeing the reasoning, users can choose an alternative

### Selection Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Template Selection for "Show our 3-step onboarding process"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Candidates evaluated:
▶ process-flow: matches "steps", "process" semantically → 92% confidence
  timeline: chronological concept match → 71% confidence
  agenda: list structure match → 45% confidence

✓ Selected: process-flow (92% confidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Confidence Levels

| Level | Range | Behavior |
|-------|-------|----------|
| High | 80-100% | Proceed with selected template |
| Medium | 50-79% | Show alternatives prominently |
| Low | <50% | Strongly suggest custom generation |

### Override Flow

After viewing selection reasoning, users can:

1. **Continue** - Build with the selected template
2. **Select Alternative** - Choose from top-scoring alternatives
3. **Generate Custom** - Create a fully custom slide without template

This transparency ensures users understand decisions and can course-correct when the system's choice doesn't match their intent.

### Benefits

- **Trust**: Understand why a template was chosen
- **Learning**: Improve future prompts based on match reasoning
- **Control**: Override when the system's choice doesn't fit
- **Flexibility**: Always have the option to go custom

## Related

- [Catalog system](catalog.md)
- [Templates](templates.md)
- [How-to: Use templates](../how-to/use-templates.md)
