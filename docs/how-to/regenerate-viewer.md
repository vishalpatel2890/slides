# Regenerate viewer

Rebuild the viewer and manifest for a deck.

## When to regenerate

- After manually editing slide files
- After adding or removing slides
- If viewer becomes out of sync
- After template updates

## Steps

1. Run the refresh workflow:
   ```
   /sb:refresh
   ```

   Or use the script directly:
   ```bash
   node scripts/regenerate-viewer.js output/{deck-slug}
   ```

2. Verify the updated viewer:
   ```bash
   open output/{deck-slug}/index.html
   ```

## What gets regenerated

| File | Purpose |
|------|---------|
| `index.html` | Interactive viewer |
| `slides/manifest.json` | Slide metadata |

## Manual regeneration

Using Node.js scripts:

```bash
# Generate manifest
node scripts/generate-manifest.js output/{deck-slug}/slides

# Regenerate viewer
node scripts/regenerate-viewer.js output/{deck-slug}
```

## Viewer template

The viewer generates from:
```
.slide-builder/templates/viewer-template.html
```

Template placeholders:
- `{{DECK_NAME}}` - Deck title
- `{{SLIDE_LIST}}` - Slide array
- `{{SLIDE_HTML_BASE64}}` - Embedded slides

## Related

- [How-to: Use the viewer](use-viewer.md)
- [Reference: Output structure](../reference/output-structure.md)
