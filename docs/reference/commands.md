# Commands

Complete reference for all Slide Builder slash commands.

## Theme commands

### /sb:setup

Create a brand theme from assets.

**Usage**: `/sb:setup`

**Workflow phases**:
1. Asset collection (URLs, PDFs, images)
2. Brand primitive extraction
3. Theme generation
4. Sample slide review
5. Feedback loop
6. Finalization

**Output**: `.slide-builder/config/theme.json`

---

### /sb:theme

Display current theme summary.

**Usage**: `/sb:theme`

**Output**: Formatted display of colors, typography, shapes, personality.

---

### /sb:theme-edit

Modify existing theme with gestalt feedback.

**Usage**: `/sb:theme-edit`

**Workflow phases**:
1. Current theme review
2. Feedback collection
3. Theme adjustment
4. Sample regeneration
5. Iteration or confirmation

**Output**: Updated `theme.json`, version snapshot

---

## Planning commands

### /sb:plan

Smart router for planning workflows.

**Usage**: `/sb:plan`

**Behavior**: Asks whether single slide or full deck, routes to appropriate workflow.

---

### /sb:plan-one

Plan a single slide.

**Usage**: `/sb:plan-one`

**Input**: Natural language description of slide

**Output**: `output/singles/plan.yaml`

---

### /sb:plan-deck

Plan a full presentation deck.

**Usage**: `/sb:plan-deck`

**Input**: Topic, audience, goals, key points

**Output**: `output/{deck-slug}/plan.yaml`

---

## Build commands

### /sb:build-one

Build the next slide from plan.

**Usage**: `/sb:build-one`

**Behavior**:
- Single mode: Builds `output/singles/slide.html`
- Deck mode: Builds next unbuilt slide

**Output**: Generated slide HTML

---

### /sb:build-all

Build all remaining slides in deck.

**Usage**: `/sb:build-all`

**Requirement**: Deck mode with existing plan

**Output**: All slides, manifest, viewer

---

## Edit commands

### /sb:edit

Edit slide layout with natural language.

**Usage**:
- Single mode: `/sb:edit`
- Deck mode: `/sb:edit {slide-number}`

**Input**: Natural language layout modifications

**Behavior**: Regenerates layout, preserves text edits

---

## Export commands

### /sb:export

Export deck to Google Slides.

**Usage**: `/sb:export`

**Requirements**:
- Built deck with slides
- Google account (OAuth authentication)

**Output**: Google Slides URL

---

## Template commands

### /sb-manage:add-slide-template

Create a custom slide template through conversation.

**Usage**: `/sb-manage:add-slide-template`

**Input**: Template requirements and design feedback

**Output**: New template in catalog

---

## Utility commands

### /sb:help

Display available commands.

**Usage**: `/sb:help`

---

### /sb:refresh

Refresh viewer and manifest for current deck.

**Usage**: `/sb:refresh`

**Behavior**: Regenerates `index.html` and `manifest.json`
