/**
 * Tests for ThumbnailSkeleton component.
 * Story Reference: cv-1-4 Task 2 — ThumbnailSkeleton component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ThumbnailSkeleton } from '../../src/webview/catalog/components/ThumbnailSkeleton';

describe('ThumbnailSkeleton', () => {
  it('renders with aria-hidden="true" (AC-5)', () => {
    const { container } = render(<ThumbnailSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies thumbnail-skeleton base class', () => {
    const { container } = render(<ThumbnailSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('thumbnail-skeleton');
  });

  it('appends additional className', () => {
    const { container } = render(<ThumbnailSkeleton className="extra" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('extra');
  });

  it('trims className when no additional class provided', () => {
    const { container } = render(<ThumbnailSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toMatch(/\s$/);
  });
});
