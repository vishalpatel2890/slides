# Update Brand Assets Workflow

<context>
You are managing the brand asset catalogs for Slide Builder. Brand assets include icons, logos, and images - all certified visual assets used in slides.

Your job is to maintain three catalog manifests that ensure only approved brand assets appear in generated slides:
- `icon-catalog.json` - Icons for visual emphasis and decoration
- `logo-catalog.json` - Brand marks and logos for branding
- `images-catalog.json` - Decorative images, backgrounds, and illustrations

**Asset Storage Locations:**
- Icons: `.slide-builder/config/catalog/brand-assets/icons/` (dark/ and white/ variants)
- Logos: `.slide-builder/config/catalog/brand-assets/logos/`
- Images: `.slide-builder/config/catalog/brand-assets/images/`
</context>

<success_criteria>
A successful run produces:
1. An updated or created catalog manifest (icon, logo, or images)
2. Assets properly tagged with semantic keywords
3. Correct variant registration (dark/light for logos, dark/white for icons)
4. User has reviewed and approved all catalog entries
</success_criteria>

---

## Critical Requirements

<critical>
Verify ALL of these before writing any catalog file.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | Valid JSON structure | Catalog matches schema in reference section |
| 2 | Asset IDs extracted correctly | Pattern applied correctly for asset type |
| 3 | Tags are semantic | Tags describe meaning/use, not appearance |
| 4 | User approval | User confirmed entries before save |
| 5 | Correct catalog selected | Asset type matches target catalog |

---

## Variable Convention

<context>
Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."
</context>

---

## Phase 1: Entry Point and Mode Selection

<steps>
1. Check if user provided a file path as input argument
2. Route based on input:
   - **File path provided** → Continue to Phase 1A (Classification)
   - **No file path** → Continue to Phase 1.5 (Mode Selection)
</steps>

---

## Phase 1.5: Mode Selection (No File Provided)

<steps>
1. Report current catalog state to user:
   - Icon catalog: exists/missing, icon count
   - Logo catalog: exists/missing, logo count
   - Images catalog: exists/missing, image count
2. Use AskUserQuestion to present mode options:

<ask header="Action" context="Choose what you'd like to do with brand assets:">
  <choice label="Import Asset" description="Import a new icon, logo, or image file" />
  <choice label="Scan Icons" description="Scan icons folder and add tags to uncataloged icons" />
  <choice label="View Catalogs" description="Display current catalog contents" />
</ask>

3. Route based on selection:
   - "Import Asset" → Ask for file path, then continue to Phase 1A
   - "Scan Icons" → Skip to Phase 2 (Icon Scan & Catalog)
   - "View Catalogs" → Skip to Phase 4 (View Catalog Mode)
</steps>

---

## Phase 1A: Asset Classification via Visual Analysis

<critical>
Use the Read tool to visually analyze the provided file. This enables classification based on image content.
</critical>

<steps>
1. Validate the provided file path exists and is an image (PNG, JPG, SVG)
2. Use Read tool to view the file: `{{file_path}}`
3. Extract visual characteristics:
   - Approximate dimensions (small/medium/large)
   - Whether it has transparency
   - Color complexity (simple vs complex)
   - Content type (symbol, wordmark, photograph, illustration)
4. Extract filename characteristics:
   - Check for keywords: "icon", "icons8-", "glyph" → Icon signal
   - Check for keywords: "logo", "mark", "brand", company names → Logo signal
   - Check for keywords: "hero", "photo", "bg", "background" → Image signal
5. Continue to Phase 1B with analysis results
</steps>

---

## Phase 1B: Apply Classification Heuristics

<reference title="Asset Classification Heuristics">
| Signal | Icon Weight | Logo Weight | Image Weight |
|--------|-------------|-------------|--------------|
| Dimensions ≤ 200px | +2 | +1 | 0 |
| Dimensions 200-500px | +1 | +2 | +1 |
| Dimensions > 500px | 0 | 0 | +2 |
| Filename: "icon", "icons8-" | +3 | 0 | 0 |
| Filename: "logo", "mark", "brand" | 0 | +3 | 0 |
| Filename: "hero", "photo", "bg" | 0 | 0 | +3 |
| High transparency (>50%) | +1 | +1 | 0 |
| Low color count (<16) | +2 | +1 | 0 |
| Company name in filename | 0 | +2 | 0 |
</reference>

<steps>
1. Apply heuristic scoring based on visual analysis from Phase 1A
2. Calculate scores for each asset type:
   - `icon_score` = sum of Icon Weight signals
   - `logo_score` = sum of Logo Weight signals
   - `image_score` = sum of Image Weight signals
3. Determine classification:
   - Highest score wins
   - Ties favor: icon > logo > image
4. Determine confidence level:
   - High: Winner score ≥ 4 AND ≥ 2 points ahead of second
   - Medium: Winner score ≥ 3
   - Low: Otherwise
5. Continue to Phase 1C
</steps>

---

## Phase 1C: Present Classification to User

<steps>
1. Display the analyzed file (show the image via Read tool output)
2. Report classification result to user:
   - Detected type: {{detected_type}}
   - Confidence: {{confidence_level}}
   - Key signals: {{signals_list}}
3. Use AskUserQuestion for confirmation:

<ask header="Asset Type" context="Based on analysis, this appears to be a **{{detected_type}}** ({{confidence_level}} confidence).

**Signals detected:**
{{signals_list}}">
  <choice label="Icon" description="Small symbolic graphic for visual emphasis" />
  <choice label="Logo" description="Brand mark or wordmark for branding" />
  <choice label="Image" description="Decorative image, photo, or illustration" />
</ask>

4. Store confirmed type in `{{asset_type}}`
5. Route based on `{{asset_type}}`:
   - "Icon" → Continue to Phase 3 (Icon Import)
   - "Logo" → Continue to Phase 3A (Logo Import)
   - "Image" → Continue to Phase 3B (Image Import)
</steps>

---

## Phase 2: Scan & Catalog Icons Mode

<critical>
Parse icon filenames to extract icon IDs. The naming pattern is: `icons8-{id}-{size}.png`
</critical>

<reference title="Icon ID extraction">
```
Filename: icons8-brainstorm-100.png
→ Remove prefix "icons8-": brainstorm-100.png
→ Remove size suffix "-100.png": brainstorm
→ Icon ID: "brainstorm"
```
</reference>

<steps>
1. List all PNG files in `icons/dark/`
2. Extract unique icon IDs from filenames (strip `icons8-` prefix and `-{size}.png` suffix)
3. Load existing `icon-catalog.json` if it exists (use empty array if not)
4. Identify which icons are NOT yet in the catalog
5. Report count of uncataloged icons to user
6. Use AskUserQuestion to choose tagging approach:

<ask header="Tagging" context="Found {{uncataloged_count}} uncataloged icons.">
  <choice label="Auto-suggest all" description="AI analyzes each icon and suggests tags; review all at once" />
  <choice label="Review one-by-one" description="See each icon, confirm or edit AI-suggested tags individually" />
</ask>

7. Route based on selection:
   - "Auto-suggest all" → Continue to Phase 2A
   - "Review one-by-one" → Skip to Phase 2B
</steps>

---

### Phase 2A: Batch Auto-Tagging (Icons)

<steps>
1. For each uncataloged icon (process silently without reporting each one):
   - Use Read tool to view the icon image: `icons/dark/icons8-{{icon_id}}-100.png`
   - Analyze the visual and generate: name, description, and 5-8 semantic tags
   - Store in pending list
2. Present complete batch for user review:
   - Show each icon image
   - Display suggested name, description, and tags
3. Use AskUserQuestion for confirmation:

<ask header="Review">
  <choice label="Accept all" description="Save all icons with suggested tags" />
  <choice label="Edit specific" description="Modify tags for certain icons before saving" />
  <choice label="One-by-one" description="Switch to interactive review mode" />
</ask>

4. If user accepts all → Continue to Phase 5 with `{{asset_type}}` = "icon"
5. If user wants edits → Ask which icon IDs to edit, prompt for corrections, then continue to Phase 5
6. If user wants one-by-one → Go to Phase 2B
</steps>

---

### Phase 2B: Interactive Review (Icons)

<critical>
Use the Read tool to display the icon image so user can see it before assigning tags.
Read the 100px dark variant for best visibility.
</critical>

<steps>
For each uncataloged icon:

1. Use Read tool to display the icon image: `icons/dark/icons8-{{icon_id}}-100.png`
2. Generate AI-suggested name, description, and tags based on visual analysis
3. Report to user:
   - Current progress (X of Y icons)
   - The icon image (displayed via Read)
   - AI suggestions for name, description, and tags
   - Which file variants exist (dark 50px, dark 100px, white 50px, white 100px)
4. Use AskUserQuestion for confirmation:

<ask header="Tags">
  <choice label="Accept" description="Use AI-suggested name, description, and tags" />
  <choice label="Edit tags" description="Modify only the suggested tags" />
  <choice label="Edit all" description="Customize name, description, and tags" />
</ask>

5. If user accepts → Add icon with AI suggestions to pending list
6. If user edits tags → Ask for comma-separated tags, then add to pending list
7. If user edits all → Ask for name, description, and tags, then add to pending list
8. Repeat for all uncataloged icons
9. Continue to Phase 5 with `{{asset_type}}` = "icon"
</steps>

---

## Phase 3: Import New Icon Mode

<steps>
1. Explain to user that icons require:
   - Both dark (for light backgrounds) and white (for dark backgrounds) variants
   - Both 50px and 100px sizes recommended
2. Use AskUserQuestion about available variants:

<ask header="Variants" context="Icons work best with both dark and white variants for different backgrounds.">
  <choice label="Both colors" description="User has dark and white versions ready" />
  <choice label="Dark only" description="Only dark variant available" />
  <choice label="White only" description="Only white variant available" />
</ask>

3. Ask user for the file path(s) to import
4. Validate files exist and are PNG format
5. Use Read tool to display the provided icon for visual confirmation
6. Generate icon ID from filename or ask user to specify
7. Ask user for metadata:
   - Display name
   - Description
   - Semantic tags (5-8 recommended)
8. Copy files to catalog folders with correct naming:
   - `icons/dark/icons8-{{icon_id}}-{{size}}.png`
   - `icons/white/icons8-{{icon_id}}-{{size}}.png` (if available)
9. Add icon entry to pending list
10. Continue to Phase 5 with `{{asset_type}}` = "icon"
</steps>

---

## Phase 3A: Import Logo Mode

<critical>
Logos support variants (dark/light) with usage descriptions and placement rules.
</critical>

<steps>
1. Use Read tool to display the logo file for visual confirmation
2. Explain logo metadata requirements:
   - Logo ID and display name
   - Variants with usage descriptions
   - Placement rules
   - Semantic tags
3. Generate suggested logo ID from filename
4. Ask user for logo metadata:

<ask header="Logo Variants" context="Logos typically have dark and light variants for different backgrounds.">
  <choice label="Single variant" description="This is a single-variant logo" />
  <choice label="Multiple variants" description="I have or will add dark/light variants" />
</ask>

5. If single variant:
   - Ask for variant ID (e.g., "dark", "light", "color", "mono")
   - Ask for usage description (when to use this variant)
6. If multiple variants:
   - Ask for the current file's variant ID
   - Ask for usage description
   - Note: Additional variants can be added later
7. Ask for placement rules (array of guidelines):
   - Suggest common rules: "Bottom-right corner preferred", "Max height 60px"
   - User can accept suggestions or provide custom rules
8. Ask for semantic tags (5-8 recommended)
9. Build logo entry:
```json
{
  "id": "{{logo_id}}",
  "name": "{{logo_name}}",
  "description": "{{logo_description}}",
  "variants": [
    {
      "variant_id": "{{variant_id}}",
      "file": "{{filename}}",
      "usage": "{{usage_description}}"
    }
  ],
  "placement_rules": {{placement_rules_array}},
  "tags": {{tags_array}}
}
```
10. Copy file to logos folder: `.slide-builder/config/catalog/brand-assets/logos/{{filename}}`
11. Add logo entry to pending list
12. Continue to Phase 5 with `{{asset_type}}` = "logo"
</steps>

---

## Phase 3B: Import Image Mode

<critical>
Images are categorized and include dimension metadata.
</critical>

<reference title="Image Categories">
- decorative: Visual accents and decorative elements
- hero: Large feature images for title/section slides
- background: Full-slide background images
- diagram: Technical diagrams and charts
- photo: Photographs
- illustration: Illustrated graphics
</reference>

<steps>
1. Use Read tool to display the image file for visual confirmation
2. Generate suggested image ID from filename
3. Ask user for image metadata:

<ask header="Category" context="What type of image is this?">
  <choice label="Decorative" description="Visual accents and decorative elements" />
  <choice label="Hero" description="Large feature images for title/section slides" />
  <choice label="Background" description="Full-slide background images" />
  <choice label="Diagram" description="Technical diagrams and charts" />
</ask>

4. If user selects "Other", also allow: photo, illustration
5. Determine dimensions:
   - If image metadata available, extract width/height
   - Otherwise, ask user for approximate dimensions
6. Ask for semantic tags (5-8 recommended)
7. Build image entry:
```json
{
  "id": "{{image_id}}",
  "name": "{{image_name}}",
  "description": "{{image_description}}",
  "file": "{{filename}}",
  "category": "{{category}}",
  "dimensions": {
    "width": {{width}},
    "height": {{height}}
  },
  "tags": {{tags_array}}
}
```
8. Copy file to images folder: `.slide-builder/config/catalog/brand-assets/images/{{filename}}`
9. Add image entry to pending list
10. Continue to Phase 5 with `{{asset_type}}` = "image"
</steps>

---

## Phase 4: View Catalog Mode

<steps>
1. Report current catalog state:
   - Icon catalog: count, last modified
   - Logo catalog: count, last modified
   - Images catalog: count, last modified
2. Use AskUserQuestion to select which catalog to view:

<ask header="Catalog">
  <choice label="Icons" description="View icon catalog entries" />
  <choice label="Logos" description="View logo catalog entries" />
  <choice label="Images" description="View images catalog entries" />
</ask>

3. Load selected catalog
4. Display formatted catalog as a table:
   - For icons: ID, Name, Tags
   - For logos: ID, Name, Variants, Placement Rules
   - For images: ID, Name, Category, Dimensions
5. Use AskUserQuestion:

<ask header="Show">
  <choice label="Show images" description="Display each asset image for visual reference" />
  <choice label="Continue" description="Proceed without showing images" />
</ask>

6. If user wants images → Use Read tool to display each asset
7. Ask if user wants to continue with another action or exit
</steps>

---

## Phase 5: Save to Correct Catalog

<critical>
Route save operation to the correct catalog based on `{{asset_type}}`.
</critical>

<steps>
1. Determine target catalog based on `{{asset_type}}`:
   - "icon" → `.slide-builder/config/catalog/brand-assets/icons/icon-catalog.json`
   - "logo" → `.slide-builder/config/catalog/brand-assets/logos/logo-catalog.json`
   - "image" → `.slide-builder/config/catalog/brand-assets/images/images-catalog.json`

2. Load existing catalog if it exists, or create new structure:

<check if="catalog doesn't exist">
**For icon-catalog.json:**
```json
{
  "version": "1.0",
  "generated": "{{date}}",
  "lastModified": "{{timestamp}}",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/icons",
    "variants": { "dark": "dark/", "white": "white/" },
    "sizes": ["50", "100"]
  },
  "naming_pattern": "icons8-{id}-{size}.png",
  "fallback_behavior": "omit",
  "icons": []
}
```

**For logo-catalog.json:**
```json
{
  "version": "1.0",
  "generated": "{{date}}",
  "lastModified": "{{timestamp}}",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/logos"
  },
  "fallback_behavior": "omit",
  "logos": []
}
```

**For images-catalog.json:**
```json
{
  "version": "1.0",
  "generated": "{{date}}",
  "lastModified": "{{timestamp}}",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/images"
  },
  "categories": ["decorative", "hero", "background", "diagram", "photo", "illustration"],
  "fallback_behavior": "omit",
  "images": []
}
```
</check>

3. Merge pending entries into existing catalog:
   - Check for duplicate IDs
   - If duplicate found, ask user: Update existing or skip?
4. Update `lastModified` timestamp
5. **Verify compliance** against Critical Requirements table:
   - Valid JSON structure
   - All asset IDs correctly formatted
   - Tags are semantic (meaning-based)
   - User has approved entries
6. Fix any issues found
7. Write to catalog file
8. Report success to user:
   - File path written
   - Total asset count in catalog
   - List of assets added with name and tag preview
   - Note that catalog is ready for use by `/sb-create:build-one`
</steps>

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Catalog path not found | Create parent directories, then create new catalog |
| File not found | Stop → tell user to verify file path |
| Invalid image file | Skip file, warn user, continue with valid files |
| User cancels mid-workflow | Exit gracefully without writing partial data |
| JSON write fails | Report error with details, do not leave partial files |
| Classification uncertain | Default to user confirmation, never auto-classify low confidence |
</reference>

<critical>
Never write a catalog file with invalid or incomplete entries. If unfixable issues exist, explain what's wrong and ask user how to proceed.
</critical>

---

## Quick Reference

<reference title="Icon variant selection (for build-one)">
| Background Mode | Icon Variant | Reason |
|-----------------|--------------|--------|
| `dark` | `white/` | White icons visible on dark backgrounds |
| `light` | `dark/` | Dark icons visible on light backgrounds |
</reference>

<reference title="Logo variant selection (for build-one)">
| Background Mode | Logo Variant |
|-----------------|--------------|
| `dark` | variant where variant_id="light" OR usage contains "dark background" |
| `light` | variant where variant_id="dark" OR usage contains "light background" |
</reference>

<reference title="Good semantic tags examples">
| Asset | Good Tags | Bad Tags |
|-------|-----------|----------|
| Lightbulb icon | idea, innovation, insight, creativity | yellow, glowing, round |
| Brand logo | brand, mark, primary, logo | black, white, png |
| Hero image | feature, highlight, showcase | large, 1920, jpeg |
</reference>

<reference title="Logo Catalog Schema">
```json
{
  "version": "1.0",
  "generated": "2026-02-12",
  "lastModified": "2026-02-12T00:00:00Z",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/logos"
  },
  "fallback_behavior": "omit",
  "logos": [
    {
      "id": "primary-mark",
      "name": "Primary Brand Mark",
      "description": "Main brand symbol for headers and footers",
      "variants": [
        { "variant_id": "dark", "file": "amperity-mark-black.png", "usage": "Use on light backgrounds" },
        { "variant_id": "light", "file": "amperity-mark-white.png", "usage": "Use on dark backgrounds" }
      ],
      "placement_rules": ["Bottom-right corner preferred", "Max height 60px on content slides"],
      "tags": ["brand", "mark", "primary", "logo"]
    }
  ]
}
```
</reference>

<reference title="Images Catalog Schema">
```json
{
  "version": "1.0",
  "generated": "2026-02-12",
  "lastModified": "2026-02-12T00:00:00Z",
  "folder_structure": {
    "base_path": ".slide-builder/config/catalog/brand-assets/images"
  },
  "categories": ["decorative", "hero", "background", "diagram", "photo", "illustration"],
  "fallback_behavior": "omit",
  "images": [
    {
      "id": "icon-col1",
      "name": "Column Decorative 1",
      "description": "Decorative element for column layouts",
      "file": "icon-col1.png",
      "category": "decorative",
      "dimensions": { "width": 200, "height": 200 },
      "tags": ["column", "visual", "decorative", "brand"]
    }
  ]
}
```
</reference>
