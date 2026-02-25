import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditWithAiModal } from '../../../src/webview/viewer/components/EditWithAiModal';

const defaultProps = {
  visible: true,
  slideNumber: 1,
  onSubmit: vi.fn(),
  onClose: vi.fn(),
};

describe('EditWithAiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('story-1.2 AC #1: Instruction persists after submit', () => {
    it('does not clear instruction text after submit when modal stays visible', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByTestId('edit-modal-textarea');
      fireEvent.change(textarea, { target: { value: 'Animate each element' } });
      expect(textarea).toHaveValue('Animate each element');

      const submitButton = screen.getByTestId('edit-modal-submit');
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith('Animate each element');
      // Instruction text should persist since modal stays visible
      expect(textarea).toHaveValue('Animate each element');
    });
  });

  describe('story-1.2 AC #3,4: inFlight prop controls submit button state', () => {
    it('disables submit button and shows spinner when inFlight=true', () => {
      render(<EditWithAiModal {...defaultProps} inFlight={true} allowEmpty />);

      const submitButton = screen.getByTestId('edit-modal-submit');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Animating...');
      expect(submitButton).toHaveAttribute('aria-label', 'Animating...');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('enables submit button and shows Send icon when inFlight=false', () => {
      render(<EditWithAiModal {...defaultProps} inFlight={false} allowEmpty />);

      const submitButton = screen.getByTestId('edit-modal-submit');
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Submit');
      expect(submitButton).toHaveAttribute('aria-label', 'Submit');
      expect(submitButton).not.toHaveAttribute('aria-busy');
    });

    it('does not call onSubmit when inFlight=true and submit is clicked', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} inFlight={true} allowEmpty />);

      const submitButton = screen.getByTestId('edit-modal-submit');
      fireEvent.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('story-1.2 AC #5: Instruction clears when modal is closed', () => {
    it('clears instruction when modal transitions from visible to not visible', () => {
      const { rerender } = render(<EditWithAiModal {...defaultProps} />);

      const textarea = screen.getByTestId('edit-modal-textarea');
      fireEvent.change(textarea, { target: { value: 'Some instruction' } });
      expect(textarea).toHaveValue('Some instruction');

      // Close the modal
      rerender(<EditWithAiModal {...defaultProps} visible={false} />);

      // Reopen the modal
      rerender(<EditWithAiModal {...defaultProps} visible={true} />);

      const reopenedTextarea = screen.getByTestId('edit-modal-textarea');
      expect(reopenedTextarea).toHaveValue('');
    });
  });

  describe('story-1.2 AC #6: Empty textarea on reopen after close', () => {
    it('starts with empty textarea when reopened after closing', () => {
      const { rerender } = render(
        <EditWithAiModal {...defaultProps} allowEmpty />
      );

      // Type something
      const textarea = screen.getByTestId('edit-modal-textarea');
      fireEvent.change(textarea, { target: { value: 'Test instruction' } });

      // Close modal
      rerender(<EditWithAiModal {...defaultProps} visible={false} allowEmpty />);

      // Reopen modal
      rerender(<EditWithAiModal {...defaultProps} visible={true} allowEmpty />);

      const reopenedTextarea = screen.getByTestId('edit-modal-textarea');
      expect(reopenedTextarea).toHaveValue('');
    });
  });

  describe('story-1.2 AC #2: Header updates with slide number', () => {
    it('displays correct slide number in header', () => {
      render(<EditWithAiModal {...defaultProps} slideNumber={3} title="Animate with AI" />);
      expect(screen.getByText('Animate with AI — Slide 3')).toBeInTheDocument();
    });

    it('updates header when slideNumber prop changes', () => {
      const { rerender } = render(
        <EditWithAiModal {...defaultProps} slideNumber={3} title="Animate with AI" />
      );
      expect(screen.getByText('Animate with AI — Slide 3')).toBeInTheDocument();

      rerender(
        <EditWithAiModal {...defaultProps} slideNumber={5} title="Animate with AI" />
      );
      expect(screen.getByText('Animate with AI — Slide 5')).toBeInTheDocument();
    });
  });

  describe('story-1.2 AC #7: Submit uses current slide number', () => {
    it('submits with the instruction text for the current slide', () => {
      const onSubmit = vi.fn();
      const { rerender } = render(
        <EditWithAiModal {...defaultProps} slideNumber={3} onSubmit={onSubmit} />
      );

      const textarea = screen.getByTestId('edit-modal-textarea');
      fireEvent.change(textarea, { target: { value: 'Animate elements' } });

      // Navigate to slide 5 (simulated by changing prop)
      rerender(
        <EditWithAiModal {...defaultProps} slideNumber={5} onSubmit={onSubmit} />
      );

      // Submit
      const submitButton = screen.getByTestId('edit-modal-submit');
      fireEvent.click(submitButton);

      // The modal passes the instruction; the parent (Toolbar) handles slideNumber
      expect(onSubmit).toHaveBeenCalledWith('Animate elements');
    });
  });

  describe('Basic modal behavior', () => {
    it('returns null when not visible', () => {
      const { container } = render(<EditWithAiModal {...defaultProps} visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when visible', () => {
      render(<EditWithAiModal {...defaultProps} />);
      expect(screen.getByTestId('edit-with-ai-modal')).toBeInTheDocument();
    });

    it('calls onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<EditWithAiModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('edit-modal-close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<EditWithAiModal {...defaultProps} onClose={onClose} />);

      const textarea = screen.getByTestId('edit-modal-textarea');
      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
