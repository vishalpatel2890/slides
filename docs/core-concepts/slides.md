# Slides

Understanding the slide content model and specifications.

## Slide specifications

| Property | Value |
|----------|-------|
| Width | 1920px |
| Height | 1080px |
| Aspect ratio | 16:9 |
| Format | HTML5 |
| Styling | Inline CSS with theme variables |

## Slide structure

Each slide is a self-contained HTML document:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <style>
    /* Theme CSS variables */
    :root {
      --color-primary: #d4e94c;
      --font-heading: 'Outfit', sans-serif;
      /* ... */
    }

    /* Slide styles */
    .slide { width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <div class="slide">
    <!-- Content -->
  </div>
</body>
</html>
```

## Content elements

### Text

Editable text elements:
```html
<h1 contenteditable="true">Heading</h1>
<p contenteditable="true">Paragraph text</p>
```

### Images

Inline or referenced images:
```html
<img src="data:image/png;base64,..." alt="Description">
```

### Code blocks

Syntax-highlighted code:
```html
<pre><code class="language-javascript">
function example() { }
</code></pre>
```

## Slide storage

### Deck mode

```
output/{deck-slug}/slides/
├── slide-1.html
├── slide-2.html
├── slide-3.html
└── manifest.json
```

### Single mode

```
output/singles/
├── plan.yaml
└── slide.html
```

## Manifest format

The `manifest.json` tracks slide metadata:

```json
{
  "deckName": "Presentation Name",
  "generatedAt": "2026-01-28T12:00:00Z",
  "slides": [
    {
      "number": 1,
      "filename": "slide-1.html",
      "title": "Welcome"
    },
    {
      "number": 2,
      "filename": "slide-2.html",
      "title": "Agenda"
    }
  ]
}
```

## Slide rendering

Slides render in:
- **Viewer iframe**: Isolated 1920x1080 viewport
- **Direct browser**: Full-page display
- **Export**: Converted to images for Google Slides

## Related

- [Templates](templates.md)
- [Text preservation](text-preservation.md)
- [Reference: Slide specifications](../reference/slide-specifications.md)
