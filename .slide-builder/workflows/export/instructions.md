# Export Workflow Instructions

This workflow exports slides to Google Slides.

```xml
<critical>This workflow exports slides to Google Slides via API</critical>
<critical>Requires Google OAuth authentication</critical>
<critical>Slides are in output/{deck_slug}/slides/ (deck) or output/singles/ (single)</critical>

<workflow>

  <step n="1" goal="Check authentication">
    <action>Check for credentials at .slide-builder/credentials/google-oauth.json</action>

    <check if="credentials do not exist">
      <output>
**Google Authentication Required**

To export to Google Slides, you need to authenticate once.
      </output>
      <action>Guide user through OAuth flow</action>
      <action>Open browser for Google authentication</action>
      <action>Save tokens to credentials/google-oauth.json</action>
    </check>

    <check if="credentials exist">
      <action>Verify tokens are valid, refresh if needed</action>
    </check>
  </step>

  <step n="2" goal="Identify slides to export">
    <action>Read status.yaml to determine mode, deck_slug, and output_folder</action>

    <check if="single mode">
      <action>Glob output/singles/*.html to find slide files</action>
      <action>Prepare list of slides to export</action>
    </check>

    <check if="deck mode">
      <action>Get deck_slug from status.yaml</action>
      <action>Set slides_folder = output/{{deck_slug}}/slides</action>
      <action>Read plan.yaml to get list of built slides</action>
      <action>Prepare to export all slides from output/{{deck_slug}}/slides/ in order</action>
    </check>

    <output>
**Export Preparation**

Slides to export: {{slide_count}}
Mode: {{mode}}
{{if deck mode}}Deck: {{deck_slug}}
Output folder: output/{{deck_slug}}/{{end if}}

Starting conversion...
    </output>
  </step>

  <step n="3" goal="Convert to images">
    <action>Launch Puppeteer headless browser</action>

    <iterate for="each slide">
      <action>Open slide HTML file</action>
      <action>Set viewport to 1920x1080</action>
      <action>Take screenshot</action>
      <action>Save as PNG to temp directory</action>
      <output>Converting slide {{n}} of {{total}}...</output>
    </iterate>

    <output>
**Conversion Complete**

{{slide_count}} slides converted to images.

Uploading to Google Slides...
    </output>
  </step>

  <step n="4" goal="Upload to Google Slides">
    <action>Create new Google Slides presentation</action>

    <iterate for="each image">
      <action>Create blank slide</action>
      <action>Upload image at full size (1920x1080)</action>
      <action>Position image to cover entire slide</action>
      <output>Uploading slide {{n}} of {{total}}...</output>
    </iterate>
  </step>

  <step n="5" goal="Complete and report">
    <action>Update status.yaml with export completion</action>

    <output>
**Export Complete!**

Your presentation is ready:
{{google_slides_url}}

Total slides exported: {{slide_count}}
    </output>
  </step>

</workflow>
```
