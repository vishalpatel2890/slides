# Templates

Templates provide reusable slide structures that maintain brand consistency.

## Template architecture

Each template is a self-contained HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .slide {
      width: 1920px;
      height: 1080px;
      background: var(--color-background);
      font-family: var(--font-body);
    }
    /* Component styles using CSS variables */
  </style>
</head>
<body>
  <div class="slide">
    <h1 contenteditable="true">Title</h1>
    <p contenteditable="true">Body content</p>
  </div>
</body>
</html>
```

## Template requirements

### Dimensions

All templates must use:
- Width: 1920px
- Height: 1080px
- Aspect ratio: 16:9

### Theme integration

Templates use CSS variables from the theme:

```css
/* Colors */
var(--color-primary)
var(--color-secondary)
var(--color-background)
var(--color-text-heading)
var(--color-text-body)

/* Typography */
var(--font-heading)
var(--font-body)
var(--font-mono)

/* Shapes */
var(--radius-small)
var(--shadow-medium)
```

### Editable content

Text elements must include `contenteditable`:

```html
<h1 contenteditable="true">Editable title</h1>
```

This enables direct editing in the viewer.

## Built-in templates

| Template | Purpose | Structure |
|----------|---------|-----------|
| title | Opening slides | Hero layout with title/subtitle |
| agenda | Lists and overviews | Numbered or bulleted items |
| process-flow | Sequential steps | Connected boxes with arrows |
| comparison | Side-by-side | Two column layout |
| callout | Key insights | Large statistic or quote |
| technical | Code-focused | Syntax highlighting layout |

## Template storage

Templates live in the catalog:

```
.slide-builder/config/catalog/
├── catalog.json       # Manifest
├── title.html
├── agenda.html
├── process-flow.html
├── comparison.html
├── callout.html
└── technical.html
```

## Custom template generation

When no template matches, the system:
1. Invokes the frontend-design skill
2. Generates custom HTML/CSS
3. Applies theme variables
4. Creates a one-off slide (not cataloged)

## Related

- [Catalog system](catalog.md)
- [How-to: Create a custom template](../how-to/create-custom-template.md)
- [Reference: Templates](../reference/templates.md)
