import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Result from the useSlideScale hook.
 */
export interface SlideScaleResult {
  /** Scale factor to apply via CSS transform */
  scale: number;
  /** Whether scale has been calculated from actual container dimensions */
  ready: boolean;
  /** Measured container width in pixels */
  containerWidth: number;
  /** Measured container height in pixels */
  containerHeight: number;
}

/**
 * Hook that calculates scale factor to fit 1920x1080 content within a container.
 * Uses ResizeObserver for responsive scaling when container size changes.
 *
 * @param containerRef - Ref to the container element that bounds the slide
 * @param slideWidth - Original slide width (default 1920)
 * @param slideHeight - Original slide height (default 1080)
 * @returns SlideScaleResult with scale factor and measured container dimensions
 */
export function useSlideScale(
  containerRef: RefObject<HTMLElement>,
  slideWidth = 1920,
  slideHeight = 1080
): SlideScaleResult {
  const [result, setResult] = useState<SlideScaleResult>({
    scale: 1,
    ready: false,
    containerWidth: 0,
    containerHeight: 0,
  });

  // cv-bugfix-thumbnail-rendering AC-2: Track previous ready state for rAF guard
  const prevReadyRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function calculateScale() {
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (containerWidth === 0 || containerHeight === 0) {
        prevReadyRef.current = false;
        setResult((prev) => (prev.ready ? { ...prev, ready: false } : prev));
        return;
      }

      // Calculate scale to fit while maintaining aspect ratio
      const scaleX = containerWidth / slideWidth;
      const scaleY = containerHeight / slideHeight;
      const newScale = Math.min(scaleX, scaleY);

      prevReadyRef.current = true;
      setResult({ scale: newScale, ready: true, containerWidth, containerHeight });
    }

    // Initial calculation
    calculateScale();

    // Use ResizeObserver for responsive updates
    // cv-bugfix-thumbnail-rendering AC-2: Wrap in rAF to ensure DOM measurements
    // happen after layout, preventing stale dimensions during sidebar expand transitions
    const resizeObserver = new ResizeObserver(() => {
      // Cancel any pending rAF to avoid stale calculations
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        calculateScale();
      });
    });

    resizeObserver.observe(container);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [containerRef, slideWidth, slideHeight]);

  return result;
}
