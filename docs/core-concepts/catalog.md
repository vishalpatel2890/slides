# Catalog system

The catalog provides intelligent template discovery and matching.

## Catalog structure

The `catalog.json` manifest defines available templates:

```json
{
  "templates": [
    {
      "id": "title",
      "name": "Title Slide",
      "description": "Full-bleed hero slide for opening",
      "use_cases": ["title", "opening", "hero", "intro"],
      "file": "title.html"
    },
    {
      "id": "comparison",
      "name": "Comparison",
      "description": "Side-by-side comparison layout",
      "use_cases": ["comparison", "versus", "before-after", "columns"],
      "file": "comparison.html"
    }
  ]
}
```

## Template matching

When planning slides, the system matches intent to templates:

1. User describes slide: "Compare our solution to competitors"
2. System extracts keywords: "compare", "solution", "competitors"
3. Keywords match against `use_cases`
4. Best matching template selected

### Matching algorithm

```
score = sum of (keyword matches in use_cases)
selected = template with highest score
```

### Match threshold

If no template scores above threshold, the system:
- Falls back to custom generation
- Uses frontend-design skill
- Creates one-off layout

## Use case keywords

Effective use cases include:
- Primary intent: "comparison", "timeline", "overview"
- Synonyms: "versus", "roadmap", "summary"
- Content types: "statistics", "bullets", "code"

## Adding templates to catalog

New templates register in `catalog.json`:

```json
{
  "id": "new-template",
  "name": "New Template Name",
  "description": "What this template does",
  "use_cases": ["keyword1", "keyword2", "keyword3"],
  "file": "new-template.html"
}
```

Place the HTML file in `.slide-builder/config/catalog/`.

## Catalog location

```
.slide-builder/config/catalog/
├── catalog.json      # Manifest
├── title.html
├── agenda.html
└── [other templates]
```

## Extensibility

The catalog supports:
- User-created templates via `/sb:add-template`
- Manual template additions
- Custom use case definitions

## Related

- [Templates](templates.md)
- [Template matching](template-matching.md)
- [How-to: Create a custom template](../how-to/create-custom-template.md)
