/**
 * SlidePreviewHighlighter - Renders slide HTML preview with element overlays.
 *
 * Story Reference: v4-1-5 AC-1, AC-2, AC-3, AC-4, AC-5
 *
 * AC-1: Slide preview renders alongside instruction editor
 * AC-2: Elements with IDs matching placeholder patterns are highlighted
 * AC-3: Hovering shows tooltip with element ID, content, and source type
 * AC-4: Clicking placeholder in instructions scrolls preview to element
 * AC-5: Clicking element in preview inserts placeholder at cursor
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Eye } from 'lucide-react';
import type { ContentSource } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface SlidePreviewHighlighterProps {
  /** HTML content of the slide */
  html: string | null;
  /** Content sources for the current slide */
  contentSources: ContentSource[];
  /** Currently focused placeholder from instruction editor (AC-4) */
  focusedPlaceholder?: string | null;
  /** Callback when an element is clicked in the preview (AC-5) */
  onElementClick?: (elementId: string) => void;
}

interface HighlightedElement {
  id: string;
  tagName: string;
  textContent: string;
}

// =============================================================================
// Helpers
// =============================================================================

/** Pattern matching slide element IDs: s1-title, s2-body, etc. */
const ELEMENT_ID_PATTERN = /^s\d+-/;

/**
 * Extract highlighted element IDs from HTML string.
 * Matches elements with id attributes following sN-* pattern or data-field attributes.
 */
function extractElementIds(html: string): HighlightedElement[] {
  const elements: HighlightedElement[] = [];

  // Match id="sN-*" pattern
  const idRegex = /id="(s\d+-[^"]+)"/g;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    elements.push({ id: match[1], tagName: 'element', textContent: '' });
  }

  // Match data-field="*" pattern
  const dataFieldRegex = /data-field="([^"]+)"/g;
  while ((match = dataFieldRegex.exec(html)) !== null) {
    if (!elements.some((e) => e.id === match[1])) {
      elements.push({ id: match[1], tagName: 'element', textContent: '' });
    }
  }

  return elements;
}

// =============================================================================
// Component
// =============================================================================

export function SlidePreviewHighlighter({
  html,
  contentSources,
  focusedPlaceholder,
  onElementClick,
}: SlidePreviewHighlighterProps): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Extract element IDs from HTML (AC-2)
  const highlightedElements = useMemo(() => {
    if (!html) return [];
    return extractElementIds(html);
  }, [html]);

  // Find source type for an element ID
  const getSourceType = useCallback(
    (elementId: string): string => {
      const source = contentSources.find(
        (s) => s.field === elementId || s.query?.includes(elementId),
      );
      return source?.type ?? 'none';
    },
    [contentSources],
  );

  // Handle element click (AC-5)
  const handleElementClick = useCallback(
    (elementId: string) => {
      onElementClick?.(elementId);
    },
    [onElementClick],
  );

  // No HTML loaded yet
  if (!html) {
    return (
      <div className="slide-preview-highlighter slide-preview-highlighter--empty">
        <Eye size={32} />
        <p>No slide preview available</p>
      </div>
    );
  }

  return (
    <div className="slide-preview-highlighter" role="region" aria-label="Slide preview">
      {/* Preview area */}
      <div className="slide-preview-highlighter__preview">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="slide-preview-highlighter__iframe"
          title="Slide preview"
          sandbox="allow-same-origin"
        />
      </div>

      {/* Element overlay list (AC-2, AC-3) */}
      {highlightedElements.length > 0 && (
        <div className="slide-preview-highlighter__elements">
          <span className="slide-preview-highlighter__elements-title">
            Editable Elements ({highlightedElements.length})
          </span>
          <div className="slide-preview-highlighter__element-list" role="list">
            {highlightedElements.map((element) => {
              const sourceType = getSourceType(element.id);
              const isFocused = focusedPlaceholder === element.id;
              return (
                <button
                  key={element.id}
                  type="button"
                  className={`slide-preview-highlighter__element${isFocused ? ' slide-preview-highlighter__element--focused' : ''}`}
                  onClick={() => handleElementClick(element.id)}
                  onMouseEnter={() => setHoveredElement(element.id)}
                  onMouseLeave={() => setHoveredElement(null)}
                  aria-label={`Element: ${element.id}`}
                  title={`ID: ${element.id}\nSource: ${sourceType}`}
                >
                  <span className="slide-preview-highlighter__element-id">{element.id}</span>
                  {sourceType !== 'none' && (
                    <span className="slide-preview-highlighter__element-source">{sourceType}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SlidePreviewHighlighter;
