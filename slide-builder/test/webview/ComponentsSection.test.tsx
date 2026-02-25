import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ComponentsSection } from '../../src/webview/theme-editor/components/ComponentsSection';
import type { ThemeJson, ThemeComponents } from '../../src/shared/types';

/**
 * Component tests for ComponentsSection (upgraded with visual editors).
 * Story Reference: bt-3-3 Task 7.6 -- AC-21, AC-22, AC-23
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
    shapes: { borderRadius: {}, shadow: {}, border: {} },
    components: {
      box: {
        default: {
          borderRadius: '8px',
          shadow: '0px 2px 4px 0px #00000020',
          border: '1px solid #333',
          background: '#ffffff',
          color: '#333333',
        },
      },
      arrow: {
        default: { strokeWidth: 2, color: '#333333', headType: 'triangle' },
      },
    },
  };
}

function Loader() {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme: createFullTheme(), exists: true });
  }, [dispatch]);
  return null;
}

function TestComponentsSection(props: { components: ThemeComponents }) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <ComponentsSection {...props} />
    </ThemeEditorProvider>
  );
}

describe('ComponentsSection', () => {
  const components: ThemeComponents = {
    box: {
      default: {
        borderRadius: '8px',
        shadow: '0px 2px 4px 0px #00000020',
        border: '1px solid #333',
        background: '#ffffff',
        color: '#333333',
      },
    },
    arrow: {
      default: { strokeWidth: 2, color: '#333333', headType: 'triangle' },
    },
  };

  // =========================================================================
  // AC-21: Renders BoxStyleEditor for box variants
  // =========================================================================

  it('renders BoxStyleEditor for box variants', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('box-style-editor-components.box.default')).toBeInTheDocument();
  });

  it('renders box preview box with combined styles', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('box-preview-components.box.default')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-22: Renders ArrowStyleEditor for arrow variants
  // =========================================================================

  it('renders ArrowStyleEditor for arrow variants', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('arrow-style-editor-components.arrow.default')).toBeInTheDocument();
  });

  it('renders arrow stroke width input and head type select', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('arrow-stroke-components.arrow.default')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-head-type-components.arrow.default')).toBeInTheDocument();
  });

  // =========================================================================
  // Section sub-group headings
  // =========================================================================

  it('renders sub-group headings: Box Styles and Arrow Styles', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByText('Box Styles')).toBeInTheDocument();
    expect(screen.getByText('Arrow Styles')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-23: Color swatches present in both box and arrow editors
  // =========================================================================

  it('renders ColorSwatch for box background and text color', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('swatch-button-components.box.default.__bgColor')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-button-components.box.default.__textColor')).toBeInTheDocument();
  });

  it('renders ColorSwatch for arrow color', () => {
    render(<TestComponentsSection components={components} />);
    expect(screen.getByTestId('swatch-button-components.arrow.default.__arrowColor')).toBeInTheDocument();
  });

  // =========================================================================
  // Empty components handled gracefully
  // =========================================================================

  it('shows "No component styles defined" when no component types present', () => {
    render(<TestComponentsSection components={{}} />);
    expect(screen.getByText('No component styles defined.')).toBeInTheDocument();
  });

  it('handles missing box section gracefully', () => {
    const arrowOnly: ThemeComponents = {
      arrow: { default: { strokeWidth: 2, color: '#333', headType: 'triangle' } },
    };
    render(<TestComponentsSection components={arrowOnly} />);
    expect(screen.queryByText('Box Styles')).not.toBeInTheDocument();
    expect(screen.getByText('Arrow Styles')).toBeInTheDocument();
  });

  it('handles missing arrow section gracefully', () => {
    const boxOnly: ThemeComponents = {
      box: { default: { borderRadius: '8px' } },
    };
    render(<TestComponentsSection components={boxOnly} />);
    expect(screen.getByText('Box Styles')).toBeInTheDocument();
    expect(screen.queryByText('Arrow Styles')).not.toBeInTheDocument();
  });
});
