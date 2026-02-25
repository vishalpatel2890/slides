import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { FontFamilyEditor } from '../../src/webview/theme-editor/components/FontFamilyEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for FontFamilyEditor.
 * Story Reference: bt-3-2 Task 1.7 -- AC-11, AC-12, AC-13
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
      fonts: { heading: 'Inter', body: 'Roboto', mono: 'Fira Code' },
      scale: { hero: '3rem', h1: '2rem', body: '1rem' },
      weights: { bold: 700, regular: 400 },
    },
    shapes: { borderRadius: {}, shadow: {}, border: {} },
    components: {},
  };
}

// Helper wrapping FontFamilyEditor with loaded context
function TestFontFamilyEditor(props: {
  label: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <FontFamilyEditor {...props} />
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

describe('FontFamilyEditor', () => {
  const defaultProps = {
    label: 'Heading',
    value: 'Inter',
    path: 'typography.fonts.heading',
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
  // AC-11: Renders text input + preview text
  // =========================================================================

  it('renders text input with font family value', () => {
    render(<TestFontFamilyEditor {...defaultProps} />);
    const input = screen.getByDisplayValue('Inter');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders preview text with sample sentence', () => {
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.getByText('The quick brown fox jumps over the lazy dog')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.getByText('Heading')).toBeInTheDocument();
  });

  // =========================================================================
  // AC-11: Preview text has correct fontFamily inline style
  // =========================================================================

  it('preview text has correct fontFamily inline style', () => {
    render(<TestFontFamilyEditor {...defaultProps} />);
    const preview = screen.getByTestId('font-preview-typography.fonts.heading');
    expect(preview).toHaveStyle({ fontFamily: '"Inter", sans-serif' });
  });

  // =========================================================================
  // AC-12: Changing input fires onUpdate
  // =========================================================================

  it('changing input fires onUpdate with path and new value', () => {
    const onUpdate = vi.fn();
    render(<TestFontFamilyEditor {...defaultProps} onUpdate={onUpdate} />);
    const input = screen.getByDisplayValue('Inter');
    fireEvent.change(input, { target: { value: 'Georgia' } });
    expect(onUpdate).toHaveBeenCalledWith('typography.fonts.heading', 'Georgia');
  });

  // =========================================================================
  // AC-13: Font availability detection
  // =========================================================================

  it('shows fallback indicator when document.fonts.check returns false', () => {
    (document.fonts.check as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<TestFontFamilyEditor {...defaultProps} value="NonExistentFontXYZ" />);
    expect(screen.getByTestId('font-unavailable-typography.fonts.heading')).toBeInTheDocument();
    expect(screen.getByText('(font may not be available locally)')).toBeInTheDocument();
  });

  it('does not show fallback indicator when font is available', () => {
    (document.fonts.check as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.queryByTestId('font-unavailable-typography.fonts.heading')).not.toBeInTheDocument();
  });

  it('does not show fallback indicator when document.fonts.check throws', () => {
    (document.fonts.check as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('API unavailable');
    });
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.queryByTestId('font-unavailable-typography.fonts.heading')).not.toBeInTheDocument();
  });

  it('does not show fallback indicator when document.fonts is undefined', () => {
    Object.defineProperty(document, 'fonts', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.queryByTestId('font-unavailable-typography.fonts.heading')).not.toBeInTheDocument();
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestFontFamilyEditor {...defaultProps} />);
    expect(screen.getByTestId('font-family-editor-typography.fonts.heading')).toBeInTheDocument();
  });
});
