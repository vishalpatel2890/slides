# Catalog schema

Specification for the template catalog manifest.

## catalog.json structure

```json
{
  "version": "string",
  "templates": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "use_cases": ["string"],
      "file": "string",
      "category": "string",
      "preview": "string"
    }
  ]
}
```

## Root fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | string | No | Catalog version |
| templates | array | Yes | Template definitions |

## Template entry fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (lowercase, hyphenated) |
| name | string | Yes | Display name |
| description | string | Yes | Brief purpose description |
| use_cases | array | Yes | Keywords for matching |
| file | string | Yes | HTML filename |
| category | string | No | Template category |
| preview | string | No | Preview image path |

## Example catalog

```json
{
  "version": "1.0",
  "templates": [
    {
      "id": "title",
      "name": "Title Slide",
      "description": "Full-bleed hero slide for opening presentations",
      "use_cases": ["title", "opening", "hero", "intro", "welcome"],
      "file": "title.html",
      "category": "opening"
    },
    {
      "id": "agenda",
      "name": "Agenda/List",
      "description": "Structured list for agendas and bullet points",
      "use_cases": ["agenda", "list", "bullets", "overview", "contents"],
      "file": "agenda.html",
      "category": "structure"
    },
    {
      "id": "comparison",
      "name": "Comparison",
      "description": "Side-by-side comparison of two options",
      "use_cases": ["comparison", "versus", "vs", "before-after", "columns"],
      "file": "comparison.html",
      "category": "content"
    }
  ]
}
```

## Use case guidelines

Effective use_cases include:

**Primary terms**: Direct description of template purpose
- "comparison", "timeline", "overview"

**Synonyms**: Alternative words for same concept
- "versus", "roadmap", "summary"

**Content descriptors**: Type of content displayed
- "statistics", "bullets", "code"

**Action words**: What the slide does
- "introduce", "compare", "highlight"

## Adding templates

1. Create HTML file in catalog directory
2. Add entry to `catalog.json`
3. Include meaningful use_cases

```json
{
  "id": "new-template",
  "name": "New Template",
  "description": "Purpose of this template",
  "use_cases": ["keyword1", "keyword2", "keyword3"],
  "file": "new-template.html"
}
```

## Validation

Required for valid entry:
- Unique `id` across all templates
- `file` must exist in catalog directory
- At least 2-3 `use_cases` for matching
