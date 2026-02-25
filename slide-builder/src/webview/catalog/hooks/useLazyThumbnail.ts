/**
 * useLazyThumbnail - Lazy loads deck thumbnails using IntersectionObserver.
 *
 * Story Reference: cv-5-3
 * AC-18: Skeleton shimmer placeholders while thumbnails generate
 * AC-21: Thumbnails load lazily via IntersectionObserver - only visible cards trigger generation
 *
 * Usage:
 *   const { ref, isLoading, thumbnailUri, error } = useLazyThumbnail(deckId, slidePath);
 *   return <div ref={ref}>{isLoading ? <Skeleton /> : <img src={thumbnailUri} />}</div>
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import type { CatalogExtensionMessage } from '../../../shared/types';

interface ThumbnailState {
  isLoading: boolean;
  thumbnailUri: string | undefined;
  error: boolean;
}

// Global registry to track pending and completed thumbnails
const thumbnailRegistry = new Map<string, ThumbnailState>();
const pendingRequests = new Set<string>();
const stateListeners = new Map<string, Set<() => void>>();

/**
 * Subscribe to state changes for a thumbnail ID.
 */
function subscribeToState(id: string, callback: () => void): () => void {
  if (!stateListeners.has(id)) {
    stateListeners.set(id, new Set());
  }
  stateListeners.get(id)!.add(callback);
  return () => {
    stateListeners.get(id)?.delete(callback);
  };
}

/**
 * Notify listeners of state change for a thumbnail ID.
 */
function notifyListeners(id: string): void {
  stateListeners.get(id)?.forEach((callback) => callback());
}

/**
 * Global message handler for thumbnail-ready messages.
 * Must be initialized once in the app.
 */
let messageHandlerInitialized = false;

function initializeMessageHandler(): void {
  if (messageHandlerInitialized) {
    return;
  }
  messageHandlerInitialized = true;

  function handleMessage(event: MessageEvent<CatalogExtensionMessage>) {
    const message = event.data;
    if (message.type === 'thumbnail-ready') {
      const { id, uri } = message;
      pendingRequests.delete(id);

      const hasUri = uri && uri.length > 0;
      thumbnailRegistry.set(id, {
        isLoading: false,
        thumbnailUri: hasUri ? uri : undefined,
        error: !hasUri,
      });
      notifyListeners(id);
    }
  }

  window.addEventListener('message', handleMessage);
}

export interface UseLazyThumbnailResult {
  /** Ref to attach to the container element for IntersectionObserver */
  ref: React.RefCallback<HTMLElement>;
  /** Whether the thumbnail is currently loading */
  isLoading: boolean;
  /** Webview-safe URI to the thumbnail image */
  thumbnailUri: string | undefined;
  /** Whether thumbnail generation failed */
  error: boolean;
}

/**
 * Hook that provides lazy thumbnail loading with IntersectionObserver.
 *
 * @param id - Unique identifier for the thumbnail (e.g., deck ID)
 * @param sourcePath - Path to the slide HTML file for thumbnail generation
 * @returns Object with ref, isLoading, thumbnailUri, and error state
 */
export function useLazyThumbnail(
  id: string,
  sourcePath: string | undefined
): UseLazyThumbnailResult {
  // Initialize global message handler once
  useEffect(() => {
    initializeMessageHandler();
  }, []);

  // Local state derived from global registry
  const [state, setState] = useState<ThumbnailState>(() => {
    return thumbnailRegistry.get(id) ?? {
      isLoading: false,
      thumbnailUri: undefined,
      error: false,
    };
  });

  // Track the observed element
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasRequestedRef = useRef(false);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToState(id, () => {
      const newState = thumbnailRegistry.get(id);
      if (newState) {
        setState(newState);
      }
    });
    return unsubscribe;
  }, [id]);

  // Request thumbnail when element becomes visible
  const requestThumbnail = useCallback(() => {
    if (!sourcePath || hasRequestedRef.current || pendingRequests.has(id)) {
      return;
    }

    // Check if already in registry
    const existing = thumbnailRegistry.get(id);
    if (existing && (existing.thumbnailUri || existing.error)) {
      setState(existing);
      return;
    }

    // Mark as loading and request
    hasRequestedRef.current = true;
    pendingRequests.add(id);
    thumbnailRegistry.set(id, {
      isLoading: true,
      thumbnailUri: undefined,
      error: false,
    });
    setState({ isLoading: true, thumbnailUri: undefined, error: false });

    const api = getVSCodeApi();
    api.postMessage({
      type: 'request-thumbnail',
      id,
      sourcePath,
    });
  }, [id, sourcePath]);

  // Set up IntersectionObserver
  const refCallback = useCallback(
    (element: HTMLElement | null) => {
      // Clean up old observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      elementRef.current = element;

      if (!element || !sourcePath) {
        return;
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            requestThumbnail();
          }
        },
        {
          rootMargin: '100px', // Start loading slightly before visible
          threshold: 0,
        }
      );

      observerRef.current.observe(element);
    },
    [sourcePath, requestThumbnail]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref: refCallback,
    isLoading: state.isLoading,
    thumbnailUri: state.thumbnailUri,
    error: state.error,
  };
}

/**
 * Clear thumbnail cache for a specific ID (useful when source changes).
 */
export function clearThumbnailCache(id: string): void {
  thumbnailRegistry.delete(id);
  pendingRequests.delete(id);
}

/**
 * Clear all thumbnail cache.
 */
export function clearAllThumbnailCache(): void {
  thumbnailRegistry.clear();
  pendingRequests.clear();
}
