# Slide specifications

Technical specifications for generated slides.

## Dimensions

| Property | Value |
|----------|-------|
| Width | 1920px |
| Height | 1080px |
| Aspect ratio | 16:9 |
| DPI | 96 (web standard) |

## Format

| Property | Value |
|----------|-------|
| Document type | HTML5 |
| Encoding | UTF-8 |
| Styling | Inline CSS |
| Scripts | Inline JavaScript (optional) |

## HTML structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <meta name="slide-number" content="1">
  <meta name="template" content="title">
  <style>
    :root {
      /* CSS variables from theme */
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      position: relative;
    }

    /* Template-specific styles */
  </style>
</head>
<body>
  <div class="slide">
    <!-- Slide content -->
  </div>
</body>
</html>
```

## Content elements

### Text elements

```html
<h1 contenteditable="true" data-field="title">Title</h1>
<h2 contenteditable="true" data-field="subtitle">Subtitle</h2>
<p contenteditable="true" data-field="body">Body text</p>
```

### Lists

```html
<ul contenteditable="true" data-field="bullets">
  <li>Item one</li>
  <li>Item two</li>
</ul>
```

### Code blocks

```html
<pre><code class="language-javascript" data-field="code">
function example() {
  return true;
}
</code></pre>
```

### Images

```html
<img src="data:image/png;base64,..." alt="Description">
```

## Metadata

Slides include metadata in `<meta>` tags:

| Meta name | Purpose | Example |
|-----------|---------|---------|
| slide-number | Position in deck | 1, 2, 3 |
| template | Template used | title, agenda |
| generated-at | Creation timestamp | 2026-01-28T12:00:00Z |

## Font loading

Google Fonts load via link tag:

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
```

## Rendering contexts

| Context | Behavior |
|---------|----------|
| Viewer iframe | Scaled to viewport |
| Direct browser | Full 1920x1080 |
| Print/PDF | Fit to page |
| Export | Rendered to image |

## File naming

| Mode | Pattern |
|------|---------|
| Deck | `slide-{n}.html` |
| Single | `slide.html` |

## Size guidelines

| Component | Recommended |
|-----------|-------------|
| File size | < 500KB |
| Images | Compressed, inline base64 |
| Fonts | Web fonts (not embedded) |
