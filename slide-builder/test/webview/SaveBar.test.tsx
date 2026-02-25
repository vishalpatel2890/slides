import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeEditorProvider, useThemeEditor } from '../../src/webview/theme-editor/context/ThemeEditorContext';
import { SaveBar } from '../../src/webview/theme-editor/components/SaveBar';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Component tests for SaveBar.
 * Story Reference: bt-2-3 Task 9.7-9.9
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

// Helper component that loads theme data then renders SaveBar
function TestSaveBar({ theme, exists = true, makeDirty = false, startSaving = false }: {
  theme: ThemeJson | null;
  exists?: boolean;
  makeDirty?: boolean;
  startSaving?: boolean;
}) {
  return (
    <ThemeEditorProvider>
      <StateLoader theme={theme} exists={exists} makeDirty={makeDirty} startSaving={startSaving} />
      <SaveBar />
    </ThemeEditorProvider>
  );
}

function StateLoader({ theme, exists, makeDirty, startSaving }: {
  theme: ThemeJson | null;
  exists: boolean;
  makeDirty: boolean;
  startSaving: boolean;
}) {
  const { dispatch } = useThemeEditor();
  React.useEffect(() => {
    dispatch({ type: 'THEME_LOADED', theme, exists });
    if (makeDirty && theme) {
      dispatch({ type: 'UPDATE_VALUE', path: 'colors.primary', value: '#ff0000' });
    }
    if (startSaving) {
      dispatch({ type: 'SAVE_START' });
    }
  }, [dispatch, theme, exists, makeDirty, startSaving]);
  return null;
}

// =============================================================================
// Tests
// =============================================================================

describe('SaveBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // bt-2-3 Task 9.7: SaveBar renders Save/Revert disabled when not dirty
  it('renders Save and Revert buttons disabled when not dirty', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} />);

    const saveButton = screen.getByRole('button', { name: /save theme/i });
    const revertButton = screen.getByRole('button', { name: /revert changes/i });

    expect(saveButton).toBeDisabled();
    expect(revertButton).toBeDisabled();
  });

  // bt-2-3 Task 9.8: SaveBar renders Save/Revert enabled when dirty
  it('renders Save and Revert buttons enabled when dirty', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} makeDirty />);

    const saveButton = screen.getByRole('button', { name: /save theme/i });
    const revertButton = screen.getByRole('button', { name: /revert changes/i });

    expect(saveButton).not.toBeDisabled();
    expect(revertButton).not.toBeDisabled();
  });

  // bt-2-3 Task 9.9: SaveBar shows spinner during save
  it('shows "Saving..." text during save', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} makeDirty startSaving />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Unsaved changes" text when dirty', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} makeDirty />);

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('does not show "Unsaved changes" when clean', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} />);

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('sends theme-editor-save message when Save is clicked', () => {
    const theme = createFullTheme();
    render(<TestSaveBar theme={theme} makeDirty />);

    const saveButton = screen.getByRole('button', { name: /save theme/i });
    fireEvent.click(saveButton);

    // Should send both theme-editor-dirty (from isDirty effect) and theme-editor-save
    const saveMessage = mockPostMessage.mock.calls.find(
      (call: unknown[]) => (call[0] as { type: string }).type === 'theme-editor-save'
    );
    expect(saveMessage).toBeDefined();
  });
});
