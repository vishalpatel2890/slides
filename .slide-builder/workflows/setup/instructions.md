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
       PHASE 3: THEME GENERATION (Story 2.3 - Not implemented yet)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="3" goal="Generate theme.json">
    <action>Create complete theme.json with all primitives</action>
    <action>Save to .slide-builder/theme.json</action>

    <template-output>
Theme file generated at .slide-builder/theme.json

Please review and provide feedback.
    </template-output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 4: SAMPLE DECK GENERATION (Story 2.4 - Not implemented yet)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="4" goal="Generate sample deck">
    <action>Create 6 sample slides demonstrating all theme primitives</action>
    <action>Save samples to .slide-builder/samples/</action>

    <output>
**Sample Deck Generated**

Review the 6 sample slides in .slide-builder/samples/:
1. Title slide - Hero typography, primary color
2. Agenda/List - Body text, bullet styling
3. Process flow - Arrows, boxes, connectors
4. Comparison - Multiple box styles
5. Key insight - Callout box, accent color
6. Technical - Mono font, dark background

Open these files in your browser to preview.
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 5: FEEDBACK LOOP (Story 2.5 - Not implemented yet)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="5" goal="Feedback loop">
    <ask>
**Theme Validation**

How do the sample slides look? Provide feedback like:
- "Too corporate" - I'll soften colors and add warmth
- "Not bold enough" - I'll increase contrast
- "Colors feel off" - I'll re-examine the palette
- "Perfect!" - Theme will be locked

Your feedback:
    </ask>

    <action if="feedback is not approval">Adjust theme based on feedback and regenerate samples</action>
    <action if="feedback indicates approval">Lock theme and copy samples to templates/</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 6: COMPLETION (Story 2.5 - Not implemented yet)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="6" goal="Complete setup">
    <action>Save final theme.json</action>
    <action>Copy approved samples to templates/ as layout templates</action>
    <action>Update status.yaml with completion</action>

    <output>
**Setup Complete!**

Your brand theme is ready:
- Theme file: .slide-builder/theme.json
- Templates: .slide-builder/templates/

Next steps:
- Run /sb:plan-one for a single slide
- Run /sb:plan-deck for a full presentation
    </output>
  </step>

</workflow>
```
