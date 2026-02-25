/**
 * ColorSwatch - Rendered color swatch with popover color picker.
 *
 * Story Reference: bt-3-1 Task 4 -- AC-1, AC-2, AC-8, AC-9
 * Displays a 32x32px filled rectangle with hex text. On click, opens
 * ColorPickerPopover via @radix-ui/react-popover for click-outside/Escape dismiss.
 * Designed for reuse by Stories 3.3 (Shapes/Components).
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Uses @radix-ui/react-popover for positioning and dismiss behavior
 * - Only one popover open at a time (Radix manages this automatically)
 */

import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ColorPickerPopover } from './ColorPickerPopover';
import { isValidHex } from '../utils/colorUtils';

// =============================================================================
// Props
// =============================================================================

export interface ColorSwatchProps {
  /** Display label for the color property */
  label: string;
  /** Current hex color value (e.g., "#ff5733") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "colors.primary") */
  path: string;
  /** Called when color changes: (path, newHexValue) */
  onUpdate: (path: string, value: string) => void;
  /** When true, shows dirty indicator (colored left border for full-size, colored ring for compact) */
  isDirty?: boolean;
  /**
   * bt-4-2 AC-7: When true, renders a compact 28x28px swatch with label below.
   * Default false preserves existing full-size rendering.
   */
  compact?: boolean;
}

// =============================================================================
// Styles
// =============================================================================

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

const checkerboardPattern =
  'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px';

// =============================================================================
// Component
// =============================================================================

export function ColorSwatch({
  label,
  value,
  path,
  onUpdate,
  isDirty = false,
  compact = false,
}: ColorSwatchProps): React.JSX.Element {
  const validColor = isValidHex(value);
  const displayValue = validColor ? value : '#000000';

  const handleChange = (hex: string) => {
    onUpdate(path, hex);
  };

  // bt-4-2 AC-8: Compact variant renders 28x28px swatch with label below
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '56px',
        }}
        data-testid={`color-swatch-${path}`}
      >
        {/* Compact Swatch + Popover */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              data-testid={`swatch-button-${path}`}
              aria-label={`Edit ${label} color`}
            >
              {/* bt-4-2 AC-8: 28x28px compact swatch */}
              {/* bt-4-2 AC-9: Dirty indicator as colored ring via box-shadow */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '4px',
                  border: '1px solid var(--vscode-panel-border, #333333)',
                  background: validColor ? value : checkerboardPattern,
                  flexShrink: 0,
                  boxShadow: isDirty
                    ? '0 0 0 2px var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)'
                    : 'none',
                }}
                data-testid={`swatch-preview-${path}`}
              />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="center"
              sideOffset={4}
              collisionPadding={8}
              style={{ zIndex: 1000 }}
            >
              <ColorPickerPopover
                color={displayValue}
                onChange={handleChange}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* bt-4-2 AC-8: Label below swatch in small text */}
        <span
          style={{
            fontSize: '10px',
            color: 'var(--vscode-editor-foreground)',
            opacity: 0.6,
            textAlign: 'center',
            maxWidth: '56px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          data-testid={`swatch-label-${path}`}
        >
          {label}
        </span>
      </div>
    );
  }

  // Full-size swatch (existing behavior, unchanged)
  return (
    <div
      className="flex items-center gap-2 mb-2"
      style={{
        paddingLeft: isDirty ? '0px' : '3px',
        borderLeft: isDirty
          ? '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)'
          : 'none',
      }}
      data-testid={`color-swatch-${path}`}
    >
      {/* Label */}
      <label
        className="text-xs font-medium opacity-60 w-16 shrink-0"
        style={labelStyle}
      >
        {label}
      </label>

      {/* Swatch + Popover */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
            data-testid={`swatch-button-${path}`}
            aria-label={`Edit ${label} color`}
          >
            {/* 32x32px color rectangle */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid var(--vscode-panel-border, #333333)',
                background: validColor ? value : checkerboardPattern,
                flexShrink: 0,
              }}
              data-testid={`swatch-preview-${path}`}
            />
            {/* Hex value text */}
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--vscode-editor-foreground, #cccccc)' }}
            >
              {value}
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            style={{ zIndex: 1000 }}
          >
            <ColorPickerPopover
              color={displayValue}
              onChange={handleChange}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
