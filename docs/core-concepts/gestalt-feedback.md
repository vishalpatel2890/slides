# Gestalt feedback

High-level feedback interpretation for theme and slide adjustments.

## What is gestalt feedback?

Gestalt feedback uses holistic, impression-based descriptions rather than specific values:

**Gestalt (preferred)**:
- "Feels too corporate"
- "Colors are too muted"
- "Typography should be bolder"

**Specific (also works)**:
- "Change primary to #FF0000"
- "Use 24px font size"

## Why gestalt works

The system interprets high-level feedback into specific adjustments:
- Users don't need design expertise
- Natural language feels intuitive
- Multiple properties adjust coherently

## Feedback interpretation

### Color feedback

| Input | Interpretation |
|-------|----------------|
| "Warmer" | Shift toward red/orange |
| "Colder" | Shift toward blue |
| "More contrast" | Increase difference between colors |
| "More muted" | Reduce saturation |
| "Brighter" | Increase lightness |
| "Darker" | Decrease lightness |

### Typography feedback

| Input | Interpretation |
|-------|----------------|
| "Bolder" | Increase font weights |
| "Lighter" | Decrease font weights |
| "More modern" | Sans-serif, clean lines |
| "More traditional" | Serif, classic styling |
| "Bigger headings" | Scale up heading sizes |

### Personality feedback

| Input | Interpretation |
|-------|----------------|
| "Too corporate" | Add warmth, soften edges |
| "Too playful" | Add structure, mute colors |
| "More professional" | Corporate traits |
| "More energetic" | Bold traits, high contrast |
| "Cleaner" | Minimal traits, whitespace |

## Feedback contexts

Gestalt feedback applies in:

**Theme setup** (`/sb:setup`):
- Adjust extracted theme
- Iterate on sample slides

**Theme editing** (`/sb:theme-edit`):
- Modify existing theme
- Refine after initial setup

**Slide editing** (`/sb:edit`):
- Adjust slide layouts
- Modify visual presentation

## Effective feedback patterns

**Be descriptive**:
- "The colors feel too cold and clinical"
- "Headings don't stand out enough"

**Reference context**:
- "More like our website"
- "Similar to the comparison slide"

**State preferences**:
- "I prefer the previous version"
- "Somewhere between bold and minimal"

## Related

- [How-to: Edit a theme](../how-to/edit-theme.md)
- [Themes](themes.md)
