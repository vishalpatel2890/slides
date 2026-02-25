/**
 * ArrowStyleEditor - Stroke width input + head type select + color swatch.
 *
 * Story Reference: bt-3-3 Task 5 -- AC-22, AC-23
 * Renders stroke width number input, head type select dropdown (triangle, open, stealth),
 * and ColorSwatch for arrow color. Each property change dispatches UPDATE_VALUE
 * with the correct dot-notation path.
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Uses native HTML <select> per BT-3.2 pattern for testability
 * - ColorSwatch reuse per AC-23
 */

import React, { useCallback } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';
import { ColorSwatch } from './ColorSwatch';

// =============================================================================
// Props
// =============================================================================

export interface ArrowStyleEditorProps {
  /** Variant name (e.g., "default") */
  variant: string;
  /** Arrow style properties */
  styles: {
    strokeWidth?: number;
    color?: string;
    headType?: string;
    curveStyle?: string;
  };
  /** Base dot-notation path (e.g., "components.arrow.default") */
  basePath: string;
  /** Called when text property changes: (path, newValue) */
  onTextUpdate: (path: string, value: string) => void;
  /** Called when number property changes: (path, newValue) */
  onNumberUpdate: (path: string, value: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const HEAD_TYPES = ['triangle', 'open', 'stealth'] as const;

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

const smallLabelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
  fontSize: '10px',
  opacity: 0.5,
};

// =============================================================================
// Component
// =============================================================================

export function ArrowStyleEditor({
  variant,
  styles,
  basePath,
  onTextUpdate,
  onNumberUpdate,
}: ArrowStyleEditorProps): React.JSX.Element {
  const strokeWidthPath = `${basePath}.strokeWidth`;
  const headTypePath = `${basePath}.headType`;
  const colorPath = `${basePath}.color`;
  const curveStylePath = `${basePath}.curveStyle`;

  const isDirtyStrokeWidth = useFieldDirty(strokeWidthPath);
  const isDirtyHeadType = useFieldDirty(headTypePath);

  const handleStrokeWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value) || 0;
      onNumberUpdate(strokeWidthPath, num);
    },
    [strokeWidthPath, onNumberUpdate],
  );

  const handleHeadTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onTextUpdate(headTypePath, e.target.value);
    },
    [headTypePath, onTextUpdate],
  );

  const handleColorChange = useCallback(
    (_path: string, newColor: string) => {
      onTextUpdate(colorPath, newColor);
    },
    [colorPath, onTextUpdate],
  );

  const handleCurveStyleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTextUpdate(curveStylePath, e.target.value);
    },
    [curveStylePath, onTextUpdate],
  );

  return (
    <div data-testid={`arrow-style-editor-${basePath}`} className="mb-3">
      {/* Variant title */}
      <label className="text-xs font-semibold mb-2 block opacity-70" style={labelStyle}>
        {variant}
      </label>

      <div className="flex gap-2 items-end flex-wrap">
        {/* Stroke width */}
        {styles.strokeWidth !== undefined && (
          <div className="flex flex-col">
            <span style={smallLabelStyle}>Stroke Width</span>
            <input
              type="number"
              data-testid={`arrow-stroke-${basePath}`}
              className="text-sm px-1 py-1 rounded outline-none w-14"
              style={isDirtyStrokeWidth ? dirtyInputStyle : inputStyle}
              value={styles.strokeWidth}
              min={0}
              onChange={handleStrokeWidthChange}
              aria-label={`${variant} stroke width`}
            />
          </div>
        )}

        {/* Head type select (native HTML select per BT-3.2 pattern) */}
        {styles.headType !== undefined && (
          <div className="flex flex-col">
            <span style={smallLabelStyle}>Head Type</span>
            <select
              data-testid={`arrow-head-type-${basePath}`}
              className="text-sm px-2 py-1 rounded outline-none"
              style={isDirtyHeadType ? dirtyInputStyle : inputStyle}
              value={styles.headType}
              onChange={handleHeadTypeChange}
              aria-label={`${variant} head type`}
            >
              {HEAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color swatch (AC-23: reuse ColorSwatch from BT-3.1) */}
        {styles.color !== undefined && (
          <div className="flex flex-col">
            <span style={smallLabelStyle}>Color</span>
            <ColorSwatch
              label=""
              value={styles.color}
              path={`${basePath}.__arrowColor`}
              onUpdate={handleColorChange}
            />
          </div>
        )}

        {/* Curve style (if present) */}
        {styles.curveStyle !== undefined && (
          <div className="flex flex-col">
            <span style={smallLabelStyle}>Curve Style</span>
            <input
              type="text"
              data-testid={`arrow-curve-${basePath}`}
              className="text-sm px-1 py-1 rounded outline-none w-20"
              style={inputStyle}
              value={styles.curveStyle}
              onChange={handleCurveStyleChange}
              aria-label={`${variant} curve style`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
