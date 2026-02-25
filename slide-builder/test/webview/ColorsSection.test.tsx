import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ColorsSection } from '../../src/webview/theme-editor/components/ColorsSection';
import type { ThemeColors, ThemeJson } from '../../src/shared/types';

/**
 * Component tests for ColorsSection.
 * Story Reference: bt-3-1 Task 6.8 -- AC-1 (swatches), AC-6 (nested groups), AC-7 (hierarchy)
 * Updated from bt-2-2 Task 12.8 to expect ColorSwatch components instead of text inputs.
 * bt-4-3: Added tests for horizontal compact layout (AC-14 through AC-18).
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

const mockColors: ThemeColors = {
  primary: '#0066cc',
  secondary: '#004499',
  accent: '#ff6600',
  background: { default: '#ffffff', alt: '#f5f5f5', dark: '#1a1a1a' },
  text: { heading: '#111111', body: '#333333', onDark: '#ffffff' },
  brand: { brandBlue: '#0055bb', brandRed: '#cc0000' },
  semantic: { success: '#00cc66', warning: '#ffaa00', error: '#cc0000', info: '#0088ff' },
};

const fullColors: ThemeColors = {
  primary: '#0066cc',
  secondary: '#004499',
  accent: '#ff6600',
  background: { default: '#ffffff', alt: '#f5f5f5', light: '#fafafa', dark: '#1a1a1a', darkAlt: '#222222' },
  text: { heading: '#111111', body: '#333333', muted: '#999999', onDark: '#ffffff', onLight: '#000000', onPrimary: '#ffffff' },
  brand: { brandBlue: '#0055bb', brandRed: '#cc0000' },
  dataViz: {
    palette: ['#ff0000', '#00ff00', '#0000ff'],
    positive: '#00cc66',
    negative: '#cc0000',
    neutral: '#999999',
    highlight: '#ffaa00',
  },
  semantic: { success: '#00cc66', warning: '#ffaa00', error: '#cc0000', info: '#0088ff' },
};

function createFullTheme(colors: ThemeColors): ThemeJson {
  return {
    name: 'Test',
    version: '1.0',
    colors,
    typography: { fonts: { heading: 'Inter', body: 'Inter' }, scale: {}, weights: {} },
    shapes: { borderRadius: {}, shadow: {}, border: {} },
    components: {},
  };
}

// Helper that wraps ColorsSection with a loaded context
function TestColors({ colors }: { colors: ThemeColors }) {
  return (
    <ThemeEditorProvider>
      <Loader colors={colors} />
      <ColorsSection colors={colors} />
    </ThemeEditorProvider>
  );
}

function Loader({ colors }: { colors: ThemeColors }) {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme: createFullTheme(colors), exists: true });
  }, [dispatch, colors]);
  return null;
}

describe('ColorsSection', () => {
  // =========================================================================
  // AC-1: Color swatches replace text inputs
  // =========================================================================

  it('renders color swatches for top-level colors (not text inputs)', () => {
    render(<TestColors colors={mockColors} />);

    // Swatches are rendered with data-testid pattern
    expect(screen.getByTestId('color-swatch-colors.primary')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.secondary')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.accent')).toBeInTheDocument();

    // bt-4-3: Compact swatches show labels (not hex values) below the swatch
    // Labels are rendered via swatch-label-* data-testid attributes
    expect(screen.getByTestId('swatch-label-colors.primary')).toHaveTextContent('Primary');
    expect(screen.getByTestId('swatch-label-colors.secondary')).toHaveTextContent('Secondary');
    expect(screen.getByTestId('swatch-label-colors.accent')).toHaveTextContent('Accent');
  });

  it('does not render text inputs for color properties', () => {
    render(<TestColors colors={mockColors} />);

    // No text type inputs should exist for color values
    // (The only inputs are inside popover which is not open yet)
    const textInputs = screen.queryAllByRole('textbox');
    expect(textInputs.length).toBe(0);
  });

  // =========================================================================
  // AC-6: Nested color groups as labeled sub-sections
  // =========================================================================

  it('renders nested background group with labeled swatches', () => {
    render(<TestColors colors={mockColors} />);

    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.background.default')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.background.alt')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.background.dark')).toBeInTheDocument();
  });

  it('renders nested text group with labeled swatches', () => {
    render(<TestColors colors={mockColors} />);

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.text.heading')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.text.body')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.text.onDark')).toBeInTheDocument();
  });

  it('renders brand colors when present', () => {
    render(<TestColors colors={mockColors} />);

    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.brand.brandBlue')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.brand.brandRed')).toBeInTheDocument();
  });

  it('renders semantic colors when present', () => {
    render(<TestColors colors={mockColors} />);

    expect(screen.getByText('Semantic')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.semantic.success')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.semantic.warning')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.semantic.error')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.semantic.info')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-7: Full hierarchy order
  // =========================================================================

  it('renders hierarchy in correct order: top-level -> Background -> Text -> Brand -> Semantic', () => {
    const { container } = render(<TestColors colors={mockColors} />);

    // Get all group titles and swatch test IDs in DOM order
    const allElements = container.querySelectorAll('[data-testid^="color-swatch-"], span');
    const orderedLabels: string[] = [];

    allElements.forEach((el) => {
      const testId = el.getAttribute('data-testid');
      const text = el.textContent;
      if (testId?.startsWith('color-swatch-colors.primary')) orderedLabels.push('primary');
      if (text === 'Background' && el.tagName === 'SPAN') orderedLabels.push('Background');
      if (text === 'Text' && el.tagName === 'SPAN') orderedLabels.push('Text');
      if (text === 'Brand' && el.tagName === 'SPAN') orderedLabels.push('Brand');
      if (text === 'Semantic' && el.tagName === 'SPAN') orderedLabels.push('Semantic');
    });

    const primaryIdx = orderedLabels.indexOf('primary');
    const bgIdx = orderedLabels.indexOf('Background');
    const textIdx = orderedLabels.indexOf('Text');
    const brandIdx = orderedLabels.indexOf('Brand');
    const semanticIdx = orderedLabels.indexOf('Semantic');

    expect(primaryIdx).toBeLessThan(bgIdx);
    expect(bgIdx).toBeLessThan(textIdx);
    expect(textIdx).toBeLessThan(brandIdx);
    expect(brandIdx).toBeLessThan(semanticIdx);
  });

  // =========================================================================
  // AC-6 / Task 6.6: Dynamic groups (absent in theme data) not rendered
  // =========================================================================

  it('does not render absent optional groups', () => {
    const minimalColors: ThemeColors = {
      primary: '#000000',
      secondary: '#111111',
      accent: '#222222',
      background: { default: '#ffffff', alt: '#f0f0f0', dark: '#333333' },
      text: { heading: '#000000', body: '#333333', onDark: '#ffffff' },
      // No brand, dataViz, semantic
    };

    render(<TestColors colors={minimalColors} />);

    expect(screen.queryByText('Brand')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Visualization')).not.toBeInTheDocument();
    expect(screen.queryByText('Semantic')).not.toBeInTheDocument();
  });

  // =========================================================================
  // Swatch preview renders correct background color
  // =========================================================================

  it('swatch preview div has correct background color', () => {
    render(<TestColors colors={mockColors} />);

    const primaryPreview = screen.getByTestId('swatch-preview-colors.primary');
    expect(primaryPreview).toHaveStyle({ background: '#0066cc' });
  });

  // =========================================================================
  // bt-4-3 AC-14: Core colors horizontal flex row with compact swatches
  // =========================================================================

  it('renders core colors in a horizontal flex container (AC-14)', () => {
    render(<TestColors colors={mockColors} />);

    const coreContainer = screen.getByTestId('core-colors-container');
    expect(coreContainer).toBeInTheDocument();
    expect(coreContainer).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });
  });

  it('core color swatches are compact (28x28px) (AC-14)', () => {
    render(<TestColors colors={mockColors} />);

    // Compact swatches render swatch-preview with 28x28px dimensions
    const primaryPreview = screen.getByTestId('swatch-preview-colors.primary');
    expect(primaryPreview).toHaveStyle({ width: '28px', height: '28px' });

    const secondaryPreview = screen.getByTestId('swatch-preview-colors.secondary');
    expect(secondaryPreview).toHaveStyle({ width: '28px', height: '28px' });

    const accentPreview = screen.getByTestId('swatch-preview-colors.accent');
    expect(accentPreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('core colors container has flexWrap and gap styles (AC-14, AC-18)', () => {
    render(<TestColors colors={mockColors} />);

    const coreContainer = screen.getByTestId('core-colors-container');
    expect(coreContainer).toHaveStyle({ flexWrap: 'wrap' });
    expect(coreContainer).toHaveStyle({ gap: '8px' });
  });

  // =========================================================================
  // bt-4-3 AC-15: Background group horizontal with compact swatches
  // =========================================================================

  it('Background PropertyGroup has layout="horizontal" with compact swatches (AC-15)', () => {
    render(<TestColors colors={mockColors} />);

    // PropertyGroup with layout="horizontal" renders a flex content wrapper with data-testid
    const bgContent = screen.getByTestId('property-group-content-Background');
    expect(bgContent).toBeInTheDocument();
    expect(bgContent).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Background swatches should be compact (28x28px)
    const defaultPreview = screen.getByTestId('swatch-preview-colors.background.default');
    expect(defaultPreview).toHaveStyle({ width: '28px', height: '28px' });

    const altPreview = screen.getByTestId('swatch-preview-colors.background.alt');
    expect(altPreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  // =========================================================================
  // bt-4-3 AC-16: Text, Brand, DataViz, Semantic groups horizontal compact
  // =========================================================================

  it('Text PropertyGroup has layout="horizontal" with compact swatches (AC-16)', () => {
    render(<TestColors colors={mockColors} />);

    const textContent = screen.getByTestId('property-group-content-Text');
    expect(textContent).toBeInTheDocument();
    expect(textContent).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Text swatches should be compact
    const headingPreview = screen.getByTestId('swatch-preview-colors.text.heading');
    expect(headingPreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('Brand PropertyGroup has layout="horizontal" with compact swatches (AC-16)', () => {
    render(<TestColors colors={mockColors} />);

    const brandContent = screen.getByTestId('property-group-content-Brand');
    expect(brandContent).toBeInTheDocument();
    expect(brandContent).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Brand swatches should be compact
    const brandBluePreview = screen.getByTestId('swatch-preview-colors.brand.brandBlue');
    expect(brandBluePreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('DataViz PropertyGroup has layout="horizontal" with compact swatches (AC-16)', () => {
    render(<TestColors colors={fullColors} />);

    const dataVizContent = screen.getByTestId('property-group-content-Data Visualization');
    expect(dataVizContent).toBeInTheDocument();
    expect(dataVizContent).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Named DataViz swatches should be compact
    const positivePreview = screen.getByTestId('swatch-preview-colors.dataViz.positive');
    expect(positivePreview).toHaveStyle({ width: '28px', height: '28px' });

    const negativePreview = screen.getByTestId('swatch-preview-colors.dataViz.negative');
    expect(negativePreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('DataViz palette sub-section renders in horizontal flex container with compact swatches (AC-16)', () => {
    render(<TestColors colors={fullColors} />);

    // Palette container should be a flex container
    const paletteContainer = screen.getByTestId('dataviz-palette-container');
    expect(paletteContainer).toBeInTheDocument();
    expect(paletteContainer).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Palette swatches should be compact
    const palette0Preview = screen.getByTestId('swatch-preview-colors.dataViz.palette.0');
    expect(palette0Preview).toHaveStyle({ width: '28px', height: '28px' });

    const palette1Preview = screen.getByTestId('swatch-preview-colors.dataViz.palette.1');
    expect(palette1Preview).toHaveStyle({ width: '28px', height: '28px' });

    const palette2Preview = screen.getByTestId('swatch-preview-colors.dataViz.palette.2');
    expect(palette2Preview).toHaveStyle({ width: '28px', height: '28px' });
  });

  it('Semantic PropertyGroup has layout="horizontal" with compact swatches (AC-16)', () => {
    render(<TestColors colors={mockColors} />);

    const semanticContent = screen.getByTestId('property-group-content-Semantic');
    expect(semanticContent).toBeInTheDocument();
    expect(semanticContent).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });

    // Semantic swatches should be compact
    const successPreview = screen.getByTestId('swatch-preview-colors.semantic.success');
    expect(successPreview).toHaveStyle({ width: '28px', height: '28px' });
  });

  // =========================================================================
  // bt-4-3 AC-14-18: Clicking compact swatch opens ColorPickerPopover
  // =========================================================================

  it('clicking a compact swatch opens the ColorPickerPopover (behavior preserved)', () => {
    render(<TestColors colors={mockColors} />);

    const button = screen.getByTestId('swatch-button-colors.primary');
    fireEvent.click(button);
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();
  });

  // =========================================================================
  // bt-4-3: Full colors with all optional groups
  // =========================================================================

  it('renders all optional fields when full colors provided (AC-15, AC-16)', () => {
    render(<TestColors colors={fullColors} />);

    // Background optional fields
    expect(screen.getByTestId('color-swatch-colors.background.light')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.background.darkAlt')).toBeInTheDocument();

    // Text optional fields
    expect(screen.getByTestId('color-swatch-colors.text.muted')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.text.onLight')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.text.onPrimary')).toBeInTheDocument();

    // DataViz group present
    expect(screen.getByText('Data Visualization')).toBeInTheDocument();
    expect(screen.getByText('Palette')).toBeInTheDocument();

    // DataViz named colors
    expect(screen.getByTestId('color-swatch-colors.dataViz.positive')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.dataViz.negative')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.dataViz.neutral')).toBeInTheDocument();
    expect(screen.getByTestId('color-swatch-colors.dataViz.highlight')).toBeInTheDocument();
  });
});
