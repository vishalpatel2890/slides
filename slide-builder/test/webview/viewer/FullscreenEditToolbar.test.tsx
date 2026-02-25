/**
 * Tests for FullscreenEditToolbar component.
 * v3-1-2 AC-1,4: Minimal edit toolbar for fullscreen edit mode.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FullscreenEditToolbar } from '../../../src/webview/viewer/components/FullscreenEditToolbar';

describe('FullscreenEditToolbar', () => {
  describe('rendering (AC-1)', () => {
    it('renders with correct role and aria-label', () => {
      render(<FullscreenEditToolbar saveStatus="idle" />);

      const toolbar = screen.getByRole('toolbar', { name: /fullscreen edit toolbar/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('renders ESC hint text', () => {
      render(<FullscreenEditToolbar saveStatus="idle" />);

      expect(screen.getByText(/ESC/)).toBeInTheDocument();
      expect(screen.getByText(/to exit/)).toBeInTheDocument();
    });

    it('has fullscreen-edit-toolbar class', () => {
      const { container } = render(<FullscreenEditToolbar saveStatus="idle" />);

      expect(container.querySelector('.fullscreen-edit-toolbar')).toBeInTheDocument();
    });
  });

  describe('save status indicator', () => {
    it('shows "Edit mode" when idle', () => {
      render(<FullscreenEditToolbar saveStatus="idle" />);

      expect(screen.getByText('Edit mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Ready to edit')).toBeInTheDocument();
    });

    it('shows "Saving..." when saving', () => {
      render(<FullscreenEditToolbar saveStatus="saving" />);

      expect(screen.getByText('Saving…')).toBeInTheDocument();
      expect(screen.getByLabelText('Saving changes')).toBeInTheDocument();
    });

    it('shows "Saved ✓" when saved', () => {
      render(<FullscreenEditToolbar saveStatus="saved" />);

      expect(screen.getByText('Saved ✓')).toBeInTheDocument();
      expect(screen.getByLabelText('Changes saved')).toBeInTheDocument();
    });

    it('shows "Save failed" when error', () => {
      render(<FullscreenEditToolbar saveStatus="error" />);

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByLabelText('Save failed')).toBeInTheDocument();
    });
  });

  describe('accessibility (AC-4)', () => {
    it('toolbar has role="toolbar"', () => {
      render(<FullscreenEditToolbar saveStatus="idle" />);

      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('save status has aria-label', () => {
      render(<FullscreenEditToolbar saveStatus="saving" />);

      expect(screen.getByLabelText('Saving changes')).toBeInTheDocument();
    });
  });
});
