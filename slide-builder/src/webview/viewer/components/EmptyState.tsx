import React from 'react';
import type { ViewerWebviewMessage } from '../../../shared/types';

/**
 * Empty state shown when a deck has no built slides (no index.html).
 * Provides a "Build All" CTA that sends a rebuild message to the extension.
 *
 * Story Reference: cv-2-1 Task 5.3, AC-6
 */
interface EmptyStateProps {
  postMessage: (message: ViewerWebviewMessage) => void;
}

export function EmptyState({ postMessage }: EmptyStateProps): React.ReactElement {
  return (
    <div className="viewer-empty-state">
      <div className="viewer-empty-state__icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      </div>
      <p className="viewer-empty-state__title">No built slides yet</p>
      <p className="viewer-empty-state__hint">
        Build your deck first to preview slides here.
      </p>
      <button
        className="viewer-empty-state__cta"
        onClick={() => postMessage({ type: 'rebuild' })}
        type="button"
      >
        Build All
      </button>
    </div>
  );
}
