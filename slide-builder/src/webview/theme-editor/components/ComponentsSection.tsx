/**
 * ComponentsSection - Renders component style properties with visual editors.
 *
 * Story Reference: bt-3-3 Task 7 -- AC-21, AC-22, AC-23
 * Upgraded from basic DirtyTextInput/DirtyNumberInput to purpose-built visual editors:
 * - BoxStyleEditor for box/callout styles (grouped properties + combined preview)
 * - ArrowStyleEditor for arrow styles (stroke width + head type select + color swatch)
 *
 * Handles missing component types gracefully. Preserves icon/button basic inputs.
 */

import React, { useCallback } from 'react';
import type { ThemeComponents } from '../../../shared/types';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { DirtyTextInput, PropertyGroup } from './PropertyInput';
import { BoxStyleEditor } from './BoxStyleEditor';
import { ArrowStyleEditor } from './ArrowStyleEditor';

// =============================================================================
// Props
// =============================================================================

interface ComponentsSectionProps {
  components: ThemeComponents;
}

// =============================================================================
// Component
// =============================================================================

export function ComponentsSection({ components }: ComponentsSectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();

  const handleTextUpdate = useCallback(
    (path: string, value: string) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  const handleNumberUpdate = useCallback(
    (path: string, value: number) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  return (
    <div>
      {/* bt-3-3 Task 7.2: BoxStyleEditor for box/callout styles (AC-21, AC-23) */}
      {components.box && Object.keys(components.box).length > 0 && (
        <PropertyGroup title="Box Styles">
          {Object.entries(components.box).map(([variant, styles]) => (
            <BoxStyleEditor
              key={variant}
              variant={variant}
              styles={styles ?? {}}
              basePath={`components.box.${variant}`}
              onTextUpdate={handleTextUpdate}
              onNumberUpdate={handleNumberUpdate}
            />
          ))}
        </PropertyGroup>
      )}

      {/* bt-3-3 Task 7.3: ArrowStyleEditor for arrow styles (AC-22, AC-23) */}
      {components.arrow && Object.keys(components.arrow).length > 0 && (
        <PropertyGroup title="Arrow Styles">
          {Object.entries(components.arrow).map(([variant, styles]) => (
            <ArrowStyleEditor
              key={variant}
              variant={variant}
              styles={styles}
              basePath={`components.arrow.${variant}`}
              onTextUpdate={handleTextUpdate}
              onNumberUpdate={handleNumberUpdate}
            />
          ))}
        </PropertyGroup>
      )}

      {/* bt-2-2 Task 7.4: Icon styles if present (kept as basic inputs) */}
      {components.icon && Object.keys(components.icon).length > 0 && (
        <PropertyGroup title="Icon Styles">
          {Object.entries(components.icon).map(([variant, styles]) => (
            <PropertyGroup key={variant} title={variant}>
              {styles && Object.entries(styles).map(([prop, value]) => {
                if (value === undefined) return null;
                return (
                  <DirtyTextInput
                    key={prop}
                    label={prop}
                    value={String(value)}
                    path={`components.icon.${variant}.${prop}`}
                    onUpdate={handleTextUpdate}
                  />
                );
              })}
            </PropertyGroup>
          ))}
        </PropertyGroup>
      )}

      {/* bt-2-2 Task 7.4: Button styles if present (kept as basic inputs) */}
      {components.button && Object.keys(components.button).length > 0 && (
        <PropertyGroup title="Button Styles">
          {Object.entries(components.button).map(([variant, styles]) => (
            <PropertyGroup key={variant} title={variant}>
              {styles && Object.entries(styles).map(([prop, value]) => {
                if (value === undefined) return null;
                return (
                  <DirtyTextInput
                    key={prop}
                    label={prop}
                    value={String(value)}
                    path={`components.button.${variant}.${prop}`}
                    onUpdate={handleTextUpdate}
                  />
                );
              })}
            </PropertyGroup>
          ))}
        </PropertyGroup>
      )}

      {/* bt-2-2 Task 7.5: If no component types present at all */}
      {!components.box && !components.arrow && !components.icon && !components.button && (
        <p className="text-xs opacity-50" style={{ color: 'var(--vscode-editor-foreground)' }}>
          No component styles defined.
        </p>
      )}
    </div>
  );
}
