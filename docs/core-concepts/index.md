# Core concepts

Understanding Slide Builder's architecture and design principles.

## System architecture

| Concept | Description |
|---------|-------------|
| [Workflows](workflows.md) | How the agentic workflow system operates |
| [Themes](themes.md) | Brand identity system and CSS variables |
| [Templates](templates.md) | Slide template architecture |
| [Catalog system](catalog.md) | Template discovery and matching |

## Content model

| Concept | Description |
|---------|-------------|
| [Slides](slides.md) | Slide structure and specifications |
| [Plans](plans.md) | Deck planning and slide intent |
| [Text preservation](text-preservation.md) | How user edits survive regenerations |

## Generation

| Concept | Description |
|---------|-------------|
| [Brand extraction](brand-extraction.md) | How themes are extracted from assets |
| [Template matching](template-matching.md) | How descriptions map to templates |
| [Gestalt feedback](gestalt-feedback.md) | High-level feedback interpretation |

## Integration

| Concept | Description |
|---------|-------------|
| [Claude Code integration](claude-code-integration.md) | Slash commands and skills |
| [Frontend design skill](frontend-design-skill.md) | AI-powered design generation |
| [Export system](export-system.md) | Google Slides and other exports |

## Foundational principles

**Brand consistency**: Every generated slide uses theme CSS variables for colors, typography, and shapes. Changes to the theme propagate to all slides.

**AI-assisted, human-controlled**: The system generates content but users maintain control through natural language editing and direct text editing.

**Workflow-based architecture**: All operations follow structured workflows with clear steps, status tracking, and feedback loops.

**Template-first matching**: The system prefers catalog templates over custom generation for consistency and performance.

**Text preservation**: User edits to text content persist through layout regenerations, enabling iterative refinement.
