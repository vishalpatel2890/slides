# Edit slides

Modify slide layouts using natural language commands.

## Prerequisites

- A built slide (from `/sb:build-one` or `/sb:build-all`)

## Steps

1. Run the edit workflow with slide number:
   ```
   /sb:edit 3
   ```

2. Describe desired changes:
   - "Make the title larger"
   - "Move bullet points to the left"
   - "Add more spacing between sections"
   - "Change the layout to two columns"

3. Review the regenerated slide

4. Continue editing or confirm

## Supported modifications

**Layout changes**:
- "Two column layout"
- "Add a sidebar"
- "Center the content"

**Sizing**:
- "Make headings bigger"
- "Increase font size"
- "More padding around boxes"

**Spacing**:
- "More white space"
- "Tighter spacing"
- "Separate sections more"

**Positioning**:
- "Move chart to left"
- "Align text to center"
- "Position logo top right"

## Text preservation

User text edits made in the viewer persist through layout regenerations. The system:
1. Captures current text content
2. Regenerates layout
3. Reapplies text edits

## Edit single mode vs deck mode

For single slides:
```
/sb:edit
```

For deck slides:
```
/sb:edit {slide-number}
```

## Related

- [Edit text in viewer](edit-text-viewer.md)
- [Create a single slide](create-single-slide.md)
