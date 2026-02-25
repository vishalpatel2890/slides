/**
 * validateFolderName - Validates folder name for rename operations.
 *
 * Story Reference: cv-3-6 AC-5
 *
 * Checks: non-empty, no invalid filesystem characters, no duplicates
 * (case-insensitive), max 255 chars.
 *
 * @returns Error message string if invalid, or null if valid.
 */

const INVALID_CHARS_REGEX = /[/\\:*?"<>|]/;

export function validateFolderName(
  name: string,
  existingNames: string[],
  currentName: string,
): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return 'Folder name cannot be empty';
  }

  if (trimmed.length > 255) {
    return 'Folder name is too long (max 255 characters)';
  }

  if (INVALID_CHARS_REGEX.test(trimmed)) {
    return 'Folder name contains invalid characters: / \\ : * ? " < > |';
  }

  // Allow keeping the same name (no-op rename)
  if (trimmed.toLowerCase() === currentName.toLowerCase()) {
    return null;
  }

  // Check for duplicate names (case-insensitive)
  const isDuplicate = existingNames.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    return 'A folder with this name already exists';
  }

  return null;
}
