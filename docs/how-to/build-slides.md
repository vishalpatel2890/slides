# Build slides from a plan

Generate slides from an existing deck plan.

## Prerequisites

A plan created by `/sb:plan-deck` or `/sb:plan-one`.

## Build all slides

Generate all planned slides at once:

```
/sb:build-all
```

The system:
1. Reads `plan.yaml`
2. Generates each slide using matched templates
3. Creates `manifest.json`
4. Generates the viewer `index.html`

## Build one slide at a time

Generate slides incrementally:

```
/sb:build-one
```

Each invocation builds the next unbuilt slide.

Benefits:
- Review each slide before continuing
- Adjust plan mid-build if needed
- Lower resource usage per invocation

## Output location

Slides generate to:

```
output/{deck-slug}/
├── index.html      # Viewer
├── plan.yaml       # Plan
└── slides/
    ├── slide-1.html
    ├── slide-2.html
    └── manifest.json
```

## Viewing results

Open the viewer after building:

```bash
open output/{deck-slug}/index.html
```

Or view individual slides:

```bash
open output/{deck-slug}/slides/slide-1.html
```

## After building

- Edit slides with `/sb:edit {n}`
- Edit text directly in the viewer
- Export with `/sb:export`

## Related

- [Plan a deck](plan-deck.md)
- [Edit slides](edit-slides.md)
- [Use the viewer](use-viewer.md)
