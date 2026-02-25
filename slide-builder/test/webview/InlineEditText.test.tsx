/**
 * InlineEditText component tests
 *
 * Story Reference: cv-4-5 AC-35, AC-36
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineEditText } from '../../src/webview/catalog/components/InlineEditText';

describe('InlineEditText', () => {
  describe('Display mode', () => {
    it('renders value text when not editing', () => {
      render(<InlineEditText value="Test Name" onSave={vi.fn()} />);
      expect(screen.getByText('Test Name')).toBeInTheDocument();
    });

    it('renders placeholder when value is empty', () => {
      render(<InlineEditText value="" onSave={vi.fn()} placeholder="Click to edit" />);
      expect(screen.getByText('Click to edit')).toBeInTheDocument();
    });

    it('adds placeholder class when value is empty', () => {
      render(<InlineEditText value="" onSave={vi.fn()} />);
      const element = screen.getByRole('button');
      expect(element.className).toContain('inline-edit-text--placeholder');
    });

    it('renders as specified tag', () => {
      const { container } = render(<InlineEditText value="Test" onSave={vi.fn()} as="h2" />);
      expect(container.querySelector('h2')).toBeInTheDocument();
    });

    it('has role="button" for click accessibility', () => {
      render(<InlineEditText value="Test" onSave={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has tabIndex=0 for keyboard access', () => {
      render(<InlineEditText value="Test" onSave={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Entering edit mode', () => {
    it('switches to input on click', () => {
      render(<InlineEditText value="Test Name" onSave={vi.fn()} />);
      fireEvent.click(screen.getByText('Test Name'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('switches to input on Enter key', () => {
      render(<InlineEditText value="Test Name" onSave={vi.fn()} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('switches to input on Space key', () => {
      render(<InlineEditText value="Test Name" onSave={vi.fn()} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('populates input with current value', () => {
      render(<InlineEditText value="Test Name" onSave={vi.fn()} />);
      fireEvent.click(screen.getByText('Test Name'));
      expect(screen.getByRole('textbox')).toHaveValue('Test Name');
    });

    it('focuses and selects input when entering edit mode', async () => {
      render(<InlineEditText value="Test" onSave={vi.fn()} />);
      fireEvent.click(screen.getByText('Test'));

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveFocus();
      });
    });
  });

  describe('Saving (AC-35, AC-36)', () => {
    it('saves on Enter key', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Old Name" onSave={onSave} />);

      fireEvent.click(screen.getByText('Old Name'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSave).toHaveBeenCalledWith('New Name');
    });

    it('saves on blur', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Old Name" onSave={onSave} />);

      fireEvent.click(screen.getByText('Old Name'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      expect(onSave).toHaveBeenCalledWith('New Name');
    });

    it('does not save if value unchanged', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Same Name" onSave={onSave} />);

      fireEvent.click(screen.getByText('Same Name'));
      fireEvent.blur(screen.getByRole('textbox'));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('trims whitespace before saving', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Old" onSave={onSave} />);

      fireEvent.click(screen.getByText('Old'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '  New  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSave).toHaveBeenCalledWith('New');
    });

    it('returns to display mode after saving', () => {
      render(<InlineEditText value="Test" onSave={vi.fn()} />);

      fireEvent.click(screen.getByText('Test'));
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Cancel on Escape', () => {
    it('reverts on Escape key', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Original" onSave={onSave} />);

      fireEvent.click(screen.getByText('Original'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });
  });

  describe('Multiline mode', () => {
    it('renders textarea when multiline is true', () => {
      render(<InlineEditText value="Test" onSave={vi.fn()} multiline />);
      fireEvent.click(screen.getByText('Test'));
      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });

    it('does not save on Enter in multiline mode', () => {
      const onSave = vi.fn();
      render(<InlineEditText value="Test" onSave={onSave} multiline />);

      fireEvent.click(screen.getByText('Test'));
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
