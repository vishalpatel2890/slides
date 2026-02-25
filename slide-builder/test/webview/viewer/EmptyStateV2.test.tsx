/**
 * Tests for EmptyStateV2 component.
 * v2-1-2 AC-10: Empty state with icon, message, and CTA
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateV2 } from '../../../src/webview/viewer/components/EmptyStateV2';

describe('EmptyStateV2', () => {
  it('displays "No slides built yet" message (AC-10)', () => {
    const mockPostMessage = vi.fn();
    render(<EmptyStateV2 postMessage={mockPostMessage} />);

    expect(screen.getByText('No slides built yet')).toBeInTheDocument();
  });

  it('displays Open Plan Editor CTA button (AC-10)', () => {
    const mockPostMessage = vi.fn();
    render(<EmptyStateV2 postMessage={mockPostMessage} />);

    expect(screen.getByRole('button', { name: /open plan editor/i })).toBeInTheDocument();
  });

  it('sends v2-open-plan-editor message on CTA click', () => {
    const mockPostMessage = vi.fn();
    render(<EmptyStateV2 postMessage={mockPostMessage} />);

    const button = screen.getByRole('button', { name: /open plan editor/i });
    fireEvent.click(button);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'v2-open-plan-editor' });
  });

  it('displays slide icon', () => {
    const mockPostMessage = vi.fn();
    render(<EmptyStateV2 postMessage={mockPostMessage} />);

    const iconContainer = document.querySelector('.viewer-empty-state__icon');
    expect(iconContainer).toBeInTheDocument();
    // Check for Lucide Presentation icon
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('displays hint text for user guidance', () => {
    const mockPostMessage = vi.fn();
    render(<EmptyStateV2 postMessage={mockPostMessage} />);

    expect(screen.getByText(/open the plan editor/i)).toBeInTheDocument();
  });
});
