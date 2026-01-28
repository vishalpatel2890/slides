# Modify templates

Edit existing templates in the catalog.

## Prerequisites

Familiarity with HTML/CSS.

## Locate template files

Templates are in:
```
.slide-builder/config/catalog/
├── catalog.json
├── title.html
├── agenda.html
└── [other templates]
```

## Edit template HTML

1. Open the template file:
   ```bash
   code .slide-builder/config/catalog/comparison.html
   ```

2. Modify the HTML structure or CSS

3. Ensure you maintain:
   - 1920x1080 dimensions
   - CSS variable usage
   - contenteditable attributes

4. Save the file

## Update catalog metadata

Edit `catalog.json` to update:
- Template name
- Description
- Use case keywords

```json
{
  "id": "comparison",
  "name": "Comparison",
  "description": "Updated description here",
  "use_cases": ["comparison", "versus", "new-keyword"],
  "file": "comparison.html"
}
```

## Test changes

1. Plan a slide using the template:
   ```
   /sb:plan-one
   Create a comparison slide...
   ```

2. Build and review:
   ```
   /sb:build-one
   ```

## CSS variable reference

Use theme variables for consistency:
```css
color: var(--color-primary);
font-family: var(--font-heading);
background: var(--color-background);
```

See [CSS variables reference](../reference/css-variables.md).

## Related

- [Create a custom template](create-custom-template.md)
- [Reference: Templates](../reference/templates.md)
