# Story 11.2: Refactor Setup Workflow for Catalog

**Status:** Done

---

## User Story

As a **user running /sb:setup**,
I want **the workflow to generate starter templates directly into the catalog**,
So that **I have a unified template system from the start**.

---

## Acceptance Criteria

**AC #1:** Given I run `/sb:setup` and approve the theme, when sample generation completes, then 6 templates exist in `config/catalog/`:
- title.html
- agenda.html
- process-flow.html
- comparison.html
- callout.html
- technical.html

**AC #2:** Given templates are generated, when I read catalog.json, then it contains 6 entries with:
- Unique IDs matching filenames (without .html)
- Descriptive names and descriptions
- Relevant use_cases arrays
- source: "setup"
- created_at timestamps

**AC #3:** Given setup completes, when I check status.yaml, then it reflects catalog structure:
```yaml
catalog:
  directory: .slide-builder/config/catalog/
  manifest: .slide-builder/config/catalog/catalog.json
  count: 6
  templates:
    - id: title
      name: Title Slide
    # ... etc
```

**AC #4:** Given the old directories exist, when setup completes successfully, then `config/samples/` and `config/templates/` directories are deleted

---

## Implementation Details

### Tasks / Subtasks

- [x] Modify `setup/workflow.yaml` to add catalog_path variable (AC: #1)
- [x] Modify `setup/instructions.md` Phase 4 to change output directory from samples/ to catalog/ (AC: #1)
- [x] Update template generation to create ID-based filenames (title.html not 01-title.html) (AC: #1)
- [x] Add catalog.json generation after all templates are created (AC: #2)
- [x] Generate catalog entries with all required metadata fields (AC: #2)
- [x] Define starter template metadata:
  - title: use_cases ["title", "opening", "hero", "intro"]
  - agenda: use_cases ["agenda", "list", "bullets", "overview"]
  - process-flow: use_cases ["flow", "process", "steps", "timeline"]
  - comparison: use_cases ["comparison", "versus", "before-after", "columns"]
  - callout: use_cases ["callout", "statistic", "quote", "highlight"]
  - technical: use_cases ["code", "technical", "api", "syntax"]
(AC: #2)
- [x] Update status.yaml generation to use catalog schema instead of templates schema (AC: #3)
- [x] Add cleanup step to remove config/samples/ if exists (AC: #4)
- [x] Add cleanup step to remove config/templates/ if exists (AC: #4)
- [x] Test full setup workflow end-to-end (AC: #1, #2, #3, #4)

### Technical Summary

This story refactors the setup workflow to generate templates directly into the catalog system. The key changes are:
1. Output path changes from `config/samples/` to `config/catalog/`
2. Filenames change from numbered (01-title.html) to ID-based (title.html)
3. Generates catalog.json manifest alongside template files
4. Updates status.yaml to track catalog structure
5. Removes deprecated directories

The frontend-design skill invocation remains the same; only the output handling changes.

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/setup/workflow.yaml`
  - `.slide-builder/workflows/setup/instructions.md` (Phase 4 section ~line 1276)
  - `.slide-builder/status.yaml` (schema change)
- **Files to delete (at runtime):**
  - `.slide-builder/config/samples/` (entire directory)
  - `.slide-builder/config/templates/` (entire directory)
- **Expected test locations:** Run `/sb:setup` with test brand assets
- **Estimated effort:** 3 story points
- **Prerequisites:** Story 11.1 (catalog infrastructure exists)

### Key Code References

- Setup Phase 4 (current sample generation): `workflows/setup/instructions.md:1276-1498`
- Status.yaml current templates section: `status.yaml:40-49`
- Frontend-design skill invocation pattern: `workflows/setup/instructions.md:1320`

---

## Context References

**Tech-Spec:** [tech-spec-catalog.md](../tech-spec-catalog.md) - Primary context document containing:
- Catalog.json schema with all metadata fields
- Starter template definitions (6 templates)
- status.yaml schema migration
- Cleanup/deletion requirements

**Architecture:** N/A (follows existing slide-builder patterns)

---

## Dev Agent Record

### Context Reference

- [story-catalog-system-2.context.xml](./story-catalog-system-2.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan (2026-01-28):**
1. Add catalog_path and catalog_manifest variables to workflow.yaml, remove samples_dir/templates_dir
2. Update Phase 4 slide_specs to include id, name, description, use_cases for each template
3. Change output paths from config/samples/ to config/catalog/
4. Add catalog.json generation step in Phase 4.3 with full schema
5. Update status.yaml schema from `templates:` to `catalog:` structure
6. Replace Phase 6.1 copy-to-templates with cleanup of deprecated directories
7. Update Phase 5.5 regeneration to use new catalog paths
8. Update final status output in Phase 6.4

### Completion Notes

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

**Tasks 1-9 Complete:**
- Modified `setup/workflow.yaml`: Added `catalog_path` and `catalog_manifest` variables, removed deprecated `samples_dir` and `templates_dir`
- Modified `setup/instructions.md` Phase 4: Changed output directory to `config/catalog/`, updated slide_specs with full metadata (id, name, description, use_cases)
- Updated template filenames from numbered (01-title.html) to ID-based (title.html, agenda.html, etc.)
- Added catalog.json generation in Phase 4.3 with complete schema per tech-spec
- Updated all status.yaml outputs to use `catalog:` structure instead of `templates:`
- Added cleanup step in Phase 6.1 to remove config/samples/ and config/templates/ if they exist
- Updated Phase 5.5 regeneration loop to use catalog paths
- Updated final completion output to show catalog templates

### Files Modified

- `.slide-builder/workflows/setup/workflow.yaml` - Added catalog_path, removed samples_dir/templates_dir
- `.slide-builder/workflows/setup/instructions.md` - Major refactor of Phase 4, 5.5, 6.1, 6.4

### Test Results

✅ Test Gate PASSED by Vishal (2026-01-28)

---

## Review Notes

<!-- Will be populated during code review -->
