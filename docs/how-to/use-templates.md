# Use templates

Apply specific templates when creating slides.

## Automatic template matching

When planning slides, templates match automatically via keywords:

```
/sb:plan-one
Create a process flow showing onboarding steps.
```

Keywords "process" and "flow" match the `process-flow` template.

## Request specific templates

Mention the template explicitly:

```
/sb:plan-one
Use the comparison template to show before/after states.
```

## Template keyword reference

| Template | Matching keywords |
|----------|-------------------|
| title | title, opening, hero, intro |
| agenda | agenda, list, bullets, overview |
| process-flow | flow, process, steps, timeline, roadmap |
| comparison | comparison, versus, before-after, columns |
| callout | callout, statistic, quote, highlight, metric |
| technical | code, technical, api, syntax, developer |

## Override template selection

If the wrong template matches:

1. Review the plan output
2. Request correction:
   ```
   Use the callout template instead.
   ```
3. Confirm the updated plan

## Custom template usage

User-created templates match via their defined use_cases:

```json
{
  "id": "case-study",
  "use_cases": ["case study", "customer story", "success"]
}
```

Plan with matching keywords:
```
Create a customer success story slide.
```

## Fallback to custom generation

If no template matches:
- System generates a custom layout
- Uses frontend-design skill
- Creates one-off slide (not cataloged)

## Related

- [Create a custom template](create-custom-template.md)
- [Core concepts: Template matching](../core-concepts/template-matching.md)
