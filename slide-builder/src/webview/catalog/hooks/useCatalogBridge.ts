/**
 * useCatalogBridge - Connects catalog webview to extension host via postMessage.
 *
 * Story Reference: cv-1-3 AC-4 — Deck data exchange via messages
 * Story Reference: cv-3-3 — Folder data exchange via messages
 * Story Reference: cv-3-5 AC-29 — Build progress tracking
 *
 * On mount: sends { type: 'ready' } to trigger initial deck scan.
 * Listens for catalog-data messages and dispatches SET_DECKS and SET_FOLDERS.
 */

import { useEffect, useRef } from 'react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { useCatalog } from '../context/CatalogContext';
import type { CatalogExtensionMessage, BuildProgress, BuildSlideStatus, DeckDetail } from '../../../shared/types';

/**
 * Creates initial build progress from deck detail.
 */
function createInitialBuildProgress(deckDetail: DeckDetail, mode: 'all' | 'one'): BuildProgress {
  const slides: BuildSlideStatus[] = deckDetail.slides.map((slide, index) => ({
    number: slide.number,
    name: slide.intent ?? `Slide ${slide.number}`,
    status: index === 0 ? 'building' : 'pending',
    htmlPath: slide.htmlPath,
    thumbnailUri: slide.thumbnailUri,
  }));

  return {
    deckId: deckDetail.id,
    deckName: deckDetail.name,
    status: 'building',
    slides,
    startedAt: Date.now(),
  };
}

export function useCatalogBridge(): void {
  const { dispatch } = useCatalog();
  // cv-3-5: Track pending build initialization
  const pendingBuildRef = useRef<{ deckId: string; mode: 'all' | 'one' } | null>(null);

  useEffect(() => {
    const api = getVSCodeApi();

    function handleMessage(event: MessageEvent<CatalogExtensionMessage>) {
      const message = event.data;
      switch (message.type) {
        case 'catalog-data':
          dispatch({ type: 'SET_DECKS', decks: message.decks });
          // cv-3-3: Also dispatch folders if present
          if ('folders' in message && message.folders) {
            dispatch({ type: 'SET_FOLDERS', folders: message.folders });
          }
          break;
        case 'deck-detail': {
          dispatch({ type: 'SET_DECK_DETAIL', deck: message.deck });

          // cv-3-5: If we have a pending build for this deck, initialize build progress
          if (pendingBuildRef.current && pendingBuildRef.current.deckId === message.deck.id) {
            const buildProgress = createInitialBuildProgress(message.deck, pendingBuildRef.current.mode);
            dispatch({ type: 'SET_BUILD_PROGRESS', progress: buildProgress });
            pendingBuildRef.current = null;
          }
          break;
        }
        case 'folder-created':
          // cv-3-3 AC-16: Mark newly created folder for entrance animation
          dispatch({ type: 'SET_NEW_FOLDER', folderId: message.folderId });
          break;

        case 'build-triggered': {
          // cv-3-5 AC-29: Initialize build progress when build is triggered
          const deckId = message.deckId;
          const mode = message.mode;

          // Mark pending build so deck-detail handler can initialize progress
          pendingBuildRef.current = { deckId, mode };

          // Request deck detail to get slide list for progress tracking
          api.postMessage({ type: 'request-deck-detail', deckId });

          // Note: BuildProgress is shown as overlay based on buildProgress state
          // No navigation entry needed - user stays at current view
          break;
        }

        case 'build-progress':
          // cv-3-5 AC-29-AC40: Update build progress state
          dispatch({ type: 'SET_BUILD_PROGRESS', progress: message.progress });
          break;

        case 'brand-assets':
          // cv-4-1: Update brand assets state
          dispatch({ type: 'SET_BRAND_ASSETS', assets: message.assets });
          break;

        case 'templates':
          // cv-5-1: Update template state
          dispatch({ type: 'SET_SLIDE_TEMPLATES', templates: message.slideTemplates });
          dispatch({ type: 'SET_DECK_TEMPLATES', templates: message.deckTemplates });
          break;

        case 'deck-templates-updated':
          // tm-3-2: Deck template files changed externally — request fresh template data
          api.postMessage({ type: 'request-templates' });
          break;

        case 'view-preference':
          // v3-2-1 AC-2, AC-3: Initialize view mode from persisted preference
          dispatch({ type: 'SET_VIEW_MODE', mode: message.mode });
          break;

        case 'brand-status':
          // bt-1-1 AC-1, AC-2, AC-4: Update brand theme existence state
          dispatch({ type: 'SET_BRAND_STATUS', hasTheme: message.hasTheme });
          break;

        case 'deck-renamed':
          // rename-deck-2 AC-6: Deck renamed — FileWatcherService triggers catalog refresh.
          // RenameDeckDialog handles closing itself via its own message listener.
          break;

        case 'error':
          // Error handling will be expanded in future stories
          break;
      }
    }

    window.addEventListener('message', handleMessage);

    // Send ready message to trigger initial data load (AC-4)
    api.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);
}
