/**
 * Tests for command palette commands and showDeckPicker utility.
 *
 * Story Reference: cv-1-7 AC-1 through AC-9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, commands, env, workspace } from 'vscode';
import type { DeckInfo } from '../../src/shared/types';

// ── Hoisted mocks (available to vi.mock factories) ──────────────────

const mockScanDecks = vi.hoisted(() => vi.fn());
const mockGetDeckViewerUri = vi.hoisted(() => vi.fn());

// ── Module-level mocks for activate() dependencies ──────────────────

vi.mock('../../src/extension/CatalogDataService', () => ({
  CatalogDataService: vi.fn(() => ({
    scanDecks: mockScanDecks,
    getDeckDetail: vi.fn(),
    getDeckPath: vi.fn(),
    getDeckViewerUri: mockGetDeckViewerUri,
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/extension/PlanEditorProvider', () => {
  const cls = vi.fn(() => ({}));
  (cls as any).viewType = 'slideBuilder.planEditor';
  return { PlanEditorProvider: cls };
});

vi.mock('../../src/extension/CatalogViewProvider', () => {
  const cls = vi.fn(() => ({}));
  (cls as any).viewType = 'slideBuilder.catalogView';
  return { CatalogViewProvider: cls };
});

vi.mock('../../src/extension/FileWatcherService', () => ({
  FileWatcherService: vi.fn(() => ({
    dispose: vi.fn(),
    onDecksChanged: vi.fn(() => ({ dispose: vi.fn() })),
    onFileChanged: vi.fn(() => ({ dispose: vi.fn() })),
    suppressNextRefresh: vi.fn(),
  })),
}));

// ── Imports (after vi.mock to pick up mocked modules) ───────────────

import { showDeckPicker, activate } from '../../src/extension/extension';

// ── Test data ───────────────────────────────────────────────────────

const deckA: DeckInfo = {
  id: 'deck-a',
  name: 'Alpha Deck',
  path: '.slide-builder/decks/deck-a',
  slideCount: 5,
  builtSlideCount: 3,
  status: 'partial',
  lastModified: 1000,
};

const deckB: DeckInfo = {
  id: 'deck-b',
  name: 'Beta Deck',
  path: '.slide-builder/decks/deck-b',
  slideCount: 10,
  builtSlideCount: 10,
  status: 'built',
  lastModified: 2000,
};

const deckC: DeckInfo = {
  id: 'deck-c',
  name: 'Charlie Deck',
  path: '.slide-builder/decks/deck-c',
  slideCount: 2,
  builtSlideCount: 0,
  status: 'planned',
  lastModified: 1500,
};

// ── Helpers ─────────────────────────────────────────────────────────

const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Slide Builder',
} as any;

function createMockDataService(decks: DeckInfo[] = []) {
  return {
    scanDecks: vi.fn().mockResolvedValue(decks),
    getDeckDetail: vi.fn().mockResolvedValue(null),
    getDeckPath: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

// ── showDeckPicker tests (uses direct mock dataService) ─────────────

describe('showDeckPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset showQuickPick to clean default
    vi.mocked(window.showQuickPick).mockReset();
    vi.mocked(window.showQuickPick).mockResolvedValue(undefined as any);
  });

  it('returns undefined and shows info message when no decks exist (AC-3)', async () => {
    const dataService = createMockDataService([]);

    const result = await showDeckPicker(dataService, 'Pick a deck');

    expect(result).toBeUndefined();
    expect(window.showInformationMessage).toHaveBeenCalledWith(
      'No decks found. Create a deck first.'
    );
    expect(window.showQuickPick).not.toHaveBeenCalled();
  });

  it('sorts decks by lastModified descending (AC-9)', async () => {
    const dataService = createMockDataService([deckA, deckB, deckC]);

    await showDeckPicker(dataService, 'Pick');

    const items = vi.mocked(window.showQuickPick).mock.calls[0][0] as any[];
    expect(items[0].label).toBe('Beta Deck'); // lastModified: 2000
    expect(items[1].label).toBe('Charlie Deck'); // lastModified: 1500
    expect(items[2].label).toBe('Alpha Deck'); // lastModified: 1000
  });

  it('creates QuickPickItems with name, slide count, and status (AC-9)', async () => {
    const dataService = createMockDataService([deckA]);

    await showDeckPicker(dataService, 'Pick');

    const items = vi.mocked(window.showQuickPick).mock.calls[0][0] as any[];
    expect(items[0]).toEqual(
      expect.objectContaining({
        label: 'Alpha Deck',
        description: '5 slides',
        detail: 'Status: partial',
      })
    );
  });

  it('passes placeholder to showQuickPick options (AC-3)', async () => {
    const dataService = createMockDataService([deckA]);

    await showDeckPicker(dataService, 'Select a deck to view');

    const options = vi.mocked(window.showQuickPick).mock.calls[0][1];
    expect(options).toEqual({ placeHolder: 'Select a deck to view' });
  });

  it('returns selected DeckInfo when user picks a deck (AC-3)', async () => {
    const dataService = createMockDataService([deckA]);
    vi.mocked(window.showQuickPick).mockResolvedValueOnce({
      label: deckA.name,
      description: '5 slides',
      detail: 'Status: partial',
      deckInfo: deckA,
    } as any);

    const result = await showDeckPicker(dataService, 'Pick');

    expect(result).toEqual(deckA);
  });

  it('returns undefined when user cancels (Escape) (AC-3)', async () => {
    const dataService = createMockDataService([deckA]);

    const result = await showDeckPicker(dataService, 'Pick');

    expect(result).toBeUndefined();
  });
});

// ── Command handler tests ───────────────────────────────────────────

describe('command handlers (via activate)', () => {
  let registeredCommands: Map<string, (...args: any[]) => any>;

  beforeEach(() => {
    vi.clearAllMocks();
    registeredCommands = new Map();

    // Reset showQuickPick to a clean default (clears unconsumed once queue)
    vi.mocked(window.showQuickPick).mockReset();
    vi.mocked(window.showQuickPick).mockResolvedValue(undefined as any);

    // Capture each registerCommand call
    vi.mocked(commands.registerCommand).mockImplementation(
      (commandId: string, callback: (...args: any[]) => any) => {
        registeredCommands.set(commandId, callback);
        return { dispose: vi.fn() };
      }
    );

    // Wire up outputChannel mock
    vi.mocked(window.createOutputChannel).mockReturnValue(mockOutputChannel);

    // Set up CatalogDataService mock to return test decks
    mockScanDecks.mockResolvedValue([deckA, deckB, deckC]);

    // Activate extension to capture commands
    const mockContext = {
      extensionUri: { fsPath: '/mock/ext', toString: () => '/mock/ext' },
      subscriptions: [],
    } as any;
    activate(mockContext);
  });

  describe('command registration (AC-1, AC-7)', () => {
    it('registers all 6 commands', () => {
      expect(registeredCommands.has('slideBuilder.openCatalog')).toBe(true);
      expect(registeredCommands.has('slideBuilder.viewDeck')).toBe(true);
      expect(registeredCommands.has('slideBuilder.presentDeck')).toBe(true);
      expect(registeredCommands.has('slideBuilder.buildDeck')).toBe(true);
      expect(registeredCommands.has('slideBuilder.buildSlide')).toBe(true);
      expect(registeredCommands.has('slideBuilder.newDeck')).toBe(true);
    });
  });

  describe('slideBuilder.openCatalog (AC-2)', () => {
    it('focuses the catalog view via executeCommand', () => {
      registeredCommands.get('slideBuilder.openCatalog')!();

      expect(commands.executeCommand).toHaveBeenCalledWith(
        'slideBuilder.catalogView.focus'
      );
    });
  });

  describe('slideBuilder.viewDeck (AC-10, cv-2-1)', () => {
    it('opens SlideViewerPanel when a deck is selected', async () => {
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: deckB.name,
        description: '10 slides',
        detail: 'Status: built',
        deckInfo: deckB,
      } as any);

      await registeredCommands.get('slideBuilder.viewDeck')!();

      // Should create a WebviewPanel (via SlideViewerPanel.createOrShow)
      expect(window.createWebviewPanel).toHaveBeenCalledWith(
        'slideBuilder.slideViewer',
        'Slides: Beta Deck',
        expect.any(Number),
        expect.objectContaining({
          enableScripts: true,
          retainContextWhenHidden: true,
        })
      );
    });

    it('does nothing when user cancels deck picker', async () => {
      await registeredCommands.get('slideBuilder.viewDeck')!();

      expect(window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('CV-2')
      );
    });
  });

  describe('slideBuilder.presentDeck (cv-2-4 AC-4)', () => {
    it('opens browser via openExternal for a built deck', async () => {
      const mockViewerUri = {
        fsPath: '/workspace/output/deck-b/index.html',
        toString: () => '/workspace/output/deck-b/index.html',
        scheme: 'file',
      };
      mockGetDeckViewerUri.mockResolvedValueOnce(mockViewerUri);
      vi.mocked(workspace.fs.stat).mockResolvedValueOnce({ type: 1 } as any);
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: deckB.name,
        deckInfo: deckB,
      } as any);

      await registeredCommands.get('slideBuilder.presentDeck')!();

      expect(mockGetDeckViewerUri).toHaveBeenCalledWith('deck-b');
      expect(env.openExternal).toHaveBeenCalledWith(mockViewerUri);
    });

    it('shows error when deck has no built slides', async () => {
      mockGetDeckViewerUri.mockResolvedValueOnce({
        fsPath: '/workspace/output/deck-c/index.html',
        toString: () => '/workspace/output/deck-c/index.html',
        scheme: 'file',
      });
      vi.mocked(workspace.fs.stat).mockRejectedValueOnce(new Error('FileNotFound'));
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: deckC.name,
        deckInfo: deckC,
      } as any);

      await registeredCommands.get('slideBuilder.presentDeck')!();

      expect(env.openExternal).not.toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        'Cannot present — no built slides. Build your deck first.'
      );
    });

    it('does nothing when user cancels', async () => {
      await registeredCommands.get('slideBuilder.presentDeck')!();

      expect(env.openExternal).not.toHaveBeenCalled();
    });
  });

  describe('slideBuilder.buildDeck (AC-6)', () => {
    it('shows "Coming in Epic CV-3" when a deck is selected', async () => {
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: deckB.name,
        deckInfo: deckB,
      } as any);

      await registeredCommands.get('slideBuilder.buildDeck')!();

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        'Build integration coming in Epic CV-3'
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'Build All Slides: Beta Deck'
      );
    });

    it('does nothing when user cancels', async () => {
      await registeredCommands.get('slideBuilder.buildDeck')!();

      expect(window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('CV-3')
      );
    });
  });

  describe('slideBuilder.buildSlide (AC-6)', () => {
    it('shows "Coming in Epic CV-3" when a deck is selected', async () => {
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: deckC.name,
        deckInfo: deckC,
      } as any);

      await registeredCommands.get('slideBuilder.buildSlide')!();

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        'Build integration coming in Epic CV-3'
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'Build Current Slide: Charlie Deck'
      );
    });

    it('does nothing when user cancels', async () => {
      await registeredCommands.get('slideBuilder.buildSlide')!();

      expect(window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('CV-3')
      );
    });
  });

  describe('slideBuilder.newDeck (AC-4)', () => {
    it('shows QuickPick with "Plan with AI" and "From Template" options', async () => {
      await registeredCommands.get('slideBuilder.newDeck')!();

      const items = vi.mocked(window.showQuickPick).mock.calls[0][0] as any[];
      expect(items).toHaveLength(2);
      expect(items[0].label).toContain('Plan with AI');
      expect(items[1].label).toContain('From Template');
    });

    it('logs choice and shows info message when option is selected', async () => {
      vi.mocked(window.showQuickPick).mockResolvedValueOnce({
        label: '$(sparkle) Plan with AI',
        description: 'Start a guided AI planning session',
      } as any);

      await registeredCommands.get('slideBuilder.newDeck')!();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'New Deck: $(sparkle) Plan with AI'
      );
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        'Deck creation coming in Epic CV-3'
      );
    });

    it('does nothing when user cancels', async () => {
      await registeredCommands.get('slideBuilder.newDeck')!();

      expect(window.showInformationMessage).not.toHaveBeenCalledWith(
        expect.stringContaining('Deck creation')
      );
    });
  });

  describe('error handling', () => {
    it('catches and logs errors in deck-context commands', async () => {
      const error = new Error('scan failure');
      mockScanDecks.mockRejectedValueOnce(error);

      await registeredCommands.get('slideBuilder.viewDeck')!();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('slideBuilder.viewDeck error:')
      );
    });

    it('catches and logs errors in newDeck command', async () => {
      const error = new Error('pick failure');
      vi.mocked(window.showQuickPick).mockRejectedValueOnce(error);

      await registeredCommands.get('slideBuilder.newDeck')!();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('slideBuilder.newDeck error:')
      );
    });
  });
});
