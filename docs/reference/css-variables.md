# CSS variables

Theme values map to CSS custom properties for use in templates and slides.

## Color variables

| Variable | Theme path | Example |
|----------|------------|---------|
| `--color-primary` | colors.primary | #d4e94c |
| `--color-secondary` | colors.secondary | #4ecdc4 |
| `--color-accent` | colors.accent | #FF6B6B |
| `--color-background` | colors.background.default | #0a0a0a |
| `--color-background-alt` | colors.background.alt | #1a1a1a |
| `--color-text-heading` | colors.text.heading | #ffffff |
| `--color-text-body` | colors.text.body | #f5f5f5 |
| `--color-text-muted` | colors.text.muted | #888888 |

## Typography variables

| Variable | Theme path | Example |
|----------|------------|---------|
| `--font-heading` | typography.fonts.heading | 'Outfit', sans-serif |
| `--font-body` | typography.fonts.body | 'Outfit', sans-serif |
| `--font-mono` | typography.fonts.mono | 'JetBrains Mono', monospace |
| `--scale-hero` | typography.scale.hero | 80px |
| `--scale-h1` | typography.scale.h1 | 56px |
| `--scale-h2` | typography.scale.h2 | 40px |
| `--scale-h3` | typography.scale.h3 | 32px |
| `--scale-body` | typography.scale.body | 20px |
| `--scale-caption` | typography.scale.caption | 16px |
| `--weight-light` | typography.weights.light | 300 |
| `--weight-regular` | typography.weights.regular | 400 |
| `--weight-semibold` | typography.weights.semibold | 600 |
| `--weight-bold` | typography.weights.bold | 700 |

## Shape variables

| Variable | Theme path | Example |
|----------|------------|---------|
| `--radius-none` | shapes.borderRadius.none | 0px |
| `--radius-small` | shapes.borderRadius.small | 2px |
| `--radius-medium` | shapes.borderRadius.medium | 8px |
| `--radius-large` | shapes.borderRadius.large | 16px |
| `--radius-full` | shapes.borderRadius.full | 9999px |
| `--shadow-small` | shapes.shadow.small | 0 2px 4px rgba(0,0,0,0.1) |
| `--shadow-medium` | shapes.shadow.medium | 0 4px 8px rgba(0,0,0,0.15) |
| `--shadow-large` | shapes.shadow.large | 0 8px 24px rgba(0,0,0,0.2) |

## Data visualization variables

| Variable | Theme path | Example |
|----------|------------|---------|
| `--dataviz-1` | colors.dataViz.palette[0] | #d4e94c |
| `--dataviz-2` | colors.dataViz.palette[1] | #4ecdc4 |
| `--dataviz-3` | colors.dataViz.palette[2] | #FF6B6B |
| `--dataviz-positive` | colors.dataViz.positive | #4ecdc4 |
| `--dataviz-negative` | colors.dataViz.negative | #FF6B6B |

## Usage in templates

```css
/* Headings */
h1 {
  font-family: var(--font-heading);
  font-size: var(--scale-h1);
  font-weight: var(--weight-bold);
  color: var(--color-text-heading);
}

/* Body text */
p {
  font-family: var(--font-body);
  font-size: var(--scale-body);
  font-weight: var(--weight-regular);
  color: var(--color-text-body);
}

/* Containers */
.card {
  background: var(--color-background-alt);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-medium);
}

/* Buttons */
.button-primary {
  background: var(--color-primary);
  color: var(--color-background);
  border-radius: var(--radius-small);
}
```

## Variable injection

Variables inject at generation time:

```html
<style>
  :root {
    --color-primary: #d4e94c;
    --color-secondary: #4ecdc4;
    /* ... all variables from theme.json */
  }
</style>
```
