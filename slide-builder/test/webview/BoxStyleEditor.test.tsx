import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { BoxStyleEditor } from '../../src/webview/theme-editor/components/BoxStyleEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for BoxStyleEditor.
 * Story Reference: bt-3-3 Task 4.6 -- AC-21, AC-23
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

function TestBoxStyleEditor(props: {
  variant: string;
  styles: Record<string, string | undefined>;
  basePath: string;
  onTextUpdate: (path: string, value: string) => void;
  onNumberUpdate: (path: string, value: number) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <BoxStyleEditor {...props} />
    </ThemeEditorProvider>
  );
}

describe('BoxStyleEditor', () => {
  const defaultStyles: Record<string, string | undefined> = {
    borderRadius: '8px',
    shadow: '0px 2px 4px 0px #00000020',
    border: '1px solid #333',
    background: '#ffffff',
    color: '#333333',
  };

  const defaultProps = {
    variant: 'default',
    styles: defaultStyles,
    basePath: 'components.box.default',
    onTextUpdate: vi.fn(),
    onNumberUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-21: Renders grouped property controls for each box style property
  // =========================================================================

  it('renders property controls for borderRadius, shadow, border, background, color', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('box-radius-components.box.default')).toBeInTheDocument();
    expect(screen.getByTestId('box-shadow-components.box.default')).toBeInTheDocument();
    expect(screen.getByTestId('box-border-components.box.default')).toBeInTheDocument();
    // Background and color use ColorSwatch
    expect(screen.getByTestId('swatch-button-components.box.default.__bgColor')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-button-components.box.default.__textColor')).toBeInTheDocument();
  });

  it('renders variant title', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-21: Preview box has correct combined inline styles
  // =========================================================================

  it('preview box has correct combined inline styles', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    const preview = screen.getByTestId('box-preview-components.box.default');
    expect(preview).toHaveStyle({
      borderRadius: '8px',
      boxShadow: '0px 2px 4px 0px #00000020',
      border: '1px solid #333',
      backgroundColor: '#ffffff',
      color: '#333333',
    });
  });

  it('preview box is 60x40px', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    const preview = screen.getByTestId('box-preview-components.box.default');
    expect(preview).toHaveStyle({ width: '60px', height: '40px' });
  });

  // =========================================================================
  // AC-21: Changing borderRadius fires onNumberUpdate with correct basePath
  // =========================================================================

  it('changing borderRadius fires onNumberUpdate with correct path', () => {
    const onNumberUpdate = vi.fn();
    render(<TestBoxStyleEditor {...defaultProps} onNumberUpdate={onNumberUpdate} />);
    const radiusInput = screen.getByTestId('box-radius-components.box.default');
    fireEvent.change(radiusInput, { target: { value: '12' } });
    expect(onNumberUpdate).toHaveBeenCalledWith('components.box.default.borderRadius', 12);
  });

  // =========================================================================
  // AC-23: Color properties use ColorSwatch (verifies reuse from BT-3.1)
  // =========================================================================

  it('background and color properties use ColorSwatch', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('swatch-button-components.box.default.__bgColor')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-button-components.box.default.__textColor')).toBeInTheDocument();
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestBoxStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('box-style-editor-components.box.default')).toBeInTheDocument();
  });

  // =========================================================================
  // Handles missing properties gracefully
  // =========================================================================

  it('handles missing optional properties gracefully', () => {
    render(
      <TestBoxStyleEditor
        {...defaultProps}
        styles={{ borderRadius: '4px' }}
      />,
    );
    expect(screen.getByTestId('box-radius-components.box.default')).toBeInTheDocument();
    // Shadow, border, bg, color should not be rendered
    expect(screen.queryByTestId('box-shadow-components.box.default')).not.toBeInTheDocument();
    expect(screen.queryByTestId('box-border-components.box.default')).not.toBeInTheDocument();
  });
});
