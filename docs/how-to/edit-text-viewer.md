# Edit text in the viewer

Modify slide content directly in the presentation viewer.

## Prerequisites

A generated slide or deck.

## Steps

1. Open the viewer:
   ```bash
   open output/{deck-slug}/index.html
   ```

2. Navigate to the slide you want to edit

3. Click any text element to edit

4. Type your changes

5. Click outside the element to save

## Editable elements

Most text elements support direct editing:
- Titles and headings
- Body paragraphs
- Bullet points
- Captions

Elements have `contenteditable="true"` attribute.

## Auto-save behavior

Changes save automatically:
- On blur (clicking outside)
- On navigation (changing slides)
- Periodically during editing

Saved to slide state for persistence.

## Formatting

Basic formatting available:
- Text content only
- Styling inherits from template
- No inline formatting controls

For style changes, use `/sb:edit` workflow.

## Limitations

| Supported | Not supported |
|-----------|---------------|
| Text content | Font changes |
| Line breaks | Color changes |
| Basic editing | Image replacement |

## Preserving edits

Text edits persist through:
- Viewer reloads
- Manifest regeneration

Text edits survive layout regeneration via `/sb:edit`.

## Related

- [Edit slides](edit-slides.md)
- [Core concepts: Text preservation](../core-concepts/text-preservation.md)
