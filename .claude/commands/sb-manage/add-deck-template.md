---
description: 'Create new multi-slide deck templates via guided conversation and iterative slide building'
---

# Slide Builder - Add Deck Template Command

This command creates a new multi-slide deck template through conversational discovery, scaffolding, and iterative slide creation.

**Usage:** `/sb:add-deck-template`

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/add-deck-template/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/add-deck-template/instructions.md
3. Execute the workflow steps in order:
   - Phase 1: Initialize, Discover, and Scaffold
     - Verify theme.json exists, load brand context
     - Conversational discovery (3+ exchanges): purpose, context requirements, slide sequence
     - Create folder structure, template-config.yaml, deck-templates.json entry
   - Phase 2: Iterative Slide Creation
     - For each slide: choose fresh generation (frontend-design) or catalog template
     - Generate HTML, inject constraint comments, define content_sources
     - Validate HTML compliance, save slide
     - After each slide: continue or stop for later
   - Phase 3: Finalization
     - Update manifest and config counts
     - Report completion with next steps
4. Minimum 3 conversational exchanges before scaffolding
5. Every slide must have constraint comments on all contenteditable elements
6. Template must be consumable by /sb:use-template
</steps>
