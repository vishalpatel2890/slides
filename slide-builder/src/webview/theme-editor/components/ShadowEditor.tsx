/**
 * ShadowEditor - Individual component inputs + color swatch + 40x40px preview box.
 *
 * Story Reference: bt-3-3 Task 2 -- AC-19, AC-23
 * Parses CSS shadow strings into individual components (x-offset, y-offset, blur, spread, color).
 * Falls back to raw text input (DirtyTextInput) if format is unrecognized.
 * Reuses ColorSwatch from BT-3.1 for shadow color (AC-23).
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Shadow parsing: attempt common format "Xpx Ypx Bpx Spx #color", fallback to text input
 * - Preview box is 40x40px per tech spec NFR
 * - ColorSwatch reuse per AC-23
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';
import { ColorSwatch } from './ColorSwatch';

// =============================================================================
// Props
// =============================================================================

export interface ShadowEditorProps {
  /** Display label for the shadow property (e.g., "medium", "large") */
  label: string;
  /** Current CSS shadow string (e.g., "0px 4px 6px 0px #00000040") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "shapes.shadow.medium") */
  path: string;
  /** Called when value changes: (path, newValue) */
  onUpdate: (path: string, value: string) => void;
}

// =============================================================================
// Shadow Parsing
// =============================================================================

interface ShadowComponents {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

/**
 * Attempt to parse a CSS box-shadow string into individual components.
 * Handles common format: "Xpx Ypx Bpx Spx color"
 * Returns null if the format is unrecognized.
 */
export function parseShadow(shadow: string): ShadowComponents | null {
  if (!shadow || shadow.trim() === '' || shadow.trim() === 'none') {
    return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' };
  }

  const trimmed = shadow.trim();

  // Match pattern: optional numbers with px units followed by color
  // Pattern: [-]?Npx [-]?Npx [-]?Npx [-]?Npx color_rest
  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(.+)$/,
  );

  if (match) {
    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      blur: parseFloat(match[3]),
      spread: parseFloat(match[4]),
      color: match[5].trim(),
    };
  }

  // Try without spread: Xpx Ypx Bpx color
  const matchNoSpread = trimmed.match(
    /^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(.+)$/,
  );

  if (matchNoSpread) {
    return {
      x: parseFloat(matchNoSpread[1]),
      y: parseFloat(matchNoSpread[2]),
      blur: parseFloat(matchNoSpread[3]),
      spread: 0,
      color: matchNoSpread[4].trim(),
    };
  }

  return null;
}

/**
 * Compose a CSS box-shadow string from individual components.
 */
export function composeShadow(components: ShadowComponents): string {
  return `${components.x}px ${components.y}px ${components.blur}px ${components.spread}px ${components.color}`;
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
  borderRadius: '4px',
  flexShrink: 0,
};

const smallLabelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
  fontSize: '10px',
  opacity: 0.5,
};

// =============================================================================
// Component
// =============================================================================

export function ShadowEditor({
  label,
  value,
  path,
  onUpdate,
}: ShadowEditorProps): React.JSX.Element {
  const isDirty = useFieldDirty(path);
  const parsed = useMemo(() => parseShadow(value), [value]);
  const [fallbackMode, setFallbackMode] = useState(false);

  // If parsing fails on first render, go into fallback mode
  const isStructured = parsed !== null && !fallbackMode;

  const handleComponentChange = useCallback(
    (field: keyof ShadowComponents, newVal: number | string) => {
      if (!parsed) return;
      const updated = { ...parsed, [field]: newVal };
      onUpdate(path, composeShadow(updated));
    },
    [parsed, path, onUpdate],
  );

  const handleColorChange = useCallback(
    (_colorPath: string, newColor: string) => {
      handleComponentChange('color', newColor);
    },
    [handleComponentChange],
  );

  const handleFallbackChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(path, e.target.value);
    },
    [path, onUpdate],
  );

  const handleSwitchToFallback = useCallback(() => {
    setFallbackMode(true);
  }, []);

  const currentInputStyle = isDirty ? dirtyInputStyle : inputStyle;

  // =========================================================================
  // Fallback: raw text input for unrecognized formats
  // =========================================================================
  if (!isStructured) {
    return (
      <div data-testid={`shadow-editor-${path}`} className="mb-3">
        <label className="text-xs font-medium mb-1 block opacity-60" style={labelStyle}>
          {label}
        </label>
        <input
          type="text"
          data-testid={`shadow-fallback-${path}`}
          className="text-sm px-2 py-1 rounded outline-none w-full"
          style={currentInputStyle}
          value={value}
          onChange={handleFallbackChange}
          aria-label={`${label} shadow`}
        />
      </div>
    );
  }

  // =========================================================================
  // Structured: individual component inputs
  // =========================================================================
  return (
    <div data-testid={`shadow-editor-${path}`} className="mb-3">
      {/* Label */}
      <label className="text-xs font-medium mb-1 block opacity-60" style={labelStyle}>
        {label}
      </label>

      {/* Component inputs row */}
      <div className="flex gap-2 items-end flex-wrap">
        {/* X offset */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>X</span>
          <input
            type="number"
            data-testid={`shadow-x-${path}`}
            className="text-sm px-1 py-1 rounded outline-none w-14"
            style={currentInputStyle}
            value={parsed.x}
            onChange={(e) => handleComponentChange('x', parseFloat(e.target.value) || 0)}
            aria-label={`${label} shadow x-offset`}
          />
        </div>

        {/* Y offset */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Y</span>
          <input
            type="number"
            data-testid={`shadow-y-${path}`}
            className="text-sm px-1 py-1 rounded outline-none w-14"
            style={currentInputStyle}
            value={parsed.y}
            onChange={(e) => handleComponentChange('y', parseFloat(e.target.value) || 0)}
            aria-label={`${label} shadow y-offset`}
          />
        </div>

        {/* Blur */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Blur</span>
          <input
            type="number"
            data-testid={`shadow-blur-${path}`}
            className="text-sm px-1 py-1 rounded outline-none w-14"
            style={currentInputStyle}
            value={parsed.blur}
            min={0}
            onChange={(e) => handleComponentChange('blur', parseFloat(e.target.value) || 0)}
            aria-label={`${label} shadow blur`}
          />
        </div>

        {/* Spread */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Spread</span>
          <input
            type="number"
            data-testid={`shadow-spread-${path}`}
            className="text-sm px-1 py-1 rounded outline-none w-14"
            style={currentInputStyle}
            value={parsed.spread}
            onChange={(e) => handleComponentChange('spread', parseFloat(e.target.value) || 0)}
            aria-label={`${label} shadow spread`}
          />
        </div>

        {/* Color swatch (AC-23: reuse ColorSwatch from BT-3.1) */}
        <div className="flex flex-col">
          <span style={smallLabelStyle}>Color</span>
          <ColorSwatch
            label=""
            value={parsed.color}
            path={`${path}.__shadowColor`}
            onUpdate={handleColorChange}
          />
        </div>

        {/* 40x40px preview box */}
        <div
          data-testid={`shadow-preview-${path}`}
          style={{
            ...previewBoxStyle,
            boxShadow: value,
          }}
        />
      </div>

      {/* Switch to raw text mode */}
      <button
        type="button"
        data-testid={`shadow-raw-toggle-${path}`}
        className="text-xs opacity-40 mt-1 cursor-pointer"
        style={{ color: 'var(--vscode-editor-foreground)', background: 'none', border: 'none', padding: 0 }}
        onClick={handleSwitchToFallback}
      >
        Edit as text
      </button>
    </div>
  );
}
