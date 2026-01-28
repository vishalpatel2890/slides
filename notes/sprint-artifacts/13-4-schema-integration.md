# Story 13.4: Schema & Integration

Status: done

## Story

As a **slide builder system**,
I want **the enhanced plan.yaml schema to include all agenda and discovery data**,
So that **slide generation can use the rich context gathered during planning**.

## Acceptance Criteria

1. **Enhanced plan.yaml Schema:** Given the planning workflow completes, when plan.yaml is saved, then it includes:
   - `agenda` section with `total_sections` and `sections` array
   - Each section contains: id, title, narrative_role, estimated_slides, description
   - Each section contains `discovery` object with: key_message, key_message_framing, content_types, visual_treatment, research_findings

2. **Slide Generation Context:** Given plan.yaml contains agenda and discovery data, when `/sb:build-one` or `/sb:build-all` builds a slide, then:
   - Slide is linked to its agenda_section_id
   - Visual guidance is derived from section.discovery.visual_treatment
   - Content types inform content suggestions
   - Key message informs slide messaging

3. **CONVENTIONS.md Update:** Given the enhanced planning patterns are implemented, when I read CONVENTIONS.md, then it documents:
   - AskUserQuestion tool usage patterns
   - Agenda structure schema
   - Discovery object schema
   - How slide generation uses section context

4. **plan-one Lighter Discovery:** Given I run `/sb:plan-one`, when planning completes, then:
   - Optional lighter discovery is available (message options only)
   - Discovery data stored in same format as plan-deck
   - Can skip discovery entirely for quick single slides

## Frontend Test Gate

**Gate ID**: 13-4-TG1

### Prerequisites
- [ ] App running locally (Claude Code CLI)
- [ ] Theme exists (run /sb:setup if needed)
- [ ] Starting state: Complete full `/sb:plan-deck` workflow through Step 2.6 (all sections discovered)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:plan-deck` | Claude Code CLI | Complete full planning workflow |
| 2 | Complete agenda selection | AskUserQuestion UI | Agenda sections confirmed |
| 3 | Complete all section discoveries | AskUserQuestion UI | Message, content, visual selected for each section |
| 4 | Proceed to slide generation | CLI | Slides generated from sections |
| 5 | Open plan.yaml | File system | Contains agenda and discovery data |
| 6 | Run `/sb:build-one` | CLI | Slide uses section context |
| 7 | Check generated slide | Browser | Visual treatment matches discovery selections |
| 8 | Read CONVENTIONS.md | File system | Documents new patterns |
| 9 | Run `/sb:plan-one` | CLI | Optional discovery offered |

### Success Criteria (What User Sees)
- [ ] plan.yaml contains complete agenda structure
- [ ] plan.yaml contains discovery data for each section
- [ ] Slides reference agenda_section_id
- [ ] Build workflow uses visual_treatment from discovery
- [ ] CONVENTIONS.md documents AskUserQuestion patterns
- [ ] plan-one offers optional discovery
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you complete the main action without confusion?
2. Did the UI respond within acceptable time (<2s)?
3. Were error messages clear if you made mistakes?
4. Any UX friction or unexpected behavior?

## Tasks / Subtasks

- [x] **Task 1: Update plan.yaml save in Step 3** (AC: 1)
  - [x] Locate Step 3 (narrative generation) in plan-deck/instructions.md
  - [x] Modify slide generation to use agenda_sections as input
  - [x] Add agenda_section_id to each slide in slides array
  - [x] Ensure storyline derived from sections with narrative_role

- [x] **Task 2: Update plan.yaml save in Step 5** (AC: 1)
  - [x] Locate Step 5 (save plan) in plan-deck/instructions.md
  - [x] Ensure agenda section is written to plan.yaml with full schema:
    ```yaml
    agenda:
      total_sections: {{section_count}}
      sections:
        - id: "agenda-1"
          title: "..."
          narrative_role: "opening"
          estimated_slides: 1
          description: "..."
          discovery:
            key_message: "..."
            key_message_framing: "direct | question | story | data"
            content_types: []
            visual_treatment:
              diagram_type: []
              visual_metaphor: []
              imagery_theme: []
            research_findings: []
    ```
  - [x] Ensure each slide in slides array includes agenda_section_id

- [x] **Task 3: Update build-one to use section context** (AC: 2)
  - [x] Read plan.yaml in build-one/instructions.md
  - [x] Find agenda section matching current slide's agenda_section_id
  - [x] Pass visual_treatment to slide generation for visual guidance
  - [x] Pass content_types to inform content suggestions
  - [x] Pass key_message to inform slide messaging

- [x] **Task 4: Update CONVENTIONS.md** (AC: 3)
  - [x] Document AskUserQuestion tool patterns
  - [x] Document agenda structure schema
  - [x] Document discovery object schema
  - [x] Document how slide generation uses section context
  - [x] Add examples for each pattern

- [x] **Task 5: Add lighter discovery to plan-one** (AC: 4)
  - [x] Add optional discovery step after intent confirmation
  - [x] Offer quick message framing selection (single AskUserQuestion)
  - [x] Allow user to skip for quick planning
  - [x] Store discovery data in same format as plan-deck (if user engages)

## Dev Notes

### Technical Context

**Primary Files to Modify:**
- `.slide-builder/workflows/plan-deck/instructions.md` - Steps 3 and 5 for schema integration
- `.slide-builder/workflows/build-one/instructions.md` - Read and use discovery context
- `.slide-builder/CONVENTIONS.md` - Document new patterns
- `.slide-builder/workflows/plan-one/instructions.md` - Add optional discovery

**Enhanced plan.yaml Schema (from tech-spec):**

```yaml
# Deck Metadata
deck_name: "{{deck_name}}"
created: "{{current_date}}"
last_modified: "{{current_timestamp}}"

# Audience Context
audience: "{{audience}}"
audience_knowledge_level: beginner | intermediate | expert
audience_priorities:
  - "{{priority_1}}"
  - "{{priority_2}}"

# Purpose & Outcome
purpose: "{{purpose}}"
desired_outcome: "{{desired_outcome}}"
key_message: "{{key_message}}"

# NEW: Agenda Structure (Phase 1 output)
agenda:
  total_sections: {{section_count}}
  sections:
    - id: "agenda-1"
      title: "{{section_title}}"
      narrative_role: "opening"
      estimated_slides: 1
      description: "{{section_description}}"

      # NEW: Deep Discovery Output (Phase 2)
      discovery:
        key_message: "{{selected_message}}"
        key_message_framing: "direct | question | story | data"
        content_types:
          - "statistics"
          - "testimonials"
        visual_treatment:
          diagram_type: "flowchart"
          visual_metaphor: "journey"
          imagery_theme: "technology"
          icon_style: "outlined"
        research_findings:
          - source: "{{url}}"
            content: "{{finding}}"
            selected: true

# Narrative Structure (enhanced with agenda)
storyline:
  opening_hook: "{{from agenda section with role=opening}}"
  tension: "{{from agenda section with role=problem}}"
  resolution: "{{from agenda section with role=solution}}"
  call_to_action: "{{from agenda section with role=cta}}"

# Slide Breakdown (generated from agenda sections)
slides:
  - number: 1
    intent: "{{slide_intent}}"
    template: "{{matched_template}}"
    status: pending
    storyline_role: "opening"

    # NEW: Link to agenda section
    agenda_section_id: "agenda-1"

    key_points:
      - "{{point_1}}"
    visual_guidance: "{{from section.visual_treatment}}"
    tone: "professional"
```

### Build-one Integration Pattern

```xml
<step n="X" goal="Load section context for slide generation">
  <action>Read plan.yaml and find current slide's agenda_section_id</action>
  <action>Load matching agenda section from plan.yaml.agenda.sections</action>
  <action>Extract visual_treatment for visual guidance:
    - diagram_type informs layout choice (flowchart, timeline, etc.)
    - visual_metaphor informs imagery suggestions
    - imagery_theme informs color/style emphasis
  </action>
  <action>Extract content_types for content suggestions:
    - If "statistics" selected, emphasize data points
    - If "testimonials" selected, include quote formatting
    - If "case_study" selected, include example structure
  </action>
  <action>Use key_message as the core message for the slide</action>
</step>
```

### CONVENTIONS.md Documentation Pattern

Add new section documenting:

```markdown
## Enhanced Planning Patterns

### AskUserQuestion Tool Usage

The AskUserQuestion tool enables structured user input with multi-select and single-select options.

**Pattern:**
```json
{
  "questions": [{
    "question": "The question to ask",
    "header": "Short Label",
    "options": [
      {"label": "Option 1", "description": "What this option means"}
    ],
    "multiSelect": true | false
  }]
}
```

**Constraints:**
- Maximum 4 questions per call
- Maximum 4 options per question
- User can always select "Other" for custom input
- Use multiSelect: true for content/visual selections
- Use multiSelect: false for single-choice decisions

### Agenda Structure Schema

After context collection, the planning workflow generates an agenda structure...

### Discovery Object Schema

For each agenda section, deep discovery captures...
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/plan-deck/instructions.md` - Steps 3 and 5
  - `.slide-builder/workflows/build-one/instructions.md` - Add section context loading
  - `.slide-builder/CONVENTIONS.md` - Document patterns
  - `.slide-builder/workflows/plan-one/instructions.md` - Optional discovery

- **Expected test locations:** Manual testing via `/sb:plan-deck` and `/sb:build-one`

- **Estimated effort:** 2 story points

- **Prerequisites:** Stories 13.1, 13.2, 13.3 - All discovery steps must be complete

### Learnings from Previous Story

**From Story 13.3 (Status: in-progress)**

- **Discovery Object Complete**: section.discovery now contains key_message, content_types, visual_treatment, and research_findings
- **Data Ready for Persistence**: All data captured during Steps 2.5 and 2.6 is ready for plan.yaml write
- **Visual Treatment Structure**: Split into three arrays: diagram_type, visual_metaphor, imagery_theme
- **Research Findings Format**: Array with source, content, selected fields
- **Step 2.6 Pattern**: for-each loop over agenda_sections with comprehensive discovery substeps

**Files Modified in 13.3:**
- `.slide-builder/workflows/plan-deck/instructions.md` (MODIFIED) - Extended Step 2.6 with content/visual/research discovery (~200 lines added)

**Key Implementation Notes from 13.3:**
- Use clear section markers with `<!-- ═══════ -->` for readability
- Include output messages showing progress and current selection
- Handle both predefined options and "Other" custom input
- Store all selections in structured format

[Source: notes/sprint-artifacts/13-3-content-visual-discovery.md#Dev-Agent-Record]

### References

- **Tech-Spec:** [tech-spec-enhanced-planning.md](../tech-spec-enhanced-planning.md) - Enhanced plan.yaml schema (lines 382-451), Story 4 details (lines 543-549)
- **Epic:** Epic 13 in [epics.md](../epics.md) - Story 13.4 definition (lines 1984-2001)
- **Previous Story:** [13-3-content-visual-discovery.md](./13-3-content-visual-discovery.md) - Discovery implementation that feeds this story
- **Architecture:** [architecture.md](../architecture.md) - plan.yaml schema patterns (lines 347-400)

---

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/13-4-schema-integration.context.xml`

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

- Task 1: Updated Step 3 in plan-deck/instructions.md to generate slides from agenda_sections with agenda_section_id
- Task 2: Updated Step 5 in plan-deck/instructions.md with full agenda schema including discovery objects
- Task 3: Added Phase 1A.5 in build-one/instructions.md to load and use section context
- Task 4: Added "Enhanced Planning Patterns" section (~200 lines) to CONVENTIONS.md
- Task 5: Added Phase 4.5 in plan-one/instructions.md for optional discovery

### Completion Notes

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### Completion Notes List

- ✅ Test Gate PASSED by Vishal (2026-01-28)
- All 5 tasks implemented successfully
- plan.yaml schema now includes agenda section with discovery data for each section
- Slides are linked to agenda sections via agenda_section_id
- build-one workflow enriches slide generation with section discovery data
- CONVENTIONS.md documents AskUserQuestion patterns, agenda schema, discovery schema, and build integration
- plan-one workflow now offers optional quick discovery (message framing only)
- Backwards compatible - existing plans without agenda section continue to work

### File List

**Modified:**
- `.slide-builder/workflows/plan-deck/instructions.md` - Steps 3 and 5 updated for agenda-based slide generation and schema persistence
- `.slide-builder/workflows/build-one/instructions.md` - Added Phase 1A.5 for section context loading
- `.slide-builder/CONVENTIONS.md` - Added Enhanced Planning Patterns section (~200 lines)
- `.slide-builder/workflows/plan-one/instructions.md` - Added Phase 4.5 for optional discovery

