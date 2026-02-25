/**
 * Tests for FullscreenControls component.
 * v2-2-2 AC-5,6: Navigation controls with fade visibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenControls } from '../../../src/webview/viewer/components/FullscreenControls';

describe('FullscreenControls', () => {
  const defaultProps = {
    visible: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    currentSlide: 1,
    totalSlides: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility (AC-5,6)', () => {
    it('applies visible class when visible=true', () => {
      const { container } = render(<FullscreenControls {...defaultProps} visible={true} />);

      expect(container.querySelector('.fullscreen-controls--visible')).toBeInTheDocument();
    });

    it('does not apply visible class when visible=false', () => {
      const { container } = render(<FullscreenControls {...defaultProps} visible={false} />);

      expect(container.querySelector('.fullscreen-controls--visible')).not.toBeInTheDocument();
    });

    it('sets aria-hidden=false when visible', () => {
      const { container } = render(<FullscreenControls {...defaultProps} visible={true} />);

      const controls = container.querySelector('.fullscreen-controls');
      expect(controls).toHaveAttribute('aria-hidden', 'false');
    });

    it('sets aria-hidden=true when not visible', () => {
      const { container } = render(<FullscreenControls {...defaultProps} visible={false} />);

      const controls = container.querySelector('.fullscreen-controls');
      expect(controls).toHaveAttribute('aria-hidden', 'true');
    });

    it('sets tabIndex=-1 on buttons when not visible', () => {
      render(<FullscreenControls {...defaultProps} visible={false} />);

      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');

      expect(prevButton).toHaveAttribute('tabIndex', '-1');
      expect(nextButton).toHaveAttribute('tabIndex', '-1');
    });

    it('sets tabIndex=0 on buttons when visible', () => {
      render(<FullscreenControls {...defaultProps} visible={true} />);

      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');

      expect(prevButton).toHaveAttribute('tabIndex', '0');
      expect(nextButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('navigation buttons', () => {
    it('renders previous button', () => {
      render(<FullscreenControls {...defaultProps} />);

      expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
    });

    it('renders next button', () => {
      render(<FullscreenControls {...defaultProps} />);

      expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
    });

    it('calls onPrev when previous button clicked', () => {
      const onPrev = vi.fn();
      render(<FullscreenControls {...defaultProps} onPrev={onPrev} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      expect(onPrev).toHaveBeenCalled();
    });

    it('calls onNext when next button clicked', () => {
      const onNext = vi.fn();
      render(<FullscreenControls {...defaultProps} onNext={onNext} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      expect(onNext).toHaveBeenCalled();
    });
  });

  describe('slide counter', () => {
    it('displays current slide number', () => {
      render(<FullscreenControls {...defaultProps} currentSlide={3} totalSlides={10} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays total slides', () => {
      render(<FullscreenControls {...defaultProps} currentSlide={3} totalSlides={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays separator', () => {
      render(<FullscreenControls {...defaultProps} />);

      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('updates when currentSlide changes', () => {
      const { rerender } = render(
        <FullscreenControls {...defaultProps} currentSlide={1} totalSlides={5} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();

      rerender(<FullscreenControls {...defaultProps} currentSlide={4} totalSlides={5} />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('applies button position classes', () => {
      const { container } = render(<FullscreenControls {...defaultProps} />);

      expect(container.querySelector('.fullscreen-controls__button--prev')).toBeInTheDocument();
      expect(container.querySelector('.fullscreen-controls__button--next')).toBeInTheDocument();
    });

    it('applies counter class', () => {
      const { container } = render(<FullscreenControls {...defaultProps} />);

      expect(container.querySelector('.fullscreen-controls__counter')).toBeInTheDocument();
    });
  });
});
