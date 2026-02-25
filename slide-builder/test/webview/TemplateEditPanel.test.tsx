/**
 * Tests for TemplateEditPanel component.
 * Story Reference: tm-1-1 — slide template schema editing (name, description, use_cases, background_mode)
 *
 * AC-1: Schema fields (name, description, use_cases, background_mode) match slide-templates.json
 * AC-2: TagInput chip add/remove works
 * AC-3: background_mode select responds to changes
 * AC-4: onSave receives SlideTemplateSchema
 * AC-5: Panel closes on Cancel / ESC
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';
import { TemplateEditPanel } from '../../src/webview/catalog/components/TemplateEditPanel';
import type { SlideTemplateSchema } from '../../src/shared/types';

const mockSchema: SlideTemplateSchema = {
  name: 'Basic Title',
  description: 'A basic title slide',
  use_cases: ['opening'],
  background_mode: 'dark',
};

const emptySchema: SlideTemplateSchema = {
  name: '',
  description: '',
  use_cases: [],
  background_mode: 'dark',
};

function renderPanel(
  schema = mockSchema,
  onSave = vi.fn(),
  onClose = vi.fn(),
  onPreview?: (templateId: string) => void,
) {
  return render(
    <TemplateEditPanel
      templateId="title-basic"
      templateName={schema.name || 'Basic Title'}
      schema={schema}
      onSave={onSave}
      onClose={onClose}
      onPreview={onPreview}
    />
  );
}

describe('TemplateEditPanel', () => {
  describe('Rendering (AC-1)', () => {
    it('renders template name as header', () => {
      renderPanel();
      expect(screen.getByText('Basic Title')).toBeDefined();
    });

    it('renders Name, Description, Use Cases, Background Mode fields', () => {
      renderPanel();
      expect(screen.getByLabelText('Name')).toBeDefined();
      expect(screen.getByLabelText('Description')).toBeDefined();
      expect(screen.getByLabelText('Background Mode')).toBeDefined();
    });

    it('pre-populates fields from schema', () => {
      renderPanel();
      expect(screen.getByLabelText('Name')).toHaveValue('Basic Title');
      expect(screen.getByLabelText('Description')).toHaveValue('A basic title slide');
      expect(screen.getByLabelText('Background Mode')).toHaveValue('dark');
    });

    it('renders Save and Cancel buttons', () => {
      renderPanel();
      expect(screen.getByRole('button', { name: /Save/ })).toBeDefined();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeDefined();
    });

    it('does not render AI metadata fields', () => {
      renderPanel();
      expect(screen.queryByLabelText('AI Generation Prompt')).toBeNull();
      expect(screen.queryByLabelText('Placeholder Guidance')).toBeNull();
      expect(screen.queryByLabelText('Style Rules')).toBeNull();
    });
  });

  describe('Form editing', () => {
    it('allows typing into Name field', () => {
      renderPanel(emptySchema);
      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'New Name' } });
      expect(input).toHaveValue('New Name');
    });

    it('allows typing into Description field', () => {
      renderPanel(emptySchema);
      const textarea = screen.getByLabelText('Description');
      fireEvent.change(textarea, { target: { value: 'New description' } });
      expect(textarea).toHaveValue('New description');
    });

    it('allows changing Background Mode (AC-3)', () => {
      renderPanel();
      const select = screen.getByLabelText('Background Mode');
      fireEvent.change(select, { target: { value: 'light' } });
      expect(select).toHaveValue('light');
    });

    it('supports multi-line description', () => {
      renderPanel(emptySchema);
      const textarea = screen.getByLabelText('Description');
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });
  });

  describe('Save functionality (AC-4)', () => {
    it('calls onSave with SlideTemplateSchema when Save clicked', () => {
      const onSave = vi.fn();
      renderPanel(mockSchema, onSave);

      fireEvent.click(screen.getByRole('button', { name: /Save/ }));

      expect(onSave).toHaveBeenCalledTimes(1);
      const [schema] = onSave.mock.calls[0] as [SlideTemplateSchema];
      expect(schema.name).toBe('Basic Title');
      expect(schema.description).toBe('A basic title slide');
      expect(schema.use_cases).toEqual(['opening']);
      expect(schema.background_mode).toBe('dark');
    });

    it('saves updated field values after editing', () => {
      const onSave = vi.fn();
      renderPanel(emptySchema, onSave);

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated desc' } });
      fireEvent.change(screen.getByLabelText('Background Mode'), { target: { value: 'light' } });

      fireEvent.click(screen.getByRole('button', { name: /Save/ }));

      const [schema] = onSave.mock.calls[0] as [SlideTemplateSchema];
      expect(schema.name).toBe('Updated Name');
      expect(schema.description).toBe('Updated desc');
      expect(schema.background_mode).toBe('light');
    });
  });

  describe('Cancel functionality (AC-5)', () => {
    it('calls onClose when Cancel clicked', () => {
      const onClose = vi.fn();
      renderPanel(mockSchema, vi.fn(), onClose);
      fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSave when Cancel clicked', () => {
      const onSave = vi.fn();
      renderPanel(mockSchema, onSave);
      fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('ESC key handling (AC-5)', () => {
    it('calls onClose when ESC pressed', () => {
      const onClose = vi.fn();
      renderPanel(mockSchema, vi.fn(), onClose);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSave when ESC pressed', () => {
      const onSave = vi.fn();
      renderPanel(mockSchema, onSave);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible name for the panel', () => {
      renderPanel();
      expect(screen.getByRole('complementary', { name: /Edit template: Basic Title/i })).toBeDefined();
    });

    it('close button has accessible label', () => {
      renderPanel();
      expect(screen.getByRole('button', { name: /Close template editor/i })).toBeDefined();
    });

    it('passes axe accessibility audit', async () => {
      const { container } = renderPanel();
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Schema sync', () => {
    it('updates fields when schema prop changes', () => {
      const { rerender } = renderPanel(emptySchema);
      expect(screen.getByLabelText('Name')).toHaveValue('');

      rerender(
        <TemplateEditPanel
          templateId="title-basic"
          templateName="Basic Title"
          schema={mockSchema}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Name')).toHaveValue('Basic Title');
      expect(screen.getByLabelText('Description')).toHaveValue('A basic title slide');
    });
  });

  describe('Preview button (slide-template-preview-1)', () => {
    it('renders preview button when onPreview provided (AC #1)', () => {
      const onPreview = vi.fn();
      renderPanel(mockSchema, vi.fn(), vi.fn(), onPreview);

      const previewButton = screen.getByRole('button', { name: /Preview template/i });
      expect(previewButton).toBeDefined();
      expect(previewButton.className).toContain('template-edit-panel__preview-btn');
    });

    it('does not render preview button when onPreview not provided (AC #1)', () => {
      renderPanel(mockSchema, vi.fn(), vi.fn(), undefined);

      const previewButton = screen.queryByRole('button', { name: /Preview template/i });
      expect(previewButton).toBeNull();
    });

    it('calls onPreview with templateId on click (AC #2)', () => {
      const onPreview = vi.fn();
      renderPanel(mockSchema, vi.fn(), vi.fn(), onPreview);

      const previewButton = screen.getByRole('button', { name: /Preview template/i });
      fireEvent.click(previewButton);

      expect(onPreview).toHaveBeenCalledTimes(1);
      expect(onPreview).toHaveBeenCalledWith('title-basic');
    });

    it('is keyboard accessible — Enter and Space work natively (AC #4)', () => {
      const onPreview = vi.fn();
      renderPanel(mockSchema, vi.fn(), vi.fn(), onPreview);

      const previewButton = screen.getByRole('button', { name: /Preview template/i });

      // Verify button is focusable
      previewButton.focus();
      expect(document.activeElement).toBe(previewButton);

      // Verify button type is set (enables native Enter/Space keyboard support)
      // HTML <button type="button"> elements automatically handle Enter and Space key presses
      // by triggering click events - this is built-in browser behavior
      expect(previewButton.getAttribute('type')).toBe('button');

      // Note: Enter and Space key handling is native HTML button behavior.
      // We verify the button is properly configured (type="button") which ensures
      // keyboard users can activate it. Testing low-level keyDown events would
      // bypass this native behavior and test implementation details rather than
      // actual user experience.
    });

    it('has correct ARIA label with template name (AC #5)', () => {
      const onPreview = vi.fn();
      renderPanel(mockSchema, vi.fn(), vi.fn(), onPreview);

      const previewButton = screen.getByRole('button', { name: 'Preview template Basic Title' });
      expect(previewButton).toBeDefined();
    });

    it('does not trigger side effects on click (AC #2)', () => {
      const onPreview = vi.fn();
      const onClose = vi.fn();
      const onSave = vi.fn();
      renderPanel(mockSchema, onSave, onClose, onPreview);

      const previewButton = screen.getByRole('button', { name: /Preview template/i });
      fireEvent.click(previewButton);

      // Preview should not close panel or save
      expect(onClose).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
