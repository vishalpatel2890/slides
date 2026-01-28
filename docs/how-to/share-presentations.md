# Share presentations

Distribute generated presentation decks.

## Option 1: Share HTML files

The entire deck is self-contained:

1. Zip the deck folder:
   ```bash
   zip -r presentation.zip output/{deck-slug}/
   ```

2. Share the zip file

3. Recipients extract and open `index.html`

Works offline with `file://` protocol.

## Option 2: Web hosting

Host on any static file server:

1. Upload deck folder to server
2. Share the URL to `index.html`

Compatible with:
- GitHub Pages
- Netlify
- Vercel
- Any static host

## Option 3: Google Slides

Export for collaboration:

```
/sb:export
```

Recipients get a Google Slides URL with full editing capability.

Note: Slides export as images, not editable elements.

## Option 4: Individual slides

Share specific slides:

1. Navigate to `output/{deck-slug}/slides/`
2. Share individual `slide-{n}.html` files
3. Recipients open in browser

## File sizes

Typical sizes:
- Single slide: 50-200KB
- Full deck with viewer: 1-5MB
- Includes embedded assets

## Related

- [Export to Google Slides](export-google-slides.md)
- [Export to PDF](export-pdf.md)
