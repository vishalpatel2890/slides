/**
 * Tests for EmptyState component.
 * Story Reference: cv-1-4 Task 3 — EmptyState component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../../src/webview/catalog/components/EmptyState';

describe('EmptyState', () => {
  it('renders with role="status" (AC-6)', () => {
    render(<EmptyState section="decks" />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  describe('decks section', () => {
    it('shows "No decks yet" title', () => {
      render(<EmptyState section="decks" />);
      expect(screen.getByText('No decks yet')).toBeDefined();
    });

    it('shows guidance hint text', () => {
      render(<EmptyState section="decks" />);
      expect(screen.getByText(/Create a deck using/)).toBeDefined();
    });

    it('shows "New Deck" CTA button', () => {
      render(<EmptyState section="decks" />);
      expect(screen.getByRole('button', { name: /New Deck/ })).toBeDefined();
    });

    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<EmptyState section="decks" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /New Deck/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });
  });

  describe('brand-assets section', () => {
    it('shows "No brand assets" title', () => {
      render(<EmptyState section="brand-assets" />);
      expect(screen.getByText('No brand assets')).toBeDefined();
    });

    it('does not render CTA button', () => {
      render(<EmptyState section="brand-assets" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('templates section', () => {
    it('shows "No templates" title', () => {
      render(<EmptyState section="templates" />);
      expect(screen.getByText('No templates')).toBeDefined();
    });

    it('does not render CTA button', () => {
      render(<EmptyState section="templates" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('search context (cv-1-5 AC-3)', () => {
    it('shows "No results for \'{query}\'" when search query provided', () => {
      render(<EmptyState section="decks" searchContext={{ query: 'zzzzz', hasFilters: false }} />);
      expect(screen.getByText("No results for 'zzzzz'")).toBeDefined();
    });

    it('shows "No results match the active filters" when only filters active', () => {
      render(<EmptyState section="decks" searchContext={{ query: '', hasFilters: true }} />);
      expect(screen.getByText('No results match the active filters')).toBeDefined();
    });

    it('shows "Clear filters" link', () => {
      render(<EmptyState section="decks" searchContext={{ query: 'test', hasFilters: false }} />);
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeDefined();
    });

    it('calls onClearFilters when "Clear filters" link clicked', () => {
      const onClearFilters = vi.fn();
      render(<EmptyState section="decks" searchContext={{ query: 'test', hasFilters: false }} onClearFilters={onClearFilters} />);
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
      expect(onClearFilters).toHaveBeenCalledOnce();
    });

    it('does not show default empty state when searchContext provided', () => {
      render(<EmptyState section="decks" searchContext={{ query: 'test', hasFilters: false }} />);
      expect(screen.queryByText('No decks yet')).toBeNull();
    });

    it('shows default empty state when searchContext has no query and no filters', () => {
      render(<EmptyState section="decks" searchContext={{ query: '', hasFilters: false }} />);
      expect(screen.getByText('No decks yet')).toBeDefined();
    });
  });
});
