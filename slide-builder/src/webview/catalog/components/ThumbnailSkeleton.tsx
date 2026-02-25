/**
 * ThumbnailSkeleton - Shimmer placeholder for deck thumbnails.
 *
 * Story Reference: cv-1-4 Task 2 — ThumbnailSkeleton component
 *
 * AC-5: Shimmer animation with 16:9 aspect ratio.
 * AC-8: prefers-reduced-motion disables shimmer.
 */

import React from 'react';

export interface ThumbnailSkeletonProps {
  className?: string;
}

export function ThumbnailSkeleton({ className = '' }: ThumbnailSkeletonProps): React.ReactElement {
  return (
    <div
      className={`thumbnail-skeleton ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
