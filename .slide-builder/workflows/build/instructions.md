# Build Workflow Instructions

This workflow routes to the appropriate build workflow.

```xml
<critical>This is a router workflow - it delegates to build-one or build-all</critical>

<workflow>

  <step n="1" goal="Check for existing plan">
    <action>Read status.yaml to check current mode</action>

    <check if="no mode set or no plan exists">
      <output>
**No Plan Found**

You need to plan your slides first:
- `/sb:plan-one` for a single slide
- `/sb:plan-deck` for a full presentation
      </output>
      <action>HALT</action>
    </check>
  </step>

  <step n="2" goal="Determine build mode">
    <ask>
**Slide Building**

What would you like to build?

1. **Next Slide** - Build the next pending slide from your plan
2. **All Remaining** - Build all unbuilt slides in sequence

Enter 1 or 2 (or describe what you need):
    </ask>
  </step>

  <step n="3" goal="Route to appropriate workflow">
    <check if="user chose next slide or 1">
      <action>Invoke build-one workflow</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/build-one/workflow.yaml</invoke-workflow>
    </check>

    <check if="user chose all remaining or 2">
      <action>Invoke build-all workflow</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/build-all/workflow.yaml</invoke-workflow>
    </check>

    <check if="user intent unclear">
      <ask>
I'm not sure which mode you need. Would you like:
- **Next slide** (type "next" or "1")
- **All remaining** (type "all" or "2")
      </ask>
    </check>
  </step>

</workflow>
```
