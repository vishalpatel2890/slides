/**
 * BorderRadiusEditor - Number input with "px" suffix + 40x40px preview box.
 *
 * Story Reference: bt-3-3 Task 1 -- AC-17, AC-18
 * Renders a number input (with "px" suffix) for border radius values and
 * a 40x40px preview box with that borderRadius applied via inline style.
 * Preview box updates on every value change (no debounce).
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Composes DirtyTextInput internally for dirty state tracking
 * - Preview box is 40x40px per tech spec NFR
 */

import React, { useCallback } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';

// =============================================================================
// Props
// =============================================================================

export interface BorderRadiusEditorProps {
  /** Display label for the border radius property (e.g., "medium", "large") */
  label: string;
  /** Current border radius value as string (e.g., "8px", "16") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "shapes.borderRadius.medium") */
  path: string;
  /** Called when value changes: (path, newValue) */
  onUpdate: (path: string, value: string) => void;
}

// =============================================================================
// Styles
// =============================================================================

const inputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
};

const dirtyInputStyle: React.CSSProperties = {
  ...inputStyle,
  borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

const previewBoxStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-panel-border, #333333)',
  flexShrink: 0,
};

// =============================================================================
// Helpers
// =============================================================================

/** Extract numeric value from string like "8px", "8", "0.5rem" -> "8", "8", "0.5" */
function parseNumericValue(val: string): string {
  const match = val.match(/^(\d+(?:\.\d+)?)/);
  return match ? match[1] : val;
}

// =============================================================================
// Component
// =============================================================================

export function BorderRadiusEditor({
  label,
  value,
  path,
  onUpdate,
}: BorderRadiusEditorProps): React.JSX.Element {
  const isDirty = useFieldDirty(path);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numStr = e.target.value;
      // Store as "Xpx" format for consistency
      onUpdate(path, `${numStr}px`);
    },
    [path, onUpdate],
  );

  const numericValue = parseNumericValue(value);
  const currentStyle = isDirty ? dirtyInputStyle : inputStyle;

  return (
    <div data-testid={`border-radius-editor-${path}`} className="mb-3">
      {/* Label */}
      <label className="text-xs font-medium mb-1 block opacity-60" style={labelStyle}>
        {label}
      </label>

      {/* Input + Preview row */}
      <div className="flex gap-2 items-center">
        {/* Number input with px suffix */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            data-testid={`radius-input-${path}`}
            className="text-sm px-2 py-1 rounded outline-none w-20"
            style={currentStyle}
            value={numericValue}
            min={0}
            onChange={handleChange}
            aria-label={`${label} border radius`}
          />
          <span
            className="text-xs opacity-50"
            style={{ color: 'var(--vscode-editor-foreground)' }}
          >
            px
          </span>
        </div>

        {/* 40x40px preview box with borderRadius applied */}
        <div
          data-testid={`radius-preview-${path}`}
          style={{
            ...previewBoxStyle,
            borderRadius: value,
          }}
        />
      </div>
    </div>
  );
}
