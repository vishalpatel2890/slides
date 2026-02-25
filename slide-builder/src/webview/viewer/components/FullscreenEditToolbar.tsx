import React from 'react';
import type { SaveStatus } from '../context/ViewerContext';

/**
 * Minimal toolbar for fullscreen edit mode.
 * Shows save status indicator and ESC exit hint.
 * v3-1-2 AC-1,4: Visible in edit mode, not in view mode.
 */

interface FullscreenEditToolbarProps {
  /** Current save status from ViewerContext */
  saveStatus: SaveStatus;
}

export function FullscreenEditToolbar({
  saveStatus,
}: FullscreenEditToolbarProps): React.ReactElement {
  return (
    <div
      className="fullscreen-edit-toolbar"
      role="toolbar"
      aria-label="Fullscreen edit toolbar"
    >
      <div className="fullscreen-edit-toolbar__status">
        <SaveIndicator saveStatus={saveStatus} />
      </div>
      <div className="fullscreen-edit-toolbar__hint">
        Press <kbd>ESC</kbd> to exit
      </div>
    </div>
  );
}

function SaveIndicator({ saveStatus }: { saveStatus: SaveStatus }): React.ReactElement {
  switch (saveStatus) {
    case 'saving':
      return <span className="fullscreen-edit-toolbar__save fullscreen-edit-toolbar__save--saving" aria-label="Saving changes">Saving…</span>;
    case 'saved':
      return <span className="fullscreen-edit-toolbar__save fullscreen-edit-toolbar__save--saved" aria-label="Changes saved">Saved ✓</span>;
    case 'error':
      return <span className="fullscreen-edit-toolbar__save fullscreen-edit-toolbar__save--error" aria-label="Save failed">Save failed</span>;
    case 'idle':
    default:
      return <span className="fullscreen-edit-toolbar__save fullscreen-edit-toolbar__save--idle" aria-label="Ready to edit">Edit mode</span>;
  }
}
