# Epic 13: Enhanced Planning Sessions

**Date:** 2026-01-28
**Project Level:** Quick Flow
**Slug:** enhanced-planning

---

## Goal

Enable deeper planning during planning sessions by transforming `/sb:plan-deck` from a single-pass flow into a two-phase model with agenda structure generation and per-section deep discovery using Claude Code's multi-select UI.

## Scope

**In Scope:**
- Agenda structure generation with 4-8 proposed sections
- Multi-select section confirmation via AskUserQuestion
- Per-section deep discovery loop (message options, content types, visual treatment)
- On-demand web research integration via WebSearch
- Enhanced plan.yaml schema with agenda and discovery data
- Lighter discovery pattern for plan-one

**Out of Scope:**
- AI-generated images or mockups
- Automatic slide generation from agenda
- Third-party integrations
- Persistent research database

## Success Criteria

1. After context collection, agent proposes 4-8 agenda sections with narrative roles
2. User can select/deselect sections via Claude Code multi-select UI
3. For each section, structured discovery presents message, content, and visual options
4. Research available on-demand via WebSearch
5. plan.yaml contains full agenda and discovery data per section
6. Existing modification loop and save functionality unchanged

## Dependencies

- Epic 5 (Full Deck Mode) - plan-deck workflow exists
- Claude Code AskUserQuestion tool available
- WebSearch tool available

---

## Story Map

```
Epic 13: Enhanced Planning Sessions (8 points)
│
├── Story 13.1: Agenda Structure Generation (2 points)
│   Dependencies: None
│   └── Add agenda proposal and multi-select confirmation after context collection
│
├── Story 13.2: Section Message Discovery (2 points)
│   Dependencies: Story 13.1
│   └── Per-section key message options with single-select UI
│
├── Story 13.3: Content & Visual Discovery (2 points)
│   Dependencies: Story 13.2
│   └── Content types, visual treatment multi-select, on-demand research
│
└── Story 13.4: Schema & Integration (2 points)
    Dependencies: Stories 13.1, 13.2, 13.3
    └── Enhanced plan.yaml, slide generation from sections, CONVENTIONS.md
```

**Total Points:** 8
**Implementation Sequence:** 13.1 → 13.2 → 13.3 → 13.4

---

## Stories

### Story 13.1: Agenda Structure Generation

As a **presentation planner**,
I want **the agent to propose a high-level agenda with 4-8 sections after I provide my purpose and audience**,
So that **I can structure my presentation around clear narrative stages before diving into details**.

**Acceptance Criteria:**

**Given** I have provided purpose, audience, key points, and length
**When** the agent analyzes my input
**Then** it proposes 4-8 agenda sections with:
- Unique id (agenda-1, agenda-2, etc.)
- Title (e.g., "The Problem", "Our Solution")
- Narrative role (opening, context, problem, solution, evidence, cta)
- Estimated slides (1-3 per section)
- Brief description

**And** I can select/deselect sections via Claude Code multi-select
**And** I can add custom sections via "Other" option
**And** confirmed sections are stored for Phase 2 discovery

**Prerequisites:** None (first story in epic)

**Technical Notes:**
- Insert new step 2.5 after context collection in plan-deck/instructions.md
- Use AskUserQuestion with multiSelect: true, up to 4 options per call
- Generate sections based on purpose/audience/key_points analysis

**Estimated Effort:** 2 points

---

### Story 13.2: Section Message Discovery

As a **presentation planner**,
I want **to choose from multiple message framing options for each agenda section**,
So that **I can find the most compelling way to communicate each part of my story**.

**Acceptance Criteria:**

**Given** agenda sections have been confirmed
**When** the discovery loop begins for a section
**Then** the agent generates 3-4 message framing options:
- Direct/assertive framing
- Question-based framing
- Story-based framing
- Data-driven framing

**And** options are presented via Claude Code single-select UI
**And** each option shows a sample message in the description
**And** selected message is stored in section.discovery.key_message

**Prerequisites:** Story 13.1

**Technical Notes:**
- Add step 2.6 with for-each loop over agenda_sections
- Use AskUserQuestion with multiSelect: false
- Message options should be contextual to section.title and narrative_role

**Estimated Effort:** 2 points

---

### Story 13.3: Content & Visual Discovery

As a **presentation planner**,
I want **to select supporting content types and visual treatment options for each section, with optional research**,
So that **each part of my presentation has rich context for slide generation**.

**Acceptance Criteria:**

**Given** I have selected a key message for a section
**When** the discovery continues
**Then** I can select content types via multi-select:
- Statistics/data points
- Customer quotes/testimonials
- Case study examples
- Industry benchmarks

**And** I can select visual treatment via multi-select:
- Diagram type (flowchart, comparison, timeline, hierarchy)
- Visual metaphor (journey, building, growth, transformation)
- Imagery theme (technology, people, nature, abstract)

**And** I am asked if I want research for this section
**And** if yes, WebSearch finds supporting data and I select what to include
**And** I have one refinement opportunity before moving to next section

**Prerequisites:** Story 13.2

**Technical Notes:**
- Continue step 2.6 with additional AskUserQuestion calls
- Research uses WebSearch tool, results presented via AskUserQuestion
- Store all selections in section.discovery object

**Estimated Effort:** 2 points

---

### Story 13.4: Schema & Integration

As a **slide builder system**,
I want **the enhanced plan.yaml schema to include all agenda and discovery data**,
So that **slide generation can use the rich context gathered during planning**.

**Acceptance Criteria:**

**Given** all sections have completed discovery
**When** the slide breakdown is generated
**Then** slides reference their parent agenda_section_id
**And** visual_guidance uses section.discovery.visual_treatment
**And** key_points derive from section.discovery.content_types

**And** plan.yaml includes:
- agenda.sections[] with full discovery data
- slides[].agenda_section_id linking to sections
- research_findings with source and selected status

**And** CONVENTIONS.md documents the new planning patterns
**And** plan-one has a lighter version of discovery (optional)

**Prerequisites:** Stories 13.1, 13.2, 13.3

**Technical Notes:**
- Modify step 3 (narrative generation) to use agenda sections
- Update plan.yaml write in step 5
- Update CONVENTIONS.md with AskUserQuestion patterns

**Estimated Effort:** 2 points

---

## Implementation Timeline

**Total Story Points:** 8

**Sequence:**
1. Story 13.1: Agenda Structure Generation
2. Story 13.2: Section Message Discovery
3. Story 13.3: Content & Visual Discovery
4. Story 13.4: Schema & Integration

**Files Modified:**
- `.slide-builder/workflows/plan-deck/instructions.md`
- `.slide-builder/workflows/plan-deck/workflow.yaml`
- `.slide-builder/workflows/plan-one/instructions.md`
- `.slide-builder/CONVENTIONS.md`
