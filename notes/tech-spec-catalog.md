# Today - Technical Specification: Template Catalog System

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick Flow (Brownfield)
**Change Type:** Feature Addition
**Development Context:** Brownfield - Adding to existing slide-builder framework

---

## Context

### Available Documents

- No pre-existing brief/research documents
- Full codebase analysis completed via brownfield reconnaissance
- Analyzed: package.json, theme.json, status.yaml, CONVENTIONS.md
- Analyzed workflows: setup, build-one, build-all, edit, plan-one, plan-deck

### Project Stack

**Runtime:** Node.js (CommonJS modules)
**Dependencies:**
- puppeteer ^23.0.0 (screenshot/PDF generation)
- googleapis ^140.0.0 (Google Slides export)

**Framework:** Custom BMAD-style workflow engine
- YAML workflow configuration
- XML/Markdown instruction files
- Skill invocation system via `.claude/` directory

**Slide Technology:**
- HTML/CSS slides at 1920x1080
- CSS custom properties from theme.json
- contenteditable text elements with auto-save

### Existing Codebase Structure

```
.slide-builder/
├── config/
│   ├── theme.json           # Brand theme primitives
│   ├── theme-history/       # Version snapshots
│   ├── samples/             # Sample slides (TO BE REMOVED)
│   └── templates/           # Layout templates (TO BE REMOVED)
├── workflows/
│   ├── setup/               # Theme creation workflow
│   ├── build-one/           # Single slide generation
│   ├── build-all/           # Batch slide generation
│   ├── edit/                # Slide editing
│   ├── plan-one/            # Single slide planning
│   ├── plan-deck/           # Deck planning
│   ├── theme/               # Theme display
│   ├── theme-edit/          # Theme modification
│   └── export/              # Google Slides export
├── status.yaml              # Runtime state
├── CONVENTIONS.md           # Project conventions
└── credentials/             # OAuth tokens (gitignored)

.claude/commands/sb/         # Skill registrations (linked to workflows)
scripts/
├── generate-manifest.js     # Deck manifest generation
└── regenerate-viewer.js     # Viewer HTML regeneration
```

**Naming Conventions:**
- Workflow directories: lowercase with hyphens
- HTML files: numbered prefix for samples (01-title.html), layout- prefix for templates
- YAML: snake_case keys
- JSON: camelCase keys

**Code Style:**
- JavaScript: CommonJS (require/module.exports)
- No TypeScript
- 2-space indentation
- Single quotes for strings

---

## The Change

### Problem Statement

The current slide-builder has a fragmented template system:
1. **Samples** (`config/samples/`) are generated during setup as theme demonstrations
2. **Templates** (`config/templates/`) store reusable layouts but lack metadata
3. No unified index/manifest describes available templates
4. Build workflows reference samples by hardcoded filename mappings
5. Users cannot easily add new template types after initial setup

This creates confusion between "samples" (demonstrations) and "templates" (reusable layouts), makes template discovery difficult for the agent, and prevents extensibility.

### Proposed Solution

Introduce a **Catalog** system that:
1. **Unifies samples and templates** into a single `config/catalog/` directory
2. **Provides a manifest** (`catalog.json`) with rich metadata for each template
3. **Enables agent discovery** - workflows read the manifest to select appropriate templates
4. **Supports extensibility** via `/sb:add-template` skill for on-demand template creation
5. **Simplifies setup** - generates starter catalog templates instead of separate samples

### Scope

**In Scope:**

1. Create `config/catalog/` directory structure with manifest
2. Define catalog.json schema with template metadata
3. Refactor setup workflow to populate initial catalog (6 starter templates)
4. Create `/sb:add-template` skill with deep conversational discovery
5. Update build-one workflow to read catalog manifest for template selection
6. Update plan-one and plan-deck workflows to reference catalog templates
7. Update edit workflow to understand catalog structure
8. Remove deprecated `config/samples/` and `config/templates/` directories
9. Update CONVENTIONS.md with new catalog structure
10. Update status.yaml schema if needed

**Out of Scope:**

- Template versioning/history (future enhancement)
- Template sharing/export between projects
- Visual template browser UI
- Template categories/tags beyond use_cases array
- Automatic template recommendations based on content analysis

---

## Implementation Details

### Source Tree Changes

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `.slide-builder/config/catalog/` | New catalog directory |
| CREATE | `.slide-builder/config/catalog/catalog.json` | Template manifest |
| CREATE | `.slide-builder/config/catalog/*.html` | Template HTML files |
| CREATE | `.slide-builder/workflows/add-template/` | New workflow directory |
| CREATE | `.slide-builder/workflows/add-template/workflow.yaml` | Workflow config |
| CREATE | `.slide-builder/workflows/add-template/instructions.md` | Workflow instructions |
| CREATE | `.claude/commands/sb/add-template.md` | Skill registration |
| MODIFY | `.slide-builder/workflows/setup/instructions.md` | Refactor for catalog |
| MODIFY | `.slide-builder/workflows/setup/workflow.yaml` | Update paths |
| MODIFY | `.slide-builder/workflows/build-one/instructions.md` | Use catalog manifest |
| MODIFY | `.slide-builder/workflows/build-one/workflow.yaml` | Add catalog path |
| MODIFY | `.slide-builder/workflows/plan-one/instructions.md` | Reference catalog |
| MODIFY | `.slide-builder/workflows/plan-deck/instructions.md` | Reference catalog |
| MODIFY | `.slide-builder/workflows/edit/instructions.md` | Reference catalog |
| MODIFY | `.slide-builder/CONVENTIONS.md` | Document catalog structure |
| MODIFY | `.slide-builder/status.yaml` | Update templates section |
| DELETE | `.slide-builder/config/samples/` | Remove deprecated directory |
| DELETE | `.slide-builder/config/templates/` | Remove deprecated directory |

### Technical Approach

**Catalog Manifest Schema (catalog.json):**

```json
{
  "version": "1.0",
  "generated": "2026-01-28",
  "lastModified": "2026-01-28T00:00:00Z",
  "templates": [
    {
      "id": "title",
      "name": "Title Slide",
      "description": "Full-bleed title slide with hero typography for opening presentations",
      "use_cases": ["title", "opening", "hero", "intro"],
      "file": "title.html",
      "preview": null,
      "created_at": "2026-01-28T00:00:00Z",
      "source": "setup"
    }
  ]
}
```

**Template Metadata Fields:**
- `id`: Unique slug identifier (lowercase, hyphens)
- `name`: Human-readable display name
- `description`: Purpose and when to use this template
- `use_cases`: Array of keywords for matching (agent uses these)
- `file`: Filename within catalog directory
- `preview`: Optional thumbnail path (future use)
- `created_at`: ISO 8601 timestamp
- `source`: Origin ("setup" for starter, "add-template" for user-created)

**Template File Naming:**
- Use ID-based naming: `{id}.html` (e.g., `title.html`, `comparison.html`)
- No numeric prefixes - manifest provides ordering if needed

**Starter Catalog Templates (from setup):**

| ID | Name | Use Cases |
|----|------|-----------|
| title | Title Slide | title, opening, hero, intro |
| agenda | Agenda/List | agenda, list, bullets, overview |
| process-flow | Process Flow | flow, process, steps, timeline |
| comparison | Comparison | comparison, versus, before-after, columns |
| callout | Key Insight | callout, statistic, quote, highlight |
| technical | Technical/Code | code, technical, api, syntax |

### Existing Patterns to Follow

**Workflow Structure Pattern (from existing workflows):**
```yaml
name: workflow-name
description: "Brief description"
author: "Slide Builder"

installed_path: "{project-root}/.slide-builder/workflows/{name}"
instructions: "{installed_path}/instructions.md"

# Path variables
config_path: "{project-root}/.slide-builder/config"
catalog_path: "{config_path}/catalog"
catalog_manifest: "{catalog_path}/catalog.json"

template: false
standalone: true
```

**Skill Registration Pattern (from .claude/commands/sb/):**
- Markdown file with frontmatter
- Links to workflow.yaml path
- Brief description for skill discovery

**Instruction File Pattern:**
- XML workflow tags within markdown code fence
- Step numbering with goals
- `<action>`, `<check>`, `<ask>`, `<output>` tags
- `<critical>` mandates for important rules

### Integration Points

**Internal Dependencies:**
- theme.json - Templates must use CSS variables from theme
- status.yaml - Track catalog state and template counts
- frontend-design skill - Used for template generation
- regenerate-viewer.js - May need awareness of catalog

**Workflow Integration:**
- setup → Creates initial catalog
- build-one → Reads catalog.json to find matching template
- plan-one → Shows available templates from catalog
- plan-deck → References catalog for slide type suggestions
- edit → Understands template structure from catalog
- add-template → Adds new entries to catalog.json

---

## Development Context

### Relevant Existing Code

**Setup workflow template generation (setup/instructions.md:1276-1498):**
- Phase 4 generates 6 sample slides
- Uses frontend-design skill for HTML generation
- Saves to `config/samples/` directory
- Reference for catalog population logic

**Build-one template mapping (build-one/instructions.md:161-207):**
- Maps template names to sample files
- Falls back to custom generation
- Reference for catalog lookup logic

**Status.yaml templates section (status.yaml:40-49):**
- Current structure tracks template files
- Needs updating for catalog structure

### Dependencies

**Framework/Libraries:**
- Node.js (existing runtime)
- No new dependencies required

**Internal Modules:**
- frontend-design skill (template generation)
- BMAD workflow engine (execution)

### Configuration Changes

**status.yaml schema update:**
```yaml
# OLD
templates:
  directory: .slide-builder/config/templates/
  count: 6
  files:
    - 01-title.html
    # ...

# NEW
catalog:
  directory: .slide-builder/config/catalog/
  manifest: .slide-builder/config/catalog/catalog.json
  count: 6
  templates:
    - id: title
      name: Title Slide
    # ... (summary, full data in manifest)
```

**CONVENTIONS.md updates:**
- Document catalog structure
- Update command-to-workflow mapping table
- Add `/sb:add-template` command

### Existing Conventions (Brownfield)

**Must Follow:**
- Workflow YAML schema (name, description, installed_path, instructions)
- Instruction XML tags (<step>, <action>, <check>, <ask>, <output>)
- CSS variable pattern from theme.json
- contenteditable + data-field attributes on all text elements
- 1920x1080 slide dimensions
- Google Fonts for Outfit font family
- Status.yaml history array for action logging

### Test Framework & Standards

No automated tests currently exist. Manual validation via:
- Running workflows and verifying output
- Checking generated HTML in browser
- Validating JSON schema compliance

---

## Implementation Stack

- **Runtime:** Node.js (existing)
- **Workflow Engine:** BMAD-style YAML/XML
- **Template Format:** HTML with CSS variables
- **Manifest Format:** JSON
- **Skills:** Claude Code skill system

---

## Technical Details

**Catalog Discovery Algorithm (for build-one):**
1. Read `catalog.json` from `{catalog_path}/catalog.json`
2. Parse the `templates` array
3. Match requested template type against `id` or `use_cases`
4. If exact `id` match → use that template
5. If `use_cases` match → use highest-relevance template
6. If no match → fall back to custom generation via frontend-design

**Add-Template Conversational Flow:**
1. Ask: What kind of slide do you need?
2. Explore: What content will it display?
3. Clarify: Visual style preferences?
4. Confirm: Summarize template spec
5. Generate: Use frontend-design skill
6. Save: Add to catalog.json and save HTML
7. Verify: Offer browser preview

**Migration Strategy:**
- Setup workflow generates fresh catalog
- Existing projects: Run `/sb:setup` to regenerate (or manual migration)
- No automatic migration of existing samples/templates

---

## Development Setup

```bash
# Clone repo (if not already)
git clone <repo-url>
cd slide-builder

# Install dependencies
npm install

# No build step required (vanilla JS)

# Test workflow execution
# Run /sb:setup to test catalog generation
# Run /sb:add-template to test template addition
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/catalog-system`
2. Verify dev environment: Ensure Claude Code with skills available
3. Review existing code: Read setup, build-one, plan-one instructions
4. Understand theme.json structure for CSS variable extraction

### Implementation Steps

**Story 1: Core Catalog Infrastructure**
- Create `config/catalog/` directory
- Define catalog.json schema
- Create empty manifest file
- Update CONVENTIONS.md

**Story 2: Refactor Setup Workflow**
- Modify setup/instructions.md Phase 4
- Change output directory to catalog/
- Generate catalog.json with template metadata
- Remove references to samples/

**Story 3: Create /sb:add-template Skill**
- Create add-template workflow directory
- Write workflow.yaml
- Write instructions.md with conversational discovery
- Create skill registration in .claude/commands/sb/

**Story 4: Update Dependent Workflows**
- Modify build-one to read catalog manifest
- Modify plan-one to show catalog templates
- Modify plan-deck to reference catalog
- Modify edit to understand catalog structure
- Update status.yaml handling

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Run `/sb:setup` - verify catalog/ created with 6 templates
- [ ] Verify catalog.json has correct schema
- [ ] Open each template HTML in browser
- [ ] Run `/sb:add-template` - create new template
- [ ] Verify new template added to catalog.json
- [ ] Run `/sb:build-one` - verify template selection works
- [ ] Run `/sb:plan-one` - verify catalog templates shown
- [ ] Run `/sb:plan-deck` - verify template suggestions work

### Acceptance Criteria

1. **Catalog Created:** `config/catalog/` exists with catalog.json and 6 HTML files
2. **Manifest Valid:** catalog.json follows defined schema with all metadata fields
3. **Setup Works:** `/sb:setup` populates catalog instead of samples/templates
4. **Add-Template Works:** `/sb:add-template` creates new template via conversation
5. **Build Uses Catalog:** `/sb:build-one` reads catalog.json for template selection
6. **Old Directories Removed:** `config/samples/` and `config/templates/` deleted
7. **Conventions Updated:** CONVENTIONS.md documents new catalog structure
8. **Status Updated:** status.yaml reflects catalog structure

---

## Developer Resources

### File Paths Reference

**New Files:**
- `.slide-builder/config/catalog/catalog.json`
- `.slide-builder/config/catalog/title.html`
- `.slide-builder/config/catalog/agenda.html`
- `.slide-builder/config/catalog/process-flow.html`
- `.slide-builder/config/catalog/comparison.html`
- `.slide-builder/config/catalog/callout.html`
- `.slide-builder/config/catalog/technical.html`
- `.slide-builder/workflows/add-template/workflow.yaml`
- `.slide-builder/workflows/add-template/instructions.md`
- `.claude/commands/sb/add-template.md`

**Modified Files:**
- `.slide-builder/workflows/setup/instructions.md`
- `.slide-builder/workflows/setup/workflow.yaml`
- `.slide-builder/workflows/build-one/instructions.md`
- `.slide-builder/workflows/build-one/workflow.yaml`
- `.slide-builder/workflows/plan-one/instructions.md`
- `.slide-builder/workflows/plan-deck/instructions.md`
- `.slide-builder/workflows/edit/instructions.md`
- `.slide-builder/CONVENTIONS.md`
- `.slide-builder/status.yaml`

**Deleted:**
- `.slide-builder/config/samples/` (entire directory)
- `.slide-builder/config/templates/` (entire directory)

### Key Code Locations

- Setup Phase 4 (sample generation): `workflows/setup/instructions.md:1276`
- Build-one template mapping: `workflows/build-one/instructions.md:161`
- Plan-one template display: `workflows/plan-one/instructions.md`
- Status.yaml templates section: `status.yaml:40`
- Conventions template structure: `CONVENTIONS.md:34`

### Testing Locations

- Manual testing via workflow execution
- Browser preview for HTML validation
- JSON schema validation for catalog.json

### Documentation to Update

- `.slide-builder/CONVENTIONS.md` - Add catalog section, update file structure
- No external README changes needed

---

## UX/UI Considerations

**`/sb:add-template` User Experience:**

1. **Warm Welcome:** Greet user and explain the process
2. **Open Discovery:** "What kind of slide template do you need?"
3. **Guided Questions:**
   - Content type (data viz, text-heavy, mixed media)
   - Visual style (matches theme personality)
   - Specific elements needed (charts, icons, columns)
   - Reference examples if available
4. **Confirmation Summary:** Show planned template spec before generation
5. **Generation Feedback:** Progress indicator during HTML creation
6. **Preview Offer:** "Would you like to open the template in your browser?"
7. **Success Message:** Confirm template added to catalog with ID

**Plan Workflow Updates:**
- Show available templates from catalog with descriptions
- Allow user to pick from catalog or request custom

---

## Testing Approach

**Test Strategy:**

Since no automated test framework exists, validation is manual:

1. **Schema Validation:**
   - Manually verify catalog.json matches defined schema
   - Check all required fields present
   - Validate ISO 8601 timestamps

2. **Workflow Execution:**
   - Run each modified workflow end-to-end
   - Verify expected outputs created
   - Check status.yaml updates correctly

3. **HTML Quality:**
   - Open each template in browser
   - Verify 1920x1080 dimensions
   - Check CSS variables applied
   - Test contenteditable functionality

4. **Integration:**
   - Run full flow: setup → plan-one → build-one
   - Verify catalog used throughout
   - Test add-template → build-one with new template

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. No build/deploy needed (interpreted workflow files)
3. Users run `/sb:setup` to regenerate with new catalog structure

### Rollback Plan

1. Revert merge commit: `git revert <commit-hash>`
2. If catalog already created: Manually restore samples/templates from theme-history or re-run setup

### Monitoring

- Check status.yaml for errors in history array
- Verify catalog.json not corrupted after operations
- Monitor workflow execution for failures
