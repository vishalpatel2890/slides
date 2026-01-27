# Story 2.1: Brand Asset Input Collection

Status: done

## Story

As a **Solutions Consultant**,
I want **to provide my brand assets (website URL, PDF, images) and a brief description**,
So that **the system can extract my brand's visual DNA**.

## Acceptance Criteria

1. **AC2.1.1:** Given the user runs `/setup`, when prompted for brand inputs, then they can provide: website URL (optional), PDF file paths (optional), image file paths (optional), brief brand description (required)
2. **AC2.1.2:** At least one visual asset (URL, PDF, or image) must be provided alongside the description
3. **AC2.1.3:** The system confirms all inputs before proceeding to analysis
4. **AC2.1.4:** Given a website URL is provided, when processing inputs, then the system fetches and analyzes the page via WebFetch
5. **AC2.1.5:** Given PDF or image files are provided, when processing inputs, then the system analyzes them via Claude Vision

## Frontend Test Gate

**Gate ID**: 2-1-TG1

### Prerequisites
- [ ] Epic 1 complete (`.slide-builder/` structure exists with workflows and skill registrations)
- [ ] Claude Code CLI running
- [ ] At least one test brand asset available (website URL, PDF, or image file)
- [ ] Starting state: `/sb:setup` command is registered and invokes setup workflow

### Test Steps (Manual CLI Testing)
| Step | User Action | Where (CLI) | Expected Result |
|------|-------------|-------------|-----------------|
| 1 | Type `/sb:setup` in Claude Code | Claude Code CLI | Setup workflow begins, prompts for brand inputs |
| 2 | Enter a website URL when prompted | Claude Code CLI | URL is accepted, system acknowledges |
| 3 | Press Enter to skip PDF input | Claude Code CLI | System allows skip (optional field) |
| 4 | Press Enter to skip image input | Claude Code CLI | System allows skip (optional field) |
| 5 | Enter brand description when prompted | Claude Code CLI | Description captured (required field) |
| 6 | Review confirmation of all inputs | Claude Code CLI | System displays summary of all inputs |
| 7 | Confirm to proceed | Claude Code CLI | System proceeds to brand analysis phase |

### Success Criteria (What User Sees)
- [ ] `/sb:setup` invokes the setup workflow successfully
- [ ] All four input types are prompted (URL, PDF, images, description)
- [ ] Optional inputs (URL, PDF, images) can be skipped
- [ ] Required input (description) cannot be skipped
- [ ] At least one visual asset required validation works
- [ ] Input confirmation shows all provided values before proceeding
- [ ] WebFetch is called for website URLs
- [ ] Claude Vision is used for PDF/image analysis
- [ ] No console errors during input collection

### Feedback Questions
1. Were the input prompts clear about what was optional vs required?
2. Did the confirmation step show all inputs accurately?
3. Was the error message helpful when trying to skip all visual assets?
4. Any friction in the input collection flow?

## Tasks / Subtasks

- [x] **Task 1: Implement Asset Collector prompt sequence** (AC: 1)
  - [x] 1.1: Add step in setup workflow to prompt for website URL (optional)
  - [x] 1.2: Add step to prompt for PDF file paths (optional, accepts comma-separated list)
  - [x] 1.3: Add step to prompt for image file paths (optional, accepts comma-separated list)
  - [x] 1.4: Add step to prompt for brand description (required, cannot be empty)

- [x] **Task 2: Implement input validation logic** (AC: 2)
  - [x] 2.1: Validate that at least one visual asset is provided (URL OR PDF OR image)
  - [x] 2.2: If all visual assets skipped, display error and re-prompt
  - [x] 2.3: Validate file paths exist for PDF and image inputs
  - [x] 2.4: Validate URL format for website input

- [x] **Task 3: Implement input confirmation step** (AC: 3)
  - [x] 3.1: Display summary of all collected inputs
  - [x] 3.2: Show which inputs were provided vs skipped
  - [x] 3.3: Ask user to confirm before proceeding to analysis
  - [x] 3.4: Allow user to go back and modify inputs if needed

- [x] **Task 4: Implement WebFetch integration for websites** (AC: 4)
  - [x] 4.1: Call WebFetch with provided URL to retrieve page content
  - [x] 4.2: Handle WebFetch errors gracefully (network failures, 404, etc.)
  - [x] 4.3: Store WebFetch result for CSS/style extraction in next story

- [x] **Task 5: Implement Claude Vision integration for PDF/images** (AC: 5)
  - [x] 5.1: Use Read tool to load PDF files and pass to Claude Vision analysis
  - [x] 5.2: Use Read tool to load image files and pass to Claude Vision analysis
  - [x] 5.3: Handle file read errors gracefully (file not found, corrupted)
  - [x] 5.4: Store vision analysis results for primitive extraction in next story

- [x] **Task 6: Update setup workflow instructions.md** (AC: 1-5)
  - [x] 6.1: Add Phase 1 steps for asset collection to instructions.md
  - [x] 6.2: Add validation actions for input requirements
  - [x] 6.3: Add confirmation checkpoint before proceeding
  - [x] 6.4: Add error handling actions for invalid inputs
  - [x] 6.5: Add WebFetch and Vision analysis actions

- [x] **Task 7: Testing and validation** (AC: 1-5)
  - [x] 7.1: Test with website URL only - verify WebFetch called
  - [x] 7.2: Test with PDF only - verify Vision analysis runs
  - [x] 7.3: Test with image only - verify Vision analysis runs
  - [x] 7.4: Test with description only - verify error and re-prompt
  - [x] 7.5: Test with all inputs - verify all captured and confirmed
  - [x] 7.6: Test confirmation step allows proceed or go back

## Dev Notes

### Architecture Patterns and Constraints

**From Architecture Pattern 1 (Theme Extraction Pipeline):**
```
Input Sources:
├── Website URL → WebFetch → HTML/CSS analysis
├── PDF files → Claude vision → Visual analysis
├── Image files → Claude vision → Color/style extraction
└── User description → Context for interpretation
```

**Key Architecture Constraints:**
- Per ADR-001: 100% alignment with BMAD workflow pattern
- Per FR1: Users can create a new theme by providing brand assets (website URL, PDF, images) and a brief description
- Per PRD "Theme Setup UX Philosophy": AI does the work, user provides inputs once
- All analysis performed locally via Claude; no assets uploaded to external services (NFR12, NFR13)

**Asset Collector Module Spec (from tech-spec-epic-2.md):**
- Prompts user for website URL (optional), PDF paths (optional), image paths (optional), brand description (required)
- Validates at least one visual asset provided
- Stores source list for theme.json meta.sources
- Confirms all inputs before proceeding to analysis

**Input Validation Requirements:**
- Website URL: Optional, but if provided must be valid URL format
- PDF file paths: Optional, must be valid file paths that exist
- Image file paths: Optional, must be valid file paths that exist
- Brand description: Required, cannot be empty
- At least ONE of (URL, PDF, images) must be provided

### Project Structure Notes

Per Architecture, setup workflow is at:
```
.slide-builder/
├── workflows/
│   └── setup/
│       ├── workflow.yaml
│       └── instructions.md   # Update this with Phase 1 steps
```

**State tracking for collected inputs:**
- Input sources will be stored in theme.json meta.sources
- Workflow status tracked in `.slide-builder/status.yaml`

### Learnings from Previous Story

**From Story 1-4-slash-command-registration (Status: done)**

- **Skills registered at**: `.claude/commands/sb/` - `/sb:setup` already registered and working
- **Workflow pattern**: workflow.yaml + instructions.md per BMAD pattern
- **Commands use `sb:` prefix** per Claude Code skill naming convention
- **CONVENTIONS.md**: Documents all command-to-workflow mappings
- **ε Test Gate PASSED**: Command registration verified working

**Key Interface for Asset Collection:**
- `/sb:setup` triggers setup workflow execution
- Setup workflow reads `.slide-builder/workflows/setup/workflow.yaml`
- Instructions in `.slide-builder/workflows/setup/instructions.md` execute step-by-step
- This story implements Phase 1 of the setup workflow

[Source: notes/sprint-artifacts/1-4-slash-command-registration.md#Dev-Agent-Record]

### Testing Standards

Per tech spec Test Strategy:
- **Unit test:** Each input type can be provided or skipped correctly
- **Integration test:** Full input collection flow with all asset types
- **Edge cases:** Only description provided (should fail), invalid file paths, WebFetch failures

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story 2.1: Brand Asset Input Collection] - Acceptance criteria definitions
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Services and Modules] - Asset Collector module spec
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Workflows and Sequencing] - Phase 1 Asset Collection flow
- [Source: notes/architecture.md#Pattern 1: Theme Extraction Pipeline] - Input source processing pattern
- [Source: notes/epics.md#Story 2.1: Brand Asset Input Collection] - User story and AC definitions
- [Source: notes/prd.md#Theme Setup UX Philosophy] - Core UX principles for theme setup

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/2-1-brand-asset-input-collection.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**2026-01-26 - Implementation Plan:**
- Task 1-6: Update .slide-builder/workflows/setup/instructions.md with complete Phase 1 implementation
- Step 1: Welcome message and initialization
- Step 1.1-1.3: Individual input prompts (URL, PDF, images) with validation
- Step 1.4: Validation that at least one visual asset provided
- Step 1.5: Brand description prompt (required)
- Step 1.6: Confirmation display with modify/continue/cancel options
- Step 1.7-1.9: Asset analysis via WebFetch and Claude Vision
- Step 1.10: Summary of collected assets
- All steps follow BMAD workflow pattern with <ask>, <check>, <action>, <goto> tags

### Completion Notes List

- Implemented complete Phase 1 (Asset Collection) in setup workflow instructions.md
- Steps 1-1.10 cover: welcome, URL input, PDF input, image input, validation, description, confirmation, WebFetch analysis, Vision analysis, summary
- All steps follow BMAD workflow XML pattern with proper <ask>, <check>, <action>, <goto> tags
- Validation enforces: at least one visual asset required, description required, URL format check, file existence check
- Confirmation step allows modify/continue/cancel with proper flow control
- Error handling includes graceful fallback when WebFetch or Read fails
- Phase 2-6 placeholders preserved for future stories (2.2-2.5)
- ✅ Test Gate PASSED by Vishal (2026-01-26)

### Story Completion
**Completed:** 2026-01-26
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

| Status | File Path |
|--------|-----------|
| MODIFIED | .slide-builder/workflows/setup/instructions.md |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-26 | Story drafted from create-story workflow | SM Agent |
| 2026-01-26 | Implementation complete - Phase 1 asset collection in instructions.md | Dev Agent |
| 2026-01-26 | Test Gate PASSED - Status: review | Dev Agent |
| 2026-01-26 | Story marked done - Definition of Done complete | Dev Agent |
