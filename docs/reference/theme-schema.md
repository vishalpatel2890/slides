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
  "gradients": { ... },
  "workflowRules": { ... },
  "personality": { ... },
  "meta": { ... },
  "brandContext": { ... }
}
```

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| name | string | REQUIRED | Theme display name |
| version | string | REQUIRED | Theme version identifier |
| colors | object | REQUIRED | Color palette definitions |
| typography | object | REQUIRED | Font and text scale definitions |
| shapes | object | REQUIRED | Border radius, shadow, and border definitions |
| components | object | REQUIRED | Component style presets (can be empty `{}`) |
| slides | object | OPTIONAL | Slide dimension and layout definitions |
| gradients | object | OPTIONAL | Named gradient definitions |
| workflowRules | object | OPTIONAL | Workflow-specific generation rules |
| personality | object | OPTIONAL | Brand personality classification and traits |
| meta | object | OPTIONAL | Extraction metadata and lock state |
| brandContext | object | OPTIONAL | Unstructured brand context data (voice, design philosophy, etc.) |

## colors

```json
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": {
      "default": "#hex",
      "alt": "#hex",
      "dark": "#hex",
      "light": "#hex",
      "darkAlt": "#hex"
    },
    "text": {
      "heading": "#hex",
      "body": "#hex",
      "muted": "#hex",
      "onDark": "#hex",
      "onLight": "#hex",
      "onPrimary": "#hex"
    },
    "brand": { ... },
    "dataViz": {
      "palette": ["#hex", "#hex", "#hex"],
      "positive": "#hex",
      "negative": "#hex"
    },
    "semantic": { ... }
  }
}
```

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| primary | hex color | REQUIRED | Main brand color |
| secondary | hex color | REQUIRED | Supporting brand color |
| accent | hex color | REQUIRED | Highlight/CTA color |
| background.default | hex color | REQUIRED | Main background |
| background.alt | hex color | REQUIRED | Alternate background |
| background.dark | hex color | OPTIONAL | Dark background variant |
| background.light | hex color | OPTIONAL | Light background variant |
| background.darkAlt | hex color | OPTIONAL | Alternate dark background |
| text.heading | hex color | REQUIRED | Heading text color |
| text.body | hex color | REQUIRED | Body text color |
| text.muted | hex color | OPTIONAL | Secondary text color |
| text.onDark | hex color | OPTIONAL | Text color for dark backgrounds |
| text.onLight | hex color | OPTIONAL | Text color for light backgrounds |
| text.onPrimary | hex color | OPTIONAL | Text color on primary background |
| brand | object | OPTIONAL | Additional brand color tokens |
| dataViz | object | OPTIONAL | Chart and graph colors |
| dataViz.palette | array | OPTIONAL | Chart/graph color palette |
| dataViz.positive | hex color | OPTIONAL | Positive indicator |
| dataViz.negative | hex color | OPTIONAL | Negative indicator |
| semantic | object | OPTIONAL | Semantic color tokens (success, warning, error, info) |

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
    },
    "lineHeight": {
      "tight": number,
      "normal": number,
      "relaxed": number
    }
  }
}
```

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| fonts.heading | CSS font-family | REQUIRED | Heading font stack |
| fonts.body | CSS font-family | REQUIRED | Body font stack |
| fonts.mono | CSS font-family | OPTIONAL | Monospace font stack |
| scale.* | CSS size | REQUIRED (at least one entry) | Font size scale entries |
| scale.hero | CSS size | REQUIRED | Largest display size |
| scale.h1 | CSS size | REQUIRED | Primary heading |
| scale.h2 | CSS size | REQUIRED | Secondary heading |
| scale.h3 | CSS size | REQUIRED | Tertiary heading |
| scale.body | CSS size | REQUIRED | Body text |
| scale.caption | CSS size | REQUIRED | Small text |
| weights.* | number | REQUIRED (at least one entry) | Font weight values |
| lineHeight | object | OPTIONAL | Line height scale |

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

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| borderRadius | object | REQUIRED (at least one entry) | Border radius scale |
| borderRadius.none | string | OPTIONAL | No rounding (typically "0") |
| borderRadius.small | string | OPTIONAL | Small rounding |
| borderRadius.medium | string | OPTIONAL | Medium rounding |
| borderRadius.large | string | OPTIONAL | Large rounding |
| borderRadius.full | string | OPTIONAL | Full rounding (circle/pill) |
| shadow | object | REQUIRED (at least one entry) | Box shadow scale |
| shadow.small | string | OPTIONAL | Subtle shadow |
| shadow.medium | string | OPTIONAL | Medium shadow |
| shadow.large | string | OPTIONAL | Prominent shadow |
| border | object | REQUIRED (at least one entry) | Border style scale |
| border.thin | string | OPTIONAL | Thin border |
| border.medium | string | OPTIONAL | Medium border |

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

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| components | object | REQUIRED (can be empty `{}`) | Component style presets |
| box | object | OPTIONAL | Box/container component styles |
| arrow | object | OPTIONAL | Arrow/connector component styles |
| icon | object | OPTIONAL | Icon component styles |
| button | object | OPTIONAL | Button component styles |

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

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| slides | object | OPTIONAL | Slide configuration |
| dimensions | object | OPTIONAL | Slide dimensions |
| dimensions.width | number | OPTIONAL | Slide width in pixels |
| dimensions.height | number | OPTIONAL | Slide height in pixels |
| dimensions.aspectRatio | string | OPTIONAL | Display aspect ratio |
| layouts | object | OPTIONAL | Named layout definitions |

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

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| personality | object | OPTIONAL | Brand personality profile |
| classification | enum | OPTIONAL | Primary personality type |
| traits | array | OPTIONAL | Descriptive characteristics |
| guidance.do | array | OPTIONAL | Recommended approaches |
| guidance.dont | array | OPTIONAL | Approaches to avoid |

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
    "locked": boolean,
    "changeNotes": ["string"]
  }
}
```

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| meta | object | OPTIONAL | Theme extraction metadata |
| extractedFrom.website | URL | OPTIONAL | Source website |
| extractedFrom.reference | string | OPTIONAL | Other sources |
| brandDescription | string | OPTIONAL | Brand summary |
| confidence | 0-1 | OPTIONAL | Extraction confidence |
| locked | boolean | OPTIONAL | Prevent modifications |
| changeNotes | array | OPTIONAL | History of changes to the theme |

## brandContext

The `brandContext` field stores unstructured brand context data that informs AI-driven slide generation and theme usage. It is an open-ended object -- any keys and value types are allowed.

```json
{
  "brandContext": {
    "voice": "string",
    "designPhilosophy": "string",
    "colorUsage": "string or object",
    "typographyNotes": "string",
    "customInstructions": "string or array"
  }
}
```

| Field | Type | Required/Optional | Description |
|-------|------|-------------------|-------------|
| brandContext | object | OPTIONAL | Unstructured brand context data |
| voice | string | OPTIONAL | Brand voice and tone description (e.g., "Professional but approachable") |
| designPhilosophy | string | OPTIONAL | Core design principles and visual approach |
| colorUsage | string or object | OPTIONAL | Guidelines for when and how to use specific brand colors |
| typographyNotes | string | OPTIONAL | Notes on typography choices, pairing rationale, and usage guidelines |
| customInstructions | string or array | OPTIONAL | Additional AI instructions for brand-aware slide generation |

### Example

```json
{
  "brandContext": {
    "voice": "Professional but approachable. Use active voice and concise sentences. Avoid jargon unless addressing a technical audience.",
    "designPhilosophy": "Clean, modern minimalism with strategic use of brand color as accent. Prioritize whitespace and visual hierarchy over decoration. Every element should earn its place on the slide.",
    "colorUsage": "Use primary blue (#1E40AF) for headlines and key call-to-action elements only. Secondary teal (#0D9488) for supporting data and chart accents. Never use both as adjacent blocks -- maintain contrast with neutral backgrounds.",
    "typographyNotes": "Inter for headings provides a modern, geometric feel. Source Sans Pro for body text ensures readability at smaller sizes. Avoid using more than two font weights per slide to maintain visual consistency.",
    "customInstructions": [
      "Always include the company tagline on title slides",
      "Data slides should lead with the key insight as the headline",
      "Limit bullet points to 4 per slide maximum",
      "Use the brand gradient only on section divider slides"
    ]
  }
}
```

### Notes

- **Unstructured data:** The `brandContext` object accepts any keys and value types. The fields documented above (voice, designPhilosophy, colorUsage, typographyNotes, customInstructions) are common conventions but are not enforced by the schema. Custom keys are fully supported.
- **How brandContext is populated:** Brand context data is typically generated during the brand setup workflow, where brand assets, guidelines, and user input are analyzed to produce structured context. It can also be manually authored or edited in the theme.json file.
- **How brandContext is consumed:** The `BrandContextSection` renderer in the theme editor (story BT-4.7) provides a visual editor for viewing and modifying brand context. Slide generation workflows use brand context fields to produce brand-aware slide content, ensuring consistent voice, color usage, and design alignment across generated presentations.
