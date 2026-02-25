import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { BorderRadiusEditor } from '../../src/webview/theme-editor/components/BorderRadiusEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for BorderRadiusEditor.
 * Story Reference: bt-3-3 Task 1.6 -- AC-17, AC-18
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
    shapes: { borderRadius: { medium: '8px' }, shadow: {}, border: {} },
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

function TestBorderRadiusEditor(props: {
  label: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <BorderRadiusEditor {...props} />
    </ThemeEditorProvider>
  );
}

describe('BorderRadiusEditor', () => {
  const defaultProps = {
    label: 'medium',
    value: '8px',
    path: 'shapes.borderRadius.medium',
    onUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-17: Renders number input + preview box
  // =========================================================================

  it('renders number input and preview box', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    const input = screen.getByTestId('radius-input-shapes.borderRadius.medium');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');

    const preview = screen.getByTestId('radius-preview-shapes.borderRadius.medium');
    expect(preview).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders px suffix text', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    expect(screen.getByText('px')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-17: Preview box has correct borderRadius inline style
  // =========================================================================

  it('preview box has correct borderRadius inline style', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    const preview = screen.getByTestId('radius-preview-shapes.borderRadius.medium');
    expect(preview).toHaveStyle({ borderRadius: '8px' });
  });

  it('preview box is 40x40px', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    const preview = screen.getByTestId('radius-preview-shapes.borderRadius.medium');
    expect(preview).toHaveStyle({ width: '40px', height: '40px' });
  });

  // =========================================================================
  // AC-18: Changing input value fires onUpdate
  // =========================================================================

  it('changing input value fires onUpdate with px suffix', () => {
    const onUpdate = vi.fn();
    render(<TestBorderRadiusEditor {...defaultProps} onUpdate={onUpdate} />);
    const input = screen.getByTestId('radius-input-shapes.borderRadius.medium');
    fireEvent.change(input, { target: { value: '16' } });
    expect(onUpdate).toHaveBeenCalledWith('shapes.borderRadius.medium', '16px');
  });

  // =========================================================================
  // AC-18: Preview box updates when value prop changes
  // =========================================================================

  it('preview box updates when value prop changes', () => {
    const { rerender } = render(<TestBorderRadiusEditor {...defaultProps} />);
    let preview = screen.getByTestId('radius-preview-shapes.borderRadius.medium');
    expect(preview).toHaveStyle({ borderRadius: '8px' });

    rerender(<TestBorderRadiusEditor {...defaultProps} value="16px" />);
    preview = screen.getByTestId('radius-preview-shapes.borderRadius.medium');
    expect(preview).toHaveStyle({ borderRadius: '16px' });
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestBorderRadiusEditor {...defaultProps} />);
    expect(screen.getByTestId('border-radius-editor-shapes.borderRadius.medium')).toBeInTheDocument();
  });

  it('number input shows numeric value parsed from px string', () => {
    render(<TestBorderRadiusEditor {...defaultProps} value="12px" />);
    const input = screen.getByTestId('radius-input-shapes.borderRadius.medium') as HTMLInputElement;
    expect(input.value).toBe('12');
  });
});
