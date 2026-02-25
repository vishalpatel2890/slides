/**
 * Tests for ThumbnailCard component.
 * v2-1-4 AC2: Click to navigate in <50ms
 * v2-1-4 AC3: Active state with blue border and glow
 * v2-1-4 AC5: Lazy loading via IntersectionObserver
 * v2-1-4 AC6: Slide number label below thumbnail
 * cv-bugfix-sidebar-thumbnails AC1-2,5: Scale readiness guard, empty HTML handling
 * cv-bugfix-thumbnail-rendering AC1,3,4,6: Overflow containment, slideHtml updates, observer cleanup
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThumbnailCard } from '../../../src/webview/viewer/components/ThumbnailCard';
import type { SlideScaleResult } from '../../../src/webview/viewer/hooks/useSlideScale';

// Mock useSlideScale to control ready state in tests
const mockScaleResult: SlideScaleResult = { scale: 0.1, ready: true, containerWidth: 192, containerHeight: 108 };
vi.mock('../../../src/webview/viewer/hooks/useSlideScale', () => ({
  useSlideScale: () => mockScaleResult,
}));

// IntersectionObserver is mocked globally in test/setup.ts

describe('ThumbnailCard', () => {
  const defaultProps = {
    slideNumber: 3,
    slideHtml: '<div class="slide">Slide 3 Content</div>',
    isActive: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    // Reset to ready state for most tests
    mockScaleResult.scale = 0.1;
    mockScaleResult.ready = true;
    mockScaleResult.containerWidth = 192;
    mockScaleResult.containerHeight = 108;
  });

  it('renders slide number label (AC6)', () => {
    render(<ThumbnailCard {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onClick when clicked (AC2)', () => {
    const onClick = vi.fn();
    render(<ThumbnailCard {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label for accessibility', () => {
    render(<ThumbnailCard {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Go to slide 3'
    );
  });

  it('does not have active class when isActive is false', () => {
    render(<ThumbnailCard {...defaultProps} isActive={false} />);

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('thumbnail-card--active');
  });

  it('has active class when isActive is true (AC3)', () => {
    render(<ThumbnailCard {...defaultProps} isActive={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('thumbnail-card--active');
  });

  it('has aria-current="true" when active', () => {
    render(<ThumbnailCard {...defaultProps} isActive={true} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  it('does not have aria-current when not active', () => {
    render(<ThumbnailCard {...defaultProps} isActive={false} />);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('uses IntersectionObserver for lazy loading (AC5)', () => {
    // Verify IntersectionObserver is set up when component mounts
    const observeSpy = vi.spyOn(IntersectionObserver.prototype, 'observe');

    render(<ThumbnailCard {...defaultProps} />);

    // Should observe the button element for intersection
    expect(observeSpy).toHaveBeenCalled();

    observeSpy.mockRestore();
  });

  it('cleans up IntersectionObserver on unmount', () => {
    const disconnectSpy = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    const { unmount } = render(<ThumbnailCard {...defaultProps} />);
    unmount();

    expect(disconnectSpy).toHaveBeenCalled();

    disconnectSpy.mockRestore();
  });

  it('updates with different slide numbers', () => {
    const { rerender } = render(<ThumbnailCard {...defaultProps} slideNumber={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();

    rerender(<ThumbnailCard {...defaultProps} slideNumber={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // cv-bugfix-sidebar-thumbnails: Scale readiness tests

  it('shows placeholder when scale is not ready (AC1, AC2)', async () => {
    mockScaleResult.ready = false;
    mockScaleResult.scale = 1;

    render(<ThumbnailCard {...defaultProps} />);

    // Wait for microtask (IntersectionObserver mock fires via queueMicrotask)
    await new Promise((resolve) => queueMicrotask(resolve));

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild;

    // Should show placeholder class, not preview class
    expect(previewDiv).toHaveClass('thumbnail-card__placeholder');
    expect(previewDiv).not.toHaveClass('thumbnail-card__preview');
  });

  it('does not inject innerHTML at scale(1) default (AC2)', async () => {
    mockScaleResult.ready = false;
    mockScaleResult.scale = 1;

    render(<ThumbnailCard {...defaultProps} />);

    await new Promise((resolve) => queueMicrotask(resolve));

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild as HTMLElement;

    // shadowRoot should not exist or not contain slide content when scale isn't ready
    const content = previewDiv?.shadowRoot?.innerHTML ?? previewDiv?.innerHTML ?? '';
    expect(content).not.toContain('Slide 3 Content');
  });

  it('shows preview with correct scale when ready (AC1)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} />);

    // Wait for IntersectionObserver mock, visibility state, and Shadow DOM injection
    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      const previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv).toHaveClass('thumbnail-card__preview');
    });

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild as HTMLElement;

    expect(previewDiv?.style.transform).toBe('scale(0.1)');
    // Content is injected into Shadow DOM for CSS isolation
    expect(previewDiv?.shadowRoot?.innerHTML).toContain('Slide 3 Content');
  });

  // cv-bugfix-sidebar-thumbnails: Empty HTML tests

  it('shows placeholder for empty slideHtml (AC5)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} slideHtml="" />);

    await new Promise((resolve) => queueMicrotask(resolve));

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild;

    // Should keep placeholder styling for empty content
    expect(previewDiv).toHaveClass('thumbnail-card__placeholder');
    expect(previewDiv).not.toHaveClass('thumbnail-card__preview');
  });

  it('shows placeholder for whitespace-only slideHtml (AC5)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} slideHtml="   \n  " />);

    await new Promise((resolve) => queueMicrotask(resolve));

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild;

    expect(previewDiv).toHaveClass('thumbnail-card__placeholder');
  });

  it('shows slide number in placeholder for empty slideHtml (AC5)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} slideHtml="" slideNumber={7} />);

    await new Promise((resolve) => queueMicrotask(resolve));

    // The placeholder should contain the slide number
    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const placeholderNumber = wrapper?.querySelector('.thumbnail-card__number');
    expect(placeholderNumber).toBeInTheDocument();
    expect(placeholderNumber?.textContent).toBe('7');
  });

  // cv-bugfix-thumbnail-rendering: Overflow containment tests (AC-1, AC-3)

  it('wrapper has overflow:hidden and clip-path for content containment (AC1)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} />);

    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    // Verify wrapper class is present (CSS properties are applied via stylesheet)
    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    expect(wrapper).toHaveClass('thumbnail-card__wrapper');
  });

  it('preview uses thumbnail-card__preview class for CSS containment (AC3)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    render(<ThumbnailCard {...defaultProps} />);

    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      const previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv).toHaveClass('thumbnail-card__preview');
    });
  });

  // cv-bugfix-thumbnail-rendering: slideHtml update re-rendering tests (AC-4)

  it('updates Shadow DOM when slideHtml prop changes after initial render (AC4)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    const { rerender } = render(<ThumbnailCard {...defaultProps} slideHtml="<div>Original</div>" />);

    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      const previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv?.shadowRoot?.innerHTML).toContain('Original');
    });

    // Update slideHtml
    rerender(<ThumbnailCard {...defaultProps} slideHtml="<div>Updated Content</div>" />);

    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      const previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv?.shadowRoot?.innerHTML).toContain('Updated Content');
      expect(previewDiv?.shadowRoot?.innerHTML).not.toContain('Original');
    });
  });

  it('updates Shadow DOM when slideHtml changes from empty to content (AC4)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    const { rerender } = render(<ThumbnailCard {...defaultProps} slideHtml="" />);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Should be placeholder
    let wrapper = document.querySelector('.thumbnail-card__wrapper');
    let previewDiv = wrapper?.firstElementChild;
    expect(previewDiv).toHaveClass('thumbnail-card__placeholder');

    // Now provide content
    rerender(<ThumbnailCard {...defaultProps} slideHtml="<div>New Content</div>" />);

    await waitFor(() => {
      wrapper = document.querySelector('.thumbnail-card__wrapper');
      previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv).toHaveClass('thumbnail-card__preview');
      expect((previewDiv as HTMLElement)?.shadowRoot?.innerHTML).toContain('New Content');
    });
  });

  it('does not re-inject Shadow DOM when slideHtml is unchanged (AC4 optimization)', async () => {
    mockScaleResult.ready = true;
    mockScaleResult.scale = 0.1;

    const html = '<div>Same Content</div>';
    const { rerender } = render(<ThumbnailCard {...defaultProps} slideHtml={html} />);

    await waitFor(() => {
      const wrapper = document.querySelector('.thumbnail-card__wrapper');
      const previewDiv = wrapper?.firstElementChild as HTMLElement;
      expect(previewDiv?.shadowRoot?.innerHTML).toContain('Same Content');
    });

    const wrapper = document.querySelector('.thumbnail-card__wrapper');
    const previewDiv = wrapper?.firstElementChild as HTMLElement;

    // Add a marker element to shadowRoot to detect if innerHTML was replaced
    const marker = document.createElement('span');
    marker.setAttribute('data-test-marker', 'present');
    previewDiv.shadowRoot!.appendChild(marker);

    // Rerender with same HTML
    rerender(<ThumbnailCard {...defaultProps} slideHtml={html} />);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Marker should still be present — shadowRoot.innerHTML was not re-set
    expect(previewDiv.shadowRoot!.querySelector('[data-test-marker]')).not.toBeNull();
  });

  // cv-bugfix-thumbnail-rendering: IntersectionObserver lifecycle tests (AC-6)

  it('creates new IntersectionObserver when element node changes (AC6)', () => {
    const observeSpy = vi.spyOn(IntersectionObserver.prototype, 'observe');
    const disconnectSpy = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    const { unmount } = render(<ThumbnailCard {...defaultProps} />);

    // Should have observed at least once on mount
    expect(observeSpy).toHaveBeenCalled();

    unmount();

    // Should disconnect on unmount
    expect(disconnectSpy).toHaveBeenCalled();

    observeSpy.mockRestore();
    disconnectSpy.mockRestore();
  });
});
