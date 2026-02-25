/**
 * ColorsSection - Renders color properties as visual swatches with professional color pickers.
 *
 * Story Reference: bt-3-1 Task 6 -- AC-1 (swatches), AC-6 (nested groups), AC-7 (hierarchy)
 * bt-4-3: Refactored to horizontal compact layout with compact swatches and horizontal PropertyGroups.
 * Replaces all DirtyTextInput components with DirtyColorSwatch components.
 * Organizes colors in hierarchy: top-level -> Background -> Text -> Brand -> DataViz -> Semantic.
 * Each text input dispatches UPDATE_VALUE with dot-notation path.
 */

import React, { useCallback } from 'react';
import type { ThemeColors } from '../../../shared/types';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { DirtyColorSwatch, PropertyGroup } from './PropertyInput';

// =============================================================================
// Props
// =============================================================================

interface ColorsSectionProps {
  colors: ThemeColors;
}

// =============================================================================
// Styles
// =============================================================================

/** bt-4-3 Task 1: Horizontal flex container for core colors (AC-14, AC-18) */
const coreColorsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: '4px',
  rowGap: '16px',
  marginBottom: '4px',
};

// =============================================================================
// Component
// =============================================================================

export function ColorsSection({ colors }: ColorsSectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();

  const handleUpdate = useCallback(
    (path: string, value: string) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  return (
    <div>
      {/* bt-4-3 Task 1: Core colors in horizontal flex row with compact swatches (AC-14) */}
      <div style={coreColorsContainerStyle} data-testid="core-colors-container">
        <DirtyColorSwatch label="Primary" value={colors.primary} path="colors.primary" onUpdate={handleUpdate} compact={true} />
        <DirtyColorSwatch label="Secondary" value={colors.secondary} path="colors.secondary" onUpdate={handleUpdate} compact={true} />
        <DirtyColorSwatch label="Accent" value={colors.accent} path="colors.accent" onUpdate={handleUpdate} compact={true} />
      </div>

      {/* bt-3-1 Task 6.3/6.5: Nested groups in hierarchy order */}

      {/* bt-4-3 Task 2: Background group - horizontal compact layout (AC-15) */}
      <PropertyGroup title="Background" layout="horizontal">
        <DirtyColorSwatch label="Default" value={colors.background.default} path="colors.background.default" onUpdate={handleUpdate} compact={true} />
        <DirtyColorSwatch label="Alt" value={colors.background.alt} path="colors.background.alt" onUpdate={handleUpdate} compact={true} />
        {colors.background.light !== undefined && (
          <DirtyColorSwatch label="Light" value={colors.background.light} path="colors.background.light" onUpdate={handleUpdate} compact={true} />
        )}
        <DirtyColorSwatch label="Dark" value={colors.background.dark} path="colors.background.dark" onUpdate={handleUpdate} compact={true} />
        {colors.background.darkAlt !== undefined && (
          <DirtyColorSwatch label="Dark Alt" value={colors.background.darkAlt} path="colors.background.darkAlt" onUpdate={handleUpdate} compact={true} />
        )}
      </PropertyGroup>

      {/* bt-4-3 Task 3: Text group - horizontal compact layout (AC-16) */}
      <PropertyGroup title="Text" layout="horizontal">
        <DirtyColorSwatch label="Heading" value={colors.text.heading} path="colors.text.heading" onUpdate={handleUpdate} compact={true} />
        <DirtyColorSwatch label="Body" value={colors.text.body} path="colors.text.body" onUpdate={handleUpdate} compact={true} />
        {colors.text.muted !== undefined && (
          <DirtyColorSwatch label="Muted" value={colors.text.muted} path="colors.text.muted" onUpdate={handleUpdate} compact={true} />
        )}
        <DirtyColorSwatch label="On Dark" value={colors.text.onDark} path="colors.text.onDark" onUpdate={handleUpdate} compact={true} />
        {colors.text.onLight !== undefined && (
          <DirtyColorSwatch label="On Light" value={colors.text.onLight} path="colors.text.onLight" onUpdate={handleUpdate} compact={true} />
        )}
        {colors.text.onPrimary !== undefined && (
          <DirtyColorSwatch label="On Primary" value={colors.text.onPrimary} path="colors.text.onPrimary" onUpdate={handleUpdate} compact={true} />
        )}
      </PropertyGroup>

      {/* bt-4-3 Task 4: Brand group - horizontal compact layout (AC-16) */}
      {colors.brand && Object.keys(colors.brand).length > 0 && (
        <PropertyGroup title="Brand" layout="horizontal">
          {Object.entries(colors.brand).map(([key, value]) => (
            <DirtyColorSwatch
              key={key}
              label={key}
              value={value}
              path={`colors.brand.${key}`}
              onUpdate={handleUpdate}
              compact={true}
            />
          ))}
        </PropertyGroup>
      )}

      {/* bt-4-3 Task 5: DataViz group - horizontal compact layout (AC-16) */}
      {colors.dataViz && (
        <PropertyGroup title="Data Visualization" layout="horizontal">
          {colors.dataViz.palette && colors.dataViz.palette.length > 0 && (
            <div className="mb-2" style={{ width: '100%' }}>
              <span className="text-xs font-medium mb-1 opacity-60 block" style={{ color: 'var(--vscode-editor-foreground)' }}>
                Palette
              </span>
              <div style={coreColorsContainerStyle} data-testid="dataviz-palette-container">
                {colors.dataViz.palette.map((color, index) => (
                  <DirtyColorSwatch
                    key={index}
                    label={`Color ${index + 1}`}
                    value={color}
                    path={`colors.dataViz.palette.${index}`}
                    onUpdate={handleUpdate}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          )}
          {colors.dataViz.positive !== undefined && (
            <DirtyColorSwatch label="Positive" value={colors.dataViz.positive} path="colors.dataViz.positive" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.dataViz.negative !== undefined && (
            <DirtyColorSwatch label="Negative" value={colors.dataViz.negative} path="colors.dataViz.negative" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.dataViz.neutral !== undefined && (
            <DirtyColorSwatch label="Neutral" value={colors.dataViz.neutral} path="colors.dataViz.neutral" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.dataViz.highlight !== undefined && (
            <DirtyColorSwatch label="Highlight" value={colors.dataViz.highlight} path="colors.dataViz.highlight" onUpdate={handleUpdate} compact={true} />
          )}
        </PropertyGroup>
      )}

      {/* bt-4-3 Task 6: Semantic group - horizontal compact layout (AC-16) */}
      {colors.semantic && (
        <PropertyGroup title="Semantic" layout="horizontal">
          {colors.semantic.success !== undefined && (
            <DirtyColorSwatch label="Success" value={colors.semantic.success} path="colors.semantic.success" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.semantic.warning !== undefined && (
            <DirtyColorSwatch label="Warning" value={colors.semantic.warning} path="colors.semantic.warning" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.semantic.error !== undefined && (
            <DirtyColorSwatch label="Error" value={colors.semantic.error} path="colors.semantic.error" onUpdate={handleUpdate} compact={true} />
          )}
          {colors.semantic.info !== undefined && (
            <DirtyColorSwatch label="Info" value={colors.semantic.info} path="colors.semantic.info" onUpdate={handleUpdate} compact={true} />
          )}
        </PropertyGroup>
      )}
    </div>
  );
}
