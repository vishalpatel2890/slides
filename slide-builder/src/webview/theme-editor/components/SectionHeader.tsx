/**
 * SectionHeader - Reusable collapsible section header component.
 *
 * Story Reference: bt-2-2 Task 2 — AC-5 (Collapsible Sections)
 * Uses simple div with CSS transition for smooth expand/collapse.
 * Renders a chevron icon that rotates on toggle.
 */

import React, { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

// =============================================================================
// Props
// =============================================================================

export interface SectionHeaderProps {
  /** Display title for the section */
  title: string;
  /** Unique section key for state management */
  sectionKey: string;
  /** Whether the section is currently expanded */
  expanded: boolean;
  /** Callback when the section header is clicked */
  onToggle: (sectionKey: string) => void;
  /** Section content (children) */
  children: ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * bt-2-2 Task 2.1-2.5: Collapsible section with header toggle.
 *
 * AC-5: Section collapses or expands with smooth transition on click.
 * Uses CSS transform transition for chevron rotation and max-height transition for content.
 */
export function SectionHeader({
  title,
  sectionKey,
  expanded,
  onToggle,
  children,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="mb-2">
      {/* bt-2-2 Task 2.2: Header with title, sectionKey, expanded, onToggle */}
      <button
        type="button"
        className="flex items-center w-full px-3 py-2 text-left rounded hover:opacity-80 transition-opacity"
        style={{
          background: 'var(--vscode-sideBar-background, #252526)',
          color: 'var(--vscode-editor-foreground, #cccccc)',
          border: '1px solid var(--vscode-panel-border, #333333)',
          cursor: 'pointer',
        }}
        onClick={() => onToggle(sectionKey)}
        aria-expanded={expanded}
        aria-controls={`section-content-${sectionKey}`}
      >
        {/* bt-2-2 Task 2.3: Chevron icon that rotates on expand/collapse */}
        <ChevronDown
          size={16}
          className="mr-2 flex-shrink-0"
          style={{
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
        <span className="font-semibold text-sm">{title}</span>
      </button>

      {/* bt-2-2 Task 2.4-2.5: Content area with CSS transition */}
      <div
        id={`section-content-${sectionKey}`}
        role="region"
        style={{
          overflow: 'hidden',
          maxHeight: expanded ? '5000px' : '0',
          opacity: expanded ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div className="px-3 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}
