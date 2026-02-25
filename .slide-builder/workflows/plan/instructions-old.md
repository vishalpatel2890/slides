# Plan Workflow Instructions

This workflow routes to the appropriate planning workflow based on deck registry state.

```xml
<critical>This is a context-aware router workflow - it checks for in-progress decks before presenting choices</critical>
<critical>Deck registry location: .slide-builder/status.yaml under decks: key</critical>
<critical>In-progress status values: planned or building (not complete)</critical>

<workflow>

  <step n="1" goal="Read deck registry and identify in-progress decks">
    <action>Read .slide-builder/status.yaml file</action>

    <check if="status.yaml is missing OR cannot be read">
      <output>Could not read deck registry. Showing standard options.</output>
      <action>Set {{in_progress_decks}} = empty list</action>
      <goto step="2">Present choices</goto>
    </check>

    <check if="status.yaml exists but decks: key is missing">
      <output>Deck registry not found in status.yaml. Showing standard options.</output>
      <action>Set {{in_progress_decks}} = empty list</action>
      <goto step="2">Present choices</goto>
    </check>

    <check if="YAML parse fails">
      <output>Could not parse status.yaml. Showing standard options.</output>
      <action>Set {{in_progress_decks}} = empty list</action>
      <goto step="2">Present choices</goto>
    </check>

    <action>Parse the decks: section completely</action>
    <action>Filter for decks where status == "planned" OR status == "building"</action>
    <action>For each matching deck, extract: name, status, total_slides, built_count, output_folder</action>
    <action>Store filtered list as {{in_progress_decks}}</action>
  </step>

  <step n="2" goal="Present appropriate choice based on deck registry state">
    <check if="{{in_progress_decks}} is empty">
      <ask context="**Slide Planning**

What would you like to create?"
           header="Plan">
        <choice label="Full deck" description="Plan a complete presentation with narrative structure" />
        <choice label="Single slide" description="Create a quick, one-off slide" />
      </ask>
      <goto step="3">Route based on selection</goto>
    </check>

    <check if="{{in_progress_decks}} is not empty">
      <action>Count decks in {{in_progress_decks}} as {{deck_count}}</action>
      <action>Build deck list text for context:
        For each deck in {{in_progress_decks}}:
        - **{{deck.name}}** ({{deck.status}}) — {{deck.built_count}}/{{deck.total_slides}} slides built
      </action>

      <ask context="**Slide Planning**

You have {{deck_count}} deck(s) in progress:
{{deck_list_text}}

What would you like to do?"
           header="Plan">
        <choice label="Continue deck" description="Resume building an in-progress deck" />
        <choice label="New deck" description="Start planning a new presentation" />
        <choice label="Single slide" description="Create a standalone slide" />
      </ask>
    </check>
  </step>

  <step n="3" goal="Route based on user selection">
    <check if="user selected 'Single slide'">
      <action>Invoke plan-one workflow</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/plan-one/workflow.yaml</invoke-workflow>
    </check>

    <check if="user selected 'Full deck' OR user selected 'New deck'">
      <action>Invoke plan-deck workflow (fresh start)</action>
      <invoke-workflow>{project-root}/.slide-builder/workflows/plan-deck/workflow.yaml</invoke-workflow>
    </check>

    <check if="user selected 'Continue deck'">
      <goto step="4">Handle continue deck selection</goto>
    </check>

    <check if="user intent unclear">
      <ask context="I'm not sure which option you need. Please select one:"
           header="Plan">
        <choice label="Single slide" description="Create a standalone slide" />
        <choice label="Full deck" description="Plan a new presentation" />
      </ask>
    </check>
  </step>

  <step n="4" goal="Handle continue deck selection">
    <check if="{{in_progress_decks}} has exactly 1 deck">
      <action>Auto-select the single in-progress deck</action>
      <action>Extract {{selected_deck.output_folder}} from the deck entry</action>
      <action>Set {{plan_yaml_path}} = {{selected_deck.output_folder}}/plan.yaml</action>
      <output>Continuing with **{{selected_deck.name}}** ({{selected_deck.built_count}}/{{selected_deck.total_slides}} slides built)</output>
      <goto step="5">Load deck and route to plan-deck</goto>
    </check>

    <check if="{{in_progress_decks}} has multiple decks">
      <action>Build selection list with deck details:
        For each deck in {{in_progress_decks}}:
        Create choice with label={{deck.name}} and description="{{deck.status}} — {{deck.built_count}}/{{deck.total_slides}} slides built"
      </action>

      <ask context="**Select Deck to Continue**

Choose which deck to continue working on:"
           header="Deck">
        <!-- Dynamically generated choices for each deck -->
        <!-- Example with 2 decks: -->
        <!-- <choice label="{{deck1.name}}" description="{{deck1.status}} — {{deck1.built_count}}/{{deck1.total_slides}} slides built" /> -->
        <!-- <choice label="{{deck2.name}}" description="{{deck2.status}} — {{deck2.built_count}}/{{deck2.total_slides}} slides built" /> -->
      </ask>

      <action>Match user selection to deck in {{in_progress_decks}} by name</action>
      <action>Extract {{selected_deck.output_folder}} from the matched deck entry</action>
      <action>Set {{plan_yaml_path}} = {{selected_deck.output_folder}}/plan.yaml</action>
    </check>
  </step>

  <step n="5" goal="Load selected deck and route to plan-deck modification loop">
    <action>Read the deck's plan.yaml from {{plan_yaml_path}}</action>

    <check if="plan.yaml cannot be read">
      <output>Could not load plan.yaml for selected deck. Starting fresh with plan-deck.</output>
      <invoke-workflow>{project-root}/.slide-builder/workflows/plan-deck/workflow.yaml</invoke-workflow>
    </check>

    <action>Load plan.yaml content into {{deck_plan}}</action>
    <action>Set {{continue_from_phase}} = 5</action>
    <output>Loaded deck plan. Routing to modification loop...</output>
    <invoke-workflow continue_from_phase="5">{project-root}/.slide-builder/workflows/plan-deck/workflow.yaml</invoke-workflow>
  </step>

</workflow>
```
