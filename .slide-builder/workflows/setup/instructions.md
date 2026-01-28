# Setup Workflow Instructions

This workflow creates a new brand theme from user-provided assets.

```xml
<critical>This workflow creates theme.json from brand assets</critical>
<critical>Requires at least one visual asset (URL, PDF, or image) alongside a brand description</critical>
<critical>All asset analysis is performed locally via Claude - no external uploads</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 1: ASSET COLLECTION (Story 2.1)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="1" goal="Initialize and welcome user">
    <action>Update status.yaml with: mode: "setup", phase: "asset-collection", last_action: "starting"</action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
🎨 **SLIDE BUILDER THEME SETUP**
═══════════════════════════════════════════════════════════════════════════════

Welcome! I'll help you create a brand-perfect presentation theme.

**What I need from you:**
- At least ONE visual asset (website URL, PDF, or images)
- A brief description of your brand personality

**What I'll do:**
- Extract colors, typography, and shapes from your assets
- Generate a complete theme with 6 sample slides
- Refine based on your feedback until it's perfect

Let's get started!
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <step n="1.1" goal="Collect website URL (optional)">
    <ask>
**Website URL** (optional)

Enter your company website or brand guidelines page URL.
This helps me extract colors, fonts, and visual style from your existing web presence.

*Press Enter to skip if you don't have a website to analyze.*

URL:
    </ask>

    <action>Store response as {{website_url}}</action>

    <check if="{{website_url}} is not empty">
      <action>Validate URL format (must start with http:// or https://)</action>
      <check if="URL format is invalid">
        <output>⚠️ That doesn't look like a valid URL. URLs should start with http:// or https://</output>
        <goto step="1.1">Re-prompt for URL</goto>
      </check>
      <action>Mark website_url as PROVIDED</action>
    </check>

    <check if="{{website_url}} is empty">
      <action>Mark website_url as SKIPPED</action>
    </check>
  </step>

  <step n="1.2" goal="Collect PDF file paths (optional)">
    <ask>
**PDF File Paths** (optional)

Enter paths to brand guideline PDFs on your local machine.
For multiple files, separate paths with commas.

Examples:
- /Users/you/Documents/brand-guide.pdf
- ~/Downloads/style-guide.pdf, ~/Downloads/logo-usage.pdf

*Press Enter to skip if you don't have PDF files.*

PDF path(s):
    </ask>

    <action>Store response as {{pdf_paths_raw}}</action>

    <check if="{{pdf_paths_raw}} is not empty">
      <action>Split {{pdf_paths_raw}} by comma into list {{pdf_paths}}</action>
      <action>Trim whitespace from each path</action>
      <action>Expand ~ to home directory in each path</action>

      <for-each item="pdf_path" in="{{pdf_paths}}">
        <action>Check if file exists at {{pdf_path}}</action>
        <check if="file does not exist">
          <output>⚠️ File not found: {{pdf_path}}</output>
          <action>Remove {{pdf_path}} from valid list</action>
        </check>
        <check if="file exists but is not a PDF">
          <output>⚠️ Not a PDF file: {{pdf_path}}</output>
          <action>Remove {{pdf_path}} from valid list</action>
        </check>
      </for-each>

      <check if="no valid PDF files remain">
        <output>⚠️ No valid PDF files found. Please check the paths and try again, or press Enter to skip.</output>
        <goto step="1.2">Re-prompt for PDFs</goto>
      </check>

      <action>Mark pdf_paths as PROVIDED with {{valid_pdf_count}} files</action>
    </check>

    <check if="{{pdf_paths_raw}} is empty">
      <action>Mark pdf_paths as SKIPPED</action>
    </check>
  </step>

  <step n="1.3" goal="Collect image file paths (optional)">
    <ask>
**Image File Paths** (optional)

Enter paths to brand images (logo, color palette, example slides, etc.).
Supported formats: PNG, JPG, JPEG, GIF, SVG, WebP
For multiple files, separate paths with commas.

Examples:
- /Users/you/Documents/logo.png
- ~/Downloads/brand-colors.jpg, ~/Downloads/example-slide.png

*Press Enter to skip if you don't have image files.*

Image path(s):
    </ask>

    <action>Store response as {{image_paths_raw}}</action>

    <check if="{{image_paths_raw}} is not empty">
      <action>Split {{image_paths_raw}} by comma into list {{image_paths}}</action>
      <action>Trim whitespace from each path</action>
      <action>Expand ~ to home directory in each path</action>

      <for-each item="image_path" in="{{image_paths}}">
        <action>Check if file exists at {{image_path}}</action>
        <check if="file does not exist">
          <output>⚠️ File not found: {{image_path}}</output>
          <action>Remove {{image_path}} from valid list</action>
        </check>
        <action>Check file extension is valid image format</action>
        <check if="not a valid image format">
          <output>⚠️ Not a supported image format: {{image_path}}</output>
          <action>Remove {{image_path}} from valid list</action>
        </check>
      </for-each>

      <check if="no valid image files remain">
        <output>⚠️ No valid image files found. Please check the paths and try again, or press Enter to skip.</output>
        <goto step="1.3">Re-prompt for images</goto>
      </check>

      <action>Mark image_paths as PROVIDED with {{valid_image_count}} files</action>
    </check>

    <check if="{{image_paths_raw}} is empty">
      <action>Mark image_paths as SKIPPED</action>
    </check>
  </step>

  <step n="1.4" goal="Validate at least one visual asset provided">
    <action>Check if website_url OR pdf_paths OR image_paths is PROVIDED</action>

    <check if="all visual assets are SKIPPED">
      <output>
❌ **At least one visual asset is required**

I need at least one of the following to extract your brand style:
- A website URL
- PDF brand guidelines
- Logo or brand images

Please provide at least one visual asset.
      </output>
      <goto step="1.1">Restart asset collection</goto>
    </check>

    <action>Visual asset validation PASSED</action>
  </step>

  <step n="1.5" goal="Collect brand description (required)">
    <ask>
**Brand Description** (required)

Describe your brand's personality and style in a few sentences.
This helps me make better decisions when extracting your theme.

Examples:
- "Professional and trustworthy. Clean, modern look with a corporate feel."
- "Bold and innovative. Startup energy, tech-forward, not afraid to stand out."
- "Warm and approachable. Friendly, human-centered, community focused."

Your brand description:
    </ask>

    <action>Store response as {{brand_description}}</action>

    <check if="{{brand_description}} is empty or whitespace only">
      <output>⚠️ Brand description is required. Please describe your brand's personality.</output>
      <goto step="1.5">Re-prompt for description</goto>
    </check>

    <check if="{{brand_description}} is less than 10 characters">
      <output>⚠️ Please provide a more detailed description (at least a sentence or two).</output>
      <goto step="1.5">Re-prompt for description</goto>
    </check>

    <action>Mark brand_description as PROVIDED</action>
  </step>

  <step n="1.6" goal="Display confirmation and get approval">
    <output>
───────────────────────────────────────────────────────────────────────────────
📋 **INPUT CONFIRMATION**
───────────────────────────────────────────────────────────────────────────────

**Website URL:** {{website_url_display}}
**PDF Files:** {{pdf_paths_display}}
**Image Files:** {{image_paths_display}}
**Brand Description:** {{brand_description}}

───────────────────────────────────────────────────────────────────────────────
    </output>

    <ask>
Does this look correct?

- **[c] Continue** - Proceed to brand analysis
- **[m] Modify** - Go back and change inputs
- **[x] Cancel** - Exit setup

Your choice:
    </ask>

    <action>Store response as {{confirmation_choice}}</action>

    <check if="{{confirmation_choice}} starts with 'm' or 'M'">
      <output>Let's update your inputs...</output>
      <goto step="1.1">Restart asset collection</goto>
    </check>

    <check if="{{confirmation_choice}} starts with 'x' or 'X'">
      <action>Update status.yaml with: last_action: "cancelled by user"</action>
      <output>Setup cancelled. Run /sb:setup when you're ready to try again.</output>
      <action>HALT</action>
    </check>

    <check if="{{confirmation_choice}} starts with 'c' or 'C' or is empty">
      <action>Inputs confirmed - proceed to analysis</action>
    </check>
  </step>

  <step n="1.7" goal="Analyze website via WebFetch">
    <check if="website_url is PROVIDED">
      <output>🌐 Analyzing website: {{website_url}}...</output>

      <action>Call WebFetch with URL={{website_url}} and prompt="Extract brand information from this website: identify the primary colors (as hex codes), secondary colors, accent colors, background colors, text colors, font families used (for headings and body), any notable visual patterns (rounded corners, shadows, gradients), and overall brand personality (bold, minimal, corporate, playful, etc.). Focus on CSS styles and visual design elements."</action>

      <check if="WebFetch succeeds">
        <action>Store result as {{website_analysis}}</action>
        <action>Mark website_analysis as COMPLETE</action>
        <output>✅ Website analysis complete</output>
      </check>

      <check if="WebFetch fails">
        <output>⚠️ Could not fetch website: {{error_message}}
This may be due to network issues or the site blocking automated access.
Continuing with other assets...</output>
        <action>Mark website_analysis as FAILED with reason</action>
      </check>
    </check>
  </step>

  <step n="1.8" goal="Analyze PDFs via Claude Vision">
    <check if="pdf_paths is PROVIDED">
      <for-each item="pdf_path" in="{{pdf_paths}}">
        <output>📄 Analyzing PDF: {{pdf_path}}...</output>

        <action>Use Read tool to load {{pdf_path}} for Claude Vision analysis</action>

        <check if="Read succeeds">
          <action>Analyze the PDF visually: identify dominant colors (as hex codes), typography styles (font families, weights, sizes), shape characteristics (rounded vs sharp corners, shadows, borders), logo colors, and brand personality signals</action>
          <action>Store analysis result for this PDF</action>
          <output>✅ PDF analysis complete: {{pdf_path}}</output>
        </check>

        <check if="Read fails">
          <output>⚠️ Could not read PDF: {{pdf_path}} - {{error_message}}
Continuing with other assets...</output>
          <action>Mark this PDF as FAILED</action>
        </check>
      </for-each>

      <action>Combine all successful PDF analyses into {{pdf_analysis}}</action>
    </check>
  </step>

  <step n="1.9" goal="Analyze images via Claude Vision">
    <check if="image_paths is PROVIDED">
      <for-each item="image_path" in="{{image_paths}}">
        <output>🖼️ Analyzing image: {{image_path}}...</output>

        <action>Use Read tool to load {{image_path}} for Claude Vision analysis</action>

        <check if="Read succeeds">
          <action>Analyze the image visually: extract color palette (as hex codes), identify if it's a logo (extract logo colors), note any typography visible, identify shape styles and visual weight</action>
          <action>Store analysis result for this image</action>
          <output>✅ Image analysis complete: {{image_path}}</output>
        </check>

        <check if="Read fails">
          <output>⚠️ Could not read image: {{image_path}} - {{error_message}}
Continuing with other assets...</output>
          <action>Mark this image as FAILED</action>
        </check>
      </for-each>

      <action>Combine all successful image analyses into {{image_analysis}}</action>
    </check>
  </step>

  <step n="1.10" goal="Summarize asset collection results">
    <action>Update status.yaml with: phase: "asset-collection-complete", last_action: "assets analyzed"</action>

    <action>Store all collected inputs for next phase:
      - {{website_url}} (if provided)
      - {{pdf_paths}} (if provided)
      - {{image_paths}} (if provided)
      - {{brand_description}}
      - {{website_analysis}} (if successful)
      - {{pdf_analysis}} (if successful)
      - {{image_analysis}} (if successful)
    </action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **ASSET COLLECTION COMPLETE**
═══════════════════════════════════════════════════════════════════════════════

**Assets Collected:**
{{assets_summary}}

**Analysis Status:**
{{analysis_summary}}

**Brand Context:** {{brand_description}}

Ready to proceed to brand primitive extraction...
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 2: BRAND PRIMITIVE EXTRACTION (Story 2.2)

       ⚠️ REQUIRED SKILL: frontend-design (see workflow.yaml required_skills) ⚠️
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="2" goal="Load design skill and initialize extraction">
    <critical>PHASE 2 REQUIRES THE FRONTEND-DESIGN SKILL - THIS IS A BLOCKING REQUIREMENT</critical>

    <action n="2.0">FIRST: Execute Skill tool call:
      ```
      Skill(skill="frontend-design")
      ```
      This loads professional design expertise for color theory, typography, and visual decisions.
      YOU MUST MAKE THIS TOOL CALL NOW BEFORE READING FURTHER.
    </action>

    <action>Update status.yaml with: phase: "brand-extraction", last_action: "starting primitive extraction"</action>

    <output>
───────────────────────────────────────────────────────────────────────────────
🔬 **PHASE 2: BRAND PRIMITIVE EXTRACTION**
───────────────────────────────────────────────────────────────────────────────

Analyzing your brand assets to extract:
- Colors (primary, secondary, accent, backgrounds, text)
- Typography (fonts, sizes, weights)
- Shapes (corners, shadows, borders)
- Brand personality

This analysis uses your collected assets and brand description to make informed decisions...
───────────────────────────────────────────────────────────────────────────────
    </output>

    <action>Initialize extraction data structures:
      - {{extraction_sources}} = [] (list of per-source extraction results)
      - {{aggregated_colors}} = {} (combined color data)
      - {{aggregated_fonts}} = {} (combined typography data)
      - {{aggregated_shapes}} = {} (combined shape data)
      - {{personality_signals}} = [] (collected personality indicators)
    </action>
  </step>

  <step n="2.1" goal="Extract primitives from website CSS/styles">
    <check if="{{website_analysis}} exists and is not empty">
      <output>🌐 Extracting primitives from website analysis...</output>

      <action>Parse {{website_analysis}} for color information:
        - Identify hex codes mentioned (e.g., #XXXXXX, #XXX)
        - Identify rgb/rgba values (e.g., rgb(X,X,X))
        - Identify hsl values (e.g., hsl(X,X%,X%))
        - Map colors to usage context (buttons, links, backgrounds, text)
      </action>

      <action>Classify website colors by role:
        - Primary: Most prominent brand/accent color (buttons, CTAs, links)
        - Secondary: Supporting accent color (borders, highlights)
        - Accent: High-contrast attention color (badges, alerts)
        - Background default: Main page background color
        - Background alt: Card/section background color
        - Text heading: Heading text color (usually darker)
        - Text body: Body text color
      </action>

      <action>Parse {{website_analysis}} for typography:
        - Extract font-family declarations
        - Identify heading fonts (h1-h6, .heading, .title classes)
        - Identify body fonts (p, .body, .text classes)
        - Note font weights used (400, 500, 600, 700, etc.)
        - Extract font sizes if mentioned (px, rem, em values)
      </action>

      <action>Parse {{website_analysis}} for shape styles:
        - Extract border-radius values (corner rounding)
        - Extract box-shadow patterns (shadow usage)
        - Extract border styles (solid, dashed, thickness)
        - Note visual density (compact vs spacious)
      </action>

      <action>Extract personality signals from website:
        - High contrast colors → signal "bold"
        - Muted, desaturated colors → signal "minimal"
        - Traditional serif fonts, navy/gray palette → signal "corporate"
        - Bright colors, large border-radius → signal "playful"
        - Heavy font weights → signal "bold"
        - Light font weights, whitespace → signal "minimal"
      </action>

      <action>Build website extraction record:
        ```yaml
        source: "{{website_url}}"
        type: website
        colors_found:
          - hex: "[extracted primary hex]"
            usage: "primary button/link color"
            confidence: 0.9
          - hex: "[extracted secondary hex]"
            usage: "secondary accent"
            confidence: 0.8
          # ... additional colors
        fonts_found:
          - family: "[heading font family]"
            usage: "headings"
            weights: [detected weights]
          - family: "[body font family]"
            usage: "body"
            weights: [detected weights]
        shapes_observed:
          - element: "buttons"
            corner_radius: "[extracted value or inferred]"
            shadow: [true/false]
          - element: "cards"
            corner_radius: "[extracted value]"
            shadow: [true/false]
        personality_signals:
          - signal: "[observed signal]"
            suggests: "[bold|minimal|corporate|playful]"
        ```
      </action>

      <action>Add website extraction to {{extraction_sources}}</action>
      <output>✅ Website primitive extraction complete</output>
    </check>

    <check if="{{website_analysis}} is empty or does not exist">
      <action>Skip website extraction (no website provided)</action>
    </check>
  </step>

  <step n="2.2" goal="Extract primitives from PDF analysis">
    <check if="{{pdf_analysis}} exists and is not empty">
      <output>📄 Extracting primitives from PDF analysis...</output>

      <action>Parse {{pdf_analysis}} for visual colors:
        - Identify dominant color palette from PDF visual analysis
        - Note any brand colors explicitly shown
        - Identify logo colors if logo was detected
        - Map colors to likely roles (brand color, accent, background)
      </action>

      <action>Parse {{pdf_analysis}} for typography styles:
        - Identify font characteristics described (serif, sans-serif, modern, classic)
        - Note font weights observed (bold headings, regular body)
        - Identify hierarchy patterns (title size vs body size)
        - Note any specific font names if identifiable
      </action>

      <action>Parse {{pdf_analysis}} for shape characteristics:
        - Identify corner styles (rounded vs sharp)
        - Note shadow usage (drop shadows, inner shadows)
        - Identify border patterns (thick, thin, none)
        - Note overall visual density
      </action>

      <action>Extract personality signals from PDF:
        - Analyze visual weight and color saturation
        - Note formality level of typography
        - Assess spacing and density
        - Identify style descriptors (modern, traditional, energetic, calm)
      </action>

      <action>Build PDF extraction record(s) for each analyzed PDF:
        ```yaml
        source: "[pdf filename]"
        type: pdf
        colors_found:
          - hex: "[color from visual analysis]"
            usage: "[inferred usage]"
            confidence: 0.7
        fonts_found:
          - family: "[identified or inferred font]"
            usage: "[heading/body]"
            weights: [observed weights]
        shapes_observed:
          - element: "general"
            corner_radius: "[rounded/sharp/mixed]"
            shadow: [true/false]
        personality_signals:
          - signal: "[visual observation]"
            suggests: "[personality]"
        ```
      </action>

      <action>Add PDF extraction(s) to {{extraction_sources}}</action>
      <output>✅ PDF primitive extraction complete</output>
    </check>

    <check if="{{pdf_analysis}} is empty or does not exist">
      <action>Skip PDF extraction (no PDFs provided)</action>
    </check>
  </step>

  <step n="2.3" goal="Extract primitives from image analysis">
    <check if="{{image_analysis}} exists and is not empty">
      <output>🖼️ Extracting primitives from image analysis...</output>

      <action>Parse {{image_analysis}} for color palette:
        - Extract dominant colors from visual analysis
        - Identify logo colors if image contains logo
        - Note color relationships (complementary, analogous)
        - Assess color temperature (warm, cool, neutral)
      </action>

      <action>Parse {{image_analysis}} for typography (if visible):
        - Identify any text/typography in images
        - Note font style characteristics if readable
        - Skip if no typography visible
      </action>

      <action>Parse {{image_analysis}} for visual style:
        - Identify shape styles in the image
        - Note visual mood and design language
        - Assess formality and energy level
      </action>

      <action>Extract personality signals from images:
        - Color vibrancy → bold or playful
        - Muted tones → minimal or corporate
        - Sharp geometric shapes → corporate or bold
        - Organic/rounded shapes → playful or minimal
      </action>

      <action>Build image extraction record(s):
        ```yaml
        source: "[image filename]"
        type: image
        colors_found:
          - hex: "[dominant color]"
            usage: "dominant brand color"
            confidence: 0.75
          - hex: "[secondary color]"
            usage: "secondary/accent"
            confidence: 0.6
        fonts_found: []  # Usually empty unless text visible
        shapes_observed:
          - element: "logo/graphic"
            corner_radius: "[observed style]"
            shadow: [true/false]
        personality_signals:
          - signal: "[visual characteristic]"
            suggests: "[personality]"
        ```
      </action>

      <action>Add image extraction(s) to {{extraction_sources}}</action>
      <output>✅ Image primitive extraction complete</output>
    </check>

    <check if="{{image_analysis}} is empty or does not exist">
      <action>Skip image extraction (no images provided)</action>
    </check>
  </step>

  <step n="2.4" goal="Aggregate and resolve conflicts across sources">
    <output>🔄 Aggregating data from all sources...</output>

    <action>Apply source priority weighting for conflict resolution:
      - Website: weight 1.0 (highest priority - most reliable CSS data)
      - PDF: weight 0.8 (high priority - often official brand guidelines)
      - Images: weight 0.6 (medium priority - visual reference)
    </action>

    <action>Aggregate colors with conflict resolution:
      For each color role (primary, secondary, accent, background, text):
        1. Collect all candidates from {{extraction_sources}}
        2. If single candidate → use it directly
        3. If multiple candidates with same/similar color → use highest confidence
        4. If conflicting candidates:
           a. Check {{brand_description}} for keywords that hint at color preference
           b. Apply source priority weighting
           c. Select highest weighted candidate
           d. Document resolution reasoning
    </action>

    <action>Aggregate typography with conflict resolution:
      For heading, body, and mono fonts:
        1. Prefer explicitly named fonts over generic descriptions
        2. If website has specific font-family → use it (highest reliability)
        3. If PDF/image analysis conflicts → use {{brand_description}} keywords
        4. Default to safe web fonts if no clear winner:
           - Headings: Inter, system-ui, sans-serif
           - Body: Inter, system-ui, sans-serif
           - Mono: 'SF Mono', Consolas, monospace
    </action>

    <action>Aggregate shape styles:
      1. Determine corner_radius consensus:
         - "sharp" / "none" / "0" → 0px
         - "slightly rounded" / "subtle" → 4px
         - "rounded" / "medium" → 8px
         - "very rounded" / "pill" → 16px+
      2. Determine shadow usage (any source showing shadows → likely uses shadows)
      3. Determine border patterns from most detailed source
    </action>

    <action>Store aggregated results:
      {{aggregated_colors}} = {
        primary: {hex: "...", source: "...", confidence: ...},
        secondary: {hex: "...", source: "...", confidence: ...},
        accent: {hex: "...", source: "...", confidence: ...},
        background: {
          default: {hex: "...", source: "..."},
          alt: {hex: "...", source: "..."}
        },
        text: {
          heading: {hex: "...", source: "..."},
          body: {hex: "...", source: "..."}
        }
      }
      {{aggregated_fonts}} = {
        heading: {family: "...", weights: [...], source: "..."},
        body: {family: "...", weights: [...], source: "..."},
        mono: {family: "...", weights: [...], source: "..."}
      }
      {{aggregated_shapes}} = {
        corner_radius: "...",
        shadow: true/false,
        border: "..."
      }
    </action>

    <output>✅ Data aggregation complete</output>
  </step>

  <step n="2.5" goal="Classify brand personality">
    <output>🎭 Classifying brand personality...</output>

    <action>Collect all personality signals from {{extraction_sources}}</action>

    <action>Apply personality classification rules:

      **BOLD indicators (score +1 each):**
      - High contrast between colors
      - Saturated, vibrant primary color
      - Heavy font weights (600, 700, 800)
      - Sharp or no border radius
      - Strong shadows
      - Brand description keywords: bold, strong, powerful, impactful, dynamic

      **MINIMAL indicators (score +1 each):**
      - Low contrast, muted palette
      - Light font weights (300, 400)
      - Subtle or no shadows
      - Clean, simple shapes
      - Lots of whitespace mentioned
      - Brand description keywords: clean, simple, minimal, elegant, refined

      **CORPORATE indicators (score +1 each):**
      - Traditional color palette (navy, gray, burgundy)
      - Serif fonts or classic sans-serif
      - Structured, formal layouts
      - Conservative styling
      - Brand description keywords: professional, trustworthy, established, reliable

      **PLAYFUL indicators (score +1 each):**
      - Bright, saturated colors
      - Large border radius (very rounded)
      - Varied font weights
      - Informal, friendly tone
      - Brand description keywords: fun, friendly, creative, approachable, energetic
    </action>

    <action>Parse {{brand_description}} for personality keywords:
      - Extract keywords and match against personality indicators
      - Weight brand description matches highly (user intent is important)
    </action>

    <action>Calculate personality scores:
      - Sum indicators for each personality type
      - Weight signals: brand_description (2x), website (1.5x), PDF (1x), image (0.75x)
      - Select highest scoring personality as primary
      - Note secondary personality if close score
    </action>

    <action>Generate personality classification:
      {{brand_personality}} = {
        classification: "[bold|minimal|corporate|playful]",
        confidence: [0.0-1.0],
        notes: "[reasoning for classification]",
        secondary: "[optional secondary personality if applicable]"
      }
    </action>

    <output>✅ Personality classification: {{brand_personality.classification}}
Confidence: {{brand_personality.confidence}}
Notes: {{brand_personality.notes}}</output>
  </step>

  <step n="2.6" goal="Derive typography scale">
    <output>📏 Deriving typography scale...</output>

    <action>Calculate typography scale based on standard ratios:
      Using a base size of 16px and a scale ratio of 1.25 (major third):

      {{typography_scale}} = {
        hero: "72px",    # Large impact titles
        h1: "48px",      # Primary headings
        h2: "36px",      # Secondary headings
        h3: "24px",      # Tertiary headings
        body: "18px",    # Body text
        small: "14px"    # Captions, labels
      }

      Adjust based on personality:
      - BOLD: Increase hero/h1 sizes by 10-20%
      - MINIMAL: May use lighter weights, not larger sizes
      - CORPORATE: Standard scale, conservative
      - PLAYFUL: May have more variation in scale
    </action>

    <output>✅ Typography scale derived</output>
  </step>

  <step n="2.7" goal="Define arrow and shape defaults">
    <output>➡️ Defining shape and arrow styles...</output>

    <action>Define box styles based on aggregated shapes:
      {{box_styles}} = {
        default: {
          corner_radius: "{{aggregated_shapes.corner_radius}}",
          shadow: "{{aggregated_shapes.shadow ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'}}",
          border: "{{aggregated_shapes.border || '1px solid rgba(0,0,0,0.1)'}}"
        },
        callout: {
          corner_radius: "{{aggregated_shapes.corner_radius}}",
          background: "{{aggregated_colors.accent.hex}}20",  # 20% opacity accent
          border: "2px solid {{aggregated_colors.accent.hex}}"
        }
      }
    </action>

    <action>Define arrow styles based on personality:
      {{arrow_styles}} = {
        default: {
          stroke_width: "[2px for minimal/corporate, 3px for bold/playful]",
          head_type: "[arrow for all, or triangle]",
          curve_style: "[straight for corporate, curved for playful]",
          color: "{{aggregated_colors.text.body.hex}}"
        }
      }

      Adjust by personality:
      - BOLD: stroke_width 3px, prominent heads
      - MINIMAL: stroke_width 1-2px, simple heads
      - CORPORATE: stroke_width 2px, straight lines
      - PLAYFUL: stroke_width 2-3px, curved lines
    </action>

    <output>✅ Shape and arrow styles defined</output>
  </step>

  <step n="2.8" goal="Build final extraction data structure">
    <action>Compile complete extraction data:
      {{extracted_primitives}} = {
        sources: {{extraction_sources}},

        colors: {
          primary: "{{aggregated_colors.primary.hex}}",
          secondary: "{{aggregated_colors.secondary.hex}}",
          accent: "{{aggregated_colors.accent.hex}}",
          background: {
            default: "{{aggregated_colors.background.default.hex}}",
            alt: "{{aggregated_colors.background.alt.hex}}"
          },
          text: {
            heading: "{{aggregated_colors.text.heading.hex}}",
            body: "{{aggregated_colors.text.body.hex}}"
          }
        },

        typography: {
          fonts: {
            heading: "{{aggregated_fonts.heading.family}}",
            body: "{{aggregated_fonts.body.family}}",
            mono: "{{aggregated_fonts.mono.family}}"
          },
          scale: {{typography_scale}},
          weights: {
            heading: {{aggregated_fonts.heading.weights}},
            body: {{aggregated_fonts.body.weights}}
          }
        },

        shapes: {
          boxes: {{box_styles}},
          arrows: {{arrow_styles}}
        },

        personality: {{brand_personality}},

        meta: {
          extracted_at: "[current timestamp]",
          source_count: [number of sources],
          conflict_resolutions: [list of any conflicts resolved]
        }
      }
    </action>

    <action>Store {{extracted_primitives}} for Theme Synthesizer (Phase 3)</action>
  </step>

  <step n="2.9" goal="Display extraction summary">
    <action>Update status.yaml with: phase: "brand-extraction-complete", last_action: "primitives extracted"</action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **BRAND PRIMITIVE EXTRACTION COMPLETE**
═══════════════════════════════════════════════════════════════════════════════

**🎨 COLORS**
┌─────────────┬─────────────────────────────────────────┐
│ Primary     │ {{aggregated_colors.primary.hex}}       │
│ Secondary   │ {{aggregated_colors.secondary.hex}}     │
│ Accent      │ {{aggregated_colors.accent.hex}}        │
│ Background  │ {{aggregated_colors.background.default.hex}} / {{aggregated_colors.background.alt.hex}} │
│ Text        │ {{aggregated_colors.text.heading.hex}} / {{aggregated_colors.text.body.hex}} │
└─────────────┴─────────────────────────────────────────┘

**🔤 TYPOGRAPHY**
┌─────────────┬─────────────────────────────────────────┐
│ Heading     │ {{aggregated_fonts.heading.family}}     │
│ Body        │ {{aggregated_fonts.body.family}}        │
│ Mono        │ {{aggregated_fonts.mono.family}}        │
└─────────────┴─────────────────────────────────────────┘

**Scale:** Hero {{typography_scale.hero}} → H1 {{typography_scale.h1}} → H2 {{typography_scale.h2}} → H3 {{typography_scale.h3}} → Body {{typography_scale.body}} → Small {{typography_scale.small}}

**📐 SHAPES**
┌─────────────┬─────────────────────────────────────────┐
│ Corners     │ {{aggregated_shapes.corner_radius}}     │
│ Shadows     │ {{aggregated_shapes.shadow ? 'Yes' : 'No'}} │
│ Arrows      │ {{arrow_styles.default.stroke_width}} stroke, {{arrow_styles.default.head_type}} head │
└─────────────┴─────────────────────────────────────────┘

**🎭 PERSONALITY**
┌─────────────┬─────────────────────────────────────────┐
│ Type        │ {{brand_personality.classification}}    │
│ Confidence  │ {{brand_personality.confidence}}        │
│ Notes       │ {{brand_personality.notes}}             │
└─────────────┴─────────────────────────────────────────┘

**📊 SOURCES ANALYZED:** {{extraction_sources.length}} asset(s)

Ready to proceed to theme generation...
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 3: THEME GENERATION (Story 2.3)
       Synthesizes theme.json from extracted primitives
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="3" goal="Initialize theme generation">
    <action>Update status.yaml with: phase: "theme-generation", last_action: "starting theme synthesis"</action>

    <output>
───────────────────────────────────────────────────────────────────────────────
📦 **PHASE 3: THEME FILE GENERATION**
───────────────────────────────────────────────────────────────────────────────

Synthesizing your brand theme from extracted primitives...
This will create a complete theme.json file for consistent slide generation.
───────────────────────────────────────────────────────────────────────────────
    </output>

    <action>Verify {{extracted_primitives}} is available from Phase 2</action>
    <check if="{{extracted_primitives}} is empty or undefined">
      <output>❌ Error: No extracted primitives found from Phase 2.
Please ensure brand primitive extraction completed successfully before theme generation.</output>
      <action>HALT</action>
    </check>
  </step>

  <step n="3.1" goal="Build meta section">
    <output>📋 Building theme metadata...</output>

    <action>Build meta section from extraction data:
      {{theme_meta}} = {
        "name": "Brand Theme",
        "version": "1.0",
        "created": "[current date in YYYY-MM-DD format]",
        "sources": [extract source names from {{extraction_sources}}]
      }

      For sources array:
      - If website_url was provided → add website domain
      - If pdf_paths were provided → add PDF filenames
      - If image_paths were provided → add image filenames
    </action>

    <output>✅ Meta section built with {{theme_meta.sources.length}} source(s)</output>
  </step>

  <step n="3.2" goal="Build colors section with CSS variable mapping">
    <output>🎨 Mapping colors to theme structure...</output>

    <action>Build colors section from {{extracted_primitives.colors}}:
      {{theme_colors}} = {
        "primary": "{{extracted_primitives.colors.primary}}",
        "secondary": "{{extracted_primitives.colors.secondary}}",
        "accent": "{{extracted_primitives.colors.accent}}",
        "background": {
          "default": "{{extracted_primitives.colors.background.default}}",
          "alt": "{{extracted_primitives.colors.background.alt}}"
        },
        "text": {
          "heading": "{{extracted_primitives.colors.text.heading}}",
          "body": "{{extracted_primitives.colors.text.body}}"
        },
        "semantic": {
          "success": "#22C55E",
          "warning": "#F59E0B",
          "error": "#EF4444"
        }
      }

      CSS Variable Mapping (for reference):
      - colors.primary → --color-primary
      - colors.secondary → --color-secondary
      - colors.accent → --color-accent
      - colors.background.default → --color-bg-default
      - colors.background.alt → --color-bg-alt
      - colors.text.heading → --color-text-heading
      - colors.text.body → --color-text-body
    </action>

    <action>Validate all color values are valid hex format (#RRGGBB or #RGB):
      For each color in {{theme_colors}}:
        - Check if value matches regex: ^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$
        - If invalid, log warning and use fallback:
          - primary: "#2563EB" (blue)
          - secondary: "#1E40AF" (dark blue)
          - accent: "#F59E0B" (amber)
          - background.default: "#FFFFFF"
          - background.alt: "#F8FAFC"
          - text.heading: "#0F172A"
          - text.body: "#334155"
    </action>

    <output>✅ Colors section mapped (7 color values)</output>
  </step>

  <step n="3.3" goal="Build typography section with CSS variable mapping">
    <output>🔤 Mapping typography to theme structure...</output>

    <action>Build typography section from {{extracted_primitives.typography}}:
      {{theme_typography}} = {
        "fonts": {
          "heading": "{{extracted_primitives.typography.fonts.heading}}",
          "body": "{{extracted_primitives.typography.fonts.body}}",
          "mono": "{{extracted_primitives.typography.fonts.mono}}"
        },
        "scale": {
          "hero": "{{extracted_primitives.typography.scale.hero}}",
          "h1": "{{extracted_primitives.typography.scale.h1}}",
          "h2": "{{extracted_primitives.typography.scale.h2}}",
          "h3": "{{extracted_primitives.typography.scale.h3}}",
          "body": "{{extracted_primitives.typography.scale.body}}",
          "small": "{{extracted_primitives.typography.scale.small}}"
        },
        "weights": {
          "normal": 400,
          "medium": 500,
          "bold": 700
        }
      }

      CSS Variable Mapping (for reference):
      - fonts.heading → --font-heading
      - fonts.body → --font-body
      - fonts.mono → --font-mono
      - scale.hero → --size-hero
      - scale.h1 → --size-h1
      - scale.h2 → --size-h2
      - scale.h3 → --size-h3
      - scale.body → --size-body
      - scale.small → --size-small
    </action>

    <action>Validate typography values:
      For fonts:
        - Ensure each font family is a non-empty string
        - If empty, use fallbacks:
          - heading: "Inter, system-ui, sans-serif"
          - body: "Inter, system-ui, sans-serif"
          - mono: "'SF Mono', Consolas, monospace"
      For scale:
        - Ensure each size includes unit (px, rem, em)
        - If missing unit, append "px"
    </action>

    <output>✅ Typography section mapped (3 fonts, 6 sizes, 3 weights)</output>
  </step>

  <step n="3.4" goal="Build shapes section">
    <output>📐 Mapping shapes to theme structure...</output>

    <action>Build shapes section from {{extracted_primitives.shapes}}:
      {{theme_shapes}} = {
        "boxes": {
          "default": {
            "cornerRadius": "{{extracted_primitives.shapes.boxes.default.corner_radius}}",
            "border": "{{extracted_primitives.shapes.boxes.default.border}}",
            "shadow": "{{extracted_primitives.shapes.boxes.default.shadow}}"
          },
          "callout": {
            "cornerRadius": "{{extracted_primitives.shapes.boxes.callout.corner_radius}}",
            "border": "{{extracted_primitives.shapes.boxes.callout.border}}",
            "shadow": "0 4px 12px rgba(0, 0, 0, 0.15)"
          }
        },
        "arrows": {
          "default": {
            "strokeWidth": "{{extracted_primitives.shapes.arrows.default.stroke_width}}",
            "headType": "{{extracted_primitives.shapes.arrows.default.head_type}}",
            "curve": "{{extracted_primitives.shapes.arrows.default.curve_style}}"
          }
        },
        "lines": {
          "default": {
            "strokeWidth": "1px",
            "style": "solid"
          }
        }
      }
    </action>

    <action>Validate shape values:
      For cornerRadius:
        - Ensure includes unit (px, %, rem)
        - If missing, append "px"
        - Fallback: "8px"
      For shadow:
        - Ensure valid CSS box-shadow or "none"
        - Fallback: "0 2px 8px rgba(0, 0, 0, 0.1)"
      For strokeWidth:
        - Ensure includes unit
        - Fallback: "2px"
      For headType:
        - Ensure one of: "arrow", "triangle", "circle", "none"
        - Fallback: "arrow"
      For curve:
        - Ensure one of: "straight", "curved", "smooth"
        - Fallback: "smooth"
    </action>

    <output>✅ Shapes section mapped (boxes, arrows, lines)</output>
  </step>

  <step n="3.5" goal="Build layouts placeholder section">
    <output>📑 Creating layouts placeholder...</output>

    <action>Build layouts section as placeholder for Story 2.4:
      {{theme_layouts}} = {
        "title": { "file": "layout-title.html" },
        "list": { "file": "layout-list.html" },
        "flow": { "file": "layout-flow.html" },
        "columns-2": { "file": "layout-columns-2.html" },
        "columns-3": { "file": "layout-columns-3.html" },
        "callout": { "file": "layout-callout.html" },
        "code": { "file": "layout-code.html" }
      }

      Note: These layout files will be generated in Story 2.4 (Sample Deck Generation).
      The placeholder ensures the theme structure is complete.
    </action>

    <output>✅ Layouts placeholder created (7 layout types defined)</output>
  </step>

  <step n="3.6" goal="Build personality section">
    <output>🎭 Adding personality classification...</output>

    <action>Build personality section from {{extracted_primitives.personality}}:
      {{theme_personality}} = {
        "classification": "{{extracted_primitives.personality.classification}}",
        "confidence": {{extracted_primitives.personality.confidence}},
        "notes": "{{extracted_primitives.personality.notes}}"
      }
    </action>

    <action>Validate personality values:
      - classification: must be one of ["bold", "minimal", "corporate", "playful"]
        - Fallback: "corporate"
      - confidence: must be number between 0 and 1
        - Fallback: 0.7
      - notes: must be non-empty string
        - Fallback: "Inferred from brand assets"
    </action>

    <output>✅ Personality: {{theme_personality.classification}} (confidence: {{theme_personality.confidence}})</output>
  </step>

  <step n="3.7" goal="Assemble and validate complete theme.json">
    <output>🔧 Assembling complete theme.json...</output>

    <action>Assemble complete theme object:
      {{theme_json}} = {
        "meta": {{theme_meta}},
        "colors": {{theme_colors}},
        "typography": {{theme_typography}},
        "shapes": {{theme_shapes}},
        "layouts": {{theme_layouts}},
        "personality": {{theme_personality}}
      }
    </action>

    <action>Perform final validation:
      1. Verify all required top-level sections exist:
         - meta (required)
         - colors (required)
         - typography (required)
         - shapes (required)
         - layouts (required)
         - personality (required)

      2. Verify no null or undefined values in required fields

      3. Verify JSON is valid (can be stringified without errors)

      4. Log validation result
    </action>

    <check if="validation fails">
      <output>❌ Theme validation failed: {{validation_errors}}
Attempting to fix issues with fallback values...</output>
      <action>Apply fallback values for any missing/invalid fields</action>
      <action>Re-validate</action>
      <check if="re-validation fails">
        <output>❌ Critical error: Unable to generate valid theme.json
Please check extraction data and try again.</output>
        <action>HALT</action>
      </check>
    </check>

    <output>✅ Theme validation passed - all sections complete</output>
  </step>

  <step n="3.8" goal="Write theme.json to file">
    <output>💾 Saving theme.json...</output>

    <action>Use Write tool to save theme.json:
      - File path: {config_path}/theme.json
      - Content: JSON.stringify({{theme_json}}, null, 2) (pretty-printed with 2-space indent)
    </action>

    <check if="Write succeeds">
      <output>✅ Theme saved to .slide-builder/config/theme.json</output>
    </check>

    <check if="Write fails">
      <output>❌ Failed to save theme.json: {{error_message}}
Please check file permissions and try again.</output>
      <action>HALT</action>
    </check>
  </step>

  <step n="3.9" goal="Display theme generation summary">
    <action>Update status.yaml with: phase: "theme-generation-complete", last_action: "theme.json created"</action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **THEME FILE GENERATED**
═══════════════════════════════════════════════════════════════════════════════

📁 **File:** .slide-builder/config/theme.json

**📋 META**
┌─────────────┬─────────────────────────────────────────┐
│ Name        │ {{theme_meta.name}}                      │
│ Version     │ {{theme_meta.version}}                   │
│ Created     │ {{theme_meta.created}}                   │
│ Sources     │ {{theme_meta.sources.length}} asset(s)   │
└─────────────┴─────────────────────────────────────────┘

**🎨 COLORS** (CSS Variables: --color-*)
┌─────────────┬─────────────────────────────────────────┐
│ Primary     │ {{theme_colors.primary}}                 │
│ Secondary   │ {{theme_colors.secondary}}               │
│ Accent      │ {{theme_colors.accent}}                  │
│ Background  │ {{theme_colors.background.default}} / {{theme_colors.background.alt}} │
│ Text        │ {{theme_colors.text.heading}} / {{theme_colors.text.body}} │
└─────────────┴─────────────────────────────────────────┘

**🔤 TYPOGRAPHY** (CSS Variables: --font-*, --size-*)
┌─────────────┬─────────────────────────────────────────┐
│ Heading     │ {{theme_typography.fonts.heading}}       │
│ Body        │ {{theme_typography.fonts.body}}          │
│ Mono        │ {{theme_typography.fonts.mono}}          │
└─────────────┴─────────────────────────────────────────┘

**📐 SHAPES**
┌─────────────┬─────────────────────────────────────────┐
│ Corners     │ {{theme_shapes.boxes.default.cornerRadius}} │
│ Shadows     │ {{theme_shapes.boxes.default.shadow}}    │
│ Arrows      │ {{theme_shapes.arrows.default.strokeWidth}}, {{theme_shapes.arrows.default.headType}} │
└─────────────┴─────────────────────────────────────────┘

**📑 LAYOUTS** (7 templates defined - will be generated in Phase 4)
title, list, flow, columns-2, columns-3, callout, code

**🎭 PERSONALITY**
┌─────────────┬─────────────────────────────────────────┐
│ Type        │ {{theme_personality.classification}}     │
│ Confidence  │ {{theme_personality.confidence}}         │
│ Notes       │ {{theme_personality.notes}}              │
└─────────────┴─────────────────────────────────────────┘

Ready to proceed to sample deck generation...
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 4: SAMPLE DECK GENERATION (Story 2.4)
       Generates 6 sample slides demonstrating all theme primitives
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="4" goal="Initialize sample deck generation">
    <action>Update status.yaml with: phase: "sample-generation", last_action: "starting sample deck generation"</action>

    <output>
───────────────────────────────────────────────────────────────────────────────
🎨 **PHASE 4: SAMPLE DECK GENERATION**
───────────────────────────────────────────────────────────────────────────────

Generating 6 sample slides to demonstrate your brand theme...
Each slide tests specific design primitives from theme.json.
───────────────────────────────────────────────────────────────────────────────
    </output>

    <action>Read theme.json from {config_path}/theme.json</action>
    <check if="theme.json does not exist or is invalid">
      <output>❌ Error: theme.json not found or invalid.
Please ensure Phase 3 (theme generation) completed successfully.</output>
      <action>HALT</action>
    </check>

    <action>Extract theme values for CSS variable generation:
      - colors: primary, secondary, accent, background (default/alt), text (heading/body)
      - typography: fonts (heading, body, mono), scale (hero, h1, h2, h3, body, small)
      - shapes: boxes (cornerRadius, shadow), arrows (strokeWidth, headType)
      - personality: classification for tone guidance
    </action>

    <action>Create .slide-builder/config/samples/ directory if it does not exist</action>
  </step>

  <step n="4.1" goal="Define slide specifications">
    <action>Define the 6 sample slide specifications:

      {{slide_specs}} = [
        {
          number: 1,
          filename: "01-title.html",
          type: "Title",
          primitives: ["hero typography", "primary color", "default background"],
          content: {
            title: "Hero headline with brand name",
            subtitle: "Tagline or value proposition",
            elements: ["logo area", "date"]
          }
        },
        {
          number: 2,
          filename: "02-agenda.html",
          type: "List/Agenda",
          primitives: ["body text", "bullets", "spacing", "alt background"],
          content: {
            title: "Today's Agenda",
            items: ["4-5 agenda items with descriptions"],
            elements: ["numbered list", "section labels"]
          }
        },
        {
          number: 3,
          filename: "03-flow.html",
          type: "Process Flow",
          primitives: ["arrows", "boxes", "connectors", "secondary color"],
          content: {
            title: "Process steps",
            steps: ["3-4 connected steps with icons"],
            elements: ["arrows between boxes", "step numbers"]
          }
        },
        {
          number: 4,
          filename: "04-comparison.html",
          type: "Comparison",
          primitives: ["multiple box styles", "alignment", "semantic colors"],
          content: {
            title: "Before vs After comparison",
            columns: ["2 columns with feature lists"],
            elements: ["badges", "checkmarks/x marks"]
          }
        },
        {
          number: 5,
          filename: "05-callout.html",
          type: "Key Insight",
          primitives: ["callout box", "accent color", "emphasis"],
          content: {
            statistic: "Large impact number",
            label: "Metric description",
            description: "Supporting context",
            elements: ["icon", "source citation"]
          }
        },
        {
          number: 6,
          filename: "06-technical.html",
          type: "Technical/Code",
          primitives: ["mono font", "alt background", "code syntax"],
          content: {
            title: "API or code example",
            code: "Syntax-highlighted code block",
            elements: ["code window chrome", "line numbers", "feature badges"]
          }
        }
      ]
    </action>
  </step>

  <step n="4.2" goal="Generate sample slides using frontend-design skill">
    <critical>INVOKE FRONTEND-DESIGN SKILL for professional slide generation</critical>

    <action n="4.2.0">Execute Skill tool call:
      ```
      Skill(skill="frontend-design")
      ```
      This loads professional design expertise for creating visually appealing slides.
      YOU MUST MAKE THIS TOOL CALL NOW BEFORE GENERATING SLIDES.
    </action>

    <for-each item="slide_spec" in="{{slide_specs}}">
      <output>🖼️ Generating slide {{slide_spec.number}} of 6: {{slide_spec.type}}...</output>

      <action>Build CSS :root block with all theme variables:
        ```css
        :root {
          --color-primary: {{theme.colors.primary}};
          --color-secondary: {{theme.colors.secondary}};
          --color-accent: {{theme.colors.accent}};
          --color-bg-default: {{theme.colors.background.default}};
          --color-bg-alt: {{theme.colors.background.alt}};
          --color-text-heading: {{theme.colors.text.heading}};
          --color-text-body: {{theme.colors.text.body}};
          --font-heading: {{theme.typography.fonts.heading}};
          --font-body: {{theme.typography.fonts.body}};
          --font-mono: {{theme.typography.fonts.mono}};
          --size-hero: {{theme.typography.scale.hero}};
          --size-h1: {{theme.typography.scale.h1}};
          --size-h2: {{theme.typography.scale.h2}};
          --size-h3: {{theme.typography.scale.h3}};
          --size-body: {{theme.typography.scale.body}};
          --size-small: {{theme.typography.scale.small}};
        }
        ```
      </action>

      <action>Generate complete HTML slide for {{slide_spec.type}}:
        - Include DOCTYPE, html, head with charset, viewport (1920x1080)
        - Add Google Fonts link for {{theme.typography.fonts.heading}}
        - Include CSS :root block with all theme variables
        - Body and slide container set to exactly 1920x1080 pixels
        - Use CSS variables throughout (never hardcode colors/fonts)
        - Create content appropriate for {{slide_spec.type}} demonstrating {{slide_spec.primitives}}
        - Apply brand personality: {{theme.personality.classification}}
      </action>

      <action>Save slide to {config_path}/samples/{{slide_spec.filename}}</action>

      <check if="Write fails">
        <output>⚠️ Failed to save {{slide_spec.filename}}: {{error_message}}</output>
      </check>
    </for-each>
  </step>

  <step n="4.3" goal="Verify sample generation and update status">
    <action>Verify all 6 files exist in .slide-builder/config/samples/:
      - 01-title.html
      - 02-agenda.html
      - 03-flow.html
      - 04-comparison.html
      - 05-callout.html
      - 06-technical.html
    </action>

    <check if="any files missing">
      <output>⚠️ Warning: Some sample slides failed to generate.
Missing: {{missing_files}}
Attempting to regenerate...</output>
      <action>Retry generation for missing files</action>
    </check>

    <action>Update status.yaml with:
      phase: "sample-review"
      samples:
        directory: .slide-builder/config/samples/
        count: 6
        files:
          - 01-title.html
          - 02-agenda.html
          - 03-flow.html
          - 04-comparison.html
          - 05-callout.html
          - 06-technical.html
      last_action: "Sample slides generated for review"
    </action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **SAMPLE DECK GENERATED**
═══════════════════════════════════════════════════════════════════════════════

📁 **Location:** .slide-builder/config/samples/

**Generated Slides:**

| # | File | Type | Primitives Demonstrated |
|---|------|------|-------------------------|
| 1 | 01-title.html | Title | Hero typography, primary color, background |
| 2 | 02-agenda.html | Agenda/List | Body text, bullets, spacing |
| 3 | 03-flow.html | Process Flow | Arrows, boxes, connectors |
| 4 | 04-comparison.html | Comparison | Multiple box styles, alignment |
| 5 | 05-callout.html | Key Insight | Callout box, accent color, emphasis |
| 6 | 06-technical.html | Technical | Mono font, code syntax, alt background |

**🔍 How to Preview:**
1. Open each .html file directly in your browser
2. Check that brand colors and fonts are applied
3. Verify layouts look professional and on-brand

**⚠️ Note:** Each slide is 1920x1080 pixels. For best preview, view at 100% zoom or use browser developer tools to see the full slide.

Ready for your feedback...
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 5: FEEDBACK LOOP (Story 2.5)
       Collects gestalt feedback, interprets it, adjusts theme, regenerates samples
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="5" goal="Initialize feedback loop">
    <action>Update status.yaml with: phase: "feedback-loop", feedback_iteration: 0</action>

    <output>
───────────────────────────────────────────────────────────────────────────────
🔄 **PHASE 5: THEME FEEDBACK LOOP**
───────────────────────────────────────────────────────────────────────────────

Your sample slides are ready for review. I'll refine the theme based on your feedback.

**How to provide feedback:**
- Give high-level impressions ("too corporate", "not bold enough", "colors feel off")
- Don't worry about specific values - I'll interpret and adjust
- Say "Perfect" or "Approved" when you're happy with the results

Target: 1-3 feedback rounds to get it right.
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <step n="5.1" goal="Collect feedback from user">
    <anchor id="feedback_prompt" />

    <action>Read current feedback_iteration from status.yaml</action>
    <action>Increment feedback_iteration by 1</action>
    <action>Update status.yaml with new feedback_iteration value</action>

    <ask>
**Theme Validation** (Round {{feedback_iteration}})

How do the sample slides look? Open .slide-builder/config/samples/*.html in your browser and provide feedback:

- "Too corporate" - I'll soften colors, add warmth, increase corner radius
- "Not bold enough" - I'll increase contrast, reduce corner radius, use heavier weights
- "Colors feel off" - I'll ask what direction you'd prefer
- "Too busy" - I'll increase whitespace, reduce shadows
- "Too plain" - I'll add accent usage, increase shadow depth
- "Fonts don't feel right" - I'll explore alternatives
- **"Perfect"** or **"Approved"** - Theme will be locked and finalized

Your feedback:
    </ask>

    <action>Store response as {{user_feedback}}</action>
    <action>Convert {{user_feedback}} to lowercase for matching: {{feedback_lower}}</action>
  </step>

  <step n="5.2" goal="Check for approval">
    <action>Check if {{feedback_lower}} contains approval keywords: "perfect", "approved", "looks good", "love it", "great", "done", "yes", "ship it"</action>

    <check if="{{feedback_lower}} indicates approval">
      <output>✅ Theme approved! Proceeding to finalization...</output>
      <goto step="6">Finalization</goto>
    </check>

    <action>User provided feedback, not approval - proceed to interpretation</action>
  </step>

  <step n="5.3" goal="Interpret gestalt feedback">
    <output>🔍 Interpreting your feedback: "{{user_feedback}}"...</output>

    <action>Apply Feedback Interpretation Mapping to determine theme adjustments:

      **FEEDBACK PATTERNS AND ADJUSTMENTS:**

      Pattern: "corporate" OR "formal" OR "stiff" OR "cold"
      → Adjustments:
        - colors.primary: Reduce saturation by 10% (add warmth)
        - colors.text.body: Shift toward warmer gray
        - shapes.boxes.default.cornerRadius: Increase by 4px (max 16px)
        - personality.notes: Append "Softened per user feedback"

      Pattern: "bold" OR "stronger" OR "bolder" OR "more contrast" OR "punch"
      → Adjustments:
        - colors.primary: Darken by 15% (increase contrast)
        - colors.accent: Increase saturation by 10%
        - shapes.boxes.default.cornerRadius: Decrease by 4px (min 0px)
        - typography.weights: Prefer semibold (600) over medium (500)
        - shapes.boxes.default.shadow: Intensify shadow
        - personality.notes: Append "Increased boldness per user feedback"

      Pattern: "colors" OR "palette" OR "color" OR "hue"
      → Action: ASK clarifying question
        "What direction would you like the colors to go?
        - Warmer (more orange/red tones)
        - Cooler (more blue tones)
        - More saturated (vivid)
        - Less saturated (muted)
        - Specific color preference?"
      → Store clarification as {{color_direction}}
      → Apply adjustments based on {{color_direction}}

      Pattern: "busy" OR "cluttered" OR "noisy" OR "overwhelming"
      → Adjustments:
        - shapes.boxes.default.shadow: Reduce intensity or remove
        - shapes.boxes.default.border: Simplify or remove
        - shapes.arrows.default.strokeWidth: Reduce by 1px
        - personality.notes: Append "Simplified per user feedback"

      Pattern: "plain" OR "boring" OR "flat" OR "dull" OR "needs more"
      → Adjustments:
        - colors.accent: Increase usage prominence
        - shapes.boxes.default.shadow: Add or intensify
        - shapes.boxes.callout.shadow: Add accent glow
        - personality.notes: Append "Added visual interest per user feedback"

      Pattern: "font" OR "typography" OR "text" OR "typeface"
      → Action: ASK clarifying question
        "What feels off about the fonts?
        - Too formal/serious
        - Too casual/playful
        - Hard to read
        - Specific font you'd prefer?"
      → Store clarification and adjust typography.fonts accordingly

      Pattern: unrecognized or ambiguous
      → Action: ASK clarifying question
        "I want to make sure I understand your feedback: '{{user_feedback}}'
        Could you tell me more about what you'd like to change?
        - Colors (warmer, cooler, different palette)
        - Typography (different fonts, weights)
        - Shapes (rounder, sharper, more/less shadow)
        - Overall feel (bolder, softer, more professional, more casual)"
    </action>

    <action>Build {{theme_adjustments}} object with all identified changes</action>
    <action>Log adjustments to be applied</action>

    <output>📝 **Identified Adjustments:**
{{theme_adjustments_summary}}

Applying changes to theme...</output>
  </step>

  <step n="5.4" goal="Apply theme modifications">
    <action>Read current theme.json from {config_path}/theme.json</action>
    <action>Parse JSON into {{current_theme}} object</action>

    <action>Apply each adjustment from {{theme_adjustments}}:
      For color adjustments:
        - Parse hex color to RGB
        - Apply saturation/lightness/hue changes
        - Convert back to hex
        - Validate contrast ratios for text colors (WCAG AA: 4.5:1 minimum)
        - If contrast fails, adjust text color to maintain readability

      For cornerRadius adjustments:
        - Parse current value (remove "px")
        - Apply delta (+4px or -4px)
        - Clamp to valid range (0px - 24px)
        - Format with "px" suffix

      For shadow adjustments:
        - Intensify: Increase blur and spread, darken color
        - Reduce: Decrease blur and spread, lighten color
        - Remove: Set to "none"

      For typography adjustments:
        - Update font family strings
        - Preserve fallback fonts (system-ui, sans-serif)
        - Update weight preferences
    </action>

    <action>Preserve unaffected sections:
      - meta (except update version)
      - layouts
      - Any sections not in {{theme_adjustments}}
    </action>

    <action>Update meta section:
      - Increment version (e.g., "1.0" → "1.1")
      - Update "modified" timestamp
      - Keep "locked" as false (not yet approved)
    </action>

    <action>Validate complete theme structure before saving</action>

    <action>Write updated theme to {config_path}/theme.json using Write tool</action>

    <check if="Write fails">
      <output>❌ Failed to save theme.json: {{error_message}}
Please check file permissions and try again.</output>
      <action>HALT</action>
    </check>

    <output>✅ Theme updated successfully</output>
  </step>

  <step n="5.5" goal="Regenerate sample slides with updated theme">
    <output>🎨 Regenerating sample slides with updated theme...</output>

    <action>Update status.yaml with: last_action: "Regenerating samples (iteration {{feedback_iteration}})"</action>

    <critical>INVOKE FRONTEND-DESIGN SKILL for slide regeneration</critical>

    <action n="5.5.0">Execute Skill tool call:
      ```
      Skill(skill="frontend-design")
      ```
      This loads professional design expertise for creating visually appealing slides.
      YOU MUST MAKE THIS TOOL CALL NOW BEFORE REGENERATING SLIDES.
    </action>

    <action>Read updated theme.json to get new CSS variable values</action>

    <action>Build CSS :root block with updated theme variables:
      ```css
      :root {
        --color-primary: {{theme.colors.primary}};
        --color-secondary: {{theme.colors.secondary}};
        --color-accent: {{theme.colors.accent}};
        --color-bg-default: {{theme.colors.background.default}};
        --color-bg-alt: {{theme.colors.background.alt}};
        --color-text-heading: {{theme.colors.text.heading}};
        --color-text-body: {{theme.colors.text.body}};
        --font-heading: {{theme.typography.fonts.heading}};
        --font-body: {{theme.typography.fonts.body}};
        --font-mono: {{theme.typography.fonts.mono}};
        --size-hero: {{theme.typography.scale.hero}};
        --size-h1: {{theme.typography.scale.h1}};
        --size-h2: {{theme.typography.scale.h2}};
        --size-h3: {{theme.typography.scale.h3}};
        --size-body: {{theme.typography.scale.body}};
        --size-small: {{theme.typography.scale.small}};
      }
      ```
    </action>

    <for-each item="slide_file" in="['01-title.html', '02-agenda.html', '03-flow.html', '04-comparison.html', '05-callout.html', '06-technical.html']">
      <output>  🖼️ Regenerating {{slide_file}}...</output>

      <action>Read current slide from {config_path}/samples/{{slide_file}}</action>

      <action>Regenerate the slide HTML:
        - Use the same layout structure and content as before
        - Update the CSS :root block with new theme variables
        - Ensure all styling uses CSS variables (no hardcoded colors/fonts)
        - Maintain 1920x1080 dimensions
        - Apply personality adjustments to visual weight and styling
      </action>

      <action>Write regenerated slide to {config_path}/samples/{{slide_file}}</action>

      <check if="Write succeeds">
        <output>  ✅ {{slide_file}} regenerated</output>
      </check>

      <check if="Write fails">
        <output>  ⚠️ Failed to regenerate {{slide_file}}: {{error_message}}</output>
      </check>
    </for-each>

    <action>Update status.yaml with: last_action: "Samples regenerated (iteration {{feedback_iteration}})"</action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **SAMPLE SLIDES UPDATED**
═══════════════════════════════════════════════════════════════════════════════

**Changes Applied:**
{{theme_adjustments_summary}}

**Updated Files:**
- .slide-builder/config/theme.json (v{{theme.meta.version}})
- .slide-builder/config/samples/01-title.html
- .slide-builder/config/samples/02-agenda.html
- .slide-builder/config/samples/03-flow.html
- .slide-builder/config/samples/04-comparison.html
- .slide-builder/config/samples/05-callout.html
- .slide-builder/config/samples/06-technical.html

**🔍 Please refresh your browser to see the changes.**
───────────────────────────────────────────────────────────────────────────────
    </output>
  </step>

  <step n="5.6" goal="Check iteration count and offer escape hatch">
    <action>Read feedback_iteration from status.yaml</action>

    <check if="feedback_iteration >= 3">
      <output>
───────────────────────────────────────────────────────────────────────────────
⚠️ **ITERATION LIMIT REACHED**
───────────────────────────────────────────────────────────────────────────────

We've gone through {{feedback_iteration}} rounds of feedback. If the theme still isn't quite right, you have options:

**Option 1: Continue with feedback** (recommended if close)
  - Provide another round of gestalt feedback

**Option 2: Direct theme editing** (escape hatch)
  - Edit .slide-builder/config/theme.json directly
  - Modify specific values (colors, fonts, sizes)
  - Run `/sb:theme-edit` when done to regenerate samples

**Option 3: Approve current theme**
  - Say "Approved" to lock the current theme

What would you like to do?
───────────────────────────────────────────────────────────────────────────────
      </output>

      <ask>Your choice (feedback / edit / approved):</ask>

      <action>Store response as {{escape_choice}}</action>

      <check if="{{escape_choice}} contains 'edit'">
        <output>
📝 **Direct Editing Mode**

You can now edit .slide-builder/config/theme.json directly:

1. Open .slide-builder/config/theme.json in your editor
2. Modify values as needed (colors are hex, sizes have px suffix)
3. Save the file
4. Run `/sb:theme-edit` to regenerate samples with your changes

Exiting setup workflow. Resume with `/sb:setup` after editing.
        </output>
        <action>Update status.yaml with: phase: "manual-edit", last_action: "User chose direct editing"</action>
        <action>HALT</action>
      </check>

      <check if="{{escape_choice}} contains 'approved' OR {{escape_choice}} contains 'approve'">
        <output>✅ Theme approved! Proceeding to finalization...</output>
        <goto step="6">Finalization</goto>
      </check>

      <check if="{{escape_choice}} contains 'feedback' OR default">
        <output>Continuing with feedback loop...</output>
        <goto step="5.1">feedback_prompt</goto>
      </check>
    </check>

    <check if="feedback_iteration < 3">
      <action>Continue to next feedback round</action>
      <goto step="5.1">feedback_prompt</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 6: FINALIZATION (Story 2.5)
       Locks theme, copies to templates, saves version history
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="6" goal="Finalize and lock theme">
    <action>Update status.yaml with: phase: "finalization", last_action: "Locking theme"</action>

    <output>
───────────────────────────────────────────────────────────────────────────────
🔒 **PHASE 6: THEME FINALIZATION**
───────────────────────────────────────────────────────────────────────────────

Locking your approved theme and creating layout templates...
───────────────────────────────────────────────────────────────────────────────
    </output>

    <action>Read current theme.json</action>

    <action>Update theme.json meta section:
      - Set "locked": true
      - Set "approved": "[current date YYYY-MM-DD]"
      - Ensure version is set (e.g., "1.0" if first approval)
    </action>

    <action>Write updated theme.json</action>

    <output>✅ Theme locked (v{{theme.meta.version}})</output>
  </step>

  <step n="6.1" goal="Create templates directory and copy samples">
    <action>Create .slide-builder/config/templates/ directory if it doesn't exist</action>

    <output>📁 Creating layout templates...</output>

    <action>Define sample-to-template filename mapping:
      {{filename_mapping}} = {
        "01-title.html": "layout-title.html",
        "02-agenda.html": "layout-list.html",
        "03-flow.html": "layout-flow.html",
        "04-comparison.html": "layout-columns-2.html",
        "05-callout.html": "layout-callout.html",
        "06-technical.html": "layout-code.html"
      }
    </action>

    <for-each item="sample_file, template_file" in="{{filename_mapping}}">
      <action>Read {config_path}/samples/{{sample_file}}</action>
      <action>Write to {project-root}/.slide-builder/config/templates/{{template_file}}</action>

      <check if="Write succeeds">
        <output>  ✅ {{sample_file}} → {{template_file}}</output>
      </check>

      <check if="Write fails">
        <output>  ⚠️ Failed to copy {{sample_file}}: {{error_message}}</output>
      </check>
    </for-each>

    <output>✅ 6 layout templates created in .slide-builder/config/templates/</output>
  </step>

  <step n="6.2" goal="Update theme.json layouts section">
    <action>Read theme.json</action>

    <action>Update layouts section with template file references:
      {{theme.layouts}} = {
        "title": { "file": "layout-title.html" },
        "list": { "file": "layout-list.html" },
        "flow": { "file": "layout-flow.html" },
        "columns-2": { "file": "layout-columns-2.html" },
        "callout": { "file": "layout-callout.html" },
        "code": { "file": "layout-code.html" }
      }
    </action>

    <action>Write updated theme.json</action>

    <output>✅ Theme layouts section updated with template references</output>
  </step>

  <step n="6.3" goal="Save theme version history">
    <action>Create .slide-builder/config/theme-history/ directory if it doesn't exist</action>

    <action>Determine version number:
      - If first version: v1
      - Otherwise: increment from last version in theme-history/
    </action>

    <action>Generate timestamp: [current date YYYY-MM-DD]</action>

    <action>Build history filename: theme-v{{version}}-{{date}}.json</action>

    <action>Read current theme.json</action>

    <action>Write theme snapshot to {project-root}/.slide-builder/config/theme-history/{{history_filename}}</action>

    <check if="Write succeeds">
      <output>✅ Theme version saved: theme-history/{{history_filename}}</output>
      <!-- Status Logger: Log version save to history -->
      <action>Read .slide-builder/status.yaml</action>
      <action>Append to history array: { action: "Theme v{{version}} saved to history", timestamp: "[current ISO 8601 timestamp]" }</action>
      <action>Save status.yaml preserving existing structure</action>
    </check>

    <check if="Write fails">
      <output>⚠️ Failed to save theme history: {{error_message}}
Theme is still locked and functional, but version history was not saved.</output>
    </check>
  </step>

  <step n="6.4" goal="Update status and display completion">
    <action>Update status.yaml with:
      mode: "ready"
      phase: "complete"
      theme:
        file: .slide-builder/config/theme.json
        status: locked
        personality: {{theme.personality.classification}}
        confidence: {{theme.personality.confidence}}
        approved: "[current date]"
      templates:
        directory: .slide-builder/config/templates/
        count: 6
        files:
          - layout-title.html
          - layout-list.html
          - layout-flow.html
          - layout-columns-2.html
          - layout-callout.html
          - layout-code.html
      last_action: "Setup complete - theme locked and approved"
      last_modified: "[current timestamp]"
    </action>

    <action>Add history entry to status.yaml:
      - action: "Theme approved and locked"
        timestamp: "[current timestamp]"
    </action>

    <output>
═══════════════════════════════════════════════════════════════════════════════
🎉 **SETUP COMPLETE!**
═══════════════════════════════════════════════════════════════════════════════

Your brand theme is ready for slide generation!

**📁 Files Created:**

| Location | Description |
|----------|-------------|
| .slide-builder/config/theme.json | Your locked brand theme (v{{theme.meta.version}}) |
| .slide-builder/config/templates/ | 6 layout templates |
| .slide-builder/config/theme-history/ | Version snapshot for rollback |

**📑 Available Layout Templates:**

| Template | Use Case |
|----------|----------|
| layout-title.html | Title slides, hero text |
| layout-list.html | Bullet lists, agendas |
| layout-flow.html | Process flows, timelines |
| layout-columns-2.html | Comparisons, two-column content |
| layout-callout.html | Key insights, statistics, CTAs |
| layout-code.html | Technical content, code blocks |

**🎨 Theme Summary:**

- **Personality:** {{theme.personality.classification}}
- **Primary Color:** {{theme.colors.primary}}
- **Heading Font:** {{theme.typography.fonts.heading}}
- **Feedback Rounds:** {{feedback_iteration}}

───────────────────────────────────────────────────────────────────────────────

**🚀 Next Steps:**

1. **Single slide:** Run `/sb:plan-one` to create one slide quickly
2. **Full deck:** Run `/sb:plan-deck` to plan a complete presentation
3. **View theme:** Run `/sb:theme` to see your theme summary anytime
4. **Edit theme:** Run `/sb:theme-edit` to modify your theme later

Happy presenting! 🎤
═══════════════════════════════════════════════════════════════════════════════
    </output>
  </step>

</workflow>
```
