# Text preservation

User text edits persist through layout regenerations.

## The problem

When editing slide layouts, regenerating HTML would lose user text changes:

1. User generates slide with "Title Here"
2. User edits title to "Q4 Revenue Report"
3. User requests layout change: "Add more spacing"
4. Without preservation: Title resets to "Title Here"

## The solution

Slide Builder separates content from layout:

1. **Capture**: Extract current text from contenteditable elements
2. **Regenerate**: Create new layout with placeholder content
3. **Reapply**: Replace placeholders with captured text

## How it works

### Text capture

Before regeneration, the system extracts:
```json
{
  "h1": "Q4 Revenue Report",
  "subtitle": "Performance Analysis",
  "bullet-1": "Revenue grew 23%"
}
```

### Layout regeneration

New layout generates with markers:
```html
<h1 contenteditable="true" data-field="h1">Title</h1>
```

### Text reapplication

Captured content replaces placeholders:
```html
<h1 contenteditable="true" data-field="h1">Q4 Revenue Report</h1>
```

## Element identification

Elements identify via:
- `data-field` attributes
- Element type and position
- Semantic role in layout

## State storage

Text state stores in slide metadata:
```yaml
slide-3:
  text_state:
    h1: "Q4 Revenue Report"
    subtitle: "Performance Analysis"
```

## Limitations

- New elements added during regeneration use defaults
- Removed elements lose their content
- Complex nested structures may not fully preserve

## Best practices

1. Edit text content in the viewer first
2. Request layout changes via `/sb:edit`
3. Review regenerated slides for accuracy
4. Re-edit any text that didn't preserve correctly

## Related

- [How-to: Edit slides](../how-to/edit-slides.md)
- [How-to: Edit text in viewer](../how-to/edit-text-viewer.md)
