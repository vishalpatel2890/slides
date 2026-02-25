/**
 * TypeScaleEditor - Renders typographic scale entries with proportionally-sized preview text.
 *
 * Story Reference: bt-3-2 Task 3 -- AC-15, AC-16
 * Each scale entry (hero, h1, h2, body, small) displays:
 * - Label (e.g., "Hero")
 * - Size input (DirtyTextInput)
 * - Preview text rendered at that size with appropriate font (heading/body)
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Heading-level entries (hero, h1, h2, h3) use headingFont
 * - Body-level entries (body, small, caption) use bodyFont
 * - Sizes are directly applied so hero appears largest, descending to small
 */

import React from 'react';
import { DirtyTextInput } from './PropertyInput';

// =============================================================================
// Props
// =============================================================================

export interface TypeScaleEntry {
  /** Scale key (e.g., "hero", "h1", "body") */
  key: string;
  /** Current size value (e.g., "3rem", "48px") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "typography.scale.hero") */
  path: string;
}

export interface TypeScaleEditorProps {
  /** Scale entries to render */
  entries: TypeScaleEntry[];
  /** Heading font family for heading-level entries */
  headingFont: string;
  /** Body font family for body-level entries */
  bodyFont: string;
  /** Called when a scale value changes: (path, newValue) */
  onUpdate: (path: string, value: string) => void;
}

// =============================================================================
// Font Assignment
// =============================================================================

/** Heading-level scale keys use the heading font */
const HEADING_KEYS = new Set(['hero', 'h1', 'h2', 'h3']);

/**
 * Determine which font to use for a scale entry based on its key.
 * Heading-level entries (hero, h1, h2, h3) use headingFont.
 * Body-level entries (body, small, caption, etc.) use bodyFont.
 */
function getFontForEntry(key: string, headingFont: string, bodyFont: string): string {
  return HEADING_KEYS.has(key.toLowerCase()) ? headingFont : bodyFont;
}

// =============================================================================
// Styles
// =============================================================================

const previewStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground, #cccccc)',
  padding: '4px 8px',
  marginTop: '2px',
  borderRadius: '4px',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-panel-border, #333333)',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

const entryContainerStyle: React.CSSProperties = {
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--vscode-panel-border, #222222)',
};

// =============================================================================
// Component
// =============================================================================

const PREVIEW_TEXT = 'The quick brown fox';

export function TypeScaleEditor({
  entries,
  headingFont,
  bodyFont,
  onUpdate,
}: TypeScaleEditorProps): React.JSX.Element {
  return (
    <div data-testid="type-scale-editor">
      {entries.map((entry) => {
        const font = getFontForEntry(entry.key, headingFont, bodyFont);
        const displayLabel = entry.key.charAt(0).toUpperCase() + entry.key.slice(1);

        return (
          <div
            key={entry.key}
            data-testid={`scale-entry-${entry.key}`}
            style={entryContainerStyle}
          >
            {/* Size input */}
            <DirtyTextInput
              label={`${displayLabel} (${entry.value})`}
              value={entry.value}
              path={entry.path}
              onUpdate={onUpdate}
            />

            {/* Proportionally-sized preview text */}
            <div
              data-testid={`scale-preview-${entry.key}`}
              style={{
                ...previewStyle,
                fontSize: entry.value,
                fontFamily: `"${font}", sans-serif`,
              }}
            >
              {PREVIEW_TEXT}
            </div>
          </div>
        );
      })}
    </div>
  );
}
