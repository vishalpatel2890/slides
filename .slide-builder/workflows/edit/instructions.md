# Edit Workflow Instructions

This workflow enables slide layout editing.

```xml
<critical>This workflow modifies slide layout while preserving text edits</critical>
<critical>Always read state file before regenerating to preserve user edits</critical>

<workflow>

  <step n="1" goal="Load slide for editing">
    <action>Read status.yaml to determine mode</action>

    <check if="single mode">
      <action>Load .slide-builder/single/slide.html</action>
      <action>Load .slide-builder/single/slide-state.json if exists</action>
    </check>

    <check if="deck mode">
      <action>Parse slide number from command argument</action>
      <check if="no slide number provided">
        <ask>Which slide would you like to edit? (1-{{total_slides}})</ask>
      </check>
      <action>Load .slide-builder/deck/slides/slide-{{n}}.html</action>
      <action>Load .slide-builder/deck/slides/slide-{{n}}-state.json if exists</action>
    </check>

    <check if="slide does not exist">
      <output>
**Slide Not Found**

That slide doesn't exist. Build it first with `/sb-build-one`.
      </output>
      <action>HALT</action>
    </check>

    <output>
**Editing Slide {{slide_number}}**

Current layout: {{current_layout_description}}
    </output>
  </step>

  <step n="2" goal="Collect edit request">
    <ask>
**Slide Edit**

Describe the layout change you want. Examples:
- "Move the diagram to the right"
- "Add a fourth column"
- "Make the title bigger"
- "Change to a two-column layout"

Your edit:
    </ask>
  </step>

  <step n="3" goal="Regenerate with preserved edits">
    <action>Read all text edits from state file</action>
    <action>Regenerate layout based on edit request</action>
    <action>Apply saved text edits to matching elements</action>
    <action>Save updated HTML</action>
    <action>Preserve state file</action>

    <output>
**Slide Updated**

Layout changed: {{change_description}}

Your text edits have been preserved.

Preview the updated slide in your browser.
    </output>

    <ask>
Any more edits? (describe change, or "done" to finish)
    </ask>

    <action if="user has more edits">Return to step 2</action>
  </step>

  <step n="4" goal="Complete">
    <action>Update status.yaml with edit action</action>

    <output>
**Edit Complete**

Slide saved. Text edits preserved.
    </output>
  </step>

</workflow>
```
