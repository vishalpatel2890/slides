/**
 * PropertyInput - Shared input component for theme property editing.
 *
 * Story Reference: bt-2-2 — AC-6 (Basic Property Editors)
 * String properties render as text inputs, number properties as number inputs.
 * Dispatches UPDATE_VALUE with dot-notation path on change.
 */

import React from 'react';
import { useFieldDirty } from '../context/ThemeEditorContext';
import { ColorSwatch } from './ColorSwatch';
import type { ColorSwatchProps } from './ColorSwatch';

// =============================================================================
// Shared Styles
// =============================================================================

const inputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
};

/** bt-2-3 Task 3.3: Dirty indicator style — colored left border on modified fields */
const dirtyInputStyle: React.CSSProperties = {
  ...inputStyle,
  borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

// =============================================================================
// Text Input
// =============================================================================

interface TextInputProps {
  label: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
  /** bt-2-3 Task 3.3: When true, shows dirty indicator (colored left border) */
  isDirty?: boolean;
}

export function TextInput({ label, value, path, onUpdate, isDirty = false }: TextInputProps): React.JSX.Element {
  return (
    <div className="flex flex-col mb-2">
      <label className="text-xs font-medium mb-1 opacity-60" style={labelStyle}>
        {label}
      </label>
      <input
        type="text"
        className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
        style={{
          ...(isDirty ? dirtyInputStyle : inputStyle),
          focusRingColor: 'var(--vscode-focusBorder)',
        }}
        value={value}
        onChange={(e) => onUpdate(path, e.target.value)}
      />
    </div>
  );
}

// =============================================================================
// Number Input
// =============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  path: string;
  onUpdate: (path: string, value: number) => void;
  /** bt-2-3 Task 3.3: When true, shows dirty indicator (colored left border) */
  isDirty?: boolean;
}

export function NumberInput({ label, value, path, onUpdate, isDirty = false }: NumberInputProps): React.JSX.Element {
  return (
    <div className="flex flex-col mb-2">
      <label className="text-xs font-medium mb-1 opacity-60" style={labelStyle}>
        {label}
      </label>
      <input
        type="number"
        className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
        style={isDirty ? dirtyInputStyle : inputStyle}
        value={value}
        onChange={(e) => onUpdate(path, parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

// =============================================================================
// Auto-dirty Wrappers
// =============================================================================

/**
 * bt-2-3 Task 3.4: TextInput wrapper that automatically computes isDirty
 * from the useFieldDirty hook based on the path prop.
 */
export function DirtyTextInput(props: Omit<TextInputProps, 'isDirty'>): React.JSX.Element {
  const isDirty = useFieldDirty(props.path);
  return <TextInput {...props} isDirty={isDirty} />;
}

/**
 * bt-2-3 Task 3.4: NumberInput wrapper that automatically computes isDirty
 * from the useFieldDirty hook based on the path prop.
 */
export function DirtyNumberInput(props: Omit<NumberInputProps, 'isDirty'>): React.JSX.Element {
  const isDirty = useFieldDirty(props.path);
  return <NumberInput {...props} isDirty={isDirty} />;
}

// =============================================================================
// Auto-dirty Color Swatch Wrapper
// =============================================================================

/**
 * bt-3-1 Task 5: ColorSwatch wrapper that automatically computes isDirty
 * from the useFieldDirty hook based on the path prop.
 * Follows the same pattern as DirtyTextInput and DirtyNumberInput.
 */
export function DirtyColorSwatch(props: Omit<ColorSwatchProps, 'isDirty'>): React.JSX.Element {
  const isDirty = useFieldDirty(props.path);
  return <ColorSwatch {...props} isDirty={isDirty} />;
}

// =============================================================================
// Property Group Header
// =============================================================================

/**
 * bt-4-2 AC-11, AC-12: PropertyGroup with optional horizontal layout.
 * layout='vertical' (default): existing vertical rendering, unchanged.
 * layout='horizontal': flex container with flex-wrap: wrap and gap: 8px.
 */
export function PropertyGroup({
  title,
  children,
  layout = 'vertical',
}: {
  title: string;
  children: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
}): React.JSX.Element {
  return (
    <div
      className="mb-4 ml-2 pl-3 pt-1"
      style={{ borderLeft: '2px solid var(--vscode-panel-border, #333333)' }}
      data-testid={`property-group-${title}`}
    >
      <span
        className="text-xs font-semibold mb-2 block opacity-70"
        style={labelStyle}
      >
        {title}
      </span>
      {layout === 'horizontal' ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: '4px',
            rowGap: '16px',
          }}
          data-testid={`property-group-content-${title}`}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
