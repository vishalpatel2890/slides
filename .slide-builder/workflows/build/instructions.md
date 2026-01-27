# Build Workflow Instructions

This workflow generates slides from plans.

```xml
<critical>This workflow generates HTML slides from plan.yaml</critical>
<critical>Requires theme.json and a plan (single or deck mode)</critical>
<critical>Supports build-one (next slide) and build-all (all remaining)</critical>

<workflow>

  <step n="1" goal="Determine mode and load context">
    <action>Read status.yaml to determine current mode (single/deck)</action>
    <action>Load theme.json</action>

    <check if="no mode set">
      <output>
**No Plan Found**

You need to plan your slides first:
- `/sb-plan-one` for a single slide
- `/sb-plan-deck` for a full presentation
      </output>
      <action>HALT</action>
    </check>

    <check if="mode is single">
      <action>Load .slide-builder/single/plan.yaml</action>
    </check>

    <check if="mode is deck">
      <action>Load .slide-builder/deck/plan.yaml</action>
      <action>Identify next unbuilt slide</action>
    </check>
  </step>

  <step n="2" goal="Select layout approach">
    <action>Check slide intent against available templates</action>

    <check if="template matches intent">
      <action>Load matching template from templates/</action>
      <action>Proceed with template-based generation</action>
    </check>

    <check if="no template matches">
      <action>Invoke frontend-design skill for custom layout</action>
      <action>Proceed with custom generation</action>
    </check>
  </step>

  <step n="3" goal="Generate slide">
    <action>Apply theme CSS variables</action>
    <action>Inject content from plan</action>
    <action>Add contenteditable attributes to text elements</action>
    <action>Add auto-save script</action>

    <check if="single mode">
      <action>Save to .slide-builder/single/slide.html</action>
    </check>

    <check if="deck mode">
      <action>Save to .slide-builder/deck/slides/slide-{{n}}.html</action>
      <action>Update plan.yaml slide status to "built"</action>
    </check>
  </step>

  <step n="4" goal="Complete and report">
    <action>Update status.yaml with last_action and history</action>

    <output>
**Slide Generated**

{{slide_location}}

Open in browser to preview and edit text directly.

{{next_steps}}
    </output>
  </step>

</workflow>
```
