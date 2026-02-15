# Add Slide Workflow Instructions

This workflow adds a new slide to an existing deck plan through conversational discovery.

```xml
<critical>Always use Deck Selection Protocol for deck selection</critical>
<critical>Position must be validated: between 1 and total_slides</critical>
<critical>Rename slide FILES in REVERSE order (highest first) before modifying plan</critical>
<critical>Build the new slide immediately - do NOT defer to build-one</critical>
<critical>Run regenerate-viewer.js after building to update manifest</critical>
<critical>Update both plan.yaml and status.yaml with correct counts</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 1: Deck Selection                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Select deck using Deck Selection Protocol">
    <action>Read .slide-builder/status.yaml completely</action>
    <action>Parse the `decks:` section to get all deck entries</action>
    <action>Filter decks to only those with status: planned, building, or complete (all are eligible for adding slides)</action>

    <!-- Handle argument provided -->
    <check if="command argument (deck slug) is provided">
      <action>Look up the slug in `decks:` registry keys</action>

      <check if="slug exists in registry">
        <action>Set {{deck_slug}} = provided slug</action>
        <action>Set {{deck}} = the matching deck entry</action>
        <goto step="2">Load deck plan</goto>
      </check>

      <check if="slug NOT found in registry">
        <action>Collect all valid deck slugs from `decks:` keys</action>
        <output>
**Error: Deck not found**

No deck with slug "{{provided_slug}}" exists.

**Available decks:**
{{numbered_list_of_valid_slugs}}
        </output>
        <action>HALT</action>
      </check>
    </check>

    <!-- No argument provided -->
    <action>Count eligible entries in `decks:` section (status = planned, building, or complete)</action>

    <check if="zero eligible decks">
      <output>
**No decks found**

No decks are available for adding slides. Run `/sb:plan-deck` first to create a deck.
      </output>
      <action>HALT</action>
    </check>

    <check if="exactly one eligible deck">
      <action>Auto-select that deck</action>
      <action>Set {{deck_slug}} = the single deck key</action>
      <action>Set {{deck}} = the single deck entry</action>
      <goto step="2">Load deck plan</goto>
    </check>

    <check if="multiple eligible decks">
      <action>Present numbered list of all eligible decks:
        1. "Deck Name" (status, X/Y slides) - deck-slug
        2. "Deck Name" (status, X/Y slides) - deck-slug
        ...
      </action>
      <ask>Which deck would you like to add a slide to? (enter number)</ask>
      <action>Set {{deck_slug}} = selected deck key</action>
      <action>Set {{deck}} = selected deck entry</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 2: Load Deck Plan                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Load the selected deck's plan.yaml">
    <action>Read output/{{deck_slug}}/plan.yaml completely</action>
    <action>Parse `slides:` array to get all existing slides</action>
    <action>Store {{total_slides}} = count of slides in array</action>
    <action>Parse `agenda:` section if it exists</action>
    <action>Store {{has_agenda}} = true if agenda.sections exists, else false</action>

    <check if="plan.yaml not found or unreadable">
      <output>
**Error: Plan not found**

Could not read plan.yaml for deck "{{deck_slug}}".
Expected location: output/{{deck_slug}}/plan.yaml
      </output>
      <action>HALT</action>
    </check>

    <goto step="3">Position selection</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 3: Position Selection                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Ask where to insert the new slide">
    <action>Display current slides with number and intent summary:
      Current slides in "{{deck.name}}":
      1. {{slides[0].intent}} ({{slides[0].status}})
      2. {{slides[1].intent}} ({{slides[1].status}})
      ...
    </action>

    <output>
**Current slides in "{{deck.name}}":**

{{numbered_slides_with_intent}}

Total: {{total_slides}} slides
    </output>

    <ask>Where should the new slide go? (e.g., "after 3" or "at end")</ask>

    <!-- Parse position -->
    <check if="user says 'at end' or 'end'">
      <action>Set {{insert_position}} = {{total_slides}} + 1</action>
      <action>Set {{insert_after}} = {{total_slides}}</action>
      <goto step="4">Slide discovery</goto>
    </check>

    <check if="user says 'after N' where N is a number">
      <action>Extract N from user input</action>

      <check if="N < 1">
        <output>
**Invalid position**

Slide numbers start at 1. Please specify a valid position.
        </output>
        <goto step="3">Ask again</goto>
      </check>

      <check if="N > {{total_slides}}">
        <output>
**Invalid position**

Position must be between 1 and {{total_slides}}. Use "at end" to append.
        </output>
        <goto step="3">Ask again</goto>
      </check>

      <action>Set {{insert_position}} = N + 1</action>
      <action>Set {{insert_after}} = N</action>
      <goto step="4">Slide discovery</goto>
    </check>

    <check if="position unclear">
      <output>
Please specify position as "after N" (where N is 1-{{total_slides}}) or "at end".
      </output>
      <goto step="3">Ask again</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 4: Slide Discovery                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Conversational discovery for slide content">
    <output>
**New slide will be inserted as slide {{insert_position}}**

Let's capture what this slide should communicate.
    </output>

    <ask>What is the intent of this slide? (What should it convey to the audience?)</ask>
    <action>Store {{slide_intent}} = user response</action>

    <ask>What are the key points this slide should communicate? (List 2-4 points)</ask>
    <action>Store {{key_points}} = parsed list from user response</action>

    <output>
**Tone Selection**

What tone should this slide have?
    </output>

    <action>Use AskUserQuestion tool:
      {
        "questions": [{
          "question": "Select one:",
          "header": "Tone",
          "options": [
            {"label": "Professional", "description": "Clean, corporate, trustworthy"},
            {"label": "Bold", "description": "High impact, attention-grabbing"},
            {"label": "Technical", "description": "Detailed, data-focused, precise"},
            {"label": "Warm", "description": "Friendly, approachable, human"}
          ],
          "multiSelect": false
        }]
      }
    </action>
    <action>Store {{slide_tone}} = selected tone (lowercase)</action>

    <ask>Any visual guidance for this slide? (e.g., "include diagram", "use icons", "photo-based") - or press Enter to skip</ask>
    <action>Store {{visual_guidance}} = user response or null if skipped</action>

    <!-- Template suggestion -->
    <action>Read catalog.json from .slide-builder/config/catalog/slide-templates.json</action>
    <action>Match slide intent against template use_cases to suggest best template</action>
    <action>Store {{suggested_template}} = best matching template id or null</action>

    <check if="suggested_template found">
      <output>
**Suggested template:** {{suggested_template}} - {{template_description}}
      </output>
    </check>

    <goto step="5">Agenda assignment</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 5: Agenda Section Assignment                                        -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Assign slide to an agenda section (if agenda exists)">
    <check if="{{has_agenda}} == false">
      <action>Set {{agenda_section_id}} = null</action>
      <goto step="6">Plan modification</goto>
    </check>

    <check if="{{has_agenda}} == true">
      <action>Display agenda sections from plan.yaml:
        Agenda sections:
        1. {{agenda.sections[0].title}} - {{agenda.sections[0].description}}
        2. {{agenda.sections[1].title}} - {{agenda.sections[1].description}}
        ...
      </action>

      <output>
**Agenda Sections**

{{numbered_agenda_sections}}
      </output>

      <ask>Which section does this slide belong to? (enter number, or "none" to skip)</ask>

      <check if="user selects valid section number">
        <action>Set {{agenda_section_id}} = agenda.sections[selected - 1].id</action>
      </check>

      <check if="user says 'none' or skips">
        <action>Set {{agenda_section_id}} = null</action>
      </check>
    </check>

    <goto step="6">Plan modification</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 6: Rename Existing Slide Files                                      -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="6" goal="Rename slide files to make room for new slide">
    <critical>Files MUST be renamed in REVERSE order (highest first) to avoid conflicts</critical>
    <critical>Only rename if inserting in the middle - skip if appending at end</critical>

    <check if="{{insert_position}} > {{total_slides}}">
      <action>Skip file renaming - appending at end</action>
      <goto step="7">Plan modification</goto>
    </check>

    <action>List all slide files in output/{{deck_slug}}/slides/ matching pattern slide-N.html</action>
    <action>Sort by N descending (highest first)</action>

    <action>For each slide file where N >= {{insert_position}} (process highest first):
      - Rename slide-N.html → slide-(N+1).html
      - Rename slide-N-state.json → slide-(N+1)-state.json (if exists)
    </action>

    <output>
📁 Renamed {{files_renamed}} slide files to make room for new slide at position {{insert_position}}
    </output>

    <goto step="7">Plan modification</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 7: Plan Modification                                                -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="7" goal="Insert new slide at position and renumber subsequent slides in plan">
    <!-- Determine background_mode using rhythm rules -->
    <action>Determine {{background_mode}} for new slide:
      1. If {{insert_position}} == 1 (first slide): background_mode = "dark"
      2. If {{insert_position}} > {{total_slides}} (last slide): background_mode = "dark"
      3. Otherwise, check adjacent slides:
         - Look at slides[insert_position - 2] and slides[insert_position - 1] (the two slides before)
         - If both are "dark": background_mode = "light"
         - If previous slide is "light" and one before that is "light": background_mode = "dark"
         - Default: alternate from previous slide's background_mode
      4. If existing slides don't have background_mode: default to "dark"
    </action>

    <action>Construct new slide object:
      new_slide:
        number: {{insert_position}}
        intent: "{{slide_intent}}"
        template: "{{suggested_template}}"  # null if no suggestion
        status: pending
        agenda_section_id: "{{agenda_section_id}}"  # null if no agenda
        background_mode: "{{background_mode}}"  # "dark" or "light" based on rhythm
        key_points:
          {{key_points_as_yaml_list}}
        visual_guidance: "{{visual_guidance}}"  # null if skipped
        tone: "{{slide_tone}}"
    </action>

    <!-- Renumber subsequent slides in plan -->
    <action>For each slide in plan.slides where slide.number >= {{insert_position}}:
      slide.number = slide.number + 1
    </action>

    <!-- Insert new slide -->
    <action>Insert new_slide into slides array at index {{insert_position}} - 1</action>

    <!-- Write plan.yaml -->
    <action>Write updated plan.yaml to output/{{deck_slug}}/plan.yaml</action>
    <action>Preserve all other plan content (deck_name, deck_description, audience, agenda, etc.)</action>

    <output>
📝 Plan updated - slide {{insert_position}} added, subsequent slides renumbered
    </output>

    <goto step="8">Build slide</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 8: Build the New Slide                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="8" goal="Generate HTML for the new slide">
    <critical>This step generates the slide HTML - follows build-one patterns</critical>

    <!-- Load theme -->
    <action>Read .slide-builder/config/theme.json</action>

    <!-- Load design standards -->
    <action>Read .slide-builder/config/design-standards.md</action>
    <action>Extract typography minimums (Hero: 64px, h1: 48px, body: 24px, etc.)</action>

    <!-- Load catalog and match template -->
    <action>Read .slide-builder/config/catalog/slide-templates.json</action>

    <check if="{{suggested_template}} exists">
      <action>Find template in catalog.templates where id == {{suggested_template}}</action>
      <check if="template found">
        <action>Read template HTML from .slide-builder/config/catalog/{{template.file}}</action>
        <action>Use template as structural reference</action>
      </check>
    </check>

    <check if="no template match or {{suggested_template}} is null">
      <action>Use frontend-design skill for custom layout</action>
    </check>

    <!-- Generate slide HTML -->
    <action>Generate complete HTML slide following build-one requirements:
      - Viewport: width=1920, height=1080
      - Body/slide: 1920x1080px
      - All text elements: contenteditable="true" with unique data-field
      - CSS uses --color-* variables from theme
      - Include auto-save script with saveEdits() function
      - Structural elements have data-animatable="true"
    </action>

    <action>Map theme.json to CSS custom properties:
      --color-primary: {{theme.colors.primary}}
      --color-secondary: {{theme.colors.secondary}}
      --color-accent: {{theme.colors.accent}}
      --color-bg-default: {{theme.colors.background.default}}
      --color-bg-alt: {{theme.colors.background.alt}}
      --color-bg-dark: {{theme.colors.background.dark}}
      --color-bg-light: {{theme.colors.background.light}}
      --color-text-heading: {{theme.colors.text.heading}}
      --color-text-body: {{theme.colors.text.body}}
      --color-text-on-dark: {{theme.colors.text.onDark}}
      --color-text-on-light: {{theme.colors.text.onLight}}
      --font-heading: {{theme.typography.fonts.heading}}
      --font-body: {{theme.typography.fonts.body}}
    </action>

    <!-- Apply background_mode to slide colors -->
    <action>Apply colors based on {{background_mode}}:
      If background_mode == "dark":
        - body/slide background: var(--color-bg-default) or #0C0C0C
        - heading text: var(--color-text-on-dark) or #FFFFFF
        - body text: var(--color-text-body) or #E8EDEF
        - accent: var(--color-accent) or #EAFF5F

      If background_mode == "light":
        - body/slide background: var(--color-bg-light) or #FFFFFF
        - heading text: var(--color-text-on-light) or #0C0C0C
        - body text: var(--color-text-on-light) or #0C0C0C
        - accent: #004b57 (Dusk)
    </action>

    <action>Generate content from slide discovery:
      - intent → title/headline
      - key_points → body content, bullets
      - visual_guidance → layout choices
      - tone → word choice and styling
    </action>

    <!-- Write slide file -->
    <action>Ensure output/{{deck_slug}}/slides/ directory exists</action>
    <action>Write HTML to output/{{deck_slug}}/slides/slide-{{insert_position}}.html</action>
    <action>Create state file at output/{{deck_slug}}/slides/slide-{{insert_position}}-state.json:
      {
        "slide": {{insert_position}},
        "edits": [],
        "lastModified": null
      }
    </action>

    <output>
🎨 Built slide {{insert_position}}: "{{slide_intent}}"
    </output>

    <goto step="9">Update manifest</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 9: Update Manifest and Viewer                                       -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="9" goal="Regenerate manifest and viewer to include new slide">
    <action>Run: node scripts/regenerate-viewer.js {{deck_slug}}</action>
    <action>This updates:
      - output/{{deck_slug}}/slides/manifest.json
      - output/{{deck_slug}}/index.html
    </action>

    <output>
📊 Manifest and viewer updated
    </output>

    <goto step="10">Status update</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 10: Status Update                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="10" goal="Update status.yaml and plan.yaml with new counts">
    <!-- Update plan.yaml - mark new slide as built -->
    <action>Read output/{{deck_slug}}/plan.yaml</action>
    <action>Find slide with number == {{insert_position}}</action>
    <action>Set slide.status = "built"</action>
    <action>Save plan.yaml</action>

    <!-- Update status.yaml -->
    <action>Read .slide-builder/status.yaml</action>

    <!-- Update deck entry -->
    <action>Set decks[{{deck_slug}}].total_slides = {{total_slides}} + 1</action>
    <action>Set decks[{{deck_slug}}].built_count = decks[{{deck_slug}}].built_count + 1</action>
    <action>Set decks[{{deck_slug}}].current_slide = {{insert_position}}</action>

    <check if="decks[{{deck_slug}}].status == 'complete'">
      <action>Keep status as "complete" (slide was built immediately)</action>
    </check>

    <check if="decks[{{deck_slug}}].status == 'planned'">
      <action>Set decks[{{deck_slug}}].status = "building"</action>
    </check>

    <action>Set decks[{{deck_slug}}].last_modified = current ISO 8601 timestamp</action>
    <action>Set decks[{{deck_slug}}].last_action = "Added and built slide {{insert_position}}: {{slide_intent_truncated}}"</action>

    <!-- Append to global history -->
    <action>Append to history array:
      - action: "Added slide to {{deck.name}}: Slide {{insert_position}} - {{slide_intent_truncated}}"
        timestamp: "{{current_iso_timestamp}}"
    </action>

    <action>Save status.yaml, preserving all other content and comments</action>

    <goto step="11">Report success</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 11: Report Success                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="11" goal="Confirm slide added and built">
    <output>
✅ **Slide Added Successfully**

**Slide {{insert_position}}:** "{{slide_intent}}"
- Tone: {{slide_tone}}
- Background: {{background_mode}}
- Key points: {{key_points_count}} items
- Template: {{suggested_template or "custom"}}
- Agenda section: {{agenda_section_title or "none"}}
- Status: built ✓

**Deck "{{deck.name}}"**
- Total slides: {{total_slides + 1}}
- Built: {{built_count + 1}}/{{total_slides + 1}}

**Files updated:**
- output/{{deck_slug}}/slides/slide-{{insert_position}}.html (new)
- output/{{deck_slug}}/plan.yaml (renumbered)
- output/{{deck_slug}}/slides/manifest.json (regenerated)
- output/{{deck_slug}}/index.html (regenerated)

**Next steps:**
- `/sb:refresh {{deck_slug}}` - Preview in viewer
- `/sb:edit {{deck_slug}}` - Edit any slide
- `/sb:add-slide {{deck_slug}}` - Add another slide
    </output>
  </step>

</workflow>
```
