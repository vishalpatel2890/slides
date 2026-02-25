import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { ThemeEditorLayout } from '../../src/webview/theme-editor/components/ThemeEditorLayout';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for ThemeEditorLayout.
 * Story Reference: bt-2-2 Task 12.6, 12.9
 */

// Mock acquireVsCodeApi for webview tests
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

function createFullTheme(): ThemeJson {
  return {
    name: 'Test Theme',
    version: '1.0.0',
    colors: {
      primary: '#0066cc',
      secondary: '#004499',
      accent: '#ff6600',
      background: { default: '#ffffff', alt: '#f5f5f5', dark: '#1a1a1a' },
      text: { heading: '#111111', body: '#333333', onDark: '#ffffff' },
    },
    typography: {
      fonts: { heading: 'Inter', body: 'Inter' },
      scale: { h1: '2.5rem', body: '1rem' },
      weights: { regular: 400, bold: 700 },
    },
    shapes: {
      borderRadius: { sm: '4px', md: '8px' },
      shadow: { sm: '0 1px 2px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e0e0e0' },
    },
    components: {
      box: { default: { background: '#ffffff' } },
    },
    workflowRules: {
      rhythm: {
        defaultMode: 'auto',
        maxConsecutiveDark: 2,
        maxConsecutiveLight: 3,
        forceBreakAfter: 5,
      },
    },
  };
}

// Helper component that loads theme data and then renders the layout
function TestLayout({ theme, exists = true }: { theme: ThemeJson | null; exists?: boolean }) {
  return (
    <ThemeEditorProvider>
      <ThemeLoader theme={theme} exists={exists} />
      <ThemeEditorLayout />
    </ThemeEditorProvider>
  );
}

function ThemeLoader({ theme, exists }: { theme: ThemeJson | null; exists: boolean }) {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme, exists });
  }, [dispatch, theme, exists]);
  return null;
}

// =============================================================================
// Tests
// =============================================================================

describe('ThemeEditorLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // bt-3-2: FontFamilyEditor uses document.fonts.check() for availability detection
    Object.defineProperty(document, 'fonts', {
      value: { check: vi.fn().mockReturnValue(true) },
      writable: true,
      configurable: true,
    });
  });

  // bt-2-2 Task 12.6: ThemeEditorLayout renders all 6 sections when full theme provided
  it('renders all 6 section headers when full theme is provided', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Slide Rhythm')).toBeInTheDocument();
  });

  it('shows loading state when theme is null (before THEME_LOADED)', () => {
    render(
      <ThemeEditorProvider>
        <ThemeEditorLayout />
      </ThemeEditorProvider>,
    );

    expect(screen.getByText('Loading theme...')).toBeInTheDocument();
  });

  // bt-2-4 Task 6: OnboardingState renders instead of old "No Theme Found"
  it('shows OnboardingState when theme is null after THEME_LOADED with exists=false', () => {
    render(<TestLayout theme={null} exists={false} />);

    expect(screen.getByText('No brand theme found')).toBeInTheDocument();
    expect(screen.getByText('Set Up Brand')).toBeInTheDocument();
  });

  // bt-2-2 Task 12.9: Missing optional sections handled gracefully
  it('hides Slide Rhythm section when workflowRules is undefined', () => {
    const theme = createFullTheme();
    delete theme.workflowRules;
    render(<TestLayout theme={theme} />);

    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    // Slide Rhythm should NOT be in the document
    expect(screen.queryByText('Slide Rhythm')).not.toBeInTheDocument();
  });

  // bt-4-1 AC-1: Only metadata expanded by default after THEME_LOADED
  it('opens with only Metadata section expanded (bt-4-1 AC-1)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    const metadataHeader = screen.getByText('Metadata').closest('button')!;
    const colorsHeader = screen.getByText('Colors').closest('button')!;
    const typographyHeader = screen.getByText('Typography').closest('button')!;
    const shapesHeader = screen.getByText('Shapes').closest('button')!;
    const componentsHeader = screen.getByText('Components').closest('button')!;

    // Metadata is expanded, all others collapsed
    expect(metadataHeader).toHaveAttribute('aria-expanded', 'true');
    expect(colorsHeader).toHaveAttribute('aria-expanded', 'false');
    expect(typographyHeader).toHaveAttribute('aria-expanded', 'false');
    expect(shapesHeader).toHaveAttribute('aria-expanded', 'false');
    expect(componentsHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapses and expands section on header click (AC-5)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    const colorsHeader = screen.getByText('Colors');
    const button = colorsHeader.closest('button')!;

    // Initially collapsed (bt-4-1 default)
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  // bt-2-3: Theme name is now an editable input, not a text label
  it('renders theme name in metadata section as editable input', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    expect(screen.getByDisplayValue('Test Theme')).toBeInTheDocument();
  });

  it('renders color values as swatches', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    // bt-3-1: Colors now render as swatches (text display) not text inputs
    // bt-4-3: Compact swatches show labels below, not hex text inline
    expect(screen.getByTestId('color-swatch-colors.primary')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-preview-colors.primary')).toHaveStyle({ width: '28px', height: '28px' });
  });

  // bt-4-1 Task 5.7: ThemeEditorLayout renders Expand All and Collapse All buttons
  it('renders Expand All and Collapse All buttons in toolbar (bt-4-1 AC-3, AC-4)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    expect(screen.getByLabelText('Expand All')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse All')).toBeInTheDocument();
  });

  // bt-4-1 Task 5.8: Clicking Expand All button expands all sections
  it('clicking Expand All expands all sections (bt-4-1 AC-3)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    // Initially only Metadata expanded
    expect(screen.getByText('Colors').closest('button')).toHaveAttribute('aria-expanded', 'false');

    // Click Expand All
    fireEvent.click(screen.getByLabelText('Expand All'));

    // All sections should now be expanded
    expect(screen.getByText('Metadata').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Colors').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Typography').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Shapes').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Components').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Slide Rhythm').closest('button')).toHaveAttribute('aria-expanded', 'true');
  });

  // bt-4-1 Task 5.9: Clicking Collapse All button collapses all sections
  it('clicking Collapse All collapses all sections (bt-4-1 AC-4)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    // First expand all, then collapse all
    fireEvent.click(screen.getByLabelText('Expand All'));
    expect(screen.getByText('Metadata').closest('button')).toHaveAttribute('aria-expanded', 'true');

    // Click Collapse All
    fireEvent.click(screen.getByLabelText('Collapse All'));

    // All sections should now be collapsed
    expect(screen.getByText('Metadata').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Colors').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Typography').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Shapes').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Components').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Slide Rhythm').closest('button')).toHaveAttribute('aria-expanded', 'false');
  });

  // bt-4-1: Individual toggle still works after Expand All (AC-5)
  it('individual toggle works after Expand All (bt-4-1 AC-5)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    // Expand all
    fireEvent.click(screen.getByLabelText('Expand All'));

    // Toggle Colors off
    fireEvent.click(screen.getByText('Colors').closest('button')!);
    expect(screen.getByText('Colors').closest('button')).toHaveAttribute('aria-expanded', 'false');

    // Other sections still expanded
    expect(screen.getByText('Metadata').closest('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Typography').closest('button')).toHaveAttribute('aria-expanded', 'true');
  });

  // bt-4-1: Individual toggle still works after Collapse All (AC-5)
  it('individual toggle works after Collapse All (bt-4-1 AC-5)', () => {
    const theme = createFullTheme();
    render(<TestLayout theme={theme} />);

    // Collapse all
    fireEvent.click(screen.getByLabelText('Collapse All'));

    // Toggle Typography on
    fireEvent.click(screen.getByText('Typography').closest('button')!);
    expect(screen.getByText('Typography').closest('button')).toHaveAttribute('aria-expanded', 'true');

    // Others still collapsed
    expect(screen.getByText('Metadata').closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Colors').closest('button')).toHaveAttribute('aria-expanded', 'false');
  });
});
