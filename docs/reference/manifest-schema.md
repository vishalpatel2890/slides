# Manifest schema

Specification for slide manifest files.

## manifest.json structure

```json
{
  "deckName": "string",
  "generatedAt": "string",
  "slideCount": number,
  "slides": [
    {
      "number": number,
      "filename": "string",
      "title": "string",
      "template": "string"
    }
  ]
}
```

## Field descriptions

### Root fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deckName | string | Yes | Presentation title |
| generatedAt | string | Yes | ISO 8601 timestamp |
| slideCount | number | No | Total slides |
| slides | array | Yes | Slide entries |

### Slide entry fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | number | Yes | Position (1-indexed) |
| filename | string | Yes | HTML filename |
| title | string | No | Slide title text |
| template | string | No | Template used |

## Example manifest

```json
{
  "deckName": "Q4 Product Roadmap",
  "generatedAt": "2026-01-28T12:00:00Z",
  "slideCount": 8,
  "slides": [
    {
      "number": 1,
      "filename": "slide-1.html",
      "title": "Q4 Product Roadmap",
      "template": "title"
    },
    {
      "number": 2,
      "filename": "slide-2.html",
      "title": "Today's Agenda",
      "template": "agenda"
    },
    {
      "number": 3,
      "filename": "slide-3.html",
      "title": "Current Challenges",
      "template": "callout"
    }
  ]
}
```

## File location

```
output/{deck-slug}/slides/manifest.json
```

## Generation

Manifests generate automatically:
- During `/sb:build-all`
- Via `scripts/generate-manifest.js`
- During `/sb:refresh`

## Usage

The viewer reads manifest to:
- Display slide count
- Generate thumbnails
- Enable navigation
- Show slide titles

## Regenerating manifest

```bash
node scripts/generate-manifest.js output/{deck-slug}/slides
```

Or use:
```
/sb:refresh
```
