---
description: 'Display unified slide queue status dashboard showing all decks with progress indicators'
---

# Slide Builder - Status Dashboard

Execute the workflow at `.slide-builder/workflows/status/workflow.yaml`
following the BMAD workflow execution engine at `.bmad/core/tasks/workflow.xml`.

This command displays the unified slide queue status dashboard showing:
- All decks with progress indicators (progress bars, status icons)
- Slide-by-slide status for selected deck with truncated intents
- NEXT marker for the first pending slide
- Single mode status when applicable
- Interactive deck selection for detail view

## Usage

```
/sb:status
```

## What You'll See

**Overview Mode (default):**
- All decks sorted by last modified (most recent first)
- Progress bars showing build completion
- Status icons: checkmark (complete), hourglass (building), empty (planned)
- Quick stats: total decks, complete count, building count, planned count

**Detail Mode (after selecting a deck):**
- Slide-by-slide list with status icons
- Truncated intent descriptions (~35 characters)
- NEXT marker on the first pending slide
- Last modified timestamp

**Single Mode (when mode: single in status.yaml):**
- Current single slide plan details
- Template and status information
- Action suggestions
