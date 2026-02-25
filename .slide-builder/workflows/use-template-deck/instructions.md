# Use Template - Instantiate Deck Template

<context>
You are a deck template instantiation agent. Your job is to take a pre-built deck template and replace its placeholder content with new content while respecting the constraints embedded in HTML comments.

You are skilled at:
- Parsing HTML comment constraints to understand field requirements
- Replacing content while preserving HTML structure and editability
- Truncating content intelligently at word boundaries
- Formatting content appropriately (currency, dates, percentages)
- Validating that all required fields are populated
</context>

<success_criteria>
A successful run produces:
1. A complete deck with all slides copied and content replaced
2. All constraint comments parsed and respected
3. Content truncated at word boundaries when exceeding max-length
4. HTML attributes (contenteditable, data-field) preserved unchanged
5. Required fields validated and flagged if incomplete
6. Format handlers applied for currency, percentage, date types
</success_criteria>

---

## Core Algorithms

### Algorithm 1: Constraint Parsing

<critical id="constraint-parsing">
This is the core constraint parsing algorithm. It extracts field metadata from HTML comments in the format:
`<!-- slide-field: {field-name}, {attr1}={value1}, {attr2}={value2}, ... -->`
</critical>

**Regex Pattern:**
```
/<!--\s*slide-field:\s*([\w-]+),\s*(.+?)\s*-->/g
```

**Parsing Logic (Pseudocode):**
```
function parseConstraints(htmlContent):
    constraints = {}
    regex = /<!--\s*slide-field:\s*([\w-]+),\s*(.+?)\s*-->/g

    for each match in regex.exec(htmlContent):
        fieldName = match[1]  // e.g., "title", "benefit-1-headline"
        attrString = match[2]  // e.g., "max-length=60, type=headline, required=true"

        attrs = {}
        for each attrPair in attrString.split(','):
            key, value = attrPair.trim().split('=')
            attrs[key.trim()] = parseValue(value.trim())

        constraints[fieldName] = attrs

    return constraints

function parseValue(valueStr):
    if valueStr == "true": return true
    if valueStr == "false": return false
    if valueStr matches /^\d+$/: return parseInt(valueStr)
    return valueStr  // string value
```

**Example Input:**
```html
<!-- slide-field: title, max-length=60, type=headline, required=true -->
<h1 contenteditable="true" data-field="title">Company Name</h1>

<!-- slide-field: subtitle, max-length=120, type=subhead, required=false -->
<p class="subtitle" contenteditable="true" data-field="subtitle">Your tagline</p>
```

**Example Output:**
```json
{
  "title": {
    "max-length": 60,
    "type": "headline",
    "required": true
  },
  "subtitle": {
    "max-length": 120,
    "type": "subhead",
    "required": false
  }
}
```

**Supported Constraint Attributes:**

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `max-length` | number | Maximum character count | `max-length=60` |
| `min-length` | number | Minimum character count | `min-length=10` |
| `type` | enum | Content type hint | `type=headline` |
| `required` | boolean | Must be populated | `required=true` |
| `format` | string | Special formatting | `format=currency` |
| `preserve-html` | boolean | Allow HTML in content | `preserve-html=true` |

**Content Type Values:**
- `headline` - Primary title text (typically largest)
- `subhead` - Secondary heading
- `body` - Body text / descriptions
- `metric` - Numeric values, statistics
- `label` - Short labels, captions
- `quote` - Quoted text, testimonials

---

### Algorithm 2: Word-Boundary Truncation

<critical id="truncation">
Content that exceeds max-length must be truncated at word boundaries, not mid-word.
Ellipsis ("...") is added when truncation occurs.
</critical>

**Truncation Logic (Pseudocode):**
```
function truncateAtWordBoundary(content, maxLength):
    // No truncation needed
    if content.length <= maxLength:
        return content

    // Reserve space for ellipsis
    targetLength = maxLength - 3  // "..." is 3 chars

    // Find the last space before targetLength
    truncated = content.substring(0, targetLength)
    lastSpace = truncated.lastIndexOf(' ')

    if lastSpace > 0:
        // Truncate at word boundary
        truncated = truncated.substring(0, lastSpace)
    // else: no space found, truncate at targetLength (rare for normal text)

    // Remove trailing punctuation before ellipsis
    truncated = truncated.replace(/[,;:\s]+$/, '')

    return truncated + "..."
```

**Examples:**

| Input | max-length | Output |
|-------|------------|--------|
| "This is a very long title that needs truncation" | 30 | "This is a very long title..." |
| "Short" | 30 | "Short" (no truncation) |
| "Exactly thirty characters here" | 30 | "Exactly thirty characters..." |
| "OneVeryLongWordWithNoSpaces" | 20 | "OneVeryLongWordW..." |

**Truncation Warning Pattern:**
```
When content is truncated, log a warning:
"⚠️ Field '{fieldName}' truncated: {originalLength} → {newLength} characters"
```

---

### Algorithm 3: Content Replacement

<critical id="content-replacement">
When replacing content in HTML, ONLY the innerHTML is modified.
The element's attributes (contenteditable, data-field, class, etc.) must NEVER be changed.
</critical>

**Replacement Logic (Pseudocode):**
```
function replaceContent(htmlContent, fieldName, newContent, constraints):
    // Get constraint for this field
    constraint = constraints[fieldName]

    // Apply truncation if needed
    if constraint['max-length'] and newContent.length > constraint['max-length']:
        newContent = truncateAtWordBoundary(newContent, constraint['max-length'])
        log("⚠️ Field '{fieldName}' truncated")

    // Apply format handlers
    if constraint['format']:
        newContent = applyFormat(newContent, constraint['format'])

    // Find element by data-field attribute
    // Pattern: data-field="{fieldName}">{old content}</
    regex = new RegExp(
        `(data-field="${fieldName}"[^>]*>)([\\s\\S]*?)(</[^>]+>)`,
        'i'
    )

    // Replace innerHTML only, preserving opening and closing tags
    htmlContent = htmlContent.replace(regex, `$1${newContent}$3`)

    return htmlContent
```

**Critical Preservation Rules:**
1. `contenteditable="true"` - MUST remain unchanged
2. `data-field="..."` - MUST remain unchanged
3. `class="..."` - MUST remain unchanged
4. `data-animatable="true"` - MUST remain unchanged
5. Element type (h1, p, div, etc.) - MUST remain unchanged

**Example:**

Before:
```html
<!-- slide-field: title, max-length=60, type=headline, required=true -->
<h1 class="title" contenteditable="true" data-field="title">Company Name</h1>
```

After replacing with "Acme Corporation Partnership":
```html
<!-- slide-field: title, max-length=60, type=headline, required=true -->
<h1 class="title" contenteditable="true" data-field="title">Acme Corporation Partnership</h1>
```

---

### Algorithm 4: Format Handlers

<critical id="format-handlers">
Format handlers transform raw content into properly formatted display text.
</critical>

**Currency Format Handler:**
```
function formatCurrency(value):
    // Handle string input (extract numeric portion)
    numeric = parseFloat(value.replace(/[^0-9.-]/g, ''))

    if numeric >= 1000000000:
        return "$" + (numeric / 1000000000).toFixed(1) + "B"
    if numeric >= 1000000:
        return "$" + (numeric / 1000000).toFixed(1) + "M"
    if numeric >= 1000:
        return "$" + (numeric / 1000).toFixed(0) + "K"
    return "$" + numeric.toLocaleString()

Examples:
  1200000 → "$1.2M"
  500000 → "$500K"
  2500000000 → "$2.5B"
  999 → "$999"
```

**Percentage Format Handler:**
```
function formatPercentage(value):
    numeric = parseFloat(value)
    return numeric.toFixed(0) + "%"

Examples:
  87.5 → "88%"
  100 → "100%"
  3.14159 → "3%"
```

**Date Format Handler:**
```
function formatDate(value):
    // Parse ISO date or date string
    date = new Date(value)

    // Format as "Month YYYY"
    months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
    return months[date.getMonth()] + " " + date.getFullYear()

Examples:
  "2026-02-15" → "February 2026"
  "2026-12-01T00:00:00Z" → "December 2026"
```

**Apply Format Function:**
```
function applyFormat(content, formatType):
    switch formatType:
        case "currency": return formatCurrency(content)
        case "percentage": return formatPercentage(content)
        case "date": return formatDate(content)
        default: return content
```

---

### Algorithm 5: Constraint Validation

<critical id="validation">
Validation ensures all required fields are populated and content meets constraints.
</critical>

**Validation Logic (Pseudocode):**
```
function validateSlideContent(constraints, fieldContents):
    issues = []

    for fieldName, constraint in constraints:
        content = fieldContents[fieldName]

        // Check required fields
        if constraint['required'] == true:
            if content is empty or content == placeholder:
                issues.push({
                    field: fieldName,
                    issue: "required_empty",
                    message: "Required field '{fieldName}' is empty"
                })

        // Check min-length
        if constraint['min-length']:
            if content.length < constraint['min-length']:
                issues.push({
                    field: fieldName,
                    issue: "too_short",
                    message: "Field '{fieldName}' is too short ({content.length} < {min-length})"
                })

        // Note: max-length is handled by truncation, not validation

    return {
        valid: issues.length == 0,
        issues: issues
    }
```

**Validation Output Format:**
```
If validation fails:
"❌ **Validation Issues:**
- Field 'title': Required field is empty
- Field 'description': Too short (5 < 10 characters)"

If validation passes:
"✅ All constraints satisfied"
```

---

### Algorithm 6: Content Sourcing Pipeline

<critical id="content-sourcing">
Content sourcing executes data-gathering operations defined in template-config.yaml's content_sources array.
Each source type has a dedicated executor. Sources execute sequentially with fallback support.
</critical>

**Content Source Schema (from template-config.yaml):**
```yaml
content_sources:
  - type: web_search | file | mcp_tool | user_input
    query: "{{template_var}} search query"  # for web_search
    path: "content/{{template_var}}.md"     # for file
    tool: "mcp__server__tool_name"          # for mcp_tool
    params: {key: value}                    # for mcp_tool
    field: "field-name"                     # target field for result
    prompt: "Question to ask user"          # for user_input
    extract: ["field1", "field2"]           # fields to extract from results
    fallback: "user_input"                  # fallback strategy on failure
```

---

#### Algorithm 6A: Web Search Executor

<critical id="web-search-executor">
Executes web searches with template variable resolution and result extraction.
</critical>

**Web Search Logic (Pseudocode):**
```
function executeWebSearch(source, template_context, cache):
    // 1. Resolve template variables in query
    query = source.query
    for each var in template_context:
        query = query.replace("{{" + var.name + "}}", var.value)

    // 2. Check cache to avoid duplicate searches
    cacheKey = "web_search:" + query
    if cache.has(cacheKey):
        log("📋 Using cached results for: " + query)
        return cache.get(cacheKey)

    // 3. Execute WebSearch tool
    log("🔍 Searching: " + query)
    results = WebSearch(query)

    // 4. Check for failure (no results)
    if results is empty or results.error:
        return {
            success: false,
            error: "No results found for query: " + query,
            source_type: "web_search"
        }

    // 5. Extract specified fields from results
    extracted = {}
    if source.extract:
        for each fieldName in source.extract:
            // Extract relevant content from search results
            // Agent analyzes results and extracts matching content
            extracted[fieldName] = extractFromResults(results, fieldName)
    else:
        // No specific extraction, return summary
        extracted[source.field] = summarizeResults(results)

    // 6. Cache results
    cache.set(cacheKey, extracted)

    return {
        success: true,
        data: extracted,
        source_type: "web_search"
    }

function extractFromResults(results, fieldName):
    // Agent intelligence: analyze search results and extract content
    // matching the semantic meaning of fieldName
    // Examples:
    //   fieldName="description" → extract company/product description
    //   fieldName="revenue" → extract revenue figures
    //   fieldName="employees" → extract employee count
    return agentExtract(results, fieldName)

function summarizeResults(results):
    // Create a concise summary of search results
    // Suitable for populating a single field
    return agentSummarize(results)
```

**Example:**
```yaml
# template-config.yaml
content_sources:
  - type: web_search
    query: "{{client_name}} company overview {{client_industry}}"
    field: company-description
    extract: ["description", "revenue", "employees"]
    fallback: user_input

# With template_context = {client_name: "Acme Corp", client_industry: "technology"}
# Resolved query: "Acme Corp company overview technology"
```

---

#### Algorithm 6B: File Executor

<critical id="file-executor">
Reads local files with template variable resolution in paths.
</critical>

**File Read Logic (Pseudocode):**
```
function executeFileRead(source, template_context):
    // 1. Resolve template variables in path
    path = source.path
    for each var in template_context:
        path = path.replace("{{" + var.name + "}}", var.value)

    // 2. Resolve relative path to absolute
    if not path.startsWith("/"):
        path = projectRoot + "/" + path

    // 3. Check if file exists and read
    log("📄 Reading file: " + path)
    try:
        content = Read(path)
    catch FileNotFoundError:
        return {
            success: false,
            error: "File not found: " + path,
            source_type: "file"
        }

    // 4. Extract content based on configuration
    extracted = {}
    if source.extract:
        // Extract specific sections/patterns from file
        for each fieldName in source.extract:
            extracted[fieldName] = extractFromFile(content, fieldName)
    else:
        // Return full content for the target field
        extracted[source.field] = content

    return {
        success: true,
        data: extracted,
        source_type: "file"
    }

function extractFromFile(content, fieldName):
    // Agent intelligence: extract relevant section from file content
    // Could match headers, patterns, or semantic content
    return agentExtractFromFile(content, fieldName)
```

**Example:**
```yaml
# template-config.yaml
content_sources:
  - type: file
    path: "content/industry-pain-points/{{client_industry}}.md"
    field: pain-points
    fallback: user_input

# With template_context = {client_industry: "healthcare"}
# Resolved path: "content/industry-pain-points/healthcare.md"
```

---

#### Algorithm 6C: MCP Tool Executor

<critical id="mcp-tool-executor">
Invokes MCP tools via ToolSearch for deferred tool loading.
</critical>

**MCP Tool Logic (Pseudocode):**
```
function executeMcpTool(source, template_context):
    toolName = source.tool

    // 1. Load deferred tool via ToolSearch
    log("🔧 Loading MCP tool: " + toolName)
    ToolSearch("select:" + toolName)

    // 2. Resolve template variables in params
    params = {}
    for each key, value in source.params:
        resolvedValue = value
        for each var in template_context:
            resolvedValue = resolvedValue.replace("{{" + var.name + "}}", var.value)
        params[key] = resolvedValue

    // 3. Invoke the MCP tool
    log("⚡ Invoking: " + toolName)
    try:
        result = invokeMcpTool(toolName, params)
    catch ToolError as e:
        return {
            success: false,
            error: "MCP tool failed: " + e.message,
            source_type: "mcp_tool"
        }

    // 4. Extract from result
    extracted = {}
    if source.extract:
        for each fieldName in source.extract:
            extracted[fieldName] = extractFromMcpResult(result, fieldName)
    else:
        extracted[source.field] = result

    return {
        success: true,
        data: extracted,
        source_type: "mcp_tool"
    }
```

**Example:**
```yaml
# template-config.yaml
content_sources:
  - type: mcp_tool
    tool: mcp__pdf-reader__read_pdf
    params:
      file_path: "{{brand_guidelines_path}}"
      include_images: false
    field: brand-guidelines
    extract: ["colors", "typography"]
```

---

#### Algorithm 6D: User Input Executor

<critical id="user-input-executor">
Prompts user for content using the `<ask>` DSL pattern with choice-mode.
Context is displayed as plain text, then choices are presented.
</critical>

**User Input Logic (Pseudocode):**
```
function executeUserInput(source, template_context):
    // 1. Resolve template variables in prompt
    prompt = source.prompt
    for each var in template_context:
        prompt = prompt.replace("{{" + var.name + "}}", var.value)

    // 2. Use <ask> DSL with context attribute
    // The context is output as plain text (visible on all terminals)
    // then AskUserQuestion is called with minimal question
    response = executeAskDsl({
        context: "**Content Needed: " + source.field + "**\n\n" + prompt,
        header: truncate(source.field, 12),  // max 12 chars
        choices: [
            {label: "Type below", description: "Enter your content in the Other field"},
            {label: "Skip", description: "Leave this field empty for now"}
        ],
        multiSelect: false
    })

    // 3. Process response
    if response == "Skip" or response is empty:
        return {
            success: false,
            error: "User skipped input for: " + source.field,
            source_type: "user_input",
            skipped: true
        }

    // 4. Return user-provided content
    extracted = {}
    extracted[source.field] = response

    return {
        success: true,
        data: extracted,
        source_type: "user_input"
    }
```

**Ask DSL Pattern:**
```xml
<ask context="**Content Needed: {{source.field}}**

{{source.prompt}}"
     header="{{field}}">
  <choice label="Type below" description="Enter content in Other field" />
  <choice label="Skip" description="Leave empty for now" />
</ask>
```

**Example:**
```yaml
# template-config.yaml
content_sources:
  - type: user_input
    field: company-tagline
    prompt: "What is {{client_name}}'s company tagline or slogan?"
```

---

#### Algorithm 6E: Fallback Chain Logic

<critical id="fallback-chain">
When a primary source fails, execute the fallback strategy.
</critical>

**Fallback Logic (Pseudocode):**
```
function executeWithFallback(source, template_context, cache):
    // 1. Execute primary source
    result = executeSource(source, template_context, cache)

    // 2. Check for success
    if result.success:
        return result

    // 3. Check if fallback is defined
    if not source.fallback:
        log("⚠️ Source failed with no fallback: " + source.type)
        return result  // Return failure

    // 4. Log fallback activation
    log("⚠️ " + source.type + " failed, using fallback: " + source.fallback)

    // 5. Create fallback source configuration
    fallbackSource = createFallbackSource(source)

    // 6. Execute fallback
    fallbackResult = executeSource(fallbackSource, template_context, cache)

    // 7. Mark result as from fallback
    fallbackResult.usedFallback = true
    fallbackResult.originalSource = source.type
    fallbackResult.originalError = result.error

    return fallbackResult

function createFallbackSource(originalSource):
    // Default fallback is user_input
    if originalSource.fallback == "user_input":
        return {
            type: "user_input",
            field: originalSource.field,
            prompt: "Please provide content for '" + originalSource.field + "'. " +
                   "(Original " + originalSource.type + " source failed)"
        }

    // Custom fallback source (another type)
    // Parse fallback string as source type or full config
    return parseFallbackConfig(originalSource.fallback)
```

**Fallback Logging Pattern:**
```
⚠️ web_search failed: No results found for "Acme Corp overview"
⚠️ Using fallback: user_input
📝 Please provide content manually...
```

---

#### Algorithm 6F: Source Sequencing and Caching

<critical id="source-sequencing">
Execute multiple content sources in sequence, merging results.
Cache web search results to avoid duplicate API calls.
</critical>

**Source Sequencing Logic (Pseudocode):**
```
function executeContentSources(slide, template_context):
    // Initialize cache for this slide (web search results)
    cache = new Map()

    // Initialize field contents accumulator
    fieldContents = {}

    // Get content sources for this slide
    sources = slide.content_sources || []

    if sources.length == 0:
        log("ℹ️ No content_sources defined for slide " + slide.number)
        return fieldContents

    log("📥 Processing " + sources.length + " content source(s) for slide " + slide.number)

    // Execute each source in sequence
    for each source in sources:
        log("▶️ Executing " + source.type + " source for field: " + source.field)

        // Execute with fallback support
        result = executeWithFallback(source, template_context, cache)

        // Merge successful results into fieldContents
        if result.success:
            for each fieldName, content in result.data:
                fieldContents[fieldName] = content
                log("✅ Populated field: " + fieldName)
        else:
            log("⚠️ Source failed: " + result.error)
            // Field remains unpopulated - will be caught by validation

        // Log fallback usage
        if result.usedFallback:
            log("↩️ Used fallback for " + source.field + " (original: " + result.originalSource + ")")

    // Report sourcing summary
    populatedCount = Object.keys(fieldContents).length
    log("📊 Content sourcing complete: " + populatedCount + " field(s) populated")

    return fieldContents

function executeSource(source, template_context, cache):
    // Route to appropriate executor based on type
    switch source.type:
        case "web_search":
            return executeWebSearch(source, template_context, cache)
        case "file":
            return executeFileRead(source, template_context)
        case "mcp_tool":
            return executeMcpTool(source, template_context)
        case "user_input":
            return executeUserInput(source, template_context)
        default:
            return {
                success: false,
                error: "Unknown source type: " + source.type
            }
```

**Cache Key Pattern:**
```
Cache keys use format: "{source_type}:{resolved_query_or_path}"
Examples:
  - "web_search:Acme Corp company overview technology"
  - "file:/path/to/content/healthcare.md"
```

**Progress Output Pattern:**
```
📥 Processing 3 content source(s) for slide 3
▶️ Executing web_search source for field: company-description
🔍 Searching: Acme Corp company overview technology
✅ Populated field: company-description
✅ Populated field: revenue
✅ Populated field: employees
▶️ Executing file source for field: pain-points
📄 Reading file: content/industry-pain-points/technology.md
✅ Populated field: pain-points
▶️ Executing user_input source for field: custom-value
📝 Prompting user...
✅ Populated field: custom-value
📊 Content sourcing complete: 5 field(s) populated
```

---

## Workflow Steps

<step n="1" goal="Load deck template manifest and select template">
  <action>Read deck-templates.json from {{deck_templates_manifest}}</action>
  <action>Parse template argument from user input (the argument passed to /sb:use-template)</action>

  <action>Match template using this priority order:
    1. **Exact ID match**: Compare argument against template.id in manifest
    2. **Use cases match**: Compare argument against each template.use_cases array entries
    3. **Fuzzy match**: Try partial string matching on template.name and description
  </action>

  <check if="no matching template found">
    <output>❌ **Template not found: "{{template_argument}}"**

Available deck templates:
{{for each template in manifest.templates}}
  - **{{template.id}}** - {{template.name}} ({{template.slide_count}} slides)
    {{template.description}}
    Keywords: {{template.use_cases.join(", ")}}
{{end for}}

Try again with one of the template IDs listed above.</output>
    <action>HALT</action>
  </check>

  <check if="multiple matches found">
    <output>Multiple templates match "{{template_argument}}":
{{list_matching_templates_with_numbers}}</output>
    <ask>Which template would you like to use?</ask>
  </check>

  <action>Load template-config.yaml from: {{deck_templates_folder}}/{{matched_template.folder}}/template-config.yaml</action>
  <output>✅ Template matched: **{{matched_template.name}}** ({{matched_template.slide_count}} slides)
{{matched_template.description}}</output>
</step>

<step n="2" goal="Collect required context from user">
  <action>Parse required_context array from template-config.yaml</action>
  <action>Initialize {{template_context}} = empty object</action>

  <iterate for="ctx_var in required_context">
    <ask context="**Required: {{ctx_var.name}}**

{{ctx_var.description}}
{{ctx_var.prompt}}"
         header="{{ctx_var.name | truncate(12)}}">
      <choice label="Type below" description="Enter your value in the Other field" />
    </ask>
    <action>Store response in {{template_context}}[{{ctx_var.name}}]</action>
  </iterate>

  <action>Parse optional_context array from template-config.yaml</action>

  <iterate for="opt_var in optional_context">
    <action>Resolve default value:
      - "{{today}}" → current date (YYYY-MM-DD)
      - "{{user_name}}" → user's name from status/config
      - Other → use literal value
    </action>
    <action>Store default in {{template_context}}[{{opt_var.name}}]</action>
  </iterate>

  <output>📋 **Context collected:**
{{for each key, value in template_context}}
  - **{{key}}**: {{value}}
{{end for}}</output>
</step>

<step n="3" goal="Create output folder and initialize deck">
  <action>Generate deck slug from template context:
    - Combine template ID + primary context values + date
    - Example: "client-pitch" + "acme" → "acme-pitch-2026-02"
    - Use kebab-case, lowercase, no special characters
  </action>

  <action>Create output folder structure:
    ```
    mkdir -p {{output_folder}}/{{deck_slug}}/slides/
    ```
  </action>

  <action>Create plan.yaml for the deck in {{output_folder}}/{{deck_slug}}/plan.yaml:
    ```yaml
    deck_name: "{{matched_template.name}} - {{primary_context}}"
    created_at: "{{current_iso_timestamp}}"
    source_template: "{{matched_template.id}}"
    total_slides: {{matched_template.slide_count}}
    slides:
      {{for each slide in template_config.slides}}
      - number: {{slide.number}}
        title: "{{slide.name}}"
        status: pending
      {{end for}}
    ```
  </action>

  <action>Register deck in status.yaml decks: section:
    ```yaml
    decks:
      {{deck_slug}}:
        name: "{{deck_name}}"
        status: building
        total_slides: {{matched_template.slide_count}}
        built_count: 0
        current_slide: 0
        output_folder: "output/{{deck_slug}}"
        source_template: "{{matched_template.id}}"
        created_at: "{{current_iso_timestamp}}"
        last_modified: "{{current_iso_timestamp}}"
        last_action: "Deck template instantiation started from {{matched_template.id}}"
    ```
  </action>

  <action>Set mode to "deck" in status.yaml if not already set</action>

  <action>Add to status.yaml history array:
    ```yaml
    - action: "Started deck template instantiation: {{matched_template.name}} → {{deck_slug}}"
      timestamp: "{{current_iso_timestamp}}"
    ```
  </action>

  <output>📂 Output folder created: {{output_folder}}/{{deck_slug}}/
🔧 Deck registered in status.yaml with source_template: {{matched_template.id}}</output>
</step>

<step n="4" goal="Process each slide in template">
  <iterate for="slide in template.slides">
    <substep n="4.1" goal="Copy slide HTML to output">
      <action>Read slide HTML from template: {{template_folder}}/{{slide.file}}</action>
      <action>Copy to output: {{output_folder}}/{{deck_slug}}/slides/slide-{{slide.number}}.html</action>
    </substep>

    <substep n="4.2" goal="Parse constraint comments">
      <action>Apply parseConstraints() algorithm to slide HTML</action>
      <action>Store constraints in {{slide_constraints}}</action>
      <output>📋 Slide {{slide.number}} constraints:
      {{constraint_summary}}
      </output>
    </substep>

    <substep n="4.3" goal="Gather content for fields">
      <critical>Apply Algorithm 6 (Content Sourcing Pipeline) to populate field values</critical>

      <action>Initialize {{content_cache}} = empty Map for caching web search results</action>
      <action>Initialize {{field_contents}} = empty object to accumulate populated fields</action>

      <action>Get content_sources array from slide configuration in template-config.yaml</action>

      <check if="content_sources is empty or undefined">
        <action>Log: "ℹ️ No content_sources defined for slide {{slide.number}}"</action>
        <action>Skip to field generation from template instructions</action>
      </check>

      <action>Log: "📥 Processing {{sources.length}} content source(s) for slide {{slide.number}}"</action>

      <iterate for="source in content_sources">
        <action>Log: "▶️ Executing {{source.type}} source for field: {{source.field}}"</action>

        <check if="source.type == 'web_search'">
          <action>Apply Algorithm 6A: Web Search Executor
            1. Resolve {{template_context}} variables in source.query
            2. Check {{content_cache}} for existing results with same query
            3. If cached → use cached results, log "📋 Using cached results"
            4. If not cached → execute WebSearch tool with resolved query
            5. If no results → mark as failed, check for fallback
            6. If results → extract fields per source.extract array (or summarize if no extract)
            7. Cache results in {{content_cache}}
            8. Merge extracted data into {{field_contents}}
          </action>
        </check>

        <check if="source.type == 'file'">
          <action>Apply Algorithm 6B: File Executor
            1. Resolve {{template_context}} variables in source.path
            2. Convert relative path to absolute (prepend project root if needed)
            3. Attempt to read file using Read tool
            4. If file not found → mark as failed, check for fallback
            5. If file found → extract content per source.extract or use full content
            6. Merge extracted data into {{field_contents}}
          </action>
        </check>

        <check if="source.type == 'mcp_tool'">
          <action>Apply Algorithm 6C: MCP Tool Executor
            1. Use ToolSearch to load deferred tool: "select:{{source.tool}}"
            2. Resolve {{template_context}} variables in source.params
            3. Invoke MCP tool with resolved parameters
            4. If tool fails → mark as failed, check for fallback
            5. If tool succeeds → extract fields per source.extract or use full result
            6. Merge extracted data into {{field_contents}}
          </action>
        </check>

        <check if="source.type == 'user_input'">
          <action>Apply Algorithm 6D: User Input Executor (using ask DSL)
            1. Resolve {{template_context}} variables in source.prompt
            2. Present user input prompt using ask DSL:
               <ask context="**Content Needed: {{source.field}}**

{{resolved_prompt}}"
                    header="{{source.field}}">
                 <choice label="Type below" description="Enter content in Other field" />
                 <choice label="Skip" description="Leave empty for now" />
               </ask>
            3. If user selects "Skip" → mark as failed/skipped
            4. If user provides content (via Other) → capture response
            5. Store response in {{field_contents}}[{{source.field}}]
          </action>
        </check>

        <check if="source execution failed AND source.fallback is defined">
          <action>Apply Algorithm 6E: Fallback Chain
            1. Log: "⚠️ {{source.type}} failed, using fallback: {{source.fallback}}"
            2. Create fallback source configuration:
               - If fallback == "user_input" → prompt user for {{source.field}}
               - If fallback is custom → parse as source config
            3. Execute fallback source using appropriate algorithm
            4. Mark result as usedFallback=true
            5. Merge fallback results into {{field_contents}}
          </action>
        </check>

        <check if="source execution succeeded">
          <action>Log: "✅ Populated field: {{source.field}}"</action>
        </check>

        <check if="source execution failed with no fallback">
          <action>Log: "⚠️ Source failed: {{error_message}}"</action>
          <action>Field remains unpopulated (will be caught by validation in 4.5)</action>
        </check>
      </iterate>

      <action>Log: "📊 Content sourcing complete: {{populatedCount}} field(s) populated"</action>

      <action>For fields in {{slide_constraints}} NOT in {{field_contents}}:
        - Generate content based on slide.instructions from template-config.yaml
        - Use {{template_context}} values and agent intelligence
        - Add generated content to {{field_contents}}
      </action>
    </substep>

    <substep n="4.4" goal="Replace content respecting constraints">
      <iterate for="fieldName in slide_constraints">
        <action>Get content for fieldName from {{field_contents}} or generate based on instructions</action>
        <action>Apply replaceContent() algorithm:
          - Truncate at word boundary if exceeds max-length
          - Apply format handler if format specified
          - Preserve all HTML attributes
        </action>
        <check if="content was truncated">
          <output>⚠️ Field '{{fieldName}}' truncated: {{original_length}} → {{new_length}} characters</output>
        </check>
      </iterate>
    </substep>

    <substep n="4.5" goal="Validate slide content">
      <action>Apply validateSlideContent() algorithm</action>
      <check if="validation.issues not empty">
        <output>❌ **Validation Issues for Slide {{slide.number}}:**
        {{validation_issues_list}}
        </output>
        <ask>How should I resolve these issues?
        [1] Provide content manually
        [2] Skip and mark incomplete
        [3] Use placeholder text
        </ask>
      </check>
    </substep>

    <substep n="4.6" goal="Save slide and report progress">
      <action>Write updated HTML to {{output_folder}}/{{deck_slug}}/slides/slide-{{slide.number}}.html</action>

      <action>Update status.yaml deck entry:
        - Increment built_count
        - Set current_slide to {{slide.number}}
        - Update last_modified timestamp
        - Set last_action to "Built slide {{slide.number}}: {{slide.name}}"
      </action>

      <action>Update plan.yaml slide status to "built" for slide {{slide.number}}</action>

      <output>✅ Slide {{slide.number}}/{{total_slides}}: {{slide.name}} - Complete</output>
    </substep>
  </iterate>
</step>

<step n="5" goal="Generate manifest, viewer, and finalize status">
  <action>Run regenerate-viewer.js to generate manifest.json and index.html:
    ```
    node scripts/regenerate-viewer.js {{deck_slug}}
    ```
    This script:
    - Discovers slide HTML files in output/{{deck_slug}}/slides/
    - Extracts titles from h1 tags
    - Generates manifest.json with slide metadata
    - Writes index.html for browser viewing
  </action>

  <check if="regenerate-viewer.js fails">
    <output>⚠️ Viewer generation failed. Slides are saved but index.html was not created.
You can retry with: `node scripts/regenerate-viewer.js {{deck_slug}}`</output>
  </check>

  <action>Update status.yaml deck entry to completion:
    ```yaml
    decks:
      {{deck_slug}}:
        status: complete
        built_count: {{total_slides}}
        current_slide: {{total_slides}}
        last_modified: "{{current_iso_timestamp}}"
        last_action: "Deck template instantiation complete - all {{total_slides}} slides built"
    ```
  </action>

  <action>Add to status.yaml history:
    ```yaml
    - action: "Completed deck template: {{deck_name}} ({{total_slides}} slides from {{matched_template.id}})"
      timestamp: "{{current_iso_timestamp}}"
    ```
  </action>

  <output>🎉 **Deck template instantiated successfully!**

📂 **Location:** {{output_folder}}/{{deck_slug}}/
📊 **Slides:** {{total_slides}}
🎨 **Template:** {{matched_template.name}} ({{matched_template.id}})
🌐 **Preview:** Open `{{output_folder}}/{{deck_slug}}/index.html` in browser

**Status tracking:**
- Deck registered in `.slide-builder/status.yaml` under `decks.{{deck_slug}}`
- Source template: {{matched_template.id}}
- Status: complete
  </output>
</step>

---

## Testing Checklist

<testing>
Manual validation with sample templates:

**Constraint Parsing (Story 1.2 - AC #1):**
- [ ] Parse slide-1.html → extract 4 constraints (title, subtitle, presenter, date)
- [ ] Parse slide-2.html → extract 7 constraints (section-title, 3x headlines, 3x descriptions)
- [ ] Verify all attributes extracted correctly (max-length, type, required, format)

**Truncation (Story 1.2 - AC #2):**
- [ ] Test 80-char string with max-length=60 → truncated at word boundary ~55-60 chars
- [ ] Verify ellipsis added only when truncation occurs
- [ ] Test edge case: content exactly at max-length → no truncation

**Attribute Preservation (Story 1.2 - AC #3):**
- [ ] Replace content in slide-1.html → verify contenteditable="true" unchanged
- [ ] Verify data-field attributes unchanged
- [ ] Verify class attributes unchanged

**Required Field Validation (Story 1.2 - AC #4):**
- [ ] Pass empty string for required=true field → flagged as incomplete
- [ ] Pass valid content for required=true field → passes validation

**Format Handlers (Story 1.2 - AC #5):**
- [ ] Test format=currency: 1200000 → "$1.2M"
- [ ] Test format=percentage: 87.5 → "88%"
- [ ] Test format=date: "2026-02-15" → "February 2026"

---

**Web Search Source (Story 1.3 - AC #1):**
- [ ] Define content_source with type=web_search and query "{{client_name}} overview"
- [ ] Verify template variables resolved before search (e.g., "Acme Corp overview")
- [ ] Verify WebSearch tool is invoked with resolved query
- [ ] Verify results extracted to specified fields (extract array)
- [ ] Verify search results cached (second identical query uses cache)

**File Source (Story 1.3 - AC #2):**
- [ ] Define content_source with type=file and path "content/{{client_industry}}.md"
- [ ] Verify template variables resolved in path
- [ ] Verify Read tool invoked with correct path
- [ ] Verify content extracted to field_contents
- [ ] Verify file not found triggers fallback (if defined)

**MCP Tool Source (Story 1.3 - AC #3):**
- [ ] Define content_source with type=mcp_tool and tool "mcp__pdf-reader__read_pdf"
- [ ] Verify ToolSearch loads the deferred tool
- [ ] Verify template variables resolved in params
- [ ] Verify MCP tool invoked with resolved parameters
- [ ] Verify result captured in field_contents

**User Input Source (Story 1.3 - AC #4):**
- [ ] Define content_source with type=user_input and prompt "Enter {{field}} value"
- [ ] Verify context text displayed before choices (via `<ask context>` DSL)
- [ ] Verify choices presented via AskUserQuestion (transformed by engine)
- [ ] Verify user response captured in field_contents
- [ ] Verify "Skip" option marks field as unpopulated

**Fallback Chain (Story 1.3 - AC #5):**
- [ ] Define web_search source with fallback="user_input"
- [ ] Simulate search failure (no results)
- [ ] Verify fallback message logged: "⚠️ web_search failed, using fallback: user_input"
- [ ] Verify user_input fallback executes
- [ ] Verify fallback result marked with usedFallback=true

**Multi-Source Sequencing (Story 1.3 - AC #6):**
- [ ] Define slide with 3 content_sources (web_search, file, user_input)
- [ ] Verify sources execute in sequence (not parallel)
- [ ] Verify each source logs progress (▶️ Executing...)
- [ ] Verify all results merged into single field_contents object
- [ ] Verify summary logged: "📊 Content sourcing complete: N field(s) populated"

**Caching (Story 1.3 - Performance):**
- [ ] Execute same web_search query twice in one slide
- [ ] Verify second execution uses cache: "📋 Using cached results"
- [ ] Verify only one actual WebSearch call made
</testing>
