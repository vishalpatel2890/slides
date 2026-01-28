# Story 13.2: Section Message Discovery

**Status:** done

---

## User Story

As a **presentation planner**,
I want **to choose from multiple message framing options for each agenda section**,
So that **I can find the most compelling way to communicate each part of my story**.

---

## Acceptance Criteria

**AC #1:** Given I have confirmed agenda sections from step 2.5
**When** the agent begins section-by-section discovery
**Then** for each section, 3-4 message framing options are presented with:
- Direct/assertive framing (e.g., "Most teams waste 40% of meeting time on slides")
- Question-based framing (e.g., "What if your slides could build themselves?")
- Story-based framing (e.g., "Last month, a SC spent 6 hours on one deck...")
- Data-driven framing (e.g., "73% of deals are won or lost at the presentation stage")

**AC #2:** Given message framing options are presented
**When** I review my choices
**Then** the options are contextual to the section's title and narrative_role:
- Opening sections → Hook-style framings
- Problem sections → Pain-point framings
- Solution sections → Value-proposition framings
- Evidence sections → Proof-oriented framings
- CTA sections → Action-oriented framings

**AC #3:** Given I am selecting a message framing
**When** the AskUserQuestion tool is used
**Then** it uses multiSelect: false (single-select, not multi-select)

**AC #4:** Given I select a message framing
**When** my selection is stored
**Then** it is saved in `section.discovery.key_message` with the selected framing text

**AC #5:** Given I select "Other" with custom input
**When** providing my own message framing
**Then** the custom text is stored as the key_message for that section

**AC #6:** Given all sections have been processed
**When** message discovery completes
**Then** each section in `{{agenda_sections}}` has a populated `discovery.key_message` field

---

## Frontend Test Gate

**Gate ID**: 13-2-TG1

### Prerequisites
- [ ] App running locally (Claude Code CLI)
- [ ] Theme exists (run /sb:setup if needed)
- [ ] Starting state: Complete step 2.5 (agenda structure generation from Story 13.1)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `/sb:plan-deck` | Claude Code CLI | Workflow starts |
| 2 | Complete steps 1-2.5 | CLI prompts | Agenda sections confirmed |
| 3 | Observe step 2.6 begin | CLI output | "Beginning section discovery..." message |
| 4 | Review message options for first section | AskUserQuestion UI | 3-4 message framings displayed |
| 5 | Select a message framing | Click option | Selection confirmed |
| 6 | Repeat for remaining sections | AskUserQuestion UI | Each section gets message selection |
| 7 | Complete discovery | CLI output | All sections have key_message populated |

### Success Criteria (What User Sees)
- [ ] Message framing options appear for each agenda section
- [ ] Options are contextual to the section's narrative role
- [ ] Single-select UI (not checkboxes)
- [ ] "Other" option available for custom input
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you understand the difference between message framing options?
2. Were the options appropriate for each section type?
3. Did the single-select UI work correctly?
4. Any UX friction or unexpected behavior?

---

## Tasks / Subtasks

- [x] **Task 1: Add step 2.6 iteration structure** (AC: 1, 6)
  - [x] Insert `<step n="2.6" goal="Deep discovery for each agenda section" for-each="section in agenda_sections">` after step 2.5
  - [x] Add iteration output showing current section being processed
  - [x] Add section header display before each discovery round

- [x] **Task 2: Implement message framing generation** (AC: 1, 2)
  - [x] Create message framing generation logic based on section.narrative_role
  - [x] Map narrative roles to framing styles:
    - `opening` → Attention-grabbing hooks, provocative questions
    - `context` → Scene-setting statements, background framings
    - `problem` → Pain-point statements, challenge framings
    - `solution` → Value propositions, benefit framings
    - `evidence` → Proof statements, data-driven claims
    - `cta` → Action imperatives, urgency framings
  - [x] Generate 3-4 distinct framings per section using section.title and section.description

- [x] **Task 3: Add AskUserQuestion tool call for message selection** (AC: 3, 4, 5)
  - [x] Use AskUserQuestion with multiSelect: false
  - [x] Present message options with:
    - label: Short framing type (e.g., "Direct Challenge", "Question Hook")
    - description: Full message text (e.g., "Most teams waste 40%...")
  - [x] Handle "Other" custom input - store user's custom text as key_message
  - [x] Store selection in section.discovery.key_message

- [x] **Task 4: Initialize discovery object structure** (AC: 4, 6)
  - [x] Add `discovery: {}` object to each section in agenda_sections
  - [x] Ensure discovery.key_message is populated after selection
  - [x] Preserve selection for use in later stories (13.3, 13.4)

- [x] **Task 5: Test iteration and selection flow** (AC: 1-6)
  - [x] Run `/sb:plan-deck` end-to-end
  - [x] Verify message options appear for each section
  - [x] Verify single-select UI (not multi-select)
  - [x] Verify selections are stored correctly

---

## Dev Notes

### Technical Context

**Insert Location:** After step 2.5 (agenda structure generation) in `.slide-builder/workflows/plan-deck/instructions.md`

**Current Line Reference:** Step 2.5 ends around line 308 with "Proceeding to generate detailed slide breakdown..."

**Key Integration Points:**
- Uses `{{agenda_sections}}` variable populated by Story 13.1
- Each section has: id, title, narrative_role, estimated_slides, description
- Discovery data stored in section.discovery.key_message
- This data flows to Story 13.3 (content & visual discovery) and 13.4 (schema integration)

### Message Framing Templates by Narrative Role

```xml
<!-- Opening Role Framings -->
<framing role="opening" style="direct">"{{provocative_statement_about_audience_situation}}"</framing>
<framing role="opening" style="question">"What if {{desirable_outcome}}?"</framing>
<framing role="opening" style="story">"{{time_reference}}, {{relatable_scenario}}..."</framing>
<framing role="opening" style="data">"{{surprising_statistic}} of {{audience_group}} {{situation}}"</framing>

<!-- Problem Role Framings -->
<framing role="problem" style="direct">"{{pain_point}} is costing you {{consequence}}"</framing>
<framing role="problem" style="question">"Why do {{audience_group}} struggle with {{challenge}}?"</framing>
<framing role="problem" style="story">"Meet {{persona}}, who faces {{challenge}} every day"</framing>
<framing role="problem" style="data">"{{statistic}} shows the impact of {{problem}}"</framing>

<!-- Solution Role Framings -->
<framing role="solution" style="direct">"{{solution}} delivers {{key_benefit}}"</framing>
<framing role="solution" style="question">"What would {{desirable_outcome}} mean for your team?"</framing>
<framing role="solution" style="story">"Here's how {{customer}} achieved {{result}}"</framing>
<framing role="solution" style="data">"{{solution}} reduces {{metric}} by {{percentage}}"</framing>

<!-- Evidence Role Framings -->
<framing role="evidence" style="direct">"The results speak for themselves"</framing>
<framing role="evidence" style="question">"How do we know this works?"</framing>
<framing role="evidence" style="story">"{{customer_name}}'s transformation"</framing>
<framing role="evidence" style="data">"{{metric_improvement}} across {{number}} implementations"</framing>

<!-- CTA Role Framings -->
<framing role="cta" style="direct">"Let's start with {{specific_next_step}}"</framing>
<framing role="cta" style="question">"Ready to {{action}}?"</framing>
<framing role="cta" style="story">"Join {{number}} teams who have already {{action}}"</framing>
<framing role="cta" style="data">"{{time_to_value}} to see first results"</framing>
```

### AskUserQuestion Tool Pattern

```json
{
  "questions": [{
    "question": "Which message framing resonates best for '{{section.title}}'?",
    "header": "Message",
    "options": [
      {"label": "Direct Challenge", "description": "{{direct_framing_text}}"},
      {"label": "Question Hook", "description": "{{question_framing_text}}"},
      {"label": "Story Setup", "description": "{{story_framing_text}}"},
      {"label": "Data Lead", "description": "{{data_framing_text}}"}
    ],
    "multiSelect": false
  }]
}
```

### Project Structure Notes

- **Files to modify:**
  - `.slide-builder/workflows/plan-deck/instructions.md` - Add step 2.6 (message discovery loop)
  - `.slide-builder/workflows/plan-deck/workflow.yaml` - No changes needed (agenda_sections already exists)

- **Expected test locations:** Manual testing via `/sb:plan-deck` execution

- **Estimated effort:** 2 story points

- **Prerequisites:** Story 13.1 (Agenda Structure Generation) - DONE

### Key Code References

**Step 2.5 (agenda generation) - Source of {{agenda_sections}}:**
`.slide-builder/workflows/plan-deck/instructions.md:146-308`

**AskUserQuestion tool documentation:**
Tech-spec-enhanced-planning.md:211-246

**Phase 2 implementation guidance:**
Tech-spec-enhanced-planning.md:154-207

### Learnings from Previous Story

**From Story 13.1 (Status: done)**

- **Workflow Pattern Established**: Step 2.5 uses `<step>`, `<action>`, `<check>`, `<output>`, `<ask>`, `<goto>` XML tags
- **AskUserQuestion Integration**: Tool has 4-option limit per question, multiSelect: true/false controls selection mode
- **Variable Storage**: `{{agenda_sections}}` array contains sections with full structure
- **Custom Input Handling**: "Other" option allows user to provide custom text, which is parsed into proper structure
- **User Flow**: Present options → Wait for response → Handle custom input → Store result → Confirm and proceed

**Key Implementation Notes from 13.1:**
- Use clear section markers with `<!-- ═══════ -->` for readability
- Include output messages showing progress
- Add validation checks (e.g., minimum sections warning)
- Store selections in structured format for downstream use

[Source: notes/sprint-artifacts/story-13-1-agenda-structure-generation.md#Dev-Agent-Record]

---

## Context References

**Tech-Spec:** [tech-spec-enhanced-planning.md](../tech-spec-enhanced-planning.md) - Primary context document containing:
- Phase 2 implementation patterns
- AskUserQuestion tool usage
- Message framing examples
- Discovery flow state machine

**Epic:** Epic 13 in [epics.md](../epics.md) - Stories 13.2 definition

**Previous Story:** [story-13-1-agenda-structure-generation.md](./story-13-1-agenda-structure-generation.md) - Foundation for this story

---

## Dev Agent Record

### Context Reference

[13-2-section-message-discovery.context.xml](./13-2-section-message-discovery.context.xml)

### Agent Model Used

Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0)

### Debug Log References

**2026-01-28: Implementation Plan**
- Insertion point: After line 309 (end of Step 2.5) in plan-deck/instructions.md
- Pattern: Follow Step 2.5 XML structure with `<step>`, `<action>`, `<check>`, `<output>` tags
- Key constraint: AskUserQuestion multiSelect: false for single-select
- Storage: section.discovery.key_message for each section

**Implementation Details:**
- Added Step 2.6 with `for-each="section in agenda_sections"` iteration
- Section header shows progress (loop_index of total_sections)
- Message framing generation based on 6 narrative_roles (opening, context, problem, solution, evidence, cta)
- Each role generates 4 framing styles: Direct, Question, Story, Data
- AskUserQuestion tool call with multiSelect: false
- Handles both selected options and "Other" custom input
- Confirmation output shows stored key_message

### Completion Notes List

- Tasks 1-4 completed: Added Step 2.6 to plan-deck/instructions.md
- Step 2.6 iterates through agenda_sections with for-each pattern
- Message framings are contextual to narrative_role (6 roles mapped to 4 framing styles each)
- AskUserQuestion uses multiSelect: false (single-select) per AC #3
- Discovery object initialized and key_message stored per AC #4, #5, #6
- ✅ Test Gate PASSED by Vishal (2026-01-28)

**Completed:** 2026-01-28
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

- `.slide-builder/workflows/plan-deck/instructions.md` (MODIFIED) - Added Step 2.6 section message discovery loop

