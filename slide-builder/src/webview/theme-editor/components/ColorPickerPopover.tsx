/**
 * ColorPickerPopover - Professional color picker with hex/RGB/HSL inputs.
 *
 * Story Reference: bt-3-1 Task 3 -- AC-2, AC-3, AC-4, AC-5, AC-8
 * Uses react-colorful HexColorPicker with synchronized hex/RGB/HSL inputs.
 * Designed for reuse by Stories 3.3 (Shapes/Components) for border/shadow colors.
 *
 * Constraints:
 * - No CSS imports (Tailwind CLI plugin handles CSS via esbuild.mjs)
 * - Inline styles + VS Code CSS custom properties only
 * - Hex values validated against #[0-9a-fA-F]{6} before dispatching
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { hexToRgb, rgbToHex, hexToHsl, hslToHex, isValidHex } from '../utils/colorUtils';
import type { RGB, HSL } from '../utils/colorUtils';

// =============================================================================
// Props
// =============================================================================

export interface ColorPickerPopoverProps {
  /** Current hex color value (e.g., "#ff5733") */
  color: string;
  /** Called on every color change for live preview. No debounce. */
  onChange: (hex: string) => void;
}

// =============================================================================
// Shared styles
// =============================================================================

const smallInputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
  width: '48px',
  padding: '2px 4px',
  fontSize: '11px',
  textAlign: 'center' as const,
  borderRadius: '3px',
  outline: 'none',
};

const hexInputStyle: React.CSSProperties = {
  ...smallInputStyle,
  width: '72px',
  textAlign: 'left' as const,
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--vscode-descriptionForeground, #888888)',
  marginBottom: '2px',
};

// =============================================================================
// Component
// =============================================================================

export function ColorPickerPopover({ color, onChange }: ColorPickerPopoverProps): React.JSX.Element {
  // Local state for input fields -- allows typing invalid intermediate values
  const [hexInput, setHexInput] = useState(color);
  const [rgb, setRgb] = useState<RGB>(() => hexToRgb(color) ?? { r: 0, g: 0, b: 0 });
  const [hsl, setHsl] = useState<HSL>(() => hexToHsl(color) ?? { h: 0, s: 0, l: 0 });

  // Sync local state when external color prop changes (e.g., from picker drag)
  useEffect(() => {
    setHexInput(color);
    const newRgb = hexToRgb(color);
    if (newRgb) setRgb(newRgb);
    const newHsl = hexToHsl(color);
    if (newHsl) setHsl(newHsl);
  }, [color]);

  // --- Picker change (drag spectrum/hue) ---
  const handlePickerChange = useCallback(
    (newHex: string) => {
      const lowerHex = newHex.toLowerCase();
      setHexInput(lowerHex);
      const newRgb = hexToRgb(lowerHex);
      if (newRgb) setRgb(newRgb);
      const newHsl = hexToHsl(lowerHex);
      if (newHsl) setHsl(newHsl);
      onChange(lowerHex);
    },
    [onChange],
  );

  // --- Hex input change ---
  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHexInput(val);
      if (isValidHex(val)) {
        const lowerVal = val.toLowerCase();
        const newRgb = hexToRgb(lowerVal);
        if (newRgb) setRgb(newRgb);
        const newHsl = hexToHsl(lowerVal);
        if (newHsl) setHsl(newHsl);
        onChange(lowerVal);
      }
    },
    [onChange],
  );

  // --- RGB input change ---
  const handleRgbChange = useCallback(
    (channel: 'r' | 'g' | 'b', value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return;
      const clamped = Math.max(0, Math.min(255, num));
      const newRgb = { ...rgb, [channel]: clamped };
      setRgb(newRgb);
      const newHex = rgbToHex(newRgb);
      setHexInput(newHex);
      const newHsl = hexToHsl(newHex);
      if (newHsl) setHsl(newHsl);
      onChange(newHex);
    },
    [rgb, onChange],
  );

  // --- HSL input change ---
  const handleHslChange = useCallback(
    (channel: 'h' | 's' | 'l', value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return;
      const max = channel === 'h' ? 360 : 100;
      const clamped = Math.max(0, Math.min(max, num));
      const newHsl = { ...hsl, [channel]: clamped };
      setHsl(newHsl);
      const newHex = hslToHex(newHsl);
      setHexInput(newHex);
      const newRgb = hexToRgb(newHex);
      if (newRgb) setRgb(newRgb);
      onChange(newHex);
    },
    [hsl, onChange],
  );

  return (
    <div
      style={{
        padding: '12px',
        background: 'var(--vscode-editorWidget-background, #252526)',
        border: '1px solid var(--vscode-editorWidget-border, #454545)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '220px',
      }}
      data-testid="color-picker-popover"
    >
      {/* react-colorful HexColorPicker */}
      <div style={{ width: '196px', height: '160px' }}>
        <HexColorPicker
          color={color}
          onChange={handlePickerChange}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Hex input row */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={labelStyle}>Hex</span>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInput}
          style={hexInputStyle}
          data-testid="hex-input"
          aria-label="Hex color value"
        />
      </div>

      {/* RGB inputs row */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>R</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            style={smallInputStyle}
            data-testid="rgb-r-input"
            aria-label="Red"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>G</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            style={smallInputStyle}
            data-testid="rgb-g-input"
            aria-label="Green"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>B</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            style={smallInputStyle}
            data-testid="rgb-b-input"
            aria-label="Blue"
          />
        </div>
      </div>

      {/* HSL inputs row */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>H</span>
          <input
            type="number"
            min={0}
            max={360}
            value={hsl.h}
            onChange={(e) => handleHslChange('h', e.target.value)}
            style={smallInputStyle}
            data-testid="hsl-h-input"
            aria-label="Hue"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>S</span>
          <input
            type="number"
            min={0}
            max={100}
            value={hsl.s}
            onChange={(e) => handleHslChange('s', e.target.value)}
            style={smallInputStyle}
            data-testid="hsl-s-input"
            aria-label="Saturation"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={labelStyle}>L</span>
          <input
            type="number"
            min={0}
            max={100}
            value={hsl.l}
            onChange={(e) => handleHslChange('l', e.target.value)}
            style={smallInputStyle}
            data-testid="hsl-l-input"
            aria-label="Lightness"
          />
        </div>
      </div>
    </div>
  );
}
