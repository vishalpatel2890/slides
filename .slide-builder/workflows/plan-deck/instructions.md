# Plan Deck Workflow Instructions

This workflow captures narrative structure for a full presentation.

```xml
<critical>This workflow creates .slide-builder/deck/plan.yaml</critical>
<critical>Requires theme.json to exist</critical>

<workflow>

  <step n="1" goal="Verify theme exists">
    <action>Check if theme.json exists</action>

    <check if="theme.json does not exist">
      <output>
**Theme Required**

You need a brand theme before creating slides.

Run `/sb-setup` to create your theme.
      </output>
      <action>HALT</action>
    </check>
  </step>

  <step n="2" goal="Capture presentation context">
    <ask>
**Deck Planning**

Tell me about your presentation:

1. **Purpose**: What's the goal of this presentation?
2. **Audience**: Who will see this? What's their knowledge level?
3. **Key message**: What's the one thing they should remember?
4. **Length**: How many slides (roughly)?

Describe your presentation:
    </ask>
  </step>

  <step n="3" goal="Develop narrative structure">
    <action>Parse presentation context</action>
    <action>Develop storyline: opening hook, tension, resolution, call-to-action</action>
    <action>Propose slide-by-slide breakdown</action>

    <output>
**Proposed Narrative Structure**

**Deck: {{deck_name}}**
Audience: {{audience}}
Key message: {{key_message}}

**Storyline:**
- Opening hook: {{opening_hook}}
- Tension: {{tension}}
- Resolution: {{resolution}}
- Call to action: {{call_to_action}}

**Proposed Slides ({{slide_count}}):**
{{slide_breakdown}}
    </output>

    <ask>
Would you like to:
- **Approve** this structure
- **Modify** specific slides (add, remove, reorder)
- **Start over** with different context

Your choice:
    </ask>
  </step>

  <step n="4" goal="Refine plan">
    <check if="user requests modifications">
      <action>Apply requested changes to slide breakdown</action>
      <action>Renumber slides as needed</action>
      <action>Display updated plan</action>
      <goto step="3">Show updated plan</goto>
    </check>
  </step>

  <step n="5" goal="Save plan">
    <action>Create .slide-builder/deck/plan.yaml with full context</action>
    <action>Update status.yaml with mode: deck</action>

    <output>
**Deck Plan Saved**

Your plan is ready at .slide-builder/deck/plan.yaml

Next steps:
- `/sb-build-one` - Build slides one at a time
- `/sb-build-all` - Build all slides at once
    </output>
  </step>

</workflow>
```
