/**
 * TabBar - Three-tab navigation for the Catalog panel.
 *
 * Story Reference: cv-1-2 Task 2 — TabBar component
 *
 * AC-4: Three tabs with ARIA roles (tablist, tab, aria-selected)
 * AC-5: Responsive collapse to icons-only with tooltips at < 400px
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGrid, Palette, FileText } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useCatalog } from '../context/CatalogContext';
import type { CatalogTab } from '../../../shared/types';

// =============================================================================
// Tab Configuration
// =============================================================================

interface TabConfig {
  id: CatalogTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'decks', label: 'Decks', icon: <LayoutGrid size={16} /> },
  { id: 'brand-assets', label: 'Brand Assets', icon: <Palette size={16} /> },
  { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
];

const COLLAPSE_WIDTH = 400;

// =============================================================================
// Component
// =============================================================================

export function TabBar(): React.ReactElement {
  const { state, dispatch } = useCatalog();
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Observe container width for responsive collapse (AC-5)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCollapsed(entry.contentRect.width < COLLAPSE_WIDTH);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTabClick = useCallback(
    (tab: CatalogTab) => {
      dispatch({ type: 'SET_TAB', tab });
    },
    [dispatch],
  );

  // Keyboard navigation: Arrow keys move between tabs, Home/End jump to first/last
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === state.activeTab);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % TABS.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        nextIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        nextIndex = TABS.length - 1;
        e.preventDefault();
      }

      if (nextIndex !== currentIndex) {
        dispatch({ type: 'SET_TAB', tab: TABS[nextIndex].id });
        const tablist = e.currentTarget;
        const tabs = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        tabs[nextIndex]?.focus();
      }
    },
    [state.activeTab, dispatch],
  );

  return (
    <Tooltip.Provider delayDuration={300}>
      <div
        ref={containerRef}
        className="catalog-tabbar"
        role="tablist"
        aria-label="Catalog sections"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const isActive = state.activeTab === tab.id;

          return (
            <Tooltip.Root key={tab.id}>
              <Tooltip.Trigger asChild>
                <button
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={`catalog-tab${isActive ? ' catalog-tab--active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="catalog-tab__icon">{tab.icon}</span>
                  {!collapsed && <span className="catalog-tab__label">{tab.label}</span>}
                </button>
              </Tooltip.Trigger>
              {collapsed && (
                <Tooltip.Portal>
                  <Tooltip.Content className="catalog-tooltip" sideOffset={4}>
                    {tab.label}
                    <Tooltip.Arrow className="catalog-tooltip__arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
}
