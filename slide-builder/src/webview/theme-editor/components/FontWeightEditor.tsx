/**
 * FontWeightEditor - Select dropdown with common weights + number input + weight preview.
 *
 * Story Reference: bt-3-2 Task 2 -- AC-14
 * Renders a select dropdown with common font weights (300-700),
 * a number input for custom weights, and preview text at the selected weight.
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Uses native select for simplicity and testability in webview
 * - Dispatches UPDATE_VALUE with numeric weight value
 */

import React, { useCallback } from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';

// =============================================================================
// Props
// =============================================================================

export interface FontWeightEditorProps {
  /** Display label for the weight property (e.g., "Bold", "Regular") */
  label: string;
  /** Current weight value (numeric, e.g., 400, 700) */
  value: number;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "typography.weights.bold") */
  path: string;
  /** Called when weight changes: (path, newValue) */
  onUpdate: (path: string, value: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const COMMON_WEIGHTS = [
  { value: 300, label: '300 Light' },
  { value: 400, label: '400 Regular' },
  { value: 500, label: '500 Medium' },
  { value: 600, label: '600 Semibold' },
  { value: 700, label: '700 Bold' },
] as const;

const PREVIEW_TEXT = 'The quick brown fox';

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

const previewStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground, #cccccc)',
  padding: '8px',
  marginTop: '4px',
  borderRadius: '4px',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-panel-border, #333333)',
  fontSize: '14px',
  lineHeight: 1.4,
};

// =============================================================================
// Component
// =============================================================================

export function FontWeightEditor({
  label,
  value,
  path,
  onUpdate,
}: FontWeightEditorProps): React.JSX.Element {
  const isDirty = useFieldDirty(path);

  const isCommonWeight = COMMON_WEIGHTS.some((w) => w.value === value);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newVal = e.target.value;
      if (newVal === 'custom') return; // Switch to custom mode handled by number input
      onUpdate(path, parseInt(newVal, 10));
    },
    [path, onUpdate],
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseInt(e.target.value, 10);
      if (!isNaN(num) && num >= 100 && num <= 900) {
        onUpdate(path, num);
      }
    },
    [path, onUpdate],
  );

  const currentStyle = isDirty ? dirtyInputStyle : inputStyle;

  return (
    <div data-testid={`font-weight-editor-${path}`} className="mb-3">
      {/* Label */}
      <label className="text-xs font-medium mb-1 block opacity-60" style={labelStyle}>
        {label}
      </label>

      {/* Select + Number input row */}
      <div className="flex gap-2 items-center">
        {/* Common weights select */}
        <select
          data-testid={`weight-select-${path}`}
          className="text-sm px-2 py-1 rounded outline-none"
          style={currentStyle}
          value={isCommonWeight ? value : 'custom'}
          onChange={handleSelectChange}
          aria-label={`${label} weight preset`}
        >
          {COMMON_WEIGHTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
          {!isCommonWeight && <option value="custom">Custom ({value})</option>}
        </select>

        {/* Custom number input */}
        <input
          type="number"
          data-testid={`weight-number-${path}`}
          className="text-sm px-2 py-1 rounded outline-none w-20"
          style={currentStyle}
          min={100}
          max={900}
          step={100}
          value={value}
          onChange={handleNumberChange}
          aria-label={`${label} weight value`}
        />
      </div>

      {/* Weight-applied preview text */}
      <div
        data-testid={`weight-preview-${path}`}
        style={{
          ...previewStyle,
          fontWeight: value,
        }}
      >
        {PREVIEW_TEXT}
      </div>
    </div>
  );
}
