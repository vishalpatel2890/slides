# Epic Technical Specification: Slide Editing

Date: 2026-01-27
Author: Vishal
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 enables users to refine their generated slides through both inline text editing (already established in Epic 3) and prompt-based layout changes via the `/edit` command. This epic bridges the gap between initial slide generation and the polished, customer-ready output that Solutions Consultants need.

The core innovation is the **edit preservation pattern**: when users request layout changes through natural language prompts (e.g., "move the diagram to the right", "add a fourth column"), the system regenerates the slide layout while preserving all text edits the user has made. This ensures that refinements to copy are never lost during structural changes, eliminating the frustrating "start over" experience common in other tools.

Epic 4 builds directly on Epic 3's contenteditable infrastructure and slide-state.json persistence mechanism, extending it to handle the more complex scenario of maintaining user edits across AI-driven layout regenerations.

## Objectives and Scope

**In Scope:**

- `/edit [n]` command to invoke editing on a specific slide (or single slide in single mode)
- Natural language layout change descriptions (e.g., "Make the title bigger", "Add a subtitle")
- Layout regeneration via frontend-design skill while preserving user's text edits
- Edit preservation mechanism using data-field selectors to match content across layouts
- Orphaned edit handling when fields are removed in new layouts
- Inline text editing continuation (leveraging Epic 3's contenteditable)
- State file management for edit tracking across regenerations

**Out of Scope:**

- Slide creation (`/plan-one`, `/build-one` - Epic 3)
- Full deck planning and building (`/plan-deck`, `/build-all` - Epic 5)
- Theme management (`/theme`, `/theme-edit` - Epic 6)
- Export to Google Slides (`/export` - Epic 7)
- Visual drag-and-drop editing (PRD states "All edits are prompt-based" for MVP)
- Batch editing across multiple slides (Growth feature)
- CSS override panel (Growth feature)

## System Architecture Alignment

**Architecture Pattern Alignment (per ADR-002 and ADR-003):**

This epic implements the **Text Edit Persistence** pattern from Architecture Novel Pattern 3. When a layout regeneration occurs via `/edit`, the system reads all edits from slide-state.json, generates a new layout based on the user's natural language instruction, then reapplies saved content to matching data-field selectors. This pattern ensures user work is never lost while still allowing AI-driven layout flexibility.

**Key Architecture Components Referenced:**

| Component | Architecture Section | Implementation |
|-----------|---------------------|----------------|
| Text Edit Persistence | Novel Pattern 3 | Read state → generate → reapply edits → save |
| Dual-Mode State | Novel Pattern 4 | Detect mode from status.yaml to target correct slide |
| HTML Slide Pattern | Implementation Patterns | Preserve contenteditable, data-field structure |
| State File Pattern | Implementation Patterns | slide-state.json selector → content mapping |
| frontend-design Skill | Technology Stack | Regenerate layouts while following theme |

**Constraints from Architecture:**

- Regenerated slides MUST maintain all contenteditable and data-field attributes
- State file edits MUST be preserved even if no matching selector exists (orphaned edits)
- Regenerated slides MUST use theme CSS variables consistently
- Edit commands MUST work in both single mode and deck mode
- Layout changes MUST be processed by frontend-design skill for quality assurance
- Mode detection MUST read status.yaml to determine which slide(s) are editable

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **Edit Command Router** | Parses /edit command, determines target slide | Command args, status.yaml | Target slide path, mode context |
| **Slide Loader** | Loads current slide HTML and state file | Slide path | Slide HTML content, slide-state.json |
| **Edit State Manager** | Reads/writes slide-state.json, handles orphaned edits | State file path | Edit collection with selectors and content |
| **Layout Regenerator** | Invokes frontend-design skill with edit instruction | Theme, current layout, edit instruction | New slide HTML |
| **Edit Reapplicator** | Matches saved edits to new layout via data-field selectors | New HTML, saved edits | HTML with edits injected |
| **Slide Persister** | Saves regenerated slide and updates status | Final HTML, state updates | Written files, success confirmation |

**Module Details:**

**1. Edit Command Router (Story 4.1)**
- Parses `/edit` command arguments (optional slide number)
- Reads status.yaml to determine current mode (single vs deck)
- In single mode: targets `.slide-builder/single/slide.html`
- In deck mode with number: targets `.slide-builder/deck/slides/slide-{n}.html`
- In deck mode without number: prompts user for slide number or shows list
- Validates slide exists before proceeding
- Returns error with valid range if invalid slide number provided

**2. Slide Loader (Story 4.1)**
- Loads slide HTML content from target path
- Loads corresponding slide-state.json (or creates empty if missing)
- Extracts current layout summary for user context
- Identifies all data-field elements in current slide

**3. Edit State Manager (Story 4.3)**
- Manages slide-state.json read/write operations
- Preserves all existing edits during regeneration
- Handles orphaned edits (no matching selector) by keeping them in state
- Logs warnings for orphaned edits to status.yaml
- Merges new edits with existing state

**4. Layout Regenerator (Story 4.2)**
- Constructs frontend-design skill invocation with:
  - Current slide HTML as reference
  - User's natural language edit instruction
  - Complete theme.json for consistency
  - Required constraints (1920x1080, contenteditable, data-field)
- Invokes skill and receives new HTML
- Validates new HTML has required attributes

**5. Edit Reapplicator (Story 4.3)**
- Iterates through all saved edits from state file
- For each edit, searches new HTML for matching data-field selector
- If match found: replaces element innerHTML with saved content
- If no match: marks edit as orphaned, preserves in state file
- Ensures auto-save JavaScript is present in final HTML

**6. Slide Persister (Story 4.2, 4.3)**
- Writes final HTML to slide file location
- Updates slide-state.json with any new orphaned edit warnings
- Updates status.yaml with last_action and history entry
- Confirms save to user

### Data Models and Contracts

**slide-state.json (Enhanced for Epic 4):**

```json
{
  "slide": "single",
  "edits": [
    {
      "selector": "[data-field='title']",
      "content": "User's edited title text",
      "lastModified": "2026-01-27T10:45:00Z"
    },
    {
      "selector": "[data-field='bullet-1']",
      "content": "User's edited bullet point",
      "lastModified": "2026-01-27T10:46:00Z"
    }
  ],
  "orphanedEdits": [
    {
      "selector": "[data-field='removed-field']",
      "content": "Content from removed element",
      "orphanedAt": "2026-01-27T11:00:00Z",
      "reason": "Field not found in regenerated layout"
    }
  ],
  "lastModified": "2026-01-27T11:00:00Z",
  "regenerationCount": 2
}
```

**Edit Instruction Schema (internal):**

```yaml
# Passed to Layout Regenerator
edit_context:
  slide_path: ".slide-builder/single/slide.html"
  current_html: "<html>...</html>"
  instruction: "Move the diagram to the right side"
  theme: { /* full theme.json contents */ }
  constraints:
    dimensions: "1920x1080"
    required_attributes:
      - "contenteditable='true'"
      - "data-field"
    preserve_fields:
      - "title"
      - "bullet-1"
      - "bullet-2"
```

**status.yaml Updates (Edit Operations):**

```yaml
mode: single
current_slide: 1
total_slides: 1
built_count: 1
last_action: "Edited slide layout: moved diagram to right"
last_modified: 2026-01-27T11:00:00Z
history:
  - action: "Single slide planned"
    timestamp: 2026-01-27T10:30:00Z
  - action: "Slide built using layout-flow"
    timestamp: 2026-01-27T10:45:00Z
  - action: "Layout edited: moved diagram to right"
    timestamp: 2026-01-27T11:00:00Z
    preserved_edits: 3
    orphaned_edits: 0
```

**HTML Slide Structure (Post-Edit Requirements):**

Regenerated slides MUST maintain this structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>{{slide_title}}</title>
  <style>
    :root {
      /* All theme CSS variables MUST be preserved */
      --color-primary: {{theme.colors.primary}};
      /* ... */
    }
    body { margin: 0; width: 1920px; height: 1080px; }
    .slide { width: 100%; height: 100%; position: relative; }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_id}}">
    <!-- ALL text elements MUST have contenteditable and data-field -->
    <!-- data-field values should be preserved from original where possible -->
    <h1 contenteditable="true" data-field="title">Title Here</h1>
    <p contenteditable="true" data-field="body">Body content</p>
    <!-- New elements from edit get new data-field values -->
    <h2 contenteditable="true" data-field="subtitle">New Subtitle</h2>
  </div>
  <script>
    // Auto-save script MUST be present (same as Epic 3)
    const saveEdits = () => { /* ... */ };
    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('blur', saveEdits);
      el.addEventListener('input', () => setTimeout(saveEdits, 1000));
    });
    // Restore edits on load
    const stored = localStorage.getItem('slide-edits');
    if (stored) { /* ... */ }
  </script>
</body>
</html>
```

### APIs and Interfaces

**Slash Command Interface:**

| Command | Action | Inputs | Outputs |
|---------|--------|--------|---------|
| `/edit` | Edit single slide (single mode) | Edit instruction | Regenerated slide.html |
| `/edit [n]` | Edit slide n (deck mode) | Slide number, edit instruction | Regenerated slide-n.html |

**Command Parsing:**

```
/edit                    → Single mode: edit single/slide.html
                         → Deck mode: prompt for slide number
/edit 3                  → Deck mode: edit deck/slides/slide-3.html
/edit "make title bigger" → Single mode: immediate instruction
/edit 3 "add subtitle"   → Deck mode: slide 3 with immediate instruction
```

**Internal Tool Interfaces:**

**Edit Command Router:**
```
Input:
  - command_args: string[] (e.g., ["3"] or ["3", "add subtitle"])
  - status_yaml: StatusYaml object
Output:
  - target_slide: string (file path)
  - mode: "single" | "deck"
  - slide_number: number | null
  - immediate_instruction: string | null
Error Cases:
  - "No slides exist. Run /plan-one or /plan-deck first."
  - "Invalid slide number. Valid range: 1-{total_slides}"
```

**Layout Regenerator (frontend-design skill invocation):**
```
Input:
  - theme: ThemeJson (complete theme object)
  - current_html: string (existing slide HTML)
  - instruction: string (user's edit request)
  - constraints: {
      dimensions: "1920x1080",
      preserve_data_fields: string[],
      required_attributes: ["contenteditable", "data-field"]
    }
Output:
  - new_html: string (regenerated slide HTML)
  - new_fields: string[] (data-field values in new layout)
  - removed_fields: string[] (fields no longer present)
```

**Edit Reapplicator:**
```
Input:
  - new_html: string (from Layout Regenerator)
  - saved_edits: EditEntry[] (from slide-state.json)
Output:
  - final_html: string (with edits injected)
  - applied_edits: EditEntry[] (successfully matched)
  - orphaned_edits: EditEntry[] (no matching selector)
```

**File System Interface:**

```
Read Operations:
- .slide-builder/status.yaml (mode detection)
- .slide-builder/theme.json (for regeneration)
- .slide-builder/single/slide.html (single mode)
- .slide-builder/single/slide-state.json (single mode edits)
- .slide-builder/deck/slides/slide-{n}.html (deck mode)
- .slide-builder/deck/slides/slide-{n}-state.json (deck mode edits)

Write Operations:
- .slide-builder/single/slide.html (regenerated)
- .slide-builder/single/slide-state.json (updated with orphans)
- .slide-builder/deck/slides/slide-{n}.html (regenerated)
- .slide-builder/deck/slides/slide-{n}-state.json (updated)
- .slide-builder/status.yaml (last_action, history)
```

### Workflows and Sequencing

**Complete /edit Workflow:**

```
Phase 1: Command Parsing and Mode Detection
┌─────────────────────────────────────────────────────────────┐
│ 1. Parse /edit command arguments                            │
│ 2. Read status.yaml for current mode                        │
│ 3. If mode == "single":                                     │
│    → Target: .slide-builder/single/slide.html               │
│ 4. If mode == "deck":                                       │
│    → If slide number provided: Target slide-{n}.html        │
│    → If no number: Prompt "Which slide? (1-{total})"        │
│ 5. Validate target slide exists                             │
│    → If not found: Error with guidance                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 2: Load Current State
┌─────────────────────────────────────────────────────────────┐
│ 1. Read target slide HTML file                              │
│ 2. Read corresponding slide-state.json                      │
│    → If missing: Create empty state { edits: [] }           │
│ 3. Parse HTML to extract:                                   │
│    - All data-field values (current structure)              │
│    - Current layout summary (for user context)              │
│ 4. Display current slide info:                              │
│    - "Current layout: [layout type]"                        │
│    - "Fields: title, body, bullet-1, bullet-2..."           │
│    - "Existing edits: 3 text changes"                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 3: Capture Edit Instruction
┌─────────────────────────────────────────────────────────────┐
│ 1. If instruction provided in command:                      │
│    → Use immediately                                        │
│ 2. If no instruction:                                       │
│    → Prompt: "Describe the layout change you want"          │
│ 3. Confirm understanding:                                   │
│    - "I'll: [interpretation of instruction]"                │
│    - "Your text edits (3) will be preserved"                │
│ 4. Ask: "Proceed? (y/n)"                                    │
│    → If no: Return to prompt for different instruction      │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 4: Layout Regeneration
┌─────────────────────────────────────────────────────────────┐
│ 1. Load theme.json for style consistency                    │
│ 2. Prepare frontend-design skill invocation:                │
│    - Current HTML as reference                              │
│    - Edit instruction                                       │
│    - Theme object                                           │
│    - Constraints (dimensions, required attributes)          │
│    - List of data-field values to preserve                  │
│ 3. Invoke frontend-design skill                             │
│ 4. Receive new HTML layout                                  │
│ 5. Validate response:                                       │
│    - Has contenteditable on text elements                   │
│    - Has data-field attributes                              │
│    - Uses theme CSS variables                               │
│    - Renders at 1920x1080                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 5: Edit Reapplication
┌─────────────────────────────────────────────────────────────┐
│ 1. Load saved edits from slide-state.json                   │
│ 2. For each saved edit:                                     │
│    a. Find element with matching data-field selector        │
│    b. If found:                                             │
│       → Replace innerHTML with saved content                │
│       → Mark as "applied"                                   │
│    c. If not found:                                         │
│       → Mark as "orphaned"                                  │
│       → Add to orphanedEdits array with reason              │
│       → Log warning                                         │
│ 3. Ensure auto-save JavaScript is present                   │
│ 4. Compile final HTML                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
Phase 6: Save and Report
┌─────────────────────────────────────────────────────────────┐
│ 1. Write final HTML to slide file                           │
│ 2. Update slide-state.json:                                 │
│    - Preserve all edits (including orphaned)                │
│    - Update lastModified                                    │
│    - Increment regenerationCount                            │
│ 3. Update status.yaml:                                      │
│    - last_action: "Layout edited: [instruction]"            │
│    - Add to history with preserved_edits count              │
│ 4. Display results:                                         │
│    - "Layout updated successfully"                          │
│    - "Preserved edits: 3"                                   │
│    - If orphaned: "Warning: 1 edit couldn't be matched"     │
│    - "Open in browser to review"                            │
│ 5. Offer to open in browser                                 │
└─────────────────────────────────────────────────────────────┘
```

**Edit Reapplication Detail Flow:**

```
For each edit in slide-state.json.edits:
    │
    ├─→ selector: "[data-field='title']"
    │   content: "My Custom Title"
    │
    ↓
Search new HTML for element matching selector
    │
    ├─→ FOUND: <h1 contenteditable="true" data-field="title">Default</h1>
    │   │
    │   ↓
    │   Replace: <h1 contenteditable="true" data-field="title">My Custom Title</h1>
    │   Mark: applied
    │
    └─→ NOT FOUND: No element with data-field="title"
        │
        ↓
        Add to orphanedEdits:
        {
          selector: "[data-field='title']",
          content: "My Custom Title",
          orphanedAt: "2026-01-27T11:00:00Z",
          reason: "Field not found in regenerated layout"
        }
        Log warning to console and status.yaml
```

**Inline Text Edit Flow (Existing from Epic 3, Enhanced):**

```
User edits text in browser
         ↓
Blur event fires on contenteditable element
         ↓
JavaScript captures all contenteditable content
         ↓
Save to localStorage immediately
         ↓
Periodic sync to slide-state.json (every 5s)
         ↓
On next /edit command:
  → These edits are loaded and preserved through regeneration
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source | Notes |
|-------------|--------|--------|-------|
| Edit command parsing | < 500ms | Local | Status.yaml read + argument parsing |
| Slide and state loading | < 1 second | Local | File reads, HTML parsing |
| Layout regeneration | < 30 seconds | NFR5 | frontend-design skill invocation |
| Edit reapplication | < 500ms | Local | DOM manipulation, string replacement |
| Final save operation | < 1 second | Local | File writes to HTML and JSON |
| Total /edit workflow | < 35 seconds | Derived | Including user confirmation |

**Performance Notes:**
- Per PRD NFR5: "Theme feedback loop iteration (change → regenerate) should feel responsive" - same applies to edit regeneration
- Layout regeneration is the bottleneck; show progress indicator during skill invocation
- Edit reapplication is fast (in-memory string operations)
- File I/O is minimal (single HTML file + small JSON state)
- Recommend showing "Regenerating layout..." spinner during Phase 4

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| Edit instruction injection | Instructions processed by Claude; no shell execution | Best practice |
| Slide content privacy | All operations local; no network transmission | NFR12, NFR13 |
| State file tampering | State files are local only; user has full control | Local-first |
| HTML injection | User edits are their own content; displayed in their browser | Acceptable risk |
| Theme exposure | theme.json contains styling only, no secrets | NFR13 |

**Security Patterns:**
- Per PRD NFR12: "No brand assets or slide content transmitted to external services"
- Per PRD NFR13: "Theme files and slide content remain local to user's machine"
- Edit instructions are passed to frontend-design skill, not executed as code
- No credentials or authentication involved in Epic 4
- All file operations are user-initiated and local

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| Slide file missing | Error: "Slide not found. Build it first with /build-one" | Prerequisite check |
| State file missing | Create empty state; proceed with regeneration | Graceful degradation |
| State file corrupted | Warn user; create fresh state; regenerate loses edits | NFR17 recovery |
| Regeneration fails | Preserve original slide; show error; allow retry | NFR14 |
| Edit reapplication fails | Save what succeeded; report orphaned edits | Partial success |
| File write fails | Retry once; report error with file path | Standard handling |
| Orphaned edits exist | Preserve in state file; warn user; don't delete | Architecture Pattern 3 |

**Recovery Patterns:**
- Per PRD NFR14: "Partial deck builds are recoverable" - extends to edits
- Per PRD NFR17: "State files are human-readable YAML for manual recovery"
- Original slide is NEVER overwritten until regeneration fully succeeds
- Orphaned edits are preserved indefinitely; user can manually recover content
- If regeneration fails, original slide remains intact

**Failure Modes:**

```
Regeneration Failure:
┌─────────────────────────────────────────┐
│ 1. frontend-design skill fails          │
│ 2. Log error to console                 │
│ 3. Keep original slide.html unchanged   │
│ 4. Display: "Regeneration failed: ..."  │
│ 5. Offer: "Try again? (y/n)"            │
│ 6. Original slide remains accessible    │
└─────────────────────────────────────────┘

Partial Reapplication:
┌─────────────────────────────────────────┐
│ 1. Some edits match, some don't         │
│ 2. Apply all matching edits             │
│ 3. Preserve orphaned in state file      │
│ 4. Save regenerated slide               │
│ 5. Warn: "1 edit couldn't be matched"   │
│ 6. User can see orphaned in state JSON  │
└─────────────────────────────────────────┘
```

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Edit command invocation | Console | "Editing slide [n]..." |
| Current state loaded | Console | "Loaded slide with 3 text edits" |
| Edit instruction received | Console | "Instruction: [user input]" |
| Regeneration started | Console + spinner | "Regenerating layout..." |
| Regeneration completed | Console | "New layout generated" |
| Edit reapplication | Console | "Applying 3 saved edits..." |
| Orphaned edits warning | Console + status.yaml | "Warning: 1 edit couldn't be matched" |
| Save completed | Console + status.yaml | "Slide updated successfully" |

**Logging Strategy:**
- Real-time console output for user feedback
- status.yaml history entry with preserved_edits and orphaned_edits counts
- Orphaned edits logged with full detail in slide-state.json
- No external logging (local-first per ADR-005)

**Debug Information:**

```yaml
# status.yaml history entry for edit operation
- action: "Layout edited: added subtitle below title"
  timestamp: 2026-01-27T11:00:00Z
  slide: "single"
  preserved_edits: 3
  orphaned_edits: 1
  regeneration_duration_ms: 8500
```

```json
// slide-state.json orphaned edit entry
{
  "selector": "[data-field='old-diagram-caption']",
  "content": "This diagram shows the architecture",
  "orphanedAt": "2026-01-27T11:00:00Z",
  "reason": "Field 'old-diagram-caption' not found in regenerated layout"
}
```

## Dependencies and Integrations

**NPM Dependencies (from package.json):**

| Package | Version | Purpose | Used in Epic 4 |
|---------|---------|---------|----------------|
| puppeteer | ^23.0.0 | HTML-to-image conversion | No (Epic 7) |
| googleapis | ^140.0.0 | Google Slides API | No (Epic 7) |

**Note:** Epic 4 does not require npm dependencies. All operations use Claude Code built-in capabilities.

**Claude Code Built-in Tools:**

| Tool | Purpose | Usage in Epic 4 |
|------|---------|-----------------|
| frontend-design skill | Regenerate slide layouts | Story 4.2 - layout changes |
| File System (Read) | Load slides, state, theme, status | All stories |
| File System (Write) | Save regenerated slides, updated state | Stories 4.2, 4.3 |
| Bash (optional) | Open browser for preview after edit | Story 4.2 |

**Runtime Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Claude Code | Current | Framework runtime environment |
| Modern browser | Chrome/Firefox/Safari | Slide preview and inline editing |
| File system access | N/A | Read/write slides and state |

**Epic Dependencies:**

| Dependency | From Epic | Required By | Relationship |
|------------|-----------|-------------|--------------|
| slide.html | Epic 3 | Story 4.1 | MUST exist before /edit |
| slide-state.json | Epic 3 | Story 4.3 | Contains edits to preserve |
| theme.json | Epic 2 | Story 4.2 | Required for regeneration consistency |
| status.yaml | Epic 1 | Story 4.1 | Mode detection (single vs deck) |
| contenteditable pattern | Epic 3 | All stories | HTML structure for editing |
| data-field pattern | Epic 3 | Story 4.3 | Selector matching for edit preservation |

**Integration Points:**

| Integration | Method | Direction | Epic 4 Scope |
|-------------|--------|-----------|--------------|
| Slide files | File read/write | Bidirectional | Load current, save regenerated |
| State files | File read/write | Bidirectional | Load edits, save updated state |
| Theme system | File read | Inbound | Load theme for regeneration |
| Status tracking | File read/write | Bidirectional | Mode detection, history logging |
| frontend-design skill | Skill invocation | Outbound | Generate new layouts |
| Browser | File open | Outbound | Preview after edit |

**Data Flow:**

```
/edit command
     ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │────→│ Mode Detection  │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ slide.html     │────→│ Current Layout  │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ slide-state.json│───→│ Saved Edits     │
└────────────────┘     └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ theme.json     │────→│ Layout          │
└────────────────┘     │ Regenerator     │
                       │ (frontend-design)│
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │ Edit            │
                       │ Reapplicator    │
                       └────────┬────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ slide.html     │←────│ Save Updated    │
│ (updated)      │     │ Slide           │
└────────────────┘     └─────────────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ slide-state.json│←───│ Update State    │
│ (updated)      │     │ (orphans logged)│
└────────────────┘     └─────────────────┘
                                ↓
┌────────────────┐     ┌─────────────────┐
│ status.yaml    │←────│ Log Action      │
│ (history added)│     └─────────────────┘
└────────────────┘
```

**External Service Dependencies:**

| Service | Required? | Purpose | Fallback |
|---------|-----------|---------|----------|
| Google Fonts | Optional | Font rendering in regenerated slides | System fonts |

**No external APIs called** - all processing uses local files and Claude's native capabilities.

## Acceptance Criteria (Authoritative)

### Story 4.1: Edit Command Invocation

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC4.1.1 | Given slides exist (single mode or deck mode), when the user runs `/edit` (no number, single mode), then the single slide is loaded for editing |
| AC4.1.2 | Given slides exist in deck mode, when the user runs `/edit 3`, then slide 3 is loaded for editing |
| AC4.1.3 | Given an invalid slide number is provided, when `/edit 99` is run but only 5 slides exist, then error message shows valid range (1-5) |
| AC4.1.4 | When a slide is loaded for editing, then the current slide content summary is displayed (layout type, field count, existing edit count) |
| AC4.1.5 | When a slide is loaded for editing, then the user is prompted for edit instructions |
| AC4.1.6 | Given no slides exist, when `/edit` is run, then error message directs user to run `/build-one` first |

### Story 4.2: Natural Language Layout Changes

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC4.2.1 | Given a slide is loaded for editing, when the user describes a layout change (e.g., "Move the diagram to the right"), then the system reads current slide HTML |
| AC4.2.2 | The system reads existing text edits from slide-state.json before regeneration |
| AC4.2.3 | The system regenerates the layout based on the instruction using frontend-design skill |
| AC4.2.4 | The system preserves all user text edits by reapplying them to matching data-field selectors |
| AC4.2.5 | The regenerated slide maintains theme consistency (uses theme CSS variables) |
| AC4.2.6 | The user text content is not lost during layout regeneration |
| AC4.2.7 | Given the user makes multiple edit requests, when each request is processed, then previous text edits continue to persist |
| AC4.2.8 | The regenerated slide is saved to the original slide file location |
| AC4.2.9 | status.yaml is updated with last_action describing the edit operation |

### Story 4.3: Edit Preservation Across Regenerations

| AC# | Acceptance Criterion |
|-----|---------------------|
| AC4.3.1 | Given a slide has user text edits in state file, when a layout regeneration occurs via `/edit`, then the system reads all edits from slide-state.json |
| AC4.3.2 | The system generates new layout HTML based on the edit instruction |
| AC4.3.3 | The system matches data-field selectors from saved edits to elements in new HTML |
| AC4.3.4 | For matching selectors, the saved content is injected into the new HTML elements |
| AC4.3.5 | The updated HTML is saved, and the state file is preserved |
| AC4.3.6 | Given a field is removed in the new layout, when no matching selector exists, then the orphaned edit is preserved in slide-state.json (not deleted) |
| AC4.3.7 | A warning is logged when edits are orphaned |
| AC4.3.8 | Given new fields are added in the new layout, when they have no saved edits, then they use default generated content |
| AC4.3.9 | The regenerationCount in slide-state.json is incremented after each successful edit |

## Traceability Mapping

| AC | Spec Section | Component/Module | Test Idea |
|----|--------------|------------------|-----------|
| AC4.1.1 | Services/Edit Command Router | Mode detection | In single mode, run `/edit`, verify single/slide.html targeted |
| AC4.1.2 | Services/Edit Command Router | Slide number parsing | In deck mode, run `/edit 3`, verify deck/slides/slide-3.html targeted |
| AC4.1.3 | APIs/Command Parsing | Error handling | Run `/edit 99` with 5 slides, verify "Valid range: 1-5" error |
| AC4.1.4 | Services/Slide Loader | Content summary | Load slide, verify layout type and edit count displayed |
| AC4.1.5 | Workflows/Phase 3 | User prompt | Verify "Describe the layout change" prompt appears |
| AC4.1.6 | Workflows/Phase 1 | Prerequisite check | Delete slides, run `/edit`, verify "Build it first" error |
| AC4.2.1 | Services/Slide Loader | HTML loading | Request edit, verify current HTML read before regeneration |
| AC4.2.2 | Services/Edit State Manager | State loading | Create edits, request edit, verify state file read |
| AC4.2.3 | Services/Layout Regenerator | Skill invocation | Request "add subtitle", verify frontend-design skill called |
| AC4.2.4 | Services/Edit Reapplicator | Edit injection | Edit title, regenerate, verify title edit preserved |
| AC4.2.5 | Data Models/HTML Slide | Theme variables | Inspect regenerated slide for --color-primary etc. |
| AC4.2.6 | Services/Edit Reapplicator | Content preservation | Edit 3 fields, regenerate, verify all 3 preserved |
| AC4.2.7 | Services/Edit State Manager | Cumulative edits | Multiple /edit calls, verify all previous edits retained |
| AC4.2.8 | Services/Slide Persister | File save | After edit, verify slide.html updated at original path |
| AC4.2.9 | Data Models/status.yaml | History logging | After edit, check status.yaml has edit action logged |
| AC4.3.1 | Workflows/Phase 5 | State reading | Create state file with edits, regenerate, verify all read |
| AC4.3.2 | Services/Layout Regenerator | HTML generation | Provide instruction, verify new HTML structure generated |
| AC4.3.3 | Services/Edit Reapplicator | Selector matching | Check matching logic with various data-field values |
| AC4.3.4 | Services/Edit Reapplicator | Content injection | Verify innerHTML replaced with saved content |
| AC4.3.5 | Services/Slide Persister | Dual save | Verify both HTML and state JSON saved |
| AC4.3.6 | Data Models/slide-state.json | Orphaned edits | Remove field in new layout, verify edit in orphanedEdits array |
| AC4.3.7 | Observability | Warning logging | Orphan edit, verify warning in console and status.yaml |
| AC4.3.8 | Services/Layout Regenerator | Default content | Add new field, verify has generated default text |
| AC4.3.9 | Data Models/slide-state.json | Regeneration count | Multiple edits, verify regenerationCount increments |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1:** Regeneration changes data-field names, breaking edit reapplication | High - user loses edited content | Medium | Instruct frontend-design skill to preserve existing data-field values where semantically equivalent |
| **R2:** frontend-design skill produces layouts without required attributes | High - contenteditable breaks | Low | Validate response; add missing attributes programmatically if needed |
| **R3:** Complex edit instructions misinterpreted by skill | Medium - layout doesn't match intent | Medium | Confirm understanding before regeneration; allow user to refine instruction |
| **R4:** Large number of orphaned edits confuses users | Medium - trust in system decreases | Low | Clear warnings; show orphaned content in console for easy recovery |
| **R5:** Regeneration significantly slower than expected | Medium - poor UX | Low | Progress indicator; async operation; cache theme.json |
| **R6:** State file grows large with many orphaned edits | Low - file size manageable | Low | Periodic cleanup prompt after N orphaned edits |
| **R7:** Browser localStorage and file state diverge | Medium - inconsistent edits | Low | Sync localStorage to file on /edit command start |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| **A1** | slide.html exists from Epic 3 before /edit runs | Workflow fails; clear error needed |
| **A2** | slide-state.json structure from Epic 3 is compatible | Edit loading fails; migration needed |
| **A3** | data-field attribute values are unique within a slide | Ambiguous matching; need disambiguation |
| **A4** | frontend-design skill can accept "current HTML + instruction" format | Skill invocation fails; need different approach |
| **A5** | Users understand "layout changes" vs "text edits" distinction | Confusion if user expects /edit for text; clarify in UX |
| **A6** | Regeneration preserves semantic structure even with layout changes | Matching fails; need smarter field mapping |
| **A7** | theme.json hasn't changed since slide was built | Style inconsistency; warn if theme version differs |

### Open Questions

| ID | Question | Owner | Status | Recommendation |
|----|----------|-------|--------|----------------|
| **Q1** | Should /edit support batch operations on multiple slides? | Dev | Deferred | No for MVP; Growth feature |
| **Q2** | How should we handle theme changes between build and edit? | Dev | Open | Warn user; offer to update slide to new theme |
| **Q3** | Should orphaned edits auto-purge after N regenerations? | Dev | Open | Recommend: Keep forever; user can manually clear |
| **Q4** | What if user wants to undo an edit regeneration? | Dev | Open | Recommend: Backup original to .bak file before regeneration |
| **Q5** | Should data-field values be preserved exactly or can skill rename? | Dev | Recommend | Instruct skill to preserve; allow semantic renaming with mapping |
| **Q6** | How to handle edits to non-text elements (e.g., edited SVG paths)? | Dev | Out of scope | MVP is text-only; non-text elements regenerated fresh |
| **Q7** | Should /edit without instruction show slide preview first? | Dev | Recommend | Yes, open in browser before prompting for instruction |

## Test Strategy Summary

### Test Levels

| Level | Scope | Method |
|-------|-------|--------|
| **Unit** | Individual modules (Command Router, Edit Reapplicator, etc.) | Manual verification per module |
| **Integration** | Full /edit workflow from command to saved file | End-to-end testing with various edit scenarios |
| **Acceptance** | All ACs per story | Manual testing per AC table |
| **Regression** | Epic 3 functionality (contenteditable, auto-save) | Verify Epic 3 patterns still work after Epic 4 |

### Test Approach by Story

**Story 4.1: Edit Command Invocation**
- In single mode, run `/edit`, verify single/slide.html is targeted
- In deck mode, run `/edit 3`, verify deck/slides/slide-3.html is targeted
- Run `/edit 99` with only 5 slides, verify error shows "Valid range: 1-5"
- Verify current slide info displayed (layout type, fields, edit count)
- Delete all slides, run `/edit`, verify error directs to /build-one
- In deck mode without number, verify prompt for slide selection

**Story 4.2: Natural Language Layout Changes**
- Edit slide title in browser, run `/edit "add subtitle"`, verify title edit preserved
- Request "Move the diagram to the right", verify layout changes
- Request "Make title bigger", verify font size changes in regenerated slide
- Inspect regenerated slide for theme CSS variables
- Check status.yaml has edit action logged with edit description
- Request multiple edits sequentially, verify all previous text edits retained
- Verify regenerated slide saved to original file path

**Story 4.3: Edit Preservation Across Regenerations**
- Create slide with 5 text edits, regenerate layout, verify all 5 preserved
- Request layout change that removes a field, verify orphaned edit in state file
- Verify warning displayed when edit is orphaned
- Verify orphaned edit has orphanedAt timestamp and reason
- Request layout change that adds new field, verify default content used
- Multiple /edit operations, verify regenerationCount increments
- Verify state file never loses edits (even orphaned)

### Coverage of Acceptance Criteria

| Story | Total ACs | Test Method |
|-------|-----------|-------------|
| 4.1 | 6 | Command parsing + mode detection + error handling |
| 4.2 | 9 | Layout regeneration + edit preservation + state updates |
| 4.3 | 9 | Edit matching + orphan handling + state management |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No slides exist | Error: "No slide to edit. Run /build-one first." |
| State file missing | Create empty state; regenerate without edits to preserve |
| State file corrupted | Warn user; create fresh state; continue (edits lost) |
| All edits orphaned | Warn user; preserve all in orphanedEdits; suggest checking field names |
| Regeneration fails | Keep original slide; show error; offer retry |
| Invalid slide number | Error with valid range |
| Empty edit instruction | Prompt for instruction again |
| Very long edit instruction | Pass to skill; may need clarification if too vague |
| Theme.json changed since build | Warn user; regenerate with new theme (style update) |
| Deck mode, no number provided | Prompt user for slide number |
| Edit instruction is just "undo" | Not supported in MVP; explain and suggest workaround |

### Regression Tests (Epic 3 Compatibility)

| Test | Purpose |
|------|---------|
| Contenteditable still works | Click text in regenerated slide, verify editable |
| Auto-save still works | Edit text in browser, verify localStorage updated |
| data-field attributes present | Inspect regenerated HTML for all data-field attributes |
| Theme variables applied | Inspect :root for all CSS variables from theme.json |
| Slide renders at 1920x1080 | Check viewport dimensions in regenerated slide |
| Self-contained HTML | Verify no external dependencies (except fonts) |

### Definition of Done

Epic 4 is complete when:
1. `/edit` command correctly detects mode and targets appropriate slide
2. `/edit [n]` in deck mode targets the correct slide number
3. Invalid slide numbers show helpful error with valid range
4. Layout regeneration via frontend-design skill works for various instructions
5. All user text edits are preserved through layout regenerations
6. Orphaned edits are preserved in state file with warnings
7. New fields in regenerated layouts receive default content
8. status.yaml correctly logs edit operations with preserved/orphaned counts
9. All 24 acceptance criteria pass manual verification
10. Epic 3 regression tests pass (contenteditable, auto-save still work)
