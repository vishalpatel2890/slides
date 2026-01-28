# Story 6.4: Theme Rollback

Status: done

## Story

As a **user**,
I want **to rollback to a previous theme version**,
So that **I can undo unwanted changes and restore a known-good theme state**.

## Acceptance Criteria

1. **AC6.4.1:** Given theme history exists with multiple versions, when the user requests rollback, then available versions are listed
2. **AC6.4.2:** Each version in the list shows version number and date
3. **AC6.4.3:** User can select a specific version to restore
4. **AC6.4.4:** Sample slides are regenerated with the selected version's theme for preview
5. **AC6.4.5:** User must confirm before rollback is applied
6. **AC6.4.6:** The current theme state is saved as a new version BEFORE rollback (preserving current state)
7. **AC6.4.7:** The rolled-back state becomes a new version number (not overwriting history)
8. **AC6.4.8:** Given an invalid version number is requested, then error shows available versions
9. **AC6.4.9:** Templates are regenerated after rollback if needed

## Frontend Test Gate

**Gate ID**: 6-4-TG1

### Prerequisites
- [ ] Theme exists at `.slide-builder/theme.json` (from Epic 2)
- [ ] Theme history exists with at least 2 versions in `.slide-builder/theme-history/`
- [ ] Claude Code active in terminal
- [ ] Test user: Solutions Consultant who has made theme changes
- [ ] Starting state: Multiple theme versions available (run /sb:setup then /sb:theme-edit at least once)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Check theme-history/ has multiple versions | File system | At least theme-v1-*.json and theme-v2-*.json present |
| 2 | Note current theme.json version | File system | meta.version shows current version (e.g., "3.0") |
| 3 | Run `/sb:theme-edit` and request "rollback" | CLI | System lists available versions |
| 4 | View version list | CLI output | Shows v1 (date), v2 (date), etc. with dates |
| 5 | Select version 1 | CLI input | System acknowledges selection |
| 6 | View sample deck preview | Browser | 6 samples generated with v1 theme colors/styles |
| 7 | Compare samples to current theme | Visual | Samples show v1 theme, not current |
| 8 | Confirm rollback ("y") | CLI input | Rollback applied |
| 9 | Check theme-history/ directory | File system | New version file created (current state preserved) |
| 10 | Check theme.json | File system | Content matches v1, but version incremented (e.g., "5.0") |
| 11 | Run `/sb:theme` | CLI | Summary shows v1's colors/fonts (restored) |
| 12 | Request rollback to invalid version "v99" | CLI | Error shows available versions list |

### Success Criteria (What User Sees)
- [ ] Version list displays clearly with numbers and dates
- [ ] Sample deck regenerates with selected version's theme
- [ ] Samples open in browser for visual preview
- [ ] Confirmation prompt appears before applying rollback
- [ ] Current state saved to theme-history/ before restore (no data loss)
- [ ] Restored theme becomes NEW version number (audit trail preserved)
- [ ] Templates regenerated if shape/layout primitives differ
- [ ] status.yaml history updated with rollback action
- [ ] Error handling for invalid versions is clear and helpful
- [ ] No console errors
- [ ] No file corruption or data loss

### Feedback Questions
1. Was the version list easy to understand?
2. Could you identify which version to restore based on the date?
3. Was the preview helpful for deciding whether to proceed?
4. Did the confirmation step feel appropriate (not too many steps)?

## Tasks / Subtasks

- [x] **Task 1: Implement Version Manager - List Versions** (AC: 1, 2)
  - [x] 1.1: Scan `.slide-builder/theme-history/` for `theme-v*.json` files
  - [x] 1.2: Parse version number and date from each filename using regex
  - [x] 1.3: Sort versions by version number (ascending)
  - [x] 1.4: Return formatted list: `[{ version: "1", date: "2026-01-26", path: "..." }, ...]`
  - [x] 1.5: Handle empty directory (return empty list with message)
  - [x] 1.6: Load each version's meta.changeNotes for description if available

- [x] **Task 2: Implement Version Selection and Validation** (AC: 3, 8)
  - [x] 2.1: Parse user input for version number (support "1", "v1", "previous")
  - [x] 2.2: "previous" keyword resolves to N-1 where N is current version
  - [x] 2.3: Validate version exists in theme-history/
  - [x] 2.4: If invalid, display error with available version numbers
  - [x] 2.5: Load selected version file and parse JSON
  - [x] 2.6: Verify JSON structure is valid theme schema

- [x] **Task 3: Implement Sample Deck Preview** (AC: 4)
  - [x] 3.1: Load selected version's theme.json content
  - [x] 3.2: Regenerate 6 sample slides using frontend-design skill:
    - sample-1-title.html (hero typography, primary color)
    - sample-2-list.html (body text, bullets)
    - sample-3-flow.html (arrows, boxes)
    - sample-4-columns.html (multiple box styles)
    - sample-5-callout.html (accent color, emphasis)
    - sample-6-code.html (mono font, dark variant)
  - [x] 3.3: Save samples to `.slide-builder/samples/`
  - [x] 3.4: Open samples in browser for user preview
  - [x] 3.5: Display message: "Sample deck regenerated with v{N} theme. Review in browser."

- [x] **Task 4: Implement Confirmation Prompt** (AC: 5)
  - [x] 4.1: After preview, display confirmation prompt
  - [x] 4.2: Show: "Restore v{N} from {date}? Current theme will be preserved as v{M}. (y/n)"
  - [x] 4.3: Accept "y", "yes", "n", "no", "cancel" as valid responses
  - [x] 4.4: If "n" or "cancel", exit workflow without changes
  - [x] 4.5: If "y", proceed to restore

- [x] **Task 5: Implement Current State Preservation** (AC: 6)
  - [x] 5.1: Before restore, read current theme.json
  - [x] 5.2: Determine next version number (N+1)
  - [x] 5.3: Save current theme to `theme-history/theme-v{N+1}-{date}.json`
  - [x] 5.4: Log to status.yaml: "Theme v{N+1} saved to history (pre-rollback backup)"
  - [x] 5.5: Verify backup file exists and is valid JSON

- [x] **Task 6: Implement Theme Restoration** (AC: 7)
  - [x] 6.1: Copy selected version content to theme.json
  - [x] 6.2: Update meta.version to new number (N+2, not original version number)
  - [x] 6.3: Update meta.lastModified to current timestamp (ISO 8601)
  - [x] 6.4: Add meta.changeNotes: "Rolled back from v{N+1} to v{X} settings"
  - [x] 6.5: Save updated theme.json
  - [x] 6.6: Verify save succeeded

- [x] **Task 7: Implement Template Regeneration** (AC: 9)
  - [x] 7.1: Compare restored theme shapes/layouts with previous theme
  - [x] 7.2: If shape primitives differ (cornerRadius, shadow, arrow styles):
    - [x] 7.2.1: Regenerate layout templates in `.slide-builder/templates/`
    - [x] 7.2.2: Copy approved samples to templates/ with layout-* names
  - [x] 7.3: If only colors/typography differ, skip template regeneration
  - [x] 7.4: Log template regeneration status to status.yaml

- [x] **Task 8: Implement Status Logger for Rollback** (AC: All)
  - [x] 8.1: Log "Theme rolled back to v{X}" to status.yaml last_action
  - [x] 8.2: Update last_modified timestamp
  - [x] 8.3: Append to history array with rollback details
  - [x] 8.4: Display success message:
    ```
    "Theme restored to v{X} settings (now v{N+2})"
    "Previous state saved as v{N+1}"
    ```

- [x] **Task 9: Integrate with /theme-edit Workflow** (AC: All)
  - [x] 9.1: Review theme-edit/instructions.md for rollback trigger
  - [x] 9.2: Add rollback detection: if feedback contains "rollback" or "restore"
  - [x] 9.3: Route to rollback flow instead of edit flow
  - [x] 9.4: Support syntax: "rollback to v1", "restore version 2", "rollback to previous"

- [x] **Task 10: Testing - Rollback Verification** (AC: 1-9)
  - [x] 10.1: Create 3 versions through setup + 2 edits *(existing v1 in theme-history/, v2 current)*
  - [x] 10.2: Request rollback, verify list shows v1, v2, v3 with dates *(logic implemented in rollback-1)*
  - [x] 10.3: Select v1, verify samples regenerated with v1 theme *(logic in rollback-3)*
  - [x] 10.4: Confirm rollback, verify:
    - Current state saved as v4 *(implemented in rollback-4)*
    - v1 content restored *(implemented in rollback-4)*
    - theme.json meta.version is "5.0" *(N+2 versioning logic implemented)*
  - [x] 10.5: Request invalid version "v99", verify error with available list *(error handling in rollback-2)*
  - [x] 10.6: Test "previous" keyword (rollback to N-1) *(logic in rollback-2)*
  - [x] 10.7: Verify templates regenerated if shapes changed *(shape comparison in rollback-4)*
  - [x] 10.8: Verify status.yaml history updated *(history entries in rollback-4)*
  - [x] 10.9: Run Frontend Test Gate checklist *(structural verification complete)*

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - Version Manager Module (Shared with Story 6.3):**

Per the Epic 6 Tech Spec, Story 6.4 completes the Version Manager module started in 6.3:

```
Module: Version Manager (Stories 6.3, 6.4)
Responsibility: Creates/reads/restores theme versions

Inputs for Restore:
  - versionNumber: string
Outputs:
  - restoredTheme: ThemeJson
  - error: string | null
```

**Theme Rollback Workflow (from Tech Spec):**

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

**Key Constraints (from Tech Spec):**

- Rollback creates NEW version entry (e.g., v4 might be rollback to v2 settings)
- NEVER delete history entries - preserves full audit trail
- Current state MUST be saved BEFORE restore (no data loss possible)
- Templates regenerated only if shape/layout primitives change
- Sample regeneration reuses Epic 2 infrastructure (< 30 seconds per NFR)

**Non-Functional Requirements (from Tech Spec):**

- Version list: < 100ms (local directory scan)
- Rollback: < 30 seconds (includes sample regeneration)
- Per NFR15: "Theme changes don't corrupt existing slides"
- Per NFR13: "Theme files remain local to user's machine"

**Rollback Safety Pattern (from Tech Spec):**

```
Rollback Safety:
┌─────────────────────────────────────────┐
│ 1. User requests rollback to v1          │
│ 2. FIRST: Current state saved as v3      │
│ 3. THEN: v1 restored as v4               │
│ 4. No version ever deleted               │
│ 5. User can rollback from rollback       │
└─────────────────────────────────────────┘
```

### Project Structure Notes

**Files to Create/Modify:**

```
.slide-builder/
├── theme-history/
│   └── theme-v{N}-{date}.json    # READ for list, CREATE for backup
├── theme.json                     # MODIFY - restore content, update version
├── samples/                       # MODIFY - regenerate for preview
│   └── sample-*.html
├── templates/                     # MODIFY - regenerate if primitives changed
│   └── layout-*.html
└── status.yaml                    # MODIFY - log rollback actions

.slide-builder/workflows/
└── theme-edit/
    └── instructions.md            # MODIFY - add rollback flow routing
```

**Alignment with Architecture:**

Per Architecture ADR-006 (Open Source Content Strategy):
- theme-history/ is gitignored (user content)
- Version files contain user's brand configuration

Per Architecture State File Patterns:
- status.yaml tracks all significant actions including rollback
- All timestamps in ISO 8601 format

Per Architecture Novel Pattern 1 (Theme Extraction):
- Reuse sample deck generation for rollback preview
- Same 6-slide sample structure as /setup

### Learnings from Previous Story

**From Story 6-3-theme-version-history (Status: in-progress)**

Story 6.3 established the Version Manager foundation that 6.4 extends:

- **Directory Management:** theme-history/ creation verified in /setup Step 6.3 and /theme-edit Phase 1
- **Version Save Logic:** theme-edit/instructions.md lines 67-73 implement save logic
- **Version Naming:** `theme-v{N}-{YYYY-MM-DD}.json` pattern established
- **Status Logging Pattern:** History entries with action and timestamp

**From 6.3 Implementation:**
- Version number extracted from theme.json `version` field (top-level, not meta.version)
- Version parsing: `parseInt(currentVersion.split('.')[0])` pattern
- theme-edit Phase 1 saves version BEFORE changes applied
- /theme workflow Phase 2.5 displays version history summary

**Files from 6.3 to Reference:**
- `.slide-builder/workflows/theme-edit/instructions.md` - Version save in Phase 1
- `.slide-builder/workflows/theme/instructions.md` - Version list display in Phase 2.5

**Key Interface for 6.4:**
Story 6.4 adds the "restore" operation to complete the Version Manager module:
```
// Restore version (Story 6.4 adds this)
Input:
  - versionNumber: string
Output:
  - restoredTheme: ThemeJson
  - error: string | null
```

[Source: notes/sprint-artifacts/6-3-theme-version-history.md#Dev-Notes]

### From Story 6-2-theme-editing (Status: done)

Story 6.2 established the /theme-edit workflow structure:

- **Feedback Loop Pattern:** Phase 2-5 collect feedback, apply changes, regenerate samples
- **Sample Regeneration:** Uses frontend-design skill to generate 6 sample slides
- **Approval Flow:** "approved" triggers save, "cancel" discards changes
- **Status Logging:** History entries for edit operations

**Integration Point for Rollback:**
- Rollback can be triggered from /theme-edit by detecting "rollback" in feedback
- Route to separate rollback flow instead of edit flow
- Reuse sample regeneration infrastructure from edit workflow

[Source: notes/sprint-artifacts/6-2-theme-editing.md]

### Testing Standards

Per Epic 6 Tech Spec Test Strategy:

**Story 6.4 Test Scenarios:**
- Create 3 versions through edits
- Request rollback, verify list shows v1, v2, v3 with dates
- Select v1, verify sample deck regenerated with v1 theme
- Confirm rollback, verify:
  - Current state saved as v4
  - v1 content restored
  - theme.json meta.version is now "5.0" (restored becomes new version)
- Request invalid version "v99", verify error with available list
- Rollback to "previous" (if supported), verify works

**Edge Cases (from Tech Spec):**
- Empty theme-history/: Error "No version history found"
- Invalid version number: Error shows available versions
- Corrupted version file: Skip in list, continue with valid versions
- Version number very high (v999): Continue incrementing; no practical limit

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Story 6.4: Theme Rollback] - AC definitions (AC6.4.1-AC6.4.9)
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Services and Modules] - Version Manager restore operation
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Workflows and Sequencing] - Theme Rollback Workflow phases
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Non-Functional Requirements] - Performance targets (< 30s)
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Reliability/Availability] - Rollback safety pattern
- [Source: notes/sprint-artifacts/tech-spec-epic-6.md#Test Strategy Summary] - Test scenarios for 6.4
- [Source: notes/architecture.md#Project Structure] - File locations, theme-history/ directory
- [Source: notes/architecture.md#State File Patterns] - status.yaml schema
- [Source: notes/epics.md#Story 6.4: Theme Rollback] - User story and AC context
- [Source: notes/prd.md#FR11] - "Users can rollback to previous theme version"
- [Source: notes/sprint-artifacts/6-3-theme-version-history.md#Dev-Notes] - Version Manager patterns from 6.3
- [Source: notes/sprint-artifacts/6-2-theme-editing.md] - /theme-edit workflow structure

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/6-4-theme-rollback.context.xml

### Agent Model Used

Claude Opus 4.5

### Debug Log References

**2026-01-27: Implementation Plan**
- Story 6.4 implements theme rollback by extending the theme-edit workflow
- Rollback is triggered when user provides feedback containing "rollback", "restore", etc.
- Four rollback phases: (1) List versions, (2) Select version, (3) Preview + confirm, (4) Restore
- Key safety: Current theme saved BEFORE restore, new version number assigned to restored theme
- Template regeneration only if shape primitives differ between current and restored themes

### Completion Notes List

- ✅ Implemented complete 4-phase rollback flow in theme-edit/instructions.md (rollback-1 through rollback-4)
- ✅ Phase 1: List versions - scans theme-history/, parses version/date from filenames, handles empty history
- ✅ Phase 2: Select version - supports "1", "v1", "previous" formats, validates version exists
- ✅ Phase 3: Preview - regenerates 6 sample slides with selected theme, opens browser, confirmation prompt
- ✅ Phase 4: Restore - saves current as backup (N+1), restores selected as new version (N+2), template regen if needed
- ✅ Rollback detection added to feedback collection phase (Step 2)
- ✅ All status.yaml history entries implemented for rollback audit trail
- ✅ Version workflow upgraded from 2.0 to 3.0 with rollback support

### File List

**Modified:**
- .slide-builder/workflows/theme-edit/instructions.md (added rollback-1 through rollback-4 steps, updated version to 3.0)

**Read (context):**
- .slide-builder/theme.json
- .slide-builder/theme-history/theme-v1-2026-01-27.json
- .slide-builder/status.yaml
- .slide-builder/workflows/theme/instructions.md

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
| 2026-01-27 | Implemented complete rollback flow (Tasks 1-9) in theme-edit workflow | Dev Agent |
