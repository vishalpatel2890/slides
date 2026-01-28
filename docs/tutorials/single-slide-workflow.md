# Single slide workflow

Create individual slides quickly for specific needs.

## When to use single slide mode

- Quick one-off slides for meetings
- Testing template designs
- Adding slides to external presentations
- Rapid prototyping

## Prerequisites

A configured theme (run `/sb:setup` if needed).

## Step 1: Plan a single slide

```
/sb:plan-one
```

Describe your slide:

```
Create a comparison slide showing our product vs competitors.
Left side: Our features.
Right side: Competitor limitations.
```

The system:
1. Analyzes your description
2. Matches to appropriate templates
3. Creates a detailed plan

## Step 2: Review the plan

The plan includes:
- Selected template (or custom generation)
- Content structure
- Layout specifications

If the match is wrong, provide correction:

```
Use the callout template instead for more impact.
```

## Step 3: Build the slide

```
/sb:build-one
```

The slide generates to `output/singles/slide.html`.

## Step 4: View and edit

Open the slide directly:

```bash
open output/singles/slide.html
```

Edit text by clicking any text element. Changes save automatically.

For layout changes:

```
/sb:edit
```

Describe modifications naturally.

## Step 5: Export or integrate

Copy the slide HTML to your target location, or use it directly in presentations.

## Template matching

The system matches descriptions to templates using keywords:

| Template | Keywords |
|----------|----------|
| Title | opening, hero, intro |
| Agenda | list, bullets, overview |
| Process flow | steps, timeline, roadmap |
| Comparison | versus, before-after, columns |
| Callout | statistic, quote, highlight |
| Technical | code, api, developer |

For unmatched descriptions, the system generates custom layouts using the frontend-design skill.

## What we learned

- Planning single slides with natural language
- Template matching process
- Building and editing individual slides

## Next steps

- [Full deck workflow](full-deck-workflow.md) for complete presentations
- [Template creation](template-creation.md) for custom templates
- [Reference: Templates](../reference/templates.md) for available templates
