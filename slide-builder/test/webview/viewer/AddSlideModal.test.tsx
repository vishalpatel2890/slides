import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddSlideModal } from '../../../src/webview/viewer/components/AddSlideModal';

const defaultProps = {
  visible: true,
  currentSlide: 3,
  totalSlides: 5,
  deckName: 'My Deck',
  onSubmit: vi.fn(),
  onClose: vi.fn(),
};

describe('AddSlideModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Modal opens at bottom ~35% height', () => {
    it('renders when visible', () => {
      render(<AddSlideModal {...defaultProps} />);
      expect(screen.getByTestId('add-slide-modal')).toBeInTheDocument();
    });

    it('returns null when not visible', () => {
      const { container } = render(<AddSlideModal {...defaultProps} visible={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('AC #2: Modal displays header, position selector, description textarea, Submit button', () => {
    it('displays header with deck name', () => {
      render(<AddSlideModal {...defaultProps} deckName="Test Deck" />);
      expect(screen.getByText('Add Slide — Test Deck')).toBeInTheDocument();
    });

    it('renders position selector', () => {
      render(<AddSlideModal {...defaultProps} />);
      expect(screen.getByTestId('add-slide-position-select')).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<AddSlideModal {...defaultProps} />);
      expect(screen.getByTestId('add-slide-description')).toBeInTheDocument();
    });

    it('renders Submit button', () => {
      render(<AddSlideModal {...defaultProps} />);
      expect(screen.getByTestId('add-slide-submit')).toBeInTheDocument();
    });
  });

  describe('AC #3: Position defaults to "After slide {currentSlide}"', () => {
    it('position selector shows default position based on currentSlide', () => {
      render(<AddSlideModal {...defaultProps} currentSlide={3} totalSlides={5} />);
      const trigger = screen.getByTestId('add-slide-position-select');
      expect(trigger).toHaveTextContent('After slide 3');
    });
  });

  describe('AC #4: Submit button disabled when description empty', () => {
    it('disables submit when textarea is empty', () => {
      render(<AddSlideModal {...defaultProps} />);
      const submitButton = screen.getByTestId('add-slide-submit');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('AC #5: Submit button enabled when description has text', () => {
    it('enables submit when textarea has text', () => {
      render(<AddSlideModal {...defaultProps} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.change(textarea, { target: { value: 'A slide about sales data' } });
      const submitButton = screen.getByTestId('add-slide-submit');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('AC #6: Escape or X close button closes without submitting', () => {
    it('calls onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<AddSlideModal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByTestId('add-slide-modal-close');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape is pressed in textarea', () => {
      const onClose = vi.fn();
      render(<AddSlideModal {...defaultProps} onClose={onClose} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.keyDown(textarea, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when closing', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();
      render(<AddSlideModal {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);
      const closeButton = screen.getByTestId('add-slide-modal-close');
      fireEvent.click(closeButton);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AC #7: Enter (not Shift+Enter) submits', () => {
    it('calls onSubmit with position and description on Enter', () => {
      const onSubmit = vi.fn();
      render(<AddSlideModal {...defaultProps} onSubmit={onSubmit} currentSlide={3} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.change(textarea, { target: { value: 'Overview slide' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSubmit).toHaveBeenCalledWith(3, 'Overview slide');
    });

    it('does not submit on Shift+Enter (allows newline)', () => {
      const onSubmit = vi.fn();
      render(<AddSlideModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.change(textarea, { target: { value: 'Some text' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AC #10: In-flight state — spinner and disabled', () => {
    it('disables submit button and shows spinner when inFlight=true', () => {
      render(<AddSlideModal {...defaultProps} inFlight={true} />);
      const submitButton = screen.getByTestId('add-slide-submit');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Adding slide...');
      expect(submitButton).toHaveAttribute('aria-label', 'Adding slide...');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('does not call onSubmit when inFlight=true', () => {
      const onSubmit = vi.fn();
      render(<AddSlideModal {...defaultProps} onSubmit={onSubmit} inFlight={true} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.change(textarea, { target: { value: 'Some text' } });
      const submitButton = screen.getByTestId('add-slide-submit');
      fireEvent.click(submitButton);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Modal reopen behavior', () => {
    it('clears description when modal closes and reopens', () => {
      const { rerender } = render(<AddSlideModal {...defaultProps} />);
      const textarea = screen.getByTestId('add-slide-description');
      fireEvent.change(textarea, { target: { value: 'Some content' } });
      expect(textarea).toHaveValue('Some content');

      // Close modal
      rerender(<AddSlideModal {...defaultProps} visible={false} />);

      // Reopen modal
      rerender(<AddSlideModal {...defaultProps} visible={true} />);
      const reopenedTextarea = screen.getByTestId('add-slide-description');
      expect(reopenedTextarea).toHaveValue('');
    });
  });
});
