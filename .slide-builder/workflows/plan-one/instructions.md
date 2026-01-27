# Plan One Workflow Instructions

This workflow captures intent for a single slide.

```xml
<critical>This workflow creates .slide-builder/single/plan.yaml</critical>
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

  <step n="2" goal="Capture slide intent">
    <ask>
**Single Slide Planning**

Describe the slide you need. Be specific about:
- What the slide should show (diagram, list, comparison, etc.)
- Key points or content to include
- Context (where will this slide be used?)

Example: "An architecture diagram showing our 3-tier system with frontend, API, and database layers"

What slide do you need?
    </ask>
  </step>

  <step n="3" goal="Confirm understanding">
    <action>Parse user intent</action>
    <action>Identify suggested template based on content type</action>
    <action>Summarize understanding</action>

    <output>
**Slide Intent Captured**

I understand you need:
- **Purpose**: {{slide_purpose}}
- **Content type**: {{content_type}}
- **Suggested layout**: {{suggested_template}}

Key elements to include:
{{key_elements}}
    </output>

    <ask>
Is this correct? (yes to proceed, or provide corrections)
    </ask>
  </step>

  <step n="4" goal="Save plan">
    <action>Create .slide-builder/single/plan.yaml with rich context</action>
    <action>Update status.yaml with mode: single</action>

    <output>
**Plan Saved**

Your slide plan is ready at .slide-builder/single/plan.yaml

Run `/sb-build-one` to generate the slide.
    </output>
  </step>

</workflow>
```
