# Theme refinement

Iterate on existing themes with gestalt feedback.

## When to refine themes

- Initial theme needs adjustment
- Brand guidelines updated
- Client feedback received
- Presentation context changes

## Prerequisites

An existing theme in `.slide-builder/config/theme.json`.

## Step 1: Review current theme

```
/sb:theme
```

See current configuration:
- Colors and palette
- Typography settings
- Shape treatments
- Personality classification

## Step 2: Start the edit workflow

```
/sb:theme-edit
```

## Step 3: Provide gestalt feedback

Use high-level descriptions rather than specific values:

**Color feedback**:
- "Feels too cold, add warmth"
- "Primary color is too bright"
- "Need more contrast"
- "Accent color should pop more"

**Typography feedback**:
- "Headings feel weak"
- "Body text is too dense"
- "More modern typography"
- "Professional but approachable"

**Personality feedback**:
- "Too corporate, friendlier tone"
- "More bold and confident"
- "Cleaner and more minimal"
- "Add energy and dynamism"

## Step 4: Review changes

The system:
1. Interprets your feedback
2. Adjusts theme properties
3. Regenerates sample slides
4. Shows before/after comparison

## Step 5: Iterate or accept

Continue feedback loop:
- "Better, but still too muted"
- "Colors are good, adjust typography"

Or accept changes:
- "Looks good, save this version"

## Step 6: Version management

Changes create a new version snapshot in `theme-history/`:
```
theme-v2-2026-01-28.json
```

Previous versions remain available for rollback.

## Feedback interpretation

The system maps gestalt feedback to specific adjustments:

| Feedback | Adjustments |
|----------|-------------|
| "Warmer" | Shifts colors toward red/orange |
| "Colder" | Shifts colors toward blue |
| "Bolder" | Increases font weights, contrast |
| "Minimal" | Reduces shadows, simplifies shapes |
| "Professional" | Corporate personality traits |
| "Friendly" | Approachable personality traits |

## What we learned

- Using gestalt feedback for theme adjustments
- Iterating through the feedback loop
- Managing theme versions

## Next steps

- [Core concepts: Themes](../core-concepts/themes.md) for theme structure
- [Reference: Theme schema](../reference/theme-schema.md) for specifications
- [How-to: Roll back themes](../how-to/rollback-theme.md)
