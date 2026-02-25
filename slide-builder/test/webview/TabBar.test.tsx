/**
 * Tests for TabBar component.
 *
 * Story Reference: cv-1-2 Task 2 — TabBar component
 * AC-4: Three tabs with ARIA roles (tablist, tab, aria-selected)
 * AC-5: Responsive collapse to icons-only with tooltips at < 400px
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { TabBar } from '../../src/webview/catalog/components/TabBar';

// =============================================================================
// ResizeObserver Mock
// =============================================================================

let resizeCallback: ResizeObserverCallback;

class ResizeObserverMock implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

// =============================================================================
// Helper
// =============================================================================

function renderTabBar(overrides?: Parameters<typeof CatalogProvider>[0]['initialOverrides']) {
  return render(
    <CatalogProvider initialOverrides={overrides}>
      <TabBar />
    </CatalogProvider>
  );
}

function simulateResize(width: number) {
  resizeCallback(
    [{ contentRect: { width } } as ResizeObserverEntry],
    {} as ResizeObserver,
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('TabBar', () => {
  it('renders three tabs (AC-4)', () => {
    renderTabBar();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('has role="tablist" on container (AC-4)', () => {
    renderTabBar();
    expect(screen.getByRole('tablist')).toBeDefined();
  });

  it('shows correct tab labels', () => {
    renderTabBar();
    expect(screen.getByText('Decks')).toBeDefined();
    expect(screen.getByText('Brand Assets')).toBeDefined();
    expect(screen.getByText('Templates')).toBeDefined();
  });

  it('Decks tab is active by default with aria-selected=true (AC-4)', () => {
    renderTabBar();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has tabindex=0, inactive tabs have tabindex=-1', () => {
    renderTabBar();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });

  it('clicking a tab switches active tab', () => {
    renderTabBar();
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[1]); // Brand Assets
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking Templates tab makes it active', () => {
    renderTabBar();
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[2]); // Templates
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  describe('Keyboard navigation', () => {
    it('ArrowRight moves to next tab', () => {
      renderTabBar();
      const tablist = screen.getByRole('tablist');

      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowLeft wraps from first to last tab', () => {
      renderTabBar();
      const tablist = screen.getByRole('tablist');

      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
      const tabs = screen.getAllByRole('tab');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowRight wraps from last to first tab', () => {
      renderTabBar({ activeTab: 'templates' });
      const tablist = screen.getByRole('tablist');

      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('Home key moves to first tab', () => {
      renderTabBar({ activeTab: 'templates' });
      const tablist = screen.getByRole('tablist');

      fireEvent.keyDown(tablist, { key: 'Home' });
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('End key moves to last tab', () => {
      renderTabBar();
      const tablist = screen.getByRole('tablist');

      fireEvent.keyDown(tablist, { key: 'End' });
      const tabs = screen.getAllByRole('tab');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Responsive collapse (AC-5)', () => {
    it('shows labels at >= 400px width', async () => {
      const { rerender } = renderTabBar();

      // Simulate wide container
      await vi.waitFor(() => {
        simulateResize(500);
      });

      rerender(
        <CatalogProvider>
          <TabBar />
        </CatalogProvider>
      );

      expect(screen.getByText('Decks')).toBeDefined();
      expect(screen.getByText('Brand Assets')).toBeDefined();
      expect(screen.getByText('Templates')).toBeDefined();
    });

    it('hides labels at < 400px width', async () => {
      renderTabBar();

      await act(async () => {
        simulateResize(350);
      });

      expect(screen.queryByText('Decks')).toBeNull();
      expect(screen.queryByText('Brand Assets')).toBeNull();
      expect(screen.queryByText('Templates')).toBeNull();
    });
  });
});
