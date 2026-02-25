import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { FontWeightEditor } from '../../src/webview/theme-editor/components/FontWeightEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for FontWeightEditor.
 * Story Reference: bt-3-2 Task 2.6 -- AC-14
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
    components: {},
  };
}

// Helper wrapping FontWeightEditor with loaded context
function TestFontWeightEditor(props: {
  label: string;
  value: number;
  path: string;
  onUpdate: (path: string, value: number) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <FontWeightEditor {...props} />
    </ThemeEditorProvider>
  );
}

function Loader() {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme: createFullTheme(), exists: true });
  }, [dispatch]);
  return null;
}

describe('FontWeightEditor', () => {
  const defaultProps = {
    label: 'Bold',
    value: 700,
    path: 'typography.weights.bold',
    onUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-14: Renders select with common weight options
  // =========================================================================

  it('renders select dropdown with common weight options', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    const select = screen.getByTestId('weight-select-typography.weights.bold');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');

    // Common weights should be available as options
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('300');
    expect(values).toContain('400');
    expect(values).toContain('500');
    expect(values).toContain('600');
    expect(values).toContain('700');
  });

  it('renders label text', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-14: Preview text has correct fontWeight inline style
  // =========================================================================

  it('preview text has correct fontWeight inline style', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    const preview = screen.getByTestId('weight-preview-typography.weights.bold');
    expect(preview).toHaveStyle({ fontWeight: 700 });
  });

  it('renders preview text', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    expect(screen.getByText('The quick brown fox')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-14: Selecting a different weight fires onUpdate
  // =========================================================================

  it('selecting a different weight fires onUpdate with correct path and value', () => {
    const onUpdate = vi.fn();
    render(<TestFontWeightEditor {...defaultProps} onUpdate={onUpdate} />);
    const select = screen.getByTestId('weight-select-typography.weights.bold');
    fireEvent.change(select, { target: { value: '600' } });
    expect(onUpdate).toHaveBeenCalledWith('typography.weights.bold', 600);
  });

  // =========================================================================
  // Custom number input works for non-standard weights
  // =========================================================================

  it('custom number input changes fire onUpdate', () => {
    const onUpdate = vi.fn();
    render(<TestFontWeightEditor {...defaultProps} onUpdate={onUpdate} />);
    const numberInput = screen.getByTestId('weight-number-typography.weights.bold');
    fireEvent.change(numberInput, { target: { value: '500' } });
    expect(onUpdate).toHaveBeenCalledWith('typography.weights.bold', 500);
  });

  it('number input shows current value', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    const numberInput = screen.getByTestId('weight-number-typography.weights.bold') as HTMLInputElement;
    expect(numberInput.value).toBe('700');
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestFontWeightEditor {...defaultProps} />);
    expect(screen.getByTestId('font-weight-editor-typography.weights.bold')).toBeInTheDocument();
  });

  // =========================================================================
  // Non-standard weight shows "Custom" in select
  // =========================================================================

  it('non-standard weight (e.g., 450) shows custom option in select', () => {
    render(<TestFontWeightEditor {...defaultProps} value={450} />);
    const select = screen.getByTestId('weight-select-typography.weights.bold') as HTMLSelectElement;
    expect(select.value).toBe('custom');
  });
});
