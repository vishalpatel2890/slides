/**
 * EditWithClaudeDialog Component Tests
 *
 * Story Reference: story-claude-edit-modal-1
 * Tests for rendering, dynamic title, auto-focus, keyboard handling,
 * submit disabled state, textarea clear on reopen, and accessibility.
 *
 * AC #1: Centered modal with overlay using Radix Dialog Portal
 * AC #2: Title reads "Edit Plan with Claude" when slideNumber is null
 * AC #3: Title reads "Edit Slide {N} with Claude" when slideNumber is provided
 * AC #4: Textarea auto-focuses on open
 * AC #5: Enter submits, Shift+Enter inserts newline
 * AC #6: Escape or Cancel button calls onCancel
 * AC #7: Submit button disabled when textarea is empty/whitespace
 * AC #8: Textarea clears on reopen
 * AC #9: Passes axe accessibility audit
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { EditWithClaudeDialog } from '../../src/webview/plan/components/EditWithClaudeDialog';

// Extend expect with axe matchers
expect.extend(matchers);

// =============================================================================
// Test Fixtures
// =============================================================================

const defaultProps = {
  open: true,
  slideNumber: null as number | null,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Tests - Rendering (AC #1)
// =============================================================================

describe('EditWithClaudeDialog - Rendering (AC #1)', () => {
  it('renders nothing when open=false', () => {
    render(<EditWithClaudeDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Edit Plan with Claude')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('renders modal with overlay when open=true', () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    expect(screen.getByText('Edit Plan with Claude')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Submit')).toBeDefined();
  });

  it('renders Cancel and Submit buttons', () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Submit')).toBeDefined();
  });
});

// =============================================================================
// Tests - Dynamic Title (AC #2, #3)
// =============================================================================

describe('EditWithClaudeDialog - Dynamic Title (AC #2, #3)', () => {
  it('renders "Edit Plan with Claude" when slideNumber=null (AC #2)', () => {
    render(<EditWithClaudeDialog {...defaultProps} slideNumber={null} />);

    expect(screen.getByText('Edit Plan with Claude')).toBeDefined();
  });

  it('renders "Edit Slide 3 with Claude" when slideNumber=3 (AC #3)', () => {
    render(<EditWithClaudeDialog {...defaultProps} slideNumber={3} />);

    expect(screen.getByText('Edit Slide 3 with Claude')).toBeDefined();
  });

  it('renders correct slide number for different values', () => {
    render(<EditWithClaudeDialog {...defaultProps} slideNumber={7} />);

    expect(screen.getByText('Edit Slide 7 with Claude')).toBeDefined();
  });
});

// =============================================================================
// Tests - Auto-Focus (AC #4)
// =============================================================================

describe('EditWithClaudeDialog - Auto-Focus (AC #4)', () => {
  it('textarea receives focus when dialog opens (AC #4)', async () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
      expect(textarea).toHaveFocus();
    });
  });
});

// =============================================================================
// Tests - Keyboard Handling (AC #5, #6)
// =============================================================================

describe('EditWithClaudeDialog - Keyboard Handling (AC #5, #6)', () => {
  it('Enter without Shift calls onSubmit with trimmed text (AC #5)', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: 'make two columns' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).toHaveBeenCalledWith('make two columns');
  });

  it('Shift+Enter does not call onSubmit (AC #5)', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: 'some text' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('onCancel called on Cancel button click (AC #6)', () => {
    const onCancel = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancel called on Escape key (AC #6)', () => {
    const onCancel = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onCancel={onCancel} />);

    // Radix Dialog handles Escape natively and triggers onOpenChange(false) -> onCancel
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });

  it('Cancel click does not call onSubmit', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} onCancel={onCancel} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: 'some instruction' } });
    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Tests - Submit Disabled State (AC #7)
// =============================================================================

describe('EditWithClaudeDialog - Submit Disabled State (AC #7)', () => {
  it('submit button is disabled when textarea is empty', () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    const submitButton = screen.getByText('Submit').closest('button')!;
    expect(submitButton.disabled).toBe(true);
  });

  it('submit button is disabled when textarea contains only whitespace', () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: '   \n  ' } });

    const submitButton = screen.getByText('Submit').closest('button')!;
    expect(submitButton.disabled).toBe(true);
  });

  it('submit button is enabled when textarea has content', () => {
    render(<EditWithClaudeDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: 'make two columns' } });

    const submitButton = screen.getByText('Submit').closest('button')!;
    expect(submitButton.disabled).toBe(false);
  });

  it('does not call onSubmit via Enter when textarea is empty', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit via click when textarea is empty', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const submitButton = screen.getByText('Submit').closest('button')!;
    fireEvent.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Tests - Submit with Trimmed Text (AC #5)
// =============================================================================

describe('EditWithClaudeDialog - Submit Trimming', () => {
  it('trims whitespace from instruction before passing to onSubmit', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: '  make two columns  ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).toHaveBeenCalledWith('make two columns');
  });

  it('onSubmit called with trimmed text on Submit button click', () => {
    const onSubmit = vi.fn();
    render(<EditWithClaudeDialog {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: '  change the title  ' } });

    const submitButton = screen.getByText('Submit').closest('button')!;
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith('change the title');
  });
});

// =============================================================================
// Tests - Textarea Clear on Reopen (AC #8)
// =============================================================================

describe('EditWithClaudeDialog - Textarea Clear on Reopen (AC #8)', () => {
  it('textarea clears when dialog closes and reopens', () => {
    const { rerender } = render(<EditWithClaudeDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    fireEvent.change(textarea, { target: { value: 'some instruction' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('some instruction');

    // Close the dialog
    rerender(<EditWithClaudeDialog {...defaultProps} open={false} />);

    // Reopen the dialog
    rerender(<EditWithClaudeDialog {...defaultProps} open={true} />);

    const newTextarea = screen.getByPlaceholderText("Describe what you'd like to change...");
    expect((newTextarea as HTMLTextAreaElement).value).toBe('');
  });
});

// =============================================================================
// Tests - Accessibility (AC #9)
// =============================================================================

describe('EditWithClaudeDialog - Accessibility (AC #9)', () => {
  it('passes axe accessibility audit', async () => {
    const { container } = render(<EditWithClaudeDialog {...defaultProps} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
