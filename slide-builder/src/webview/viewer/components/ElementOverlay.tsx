import React, { useCallback, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { SelectableElement } from '../context/ViewerContext';

/**
 * Props for ElementOverlay component.
 */
interface ElementOverlayProps {
  /** Element metadata from DOM scan */
  element: SelectableElement;
  /** Whether element is currently selected */
  isSelected: boolean;
  /** Whether element has keyboard focus */
  isFocused: boolean;
  /** Group number if element belongs to a group (1-based) */
  groupNumber?: number;
  /** Click handler */
  onClick: (buildId: string) => void;
  /** Container offset for positioning */
  containerOffset: { left: number; top: number };
  /** v2-4-4: Element's own group color (always present for grouped elements) */
  groupColor?: string | null;
  /** v2-4-4: Hex color when element's group is actively selected in panel (null otherwise) */
  activeGroupColor?: string | null;
  /** v2-4-4: True when a group is selected but this element is NOT in that group */
  isDimmed?: boolean;
}

/**
 * ElementOverlay component — renders selection overlay over a slide element.
 *
 * v2-4-2 AC-3: Click toggles selected/unselected state
 * v2-4-2 AC-5: Grouped elements show numbered badge
 *
 * Visual states:
 * - Unselected: dashed blue border (2px #3a61ff), 10% blue fill
 * - Selected: solid blue border, checkmark icon in corner
 * - Grouped: numbered badge (G1, G2, etc.)
 * - Focused: additional ring outline for keyboard navigation
 */
export function ElementOverlay({
  element,
  isSelected,
  isFocused,
  groupNumber,
  onClick,
  containerOffset,
  groupColor,
  activeGroupColor,
  isDimmed,
}: ElementOverlayProps): React.ReactElement {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus the overlay when it receives keyboard focus
  useEffect(() => {
    if (isFocused && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isFocused]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(element.buildId);
    },
    [element.buildId, onClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(element.buildId);
      }
    },
    [element.buildId, onClick]
  );

  // v2-4-4: Resolve display color — activeGroupColor (selected) > groupColor (default) > CSS default
  const displayColor = activeGroupColor ?? groupColor;

  // Calculate position relative to viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: element.rect.left,
    top: element.rect.top,
    width: element.rect.width,
    height: element.rect.height,
    pointerEvents: 'auto',
    // v2-4-4: Color coding — use group color for borders/background
    ...(displayColor ? {
      borderColor: displayColor,
      backgroundColor: activeGroupColor
        ? `${displayColor}26` // 15% opacity when actively selected
        : `${displayColor}1A`, // 10% opacity for passive group color
    } : {}),
  };

  // Build class names based on state
  const classNames = [
    'element-overlay',
    isSelected && 'element-overlay--selected',
    isFocused && 'element-overlay--focused',
    groupNumber !== undefined && 'element-overlay--grouped',
    activeGroupColor && 'element-overlay--active-group',
    isDimmed && 'element-overlay--dimmed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={overlayRef}
      className={classNames}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isFocused ? 0 : -1}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${element.label}${isSelected ? ' (selected)' : ''}${
        groupNumber !== undefined ? ` in group ${groupNumber}` : ''
      }`}
      data-build-id={element.buildId}
    >
      {/* Selection checkmark */}
      {isSelected && (
        <span className="element-overlay__checkmark" aria-hidden="true">
          <Check size={14} />
        </span>
      )}

      {/* Group badge — v2-4-4: always use group color for badge */}
      {groupNumber !== undefined && (
        <span
          className="element-overlay__badge"
          aria-label={`Group ${groupNumber}`}
          style={displayColor ? { backgroundColor: displayColor } : undefined}
        >
          G{groupNumber}
        </span>
      )}

      {/* Element label tooltip (shown on hover) */}
      <span className="element-overlay__tooltip">{element.label}</span>
    </div>
  );
}
