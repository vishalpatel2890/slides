import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ShadowEditor, parseShadow, composeShadow } from '../../src/webview/theme-editor/components/ShadowEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for ShadowEditor.
 * Story Reference: bt-3-3 Task 2.9 -- AC-19, AC-23
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
    shapes: { borderRadius: {}, shadow: { medium: '0px 4px 6px 0px #00000040' }, border: {} },
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

function TestShadowEditor(props: {
  label: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <ShadowEditor {...props} />
    </ThemeEditorProvider>
  );
}

describe('ShadowEditor', () => {
  const defaultProps = {
    label: 'medium',
    value: '0px 4px 6px 0px #00000040',
    path: 'shapes.shadow.medium',
    onUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-19: Renders component inputs + preview box for valid shadow string
  // =========================================================================

  it('renders component inputs for valid shadow string', () => {
    render(<TestShadowEditor {...defaultProps} />);
    expect(screen.getByTestId('shadow-x-shapes.shadow.medium')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-y-shapes.shadow.medium')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-blur-shapes.shadow.medium')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-spread-shapes.shadow.medium')).toBeInTheDocument();
  });

  it('renders preview box', () => {
    render(<TestShadowEditor {...defaultProps} />);
    const preview = screen.getByTestId('shadow-preview-shapes.shadow.medium');
    expect(preview).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<TestShadowEditor {...defaultProps} />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-19: Preview box has correct boxShadow inline style
  // =========================================================================

  it('preview box has correct boxShadow inline style', () => {
    render(<TestShadowEditor {...defaultProps} />);
    const preview = screen.getByTestId('shadow-preview-shapes.shadow.medium');
    expect(preview).toHaveStyle({ boxShadow: '0px 4px 6px 0px #00000040' });
  });

  it('preview box is 40x40px', () => {
    render(<TestShadowEditor {...defaultProps} />);
    const preview = screen.getByTestId('shadow-preview-shapes.shadow.medium');
    expect(preview).toHaveStyle({ width: '40px', height: '40px' });
  });

  // =========================================================================
  // AC-19: Changing blur value recomposes shadow string and fires onUpdate
  // =========================================================================

  it('changing blur value recomposes shadow string and fires onUpdate', () => {
    const onUpdate = vi.fn();
    render(<TestShadowEditor {...defaultProps} onUpdate={onUpdate} />);
    const blurInput = screen.getByTestId('shadow-blur-shapes.shadow.medium');
    fireEvent.change(blurInput, { target: { value: '10' } });
    expect(onUpdate).toHaveBeenCalledWith('shapes.shadow.medium', '0px 4px 10px 0px #00000040');
  });

  // =========================================================================
  // AC-23: Color swatch renders for shadow color (verifies ColorSwatch reuse)
  // =========================================================================

  it('color swatch renders for shadow color', () => {
    render(<TestShadowEditor {...defaultProps} />);
    // ColorSwatch renders with a swatch-button test id
    const swatchButton = screen.getByTestId('swatch-button-shapes.shadow.medium.__shadowColor');
    expect(swatchButton).toBeInTheDocument();
  });

  // =========================================================================
  // Falls back to text input for unrecognized shadow format
  // =========================================================================

  it('falls back to text input for unrecognized shadow format', () => {
    render(
      <TestShadowEditor
        {...defaultProps}
        value="inset 0 0 10px rgba(0,0,0,0.5)"
      />,
    );
    const fallback = screen.getByTestId('shadow-fallback-shapes.shadow.medium');
    expect(fallback).toBeInTheDocument();
    expect(fallback.tagName).toBe('INPUT');
    expect((fallback as HTMLInputElement).type).toBe('text');
  });

  it('fallback text input fires onUpdate on change', () => {
    const onUpdate = vi.fn();
    render(
      <TestShadowEditor
        {...defaultProps}
        value="inset 0 0 10px rgba(0,0,0,0.5)"
        onUpdate={onUpdate}
      />,
    );
    const fallback = screen.getByTestId('shadow-fallback-shapes.shadow.medium');
    fireEvent.change(fallback, { target: { value: 'none' } });
    expect(onUpdate).toHaveBeenCalledWith('shapes.shadow.medium', 'none');
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestShadowEditor {...defaultProps} />);
    expect(screen.getByTestId('shadow-editor-shapes.shadow.medium')).toBeInTheDocument();
  });

  // =========================================================================
  // Shadow parsing utility tests
  // =========================================================================

  it('parseShadow parses common 4-component format', () => {
    const result = parseShadow('0px 4px 6px 0px #00000040');
    expect(result).toEqual({ x: 0, y: 4, blur: 6, spread: 0, color: '#00000040' });
  });

  it('parseShadow parses 3-component format (no spread)', () => {
    const result = parseShadow('2px 3px 8px #333');
    expect(result).toEqual({ x: 2, y: 3, blur: 8, spread: 0, color: '#333' });
  });

  it('parseShadow returns null for unrecognized format', () => {
    expect(parseShadow('inset 0 0 10px rgba(0,0,0,0.5)')).toBeNull();
  });

  it('parseShadow handles "none" as zero shadow', () => {
    const result = parseShadow('none');
    expect(result).toEqual({ x: 0, y: 0, blur: 0, spread: 0, color: '#000000' });
  });

  it('round-trip: parse then compose produces valid CSS shadow', () => {
    const original = '2px 4px 8px 1px #ff0000';
    const parsed = parseShadow(original);
    expect(parsed).not.toBeNull();
    const composed = composeShadow(parsed!);
    expect(composed).toBe('2px 4px 8px 1px #ff0000');
  });
});
