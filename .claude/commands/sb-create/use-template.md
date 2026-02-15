---
description: 'Instantiate a deck template with new content using pre-built multi-slide templates'
---

# Slide Builder - Use Template Command

This command instantiates a pre-built deck template, replacing placeholder content with new content while respecting constraints embedded in HTML comments.

**Usage:** `/sb:use-template [template-name]`

**Examples:**
- `/sb:use-template client-pitch` - Instantiate the client pitch deck template
- `/sb:use-template weekly-report` - Instantiate the weekly report template
- `/sb:use-template` - List available deck templates

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/use-template-deck/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/use-template-deck/instructions.md
3. Execute the 3-phase workflow:
   - Phase 1: Template Selection & Context Collection
     - Load deck-templates.json manifest
     - Match requested template by ID or use_cases
     - Load template-config.yaml from matched template
     - Collect required_context from user
     - Set optional_context defaults
     - Create output folder: output/{deck-slug}/
   - Phase 2: Per-Slide Content Assembly (Loop)
     - For each slide: copy HTML, parse constraints, gather content, replace, validate
     - Execute content_sources (web_search, file, mcp_tool, user_input)
     - Apply constraint validation and quality checkpoints
   - Phase 3: Deck Assembly & Viewer Generation
     - Run `node scripts/regenerate-viewer.js {deck-slug}`
     - Update status.yaml with deck-template mode and completion
4. All constraint comments (slide-field) must be parsed and respected
5. Content must be truncated at word boundaries when exceeding max-length
6. HTML attributes (contenteditable, data-field) must be preserved unchanged
7. User is prompted for required_context values before slide processing begins
</steps>

## Template Matching

Templates are matched in this order:
1. **Exact ID match** - Template `id` field in deck-templates.json
2. **Use cases match** - Keywords in `use_cases` array
3. **Error with suggestions** - List available templates if no match found

## Status Tracking

The workflow tracks progress in `.slide-builder/status.yaml`:
- Registers deck in `decks:` registry with `source_template` field
- Tracks `current_slide` and `built_count` progress
- Logs actions to `history` array
