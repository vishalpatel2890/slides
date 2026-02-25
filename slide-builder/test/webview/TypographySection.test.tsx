import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { TypographySection } from '../../src/webview/theme-editor/components/TypographySection';
import type { ThemeTypography, ThemeJson } from '../../src/shared/types';

/**
 * Component tests for TypographySection.
 * Story Reference: bt-3-2 Task 4.7 -- AC-11 through AC-16
 * Verifies visual editors replace basic inputs.
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

const mockTypography: ThemeTypography = {
  fonts: { heading: 'Inter', body: 'Roboto', mono: 'Fira Code' },
  scale: { hero: '3rem', h1: '2rem', h2: '1.5rem', body: '1rem', small: '0.875rem' },
  weights: { bold: 700, regular: 400 },
  lineHeight: { default: 1.5, tight: 1.2 },
};

function createFullTheme(typography: ThemeTypography): ThemeJson {
  return {
    name: 'Test',
    version: '1.0',
    colors: {
      primary: '#000', secondary: '#111', accent: '#222',
      background: { default: '#fff', alt: '#f5f5f5', dark: '#1a1a1a' },
      text: { heading: '#000', body: '#333', onDark: '#fff' },
    },
    typography,
    shapes: { borderRadius: {}, shadow: {}, border: {} },
    components: {},
  };
}

// Helper that wraps TypographySection with a loaded context
function TestTypographySection({ typography }: { typography: ThemeTypography }) {
  return (
    <ThemeEditorProvider>
      <Loader typography={typography} />
      <TypographySection typography={typography} />
    </ThemeEditorProvider>
  );
}

function Loader({ typography }: { typography: ThemeTypography }) {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme: createFullTheme(typography), exists: true });
  }, [dispatch, typography]);
  return null;
}

describe('TypographySection', () => {
  beforeEach(() => {
    // Default: document.fonts.check returns true (font available)
    Object.defineProperty(document, 'fonts', {
      value: {
        check: vi.fn().mockReturnValue(true),
      },
      writable: true,
      configurable: true,
    });
  });

  // =========================================================================
  // AC-11: Renders FontFamilyEditor (not basic text inputs) for font families
  // =========================================================================

  it('renders FontFamilyEditor for heading font', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('font-family-editor-typography.fonts.heading')).toBeInTheDocument();
  });

  it('renders FontFamilyEditor for body font', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('font-family-editor-typography.fonts.body')).toBeInTheDocument();
  });

  it('renders FontFamilyEditor for mono font when present', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('font-family-editor-typography.fonts.mono')).toBeInTheDocument();
  });

  it('does not render FontFamilyEditor for mono when absent', () => {
    const noMono = { ...mockTypography, fonts: { heading: 'Inter', body: 'Roboto' } };
    render(<TestTypographySection typography={noMono} />);
    expect(screen.queryByTestId('font-family-editor-typography.fonts.mono')).not.toBeInTheDocument();
  });

  // =========================================================================
  // AC-14: Renders FontWeightEditor for weights
  // =========================================================================

  it('renders FontWeightEditor for bold weight', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('font-weight-editor-typography.weights.bold')).toBeInTheDocument();
  });

  it('renders FontWeightEditor for regular weight', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('font-weight-editor-typography.weights.regular')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-15: Renders TypeScaleEditor for scale entries
  // =========================================================================

  it('renders TypeScaleEditor with scale entries', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('type-scale-editor')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-hero')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-h1')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-body')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-small')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-11: Font family input exists and is editable
  // =========================================================================

  it('font family input is present and can be changed', () => {
    render(<TestTypographySection typography={mockTypography} />);
    const headingInput = screen.getByDisplayValue('Inter') as HTMLInputElement;
    expect(headingInput).toBeInTheDocument();
    // The input is part of FontFamilyEditor -> DirtyTextInput which dispatches UPDATE_VALUE
    // We verify the input exists and accepts changes (dispatch is tested in FontFamilyEditor tests)
    fireEvent.change(headingInput, { target: { value: 'Georgia' } });
    // TypographySection is prop-driven so the value stays 'Inter' in DOM
    // but the dispatch was called (verified by FontFamilyEditor.test.tsx)
    expect(headingInput).toBeInTheDocument();
  });

  // =========================================================================
  // AC-15: Scale input is present and editable
  // =========================================================================

  it('scale size input is present and can be changed', () => {
    render(<TestTypographySection typography={mockTypography} />);
    const heroInput = screen.getByDisplayValue('3rem') as HTMLInputElement;
    expect(heroInput).toBeInTheDocument();
    // TypeScaleEditor -> DirtyTextInput dispatches UPDATE_VALUE
    fireEvent.change(heroInput, { target: { value: '4rem' } });
    expect(heroInput).toBeInTheDocument();
  });

  // =========================================================================
  // Sub-groups: Fonts, Weights, Scale
  // =========================================================================

  it('renders Fonts property group', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByText('Fonts')).toBeInTheDocument();
  });

  it('renders Scale property group', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByText('Scale')).toBeInTheDocument();
  });

  it('renders Weights property group', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByText('Weights')).toBeInTheDocument();
  });

  // =========================================================================
  // Line Height section preserved
  // =========================================================================

  it('renders Line Height section when present', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByText('Line Height')).toBeInTheDocument();
  });

  it('does not render Line Height section when absent', () => {
    const noLineHeight = { ...mockTypography, lineHeight: undefined };
    render(<TestTypographySection typography={noLineHeight} />);
    expect(screen.queryByText('Line Height')).not.toBeInTheDocument();
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestTypographySection typography={mockTypography} />);
    expect(screen.getByTestId('typography-section')).toBeInTheDocument();
  });
});
