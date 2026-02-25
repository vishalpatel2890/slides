/**
 * DeleteConfirmDialog Component Tests
 *
 * Story Reference: 21-1 Task 5 - DeleteConfirmDialog component
 * Tests for rendering, intent preview truncation, auto-focus, and callback behavior
 *
 * AC-21.1.6: "Delete slide {N}?" with intent preview
 * AC-21.1.7: Cancel button auto-focused (safe default)
 * AC-21.1.8: Dismissable via Cancel button, Escape, click outside
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmDialog } from '../../src/webview/plan/components/DeleteConfirmDialog';

// =============================================================================
// Test Fixtures
// =============================================================================

const defaultProps = {
  open: true,
  slideNumber: 3,
  slideIntent: 'Present the key benefits of our solution',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Tests - Rendering (AC-21.1.6)
// =============================================================================

describe('DeleteConfirmDialog - Rendering', () => {
  it('renders title "Delete slide {N}?" when open (AC-21.1.6)', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete slide 3?')).toBeDefined();
  });

  it('shows intent preview text (AC-21.1.6)', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(
      screen.getByText('Present the key benefits of our solution')
    ).toBeDefined();
  });

  it('truncates intent preview to 100 characters with ellipsis', () => {
    const longIntent =
      'This is a very long slide intent that exceeds one hundred characters and should be truncated with an ellipsis at the end of the preview';
    render(
      <DeleteConfirmDialog {...defaultProps} slideIntent={longIntent} />
    );

    const expectedPreview = longIntent.slice(0, 100) + '...';
    expect(screen.getByText(expectedPreview)).toBeDefined();
  });

  it('does not truncate intent that is exactly 100 characters', () => {
    // Build a string that is exactly 100 chars
    const exactIntent = 'A'.repeat(100);
    render(
      <DeleteConfirmDialog {...defaultProps} slideIntent={exactIntent} />
    );

    // Should display without ellipsis
    expect(screen.getByText(exactIntent)).toBeDefined();
  });

  it('renders Cancel and Delete buttons', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('does not render dialog content when open=false', () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Delete slide 3?')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('renders correct slide number for different values', () => {
    render(<DeleteConfirmDialog {...defaultProps} slideNumber={7} />);

    expect(screen.getByText('Delete slide 7?')).toBeDefined();
  });

  it('handles empty intent gracefully', () => {
    render(<DeleteConfirmDialog {...defaultProps} slideIntent="" />);

    // Title should still render
    expect(screen.getByText('Delete slide 3?')).toBeDefined();
    // No description text should be rendered for empty preview
  });
});

// =============================================================================
// Tests - Auto-Focus (AC-21.1.7)
// =============================================================================

describe('DeleteConfirmDialog - Auto-Focus (AC-21.1.7)', () => {
  it('Cancel button has focus when dialog opens (AC-21.1.7)', async () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    // The component uses requestAnimationFrame for focus, so we need to wait
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveFocus();
    });
  });
});

// =============================================================================
// Tests - Callback Behavior
// =============================================================================

describe('DeleteConfirmDialog - Callbacks', () => {
  it('Cancel button click calls onCancel callback', () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Confirm button click calls onConfirm callback', () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('Cancel click does not call onConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Confirm click does not call onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
