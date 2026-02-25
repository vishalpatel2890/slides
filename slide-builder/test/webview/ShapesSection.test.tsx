import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ShapesSection } from '../../src/webview/theme-editor/components/ShapesSection';
import type { ThemeJson, ThemeShapes } from '../../src/shared/types';

/**
 * Component tests for ShapesSection (upgraded with visual editors).
 * Story Reference: bt-3-3 Task 6.7 -- AC-17, AC-18, AC-19, AC-20, AC-23
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

function createFullTheme(): ThemeJson {
  return {
    name: 'Test',
    version: '1.0',
    colors: {
      primary: '#000', secondary: '#111', accent: '#222',
      background: { default: '#fff', alt: '#f5f5f5', dark: '#1a1a1a' },
      text: { heading: '#000', body: '#333', onDark: '#fff' },
    },
    typography: {
      fonts: { heading: 'Inter', body: 'Inter' },
      scale: {},
      weights: { bold: 700, regular: 400 },
    },
    shapes: {
      borderRadius: { none: '0px', small: '4px', medium: '8px' },
      shadow: { none: 'none', medium: '0px 4px 6px 0px #00000040' },
      border: { thin: '1px solid #333333', medium: '2px solid #555555' },
    },
    components: {},
  };
}

function Loader() {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme: createFullTheme(), exists: true });
  }, [dispatch]);
  return null;
}

function TestShapesSection(props: { shapes: ThemeShapes }) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <ShapesSection {...props} />
    </ThemeEditorProvider>
  );
}

describe('ShapesSection', () => {
  const shapes: ThemeShapes = {
    borderRadius: { none: '0px', small: '4px', medium: '8px' },
    shadow: { none: 'none', medium: '0px 4px 6px 0px #00000040' },
    border: { thin: '1px solid #333333', medium: '2px solid #555555' },
  };

  // =========================================================================
  // AC-17: Renders BorderRadiusEditor (not basic text inputs) for radius properties
  // =========================================================================

  it('renders BorderRadiusEditor for borderRadius properties', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('border-radius-editor-shapes.borderRadius.none')).toBeInTheDocument();
    expect(screen.getByTestId('border-radius-editor-shapes.borderRadius.small')).toBeInTheDocument();
    expect(screen.getByTestId('border-radius-editor-shapes.borderRadius.medium')).toBeInTheDocument();
  });

  it('renders preview boxes for borderRadius properties', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('radius-preview-shapes.borderRadius.medium')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-19: Renders ShadowEditor for shadow properties
  // =========================================================================

  it('renders ShadowEditor for shadow properties', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('shadow-editor-shapes.shadow.none')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-editor-shapes.shadow.medium')).toBeInTheDocument();
  });

  it('renders shadow preview box for structured shadow', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('shadow-preview-shapes.shadow.medium')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-20: Renders BorderEditor for border properties
  // =========================================================================

  it('renders BorderEditor for border properties', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('border-editor-shapes.border.thin')).toBeInTheDocument();
    expect(screen.getByTestId('border-editor-shapes.border.medium')).toBeInTheDocument();
  });

  it('renders border preview box', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByTestId('border-preview-shapes.border.thin')).toBeInTheDocument();
  });

  // =========================================================================
  // Section sub-group headings
  // =========================================================================

  it('renders sub-group headings: Border Radius, Shadow, Border', () => {
    render(<TestShapesSection shapes={shapes} />);
    expect(screen.getByText('Border Radius')).toBeInTheDocument();
    expect(screen.getByText('Shadow')).toBeInTheDocument();
    expect(screen.getByText('Border')).toBeInTheDocument();
  });

  // =========================================================================
  // Empty sections handled
  // =========================================================================

  it('handles empty shape records gracefully', () => {
    const emptyShapes: ThemeShapes = {
      borderRadius: {},
      shadow: {},
      border: {},
    };
    render(<TestShapesSection shapes={emptyShapes} />);
    // Should render group headings but no editors
    expect(screen.getByText('Border Radius')).toBeInTheDocument();
    expect(screen.queryByTestId(/border-radius-editor/)).not.toBeInTheDocument();
  });
});
