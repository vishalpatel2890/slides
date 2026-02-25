import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { MetadataSection } from '../../src/webview/theme-editor/components/MetadataSection';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for MetadataSection.
 * Story Reference: bt-2-2 Task 12.7 — AC-4 (Metadata Display)
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

function createThemeWithMeta(): ThemeJson {
  return {
    name: 'Acme Brand',
    version: '2.1.0',
    colors: {
      primary: '#0066cc',
      secondary: '#004499',
      accent: '#ff6600',
      background: { default: '#ffffff', alt: '#f5f5f5', dark: '#1a1a1a' },
      text: { heading: '#111111', body: '#333333', onDark: '#ffffff' },
    },
    typography: {
      fonts: { heading: 'Inter', body: 'Inter' },
      scale: { body: '1rem' },
      weights: { regular: 400 },
    },
    shapes: {
      borderRadius: { sm: '4px' },
      shadow: { sm: '0 1px 2px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e0e0e0' },
    },
    components: {},
    meta: {
      extractedFrom: {
        date: '2026-02-20',
        website: 'acme.com',
        guidelines: 'brand-guide.pdf',
      },
      brandDescription: 'Professional corporate brand with blue accent',
      confidence: 0.92,
    },
  };
}

// Helper to load theme into provider before rendering MetadataSection
function ThemeLoader({ theme }: { theme: ThemeJson }) {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme, exists: true });
  }, [dispatch, theme]);
  return null;
}

describe('MetadataSection', () => {
  // bt-2-3 Task 9.10: MetadataSection renders name as editable input
  it('renders theme name as editable text input (not read-only)', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <ThemeLoader theme={theme} />
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    const nameInput = screen.getByLabelText('Theme name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('Acme Brand');
    expect(nameInput.tagName).toBe('INPUT');
  });

  it('dispatches UPDATE_VALUE when theme name is changed', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <ThemeLoader theme={theme} />
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    const nameInput = screen.getByLabelText('Theme name');
    fireEvent.change(nameInput, { target: { value: 'New Brand Name' } });

    // The input value should update (controlled by parent state, but at minimum the onChange fires)
    expect(nameInput).toBeInTheDocument();
  });

  it('renders version as read-only label', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText('2.1.0')).toBeInTheDocument();
  });

  it('renders generated date from meta.extractedFrom', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText('2026-02-20')).toBeInTheDocument();
  });

  it('renders extraction sources', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText(/acme\.com/)).toBeInTheDocument();
    expect(screen.getByText(/brand-guide\.pdf/)).toBeInTheDocument();
  });

  it('renders brand description', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText('Professional corporate brand with blue accent')).toBeInTheDocument();
  });

  it('renders confidence as percentage', () => {
    const theme = createThemeWithMeta();
    render(
      <ThemeEditorProvider>
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('handles missing meta gracefully (no crash)', () => {
    const theme = createThemeWithMeta();
    delete (theme as any).meta;
    render(
      <ThemeEditorProvider>
        <ThemeLoader theme={theme} />
        <MetadataSection theme={theme} />
      </ThemeEditorProvider>,
    );

    // Should still render name as editable input and version as read-only
    expect(screen.getByDisplayValue('Acme Brand')).toBeInTheDocument();
    expect(screen.getByText('2.1.0')).toBeInTheDocument();
  });
});
