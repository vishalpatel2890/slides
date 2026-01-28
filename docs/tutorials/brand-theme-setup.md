# Brand theme setup

Extract and configure a complete brand identity system.

## What we will build

A comprehensive brand theme including colors, typography, shapes, and personality traits extracted from brand assets.

## Prerequisites

Prepare at least one of the following:
- Company website URL
- Brand guidelines PDF
- Logo or brand images

## Step 1: Start the setup workflow

```
/sb:setup
```

## Step 2: Provide brand assets

When prompted, provide your assets:

**Website URL** (most effective):
```
https://yourcompany.com
```

**PDF files**:
```
/path/to/brand-guidelines.pdf
```

**Images**:
```
/path/to/logo.png
/path/to/brand-image.jpg
```

You can provide multiple assets. More sources improve extraction accuracy.

## Step 3: Review extracted primitives

The system extracts and displays:

**Colors**:
- Primary color
- Secondary color
- Accent color
- Background colors
- Text colors

**Typography**:
- Heading font family
- Body font family
- Size scale
- Weight variations

**Shapes**:
- Border radius preferences
- Shadow styles
- Border treatments

**Personality**:
- Classification (bold, minimal, playful, corporate)
- Personality traits
- Do/don't guidance

Review each section. Note any discrepancies with your actual brand.

## Step 4: Generate sample slides

The system creates 6 sample slides demonstrating the theme:
1. Title slide
2. Agenda slide
3. Content slide
4. Comparison slide
5. Callout/statistic slide
6. Technical slide

Open the sample deck to evaluate the theme in context.

## Step 5: Provide feedback

Use gestalt-level feedback to adjust the theme:

**Color adjustments**:
- "Primary color should be darker"
- "Add more contrast"
- "Background feels too light"

**Typography adjustments**:
- "Headings should be bolder"
- "Body text needs more spacing"
- "Use a more modern font"

**Personality adjustments**:
- "Too corporate, make it friendlier"
- "More minimal and clean"
- "Add more visual energy"

The system interprets feedback and regenerates the theme and samples.

## Step 6: Iterate until satisfied

Continue the feedback loop:
1. Review samples
2. Provide feedback
3. Review updated samples

Repeat until the theme matches your brand accurately.

## Step 7: Finalize the theme

Confirm to save the final theme. The system:
- Saves `theme.json` to `.slide-builder/config/`
- Creates a version snapshot in `theme-history/`
- Updates status to ready for slide creation

## Understanding theme.json

The generated theme includes:

```json
{
  "name": "Your Brand",
  "version": "1.0",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#...",
    "background": { "default": "#...", "alt": "#..." },
    "text": { "heading": "#...", "body": "#...", "muted": "#..." }
  },
  "typography": {
    "fonts": { "heading": "...", "body": "...", "mono": "..." },
    "scale": { "hero": "80px", "h1": "56px", ... }
  },
  "personality": {
    "classification": "bold|minimal|playful|corporate",
    "traits": ["..."]
  }
}
```

## What we learned

- Extracting brand primitives from assets
- Reviewing and validating theme components
- Using gestalt feedback for adjustments
- Finalizing and versioning themes

## Next steps

- [Theme refinement](theme-refinement.md) for ongoing adjustments
- [How-to: Edit theme](../how-to/edit-theme.md) for specific modifications
- [Core concepts: Themes](../core-concepts/themes.md) for deeper understanding
