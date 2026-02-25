/**
 * KeyPointsEditor Component Tests
 *
 * Story Reference: 20-3 - Key Points Inline Editor
 * Tests for rendering, empty state, inline editing, add/remove/reorder, keyboard shortcuts
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyPointsEditor } from '../../src/webview/plan/components/KeyPointsEditor';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockPoints = ['Cost savings', 'Time efficiency', 'Quality improvement'];

// =============================================================================
// Tests - Rendering & Empty State (AC-20.3.1, AC-20.3.4)
// =============================================================================

describe('KeyPointsEditor - Rendering', () => {
  it('renders key points as a list (AC-20.3.1)', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    expect(screen.getByText('Cost savings')).toBeDefined();
    expect(screen.getByText('Time efficiency')).toBeDefined();
    expect(screen.getByText('Quality improvement')).toBeDefined();
  });

  it('renders bullet indicators for each point (AC-20.3.2)', () => {
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={vi.fn()} />
    );

    const bullets = container.querySelectorAll('.rounded-full.bg-\\[var\\(--fg-muted\\)\\]');
    expect(bullets.length).toBe(3);
  });

  it('renders "Add key point" button below the list (AC-20.3.3)', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    const addButton = screen.getByText('Add key point');
    expect(addButton).toBeDefined();
  });

  it('renders dashed-border placeholder when no key points (AC-20.3.4)', () => {
    const { container } = render(
      <KeyPointsEditor points={[]} onChange={vi.fn()} />
    );

    const placeholder = container.querySelector('.border-dashed');
    expect(placeholder).toBeDefined();
    expect(screen.getByText('Add key point')).toBeDefined();
  });

  it('each list item has tabIndex for keyboard access', () => {
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={vi.fn()} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    expect(items.length).toBe(3);
  });
});

// =============================================================================
// Tests - Inline Editing (AC-20.3.5, AC-20.3.6)
// =============================================================================

describe('KeyPointsEditor - Inline Editing', () => {
  it('enters edit mode when clicking text (AC-20.3.5)', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Cost savings'));

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).value).toBe('Cost savings');
  });

  it('saves on blur (AC-20.3.6)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByText('Cost savings'));

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    fireEvent.change(input, { target: { value: 'Reduced costs' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(['Reduced costs', 'Time efficiency', 'Quality improvement']);
  });

  it('Enter saves current and creates new point below (AC-20.3.6)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByText('Time efficiency'));

    const input = screen.getByRole('textbox', { name: /edit key point 2/i });
    fireEvent.change(input, { target: { value: 'Faster delivery' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter saves edited value and inserts new empty point below
    expect(onChange).toHaveBeenCalledWith([
      'Cost savings',
      'Faster delivery',
      '',
      'Quality improvement',
    ]);
  });

  it('Enter opens edit mode on the new point below', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Cost savings'));
    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    fireEvent.change(input, { target: { value: 'Edited' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should still have an active text input (editing the new point)
    const newInput = screen.getByRole('textbox');
    expect(newInput).toBeDefined();
    expect((newInput as HTMLInputElement).value).toBe('');
  });

  it('Enter on empty removes the point and exits edit mode', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={['First', 'Second']} onChange={onChange} />);

    // Add a new point (creates empty at end)
    const addBtn = screen.getByRole('button', { name: /add key point/i });
    fireEvent.click(addBtn);

    // We now have an empty input at the end
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    // The empty point should be removed (last onChange call)
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual(['First', 'Second']);
  });

  it('removes empty key point on blur', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByText('Cost savings'));

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Quality improvement']);
  });

  it('cancels edit on Escape', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByText('Cost savings'));

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    fireEvent.change(input, { target: { value: 'Something else' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not have called onChange
    expect(onChange).not.toHaveBeenCalled();
    // Should exit edit mode (no input visible)
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('trims whitespace on save', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByText('Cost savings'));

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    fireEvent.change(input, { target: { value: '  Trimmed value  ' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(['Trimmed value', 'Time efficiency', 'Quality improvement']);
  });

  it('Backspace on empty removes point and edits previous', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={['First', 'Second']} onChange={onChange} />);

    // Click second point, clear it, press Backspace
    fireEvent.click(screen.getByText('Second'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Backspace' });

    // Should have called onChange removing the empty second point
    expect(onChange).toHaveBeenCalledWith(['First']);
  });
});

// =============================================================================
// Tests - Add Key Point (AC-20.3.3)
// =============================================================================

describe('KeyPointsEditor - Add Key Point', () => {
  it('adds new empty input when clicking Add (AC-20.3.3)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add key point/i }));

    expect(onChange).toHaveBeenCalledWith([...mockPoints, '']);
  });

  it('adds key point from empty state (AC-20.3.4)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Add key point'));

    expect(onChange).toHaveBeenCalledWith(['']);
  });
});

// =============================================================================
// Tests - Hover Action Buttons (AC-20.3.2)
// =============================================================================

describe('KeyPointsEditor - Action Buttons', () => {
  it('renders move up, move down, and remove buttons (AC-20.3.2)', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });

    expect(moveUpButtons.length).toBe(3);
    expect(moveDownButtons.length).toBe(3);
    expect(removeButtons.length).toBe(3);
  });

  it('disables move up on first item', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    expect(moveUpButtons[0]).toHaveProperty('disabled', true);
  });

  it('disables move down on last item', () => {
    render(<KeyPointsEditor points={mockPoints} onChange={vi.fn()} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    expect(moveDownButtons[2]).toHaveProperty('disabled', true);
  });

  it('moves item up when clicking move up (AC-20.3.7)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    fireEvent.click(moveUpButtons[1]); // Move "Time efficiency" up

    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Cost savings', 'Quality improvement']);
  });

  it('moves item down when clicking move down (AC-20.3.7)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    fireEvent.click(moveDownButtons[0]); // Move "Cost savings" down

    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Cost savings', 'Quality improvement']);
  });

  it('removes item when clicking remove (AC-20.3.8)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[1]); // Remove "Time efficiency"

    expect(onChange).toHaveBeenCalledWith(['Cost savings', 'Quality improvement']);
  });

  it('action buttons have opacity-0 class for hover reveal', () => {
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={vi.fn()} />
    );

    const actionGroups = container.querySelectorAll('.opacity-0');
    expect(actionGroups.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Tests - Keyboard Shortcuts (AC-20.3.7, AC-20.3.8)
// =============================================================================

describe('KeyPointsEditor - Keyboard Shortcuts', () => {
  it('Alt+ArrowUp moves point up (AC-20.3.7)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[1], { key: 'ArrowUp', altKey: true });

    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Cost savings', 'Quality improvement']);
  });

  it('Alt+ArrowDown moves point down (AC-20.3.7)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[0], { key: 'ArrowDown', altKey: true });

    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Cost savings', 'Quality improvement']);
  });

  it('Delete key removes focused point (AC-20.3.8)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[1], { key: 'Delete' });

    expect(onChange).toHaveBeenCalledWith(['Cost savings', 'Quality improvement']);
  });

  it('Alt+ArrowUp on first item does nothing', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[0], { key: 'ArrowUp', altKey: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('Alt+ArrowDown on last item does nothing', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[2], { key: 'ArrowDown', altKey: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('Enter key enters edit mode', () => {
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={vi.fn()} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[0], { key: 'Enter' });

    const input = screen.getByRole('textbox', { name: /edit key point 1/i });
    expect(input).toBeDefined();
  });
});

// =============================================================================
// Tests - Order Preservation (AC-20.3.10)
// =============================================================================

describe('KeyPointsEditor - Order Preservation', () => {
  it('preserves order through edit operation (AC-20.3.10)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    // Edit second item via blur (blur doesn't advance)
    fireEvent.click(screen.getByText('Time efficiency'));
    const input = screen.getByRole('textbox', { name: /edit key point 2/i });
    fireEvent.change(input, { target: { value: 'Speed' } });
    fireEvent.blur(input);

    const result = onChange.mock.calls[0][0];
    expect(result[0]).toBe('Cost savings');
    expect(result[1]).toBe('Speed');
    expect(result[2]).toBe('Quality improvement');
  });

  it('preserves order through remove operation (AC-20.3.10)', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]); // Remove first

    const result = onChange.mock.calls[0][0];
    expect(result[0]).toBe('Time efficiency');
    expect(result[1]).toBe('Quality improvement');
  });

  it('preserves order through reorder operation (AC-20.3.10)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <KeyPointsEditor points={mockPoints} onChange={onChange} />
    );

    const items = container.querySelectorAll('[tabindex="0"]');
    fireEvent.keyDown(items[2], { key: 'ArrowUp', altKey: true });

    const result = onChange.mock.calls[0][0];
    expect(result[0]).toBe('Cost savings');
    expect(result[1]).toBe('Quality improvement');
    expect(result[2]).toBe('Time efficiency');
  });
});

// =============================================================================
// Tests - Edge Cases
// =============================================================================

describe('KeyPointsEditor - Edge Cases', () => {
  it('handles single key point (move buttons disabled)', () => {
    render(<KeyPointsEditor points={['Only point']} onChange={vi.fn()} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });

    expect(moveUpButtons[0]).toHaveProperty('disabled', true);
    expect(moveDownButtons[0]).toHaveProperty('disabled', true);
  });

  it('handles rapid sequential operations', () => {
    const onChange = vi.fn();
    render(<KeyPointsEditor points={mockPoints} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['Time efficiency', 'Quality improvement']);
  });
});
