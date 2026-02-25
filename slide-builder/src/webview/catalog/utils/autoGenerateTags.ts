/**
 * Auto-generate tags from filename and asset type.
 *
 * Story Reference: cv-4-4 AC-30
 *
 * Splits filename on hyphens, underscores, and camelCase boundaries.
 * Adds type-based tags (e.g., "icon", "logo", "image").
 */

/**
 * Generates tags from a filename by splitting on common separators
 * and camelCase boundaries.
 *
 * @param filename - The filename without path (e.g., "company-logo.png")
 * @param assetType - The asset type: 'icon', 'logo', or 'image'
 * @returns Array of suggested tags
 */
export function autoGenerateTags(filename: string, assetType: string): string[] {
  const tags: string[] = [];

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Split on hyphens, underscores, and spaces
  const parts = nameWithoutExt
    .split(/[-_\s]+/)
    .flatMap((part) => {
      // Split camelCase: "companyLogo" -> ["company", "Logo"]
      // But don't split ALL CAPS words: "DARK" stays "DARK"
      // Use lookbehind to split only on lowercase-to-uppercase transitions
      return part.split(/(?<=[a-z])(?=[A-Z])/);
    })
    .map((part) => part.toLowerCase())
    .filter((part) => part.length > 1); // Filter out single characters

  // Add unique parts as tags (exclude common noise words)
  const noiseWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for']);
  for (const part of parts) {
    if (!noiseWords.has(part) && !tags.includes(part)) {
      tags.push(part);
    }
  }

  // Add type-based tag
  if (!tags.includes(assetType)) {
    tags.push(assetType);
  }

  // Limit to 5 most relevant tags
  return tags.slice(0, 5);
}

/**
 * Suggests an asset type based on the source path.
 *
 * @param path - The file path
 * @returns Suggested asset type or undefined if can't determine
 */
export function suggestAssetType(path: string): 'icon' | 'logo' | 'image' | undefined {
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes('icon')) {
    return 'icon';
  }
  if (lowerPath.includes('logo')) {
    return 'logo';
  }
  // Default to image if we can't determine
  return 'image';
}
