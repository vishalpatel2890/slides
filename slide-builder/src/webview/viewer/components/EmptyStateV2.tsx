import React from 'react';
import { Presentation, FileEdit } from 'lucide-react';
import type { ViewerV2WebviewMessage } from '../../../shared/types';

/**
 * V2 Empty state shown when a deck has no built slides.
 * v2-1-2 AC-10: Empty state with slide icon, "No slides built yet", and "Open Plan Editor" CTA.
 *
 * Story Reference: v2-1-2 Task 5
 */
interface EmptyStateV2Props {
  /** Function to send messages to extension host */
  postMessage: (message: ViewerV2WebviewMessage) => void;
}

export function EmptyStateV2({ postMessage }: EmptyStateV2Props): React.ReactElement {
  const handleOpenPlanEditor = () => {
    postMessage({ type: 'v2-open-plan-editor' });
  };

  return (
    <div className="viewer-empty-state">
      <div className="viewer-empty-state__icon" aria-hidden="true">
        <Presentation size={48} strokeWidth={1.5} />
      </div>
      <p className="viewer-empty-state__title">No slides built yet</p>
      <p className="viewer-empty-state__hint">
        Open the plan editor to create slides for this deck.
      </p>
      <button
        className="viewer-empty-state__cta"
        onClick={handleOpenPlanEditor}
        type="button"
      >
        <FileEdit size={16} />
        Open Plan Editor
      </button>
    </div>
  );
}
