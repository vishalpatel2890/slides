# Output structure

Organization of generated presentation files.

## Deck output

```
output/{deck-slug}/
├── index.html           # Interactive viewer
├── plan.yaml            # Deck plan
└── slides/
    ├── slide-1.html     # Individual slides
    ├── slide-2.html
    ├── slide-3.html
    └── manifest.json    # Slide metadata
```

## Single slide output

```
output/singles/
├── plan.yaml            # Slide plan
└── slide.html           # Generated slide
```

## File descriptions

### index.html

Interactive presentation viewer:
- Gallery view with thumbnails
- Fullscreen presentation mode
- Navigation controls
- Embedded slide content

Size: 500KB - 2MB depending on slides

### plan.yaml

Deck or slide plan:
- Metadata (name, audience, goal)
- Slide definitions
- Content specifications

### slide-{n}.html

Individual slide files:
- Self-contained HTML documents
- 1920x1080 dimensions
- Inline CSS with theme variables
- Editable text content

Size: 50-200KB per slide

### manifest.json

Slide metadata:
- Deck name
- Generation timestamp
- Slide list with titles

## Naming conventions

### Deck slugs

URL-safe, lowercase, hyphenated:
- "Q4 Product Roadmap" → `q4-product-roadmap`
- "Sales Enablement" → `sales-enablement`

### Slide filenames

Sequential numbering:
- `slide-1.html`
- `slide-2.html`
- `slide-10.html`

## Multiple decks

Each deck gets its own directory:

```
output/
├── q4-roadmap/
│   ├── index.html
│   └── slides/
├── sales-training/
│   ├── index.html
│   └── slides/
└── singles/
    └── slide.html
```

## Cleanup

Remove old decks:
```bash
rm -rf output/{deck-slug}
```

Clear all output:
```bash
rm -rf output/*
```
