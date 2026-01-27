# Theme Workflow Instructions

This workflow displays the current theme summary.

```xml
<critical>This workflow reads and displays theme.json</critical>

<workflow>

  <step n="1" goal="Load and display theme">
    <action>Check if theme.json exists at .slide-builder/theme.json</action>

    <check if="theme.json does not exist">
      <output>
**No Theme Found**

You haven't set up a brand theme yet.

Run `/sb-setup` to create your theme from brand assets.
      </output>
      <action>HALT</action>
    </check>

    <action>Read theme.json</action>
    <action>Format theme summary for display</action>

    <output>
**Current Theme: {{theme_name}}**
Version: {{theme_version}} | Created: {{theme_created}}

**Colors**
- Primary: {{color_primary}}
- Secondary: {{color_secondary}}
- Accent: {{color_accent}}
- Background: {{color_background}}
- Text: {{color_text}}

**Typography**
- Heading font: {{font_heading}}
- Body font: {{font_body}}
- Mono font: {{font_mono}}

**Shapes**
- Corner radius: {{corner_radius}}
- Shadow style: {{shadow_style}}

**Available Templates**
{{template_list}}

Theme file: .slide-builder/theme.json

To modify your theme, run `/sb-theme-edit`
    </output>
  </step>

</workflow>
```
