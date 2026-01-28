# Edit a theme

Modify an existing theme using gestalt feedback.

## Prerequisites

An existing theme in `.slide-builder/config/theme.json`.

## Steps

1. Run the theme edit workflow:
   ```
   /sb:theme-edit
   ```

2. Provide high-level feedback:
   - "Colors feel too corporate"
   - "Typography should be bolder"
   - "Make it more energetic"

3. Review updated theme and samples

4. Continue feedback until satisfied:
   - "Better, but accent needs more pop"
   - "Good direction, increase contrast"

5. Confirm to save changes

## Example feedback patterns

**Colors**:
- "Warmer tones"
- "More contrast"
- "Softer palette"

**Typography**:
- "Bolder headings"
- "Lighter body text"
- "More modern fonts"

**Personality**:
- "Less corporate"
- "More playful"
- "Cleaner and minimal"

## Result

Updated theme saved with version snapshot for rollback.

## Related

- [Roll back a theme](rollback-theme.md)
- [View current theme](../reference/commands.md#sbtheme)
