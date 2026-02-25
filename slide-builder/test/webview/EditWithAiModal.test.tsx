import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditWithAiModal } from '../../src/webview/viewer/components/EditWithAiModal';

/**
 * Unit tests for EditWithAiModal component.
 * Story Reference: ae-1-1 AC-4,5,6,7,8,9
 */
describe('EditWithAiModal', () => {
  const defaultProps = {
    visible: true,
    slideNumber: 1,
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-4: Bottom-anchored modal renders when visible', () => {
    it('renders modal when visible is true', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const modal = screen.getByTestId('edit-with-ai-modal');
      expect(modal).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      render(<EditWithAiModal {...defaultProps} visible={false} />);
      const modal = screen.queryByTestId('edit-with-ai-modal');
      expect(modal).not.toBeInTheDocument();
    });

    it('has bottom-anchored positioning styles', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const modal = screen.getByTestId('edit-with-ai-modal');
      expect(modal.style.position).toBe('absolute');
      expect(modal.style.bottom).toBe('0px');
      expect(modal.style.left).toBe('0px');
      expect(modal.style.right).toBe('0px');
      expect(modal.style.height).toBe('35%');
    });

    it('displays slide number in header', () => {
      render(<EditWithAiModal {...defaultProps} slideNumber={3} />);
      expect(screen.getByText(/Slide 3/)).toBeInTheDocument();
    });
  });

  describe('AC-5: Textarea auto-focuses with placeholder', () => {
    it('renders textarea with correct placeholder', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const textarea = screen.getByTestId('edit-modal-textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute(
        'placeholder',
        'Describe a layout change... (e.g., make two columns, move image right)'
      );
    });

    it('auto-focuses textarea when visible', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const textarea = screen.getByTestId('edit-modal-textarea');
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('AC-6: Submit via Enter or Submit button', () => {
    it('calls onSubmit with instruction when Enter is pressed', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.change(textarea, { target: { value: 'make two columns' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSubmit).toHaveBeenCalledWith('make two columns');
    });

    it('does not submit on Shift+Enter (inserts newline)', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.change(textarea, { target: { value: 'some text' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit when Submit button is clicked', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('edit-modal-textarea');
      const submitButton = screen.getByTestId('edit-modal-submit');

      fireEvent.change(textarea, { target: { value: 'move image right' } });
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith('move image right');
    });
  });

  describe('AC-7: Dismiss via Escape or close button', () => {
    it('calls onClose when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<EditWithAiModal {...defaultProps} onClose={onClose} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<EditWithAiModal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByTestId('edit-modal-close');

      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when Escape dismisses', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.change(textarea, { target: { value: 'some instruction' } });
      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AC-8: Submit disabled when textarea is empty', () => {
    it('Submit button is disabled when textarea is empty', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const submitButton = screen.getByTestId('edit-modal-submit');
      expect(submitButton).toBeDisabled();
    });

    it('Submit button is disabled when textarea contains only whitespace', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const textarea = screen.getByTestId('edit-modal-textarea');
      const submitButton = screen.getByTestId('edit-modal-submit');

      fireEvent.change(textarea, { target: { value: '   \n  ' } });
      expect(submitButton).toBeDisabled();
    });

    it('Submit button is enabled when textarea has non-empty content', () => {
      render(<EditWithAiModal {...defaultProps} />);
      const textarea = screen.getByTestId('edit-modal-textarea');
      const submitButton = screen.getByTestId('edit-modal-submit');

      fireEvent.change(textarea, { target: { value: 'make two columns' } });
      expect(submitButton).not.toBeDisabled();
    });

    it('does not call onSubmit via Enter when textarea is empty', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AC-9: Instruction text passed correctly on submit', () => {
    it('trims whitespace from instruction before passing to onSubmit', () => {
      const onSubmit = vi.fn();
      render(<EditWithAiModal {...defaultProps} onSubmit={onSubmit} />);
      const textarea = screen.getByTestId('edit-modal-textarea');

      fireEvent.change(textarea, { target: { value: '  make two columns  ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSubmit).toHaveBeenCalledWith('make two columns');
    });
  });
});
