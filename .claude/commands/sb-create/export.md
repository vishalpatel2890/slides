---
description: 'Export slides to Google Slides - converts HTML to images and uploads via API'
---

# Slide Builder - Export Command

This command exports your slides to Google Slides.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/export/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/export/instructions.md
3. Authenticate with Google (if needed)
4. Convert HTML slides to images using Puppeteer
5. Upload to Google Slides via API
6. Update .slide-builder/status.yaml with workflow progress
</steps>
