import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { TypeScaleEditor } from '../../src/webview/theme-editor/components/TypeScaleEditor';
import type { TypeScaleEntry } from '../../src/webview/theme-editor/components/TypeScaleEditor';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for TypeScaleEditor.
 * Story Reference: bt-3-2 Task 3.7 -- AC-15, AC-16
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
      fonts: { heading: 'Inter', body: 'Roboto' },
      scale: { hero: '3rem', h1: '2rem', h2: '1.5rem', body: '1rem', small: '0.875rem' },
      weights: { bold: 700, regular: 400 },
    },
    shapes: { borderRadius: {}, shadow: {}, border: {} },
    components: {},
  };
}

const mockEntries: TypeScaleEntry[] = [
  { key: 'hero', value: '3rem', path: 'typography.scale.hero' },
  { key: 'h1', value: '2rem', path: 'typography.scale.h1' },
  { key: 'h2', value: '1.5rem', path: 'typography.scale.h2' },
  { key: 'body', value: '1rem', path: 'typography.scale.body' },
  { key: 'small', value: '0.875rem', path: 'typography.scale.small' },
];

// Helper wrapping TypeScaleEditor with loaded context
function TestTypeScaleEditor(props: {
  entries: TypeScaleEntry[];
  headingFont: string;
  bodyFont: string;
  onUpdate: (path: string, value: string) => void;
}) {
  return (
    <ThemeEditorProvider>
      <Loader />
      <TypeScaleEditor {...props} />
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

describe('TypeScaleEditor', () => {
  const defaultProps = {
    entries: mockEntries,
    headingFont: 'Inter',
    bodyFont: 'Roboto',
    onUpdate: vi.fn(),
  };

  // =========================================================================
  // AC-15: Renders entries with labels, size inputs, and preview text
  // =========================================================================

  it('renders all scale entries', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);
    expect(screen.getByTestId('scale-entry-hero')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-h1')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-h2')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-body')).toBeInTheDocument();
    expect(screen.getByTestId('scale-entry-small')).toBeInTheDocument();
  });

  it('renders size inputs with current values', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);
    expect(screen.getByDisplayValue('3rem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2rem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.5rem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1rem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.875rem')).toBeInTheDocument();
  });

  it('renders preview text for each entry', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);
    const previews = screen.getAllByText('The quick brown fox');
    expect(previews.length).toBe(5);
  });

  // =========================================================================
  // AC-15: Preview text has correct fontSize inline style
  // =========================================================================

  it('preview text has correct fontSize inline style', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);
    const heroPreview = screen.getByTestId('scale-preview-hero');
    expect(heroPreview).toHaveStyle({ fontSize: '3rem' });

    const h1Preview = screen.getByTestId('scale-preview-h1');
    expect(h1Preview).toHaveStyle({ fontSize: '2rem' });

    const bodyPreview = screen.getByTestId('scale-preview-body');
    expect(bodyPreview).toHaveStyle({ fontSize: '1rem' });

    const smallPreview = screen.getByTestId('scale-preview-small');
    expect(smallPreview).toHaveStyle({ fontSize: '0.875rem' });
  });

  // =========================================================================
  // AC-16: Heading entries use heading font; body entries use body font
  // =========================================================================

  it('heading-level entries use heading font in preview', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);

    const heroPreview = screen.getByTestId('scale-preview-hero');
    expect(heroPreview).toHaveStyle({ fontFamily: '"Inter", sans-serif' });

    const h1Preview = screen.getByTestId('scale-preview-h1');
    expect(h1Preview).toHaveStyle({ fontFamily: '"Inter", sans-serif' });

    const h2Preview = screen.getByTestId('scale-preview-h2');
    expect(h2Preview).toHaveStyle({ fontFamily: '"Inter", sans-serif' });
  });

  it('body-level entries use body font in preview', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);

    const bodyPreview = screen.getByTestId('scale-preview-body');
    expect(bodyPreview).toHaveStyle({ fontFamily: '"Roboto", sans-serif' });

    const smallPreview = screen.getByTestId('scale-preview-small');
    expect(smallPreview).toHaveStyle({ fontFamily: '"Roboto", sans-serif' });
  });

  // =========================================================================
  // AC-15: Changing a size value fires onUpdate
  // =========================================================================

  it('changing a size value fires onUpdate with correct path and new value', () => {
    const onUpdate = vi.fn();
    render(<TestTypeScaleEditor {...defaultProps} onUpdate={onUpdate} />);
    const heroInput = screen.getByDisplayValue('3rem');
    fireEvent.change(heroInput, { target: { value: '4rem' } });
    expect(onUpdate).toHaveBeenCalledWith('typography.scale.hero', '4rem');
  });

  // =========================================================================
  // Container test
  // =========================================================================

  it('renders container with correct test id', () => {
    render(<TestTypeScaleEditor {...defaultProps} />);
    expect(screen.getByTestId('type-scale-editor')).toBeInTheDocument();
  });
});
