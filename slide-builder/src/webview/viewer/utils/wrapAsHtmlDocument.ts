/**
 * Wrap an HTML fragment in a proper HTML5 document structure.
 *
 * When saving from Shadow DOM, `shadowRoot.innerHTML` produces a fragment
 * without `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags. This
 * function reconstructs a valid standalone HTML document by:
 *
 * 1. Detecting already-valid documents (starts with `<!DOCTYPE`) — returns as-is
 * 2. Removing `<style data-shadow-animations="">` blocks (runtime artifacts)
 * 3. Extracting head elements (`<meta>`, `<title>`, `<link>`, `<style>`) into `<head>`
 * 4. Wrapping remaining content in `<body>`
 */
export function wrapAsHtmlDocument(html: string): string {
  // Already a valid document — pass through unchanged (idempotent)
  if (/^\s*<!DOCTYPE\s/i.test(html)) {
    return html
  }

  let working = html

  // Strip <style data-shadow-animations="">...</style> blocks (runtime animation artifacts)
  working = working.replace(/<style\s+data-shadow-animations=""[^>]*>[\s\S]*?<\/style>/gi, '')

  // Extract head elements: <meta>, <title>, <link>, <style>
  const headElements: string[] = []

  // Extract <meta ...> (self-closing or void)
  working = working.replace(/<meta\b[^>]*\/?>/gi, (match) => {
    headElements.push(match)
    return ''
  })

  // Extract <title>...</title>
  working = working.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, (match) => {
    headElements.push(match)
    return ''
  })

  // Extract <link ...> (self-closing or void)
  working = working.replace(/<link\b[^>]*\/?>/gi, (match) => {
    headElements.push(match)
    return ''
  })

  // Extract <style>...</style> blocks
  working = working.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (match) => {
    headElements.push(match)
    return ''
  })

  const headContent = headElements.join('\n')
  const bodyContent = working.trim()

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}
</head>
<body>
${bodyContent}
</body>
</html>`
}
