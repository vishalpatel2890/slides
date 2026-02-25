import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { OnboardingState } from '../../src/webview/theme-editor/components/OnboardingState';
import { ConflictDialog } from '../../src/webview/theme-editor/components/ConflictDialog';
import { SaveBar } from '../../src/webview/theme-editor/components/SaveBar';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for bt-2-4 Story:
 * - OnboardingState (AC-4, AC-5)
 * - ConflictDialog (AC-2, AC-8, AC-9)
 * - AI Theme Edit button in SaveBar (AC-6)
 */

// Mock acquireVsCodeApi for webview tests
const mockPostMessage = vi.fn();
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: mockPostMessage,
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
  };
}

// Helper to load theme and render SaveBar
function TestSaveBar({ theme, exists = true }: { theme: ThemeJson | null; exists?: boolean }) {
  return (
    <ThemeEditorProvider>
      <ThemeLoader theme={theme} exists={exists} />
      <SaveBar />
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
// OnboardingState Component Tests (bt-2-4 Task 10.4, 10.5)
// =============================================================================

describe('OnboardingState (bt-2-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // bt-2-4 Task 10.4: OnboardingState renders "No brand theme found" message and "Set Up Brand" button
  it('renders empty state message and CTA button', () => {
    render(<OnboardingState />);

    expect(screen.getByText('No brand theme found')).toBeInTheDocument();
    expect(screen.getByText('Set Up Brand')).toBeInTheDocument();
    expect(screen.getByText(/Set up your brand to create a theme/)).toBeInTheDocument();
  });

  // bt-2-4 Task 10.5: OnboardingState "Set Up Brand" click sends correct message
  it('sends theme-editor-launch-setup message on CTA click', () => {
    render(<OnboardingState />);

    const button = screen.getByText('Set Up Brand');
    fireEvent.click(button);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'theme-editor-launch-setup',
    });
  });

  it('has proper aria-label on CTA button', () => {
    render(<OnboardingState />);

    expect(screen.getByLabelText('Set Up Brand')).toBeInTheDocument();
  });
});

// =============================================================================
// ConflictDialog Component Tests (bt-2-4 Task 10.7, 10.8, 10.9)
// =============================================================================

describe('ConflictDialog (bt-2-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // bt-2-4 Task 10.7: Conflict dialog appears with correct content
  it('renders conflict dialog with Reload and Keep My Changes buttons', () => {
    const onReload = vi.fn();
    const onKeep = vi.fn();

    render(<ConflictDialog onReload={onReload} onKeep={onKeep} />);

    expect(screen.getByText('Theme File Changed Externally')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
    expect(screen.getByText('Keep My Changes')).toBeInTheDocument();
  });

  // bt-2-4 Task 10.8: Conflict dialog "Reload" calls onReload
  it('calls onReload when Reload button is clicked', () => {
    const onReload = vi.fn();
    const onKeep = vi.fn();

    render(<ConflictDialog onReload={onReload} onKeep={onKeep} />);

    fireEvent.click(screen.getByText('Reload'));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onKeep).not.toHaveBeenCalled();
  });

  // bt-2-4 Task 10.9: Conflict dialog "Keep My Changes" calls onKeep
  it('calls onKeep when Keep My Changes button is clicked', () => {
    const onReload = vi.fn();
    const onKeep = vi.fn();

    render(<ConflictDialog onReload={onReload} onKeep={onKeep} />);

    fireEvent.click(screen.getByText('Keep My Changes'));
    expect(onKeep).toHaveBeenCalledTimes(1);
    expect(onReload).not.toHaveBeenCalled();
  });

  it('has proper aria-labels on buttons', () => {
    const onReload = vi.fn();
    const onKeep = vi.fn();

    render(<ConflictDialog onReload={onReload} onKeep={onKeep} />);

    expect(screen.getByLabelText('Reload theme from disk')).toBeInTheDocument();
    expect(screen.getByLabelText('Keep my changes')).toBeInTheDocument();
  });
});

// =============================================================================
// SaveBar AI Theme Edit Button Tests (bt-2-4 Task 10.10)
// =============================================================================

describe('SaveBar AI Theme Edit button (bt-2-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // bt-2-4 Task 10.10: AI Theme Edit button renders and fires correct message
  it('renders AI Theme Edit button', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} />);

    expect(screen.getByText('AI Theme Edit')).toBeInTheDocument();
  });

  it('sends theme-editor-launch-edit message on click', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} />);

    const button = screen.getByText('AI Theme Edit');
    fireEvent.click(button);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'theme-editor-launch-edit',
    });
  });

  it('has proper aria-label', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} />);

    expect(screen.getByLabelText('AI Theme Edit')).toBeInTheDocument();
  });
});
