import { useCallback, useMemo } from 'react';
import type { ViewerV2WebviewMessage } from '../../../shared/types';

/**
 * VS Code API interface.
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

// Singleton VS Code API instance
let vscodeApi: VSCodeAPI | null = null;

/**
 * Get or create the VS Code API singleton.
 * Must only be called once per webview.
 */
function getVSCodeApi(): VSCodeAPI {
  if (vscodeApi === null) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

/**
 * Hook providing VS Code API with typed message sending.
 * Ensures acquireVsCodeApi() is called only once.
 *
 * Story Reference: v2-1-1 Task 6.6
 */
export function useVsCodeApi() {
  const api = useMemo(() => getVSCodeApi(), []);

  const postMessage = useCallback(
    (message: ViewerV2WebviewMessage) => {
      api.postMessage(message);
    },
    [api]
  );

  const getState = useCallback(() => {
    return api.getState();
  }, [api]);

  const setState = useCallback(
    (state: unknown) => {
      api.setState(state);
    },
    [api]
  );

  return {
    postMessage,
    getState,
    setState,
  };
}

/**
 * Send the v2-ready message to extension host.
 * Called once on viewer mount.
 */
export function sendV2Ready(): void {
  getVSCodeApi().postMessage({ type: 'v2-ready' });
}
