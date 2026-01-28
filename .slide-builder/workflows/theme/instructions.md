# Theme Workflow Instructions

This workflow displays the current theme summary with ANSI color swatches.

```xml
<critical>This workflow reads and displays theme.json with full formatting per tech spec</critical>
<critical>Includes ANSI color swatches for terminal display</critical>
<critical>Updates status.yaml with theme view action</critical>

<workflow>

  <step n="1" goal="Phase 1: Load Theme">
    <action>Check if theme.json exists at .slide-builder/config/theme.json</action>

    <check if="theme.json does not exist">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ **No Theme Found**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You haven't set up a brand theme yet.

Run `/sb:setup` to create your theme from brand assets.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <action>HALT</action>
    </check>

    <action>Read theme.json completely</action>
    <action>Parse JSON structure</action>

    <check if="JSON parsing fails">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ **Theme File Error**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Could not parse theme.json: {{error_details}}

The theme file may be corrupted. Try running `/sb:setup` again.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <action>HALT</action>
    </check>

    <action>Extract theme data:
      - name: theme.name
      - version: theme.version
      - created: theme.generated
      - sources: theme.meta.extractedFrom (website, pdfs)
      - colors: theme.colors (primary, secondary, accent, background, text)
      - typography: theme.typography (fonts, scale, weights)
      - shapes: theme.shapes (borderRadius, shadow)
      - components: theme.components (box, arrow)
      - layouts: theme.slides.layouts (title, content, split, data)
    </action>
  </step>

  <step n="2" goal="Phase 2: Format and Display">
    <action>Generate ANSI color codes for swatches using 24-bit true color escape sequences:
      Format: \x1b[48;2;R;G;Bm██\x1b[0m where R,G,B are decimal values from hex color
      Example: #CCFF00 → \x1b[48;2;204;255;0m██\x1b[0m
    </action>

    <action>Format and display theme summary:</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME: {{theme_name}} (v{{theme_version}})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLORS
  Primary:    {{swatch_primary}} {{color_primary}}
  Secondary:  {{swatch_secondary}} {{color_secondary}}
  Accent:     {{swatch_accent}} {{color_accent}}
  Background: {{swatch_bg_default}} {{color_bg_default}} (default) | {{swatch_bg_alt}} {{color_bg_alt}} (alt)
  Text:       Heading {{color_text_heading}} | Body {{color_text_body}}

TYPOGRAPHY
  Heading: {{font_heading}} ({{weight_bold}})
  Body:    {{font_body}} ({{weight_regular}})
  Mono:    {{font_mono}}
  Scale:   Hero {{scale_hero}} → H1 {{scale_h1}} → H2 {{scale_h2}} → Body {{scale_body}}

SHAPES
  Boxes:   {{radius_medium}} corners, {{shadow_medium}}
  Callout: {{radius_medium}} corners, {{border_callout}}
  Arrows:  {{arrow_stroke}} stroke, {{arrow_head}} heads

LAYOUTS ({{layout_count}} templates)
  {{layout_list}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created: {{theme_created}}
Sources: {{sources_list}}
Full theme: .slide-builder/config/theme.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <note>If terminal does not support ANSI colors, display hex codes without swatches</note>
  </step>

  <step n="2.5" goal="Phase 2.5: Display Version History Summary">
    <!-- Version Manager: List Versions -->
    <action>Scan .slide-builder/config/theme-history/ directory for theme-v*.json files</action>
    <action>For each file found, parse version number and date from filename:
      - Pattern: theme-v{N}-{YYYY-MM-DD}.json
      - Extract: version = N, date = YYYY-MM-DD
    </action>
    <action>Sort files by version number (ascending)</action>
    <action>Count total versions: {{version_count}}</action>

    <check if="version_count > 0">
      <output>
VERSION HISTORY
  {{version_count}} version(s) saved in theme-history/
  Latest backup: v{{latest_version}} ({{latest_date}})
  Use `/sb:theme-edit` to make changes (auto-saves version before edit)
      </output>
    </check>

    <check if="version_count == 0">
      <output>
VERSION HISTORY
  No version history yet.
  Versions are created when you edit the theme via `/sb:theme-edit`
      </output>
    </check>
  </step>

  <step n="3" goal="Phase 3: Log Action">
    <action>Read .slide-builder/status.yaml</action>
    <action>Update last_action: "Theme viewed via /theme"</action>
    <action>Update last_modified with current ISO 8601 timestamp</action>
    <action>Append to history array:
      - action: "Theme viewed via /theme"
        timestamp: "{{current_iso_timestamp}}"
    </action>
    <action>Save status.yaml preserving existing structure</action>

    <output>
To modify your theme, run `/sb:theme-edit`
    </output>
  </step>

</workflow>
```

## Variable Extraction Guide

When executing this workflow, extract values from theme.json as follows:

### Metadata
- `{{theme_name}}` = theme.name (e.g., "Amperity")
- `{{theme_version}}` = theme.version (e.g., "1.0")
- `{{theme_created}}` = theme.generated (e.g., "2026-01-26")

### Sources
- `{{sources_list}}` = Combine theme.meta.extractedFrom.website + pdfs count
  - Example: "amperity.com, 6 PDFs"

### Colors (with ANSI swatches)
- `{{color_primary}}` = theme.colors.primary (e.g., "#CCFF00")
- `{{color_secondary}}` = theme.colors.secondary (e.g., "#5DBAB6")
- `{{color_accent}}` = theme.colors.accent (e.g., "#FF6B6B")
- `{{color_bg_default}}` = theme.colors.background.default (e.g., "#FFFFFF")
- `{{color_bg_alt}}` = theme.colors.background.alt (e.g., "#F5F5F5")
- `{{color_text_heading}}` = theme.colors.text.heading (e.g., "#1A1A1A")
- `{{color_text_body}}` = theme.colors.text.body (e.g., "#4A4A4A")

### Typography
- `{{font_heading}}` = Extract font name from theme.typography.fonts.heading
  - Example: "'Outfit', system-ui..." → "Outfit"
- `{{font_body}}` = Extract font name from theme.typography.fonts.body
- `{{font_mono}}` = Extract font name from theme.typography.fonts.mono
  - Example: "'SF Mono', 'Monaco'..." → "SF Mono"
- `{{weight_bold}}` = theme.typography.weights.bold (e.g., "700")
- `{{weight_regular}}` = theme.typography.weights.regular (e.g., "400")
- `{{scale_hero}}` = theme.typography.scale.hero (e.g., "72px")
- `{{scale_h1}}` = theme.typography.scale.h1 (e.g., "48px")
- `{{scale_h2}}` = theme.typography.scale.h2 (e.g., "36px")
- `{{scale_body}}` = theme.typography.scale.body (e.g., "18px")

### Shapes
- `{{radius_medium}}` = theme.shapes.borderRadius.medium (e.g., "8px")
- `{{shadow_medium}}` = Describe shadow style (e.g., "medium shadow")
- `{{border_callout}}` = Describe callout style from theme.components.box.callout.border
- `{{arrow_stroke}}` = theme.components.arrow.default.strokeWidth (e.g., "2px")
- `{{arrow_head}}` = theme.components.arrow.default.headType (e.g., "arrow")

### Layouts
- `{{layout_count}}` = Count of keys in theme.slides.layouts
- `{{layout_list}}` = Comma-separated list of layout names
  - Example: "title, content, split, data"

## ANSI Color Swatch Generation

To generate colored swatches in terminal:

1. Parse hex color (e.g., "#CCFF00")
2. Convert to RGB: R=204, G=255, B=0
3. Generate ANSI escape sequence: `\x1b[48;2;204;255;0m██\x1b[0m`
4. This creates a colored block (██) with the background color

For terminals that don't support 24-bit color:
- Fall back to displaying just the hex code without swatch
- Example: "Primary: #CCFF00" instead of "Primary: ██ #CCFF00"
