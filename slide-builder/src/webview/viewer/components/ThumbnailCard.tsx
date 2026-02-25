import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSlideScale } from '../hooks/useSlideScale';
import { adaptCssForShadowDom } from '../utils/adaptCssForShadowDom';

/**
 * Individual thumbnail card for slide preview.
 * v2-1-4 AC-2: Click to navigate in <50ms
 * v2-1-4 AC-3: Active state with blue border (#3a61ff) and glow
 * v2-1-4 AC-5: Lazy loading via IntersectionObserver
 * v2-1-4 AC-6: Slide number label below thumbnail
 * v2-4-1 AC-1,2: Sortable drag-and-drop via @dnd-kit
 *
 * Architecture Reference: Thumbnail Rendering Pattern from notes/architecture/architecture.md
 */
interface ThumbnailCardProps {
  /** Unique sortable ID (e.g., "slide-1") */
  sortableId: string;
  /** Slide number (1-based) */
  slideNumber: number;
  /** Full HTML content of the slide */
  slideHtml: string;
  /** Whether this thumbnail is for the currently displayed slide */
  isActive: boolean;
  /** Click handler to navigate to this slide */
  onClick: () => void;
  /** Whether drag-and-drop reorder is enabled */
  reorderEnabled?: boolean;
}

export function ThumbnailCard({
  sortableId,
  slideNumber,
  slideHtml,
  isActive,
  onClick,
  reorderEnabled = true,
}: ThumbnailCardProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [hasRendered, setHasRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // cv-bugfix-thumbnail-rendering AC-6: Track container element via state so
  // IntersectionObserver effect re-runs if the element changes (e.g., sidebar toggle re-mount)
  const [containerNode, setContainerNode] = useState<HTMLButtonElement | null>(null);

  // v2-4-1: @dnd-kit sortable integration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: !reorderEnabled,
  });

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Calculate scale based on wrapper dimensions
  const { scale, ready: scaleReady } = useSlideScale(wrapperRef);

  // Check if slideHtml has meaningful content
  const hasContent = slideHtml.trim().length > 0;

  // Only show scaled preview when scale is calculated AND content is rendered
  const showPreview = hasRendered && scaleReady && hasContent;

  // cv-bugfix-thumbnail-rendering AC-4: Track last injected content to avoid unnecessary DOM mutations
  const lastInjectedHtmlRef = useRef<string>('');

  // cv-bugfix-thumbnail-rendering: Inject HTML into Shadow DOM for CSS isolation
  // matching the pattern from SlideDisplay.tsx — ensures :root/:host CSS custom
  // properties and body-level styles render correctly in thumbnails
  const injectHtml = useCallback((html: string) => {
    if (previewRef.current && html !== lastInjectedHtmlRef.current) {
      if (!previewRef.current.shadowRoot) {
        previewRef.current.attachShadow({ mode: 'open' });
      }
      previewRef.current.shadowRoot!.innerHTML = adaptCssForShadowDom(html);
      lastInjectedHtmlRef.current = html;
    }
  }, []);

  // AC-5: Lazy loading via IntersectionObserver — track visibility
  // cv-bugfix-thumbnail-rendering AC-6: Observer depends on containerNode state,
  // so it properly disconnects and reconnects when element changes (e.g., sidebar toggle)
  useEffect(() => {
    if (!containerNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(containerNode);

    return () => observer.disconnect();
  }, [containerNode]);

  // Inject innerHTML only when visible, scale is ready, and content exists
  useEffect(() => {
    if (isVisible && scaleReady && hasContent && previewRef.current && !hasRendered) {
      injectHtml(slideHtml);
      setHasRendered(true);
    }
  }, [isVisible, scaleReady, hasContent, slideHtml, hasRendered, injectHtml]);

  // cv-bugfix-thumbnail-rendering AC-4: Update innerHTML when slide content changes after initial render
  // Uses content tracking to avoid unnecessary DOM mutations
  useEffect(() => {
    if (hasRendered && hasContent) {
      injectHtml(slideHtml);
    }
  }, [slideHtml, hasRendered, hasContent, injectHtml]);

  // Combine refs: sortable setNodeRef + our containerNode state
  // cv-bugfix-thumbnail-rendering AC-6: Using state callback ref ensures
  // IntersectionObserver re-attaches when the DOM element changes
  const combinedRef = useCallback((node: HTMLButtonElement | null) => {
    setNodeRef(node);
    setContainerNode(node);
  }, [setNodeRef]);

  const className = [
    'thumbnail-card',
    isActive ? 'thumbnail-card--active' : '',
    isDragging ? 'thumbnail-card--dragging' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={combinedRef}
      className={className}
      onClick={onClick}
      aria-label={`Go to slide ${slideNumber}`}
      aria-current={isActive ? 'true' : undefined}
      style={sortableStyle}
      {...attributes}
      {...listeners}
    >
      <div ref={wrapperRef} className="thumbnail-card__wrapper">
        <div
          ref={previewRef}
          className={showPreview ? 'thumbnail-card__preview' : 'thumbnail-card__placeholder'}
          style={showPreview ? {
            width: 1920,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          } : undefined}
          aria-hidden="true"
        >
          {/* Show slide number in placeholder when content is empty */}
          {!hasContent && (
            <span className="thumbnail-card__number" style={{ fontSize: 24, opacity: 0.5 }}>
              {slideNumber}
            </span>
          )}
        </div>
      </div>
      {/* AC-6: Slide number label */}
      <span className="thumbnail-card__number">{slideNumber}</span>
    </button>
  );
}
