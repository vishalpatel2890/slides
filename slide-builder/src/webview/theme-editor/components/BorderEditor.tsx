/**
 * BorderEditor - Width number input + style select + color swatch + 40x40px preview box.
 *
 * Story Reference: bt-3-3 Task 3 -- AC-20, AC-23
 * Parses CSS border shorthand strings into width/style/color components.
 * Composes border shorthand on change and dispatches UPDATE_VALUE.
 * Reuses ColorSwatch from BT-3.1 for border color (AC-23).
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Uses native HTML <select> per BT-3.2 pattern for testability
 * - Preview box is 40x40px per tech spec NFR
 * - ColorSwatch reuse per AC-23
 */

import React, { useCallback, useMemo } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';
import { ColorSwatch } from './ColorSwatch';

// =============================================================================
// Props
// =============================================================================

export interface BorderEditorProps {
  /** Display label for the border property (e.g., "thin", "medium", "thick") */
  label: string;
  /** Current CSS border shorthand string (e.g., "1px solid #333333") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "shapes.border.thin") */
  path: string;
  /** Called when value changes: (path, newValue) */
  onUpdate: (path: string, value: string) => void;
}

// =============================================================================
// Border Parsing
// =============================================================================

interface BorderComponents {
  width: number;
  style: string;
  color: string;
}

const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'none'] as const;

/**
 * Parse a CSS border shorthand string into width/style/color components.
 * Handles: "1px solid #333", "2px dashed rgb(0,0,0)", etc.
 */
export function parseBorder(border: string): BorderComponents {
  if (!border || border.trim() === '' || border.trim() === 'none') {
    return { width: 0, style: 'none', color: '#000000' };
  }

  const trimmed = border.trim();

  // Match: Npx style color
  const match = trimmed.match(/^(\d+(?:\.\d+)?)px\s+(solid|dashed|dotted|none)\s+(.+)$/);
  if (match) {
    return {
      width: parseFloat(match[1]),
      style: match[2],
      color: match[3].trim(),
    };
  }

  // Fallback: try to extract what we can
  const widthMatch = trimmed.match(/(\d+(?:\.\d+)?)px/);
  const styleMatch = trimmed.match(/\b(solid|dashed|dotted|none)\b/);
  const colorMatch = trimmed.match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/);

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : 1,
    style: styleMatch ? styleMatch[1] : 'solid',
    color: colorMatch ? colorMatch[1] : '#000000',
  };
}

/**
 * Compose a CSS border shorthand string from individual components.
 */
export function composeBorder(components: BorderComponents): string {
  if (components.style === 'none') return 'none';
  return `${components.width}px ${components.style} ${components.color}`;
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
  flexShrink: 0,
  borderRadius: '4px',
};

const smallLabelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
  fontSize: '10px',
  opacity: 0.5,
};

// =============================================================================
// Component
// =============================================================================

export function BorderEditor({
  label,
  value,
  path,
  onUpdate,
}: BorderEditorProps): React.JSX.Element {
  const isDirty = useFieldDirty(path);
  const parsed = useMemo(() => parseBorder(value), [value]);

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newWidth = parseFloat(e.target.value) || 0;
      onUpdate(path, composeBorder({ ...parsed, width: newWidth }));
    },
    [parsed, path, onUpdate],
  );

  const handleStyleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(path, composeBorder({ ...parsed, style: e.target.value }));
    },
    [parsed, path, onUpdate],
  );

  const handleColorChange = useCallback(
    (_colorPath: string, newColor: string) => {
      onUpdate(path, composeBorder({ ...parsed, color: newColor }));
    },
    [parsed, path, onUpdate],
  );

  const currentInputStyle = isDirty ? dirtyInputStyle : inputStyle;

  return (
    <div data-testid={`border-editor-${path}`} className="mb-3">
      {/* Label */}
      <label className="text-xs font-medium mb-1 block opacity-60" style={labelStyle}>
        {label}
      </label>

      {/* Controls row */}
      <div className="flex gap-2 items-end flex-wrap">
        {/* Width input with px suffix */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Width</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              data-testid={`border-width-${path}`}
              className="text-sm px-1 py-1 rounded outline-none w-14"
              style={currentInputStyle}
              value={parsed.width}
              min={0}
              onChange={handleWidthChange}
              aria-label={`${label} border width`}
            />
            <span
              className="text-xs opacity-50"
              style={{ color: 'var(--vscode-editor-foreground)' }}
            >
              px
            </span>
          </div>
        </div>

        {/* Style select (native HTML select per BT-3.2 pattern) */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Style</span>
          <select
            data-testid={`border-style-${path}`}
            className="text-sm px-2 py-1 rounded outline-none"
            style={currentInputStyle}
            value={parsed.style}
            onChange={handleStyleChange}
            aria-label={`${label} border style`}
          >
            {BORDER_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Color swatch (AC-23: reuse ColorSwatch from BT-3.1) */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Color</span>
          <ColorSwatch
            label=""
            value={parsed.color}
            path={`${path}.__borderColor`}
            onUpdate={handleColorChange}
          />
        </div>

        {/* 40x40px preview box */}
        <div
          data-testid={`border-preview-${path}`}
          style={{
            ...previewBoxStyle,
            border: value === 'none' ? 'none' : value,
          }}
        />
      </div>
    </div>
  );
}
