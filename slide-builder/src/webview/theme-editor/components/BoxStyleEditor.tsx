/**
 * BoxStyleEditor - Grouped property controls + 60x40px combined preview box.
 *
 * Story Reference: bt-3-3 Task 4 -- AC-21, AC-23
 * Renders grouped property controls for each box variant: borderRadius (number input),
 * shadow (text input), border (text input), background (ColorSwatch), color (ColorSwatch).
 * Shows a 60x40px visual preview box with all styles applied via inline styles.
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Each property change dispatches UPDATE_VALUE with dot-notation path
 * - ColorSwatch reuse per AC-23 for background and color properties
 * - Preview box is 60x40px per tech spec
 */

import React, { useCallback } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';
import { ColorSwatch } from './ColorSwatch';

// =============================================================================
// Props
// =============================================================================

export interface BoxStyleEditorProps {
  /** Variant name (e.g., "default", "callout") */
  variant: string;
  /** Style properties for this variant */
  styles: Record<string, string | undefined>;
  /** Base dot-notation path (e.g., "components.box.default") */
  basePath: string;
  /** Called when text property changes: (path, newValue) */
  onTextUpdate: (path: string, value: string) => void;
  /** Called when number property changes: (path, newValue) */
  onNumberUpdate: (path: string, value: number) => void;
}

// =============================================================================
// Styles
// =============================================================================

const inputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

const previewBoxStyle: React.CSSProperties = {
  width: '60px',
  height: '40px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  color: 'var(--vscode-editor-foreground, #cccccc)',
};

const smallLabelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
  fontSize: '10px',
  opacity: 0.5,
};

// =============================================================================
// Component
// =============================================================================

export function BoxStyleEditor({
  variant,
  styles,
  basePath,
  onTextUpdate,
  onNumberUpdate,
}: BoxStyleEditorProps): React.JSX.Element {
  const borderRadiusPath = `${basePath}.borderRadius`;
  const shadowPath = `${basePath}.shadow`;
  const borderPath = `${basePath}.border`;
  const backgroundPath = `${basePath}.background`;
  const colorPath = `${basePath}.color`;

  const isDirtyRadius = useFieldDirty(borderRadiusPath);
  const isDirtyShadow = useFieldDirty(shadowPath);
  const isDirtyBorder = useFieldDirty(borderPath);

  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numVal = parseFloat(e.target.value) || 0;
      onNumberUpdate(borderRadiusPath, numVal);
    },
    [borderRadiusPath, onNumberUpdate],
  );

  const handleShadowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTextUpdate(shadowPath, e.target.value);
    },
    [shadowPath, onTextUpdate],
  );

  const handleBorderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTextUpdate(borderPath, e.target.value);
    },
    [borderPath, onTextUpdate],
  );

  const handleBackgroundColor = useCallback(
    (_path: string, newColor: string) => {
      onTextUpdate(backgroundPath, newColor);
    },
    [backgroundPath, onTextUpdate],
  );

  const handleTextColor = useCallback(
    (_path: string, newColor: string) => {
      onTextUpdate(colorPath, newColor);
    },
    [colorPath, onTextUpdate],
  );

  const dirtyStyle = (isDirty: boolean): React.CSSProperties =>
    isDirty
      ? { ...inputStyle, borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)' }
      : inputStyle;

  // Parse borderRadius for preview (might be string like "8px" or a number)
  const borderRadiusVal = styles.borderRadius ?? '';
  const numericRadius = parseFloat(borderRadiusVal) || 0;

  return (
    <div data-testid={`box-style-editor-${basePath}`} className="mb-3">
      {/* Variant title */}
      <label className="text-xs font-semibold mb-2 block opacity-70" style={labelStyle}>
        {variant}
      </label>

      <div className="flex gap-3 items-start flex-wrap">
        {/* Property controls column */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* Border Radius */}
          {styles.borderRadius !== undefined && (
            <div className="flex flex-col">
              <span style={smallLabelStyle}>Border Radius</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  data-testid={`box-radius-${basePath}`}
                  className="text-sm px-1 py-1 rounded outline-none w-14"
                  style={dirtyStyle(isDirtyRadius)}
                  value={numericRadius}
                  min={0}
                  onChange={handleRadiusChange}
                  aria-label={`${variant} border radius`}
                />
                <span className="text-xs opacity-50" style={{ color: 'var(--vscode-editor-foreground)' }}>px</span>
              </div>
            </div>
          )}

          {/* Shadow */}
          {styles.shadow !== undefined && (
            <div className="flex flex-col">
              <span style={smallLabelStyle}>Shadow</span>
              <input
                type="text"
                data-testid={`box-shadow-${basePath}`}
                className="text-sm px-1 py-1 rounded outline-none"
                style={dirtyStyle(isDirtyShadow)}
                value={styles.shadow ?? ''}
                onChange={handleShadowChange}
                aria-label={`${variant} shadow`}
              />
            </div>
          )}

          {/* Border */}
          {styles.border !== undefined && (
            <div className="flex flex-col">
              <span style={smallLabelStyle}>Border</span>
              <input
                type="text"
                data-testid={`box-border-${basePath}`}
                className="text-sm px-1 py-1 rounded outline-none"
                style={dirtyStyle(isDirtyBorder)}
                value={styles.border ?? ''}
                onChange={handleBorderChange}
                aria-label={`${variant} border`}
              />
            </div>
          )}

          {/* Background color (AC-23: ColorSwatch reuse) */}
          {styles.background !== undefined && (
            <div className="flex flex-col">
              <span style={smallLabelStyle}>Background</span>
              <ColorSwatch
                label=""
                value={styles.background ?? '#ffffff'}
                path={`${basePath}.__bgColor`}
                onUpdate={handleBackgroundColor}
              />
            </div>
          )}

          {/* Text color (AC-23: ColorSwatch reuse) */}
          {styles.color !== undefined && (
            <div className="flex flex-col">
              <span style={smallLabelStyle}>Text Color</span>
              <ColorSwatch
                label=""
                value={styles.color ?? '#000000'}
                path={`${basePath}.__textColor`}
                onUpdate={handleTextColor}
              />
            </div>
          )}
        </div>

        {/* 60x40px combined preview box */}
        <div
          data-testid={`box-preview-${basePath}`}
          style={{
            ...previewBoxStyle,
            borderRadius: styles.borderRadius ?? undefined,
            boxShadow: styles.shadow ?? undefined,
            border: styles.border ?? '1px solid var(--vscode-panel-border, #333333)',
            backgroundColor: styles.background ?? 'var(--vscode-input-background, #3c3c3c)',
            color: styles.color ?? 'var(--vscode-editor-foreground, #cccccc)',
          }}
        >
          Aa
        </div>
      </div>
    </div>
  );
}
