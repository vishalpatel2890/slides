/**
 * ThumbnailPlaceholder - Fallback placeholder for deck thumbnails when generation fails.
 *
 * Story Reference: cv-5-3 AC-23
 * AC-23: If generation fails, a placeholder with deck initials or slide number is shown
 *        (colored rectangle with #3a61ff background and white text)
 */

import React from 'react';

export interface ThumbnailPlaceholderProps {
  /** Text to display (deck initials or slide number) */
  label: string;
  className?: string;
}

/**
 * Gets initials from a deck name.
 * Takes first letter of first two words.
 */
export function getDeckInitials(deckName: string): string {
  return deckName
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

export function ThumbnailPlaceholder({ label, className = '' }: ThumbnailPlaceholderProps): React.ReactElement {
  return (
    <div
      className={`thumbnail-placeholder ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="thumbnail-placeholder__label">{label}</span>
    </div>
  );
}
