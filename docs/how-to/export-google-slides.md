# Export to Google Slides

Upload a deck to Google Slides for sharing and collaboration.

## Prerequisites

- A built deck with slides
- Google account access

## Steps

1. Run the export workflow:
   ```
   /sb:export
   ```

2. Complete OAuth authentication (first time only):
   - A browser window opens
   - Sign in to your Google account
   - Grant required permissions

3. Select the deck to export

4. Wait for upload to complete

5. Receive the Google Slides URL

## Authentication

OAuth credentials store locally in:
```
.slide-builder/credentials/
```

Subsequent exports skip authentication.

## Export process

The system:
1. Reads slides from `output/{deck}/slides/`
2. Converts HTML to images
3. Creates a new Google Slides presentation
4. Uploads each slide as an image
5. Returns the shareable URL

## Limitations

- Slides export as images (not editable elements)
- Animations not preserved
- Large decks may take longer

## Troubleshooting

**Authentication fails**:
- Delete `.slide-builder/credentials/` and retry
- Ensure browser can open

**Upload fails**:
- Check internet connection
- Verify Google account permissions

## Related

- [Build slides from a plan](build-slides.md)
- [Share presentations](share-presentations.md)
