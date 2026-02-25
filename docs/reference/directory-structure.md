# Directory structure

Complete project folder organization.

## Root structure

```
slide-builder/
├── .slide-builder/          # Framework configuration
├── .claude/                 # Claude Code integration
├── .bmad/                   # BMAD framework (external)
├── output/                  # Generated presentations
├── scripts/                 # Build utilities
├── notes/                   # Project documentation
├── docs/                    # User documentation
├── node_modules/            # Dependencies (gitignored)
├── package.json             # NPM configuration
└── .gitignore               # Git exclusions
```

## .slide-builder/

Framework configuration and state.

```
.slide-builder/
├── workflows/               # Workflow definitions
│   ├── setup/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── theme/
│   ├── theme-edit/
│   ├── plan/
│   ├── plan-one/
│   ├── plan-deck/
│   ├── build-one/
│   ├── build-all/
│   ├── edit/
│   ├── export/
│   └── add-slide-template/
│
├── config/                  # User configuration (shareable)
│   ├── theme.json           # Current brand theme
│   ├── theme-history/       # Version snapshots
│   │   └── theme-v{n}-{date}.json
│   └── catalog/             # Template catalog
│       ├── catalog.json     # Manifest
│       ├── title.html
│       ├── agenda.html
│       └── [templates].html
│
├── templates/               # Framework templates (slide templates only)
│
├── credentials/             # OAuth tokens (gitignored)
├── single/                  # Single slide workspace (gitignored)
├── deck/                    # Deck workspace (gitignored, legacy)
├── status.yaml              # Runtime state
└── CONVENTIONS.md           # Framework patterns
```

## .claude/

Claude Code skill registrations.

```
.claude/
├── commands/
│   └── sb/                  # Slash command registrations
│       ├── setup.md
│       ├── theme.md
│       ├── theme-edit.md
│       ├── plan.md
│       ├── plan-one.md
│       ├── plan-deck.md
│       ├── build-one.md
│       ├── build-all.md
│       ├── edit.md
│       ├── export.md
│       ├── add-slide-template.md
│       ├── refresh.md
│       └── help.md
└── skills/                  # Shared skills
```

## output/

Generated presentations.

```
output/
├── {deck-slug}/             # Each deck
│   ├── index.html           # Interactive viewer
│   ├── plan.yaml            # Deck plan
│   └── slides/
│       ├── slide-1.html
│       ├── slide-2.html
│       └── manifest.json
│
└── singles/                 # Single slide output
    ├── plan.yaml
    └── slide.html
```

## scripts/

Build and generation utilities.

```
scripts/
├── generate-manifest.js     # Create manifest from slides
└── regenerate-viewer.js     # Rebuild viewer from template
```

## Gitignored paths

```
.slide-builder/credentials/  # OAuth tokens
.slide-builder/config/       # User brand assets
.slide-builder/single/       # Single workspace
.slide-builder/deck/         # Deck workspace
.bmad/                       # External framework
node_modules/                # Dependencies
```

## Shareable vs local

| Path | Shareable | Purpose |
|------|-----------|---------|
| `.slide-builder/workflows/` | Yes | Framework workflows |
| `.slide-builder/config/` | Zip to share | Brand assets |
| `.slide-builder/credentials/` | No | User tokens |
| `output/` | Yes | Presentations |
