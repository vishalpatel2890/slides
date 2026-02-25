import React from 'react';

/**
 * Wrapper component for fullscreen presentation mode.
 * When mode is 'view' or 'edit', renders a fullscreen overlay with centered slide content.
 * When mode is null, renders children normally (pass-through).
 *
 * v2-2-2 AC-3: In fullscreen, toolbar, sidebar, and status bar are hidden (handled by parent)
 * v2-2-2 AC-4: Slide fills viewport maintaining 16:9 aspect ratio, centered on dark background
 * v3-1-1 AC-1,3: View mode — no editing, presentation-only
 * v3-1-2 AC-6: Edit mode — contenteditable enabled with minimal toolbar
 */

interface FullscreenWrapperProps {
  /** Fullscreen mode: 'view' for presentation, 'edit' for text editing, null for normal */
  mode: 'view' | 'edit' | null;
  /** Content to render (slide display) */
  children: React.ReactNode;
  /** Optional handler for mouse movement (to show/hide controls) */
  onMouseMove?: () => void;
  /** Optional handler for click-to-advance in fullscreen view mode */
  onClick?: () => void;
}

export function FullscreenWrapper({
  mode,
  children,
  onMouseMove,
  onClick,
}: FullscreenWrapperProps): React.ReactElement {
  const isFullscreen = mode !== null;

  function handleClick(e: React.MouseEvent) {
    // Only advance on left-click in fullscreen view mode
    if (mode !== 'view' || e.button !== 0) return;
    // Skip if clicking navigation controls
    const target = e.target as HTMLElement;
    if (target.closest('.fullscreen-controls') || target.closest('.fullscreen-edit-toolbar')) return;
    onClick?.();
  }

  // Always render the same DOM structure to prevent React from remounting children
  // when toggling fullscreen. Use CSS classes to control fullscreen vs. normal display.
  // This ensures Shadow DOM content in SlideDisplay isn't lost on fullscreen toggle.
  return (
    <div
      className={isFullscreen ? `fullscreen-wrapper fullscreen-wrapper--${mode}` : 'fullscreen-wrapper--inactive'}
      onMouseMove={isFullscreen ? onMouseMove : undefined}
      onClick={isFullscreen ? handleClick : undefined}
      role={isFullscreen ? 'presentation' : undefined}
      aria-label={isFullscreen ? `Fullscreen ${mode} mode` : undefined}
    >
      <div className={isFullscreen ? 'fullscreen-wrapper__content' : 'fullscreen-wrapper__content--inactive'}>
        {children}
      </div>
    </div>
  );
}
