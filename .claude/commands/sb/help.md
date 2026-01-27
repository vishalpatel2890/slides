---
description: 'List all available Slide Builder commands with descriptions'
---

# Slide Builder - Help

## Available Commands

### Theme Management
| Command | Description |
|---------|-------------|
| `/sb:setup` | Create brand theme from assets (website URL, PDF, images) |
| `/sb:theme` | Display current theme summary |
| `/sb:theme-edit` | Modify existing theme with visual feedback |

### Planning
| Command | Description |
|---------|-------------|
| `/sb:plan` | Smart router - asks single slide or full deck |
| `/sb:plan-one` | Plan a single slide |
| `/sb:plan-deck` | Plan a full presentation deck |

### Building
| Command | Description |
|---------|-------------|
| `/sb:build-one` | Build the next slide (or single planned slide) |
| `/sb:build-all` | Build all remaining slides in deck plan |

### Editing & Export
| Command | Description |
|---------|-------------|
| `/sb:edit [n]` | Edit slide layout (optionally specify slide number) |
| `/sb:export` | Export slides to Google Slides |

## Quick Start

1. **Set up your theme**: `/sb:setup`
2. **Plan your slides**: `/sb:plan`
3. **Build slides**: `/sb:build-one` or `/sb:build-all`
4. **Edit if needed**: `/sb:edit`
5. **Export**: `/sb:export`

## Getting Help

- Run `/sb:help` to see this list
- Check `.slide-builder/CONVENTIONS.md` for detailed documentation
- Each workflow has instructions in its `instructions.md` file
