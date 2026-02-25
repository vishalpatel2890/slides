/**
 * Tests for SlideInstructionEditor component.
 * Story Reference: v4-1-4 AC-1, AC-2, AC-3, AC-4, AC-5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SlideInstructionEditor } from '../../../src/webview/catalog/components/SlideInstructionEditor';

describe('SlideInstructionEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderEditor(instructions = 'Replace {title} with company name.\nAdd {subtitle} below.') {
    return render(
      <SlideInstructionEditor
        instructions={instructions}
        slideNumber={1}
        slideName="Title Slide"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );
  }

  describe('Rendering (AC-1)', () => {
    it('renders with slide name and number in header', () => {
      renderEditor();
      expect(screen.getByText(/Editing Slide 1: Title Slide/)).toBeDefined();
    });

    it('renders textarea with current instructions', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      expect(textarea.value).toContain('Replace {title} with company name.');
    });

    it('has accessible region label', () => {
      renderEditor();
      expect(screen.getByRole('region', { name: /Edit instructions for Title Slide/ })).toBeDefined();
    });
  });

  describe('Editing (AC-2)', () => {
    it('textarea is editable', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'New instructions' } });
      expect(textarea.value).toBe('New instructions');
    });
  });

  describe('Save button (AC-3)', () => {
    it('save button is disabled when no changes made', () => {
      renderEditor();
      const saveBtn = screen.getByLabelText('Save instructions');
      expect(saveBtn).toHaveProperty('disabled', true);
    });

    it('save button is enabled after editing', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Modified text' } });

      const saveBtn = screen.getByLabelText('Save instructions');
      expect(saveBtn).toHaveProperty('disabled', false);
    });

    it('clicking Save calls onSave with updated text', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Updated instructions' } });

      const saveBtn = screen.getByLabelText('Save instructions');
      fireEvent.click(saveBtn);

      expect(mockOnSave).toHaveBeenCalledWith('Updated instructions');
    });
  });

  describe('Cancel button', () => {
    it('clicking Cancel calls onCancel', () => {
      renderEditor();
      const cancelBtn = screen.getByLabelText('Cancel editing');
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('pressing Escape calls onCancel', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions');
      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Placeholder preview (AC-4)', () => {
    it('extracts and displays placeholders from instructions', () => {
      renderEditor();
      expect(screen.getByText('{title}')).toBeDefined();
      expect(screen.getByText('{subtitle}')).toBeDefined();
    });

    it('shows placeholder count', () => {
      renderEditor();
      expect(screen.getByText('Placeholders (2)')).toBeDefined();
    });

    it('updates placeholders when text changes', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Use {new_var} here' } });

      expect(screen.getByText('{new_var}')).toBeDefined();
      expect(screen.getByText('Placeholders (1)')).toBeDefined();
    });

    it('shows no placeholder section when none exist', () => {
      renderEditor('No placeholders here');
      expect(screen.queryByText(/Placeholders/)).toBeNull();
    });

    it('deduplicates repeated placeholders', () => {
      renderEditor('{title} and {title} again');
      expect(screen.getByText('Placeholders (1)')).toBeDefined();
    });
  });

  describe('Validation (AC-5)', () => {
    it('shows error for unclosed brace', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Unclosed {brace here' } });

      expect(screen.getByText(/Unclosed placeholder brace/)).toBeDefined();
    });

    it('shows error for invalid placeholder characters', () => {
      renderEditor();
      const textarea = screen.getByLabelText('Slide instructions') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Bad {invalid-chars} here' } });

      expect(screen.getByText(/Invalid placeholder/)).toBeDefined();
    });

    it('shows no errors for valid placeholders', () => {
      renderEditor('Valid {good_var} text');
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
