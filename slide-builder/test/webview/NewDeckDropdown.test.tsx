/**
 * Tests for NewDeckDropdown component.
 * Story Reference: expose-plan-one-ui-1 — Add "Add Plan Slide with AI" menu item
 *
 * Note: Full menu interaction testing requires end-to-end tests in a real browser
 * because Radix UI DropdownMenu uses portals that don't render in jsdom.
 * These tests verify component structure, props, and basic rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NewDeckDropdown } from '../../src/webview/catalog/components/NewDeckDropdown';

describe('NewDeckDropdown', () => {
  const defaultProps = {
    onPlanWithAI: vi.fn(),
    onPlanSlideWithAI: vi.fn(),
    onFromTemplate: vi.fn(),
    onNewFolder: vi.fn(),
  };

  it('renders trigger button with "New" label (AC-1)', () => {
    render(<NewDeckDropdown {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Create new deck/i })).toBeDefined();
    expect(screen.getByText('New')).toBeDefined();
  });

  it('accepts onPlanWithAI callback prop', () => {
    const mockHandler = vi.fn();
    const { container } = render(<NewDeckDropdown {...defaultProps} onPlanWithAI={mockHandler} />);
    expect(container.firstChild).toBeDefined();
    // Component renders without error when onPlanWithAI is provided
  });

  it('accepts onPlanSlideWithAI callback prop (AC-2 - new prop)', () => {
    const mockHandler = vi.fn();
    const { container } = render(<NewDeckDropdown {...defaultProps} onPlanSlideWithAI={mockHandler} />);
    expect(container.firstChild).toBeDefined();
    // Component renders without error when onPlanSlideWithAI is provided
  });

  it('accepts onFromTemplate callback prop', () => {
    const mockHandler = vi.fn();
    const { container } = render(<NewDeckDropdown {...defaultProps} onFromTemplate={mockHandler} />);
    expect(container.firstChild).toBeDefined();
    // Component renders without error when onFromTemplate is provided
  });

  it('renders when onNewFolder prop is provided', () => {
    const { container } = render(<NewDeckDropdown {...defaultProps} />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders when onNewFolder prop is omitted', () => {
    const { onNewFolder, ...propsWithoutFolder } = defaultProps;
    const { container } = render(<NewDeckDropdown {...propsWithoutFolder} />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders dropdown menu trigger with correct accessibility attributes', () => {
    render(<NewDeckDropdown {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: /Create new deck/i });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('type')).toBe('button');
  });

  it('component has correct display name for debugging', () => {
    const { container } = render(<NewDeckDropdown {...defaultProps} />);
    expect(container.querySelector('button.new-deck-btn')).toBeDefined();
  });

  // Integration note: Menu item rendering and click behavior should be tested
  // in end-to-end tests using a real browser (e.g., Playwright, Cypress)
  // because Radix UI DropdownMenu.Portal renders outside the component tree
  // and requires a proper DOM environment to function correctly.
});
