# Full deck workflow

Plan and build complete presentations with narrative structure.

## When to use deck mode

- Multi-slide presentations
- Structured narratives
- Client deliverables
- Conference talks

## Prerequisites

A configured theme (run `/sb:setup` if needed).

## Step 1: Plan the deck

```
/sb:plan-deck
```

Provide comprehensive context:

```
Create a presentation on migrating to cloud infrastructure.

Audience: IT leadership and technical architects.
Goal: Get approval for migration project.
Duration: 30-minute presentation.

Key points to cover:
- Current infrastructure challenges
- Cloud benefits
- Migration approach
- Timeline and milestones
- Risk mitigation
- Investment requirements
```

## Step 2: Review the generated plan

The system creates a complete plan including:

**Deck metadata**:
- Name and slug
- Audience profile
- Presentation goals

**Narrative structure**:
- Opening hook
- Problem statement
- Solution presentation
- Evidence/proof
- Call to action

**Slide-by-slide breakdown**:
```yaml
slides:
  - number: 1
    template: title
    intent: "Opening with compelling vision"

  - number: 2
    template: agenda
    intent: "Set expectations for discussion"

  - number: 3
    template: callout
    intent: "Highlight current pain point"
```

## Step 3: Adjust the plan

Request modifications before building:

```
Add a slide about security considerations.
Move the timeline slide earlier.
Remove the technical architecture slide.
```

The plan updates to reflect changes.

## Step 4: Build slides

Build all slides at once:

```
/sb:build-all
```

Or build incrementally to review each:

```
/sb:build-one
```

Slides generate to `output/{deck-slug}/slides/`.

## Step 5: Review in the viewer

```bash
open output/{deck-slug}/index.html
```

The viewer provides:
- Gallery view with all slides
- Fullscreen presentation mode
- Navigation controls

## Step 6: Edit specific slides

To modify slide 5:

```
/sb:edit 5
```

Describe layout changes:
- "Move the chart to the left"
- "Make bullet points larger"
- "Add more emphasis to the header"

Text edits made in the viewer persist through layout regenerations.

## Step 7: Finalize and export

Export to Google Slides:

```
/sb:export
```

Or use the HTML files directly for web-based presentations.

## Deck structure

Generated decks follow this structure:

```
output/{deck-slug}/
├── index.html      # Interactive viewer
├── plan.yaml       # Deck plan
└── slides/
    ├── slide-1.html
    ├── slide-2.html
    └── manifest.json
```

## What we learned

- Planning comprehensive presentations
- Working with narrative structure
- Building and reviewing complete decks
- Editing within deck context

## Next steps

- [Theme refinement](theme-refinement.md) for brand adjustments
- [How-to: Export presentations](../how-to/export-presentations.md)
- [Core concepts: Workflows](../core-concepts/workflows.md)
