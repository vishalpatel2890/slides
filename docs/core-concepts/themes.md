# Themes

The theme system provides brand consistency across all generated slides.

## Theme structure

A complete theme (`theme.json`) includes:

### Colors

```json
{
  "colors": {
    "primary": "#d4e94c",
    "secondary": "#4ecdc4",
    "accent": "#FF6B6B",
    "background": {
      "default": "#0a0a0a",
      "alt": "#1a1a1a"
    },
    "text": {
      "heading": "#ffffff",
      "body": "#f5f5f5",
      "muted": "#888888"
    },
    "dataViz": {
      "palette": ["#d4e94c", "#4ecdc4", "#FF6B6B"],
      "positive": "#4ecdc4",
      "negative": "#FF6B6B"
    }
  }
}
```

### Typography

```json
{
  "typography": {
    "fonts": {
      "heading": "'Outfit', sans-serif",
      "body": "'Outfit', sans-serif",
      "mono": "'JetBrains Mono', monospace"
    },
    "scale": {
      "hero": "80px",
      "h1": "56px",
      "h2": "40px",
      "h3": "32px",
      "body": "20px",
      "caption": "16px"
    },
    "weights": {
      "light": 300,
      "regular": 400,
      "semibold": 600,
      "bold": 700
    }
  }
}
```

### Shapes

```json
{
  "shapes": {
    "borderRadius": {
      "none": "0px",
      "small": "2px",
      "medium": "8px",
      "large": "16px"
    },
    "shadow": {
      "small": "0 2px 4px rgba(0,0,0,0.1)",
      "medium": "0 4px 8px rgba(0,0,0,0.15)",
      "large": "0 8px 24px rgba(0,0,0,0.2)"
    }
  }
}
```

### Personality

```json
{
  "personality": {
    "classification": "bold",
    "traits": ["innovative", "confident", "clear"],
    "guidance": {
      "do": ["Use strong contrast", "Bold headlines"],
      "dont": ["Avoid pastels", "Skip decorative elements"]
    }
  }
}
```

## CSS variable mapping

Theme values map to CSS variables in generated slides:

```css
:root {
  --color-primary: #d4e94c;
  --color-secondary: #4ecdc4;
  --color-background: #0a0a0a;
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Outfit', sans-serif;
  /* ... */
}
```

## Theme application

When slides generate:
1. Template HTML loads
2. CSS variables inject from theme
3. Components render with theme values
4. Output maintains brand consistency

## Version management

Themes version with snapshots:
```
.slide-builder/config/
├── theme.json              # Current version
└── theme-history/
    ├── theme-v1-2026-01-15.json
    └── theme-v2-2026-01-28.json
```

## Personality classifications

| Classification | Characteristics |
|----------------|-----------------|
| Bold | High contrast, strong typography, confident |
| Minimal | Clean lines, lots of white space, simple |
| Playful | Bright colors, rounded shapes, energetic |
| Corporate | Professional, structured, conservative |

## Related

- [How-to: Set up a theme](../how-to/setup-theme.md)
- [How-to: Edit a theme](../how-to/edit-theme.md)
- [Reference: Theme schema](../reference/theme-schema.md)
