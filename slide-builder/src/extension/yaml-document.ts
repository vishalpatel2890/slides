/**
 * Comment-preserving YAML Document wrapper.
 *
 * CRITICAL USAGE RULES (ADR-003):
 * - ALWAYS use parseDocument() from 'yaml' library - NEVER use parse()
 * - ALWAYS use doc.toString() for serialization - preserves comments
 * - ALWAYS modify via Document API (setIn, getIn) - NEVER direct object manipulation
 *
 * The yaml library's Document API maintains the AST with source tokens,
 * ensuring comments, formatting, and whitespace are preserved through
 * parse -> modify -> serialize cycles.
 */

import { parseDocument, Document, isSeq } from 'yaml';

export type { Document };

/**
 * Parses YAML text into a Document while preserving comments and formatting.
 *
 * CRITICAL: Always use this function instead of yaml.parse().
 * The keepSourceTokens option preserves the AST for comment retention.
 *
 * @param text - Raw YAML string to parse
 * @returns Document instance for manipulation
 *
 * @example
 * const doc = parseYaml(yamlText);
 * const slides = doc.getIn(['slides']);
 */
export function parseYaml(text: string): Document {
  return parseDocument(text, { keepSourceTokens: true });
}

/**
 * Serializes a Document back to YAML string, preserving comments.
 *
 * CRITICAL: Always use this function instead of yaml.stringify().
 * The Document.toString() method preserves original formatting.
 *
 * @param doc - Document instance to serialize
 * @returns YAML string with comments preserved
 *
 * @example
 * const yamlText = serializeYaml(doc);
 */
export function serializeYaml(doc: Document): string {
  return doc.toString();
}

/**
 * Gets a value at the specified path in the document.
 *
 * @param doc - Document to read from
 * @param path - Array of keys/indices forming the path
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * const title = getField(doc, ['slides', 0, 'title']);
 */
export function getField(doc: Document, path: (string | number)[]): unknown {
  return doc.getIn(path);
}

/**
 * Sets a value at the specified path in the document.
 *
 * CRITICAL: Always use this function for modifications.
 * Direct object manipulation bypasses the AST and loses comments.
 *
 * @param doc - Document to modify
 * @param path - Array of keys/indices forming the path
 * @param value - Value to set at the path
 *
 * @example
 * setField(doc, ['slides', 0, 'title'], 'New Title');
 */
export function setField(doc: Document, path: (string | number)[], value: unknown): void {
  doc.setIn(path, value);
}

/**
 * Checks if the document has a value at the specified path.
 *
 * @param doc - Document to check
 * @param path - Array of keys/indices forming the path
 * @returns true if the path exists and has a value
 */
export function hasField(doc: Document, path: (string | number)[]): boolean {
  return doc.hasIn(path);
}

/**
 * Deletes a value at the specified path in the document.
 *
 * @param doc - Document to modify
 * @param path - Array of keys/indices forming the path
 * @returns true if the item was found and deleted
 */
export function deleteField(doc: Document, path: (string | number)[]): boolean {
  return doc.deleteIn(path);
}

/**
 * Renumbers all slides sequentially starting from 1.
 * Uses Document API setIn for comment preservation.
 *
 * @param doc - Document containing a 'slides' sequence
 */
export function renumberSlides(doc: Document): void {
  const slidesNode = doc.getIn(['slides'], true);
  if (!isSeq(slidesNode)) return;
  for (let i = 0; i < slidesNode.items.length; i++) {
    doc.setIn(['slides', i, 'number'], i + 1);
  }
}

/**
 * Inserts a new slide at the specified index in the slides array.
 * Renumbers all slides after insertion.
 *
 * @param doc - Document containing a 'slides' sequence
 * @param index - 0-based insertion index
 * @param slide - Plain object with slide fields (number will be set by renumber)
 */
export function insertSlide(doc: Document, index: number, slide: Record<string, unknown>): void {
  const slidesNode = doc.getIn(['slides'], true);
  if (!isSeq(slidesNode)) {
    throw new Error('slides field is not a YAML sequence');
  }
  const newNode = doc.createNode(slide);
  slidesNode.items.splice(index, 0, newNode);
  renumberSlides(doc);
}

/**
 * Deletes the slide at the specified index from the slides array.
 * Renumbers remaining slides after deletion.
 *
 * @param doc - Document containing a 'slides' sequence
 * @param index - 0-based index of the slide to delete
 */
export function deleteSlide(doc: Document, index: number): void {
  doc.deleteIn(['slides', index]);
  renumberSlides(doc);
}

/**
 * Moves a slide from one position to another, with an optional section change.
 * Renumbers all slides after the move (AC-21.2.7).
 *
 * Uses Document API array operations to preserve YAML comments (ADR-003).
 * The move is: extract node from fromIndex → delete → splice into adjusted toIndex.
 *
 * @param doc - Document containing a 'slides' sequence
 * @param fromIndex - 0-based index of the slide to move
 * @param toIndex - 0-based target index for the slide
 * @param newSectionId - Optional new agenda_section_id (for cross-section moves)
 *
 * AC-21.2.5: Within-section reorder
 * AC-21.2.6: Cross-section move (updates agenda_section_id)
 * AC-21.2.7: Auto-renumber after reorder
 * AC-21.2.8: Returns serialized YAML for immediate WorkspaceEdit
 */
export function moveSlide(
  doc: Document,
  fromIndex: number,
  toIndex: number,
  newSectionId?: string
): string {
  const slidesNode = doc.getIn(['slides'], true);
  if (!isSeq(slidesNode)) {
    throw new Error('slides field is not a YAML sequence');
  }

  // No-op: same position with no section change
  if (fromIndex === toIndex && !newSectionId) {
    return doc.toString();
  }

  // Extract the slide node from the array
  const slideNode = slidesNode.items[fromIndex];
  if (!slideNode) {
    throw new Error(`No slide at index ${fromIndex}`);
  }

  // Delete from original position
  slidesNode.items.splice(fromIndex, 1);

  // Adjust target index: if moving forward, the deletion shifts indices down
  const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;

  // Insert at target position
  slidesNode.items.splice(adjustedIndex, 0, slideNode);

  // Update agenda_section_id if cross-section move
  if (newSectionId) {
    doc.setIn(['slides', adjustedIndex, 'agenda_section_id'], newSectionId);
  }

  // Renumber all slides sequentially (AC-21.2.7)
  renumberSlides(doc);

  return doc.toString();
}
