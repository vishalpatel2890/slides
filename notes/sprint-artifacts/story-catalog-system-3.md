# Story 11.3: Create /sb:add-template Skill

**Status:** done

---

## User Story

As a **user**,
I want **to create new templates via `/sb:add-template` with conversational discovery**,
So that **I can expand my template library for specific use cases**.

---

## Acceptance Criteria

**AC #1:** Given I run `/sb:add-template`, when the workflow starts, then I'm warmly welcomed and asked "What kind of slide template do you need?"

**AC #2:** Given I describe a template need, when the agent explores my requirements, then it asks about:
- Content type (data visualization, text-heavy, mixed media)
- Visual elements needed (charts, diagrams, icons, columns, images)
- Visual style preferences (matches theme personality)
- Reference examples or inspiration (if available)
- Specific use cases (when would this template be used)

**AC #3:** Given discovery is complete (minimum 3-5 exchanges), when I confirm the spec summary, then:
- Template ID is generated (kebab-case from template name)
- HTML template is generated via frontend-design skill
- Template file is saved to `config/catalog/{id}.html`
- catalog.json is updated with new entry
- `source` is set to "add-template"
- `created_at` is set to current timestamp

**AC #4:** Given template generation completes, when the workflow finishes, then:
- Success message shows template ID and file path
- User is offered to open template in browser for preview
- catalog.json shows incremented template count

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `workflows/add-template/` directory (AC: #1)
- [x] Create `workflows/add-template/workflow.yaml` with standard structure (AC: #1)
- [x] Create `workflows/add-template/instructions.md` with conversational discovery flow (AC: #1, #2)
- [x] Implement warm welcome and opening question (AC: #1)
- [x] Implement deep discovery questions (content type, elements, style, examples) (AC: #2)
- [x] Implement template spec confirmation step (AC: #2)
- [x] Implement frontend-design skill invocation with full context (AC: #3)
- [x] Implement template file save to catalog/ (AC: #3)
- [x] Implement catalog.json update with new entry (AC: #3)
- [x] Implement ID generation (name → kebab-case slug) (AC: #3)
- [x] Implement browser preview offer (AC: #4)
- [x] Create `.claude/commands/sb/add-template.md` skill registration (AC: #1)
- [x] Test workflow with various template types (AC: #1, #2, #3, #4)

### Technical Summary

This story creates a new workflow for on-demand template creation. The workflow emphasizes deep conversational discovery to understand exactly what the user needs before generating.

**Conversational Flow:**
1. **Welcome:** Greet user, explain the process briefly
2. **Open question:** "What kind of slide template do you need?"
3. **Content exploration:** What will the slide display?
4. **Visual elements:** What specific elements (charts, icons, columns)?
5. **Style preferences:** How should it feel? (matches theme personality)
6. **Reference check:** Any examples or inspiration?
7. **Use case clarity:** When would you use this template?
8. **Spec confirmation:** Summary of template requirements
9. **Generation:** Invoke frontend-design skill
10. **Save & Update:** Write HTML and update catalog.json
11. **Preview offer:** Open in browser?

**Template Generation Context:**
- Pass full theme.json for brand consistency
- Include discovered requirements in prompt
- Ensure contenteditable + data-field attributes
- 1920x1080 dimensions
- CSS variables from theme

### Project Structure Notes

- **Files to create:**
  - `.slide-builder/workflows/add-template/workflow.yaml`
  - `.slide-builder/workflows/add-template/instructions.md`
  - `.claude/commands/sb/add-template.md`
- **Files to modify:**
  - `.slide-builder/config/catalog/catalog.json` (append new entry at runtime)
- **Expected test locations:** Run `/sb:add-template` and verify template created
- **Estimated effort:** 3 story points
- **Prerequisites:** Story 11.1 (catalog infrastructure exists)

### Key Code References

- Existing workflow.yaml pattern: `workflows/setup/workflow.yaml`
- Existing instructions.md pattern: `workflows/build-one/instructions.md`
- Skill registration pattern: `.claude/commands/sb/setup.md`
- Frontend-design skill invocation: `workflows/build-one/instructions.md:285-388`
- Catalog.json schema: `tech-spec-catalog.md` (Catalog Manifest Schema section)

---

## Context References

**Tech-Spec:** [tech-spec-catalog.md](../tech-spec-catalog.md) - Primary context document containing:
- Add-Template conversational flow requirements
- catalog.json schema for new entries
- Frontend-design skill integration
- Template file naming conventions

**Architecture:** N/A (follows existing slide-builder patterns)

---

## Dev Agent Record

### Context Reference

- [story-catalog-system-3.context.xml](./story-catalog-system-3.context.xml)

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

**Implementation Plan:**
1. Create workflow directory structure
2. Create workflow.yaml with catalog paths and required_skills
3. Create instructions.md with 11-step conversational discovery flow
4. Create skill registration file
5. Update CONVENTIONS.md with new command mapping

### Completion Notes

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

**Implementation Complete (2026-01-28):**
- Created complete add-template workflow with deep conversational discovery
- Instructions.md implements 11 phases: Welcome, Content Exploration, Visual Elements, Style Preferences, Reference Check, Use Case Clarity, Spec Confirmation, Generation, Save, Catalog Update, Preview Offer
- Workflow enforces minimum 3-5 exchanges before generation
- frontend-design skill invocation includes full theme context and validation checklist
- Catalog.json update includes source="add-template" and ISO timestamp
- CONVENTIONS.md updated with new command mapping

### Files Modified

**Created:**
- `.slide-builder/workflows/add-template/workflow.yaml`
- `.slide-builder/workflows/add-template/instructions.md`
- `.claude/commands/sb/add-template.md`

**Modified:**
- `.slide-builder/CONVENTIONS.md` (added command mapping and file structure)

### Test Results

✅ Test Gate PASSED by Vishal (2026-01-28)
- Workflow tested via `/sb:add-template` execution
- Conversational discovery flow verified
- Template generation and catalog update confirmed

---

## Review Notes

<!-- Will be populated during code review -->
