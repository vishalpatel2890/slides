/**
 * Tests for OperationModal component.
 *
 * Story Reference: v3-5-1 AC-1, AC-2, AC-3, AC-4
 *
 * AC-1: Modal displays operation-specific form fields
 * AC-2: Inline validation errors for required fields
 * AC-3: Submits form data to extension for CLI invocation
 * AC-4: Dismissible via ESC, outside click, or close button
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OperationModal } from '../../../src/webview/catalog/components/OperationModal';
import type { FormConfig } from '../../../src/shared/types';

// Plan-deck form configuration for testing
const planDeckConfig: FormConfig = {
  type: 'modal',
  title: 'Plan a Deck',
  operation: 'sb-create:plan-deck',
  fields: [
    { name: 'title', label: 'Deck Title', type: 'text', required: true, placeholder: 'Q1 Sales Review' },
    { name: 'audience', label: 'Target Audience', type: 'text', required: true, placeholder: 'Executive leadership team' },
    { name: 'goal', label: 'Presentation Goal', type: 'textarea', required: true, placeholder: 'Convince leadership...' },
    { name: 'slideCount', label: 'Approximate Slide Count', type: 'number', required: false, placeholder: '10-15' },
    { name: 'topics', label: 'Key Topics', type: 'textarea', required: false, placeholder: 'Revenue growth...' },
    { name: 'tone', label: 'Tone/Style', type: 'select', required: false, options: [
      { label: 'Professional', value: 'professional' },
      { label: 'Casual', value: 'casual' },
    ]},
  ],
};

describe('OperationModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal(open = true, config = planDeckConfig) {
    return render(
      <OperationModal
        open={open}
        onOpenChange={mockOnOpenChange}
        config={config}
        onSubmit={mockOnSubmit}
      />
    );
  }

  describe('AC-1: Modal displays operation-specific form fields', () => {
    it('renders modal with correct title', () => {
      renderModal();
      expect(screen.getByText('Plan a Deck')).toBeDefined();
    });

    it('renders all 6 form fields for plan-deck', () => {
      renderModal();

      // Check all field labels are rendered
      expect(screen.getByLabelText(/Deck Title/)).toBeDefined();
      expect(screen.getByLabelText(/Target Audience/)).toBeDefined();
      expect(screen.getByLabelText(/Presentation Goal/)).toBeDefined();
      expect(screen.getByLabelText(/Approximate Slide Count/)).toBeDefined();
      expect(screen.getByLabelText(/Key Topics/)).toBeDefined();
      expect(screen.getByText('Tone/Style')).toBeDefined();
    });

    it('renders required field indicators', () => {
      renderModal();

      // Required fields should have asterisk indicator (aria-hidden span within label)
      const labels = screen.getAllByText('*');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('renders placeholder text for fields', () => {
      renderModal();

      expect(screen.getByPlaceholderText('Q1 Sales Review')).toBeDefined();
      expect(screen.getByPlaceholderText('Executive leadership team')).toBeDefined();
    });

    it('renders submit and cancel buttons', () => {
      renderModal();

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
    });
  });

  describe('AC-2: Inline validation errors for required fields', () => {
    it('shows validation errors when submitting empty required fields', async () => {
      renderModal();

      // Click submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // Check error messages appear
      await waitFor(() => {
        expect(screen.getByText('Deck Title is required')).toBeDefined();
        expect(screen.getByText('Target Audience is required')).toBeDefined();
        expect(screen.getByText('Presentation Goal is required')).toBeDefined();
      });
    });

    it('clears error when user fills in required field', async () => {
      renderModal();

      // Submit to trigger validation
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // Error should be visible
      await waitFor(() => {
        expect(screen.getByText('Deck Title is required')).toBeDefined();
      });

      // Type in the field
      const titleInput = screen.getByPlaceholderText('Q1 Sales Review');
      fireEvent.change(titleInput, { target: { value: 'My Presentation' } });

      // Error should clear after typing
      await waitFor(() => {
        expect(screen.queryByText('Deck Title is required')).toBeNull();
      });
    });

    it('does not show errors for optional empty fields', async () => {
      renderModal();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Q1 Sales Review'), { target: { value: 'Title' } });
      fireEvent.change(screen.getByPlaceholderText('Executive leadership team'), { target: { value: 'Audience' } });
      fireEvent.change(screen.getByPlaceholderText('Convince leadership...'), { target: { value: 'Goal' } });

      // Submit - should not show errors for optional fields
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // No error messages should be visible
      expect(screen.queryByText('Approximate Slide Count is required')).toBeNull();
      expect(screen.queryByText('Key Topics is required')).toBeNull();
    });
  });

  describe('AC-3: Form submission sends data to extension', () => {
    it('calls onSubmit with form data when valid', async () => {
      renderModal();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Q1 Sales Review'), { target: { value: 'Quarterly Review' } });
      fireEvent.change(screen.getByPlaceholderText('Executive leadership team'), { target: { value: 'Leadership Team' } });
      fireEvent.change(screen.getByPlaceholderText('Convince leadership...'), { target: { value: 'Present quarterly results' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // Check onSubmit called with form data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Quarterly Review',
          audience: 'Leadership Team',
          goal: 'Present quarterly results',
        });
      });
    });

    it('closes modal after successful submission', async () => {
      renderModal();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Q1 Sales Review'), { target: { value: 'Title' } });
      fireEvent.change(screen.getByPlaceholderText('Executive leadership team'), { target: { value: 'Audience' } });
      fireEvent.change(screen.getByPlaceholderText('Convince leadership...'), { target: { value: 'Goal' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // Modal should close
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not submit when validation fails', () => {
      renderModal();

      // Submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AC-4: Modal dismissible via ESC, outside click, close button', () => {
    it('closes when Cancel button clicked', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes when close (X) button clicked', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes when ESC key pressed', () => {
      renderModal();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not render when open is false', () => {
      renderModal(false);

      expect(screen.queryByText('Plan a Deck')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for all form fields', () => {
      renderModal();

      // Each input should be associated with its label
      const titleInput = screen.getByLabelText(/Deck Title/);
      expect(titleInput.tagName.toLowerCase()).toBe('input');

      const goalTextarea = screen.getByLabelText(/Presentation Goal/);
      expect(goalTextarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('error messages are linked to inputs via aria-describedby', async () => {
      renderModal();

      // Trigger validation
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Q1 Sales Review');
        expect(titleInput.getAttribute('aria-invalid')).toBe('true');
        expect(titleInput.getAttribute('aria-describedby')).toBe('title-error');
      });
    });

    it('error messages have role="alert"', async () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });
});
