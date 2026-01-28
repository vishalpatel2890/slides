# Add Template Workflow Instructions

```xml
<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This workflow creates new slide templates through deep conversational discovery</critical>
<critical>Minimum 3-5 exchanges with user before generating template</critical>
<critical>All templates must use CSS variables from theme.json</critical>

<workflow>
  <step n="1" goal="Welcome and Initialize">
    <action>Check that theme.json exists at {theme_file}</action>
    <check if="theme.json does not exist">
      <output>
**Theme Required**

No theme found at `.slide-builder/config/theme.json`.
Please run `/sb:setup` first to create your brand theme.
      </output>
      <action>HALT</action>
    </check>

    <action>Read theme.json to understand brand context</action>
    <action>Read catalog.json to see existing templates</action>

    <output>
**Welcome to Template Builder!**

I'll help you create a new slide template for your presentation library. This is a collaborative process where we'll explore exactly what you need before generating anything.

Your current theme: **{{theme.name}}** ({{theme.personality.classification}} style)
Existing templates: {{template_count}} in catalog

Let's get started!
    </output>

    <ask>**What kind of slide template do you need?**

Describe it however feels natural - the purpose, what it should show, or even just a rough idea.</ask>
  </step>

  <step n="2" goal="Content Exploration">
    <action>Process user's initial description</action>
    <action>Store initial concept as {{template_concept}}</action>

    <ask>**What content will this slide typically display?**

For example:
- Data and metrics (numbers, percentages, charts)
- Text-heavy information (paragraphs, lists, quotes)
- Visual elements (diagrams, icons, images)
- Comparison/contrast (side-by-side, before/after)
- Something else?</ask>
  </step>

  <step n="3" goal="Visual Elements Discovery">
    <action>Store content type as {{content_type}}</action>

    <ask>**What specific visual elements would you like?**

Think about:
- Layout structure (columns, grids, stacked sections)
- Charts or data viz (bar, pie, line, metrics)
- Icons or imagery (decorative, illustrative)
- Text hierarchy (headline, subhead, body, callouts)
- Special features (timelines, flowcharts, tables)

What would make this template most useful for your presentations?</ask>
  </step>

  <step n="4" goal="Style Preferences">
    <action>Store visual elements as {{visual_elements}}</action>

    <ask>**How should this template feel visually?**

Your theme personality is **{{theme.personality.classification}}** with traits: {{theme.personality.traits}}

Should this template:
- Lean into that personality strongly?
- Be more subtle/professional?
- Have a specific mood (energetic, calm, technical, creative)?

Any specific style direction helps me get it right.</ask>
  </step>

  <step n="5" goal="Reference and Inspiration Check">
    <action>Store style preferences as {{style_preferences}}</action>

    <ask>**Do you have any examples or inspiration?**

This is optional but helpful:
- Existing slides you like (file paths)
- Websites or presentations that inspire you
- Specific design patterns you've seen
- Or we can skip this and I'll design based on your description

Any references to share?</ask>
  </step>

  <step n="6" goal="Use Case Clarity">
    <action>Store reference info as {{references}} (can be empty)</action>

    <ask>**When would you use this template?**

Help me understand the typical scenarios:
- What presentation sections? (opening, data, summary, etc.)
- What audience situations? (executive, technical, client)
- What keywords should trigger this template? (for future selection)

This helps me categorize it correctly in your catalog.</ask>
  </step>

  <step n="7" goal="Generate Template Specification">
    <action>Store use cases as {{use_cases_raw}}</action>
    <action>Generate template name from discussion</action>
    <action>Generate template ID (kebab-case from name)</action>
    <action>Generate use_cases array from keywords</action>
    <action>Generate description from discussion summary</action>

    <output>
**Template Specification**

Based on our conversation, here's what I'll create:

**Name:** {{template_name}}
**ID:** {{template_id}}
**File:** `config/catalog/{{template_id}}.html`

**Description:**
{{template_description}}

**Use Cases:** {{use_cases_array}}

**Visual Design:**
- Content type: {{content_type}}
- Elements: {{visual_elements}}
- Style: {{style_preferences}}

**Technical Requirements:**
- 1920x1080 pixels (16:9)
- CSS variables from your theme
- All text editable (contenteditable)
- Auto-save functionality
    </output>

    <ask>**Does this look right?**

Reply:
- **Yes** - Generate the template
- **Adjust [what]** - Let me know what to change
- **Start over** - Begin fresh</ask>
  </step>

  <step n="8" goal="Generate Template via Frontend Design Skill">
    <check if="user confirms 'Yes' or equivalent">
      <action>Read complete theme.json for brand context</action>

      <output>
**Generating Template...**

Invoking frontend-design skill with your specifications.
      </output>

      <action>Invoke the frontend-design skill with the following prompt:</action>

      <reference title="Prompt for frontend-design skill">
```
Create a presentation slide template as a single HTML file.

TEMPLATE REQUIREMENTS:
- Name: {{template_name}}
- Purpose: {{template_description}}
- Content Type: {{content_type}}
- Visual Elements: {{visual_elements}}
- Style Direction: {{style_preferences}}

TECHNICAL REQUIREMENTS:
- Exactly 1920x1080 pixels
- Viewport meta: width=1920, height=1080
- All text elements must have contenteditable="true"
- All text elements must have unique data-field attribute (e.g., data-field="title", data-field="subtitle")
- Use CSS custom properties for ALL colors (--color-primary, --color-secondary, etc.)
- No hardcoded colors - everything via CSS variables
- Include Google Fonts link for Outfit font family

BRAND THEME (use these CSS variables):
:root {
  --color-primary: {{theme.colors.primary}};
  --color-secondary: {{theme.colors.secondary}};
  --color-bg-default: {{theme.colors.background.default}};
  --color-bg-alt: {{theme.colors.background.alt}};
  --color-text-heading: {{theme.colors.text.heading}};
  --color-text-body: {{theme.colors.text.body}};
  --color-text-muted: {{theme.colors.text.muted}};
  --font-heading: {{theme.typography.fonts.heading}};
  --font-body: {{theme.typography.fonts.body}};
}

BRAND PERSONALITY:
- Classification: {{theme.personality.classification}}
- Traits: {{theme.personality.traits}}
- Do: {{theme.personality.guidance.do}}
- Don't: {{theme.personality.guidance.dont}}

STRUCTURE REQUIREMENTS:
- Include <style> block with CSS variables and all styles
- Body and .slide container both 1920x1080px
- Appropriate padding (typically 80px horizontal, 60px vertical)
- Clean, production-ready code

Output ONLY the complete HTML file starting with <!DOCTYPE html>.
Do NOT include any explanation - just the HTML code.
```
      </reference>

      <action>Validate the generated HTML:
        - All text elements have contenteditable="true"
        - All contenteditable elements have unique data-field attributes
        - Viewport meta is width=1920, height=1080
        - Body and .slide are 1920x1080px
        - CSS uses --color-* variables, not hardcoded colors
        - Google Fonts link is included
      </action>

      <action if="validation fails">Fix the issues before saving</action>
    </check>

    <check if="user wants adjustments">
      <action>Apply requested changes to specification</action>
      <goto step="7">Re-confirm specification</goto>
    </check>

    <check if="user wants to start over">
      <goto step="1">Restart workflow</goto>
    </check>
  </step>

  <step n="9" goal="Save Template File">
    <action>Save generated HTML to {catalog_path}/{{template_id}}.html</action>

    <output>
**Template Saved**

File created: `.slide-builder/config/catalog/{{template_id}}.html`
    </output>
  </step>

  <step n="10" goal="Update Catalog Manifest">
    <action>Read current catalog.json from {catalog_manifest}</action>
    <action>Generate ISO timestamp for created_at</action>
    <action>Create new template entry:
      {
        "id": "{{template_id}}",
        "name": "{{template_name}}",
        "description": "{{template_description}}",
        "use_cases": {{use_cases_array}},
        "file": "{{template_id}}.html",
        "preview": null,
        "created_at": "{{timestamp}}",
        "source": "add-template"
      }
    </action>
    <action>Append new entry to templates array</action>
    <action>Update lastModified timestamp</action>
    <action>Write updated catalog.json</action>

    <output>
**Catalog Updated**

- New template added to `catalog.json`
- Template count: {{new_template_count}}
- Source: "add-template"
    </output>
  </step>

  <step n="11" goal="Completion and Preview Offer">
    <output>
**Template Created Successfully!**

**Template:** {{template_name}}
**ID:** {{template_id}}
**File:** `.slide-builder/config/catalog/{{template_id}}.html`
**Catalog:** Updated with {{new_template_count}} total templates

Your new template is ready to use! When you run `/sb:plan-one` or `/sb:build-one`,
you can request this template by name or any of its use cases: {{use_cases_array}}
    </output>

    <ask>**Would you like to open the template in your browser to preview it?**

Reply:
- **Yes** - I'll provide the file path to open
- **No** - All done!</ask>

    <check if="user wants preview">
      <output>
**Preview Your Template**

Open this file in your browser:
`file://{{absolute_catalog_path}}/{{template_id}}.html`

Or from terminal:
```bash
open .slide-builder/config/catalog/{{template_id}}.html
```
      </output>
    </check>

    <output>
**What's Next?**

- Run `/sb:add-template` again to create more templates
- Run `/sb:plan-one` to plan a slide using your new template
- Run `/sb:theme` to see your current theme settings
    </output>
  </step>

</workflow>
```
