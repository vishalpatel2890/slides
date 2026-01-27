# Plan Workflow Instructions

This workflow routes to the appropriate planning workflow.

```xml
<critical>This is a router workflow - it delegates to plan-one or plan-deck</critical>

<workflow>

  <step n="1" goal="Determine planning mode">
    <ask>
**Slide Planning**

What would you like to create?

1. **Single Slide** - Quick, one-off slide for immediate use
2. **Full Deck** - Complete presentation with narrative structure

Enter 1 or 2 (or describe what you need):
    </ask>
  </step>

  <step n="2" goal="Route to appropriate workflow">
    <check if="user chose single slide or 1">
      <action>Invoke plan-one workflow</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/plan-one/workflow.yaml</invoke-workflow>
    </check>

    <check if="user chose full deck or 2">
      <action>Invoke plan-deck workflow</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/plan-deck/workflow.yaml</invoke-workflow>
    </check>

    <check if="user intent unclear">
      <ask>
I'm not sure which mode you need. Would you like:
- A **single slide** (type "single" or "1")
- A **full deck** (type "deck" or "2")
      </ask>
    </check>
  </step>

</workflow>
```
