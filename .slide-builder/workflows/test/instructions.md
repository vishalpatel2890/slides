# Test Workflow Instructions

This workflow demonstrates the BMAD pattern for Slide Builder workflows.
It validates all acceptance criteria for Story 1.2: Workflow Definition Pattern.

```xml
<critical>This workflow tests the BMAD pattern implementation</critical>
<critical>Steps execute in exact numerical order (1, 2, 3)</critical>

<workflow>

  <step n="1" goal="Demonstrate workflow.yaml loading and variable resolution">
    <action>Display workflow configuration loaded from workflow.yaml</action>
    <action>Show resolved variables: workflow_version = {{workflow_version}}, installed_path = {installed_path}</action>
    <action>Confirm workflow.yaml schema is valid (name, description, instructions path present)</action>

    <output>
**Step 1 Complete: Workflow Configuration Loaded**

- Name: {{name}}
- Description: {{description}}
- Instructions: {installed_path}/instructions.md
- Variables resolved successfully
    </output>
  </step>

  <step n="2" goal="Demonstrate step-by-step execution with checkpoint">
    <action>Execute this step only after Step 1 completes (sequential execution)</action>
    <action>Process action tags in order</action>

    <template-output>
**Step 2: Checkpoint Demonstration**

This content is displayed at a checkpoint. The workflow pauses here for user approval.

Key validation points:
- Steps 1 and 2 executed in numerical order
- Action tags were processed sequentially
- This checkpoint pauses execution

Please review and approve to continue.
    </template-output>
  </step>

  <step n="3" goal="Demonstrate ask tag and completion">
    <action>Execute final step after checkpoint approval</action>

    <ask>
**Step 3: User Input Demonstration**

This demonstrates the `<ask>` tag functionality.

Did all steps execute correctly? (yes/no)
    </ask>

    <action>Record user response and complete workflow</action>

    <output>
**Workflow Complete!**

All three steps executed successfully:
1. Configuration loaded from workflow.yaml
2. Checkpoint paused for approval (template-output tag)
3. User input collected (ask tag)

Story 1.2 acceptance criteria validated:
- AC1.2.1: workflow.yaml read successfully
- AC1.2.2: instructions.md loaded and parsed
- AC1.2.3: Steps executed with checkpoint approvals
- AC1.2.4: Phases completed sequentially (1 -> 2 -> 3)
- AC1.2.5: User approval requested at checkpoint tags
    </output>
  </step>

</workflow>
```
