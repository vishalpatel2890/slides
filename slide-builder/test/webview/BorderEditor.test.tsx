import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { BorderEditor, parseBorder, composeBorder } from '../../src/webview/theme-editor/components/BorderEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for BorderEditor.
 * Story Reference: bt-3-3 Task 3.9 -- AC-20, AC-23
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
    shapes: { borderRadius: {}, shadow: {}, border: { thin: '1px solid #333333' } },
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

function TestBorderEditor(props: {
  label: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <BorderEditor {...props} />
    </ThemeEditorProvider>
  );
}

describe('BorderEditor', () => {
  const defaultProps = {
    label: 'thin',
    value: '1px solid #333333',
    path: 'shapes.border.thin',
    onUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-20: Renders width input + style select + color swatch + preview box
  // =========================================================================

  it('renders width input, style select, color swatch, and preview box', () => {
    render(<TestBorderEditor {...defaultProps} />);
    expect(screen.getByTestId('border-width-shapes.border.thin')).toBeInTheDocument();
    expect(screen.getByTestId('border-style-shapes.border.thin')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-button-shapes.border.thin.__borderColor')).toBeInTheDocument();
    expect(screen.getByTestId('border-preview-shapes.border.thin')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<TestBorderEditor {...defaultProps} />);
    expect(screen.getByText('thin')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-20: Preview box has correct border inline style
  // =========================================================================

  it('preview box has correct border inline style', () => {
    render(<TestBorderEditor {...defaultProps} />);
    const preview = screen.getByTestId('border-preview-shapes.border.thin');
    expect(preview).toHaveStyle({ border: '1px solid #333333' });
  });

  it('preview box is 40x40px', () => {
    render(<TestBorderEditor {...defaultProps} />);
    const preview = screen.getByTestId('border-preview-shapes.border.thin');
    expect(preview).toHaveStyle({ width: '40px', height: '40px' });
  });

  // =========================================================================
  // AC-20: Changing style from "solid" to "dashed" fires onUpdate
  // =========================================================================

  it('changing style from solid to dashed fires onUpdate with correct composed string', () => {
    const onUpdate = vi.fn();
    render(<TestBorderEditor {...defaultProps} onUpdate={onUpdate} />);
    const styleSelect = screen.getByTestId('border-style-shapes.border.thin');
    fireEvent.change(styleSelect, { target: { value: 'dashed' } });
    expect(onUpdate).toHaveBeenCalledWith('shapes.border.thin', '1px dashed #333333');
  });

  it('changing width fires onUpdate', () => {
    const onUpdate = vi.fn();
    render(<TestBorderEditor {...defaultProps} onUpdate={onUpdate} />);
    const widthInput = screen.getByTestId('border-width-shapes.border.thin');
    fireEvent.change(widthInput, { target: { value: '3' } });
    expect(onUpdate).toHaveBeenCalledWith('shapes.border.thin', '3px solid #333333');
  });

  // =========================================================================
  // AC-23: Color swatch renders for border color
  // =========================================================================

  it('color swatch renders for border color (verifies ColorSwatch reuse)', () => {
    render(<TestBorderEditor {...defaultProps} />);
    const swatchButton = screen.getByTestId('swatch-button-shapes.border.thin.__borderColor');
    expect(swatchButton).toBeInTheDocument();
  });

  // =========================================================================
  // Style select has correct options
  // =========================================================================

  it('style select has solid, dashed, dotted, none options', () => {
    render(<TestBorderEditor {...defaultProps} />);
    const select = screen.getByTestId('border-style-shapes.border.thin');
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('solid');
    expect(values).toContain('dashed');
    expect(values).toContain('dotted');
    expect(values).toContain('none');
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestBorderEditor {...defaultProps} />);
    expect(screen.getByTestId('border-editor-shapes.border.thin')).toBeInTheDocument();
  });

  // =========================================================================
  // Border parsing utility tests
  // =========================================================================

  it('parseBorder parses standard shorthand', () => {
    const result = parseBorder('2px dashed #ff0000');
    expect(result).toEqual({ width: 2, style: 'dashed', color: '#ff0000' });
  });

  it('parseBorder handles "none"', () => {
    const result = parseBorder('none');
    expect(result).toEqual({ width: 0, style: 'none', color: '#000000' });
  });

  it('composeBorder produces correct shorthand', () => {
    expect(composeBorder({ width: 2, style: 'solid', color: '#333' })).toBe('2px solid #333');
  });

  it('composeBorder returns "none" for none style', () => {
    expect(composeBorder({ width: 1, style: 'none', color: '#333' })).toBe('none');
  });
});
