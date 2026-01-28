# Story 6.1: Theme Summary View

Status: done

## Story

As a **user**,
I want **to view my current theme summary via `/theme`**,
So that **I can see what brand settings are in use without opening the raw theme.json file**.

## Acceptance Criteria

1. **AC6.1.1:** Given a theme.json exists, when the user runs `/theme`, then the system displays a human-readable summary
2. **AC6.1.2:** The summary includes theme name and version
3. **AC6.1.3:** The summary includes creation date and sources
4. **AC6.1.4:** The summary includes primary, secondary, and accent colors (with swatches if terminal supports ANSI)
5. **AC6.1.5:** The summary includes font families (heading, body, mono)
6. **AC6.1.6:** The summary includes shape styles (corner radius, shadow style)
7. **AC6.1.7:** The summary includes list of available layout templates
8. **AC6.1.8:** The output is formatted for terminal readability with clear sections
9. **AC6.1.9:** The path to full theme.json is displayed for power users
10. **AC6.1.10:** Given no theme exists, when the user runs `/theme`, then error message directs them to run `/setup`

## Frontend Test Gate

**Gate ID**: 6-1-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Claude Code active in terminal
- [ ] Test user: Solutions Consultant checking their brand configuration
- [ ] Starting state: Theme created via `/setup` workflow

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:theme` | Claude Code CLI | System loads theme.json |
| 2 | Observe header section | CLI output | Theme name and version displayed (e.g., "THEME: Brand Theme (v1.0)") |
| 3 | Observe colors section | CLI output | Primary, secondary, accent colors shown with hex values |
| 4 | Check color swatches | CLI output | If ANSI supported, colored blocks appear next to hex codes |
| 5 | Observe typography section | CLI output | Heading, body, mono fonts listed with weights |
| 6 | Observe shapes section | CLI output | Corner radius and shadow styles described |
| 7 | Observe layouts section | CLI output | List of available templates (title, list, flow, columns-2, columns-3, callout, code) |
| 8 | Check footer | CLI output | Path to full theme.json displayed |
| 9 | Delete/rename theme.json | File system | Temporarily move theme.json aside |
| 10 | Run `/sb:theme` without theme | CLI | Error message: "No theme found. Run /setup first" |

### Success Criteria (What User Sees)
- [ ] Theme header with name and version clearly visible
- [ ] Created date and sources shown
- [ ] Colors section with hex values (e.g., "Primary: #2563EB")
- [ ] ANSI color swatches appear if terminal supports (graceful fallback if not)
- [ ] Typography section lists all font families
- [ ] Typography scale shown (hero, h1, h2, body sizes)
- [ ] Shapes section describes box styles and arrow styles
- [ ] Layouts section lists all 7 template names
- [ ] Output has clear section separators (horizontal lines)
- [ ] Path to theme.json shown at bottom
- [ ] Proper error when theme missing
- [ ] No console errors
- [ ] status.yaml updated with "Theme viewed via /theme" action

### Feedback Questions
1. Was the theme summary easy to understand at a glance?
2. Did the color swatches display correctly in your terminal?
3. Was any important theme information missing from the summary?
4. Was the format clear and readable?

## Tasks / Subtasks

- [x] **Task 1: Implement Theme Loader Module** (AC: 1, 10)
  - [x] 1.1: Check if `.slide-builder/theme.json` exists
  - [x] 1.2: If missing, return clear error: "No theme found. Run /setup first"
  - [x] 1.3: Read and parse theme.json
  - [x] 1.4: Validate JSON structure has expected sections (meta, colors, typography, shapes, layouts)
  - [x] 1.5: Return parsed ThemeJson object or error with parsing details

- [x] **Task 2: Implement Theme Formatter Module** (AC: 2-8)
  - [x] 2.1: Extract metadata section (name, version, created, sources)
  - [x] 2.2: Format colors section:
    - Extract primary, secondary, accent colors
    - Extract background default/alt colors
    - Extract text heading/body colors
    - Generate ANSI escape codes for color swatches if terminal supports
  - [x] 2.3: Format typography section:
    - Extract heading, body, mono font families
    - Extract font weights (heading, body)
    - Extract scale (hero, h1, h2, body sizes)
  - [x] 2.4: Format shapes section:
    - Extract box styles (default and callout corner radius, shadow)
    - Extract arrow styles (stroke width, head type)
  - [x] 2.5: Format layouts section:
    - Extract all layout template names from layouts object
    - Display as comma-separated list

- [x] **Task 3: Implement Terminal Output Formatting** (AC: 8)
  - [x] 3.1: Create section header with decorative line: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  - [x] 3.2: Create main header: `THEME: {name} (v{version})`
  - [x] 3.3: Create section labels: `COLORS`, `TYPOGRAPHY`, `SHAPES`, `LAYOUTS`
  - [x] 3.4: Add proper indentation for section content (2 spaces)
  - [x] 3.5: Create footer with metadata and file path

- [x] **Task 4: Implement ANSI Color Swatch Generation** (AC: 4)
  - [x] 4.1: Create function to convert hex color to ANSI escape sequence
  - [x] 4.2: Generate colored block character (██) with ANSI codes
  - [x] 4.3: Implement graceful fallback for terminals without ANSI support
  - [x] 4.4: Format color display: `{swatch} {hex_value}` (e.g., "██ #2563EB")

- [x] **Task 5: Implement Status Logger** (AC: 1)
  - [x] 5.1: Load `.slide-builder/status.yaml`
  - [x] 5.2: Update last_action: "Theme viewed via /theme"
  - [x] 5.3: Update last_modified with ISO 8601 timestamp
  - [x] 5.4: Append entry to history array: `{ action: "Theme viewed via /theme", timestamp: "..." }`
  - [x] 5.5: Save updated status.yaml preserving existing structure

- [x] **Task 6: Create Theme Workflow Files** (AC: 1-10)
  - [x] 6.1: Create `.slide-builder/workflows/theme/workflow.yaml` with configuration
  - [x] 6.2: Create `.slide-builder/workflows/theme/instructions.md` with execution phases:
    - Phase 1: Load Theme
    - Phase 2: Format and Display
    - Phase 3: Log Action

- [x] **Task 7: Register /theme Slash Command** (AC: 1)
  - [x] 7.1: Create `.claude/commands/sb/theme.md`
  - [x] 7.2: Document command purpose and prerequisites
  - [x] 7.3: Include example output in documentation

- [x] **Task 8: Testing - Theme View Verification** (AC: 1-10)
  - [x] 8.1: Run `/theme` with valid theme.json, verify all sections displayed
  - [x] 8.2: Verify header shows theme name and version
  - [x] 8.3: Verify colors section shows all colors with hex values
  - [x] 8.4: Verify ANSI swatches appear (or graceful fallback)
  - [x] 8.5: Verify typography lists all font families
  - [x] 8.6: Verify shapes describes corner radius and shadows
  - [x] 8.7: Verify layouts lists all 7 templates
  - [x] 8.8: Verify footer shows path to theme.json
  - [x] 8.9: Remove theme.json, verify error message guides to /setup
  - [x] 8.10: Verify status.yaml history updated with "Theme viewed" action
  - [x] 8.11: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Theme Loader and Theme Formatter Modules:**

Per the Epic 6 Tech Spec, Story 6.1 implements two key modules:

```
Module: Theme Loader (All Stories)
Responsibility: Reads and parses theme.json
Inputs: File path (default: ".slide-builder/theme.json")
Outputs: ThemeJson object or error

Module: Theme Formatter (Story 6.1)
Responsibility: Converts ThemeJson to human-readable terminal output
Inputs: ThemeJson object, useAnsiColors: boolean
Outputs: Formatted string with ANSI colors (if supported)
```

**Complete /theme Workflow (from Tech Spec):**

```
Phase 1: Load Theme
┌─────────────────────────────────────────────────────────────┐
│ 1. Check .slide-builder/theme.json exists                    │
│    → If missing: Error "No theme found. Run /setup first"    │
│ 2. Read and parse theme.json                                 │
│ 3. Validate JSON structure                                   │
│    → If invalid: Error with details                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Format and Display
┌─────────────────────────────────────────────────────────────┐
│ 1. Extract theme metadata (name, version, dates, sources)    │
│ 2. Format colors section with ANSI swatches if supported     │
│ 3. Format typography section (fonts, weights, scale)         │
│ 4. Format shapes section (boxes, arrows)                     │
│ 5. List available layout templates                           │
│ 6. Display formatted output to terminal                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Log Action
┌─────────────────────────────────────────────────────────────┐
│ 1. Update status.yaml:                                       │
│    - last_action: "Theme viewed via /theme"                  │
│    - Add to history array                                    │
│ 2. Display path to full theme.json for power users           │
└─────────────────────────────────────────────────────────────┘
```

**Theme Summary Display Format (from Tech Spec):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME: Brand Theme (v2.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLORS
  Primary:    ██ #2563EB
  Secondary:  ██ #1E40AF
  Accent:     ██ #F59E0B
  Background: ██ #FFFFFF (default) | ██ #F8FAFC (alt)
  Text:       Heading #0F172A | Body #334155

TYPOGRAPHY
  Heading: Inter (700)
  Body:    Inter (400)
  Mono:    JetBrains Mono
  Scale:   Hero 72px → H1 48px → H2 36px → Body 18px

SHAPES
  Boxes:   8px corners, subtle shadow
  Callout: 12px corners, prominent shadow
  Arrows:  2px stroke, triangle heads, smooth curves

LAYOUTS (7 templates)
  title, list, flow, columns-2, columns-3, callout, code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created: 2026-01-26 | Modified: 2026-01-27
Sources: website.com, brand.pdf
Full theme: .slide-builder/theme.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Theme.json Schema (from Tech Spec):**

```json
{
  "meta": {
    "name": "Brand Theme",
    "version": "1.0",
    "created": "2026-01-26",
    "lastModified": "2026-01-27T14:30:00Z",
    "sources": ["website.com", "brand.pdf"],
    "changeNotes": "Made colors warmer per feedback"
  },
  "colors": {
    "primary": "#2563EB",
    "secondary": "#1E40AF",
    "accent": "#F59E0B",
    "background": { "default": "#FFFFFF", "alt": "#F8FAFC" },
    "text": { "heading": "#0F172A", "body": "#334155" }
  },
  "typography": {
    "fonts": { "heading": "Inter", "body": "Inter", "mono": "JetBrains Mono" },
    "scale": { "hero": "72px", "h1": "48px", "h2": "36px", "body": "18px" },
    "weights": { "heading": "700", "body": "400" }
  },
  "shapes": {
    "boxes": {
      "default": { "cornerRadius": "8px", "shadow": "0 4px 6px rgba(0,0,0,0.1)" },
      "callout": { "cornerRadius": "12px", "shadow": "0 10px 25px rgba(0,0,0,0.1)" }
    },
    "arrows": {
      "default": { "strokeWidth": "2px", "headType": "triangle", "curve": "smooth" }
    }
  },
  "layouts": {
    "title": { "file": "layout-title.html" },
    "list": { "file": "layout-list.html" },
    "flow": { "file": "layout-flow.html" },
    "columns-2": { "file": "layout-columns-2.html" },
    "columns-3": { "file": "layout-columns-3.html" },
    "callout": { "file": "layout-callout.html" },
    "code": { "file": "layout-code.html" }
  }
}
```

**Key Constraints (from Tech Spec):**

- Theme MUST be at `.slide-builder/theme.json` as the active theme location
- status.yaml history MUST log theme view actions
- Display path to full theme.json for power users who want direct access
- ANSI color codes should gracefully fall back if terminal doesn't support

**Non-Functional Requirements (from Tech Spec):**

- Theme load: < 100ms (local file, simple JSON parse)
- Theme display: < 500ms (local processing, format + ANSI codes)
- Per PRD NFR13: "Theme files remain local to user's machine"

### Project Structure Notes

**Files to Create:**

```
.slide-builder/
├── workflows/
│   └── theme/                       # CREATE - Theme view workflow
│       ├── workflow.yaml
│       └── instructions.md

.claude/commands/sb/
└── theme.md                         # CREATE - Slash command documentation
```

**Files to Read:**

```
.slide-builder/
├── theme.json                       # READ - Theme primitives to display
└── status.yaml                      # READ/WRITE - Update history
```

**Alignment with Architecture:**

Per Architecture ADR-001 (BMAD Pattern Alignment):
- Workflow.yaml + instructions.md structure
- Follows BMAD workflow execution pattern

Per Architecture State File Patterns:
- status.yaml tracks mode, last_action, history
- All timestamps in ISO 8601 format

Per Architecture Project Structure:
- Theme stored at `.slide-builder/theme.json`
- Workflows in `.slide-builder/workflows/`
- Commands in `.claude/commands/sb/`

### Learnings from Previous Story

**From Story 5-4-batch-slide-building (Status: in-progress)**

The previous story (5.4) is currently in-progress and has established several patterns relevant to Epic 6:

- **Workflow Structure:** Story 5.4 created `workflows/build-all/` with `workflow.yaml` and `instructions.md` - follow same pattern for `workflows/theme/`
- **Slash Command Pattern:** `commands/sb/build-all.md` structure should be replicated for `commands/sb/theme.md`
- **Status.yaml Updates:** 5.4 implements history array updates with action + timestamp - reuse this pattern
- **File Read/Write Pattern:** Same file operations (check exists, read, parse, update, save) apply to theme.json

**Key Implementation Patterns to Reuse:**
- status.yaml history append: `{ action: "...", timestamp: "ISO8601" }`
- Workflow phases with clear phase headers
- Error messages with guidance (e.g., "Run /setup first")

**Files Created in 5.4 to Reference:**
- `.slide-builder/workflows/build-all/workflow.yaml` - workflow config pattern
- `.slide-builder/workflows/build-all/instructions.md` - instructions pattern
- `.claude/commands/sb/build-all.md` - command doc pattern

[Source: notes/sprint-artifacts/5-4-batch-slide-building.md#Dev-Agent-Record]

### Testing Standards

Per Epic 6 Tech Spec Test Strategy:

**Story 6.1 Test Scenarios:**
- Run `/theme` with valid theme, verify all sections displayed
- Check colors section shows hex values and ANSI swatches (if supported)
- Check typography lists all font families and scale
- Check shapes mentions corner radius and shadow style
- Check layouts lists all 7 template names
- Verify formatted output is readable with clear section headers
- Verify path to theme.json displayed at bottom
- Delete theme.json, run `/theme`, verify clear error message

**Edge Cases (from Tech Spec):**
- No theme exists: Error "No theme found. Run /setup first"
- ANSI not supported: Fall back to plain text display with hex codes only
- Theme with missing optional fields: Use defaults, don't error
- Corrupted theme.json: Error with JSON parsing details

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Story 6.1: Theme Summary View] - AC definitions (AC6.1.1-AC6.1.10)
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Services and Modules] - Theme Loader, Theme Formatter modules
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Workflows and Sequencing] - Complete /theme Workflow
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Data Models and Contracts] - Theme.json schema, display format
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Non-Functional Requirements] - Performance targets
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Test Strategy Summary] - Test scenarios
- [Source: notes/architecture.md#State File Patterns] - status.yaml schema
- [Source: notes/architecture.md#Project Structure] - File locations
- [Source: notes/epics.md#Story 6.1: Theme Summary View] - User story and AC context
- [Source: notes/sprint-artifacts/5-4-batch-slide-building.md] - Previous story patterns

## Dev Agent Record

### Context Reference

- [Story Context XML](./6-1-theme-summary-view.context.xml) - Generated 2026-01-27

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**2026-01-27 - Implementation Plan:**
- Existing workflow files (workflow.yaml, instructions.md, theme.md) exist but need enhancement
- Theme.json uses `meta.extractedFrom` structure (not `meta.sources`)
- Layouts are in `theme.slides.layouts` (title, content, split, data)
- Approach: Update existing files with full tech spec format, ANSI color support, status.yaml logging

### Completion Notes List

- Updated `.slide-builder/workflows/theme/instructions.md` with comprehensive 3-phase workflow:
  - Phase 1: Load Theme (with error handling for missing/corrupt files)
  - Phase 2: Format and Display (with ANSI color swatches, all sections)
  - Phase 3: Log Action (status.yaml history update)
- Updated `.slide-builder/workflows/theme/workflow.yaml` to v2.0 with status_file reference
- Updated `.claude/commands/sb/theme.md` with example output and error cases
- Variable extraction guide included for mapping theme.json structure to display format
- ANSI swatch generation documented with 24-bit true color escape sequences
- Test Gate PASSED by Vishal (2026-01-27)

### Completion Notes
**Completed:** 2026-01-27
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

**Modified:**
- `.slide-builder/workflows/theme/workflow.yaml` - Added version 2.0, status_file reference
- `.slide-builder/workflows/theme/instructions.md` - Complete rewrite with 3-phase workflow, ANSI support
- `.claude/commands/sb/theme.md` - Added example output, prerequisites, error cases

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implementation complete - workflow, instructions, command updated; Test Gate PASSED | Dev Agent |
| 2026-01-27 | Story marked DONE - all ACs met, DoD complete | Dev Agent |
