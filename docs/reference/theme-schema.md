# Theme schema

Complete specification for `theme.json`.

## Root structure

```json
{
  "name": "string",
  "version": "string",
  "colors": { ... },
  "typography": { ... },
  "shapes": { ... },
  "components": { ... },
  "slides": { ... },
  "personality": { ... },
  "meta": { ... }
}
```

## colors

```json
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": {
      "default": "#hex",
      "alt": "#hex"
    },
    "text": {
      "heading": "#hex",
      "body": "#hex",
      "muted": "#hex"
    },
    "dataViz": {
      "palette": ["#hex", "#hex", "#hex"],
      "positive": "#hex",
      "negative": "#hex"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| primary | hex color | Main brand color |
| secondary | hex color | Supporting brand color |
| accent | hex color | Highlight/CTA color |
| background.default | hex color | Main background |
| background.alt | hex color | Alternate background |
| text.heading | hex color | Heading text color |
| text.body | hex color | Body text color |
| text.muted | hex color | Secondary text color |
| dataViz.palette | array | Chart/graph colors |
| dataViz.positive | hex color | Positive indicator |
| dataViz.negative | hex color | Negative indicator |

## typography

```json
{
  "typography": {
    "fonts": {
      "heading": "string",
      "body": "string",
      "mono": "string"
    },
    "scale": {
      "hero": "string",
      "h1": "string",
      "h2": "string",
      "h3": "string",
      "body": "string",
      "caption": "string"
    },
    "weights": {
      "light": number,
      "regular": number,
      "semibold": number,
      "bold": number
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| fonts.heading | CSS font-family | Heading font stack |
| fonts.body | CSS font-family | Body font stack |
| fonts.mono | CSS font-family | Monospace font stack |
| scale.hero | CSS size | Largest display size |
| scale.h1 | CSS size | Primary heading |
| scale.h2 | CSS size | Secondary heading |
| scale.h3 | CSS size | Tertiary heading |
| scale.body | CSS size | Body text |
| scale.caption | CSS size | Small text |
| weights.* | number | Font weight values |

## shapes

```json
{
  "shapes": {
    "borderRadius": {
      "none": "string",
      "small": "string",
      "medium": "string",
      "large": "string",
      "full": "string"
    },
    "shadow": {
      "small": "string",
      "medium": "string",
      "large": "string"
    },
    "border": {
      "thin": "string",
      "medium": "string"
    }
  }
}
```

## components

```json
{
  "components": {
    "box": {
      "default": { "background": "...", "border": "...", "radius": "..." },
      "outlined": { ... },
      "callout": { ... }
    },
    "arrow": {
      "default": { "color": "...", "strokeWidth": "..." }
    },
    "button": {
      "primary": { "background": "...", "color": "...", "radius": "..." },
      "secondary": { ... }
    }
  }
}
```

## slides

```json
{
  "slides": {
    "dimensions": {
      "width": 1920,
      "height": 1080,
      "aspectRatio": "16:9"
    },
    "layouts": {
      "title": { ... },
      "content": { ... },
      "split": { ... },
      "data": { ... }
    }
  }
}
```

## personality

```json
{
  "personality": {
    "classification": "bold|minimal|playful|corporate",
    "traits": ["string", "string"],
    "guidance": {
      "do": ["string"],
      "dont": ["string"]
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| classification | enum | Primary personality type |
| traits | array | Descriptive characteristics |
| guidance.do | array | Recommended approaches |
| guidance.dont | array | Approaches to avoid |

## meta

```json
{
  "meta": {
    "extractedFrom": {
      "website": "string",
      "reference": "string"
    },
    "brandDescription": "string",
    "confidence": number,
    "locked": boolean
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| extractedFrom.website | URL | Source website |
| extractedFrom.reference | string | Other sources |
| brandDescription | string | Brand summary |
| confidence | 0-1 | Extraction confidence |
| locked | boolean | Prevent modifications |
