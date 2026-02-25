/**
 * TagInput component tests
 *
 * Story Reference: cv-4-5 AC-37
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from '../../src/webview/catalog/components/TagInput';

describe('TagInput', () => {
  describe('Rendering', () => {
    it('renders existing tags as chips', () => {
      render(<TagInput tags={['brand', 'logo']} onChange={vi.fn()} />);
      expect(screen.getByText('brand')).toBeInTheDocument();
      expect(screen.getByText('logo')).toBeInTheDocument();
    });

    it('renders input field', () => {
      render(<TagInput tags={[]} onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows placeholder when no tags', () => {
      render(<TagInput tags={[]} onChange={vi.fn()} placeholder="Add tag..." />);
      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    });

    it('hides placeholder when tags exist', () => {
      render(<TagInput tags={['brand']} onChange={vi.fn()} placeholder="Add tag..." />);
      expect(screen.queryByPlaceholderText('Add tag...')).not.toBeInTheDocument();
    });

    it('renders remove button on each chip', () => {
      render(<TagInput tags={['brand', 'logo']} onChange={vi.fn()} />);
      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('Adding tags', () => {
    it('adds tag on Enter key', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['existing']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['existing', 'newtag']);
    });

    it('adds tag on comma key', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: ',' });

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('trims and lowercases tags', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '  MyTag  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['mytag']);
    });

    it('deduplicates tags', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['brand']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'brand' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores empty input on Enter', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('clears input after adding tag', () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(input.value).toBe('');
    });
  });

  describe('Removing tags', () => {
    it('removes tag when x button clicked', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['brand', 'logo']} onChange={onChange} />);

      const removeButton = screen.getByRole('button', { name: 'Remove tag brand' });
      fireEvent.click(removeButton);

      expect(onChange).toHaveBeenCalledWith(['logo']);
    });

    it('removes last tag on Backspace when input is empty', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['brand', 'logo']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).toHaveBeenCalledWith(['brand']);
    });

    it('does not remove tag on Backspace when input has text', () => {
      const onChange = vi.fn();
      render(<TagInput tags={['brand']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'text' } });
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has group role with aria-label', () => {
      render(<TagInput tags={[]} onChange={vi.fn()} />);
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tags');
    });

    it('remove buttons have descriptive aria-labels', () => {
      render(<TagInput tags={['brand']} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Remove tag brand' })).toBeInTheDocument();
    });

    it('focuses input when container clicked', () => {
      render(<TagInput tags={['brand']} onChange={vi.fn()} />);
      const container = screen.getByRole('group');
      const input = screen.getByRole('textbox');

      fireEvent.click(container);
      expect(input).toHaveFocus();
    });
  });
});
