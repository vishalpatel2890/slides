# Theme Edit Workflow Instructions

This workflow modifies an existing theme with visual feedback.

```xml
<critical>This workflow modifies theme.json based on user feedback</critical>
<critical>Always save current theme to history before modifying</critical>

<workflow>

  <step n="1" goal="Load current theme">
    <action>Check if theme.json exists</action>

    <check if="theme.json does not exist">
      <output>
**No Theme Found**

You need to create a theme first.

Run `/sb-setup` to create your theme from brand assets.
      </output>
      <action>HALT</action>
    </check>

    <action>Read current theme.json</action>
    <action>Display current theme summary</action>

    <output>
**Current Theme: {{theme_name}}** (v{{theme_version}})

Ready for modifications.
    </output>
  </step>

  <step n="2" goal="Collect modification request">
    <ask>
**Theme Modification**

What would you like to change? Examples:
- "Make the colors warmer"
- "Use a bolder font for headings"
- "Increase the corner radius"
- "Make it feel more modern"

Your request:
    </ask>
  </step>

  <step n="3" goal="Apply changes and regenerate samples">
    <action>Save current theme to theme-history/</action>
    <action>Interpret feedback and adjust theme primitives</action>
    <action>Update theme.json</action>
    <action>Regenerate sample slides with updated theme</action>

    <template-output>
**Theme Updated**

Changes applied:
{{change_summary}}

Review the updated samples in .slide-builder/samples/
    </template-output>
  </step>

  <step n="4" goal="Confirm or iterate">
    <ask>
How do the updated samples look?
- "Perfect" - Changes will be saved
- Provide more feedback to continue refining

Your response:
    </ask>

    <action if="user approves">Save final theme and update version</action>
    <action if="user provides more feedback">Return to step 3</action>
  </step>

  <step n="5" goal="Complete">
    <output>
**Theme Updated Successfully**

- Theme version: {{new_version}}
- Previous version saved to theme-history/

Your theme is ready for slide generation.
    </output>
  </step>

</workflow>
```
