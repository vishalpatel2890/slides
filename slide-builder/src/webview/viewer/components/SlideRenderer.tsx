import React, { useState, useCallback } from 'react';

/**
 * Renders a deck's viewer HTML in a sandboxed iframe.
 * The src points to a patched .vscode-viewer.html file that forces
 * offline/embedded mode for proper rendering in vscode-webview context.
 *
 * Story Reference: cv-2-1 Task 5.2, AC-1, AC-7
 */
interface SlideRendererProps {
  viewerHtmlUri: string;
  deckName: string;
}

export function SlideRenderer({
  viewerHtmlUri,
  deckName,
}: SlideRendererProps): React.ReactElement {
  const [loadError, setLoadError] = useState(false);

  const handleLoadError = useCallback(() => {
    setLoadError(true);
  }, []);

  if (loadError) {
    return (
      <div className="slide-renderer__error">
        <p className="slide-renderer__error-title">Failed to load slide viewer</p>
        <p className="slide-renderer__error-hint">
          Try rebuilding your deck or check the output for errors.
        </p>
      </div>
    );
  }

  return (
    <div className="slide-renderer">
      <iframe
        className="slide-renderer__iframe"
        src={viewerHtmlUri}
        title={`Slides: ${deckName}`}
        onError={handleLoadError}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
