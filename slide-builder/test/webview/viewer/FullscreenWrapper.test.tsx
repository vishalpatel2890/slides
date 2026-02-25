/**
 * Tests for FullscreenWrapper component.
 * v2-2-2 AC-3,4: Fullscreen container with 16:9 slide centering
 * v3-1-1: Updated to use mode prop ('view' | 'edit' | null) instead of isFullscreen boolean
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenWrapper } from '../../../src/webview/viewer/components/FullscreenWrapper';

describe('FullscreenWrapper', () => {
  describe('when not fullscreen (mode=null, AC-3)', () => {
    it('renders children without wrapper', () => {
      render(
        <FullscreenWrapper mode={null}>
          <div data-testid="child-content">Slide Content</div>
        </FullscreenWrapper>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });

    it('passes through children unchanged', () => {
      const { container } = render(
        <FullscreenWrapper mode={null}>
          <span className="test-child">Test</span>
        </FullscreenWrapper>
      );

      expect(container.querySelector('.test-child')).toBeInTheDocument();
      expect(container.querySelector('.fullscreen-wrapper')).not.toBeInTheDocument();
    });
  });

  describe('when fullscreen view mode (mode="view", AC-4)', () => {
    it('renders fullscreen wrapper container', () => {
      render(
        <FullscreenWrapper mode="view">
          <div data-testid="child-content">Slide Content</div>
        </FullscreenWrapper>
      );

      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('applies fullscreen-wrapper and view variant class', () => {
      const { container } = render(
        <FullscreenWrapper mode="view">
          <div>Content</div>
        </FullscreenWrapper>
      );

      const wrapper = container.querySelector('.fullscreen-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('fullscreen-wrapper--view');
    });

    it('wraps content in fullscreen-wrapper__content', () => {
      const { container } = render(
        <FullscreenWrapper mode="view">
          <div data-testid="child-content">Content</div>
        </FullscreenWrapper>
      );

      const contentWrapper = container.querySelector('.fullscreen-wrapper__content');
      expect(contentWrapper).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('has aria-label for accessibility', () => {
      render(
        <FullscreenWrapper mode="view">
          <div>Content</div>
        </FullscreenWrapper>
      );

      expect(screen.getByRole('presentation')).toHaveAttribute(
        'aria-label',
        'Fullscreen view mode'
      );
    });
  });

  describe('when fullscreen edit mode (mode="edit", v3-1-2)', () => {
    it('renders fullscreen wrapper with edit variant class', () => {
      const { container } = render(
        <FullscreenWrapper mode="edit">
          <div>Content</div>
        </FullscreenWrapper>
      );

      const wrapper = container.querySelector('.fullscreen-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('fullscreen-wrapper--edit');
    });

    it('has edit mode aria-label', () => {
      render(
        <FullscreenWrapper mode="edit">
          <div>Content</div>
        </FullscreenWrapper>
      );

      expect(screen.getByRole('presentation')).toHaveAttribute(
        'aria-label',
        'Fullscreen edit mode'
      );
    });
  });

  describe('mouse movement handler', () => {
    it('calls onMouseMove when mouse moves in fullscreen', () => {
      const handleMouseMove = vi.fn();

      render(
        <FullscreenWrapper mode="view" onMouseMove={handleMouseMove}>
          <div>Content</div>
        </FullscreenWrapper>
      );

      const wrapper = screen.getByRole('presentation');
      fireEvent.mouseMove(wrapper);

      expect(handleMouseMove).toHaveBeenCalled();
    });

    it('does not call onMouseMove when not fullscreen', () => {
      const handleMouseMove = vi.fn();

      render(
        <FullscreenWrapper mode={null} onMouseMove={handleMouseMove}>
          <div data-testid="child">Content</div>
        </FullscreenWrapper>
      );

      const child = screen.getByTestId('child');
      fireEvent.mouseMove(child);

      // onMouseMove is not attached when not fullscreen
      expect(handleMouseMove).not.toHaveBeenCalled();
    });
  });
});
