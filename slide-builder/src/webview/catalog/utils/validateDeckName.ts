/**
 * validateDeckSlug - Validates deck directory slug for rename operations.
 * toSlug - Derives a filesystem-safe slug from a display name.
 *
 * Story Reference: rename-deck-2 AC-3
 *
 * Checks: non-empty, no spaces, no invalid filesystem characters, no duplicates
 * (case-insensitive), max 255 chars. Allows keeping the same slug (no-op).
 *
 * @returns Error message string if invalid, or null if valid.
 */

const INVALID_CHARS_REGEX = /[/\\:*?"<>|]/;

/**
 * Derive a filesystem-safe slug from a display name.
 * Lowercase, spaces → hyphens, strip non-alphanumeric (except hyphens).
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateDeckSlug(
  slug: string,
  existingIds: string[],
  currentId: string,
): string | null {
  const trimmed = slug.trim();

  if (trimmed.length === 0) {
    return 'Directory slug cannot be empty';
  }

  if (trimmed.length > 255) {
    return 'Directory slug is too long (max 255 characters)';
  }

  if (INVALID_CHARS_REGEX.test(trimmed)) {
    return 'Directory slug contains invalid characters: / \\ : * ? " < > |';
  }

  if (/\s/.test(trimmed)) {
    return 'Directory slug cannot contain spaces';
  }

  // Allow keeping the same slug (no-op rename)
  if (trimmed.toLowerCase() === currentId.toLowerCase()) {
    return null;
  }

  // Check for duplicate IDs (case-insensitive)
  const isDuplicate = existingIds.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    return 'A deck with this directory name already exists';
  }

  return null;
}
