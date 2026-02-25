import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ArrowStyleEditor } from '../../src/webview/theme-editor/components/ArrowStyleEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for ArrowStyleEditor.
 * Story Reference: bt-3-3 Task 5.7 -- AC-22, AC-23
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

function TestArrowStyleEditor(props: {
  variant: string;
  styles: { strokeWidth?: number; color?: string; headType?: string; curveStyle?: string };
  basePath: string;
  onTextUpdate: (path: string, value: string) => void;
  onNumberUpdate: (path: string, value: number) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <ArrowStyleEditor {...props} />
    </ThemeEditorProvider>
  );
}

describe('ArrowStyleEditor', () => {
  const defaultProps = {
    variant: 'default',
    styles: { strokeWidth: 2, color: '#333333', headType: 'triangle' as string },
    basePath: 'components.arrow.default',
    onTextUpdate: vi.fn(),
    onNumberUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-22: Renders stroke width input + head type select + color swatch
  // =========================================================================

  it('renders stroke width input, head type select, and color swatch', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('arrow-stroke-components.arrow.default')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-head-type-components.arrow.default')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-button-components.arrow.default.__arrowColor')).toBeInTheDocument();
  });

  it('renders variant title', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-22: Selecting different head type fires onTextUpdate
  // =========================================================================

  it('selecting different head type fires onTextUpdate', () => {
    const onTextUpdate = vi.fn();
    render(<TestArrowStyleEditor {...defaultProps} onTextUpdate={onTextUpdate} />);
    const select = screen.getByTestId('arrow-head-type-components.arrow.default');
    fireEvent.change(select, { target: { value: 'open' } });
    expect(onTextUpdate).toHaveBeenCalledWith('components.arrow.default.headType', 'open');
  });

  // =========================================================================
  // AC-22: Changing stroke width fires onNumberUpdate
  // =========================================================================

  it('changing stroke width fires onNumberUpdate', () => {
    const onNumberUpdate = vi.fn();
    render(<TestArrowStyleEditor {...defaultProps} onNumberUpdate={onNumberUpdate} />);
    const input = screen.getByTestId('arrow-stroke-components.arrow.default');
    fireEvent.change(input, { target: { value: '4' } });
    expect(onNumberUpdate).toHaveBeenCalledWith('components.arrow.default.strokeWidth', 4);
  });

  // =========================================================================
  // AC-23: Color swatch renders for arrow color
  // =========================================================================

  it('color swatch renders for arrow color (verifies ColorSwatch reuse)', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('swatch-button-components.arrow.default.__arrowColor')).toBeInTheDocument();
  });

  // =========================================================================
  // Head type select has correct options
  // =========================================================================

  it('head type select has triangle, open, stealth options', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    const select = screen.getByTestId('arrow-head-type-components.arrow.default');
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('triangle');
    expect(values).toContain('open');
    expect(values).toContain('stealth');
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    expect(screen.getByTestId('arrow-style-editor-components.arrow.default')).toBeInTheDocument();
  });

  // =========================================================================
  // Stroke width shows current value
  // =========================================================================

  it('stroke width input shows current value', () => {
    render(<TestArrowStyleEditor {...defaultProps} />);
    const input = screen.getByTestId('arrow-stroke-components.arrow.default') as HTMLInputElement;
    expect(input.value).toBe('2');
  });
});
