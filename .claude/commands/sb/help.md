---
description: 'List all available Slide Builder commands with descriptions'
---

# Slide Builder - Help

## Smart Entry Point

**`/sb`** - The recommended starting point. Detects your current state and presents context-aware options:
- **No theme?** → Guides you to setup
- **No decks?** → Offers create options (full deck, single slide, use template)
- **Deck in progress?** → Continue building, build all, edit, or start new
- **All complete?** → Plan new deck, edit existing, or export

Just run `/sb` and let the system guide you!

---

## Available Commands

### Create Commands (/sb-create:)
Day-to-day deck creation workflow

| Command | Description |
|---------|-------------|
| `/sb-create:plan` | Smart router - asks single slide or full deck |
| `/sb-create:plan-one` | Plan a single slide |
| `/sb-create:plan-deck` | Plan a full presentation deck |
| `/sb-create:build-one` | Build the next slide (or single planned slide) |
| `/sb-create:build-all` | Build all remaining slides in deck plan |
| `/sb-create:edit` | Edit slide layout via natural language prompts |
| `/sb-create:add-slide` | Add a new slide to an existing deck plan |
| `/sb-create:animate` | Generate animation build groups for a slide |
| `/sb-create:export` | Export slides to Google Slides |
| `/sb-create:use-template` | Instantiate a deck template with new content |
| `/sb-create:refresh` | Regenerate viewer and manifest for current deck |

### Manage Commands (/sb-manage:)
Catalog and template management

| Command | Description |
|---------|-------------|
| `/sb-manage:add-slide-template` | Create new slide template via conversation |
| `/sb-manage:add-deck-template` | Create new deck template via guided conversation |
| `/sb-manage:edit-deck-template` | Add, edit, remove, or reorder slides in deck template |
| `/sb-manage:update-brand-assets` | Manage brand asset catalog (icons, logos, images) |
| `/sb-manage:delete-deck` | Delete a deck and all its files |
| `/sb-manage:optimize-instructions` | Transform workflow instructions using best practices |

### Brand Commands (/sb-brand:)
Theme and brand management

| Command | Description |
|---------|-------------|
| `/sb-brand:setup` | Create brand theme from assets (website URL, PDF, images) |
| `/sb-brand:theme` | Display current theme summary - colors, typography, shapes |
| `/sb-brand:theme-edit` | Modify existing theme via high-level feedback |

## Quick Start

1. **Set up your theme**: `/sb-brand:setup`
2. **Plan your slides**: `/sb-create:plan`
3. **Build slides**: `/sb-create:build-one` or `/sb-create:build-all`
4. **Edit if needed**: `/sb-create:edit`
5. **Export**: `/sb-create:export`

### Meta Commands (/sb:)
Help and status

| Command | Description |
|---------|-------------|
| `/sb:help` | Show all commands (this list) |
| `/sb:status` | Display unified slide queue status dashboard |

## Getting Help

- Run `/sb:help` to see this list
- Run `/sb:status` to see deck progress at a glance
- Check `.slide-builder/CONVENTIONS.md` for detailed documentation
- Each workflow has instructions in its `instructions.md` file
