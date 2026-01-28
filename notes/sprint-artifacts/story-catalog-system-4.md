# Story 11.4: Update Dependent Workflows for Catalog

**Status:** done

---

## User Story

As a **system**,
I want **build-one, plan-one, plan-deck, and edit workflows to use the catalog**,
So that **template selection is metadata-driven and consistent**.

---

## Acceptance Criteria

**AC #1:** Given I run `/sb:build-one` with a template type (e.g., "layout-title"), when the workflow selects a template, then it:
- Reads `config/catalog/catalog.json`
- Matches against template `id` first (exact match)
- Falls back to `use_cases` array match if no ID match
- Loads the matched template HTML file from catalog/

**AC #2:** Given I run `/sb:plan-one`, when I'm prompted to select a template, then:
- Available templates are read from catalog.json
- Each template shows name and description
- use_cases are used for intelligent suggestions

**AC #3:** Given I run `/sb:plan-deck`, when templates are suggested for each slide, then:
- Suggestions reference catalog entry IDs
- Template names and descriptions are used in output
- Custom option always available for non-catalog needs

**AC #4:** Given I run `/sb:edit`, when template context is needed, then:
- Reads catalog.json to understand available templates
- Can reference template patterns for layout changes

**AC #5:** Given a template type has no catalog match (ID or use_cases), when selection fails, then:
- Falls back to custom generation via frontend-design skill
- Logs "No matching catalog template, using custom generation"

---

## Implementation Details

### Tasks / Subtasks

- [x] Add `catalog_path` and `catalog_manifest` variables to `build-one/workflow.yaml` (AC: #1)
- [x] Modify `build-one/instructions.md` template mapping section to read catalog.json (AC: #1)
- [x] Implement catalog matching algorithm: ID → use_cases → fallback (AC: #1, #5)
- [x] Remove hardcoded template-to-file mappings in build-one (AC: #1)
- [x] Add `catalog_path` variable to `plan-one/workflow.yaml` (AC: #2)
- [x] Modify `plan-one/instructions.md` to display templates from catalog.json (AC: #2)
- [x] Add `catalog_path` variable to `plan-deck/workflow.yaml` (AC: #3)
- [x] Modify `plan-deck/instructions.md` template suggestions to use catalog (AC: #3)
- [x] Add `catalog_path` variable to `edit/workflow.yaml` (AC: #4)
- [x] Modify `edit/instructions.md` to reference catalog for template awareness (AC: #4)
- [x] Implement fallback logging when no catalog match found (AC: #5)
- [x] Test build-one with each starter template ID (AC: #1)
- [x] Test build-one with use_case matching (e.g., "opening" → title template) (AC: #1)
- [x] Test build-one fallback to custom generation (AC: #5)
- [x] Test plan-one template display (AC: #2)
- [x] Test plan-deck template suggestions (AC: #3)

### Technical Summary

This story updates all workflows that interact with templates to use the new catalog system. The key change is replacing hardcoded template mappings with dynamic catalog.json lookups.

**Catalog Matching Algorithm (for build-one):**
```
1. Read catalog.json templates array
2. If requested template matches any template.id exactly → use that template
3. Else, search template.use_cases arrays for match
   - Score by relevance (exact match > partial match)
   - Select highest-scoring template
4. If no match → fall back to custom generation via frontend-design skill
5. Log the selection decision
```

**Variable Updates:**
Each workflow.yaml needs these new variables:
```yaml
catalog_path: "{project-root}/.slide-builder/config/catalog"
catalog_manifest: "{catalog_path}/catalog.json"
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/build-one/workflow.yaml`
  - `.slide-builder/workflows/build-one/instructions.md` (template mapping section ~line 161)
  - `.slide-builder/workflows/plan-one/workflow.yaml`
  - `.slide-builder/workflows/plan-one/instructions.md`
  - `.slide-builder/workflows/plan-deck/workflow.yaml`
  - `.slide-builder/workflows/plan-deck/instructions.md`
  - `.slide-builder/workflows/edit/workflow.yaml`
  - `.slide-builder/workflows/edit/instructions.md`
- **Expected test locations:** Run each workflow and verify catalog integration
- **Estimated effort:** 2 story points
- **Prerequisites:** Story 11.1 (catalog exists), Story 11.2 (catalog populated)

### Key Code References

- Current build-one template mapping: `workflows/build-one/instructions.md:161-207`
- Current plan-one template section: `workflows/plan-one/instructions.md`
- Current plan-deck template suggestions: `workflows/plan-deck/instructions.md`
- Current edit template awareness: `workflows/edit/instructions.md`
- Workflow.yaml variable pattern: `workflows/setup/workflow.yaml:6-15`

---

## Context References

**Tech-Spec:** [tech-spec-catalog.md](../tech-spec-catalog.md) - Primary context document containing:
- Catalog discovery algorithm
- Workflow integration points
- Variable definitions for workflow.yaml files
- Fallback behavior requirements

**Architecture:** N/A (follows existing slide-builder patterns)

---

## Dev Agent Record

### Context Reference

- [11-4-update-dependent-workflows.context.xml](./11-4-update-dependent-workflows.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**Implementation Plan (2026-01-28):**
1. Add catalog_path and catalog_manifest variables to all 4 workflow.yaml files
2. Update instructions.md files to implement catalog matching algorithm
3. Replace hardcoded template mappings with catalog-driven lookups
4. Add fallback logging for unmatched templates
5. Preserve backward compatibility with legacy_template_mapping sections

### Completion Notes

**Implementation Complete (2026-01-28):**
- All 4 workflows updated with catalog_path and catalog_manifest variables
- build-one/instructions.md: Implemented catalog matching algorithm (ID → use_cases → fallback)
- plan-one/instructions.md: Updated Phase 3 to read templates from catalog.json
- plan-deck/instructions.md: Updated Step 3 to use catalog use_cases for slide template suggestions
- edit/instructions.md: Added catalog loading in Phase 5A for template pattern awareness
- Hardcoded template_mapping sections replaced with legacy_template_mapping for backward compatibility
- Fallback logging message implemented: "No matching catalog template, using custom generation"

### Files Modified

- `.slide-builder/workflows/build-one/workflow.yaml` - Added catalog variables, converted template_mapping to legacy
- `.slide-builder/workflows/build-one/instructions.md` - Implemented catalog matching algorithm in Phase 2, updated Phase 3A
- `.slide-builder/workflows/plan-one/workflow.yaml` - Added catalog variables, converted template_keywords to legacy
- `.slide-builder/workflows/plan-one/instructions.md` - Updated Phase 3 for catalog-driven template matching
- `.slide-builder/workflows/plan-deck/workflow.yaml` - Added catalog variables, converted template_mapping to legacy
- `.slide-builder/workflows/plan-deck/instructions.md` - Updated Step 3 for catalog-driven suggestions
- `.slide-builder/workflows/edit/workflow.yaml` - Added catalog variables
- `.slide-builder/workflows/edit/instructions.md` - Added catalog loading in Phase 5A

### Test Results

✅ Test Gate PASSED by Vishal (2026-01-28)
- All acceptance criteria verified
- Catalog integration working across all 4 workflows
- Template matching algorithm functioning correctly
- Fallback behavior confirmed

### Completion Notes
**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

---

## Review Notes

<!-- Will be populated during code review -->
