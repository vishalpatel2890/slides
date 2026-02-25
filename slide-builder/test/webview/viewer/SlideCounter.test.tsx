/**
 * Tests for SlideCounter component.
 * v2-1-3 AC7: Shows "N / Total" format
 * v2-1-3 AC8: Click opens jump-to-slide input
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideCounter } from '../../../src/webview/viewer/components/SlideCounter';

describe('SlideCounter', () => {
  const defaultProps = {
    currentSlide: 3,
    totalSlides: 12,
    onNavigate: vi.fn(),
  };

  it('displays "N / Total" format (AC7)', () => {
    render(<SlideCounter {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('has correct aria-label for accessibility (AC7)', () => {
    render(<SlideCounter {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Slide 3 of 12'
    );
  });

  it('has aria-live="polite" for accessibility (AC7)', () => {
    render(<SlideCounter {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-live', 'polite');
  });

  it('opens input mode on click (AC8)', () => {
    render(<SlideCounter {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should now have an input field
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('input mode shows current slide number initially', () => {
    render(<SlideCounter {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('3');
  });

  it('navigates on Enter with valid input (AC8)', () => {
    const onNavigate = vi.fn();
    render(<SlideCounter {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).toHaveBeenCalledWith(7);
  });

  it('does not navigate on Enter with invalid input', () => {
    const onNavigate = vi.fn();
    render(<SlideCounter {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '99' } }); // > totalSlides
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('closes input mode on Escape without navigating', () => {
    const onNavigate = vi.fn();
    render(<SlideCounter {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onNavigate).not.toHaveBeenCalled();
    // Should be back to button mode
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('closes input mode on blur without navigating', () => {
    const onNavigate = vi.fn();
    render(<SlideCounter {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.blur(input);

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('only allows numeric input', () => {
    render(<SlideCounter {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc5def' } });

    expect(input.value).toBe('5');
  });

  it('does not navigate to slide 0', () => {
    const onNavigate = vi.fn();
    render(<SlideCounter {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('updates display when currentSlide prop changes', () => {
    const { rerender } = render(<SlideCounter {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();

    rerender(<SlideCounter {...defaultProps} currentSlide={7} />);

    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
