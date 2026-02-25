/**
 * Utility functions for generating stable build IDs for animation elements.
 *
 * Build IDs are used to uniquely identify elements across rescans of the DOM.
 * Previously, index-based IDs (e.g., `p-2`) were unstable because DOM order
 * could change between scans. Content-based IDs use a hash of the element's
 * text content, making them stable across rescans.
 */

/**
 * Generate a simple hash from a string.
 * Uses djb2 algorithm for fast, reasonably distributed hashes.
 *
 * @param str - Input string to hash
 * @returns 6-character base36 hash string
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}

/**
 * Generate a stable build ID for an element based on its content.
 *
 * The ID format is `{tag}-{hash}` where:
 * - `tag` is the lowercase tag name (e.g., "p", "h1", "li")
 * - `hash` is a 6-character hash of the element's text content
 *
 * If duplicates exist (same tag + content), a counter suffix is added: `{tag}-{hash}-{n}`
 *
 * @param element - DOM element to generate ID for
 * @param seenIds - Set of already-used IDs (mutated to track new IDs)
 * @returns Stable build ID string
 */
export function generateStableBuildId(
  element: Element,
  seenIds: Set<string>
): string {
  // Preserve existing data-build-id if present (for already-assigned elements)
  const existingId = element.getAttribute('data-build-id');
  if (existingId) {
    seenIds.add(existingId);
    return existingId;
  }

  // Generate content-based ID
  const tag = element.tagName.toLowerCase();
  const text = (element.textContent || '').trim().slice(0, 50);
  const hash = simpleHash(text);
  const baseId = `${tag}-${hash}`;

  // Handle duplicates with counter suffix
  let finalId = baseId;
  let counter = 1;
  while (seenIds.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }
  seenIds.add(finalId);

  return finalId;
}

/**
 * Assign stable build IDs to all selectable elements in a container.
 *
 * This function mirrors the logic used in AnimationBuilder for consistency.
 * It should be called before animation hide/show operations to ensure
 * IDs match what was stored in the manifest.
 *
 * @param container - ShadowRoot or HTMLElement containing slide content
 * @param selector - CSS selector for elements to assign IDs to
 */
export function assignStableBuildIds(
  container: ShadowRoot | HTMLElement,
  selector: string
): void {
  const elements = container.querySelectorAll(selector);
  const seenIds = new Set<string>();

  elements.forEach((el) => {
    const existingId = el.getAttribute('data-build-id');
    if (existingId) {
      // Track existing IDs to avoid collisions
      seenIds.add(existingId);
    } else {
      // Generate and assign new stable ID
      const newId = generateStableBuildId(el, seenIds);
      el.setAttribute('data-build-id', newId);
    }
  });
}
