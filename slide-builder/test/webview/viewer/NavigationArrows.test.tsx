/**
 * Tests for NavigationArrows component.
 * v2-1-3 AC9: Ghost icon buttons on main content area
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationArrows } from '../../../src/webview/viewer/components/NavigationArrows';

describe('NavigationArrows', () => {
  const defaultProps = {
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };

  it('renders prev and next buttons (AC9)', () => {
    render(<NavigationArrows {...defaultProps} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('calls onPrev when prev button is clicked', () => {
    const onPrev = vi.fn();
    render(<NavigationArrows {...defaultProps} onPrev={onPrev} />);

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));

    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button is clicked', () => {
    const onNext = vi.fn();
    render(<NavigationArrows {...defaultProps} onNext={onNext} />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('prev button has correct aria-label', () => {
    render(<NavigationArrows {...defaultProps} />);

    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'aria-label',
      'Previous slide'
    );
  });

  it('next button has correct aria-label', () => {
    render(<NavigationArrows {...defaultProps} />);

    expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute(
      'aria-label',
      'Next slide'
    );
  });

  it('has navigation-arrows container class', () => {
    const { container } = render(<NavigationArrows {...defaultProps} />);

    expect(container.querySelector('.navigation-arrows')).toBeInTheDocument();
  });

  it('buttons have ghost button class', () => {
    render(<NavigationArrows {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('navigation-arrows__button');
    });
  });

  it('prev button has prev modifier class', () => {
    render(<NavigationArrows {...defaultProps} />);

    expect(screen.getByRole('button', { name: /previous/i })).toHaveClass(
      'navigation-arrows__button--prev'
    );
  });

  it('next button has next modifier class', () => {
    render(<NavigationArrows {...defaultProps} />);

    expect(screen.getByRole('button', { name: /next/i })).toHaveClass(
      'navigation-arrows__button--next'
    );
  });
});
