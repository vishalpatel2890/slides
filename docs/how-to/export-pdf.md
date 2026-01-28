# Export to PDF

Generate a PDF from your presentation deck.

## Status

PDF export is planned for future implementation.

## Current workaround

Use browser print functionality:

1. Open the viewer:
   ```bash
   open output/{deck-slug}/index.html
   ```

2. Navigate to presentation mode

3. Use browser print (Cmd+P / Ctrl+P)

4. Select "Save as PDF"

5. Configure settings:
   - Landscape orientation
   - No margins
   - Background graphics enabled

## Planned implementation

Future PDF export will:
- Use Puppeteer for rendering
- Generate high-quality images
- Combine into single PDF
- Support via `/sb:export` workflow

## Related

- [Export to Google Slides](export-google-slides.md)
- [Use the viewer](use-viewer.md)
