# Epic Technical Specification: Theme Management

Date: 2026-01-27
Author: Vishal
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 enables users to view, modify, and version their themes for ongoing refinement after initial setup. While Epic 2 established the theme creation workflow (`/setup`), Epic 6 provides the complementary capabilities for **theme lifecycle management** - viewing what's configured, making targeted adjustments, and maintaining a version history with rollback capabilities.

This epic addresses a critical user need: brands evolve, preferences refine, and sometimes changes don't work out. The PRD explicitly calls out that "Theme evolves over time as user refines preferences" and that users need to be able to "modify existing theme via `/theme-edit` with same feedback loop" (FR9) and "rollback to previous theme version" (FR11).

Epic 6 builds on Epic 2's theme.json schema and sample deck generation infrastructure. It introduces the **theme-history/** directory for version tracking, a human-readable `/theme` summary command, and the `/theme-edit` workflow that mirrors the feedback loop from `/setup` but operates on an existing theme rather than creating one from scratch.

## Objectives and Scope

**In Scope:**

- `/theme` command to view current theme summary (FR8)
- Human-readable theme display with color swatches, font families, shape styles
- `/theme-edit` command to modify existing theme with gestalt feedback (FR9)
- Sample deck regeneration after theme changes for visual validation
- Theme version history with timestamps and change notes (FR10)
- Version file naming: `theme-v{N}-{YYYY-MM-DD}.json`
- Theme rollback to any previous version (FR11)
- Template regeneration when theme changes affect layouts
- status.yaml history entries for theme operations

**Out of Scope:**

- Initial theme creation from brand assets (`/setup` - Epic 2)
- Sample deck generation during initial setup (Epic 2)
- Multiple theme profiles per project (Growth feature per PRD)
- Theme import/export for sharing (Growth feature per PRD)
- Team theme sharing (Growth feature per PRD)
- Direct JSON editing UI (escape hatch only, documented but not built)
- Theme comparison tools (diff between versions)

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-001, ADR-005, ADR-006):**

This epic implements the **Theme Lifecycle** pattern described in the PRD and Architecture. The theme system stores all versions in `.slide-builder/theme-history/` (per Architecture project structure), maintains the active theme at `.slide-builder/theme.json`, and tracks changes in status.yaml history.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| theme.json | Data Architecture | Active theme file at `.slide-builder/theme.json` |
| theme-history/ | Project Structure | Version storage: `theme-v{N}-{date}.json` |
| status.yaml | State File Patterns | Track last_action for theme operations |
| Sample Deck Generation | Novel Pattern 1 (Theme Extraction) | Reuse for validation after edits |
| templates/ | Project Structure | Regenerate when theme changes |
| frontend-design Skill | Technology Stack | Generate updated sample slides |

**Constraints from Architecture:**

- Theme MUST remain at `.slide-builder/theme.json` as the active theme location
- Version history MUST be stored in `.slide-builder/theme-history/`
- Version files MUST follow naming: `theme-v{N}-{YYYY-MM-DD}.json`
- theme.json `meta.version` MUST be incremented on each change
- Sample slides MUST be regenerated to `.slide-builder/samples/` for validation
- Templates MUST be regenerated if shape/layout primitives change
- All theme content remains local (per NFR13: "Theme files remain local")
- status.yaml history MUST log theme view, edit, and rollback actions

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Theme Loader** | Reads and parses theme.json | File path | ThemeJson object or error |
| **Theme Formatter** | Formats theme for terminal display | ThemeJson object | Formatted string with ANSI colors |
| **Theme Editor** | Interprets gestalt feedback and updates primitives | Feedback text, current theme | Updated ThemeJson |
| **Sample Regenerator** | Regenerates sample deck with updated theme | ThemeJson | 6 sample HTML files |
| **Version Manager** | Creates/reads/restores theme versions | ThemeJson, version number | Version file operations |
| **Template Updater** | Regenerates layout templates when needed | ThemeJson | Updated template files |
| **Status Logger** | Records theme operations to status.yaml | Action description | Updated status.yaml |

**Module Details:**

**1. Theme Loader (All Stories)**
- Reads `.slide-builder/theme.json`
- Validates JSON structure against expected schema
- Returns parsed object or clear error if missing/invalid
- Used by all theme commands as prerequisite

**2. Theme Formatter (Story 6.1)**
- Converts ThemeJson to human-readable terminal output
- Generates ANSI color codes for color swatches (if terminal supports)
- Lists fonts, shape styles, and available layouts
- Formats as structured sections for readability

**3. Theme Editor (Story 6.2)**
- Parses high-level feedback ("make colors warmer", "bolder fonts")
- Maps feedback to specific primitive changes:
  - "warmer" → shift hues toward orange/yellow, reduce saturation
  - "bolder" → increase font weights, higher contrast colors
  - "more minimal" → increase whitespace, reduce shadows, simplify shapes
- Preserves unchanged primitives
- Documents changes in theme meta.changeNotes

**4. Sample Regenerator (Story 6.2)**
- Reuses Epic 2 sample deck generation logic
- Generates 6 slides to `.slide-builder/samples/`:
  - sample-1-title.html, sample-2-list.html, sample-3-flow.html
  - sample-4-columns.html, sample-5-callout.html, sample-6-code.html
- Uses frontend-design skill with updated theme primitives
- Opens samples in browser for user review

**5. Version Manager (Stories 6.3, 6.4)**
- On save: copies current theme.json to theme-history/
- Naming: `theme-v{N}-{YYYY-MM-DD}.json` where N increments
- Extracts version number from theme meta.version
- Lists available versions for rollback selection
- Restores by copying version file back to theme.json

**6. Template Updater (Story 6.2)**
- Checks if shape/layout primitives changed
- If changed: regenerates layout templates in `.slide-builder/templates/`
- Preserves template structure, updates CSS variables
- Logs which templates were updated

**7. Status Logger (All Stories)**
- Appends to status.yaml history array
- Records: action description, timestamp
- Updates last_action and last_modified fields

### Data Models and Contracts

**theme.json Schema (from Architecture, extended for versioning):**

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

**Version File Schema (theme-v{N}-{date}.json):**

Same as theme.json - exact copy at point of version creation.

**Theme Summary Display Format:**

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

**status.yaml Theme Operations:**

```yaml
last_action: "Theme edited: made colors warmer"
last_modified: "2026-01-27T14:30:00Z"

history:
  - action: "Theme viewed via /theme"
    timestamp: "2026-01-27T10:00:00Z"
  - action: "Theme edit started"
    timestamp: "2026-01-27T14:00:00Z"
  - action: "Theme v1 saved to history"
    timestamp: "2026-01-27T14:15:00Z"
  - action: "Theme edited: made colors warmer"
    timestamp: "2026-01-27T14:30:00Z"
  - action: "Theme rolled back to v1"
    timestamp: "2026-01-27T15:00:00Z"
```

**Version History Directory Structure:**

```
.slide-builder/theme-history/
├── theme-v1-2026-01-26.json    # Original from /setup
├── theme-v2-2026-01-27.json    # After first edit
└── theme-v3-2026-01-27.json    # After second edit (or rollback)
```

### APIs and Interfaces

**Slash Command Interface:**

| Command | Action | Prerequisite |
|---------|--------|--------------|
| `/theme` | Display current theme summary | theme.json must exist |
| `/theme-edit` | Start theme modification workflow | theme.json must exist |

**Command Parsing:**

```
/theme                          → Display theme summary
/theme-edit                     → Start edit workflow with feedback loop
/theme-edit "warmer colors"     → Start edit with initial feedback pre-filled
```

**Theme Edit Feedback Commands (within /theme-edit workflow):**

```
"Make the colors warmer"        → Shift hues, reduce cool tones
"Bolder fonts"                  → Increase heading weights
"More minimal"                  → Reduce shadows, increase whitespace
"Softer corners"                → Increase corner radius
"approved" / "looks good"       → Accept changes, save theme
"rollback to v1"                → Restore version 1
"cancel"                        → Discard changes, keep current theme
```

**Internal Module Interfaces:**

**Theme Loader:**
```
Input:
  - path: string (default: ".slide-builder/theme.json")
Output:
  - theme: ThemeJson | null
  - error: string | null
```

**Theme Formatter:**
```
Input:
  - theme: ThemeJson
  - useAnsiColors: boolean (default: true)
Output:
  - formatted: string (terminal-ready display)
```

**Theme Editor:**
```
Input:
  - currentTheme: ThemeJson
  - feedback: string
Output:
  - updatedTheme: ThemeJson
  - changes: string[] (list of what changed)
```

**Version Manager:**
```
// Save current version
Input:
  - theme: ThemeJson
Output:
  - versionFile: string (path to saved version)
  - newVersionNumber: string

// List versions
Output:
  - versions: { version: string, date: string, path: string }[]

// Restore version
Input:
  - versionNumber: string
Output:
  - restoredTheme: ThemeJson
  - error: string | null
```

**File System Interface:**

```
Read Operations:
- .slide-builder/theme.json (load current theme)
- .slide-builder/theme-history/*.json (list/restore versions)
- .slide-builder/status.yaml (for history updates)

Write Operations:
- .slide-builder/theme.json (save updated theme)
- .slide-builder/theme-history/theme-v{N}-{date}.json (save version)
- .slide-builder/samples/*.html (regenerate samples)
- .slide-builder/templates/*.html (regenerate templates if needed)
- .slide-builder/status.yaml (log actions)
```

### Workflows and Sequencing

**Complete /theme Workflow (Story 6.1):**

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

**Complete /theme-edit Workflow (Stories 6.2, 6.3):**

```
Phase 1: Load and Backup
┌─────────────────────────────────────────────────────────────┐
│ 1. Check theme.json exists                                   │
│    → If missing: Error "No theme found. Run /setup first"    │
│ 2. Read current theme.json                                   │
│ 3. Display current theme summary (reuse /theme formatter)    │
│ 4. Save current version to theme-history/:                   │
│    → Determine next version number from meta.version         │
│    → Save as theme-v{N}-{YYYY-MM-DD}.json                    │
│ 5. Log: "Theme v{N} saved to history"                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Collect Feedback
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "What would you like to change?"                  │
│    Examples: "warmer colors", "bolder fonts", "more minimal" │
│ 2. Accept gestalt feedback (high-level, not micro-inputs)    │
│ 3. If pre-filled feedback provided, use that                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Apply Changes
┌─────────────────────────────────────────────────────────────┐
│ 1. Interpret feedback using Theme Editor:                    │
│    - "warmer" → adjust color hues toward warm spectrum       │
│    - "bolder" → increase weights, contrast                   │
│    - "minimal" → reduce shadows, increase spacing            │
│    - etc.                                                    │
│ 2. Apply changes to theme primitives                         │
│ 3. Increment meta.version                                    │
│ 4. Update meta.lastModified timestamp                        │
│ 5. Add meta.changeNotes with feedback summary                │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Regenerate Samples
┌─────────────────────────────────────────────────────────────┐
│ 1. Generate 6 sample slides with updated theme:              │
│    - sample-1-title.html (hero typography, primary color)    │
│    - sample-2-list.html (body text, bullets)                 │
│    - sample-3-flow.html (arrows, boxes)                      │
│    - sample-4-columns.html (multiple box styles)             │
│    - sample-5-callout.html (accent color, emphasis)          │
│    - sample-6-code.html (mono font, dark variant)            │
│ 2. Save to .slide-builder/samples/                           │
│ 3. Open samples in browser for preview                       │
│ 4. Display: "Sample deck regenerated. Review in browser."    │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: Validation Loop
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "How does it look?"                               │
│    Options: more feedback / "approved" / "cancel"            │
│ 2. If more feedback:                                         │
│    → Return to Phase 3 (Apply Changes)                       │
│ 3. If "cancel":                                              │
│    → Discard changes, restore from latest version            │
│    → Exit workflow                                           │
│ 4. If "approved":                                            │
│    → Continue to Phase 6                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 6: Save and Update Templates
┌─────────────────────────────────────────────────────────────┐
│ 1. Save updated theme to .slide-builder/theme.json           │
│ 2. Check if shape/layout primitives changed:                 │
│    → If yes: regenerate templates in .slide-builder/templates│
│    → Copy approved samples to templates/ with layout-* names │
│ 3. Update status.yaml:                                       │
│    - last_action: "Theme edited: {feedback summary}"         │
│    - Add to history                                          │
│ 4. Display success:                                          │
│    "Theme updated to v{N}!"                                  │
│    "Previous version saved: theme-v{N-1}-{date}.json"        │
└─────────────────────────────────────────────────────────────┘
```

**Theme Rollback Workflow (Story 6.4):**

```
Phase 1: List Available Versions
┌─────────────────────────────────────────────────────────────┐
│ 1. Scan .slide-builder/theme-history/ directory              │
│ 2. Parse version numbers and dates from filenames            │
│ 3. Display available versions:                               │
│    "Available versions:"                                     │
│    "  v1 (2026-01-26) - Original setup"                      │
│    "  v2 (2026-01-27) - Made colors warmer"                  │
│    "  v3 (2026-01-27) - Current"                             │
│ 4. If no history: Error "No version history found"           │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Select Version
┌─────────────────────────────────────────────────────────────┐
│ 1. Prompt: "Which version to restore? (enter number)"        │
│ 2. Validate version exists                                   │
│    → If invalid: "Version not found. Available: 1, 2, 3"     │
│ 3. Read selected version file                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Preview and Confirm
┌─────────────────────────────────────────────────────────────┐
│ 1. Display summary of selected version                       │
│ 2. Regenerate sample deck with selected version theme        │
│ 3. Open samples in browser                                   │
│ 4. Prompt: "Restore this version? (y/n)"                     │
│ 5. If "n": Cancel and exit                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Restore and Version
┌─────────────────────────────────────────────────────────────┐
│ 1. Save CURRENT theme to history as new version:             │
│    → theme-v{N+1}-{date}.json (preserves current state)      │
│ 2. Copy selected version to theme.json                       │
│ 3. Update meta.version to new number (N+2)                   │
│ 4. Update meta.lastModified                                  │
│ 5. Add meta.changeNotes: "Rolled back from v{N+1} to v{X}"   │
│ 6. Regenerate templates if needed                            │
│ 7. Update status.yaml:                                       │
│    - last_action: "Theme rolled back to v{X}"                │
│    - Add to history                                          │
│ 8. Display success:                                          │
│    "Theme restored to v{X} settings (now v{N+2})"            │
│    "Previous state saved as v{N+1}"                          │
└─────────────────────────────────────────────────────────────┘
```

**Feedback Interpretation Logic:**

```
User Feedback              → Theme Primitive Changes
─────────────────────────────────────────────────────────────
"warmer colors"            → Shift primary/secondary toward orange/red
                             Reduce blue/purple tones
                             Slightly increase saturation
"cooler colors"            → Shift toward blue/green spectrum
                             Reduce warm tones
"bolder"                   → Increase heading font weight (600→700)
                             Higher color contrast
                             Darker text colors
"more minimal"             → Reduce box shadows
                             Increase corner radius slightly
                             More whitespace (larger spacing)
"more corporate"           → Traditional fonts (serif or clean sans)
                             Navy/gray color palette
                             Smaller corner radius
"more playful"             → Brighter accent colors
                             Larger corner radius
                             Slightly increased font sizes
"softer"                   → Lower contrast
                             Lighter shadows
                             Larger corner radius
"sharper"                  → Higher contrast
                             Smaller/no corner radius
                             Crisper shadows
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source | Notes |
|-------------|--------|--------|-------|
| Theme load | < 100ms | Local file | Simple JSON parse |
| Theme display | < 500ms | Local processing | Format + ANSI codes |
| Feedback interpretation | < 5 seconds | AI processing | Map feedback to primitives |
| Sample regeneration | < 30 seconds | NFR1, NFR5 | 6 slides via frontend-design skill |
| Version list | < 100ms | Local directory | Scan theme-history/ |
| Version save | < 100ms | Local file | JSON write |
| Rollback | < 30 seconds | Restore + samples | Includes sample regeneration |
| Template regeneration | < 30 seconds | If needed | 7 template files |

**Performance Notes:**
- Per PRD NFR5: "Theme feedback loop iteration (change → regenerate) should feel responsive"
- Sample regeneration is the bottleneck - same as Epic 2's `/setup` performance
- Version operations are local file I/O only (fast)
- Theme display should be instant with no visible delay

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| Theme content privacy | All operations local; no network transmission | NFR12, NFR13 |
| Version history privacy | Stored locally only in theme-history/ | NFR13 |
| Brand data exposure | theme.json contains styling only, no secrets | Local-first |
| Feedback content | Processed locally by Claude, not transmitted | ADR-005 |

**Security Patterns:**
- Per PRD NFR12: "No brand assets or slide content transmitted to external services"
- Per PRD NFR13: "Theme files and slide content remain local to user's machine"
- Theme versions may contain brand-specific styling decisions - all local
- No credentials or authentication involved in Epic 6 operations
- theme-history/ is gitignored per Architecture ADR-006

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| Theme missing | Error: "No theme found. Run /setup first" | Prerequisite |
| Invalid theme JSON | Error with specific parsing failure details | Graceful handling |
| Version file missing | Skip in list, continue with available versions | Graceful degradation |
| theme-history/ missing | Create directory on first version save | Auto-create |
| Sample regeneration fails | Log error, allow retry, theme not yet saved | NFR15 |
| Template regeneration fails | Log error, samples still available | Graceful handling |
| Disk full | Error with clear message | System error |

**Recovery Patterns:**
- Per PRD NFR15: "Theme changes don't corrupt existing slides"
- Version saved BEFORE changes applied - always have rollback
- Cancel during edit discards changes, restores from version
- Rollback creates new version (never destroys history)
- theme.json corruption can be manually recovered from theme-history/

**Failure Modes:**

```
Edit Failure Recovery:
┌─────────────────────────────────────────┐
│ 1. User starts /theme-edit               │
│ 2. Current theme saved to history (v2)   │
│ 3. Changes applied, samples generated    │
│ 4. Sample generation fails               │
│ 5. Error displayed: "Sample generation   │
│    failed. Theme not saved."             │
│ 6. User can retry or cancel              │
│ 7. Cancel restores v2 from history       │
└─────────────────────────────────────────┘

Rollback Safety:
┌─────────────────────────────────────────┐
│ 1. User requests rollback to v1          │
│ 2. FIRST: Current state saved as v3      │
│ 3. THEN: v1 restored as v4               │
│ 4. No version ever deleted               │
│ 5. User can rollback from rollback       │
└─────────────────────────────────────────┘
```

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Theme loaded | Console | "Loading theme..." |
| Theme displayed | Console | Full formatted output |
| Edit started | Console + status.yaml | "Starting theme edit..." |
| Version saved | Console + status.yaml | "Saved v{N} to history" |
| Feedback received | Console | "Interpreting: {feedback}" |
| Changes applied | Console | "Updated: colors, typography" |
| Samples generated | Console | "Sample deck regenerated" |
| Approval received | Console | "Theme approved" |
| Theme saved | Console + status.yaml | "Theme updated to v{N}" |
| Rollback started | Console | "Rolling back to v{X}..." |
| Rollback complete | Console + status.yaml | "Theme restored to v{X}" |

**Logging Strategy:**
- Real-time console output for user feedback during all operations
- status.yaml history entry for each significant action
- No external logging (local-first per ADR-005)
- Version history provides implicit audit trail

**Status Tracking in status.yaml:**

```yaml
# After theme edit workflow
last_action: "Theme edited: made colors warmer"
last_modified: "2026-01-27T14:30:00Z"
history:
  - action: "Theme viewed via /theme"
    timestamp: "2026-01-27T10:00:00Z"
  - action: "Theme edit started"
    timestamp: "2026-01-27T14:00:00Z"
  - action: "Theme v1 saved to history"
    timestamp: "2026-01-27T14:05:00Z"
  - action: "Theme edited: made colors warmer"
    timestamp: "2026-01-27T14:30:00Z"
```

## Dependencies and Integrations

**NPM Dependencies (from package.json):**

| Package | Version | Purpose | Used in Epic 6 |
|---------|---------|---------|----------------|
| puppeteer | ^23.0.0 | HTML-to-image conversion | No (Epic 7) |
| googleapis | ^140.0.0 | Google Slides API | No (Epic 7) |

**Note:** Epic 6 does not require npm dependencies. All operations use Claude Code built-in capabilities.

**Claude Code Built-in Tools:**

| Tool | Purpose | Usage in Epic 6 |
|------|---------|-----------------|
| frontend-design skill | Regenerate sample slides | Stories 6.2, 6.4 |
| File System (Read) | Load theme, versions, status | All stories |
| File System (Write) | Save theme, versions, samples, status | Stories 6.2, 6.3, 6.4 |
| Bash (optional) | Open browser for sample preview | Stories 6.2, 6.4 |

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Claude Code | Current | Framework runtime environment |
| Modern browser | Chrome/Firefox/Safari | Sample preview (optional) |
| File system access | N/A | Read/write theme and history |

**Epic Dependencies:**

| Dependency | From Epic | Required By | Relationship |
|------------|-----------|-------------|--------------|
| theme.json | Epic 2 | All stories | MUST exist for any theme operation |
| samples/ structure | Epic 2 | Stories 6.2, 6.4 | Sample regeneration follows same pattern |
| templates/ structure | Epic 2 | Story 6.2 | Template regeneration follows same pattern |
| status.yaml | Epic 1 | All stories | Action logging |
| frontend-design skill | Built-in | Stories 6.2, 6.4 | Sample/template generation |

**Integration Points:**

| Integration | Method | Direction | Epic 6 Scope |
|-------------|--------|-----------|--------------|
| Theme file | File read/write | Bidirectional | Load, modify, save theme |
| Version history | File read/write | Bidirectional | Save/restore versions |
| Sample slides | File write | Outbound | Regenerate for validation |
| Layout templates | File write | Outbound | Regenerate if primitives change |
| Status tracking | File read/write | Bidirectional | Log actions to history |
| frontend-design skill | Skill invocation | Outbound | Generate sample/template HTML |
| Browser | File open | Outbound | Preview samples |

**Data Flow:**

```
/theme command
     ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │────→│ Theme Loader    │
│                │     └────────┬────────┘
└────────────────┘              ↓
                       ┌─────────────────┐
                       │ Theme Formatter │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
Console Output ←───────│ Display Output  │
                       └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │←────│ Status Logger   │
└────────────────┘     └─────────────────┘


/theme-edit command
     ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │────→│ Theme Loader    │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ theme-history/ │←────│ Version Manager │ (save current version)
└────────────────┘     └────────┬────────┘
                                ↓
                       ┌─────────────────┐
User Feedback ────────→│ Theme Editor    │
                       └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ frontend-design│────→│ Sample          │
│ skill          │     │ Regenerator     │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐
│ samples/*.html │ (6 files)
└────────────────┘
         ↓
     Browser Preview
         ↓
     User Approval
         ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │←────│ Save Theme      │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ templates/*.html│←───│ Template Updater│ (if primitives changed)
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │←────│ Status Logger   │
└────────────────┘     └─────────────────┘


Rollback Flow
     ↓
┌────────────────┐     ┌─────────────────┐
│ theme-history/ │────→│ Version Manager │ (list versions)
└────────────────┘     └────────┬────────┘
                                ↓
                       User Selects Version
                                ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │────→│ Version Manager │ (save current as new version)
│ (current)      │     └────────┬────────┘
└────────────────┘              ↓
┌────────────────┐     ┌─────────────────┐
│ theme-history/ │────→│ Version Manager │ (restore selected)
│ (selected)     │     └────────┬────────┘
└────────────────┘              ↓
┌────────────────┐
│ theme.json     │ (restored content)
└────────────────┘
```

**External Service Dependencies:**

| Service | Required? | Purpose | Fallback |
|---------|-----------|---------|----------|
| Google Fonts | Optional | Font rendering in samples | System fonts |

**No external APIs called** - all processing uses local files and Claude's native capabilities.

## Acceptance Criteria (Authoritative)

### Story 6.1: Theme Summary View

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC6.1.1 | Given a theme.json exists, when the user runs `/theme`, then the system displays a human-readable summary |
| AC6.1.2 | The summary includes theme name and version |
| AC6.1.3 | The summary includes creation date and sources |
| AC6.1.4 | The summary includes primary, secondary, and accent colors (with swatches if terminal supports ANSI) |
| AC6.1.5 | The summary includes font families (heading, body, mono) |
| AC6.1.6 | The summary includes shape styles (corner radius, shadow style) |
| AC6.1.7 | The summary includes list of available layout templates |
| AC6.1.8 | The output is formatted for terminal readability with clear sections |
| AC6.1.9 | The path to full theme.json is displayed for power users |
| AC6.1.10 | Given no theme exists, when the user runs `/theme`, then error message directs them to run `/setup` |

### Story 6.2: Theme Editing

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC6.2.1 | Given a theme exists, when the user runs `/theme-edit`, then they can describe desired changes in natural language |
| AC6.2.2 | The system interprets gestalt feedback (e.g., "warmer colors", "bolder fonts", "more minimal") |
| AC6.2.3 | The system applies interpreted changes to theme primitives |
| AC6.2.4 | Sample slides are regenerated with the updated theme for visual validation |
| AC6.2.5 | The 6 sample slides demonstrate all theme primitives (title, list, flow, columns, callout, code) |
| AC6.2.6 | User can approve changes or provide additional feedback |
| AC6.2.7 | When user approves, theme.json is updated with changes |
| AC6.2.8 | Templates are regenerated if shape/layout primitives changed |
| AC6.2.9 | A version entry is created in theme-history before changes are applied |
| AC6.2.10 | User can cancel editing to discard all changes |

### Story 6.3: Theme Version History

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC6.3.1 | Given a theme change is made (via setup or edit), when the theme is saved, then a timestamped copy is saved to theme-history/ |
| AC6.3.2 | Version files follow naming convention: `theme-v{N}-{YYYY-MM-DD}.json` |
| AC6.3.3 | Version number increments automatically based on theme meta.version |
| AC6.3.4 | The theme.json meta.version is updated after each change |
| AC6.3.5 | All previous versions are preserved in theme-history/ (never deleted) |
| AC6.3.6 | The theme-history/ directory maintains all versions with dates visible in filenames |

### Story 6.4: Theme Rollback

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC6.4.1 | Given theme history exists with multiple versions, when the user requests rollback, then available versions are listed |
| AC6.4.2 | Each version in the list shows version number and date |
| AC6.4.3 | User can select a specific version to restore |
| AC6.4.4 | Sample slides are regenerated with the selected version's theme for preview |
| AC6.4.5 | User must confirm before rollback is applied |
| AC6.4.6 | The current theme state is saved as a new version BEFORE rollback (preserving current state) |
| AC6.4.7 | The rolled-back state becomes a new version number (not overwriting history) |
| AC6.4.8 | Given an invalid version number is requested, then error shows available versions |
| AC6.4.9 | Templates are regenerated after rollback if needed |

## Traceability Mapping

| AC | Spec Section | Component/Module | Test Idea |
|----|--------------|------------------|-----------|
| AC6.1.1 | Services/Theme Loader, Theme Formatter | Theme Loader + Formatter | Run `/theme` with theme, verify summary displayed |
| AC6.1.2 | Data Models/Theme Summary Display | Theme Formatter | Check output includes "Theme: {name} (v{N})" |
| AC6.1.3 | Data Models/Theme Summary Display | Theme Formatter | Check output includes dates and sources list |
| AC6.1.4 | Data Models/Theme Summary Display | Theme Formatter | Check colors section with hex values, verify ANSI swatches |
| AC6.1.5 | Data Models/Theme Summary Display | Theme Formatter | Check typography section lists all font families |
| AC6.1.6 | Data Models/Theme Summary Display | Theme Formatter | Check shapes section mentions corners and shadows |
| AC6.1.7 | Data Models/Theme Summary Display | Theme Formatter | Check layouts section lists all 7 templates |
| AC6.1.8 | Data Models/Theme Summary Display | Theme Formatter | Visual inspection of output formatting and sections |
| AC6.1.9 | Workflows/Phase 3 | Status Logger | Check output ends with path to theme.json |
| AC6.1.10 | Services/Theme Loader | Error handling | Delete theme.json, run `/theme`, verify error message |
| AC6.2.1 | Workflows/Phase 2 | Theme Editor | Run `/theme-edit`, verify prompt for changes appears |
| AC6.2.2 | Services/Theme Editor | Feedback interpretation | Provide "warmer colors", verify hue changes applied |
| AC6.2.3 | Services/Theme Editor | Primitive updates | After feedback, verify theme primitives changed |
| AC6.2.4 | Services/Sample Regenerator | Sample generation | After feedback, verify 6 samples regenerated |
| AC6.2.5 | Workflows/Phase 4 | Sample Regenerator | Check samples/ has all 6 slide types |
| AC6.2.6 | Workflows/Phase 5 | Validation loop | After samples, verify approval prompt appears |
| AC6.2.7 | Workflows/Phase 6 | Theme save | After approval, verify theme.json updated |
| AC6.2.8 | Services/Template Updater | Template regeneration | Change shape primitives, verify templates updated |
| AC6.2.9 | Workflows/Phase 1 | Version Manager | Before edit, verify version saved to history |
| AC6.2.10 | Workflows/Phase 5 | Cancel handling | Type "cancel", verify theme unchanged |
| AC6.3.1 | Services/Version Manager | Version save | After edit, check theme-history/ has new file |
| AC6.3.2 | Data Models/Version History | Version Manager | Check filename matches pattern theme-v{N}-{date}.json |
| AC6.3.3 | Services/Version Manager | Version numbering | Make 3 edits, verify v1, v2, v3 exist |
| AC6.3.4 | Data Models/theme.json | Theme save | After edit, verify meta.version incremented |
| AC6.3.5 | Services/Version Manager | History preservation | Make edits, verify no versions deleted |
| AC6.3.6 | Workflows/Theme Rollback Phase 1 | Version Manager | List theme-history/, verify dated files present |
| AC6.4.1 | Workflows/Theme Rollback Phase 1 | Version Manager | Request rollback, verify version list displayed |
| AC6.4.2 | Workflows/Theme Rollback Phase 1 | Version Manager | Check each version shows number and date |
| AC6.4.3 | Workflows/Theme Rollback Phase 2 | Version Manager | Enter version number, verify selection accepted |
| AC6.4.4 | Workflows/Theme Rollback Phase 3 | Sample Regenerator | After selection, verify samples regenerated |
| AC6.4.5 | Workflows/Theme Rollback Phase 3 | User confirmation | Verify confirmation prompt before restore |
| AC6.4.6 | Workflows/Theme Rollback Phase 4 | Version Manager | After rollback, verify current saved as new version |
| AC6.4.7 | Workflows/Theme Rollback Phase 4 | Version Manager | After rollback to v1, verify theme becomes v4 (not v1) |
| AC6.4.8 | Workflows/Theme Rollback Phase 2 | Error handling | Request invalid version, verify error with available list |
| AC6.4.9 | Workflows/Theme Rollback Phase 4 | Template Updater | After rollback, verify templates regenerated if needed |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Gestalt feedback interpretation produces unexpected results | Medium - user must iterate more | Medium | Show specific changes made; allow multiple feedback rounds |
| **R2:** Sample regeneration takes too long | Medium - poor UX | Low | Reuse Epic 2 infrastructure; show progress |
| **R3:** Version history grows unbounded over time | Low - disk space | Low | Local storage is cheap; document manual cleanup |
| **R4:** Theme rollback breaks existing slides | Medium - slide appearance changes | Low | Per NFR15: Slides embed CSS variables, inherit theme changes |
| **R5:** Terminal doesn't support ANSI colors | Low - less visual summary | Medium | Graceful fallback to plain text with hex codes |
| **R6:** User expects direct primitive editing | Low - frustration | Medium | Document that gestalt feedback is the primary path; JSON edit is escape hatch |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | theme.json exists from Epic 2 before any Epic 6 command | Clear error directing to `/setup` |
| **A2** | Users prefer gestalt feedback over direct primitive editing | PRD explicitly states this; escape hatch available |
| **A3** | 6 sample slides are sufficient to validate theme changes | Same as Epic 2 setup validation |
| **A4** | Version numbers can increment indefinitely | Numeric limits unlikely to be reached |
| **A5** | Template regeneration is only needed when shapes/layouts change | Color/font changes apply via CSS variables |
| **A6** | Rollback should create new version (not overwrite) | Provides full audit trail and safety |
| **A7** | Users understand that rollback affects future slides, not existing | Existing slides use embedded variables |
| **A8** | Terminal width is sufficient for formatted output | Most terminals 80+ cols; graceful wrapping |

### Open Questions

| ID | Question | Owner | Status | Recommendation |
|----|----------|-------|--------|----------------|
| **Q1** | Should `/theme` show a diff from previous version? | Dev | Open | Defer to Growth - keep MVP simple |
| **Q2** | How many feedback rounds before suggesting JSON edit? | Dev | Recommend | Same as Epic 2: 3 rounds, then offer escape hatch |
| **Q3** | Should rollback require typing version number or support "rollback 1 version"? | Dev | Recommend | Support both: number or "previous" keyword |
| **Q4** | What happens to version history after rollback to v1? | Dev | Decided | Current becomes v{N+1}, restored becomes v{N+2}. Never delete. |
| **Q5** | Should `/theme-edit` support targeting specific primitives? | Dev | Deferred | MVP uses gestalt only; "change primary color to #..." is Growth |
| **Q6** | Should samples open automatically in browser or require user action? | Dev | Recommend | Auto-open with message; user can close if unwanted |
| **Q7** | How to handle concurrent edits (two terminals)? | Dev | Low Risk | File-based; last write wins. Edge case for MVP. |
| **Q8** | Should `/theme` include theme-history summary (e.g., "3 versions available")? | Dev | Recommend | Yes, add one line: "Version history: 3 versions (use /theme-edit to rollback)" |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Theme Loader, Formatter, Editor, Version Manager) | Manual verification per module |
| **Integration** | Full workflows (/theme, /theme-edit, rollback) | End-to-end testing with various scenarios |
| **Acceptance** | All ACs per story | Manual testing per AC table |
| **Regression** | Epic 2 functionality (/setup still works) | Verify setup workflow unaffected |

### Test Approach by Story

**Story 6.1: Theme Summary View**
- Run `/theme` with valid theme, verify all sections displayed
- Check colors section shows hex values and ANSI swatches (if supported)
- Check typography lists all font families and scale
- Check shapes mentions corner radius and shadow style
- Check layouts lists all 7 template names
- Verify formatted output is readable with clear section headers
- Verify path to theme.json displayed at bottom
- Delete theme.json, run `/theme`, verify clear error message

**Story 6.2: Theme Editing**
- Run `/theme-edit`, verify current theme displayed first
- Provide feedback "warmer colors", verify:
  - Changes described in console
  - Sample deck regenerated
  - Samples display warmer colors
- Provide additional feedback "bolder fonts", verify cumulative changes
- Type "approved", verify theme.json updated
- Check meta.version incremented
- Check theme-history/ has pre-edit version saved
- Start edit, type "cancel", verify theme unchanged
- Change shape primitives, verify templates regenerated

**Story 6.3: Theme Version History**
- Complete setup (/setup), verify theme-v1-{date}.json created
- Run `/theme-edit` and approve, verify theme-v2-{date}.json created
- Make another edit, verify theme-v3-{date}.json created
- Check all 3 files exist with correct naming convention
- Check theme.json meta.version shows "3.0"
- Verify no versions deleted during any operation

**Story 6.4: Theme Rollback**
- Create 3 versions through edits
- Request rollback, verify list shows v1, v2, v3 with dates
- Select v1, verify sample deck regenerated with v1 theme
- Confirm rollback, verify:
  - Current state saved as v4
  - v1 content restored
  - theme.json meta.version is now "5.0" (restored becomes new version)
- Request invalid version "v99", verify error with available list
- Rollback to "previous" (if supported), verify works

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 6.1 | 10 | Theme display verification |
| 6.2 | 10 | Edit workflow + feedback loop |
| 6.3 | 6 | Version file verification |
| 6.4 | 9 | Rollback workflow + safety |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No theme exists | Error: "No theme found. Run /setup first" |
| Empty theme-history/ | Rollback: "No version history found" |
| Corrupted theme.json | Error with JSON parsing details |
| Very long feedback text | Process normally; truncate in changeNotes if needed |
| Special characters in feedback | Handle gracefully; escape for JSON |
| Theme with missing optional fields | Use defaults; don't error |
| Disk full during version save | Error with clear message; theme unchanged |
| ANSI not supported | Fall back to plain text display |
| Version number very high (v999) | Continue incrementing; no practical limit |

### Regression Tests (Epic 2 Compatibility)

| Test | Purpose |
|------|---------|
| /setup still works | After Epic 6, full setup workflow still functions |
| Sample deck generation | Reused infrastructure produces correct samples |
| Template generation | Reused infrastructure produces correct templates |
| theme.json schema | Epic 6 additions (lastModified, changeNotes) don't break Epic 2 |
| status.yaml logging | History entries don't interfere with other workflows |

### Feedback Interpretation Tests

| Feedback | Expected Primitive Changes |
|----------|---------------------------|
| "warmer colors" | Primary/secondary shift toward orange; reduce blue |
| "cooler colors" | Shift toward blue; reduce warm tones |
| "bolder" | Increase font weights; higher contrast |
| "more minimal" | Reduce shadows; increase corners; simpler shapes |
| "more corporate" | Traditional fonts; navy/gray palette |
| "softer" | Lower contrast; lighter shadows |
| "sharper" | Higher contrast; smaller corners |

### Definition of Done

Epic 6 is complete when:
1. `/theme` displays comprehensive, readable theme summary
2. Color swatches render in supporting terminals (graceful fallback otherwise)
3. `/theme-edit` accepts gestalt feedback and applies appropriate changes
4. Sample deck regenerates for validation after each edit
5. Feedback loop allows multiple rounds until approval
6. Theme versions save to theme-history/ with correct naming
7. Version number increments on each theme change
8. Rollback lists available versions and allows selection
9. Rollback preserves current state before restoring (no data loss)
10. All 35 acceptance criteria pass manual verification
11. Epic 2 regression tests pass (/setup still works)
