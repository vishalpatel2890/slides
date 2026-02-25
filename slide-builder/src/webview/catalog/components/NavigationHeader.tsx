/**
 * NavigationHeader - Section title with optional back navigation.
 *
 * Story Reference: cv-1-2 Task 3 — NavigationHeader component
 *
 * AC-4: Shows section title, back arrow when drilled in
 */

import React, { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export interface NavigationHeaderProps {
  actions?: React.ReactNode;
}

export function NavigationHeader({ actions }: NavigationHeaderProps): React.ReactElement {
  const { state, dispatch } = useCatalog();
  const stack = state.navigationStack;
  const currentEntry = stack[stack.length - 1];
  const canGoBack = stack.length > 1;
  const parentEntry = canGoBack ? stack[stack.length - 2] : null;

  const handleBack = useCallback(() => {
    dispatch({ type: 'NAVIGATE_BACK' });
  }, [dispatch]);

  return (
    <div className="catalog-nav-header" role="navigation" aria-label="Catalog navigation">
      {canGoBack && (
        <button
          className="catalog-nav-header__back"
          onClick={handleBack}
          aria-label={`Back to ${parentEntry?.label ?? 'previous'}`}
          type="button"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <h2 className="catalog-nav-header__title">
        {currentEntry?.label ?? ''}
      </h2>
      <div className="catalog-nav-header__actions">{actions}</div>
    </div>
  );
}
