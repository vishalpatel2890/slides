# Feature: Adaptive Discovery & Research in Planning Workflows

## Problem

The plan-deck and plan-one workflows produce plans that drive all downstream slide generation, but their discovery phases are shallow. Plan-deck asks 4 fixed sequential questions (purpose, audience, key points, length) regardless of context. Plan-one captures freeform intent with no structured follow-up. Neither workflow integrates research — when section goals say "include concrete numbers," the system can't find those numbers. The deck template system already has a `content_sources` pattern (web_search, file, user_input, mcp_tool) but it's not wired into regular planning.

## Goal

Smarter adaptive questions upfront, optional research when signals warrant it, and content sourcing instructions that build-one can execute.

---

## Files to Modify

| File | Changes |
|------|---------|
| `.slide-builder/workflows/plan-deck/instructions.md` | Phase 2 rewrite, Phase 4 + Phase 5 enhancements |
| `.slide-builder/workflows/plan-one/instructions.md` | Phase 2 structured follow-ups, Phase 4.5 upgrade |
| `.slide-builder/workflows/build-one/instructions.md` | Phase 1A.5 content source resolution, presentation_setting density |
| `.slide-builder/workflows/plan/instructions.md` | Context-aware routing when decks exist |
| `.slide-builder/CONVENTIONS.md` | Document new plan.yaml schema fields |

---

## 1. plan-deck: Adaptive Discovery (Phase 2 Rewrite)

**Replace** 4 fixed sequential prompts with freeform-first + adaptive follow-ups.

### Step 2.1 — Single Freeform Opener

One open-ended prompt replaces the 4 separate questions. Ask the user to share everything they know: goal, audience, key points, data they have, context. Provide rich examples showing what a "good" response looks like (e.g., a pitch with competitor context, a QBR with team details, a training session with prerequisites).

Store full response as `{{raw_context}}`.

### Step 2.2 — Context Extraction & Gap Analysis (automatic, no user prompt)

Parse `{{raw_context}}` using LLM reasoning (not rigid keyword matching) to produce:

**Structured fields** (same as today):
- `purpose`, `audience`, `audience_knowledge_level`, `key_points`, `deck_name`

**Researchable entities** — any proper nouns, companies, products, technologies, markets, or specific claims the user mentioned that could be enriched with web research. Store as `{{researchable_entities}}` array. Examples:
- "Acme Corp" → research their business, size, recent news
- "CDP market" → research market size, trends, key players
- "our Q4 results beat industry average" → research what the industry average actually is
- "Kubernetes migration" → research common patterns, pitfalls, benchmarks

**Context gaps** — what's missing from the user's response that would materially improve the plan. Not a fixed checklist — reason about what THIS specific presentation needs. Examples of gaps the LLM might identify:
- Audience is mentioned but their decision-making power isn't clear
- Key points are listed but no supporting data or evidence is referenced
- The goal is persuasion but no objections or concerns are anticipated
- A comparison is implied but only one side is described

Store gaps as `{{context_gaps}}` array (max 3 most important).

### Step 2.3 — Research (conditional, BEFORE follow-ups)

If `{{researchable_entities}}` is non-empty, offer research **before** asking follow-ups so that follow-up questions can reference findings.

Present the detected entities and offer to research:
```
I noticed you mentioned {{entity_names}}. I can look up relevant context to help plan stronger content.

- Yes, research now (~30 seconds)
- Skip, I'll provide details myself
```

If accepted:
- Perform WebSearch for each entity/topic
- Store as `{{planning_research}}` array with query, findings, source_urls
- Summarize key findings to the user before proceeding

If skipped or no entities detected:
- Set `{{planning_research}}` = null, continue

### Step 2.4 — Research-Aware Adaptive Follow-ups (1-3 questions max)

Ask follow-ups to fill `{{context_gaps}}`, now informed by `{{planning_research}}` findings.

**Mandatory**: If audience or key points are entirely missing, ask for them.

**Adaptive** (1-2 questions from context_gaps): The LLM generates questions dynamically based on what THIS presentation needs — not from a fixed table of signal-to-question mappings. When research findings are available, reference them in the question to ground the conversation.

Example — without research:
> "You mentioned pitching to the VP of Marketing. What are their top 1-2 concerns or objections you expect?"

Example — with research:
> "I found that Acme Corp recently expanded their data team from 5 to 20 people. Does that change how you'd pitch — are they now more technical, or is the VP still your primary audience?"

The key principle: questions should be **contextual to the user's specific situation**, not generic prompts pulled from a lookup table. A PM planning a roadmap review gets different questions than a seller preparing a competitive pitch — but those differences emerge from LLM reasoning about the context, not from keyword pattern matching.

### Step 2.5 — Presentation Setting (always)

Single choice question: live / sent as deck / recorded / hybrid. This drives content density in build-one.

### Step 2.6 — Length Confirmation (always)

Suggest slide count computed from key_points count and purpose type, ask user to confirm or adjust.

**New flow**: Freeform → Extract + gap analysis → Research (if entities found) → Research-aware follow-ups → Setting → Length.

**Net effect**: 4 fixed prompts become 1 freeform + 0-1 research + 1-3 adaptive + 1 setting + 1 length = fewer mandatory interactions but richer, more grounded context. Follow-ups are smarter because they can reference research findings.

---

## 2. plan-deck: Content Sourcing in Section Goals (Phase 4 Enhancement)

After generating the existing 5 goal fields per section, **add a `content_sources` array** by analyzing `content_requirements`:

| Content Requirement Pattern | Generated Source |
|----------------------------|-----------------|
| "specific numbers", "concrete data", "statistics" | `web_search` or `user_input` |
| "case study", "customer story", "example" | `user_input` |
| "market data", "industry trend" | `web_search` |
| "quote", "testimonial" | `user_input` |

If `{{planning_research}}` has findings relevant to this section, include them as `type: planning_research` with `resolved: true`.

Each source entry gets: `type`, `query`/`prompt`/`data`, `for_field` (what slide element it populates), `execute_at` (plan_time or build_time).

Show content_sources in the section goal approval UI so the user sees and approves the sourcing plan alongside the goals.

---

## 3. plan-deck: Slide-Level Sourcing (Phase 5 Enhancement)

When generating slides from section goals, propagate relevant `content_sources` to each slide entry. Each slide in plan.yaml gets an optional `content_sources` array that tells build-one exactly what data to fetch and where to put it.

---

## 4. plan-one: Structured Follow-ups (Phase 2 Enhancement)

Keep the freeform intent capture but add **one targeted follow-up** based on detected content type:

| Content Type | Follow-up |
|-------------|-----------|
| diagram / architecture / flow | "List components and connections" |
| comparison / vs / before-after | "What two things? What's the key difference?" |
| data / metric / stat | Choice: have numbers / need research / use placeholders |
| list / bullets / features | "Ranked by importance, or equal weight?" |
| quote / testimonial | "Exact quote and attribution?" |
| timeline / roadmap | "Milestones and dates — specific or approximate?" |
| generic / unclear | Skip follow-up |

If "need research" is selected for data slides, perform web search and store results.

---

## 5. plan-one: Content Sourcing (Phase 4.5 Upgrade)

Replace the weak message-framing step with content sourcing plan generation. Analyze the slide intent for sourcing needs (data references, company mentions, etc.), generate `content_sources` array, show it to the user for approval before saving.

---

## 6. build-one: Content Source Resolution (Phase 1A.5 Enhancement)

Extend the existing section context loading to also process `content_sources`:

1. `planning_research` sources (resolved: true) — load directly as available data
2. `web_search` sources (execute_at: build_time) — execute WebSearch, store results
3. `user_input` sources (required: true) — prompt user for specific data
4. `file` sources — read referenced files

Pass all resolved content to Phase 3A/3B as `{{enriched_content}}` for slide generation.

Also: when `presentation_setting` exists in plan.yaml, adjust content density:
- **live** → minimal text, headlines + short bullets only
- **sent_as_deck** → self-explanatory text, more detail
- **recorded** / **hybrid** → balanced

---

## 7. Plan Router Enhancement

When in-progress decks exist, offer "Continue deck" / "New deck" / "Single slide" instead of just "single or deck?"

---

## 8. plan.yaml Schema Additions (all optional, backward-compatible)

**Top-level (deck)**:
```yaml
presentation_setting: "live"      # live | sent_as_deck | recorded | hybrid

# Discovery context — flexible key-value pairs from adaptive follow-ups
# Not a fixed schema; varies per presentation based on what gaps were found
discovery_context:
  audience_role: "decision_maker"          # example field, not required
  known_objections: ["Too expensive"]      # example field, not required
  competitive_positioning: "head-to-head"  # example field, not required
  # ... any other context captured from adaptive follow-ups

# Research findings (only present if research was performed)
planning_research:
  - query: "Acme Corp company overview recent news"
    findings:
      - "Acme Corp: $50M ARR, 200 employees, Series C"
      - "Recently expanded data team from 5 to 20"
    source_urls: ["https://..."]
    used_in_sections: ["agenda-1", "agenda-3"]
```

**Section-level** (`agenda.sections[].discovery`):
```yaml
content_sources:
  - type: web_search
    query: "enterprise presentation time stats"
    for_field: "stat-value"
    execute_at: build_time
  - type: planning_research
    data: "48 presentations/month average"
    for_field: "supporting-stat"
    resolved: true
```

**Slide-level** (`slides[]`):
```yaml
content_sources:
  - type: web_search
    query: "..."
    for_field: "stat-value"
    execute_at: build_time
```

**Single slide plan.yaml** — same `content_sources` and `planning_research` fields at top level.

---

## Implementation Order

1. plan-deck Phase 2 (freeform + adaptive discovery) — highest impact
2. plan-deck Phase 4 (content_sources in section goals)
3. plan-deck Phase 5 (slide-level sourcing propagation)
4. plan-one Phase 2 (structured follow-ups)
5. plan-one Phase 4.5 (content sourcing upgrade)
6. build-one Phase 1A.5 + 3A/3B (content source resolution + presentation_setting)
7. plan router (context-aware routing)
8. CONVENTIONS.md (document new schema fields)

---

## Verification

1. **plan-deck smoke test**: Run `/sb-create:plan-deck` with a scenario that mentions a company name and implies data needs. Verify:
   - Freeform opener captures all context in one prompt
   - Gap analysis identifies researchable entities and context gaps
   - Research offer appears BEFORE follow-ups, produces findings when accepted
   - Adaptive follow-ups reference research findings (not generic blind questions)
   - Section goals include `content_sources` arrays
   - Final plan.yaml has `planning_research` and `discovery_context` populated

2. **plan-one smoke test**: Run `/sb-create:plan-one` requesting a data-driven slide. Verify:
   - Content type detection identifies "data" type
   - Targeted follow-up asks about data readiness
   - Content sourcing plan generates web_search source
   - plan.yaml includes `content_sources`

3. **Backward compatibility**: Run `/sb-create:plan-deck` with a simple purpose statement (no signals). Verify:
   - Missing audience/points prompts fire
   - No research offer (no signals)
   - Output plan.yaml is valid and build-one processes it normally

4. **build-one integration**: Build a slide from a plan with `content_sources`. Verify:
   - build_time web_search sources are executed
   - planning_research data is available in slide content
   - presentation_setting affects text density
