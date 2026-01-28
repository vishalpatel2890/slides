# Story 3: Update Documentation

**Status:** Draft

---

## User Story

As a **Slide Builder contributor**,
I want **documentation to reflect the new config/ structure**,
So that **the project structure is accurately documented**.

---

## Acceptance Criteria

**Given** the config folder restructure is complete and all workflows updated
**When** I read `notes/architecture.md`
**Then** the project structure section shows the new config/ folder with its contents

**And** `.gitignore` includes a comment explaining the config/ folder purpose ("Zip to share your brand")
**And** `.slide-builder/CONVENTIONS.md` is updated if it references the old paths
**And** the documentation accurately reflects the current file structure

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 3.1:** Update `notes/architecture.md` - Project Structure section (lines 37-101)
  - Add config/ folder to the tree diagram
  - Update descriptions to reflect new locations
- [ ] **Task 3.2:** Verify `.gitignore` has descriptive comment for config/
- [ ] **Task 3.3:** Review `.slide-builder/CONVENTIONS.md` for any path references that need updating
- [ ] **Task 3.4:** Verify the new structure matches documentation by running `tree .slide-builder/`
- [ ] **Task 3.5:** Commit: "docs: update architecture for config folder"

### Technical Summary

Documentation updates to ensure the project structure is accurately documented. The architecture.md file has a detailed project structure section that needs to reflect the new config/ folder organization.

### Project Structure Notes

- **Files to modify:**
  - `notes/architecture.md` (lines 37-101)
  - `.slide-builder/CONVENTIONS.md` (if it references paths)
- **Expected test locations:** Manual review of documentation
- **Prerequisites:** Stories 1 and 2 complete

### Key Code References

**architecture.md Project Structure - Update from:**
```
.slide-builder/
├── workflows/
├── templates/
├── samples/
├── theme.json
├── theme-history/
├── status.yaml
├── deck/
├── single/
└── credentials/
```

**architecture.md Project Structure - Update to:**
```
.slide-builder/
├── config/                         # Shareable brand assets (zip to share)
│   ├── theme.json                  # Brand primitives
│   ├── theme-history/              # Version snapshots
│   ├── samples/                    # Sample slides demonstrating theme
│   └── templates/                  # Layout templates
├── workflows/                      # Core framework (versioned)
├── status.yaml                     # Runtime session state
├── deck/                           # User deck workspace
├── single/                         # User single-slide workspace
└── credentials/                    # OAuth tokens (gitignored)
```

---

## Context References

**Tech-Spec:** [tech-spec-config-folder.md](../tech-spec-config-folder.md) - Primary context document containing:

- Final directory structure
- Documentation update requirements

**Architecture:** [architecture.md](../architecture.md) - Main file to update

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
