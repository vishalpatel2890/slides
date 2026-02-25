/**
 * Tests for FileWatcherService — plan.yaml change detection.
 *
 * Story Reference: v3-6-1 AC-1, AC-2, AC-7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { workspace, Uri } from 'vscode';
import { FileWatcherService } from '../../src/extension/FileWatcherService';

const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Test Channel',
} as any;

const workspaceRoot = Uri.file('/mock/workspace');

describe('FileWatcherService plan change detection (v3-6-1)', () => {
  let service: FileWatcherService;
  let mockWatchers: any[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockWatchers = [];
    vi.mocked(workspace.createFileSystemWatcher).mockImplementation(() => {
      const watcher = {
        onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        dispose: vi.fn(),
      };
      mockWatchers.push(watcher);
      return watcher as any;
    });

    service = new FileWatcherService(workspaceRoot, mockOutputChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires callback when plan.yaml in output/ changes (AC-1)', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    // Simulate plan.yaml change via output watcher (second watcher)
    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    const planUri = Uri.file('/mock/workspace/output/my-deck/plan.yaml');
    changeHandler(planUri);

    // Before 300ms debounce
    expect(callback).not.toHaveBeenCalled();

    // After 300ms debounce
    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(planUri);
  });

  it('fires callback when plan.yml in output/ changes', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    const planUri = Uri.file('/mock/workspace/output/my-deck/plan.yml');
    changeHandler(planUri);

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires callback on plan.yaml create (AC-1)', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const createHandler = mockWatchers[1].onDidCreate.mock.calls[0][0];
    const planUri = Uri.file('/mock/workspace/output/new-deck/plan.yaml');
    createHandler(planUri);

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(planUri);
  });

  it('fires callback on plan.yaml delete', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const deleteHandler = mockWatchers[1].onDidDelete.mock.calls[0][0];
    const planUri = Uri.file('/mock/workspace/output/old-deck/plan.yaml');
    deleteHandler(planUri);

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not fire for plan.yaml outside output/ directory (AC-7)', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    // .slide-builder watcher (first watcher) fires for non-output path
    const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
    changeHandler(Uri.file('/mock/workspace/.slide-builder/decks/my-deck/plan.yaml'));

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not fire for non-plan files in output/', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    changeHandler(Uri.file('/mock/workspace/output/my-deck/slides/slide-1.html'));
    changeHandler(Uri.file('/mock/workspace/output/my-deck/manifest.json'));
    changeHandler(Uri.file('/mock/workspace/output/my-deck/status.yaml'));

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });

  it('debounces rapid plan changes at 300ms (AC-2)', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    const planUri = Uri.file('/mock/workspace/output/my-deck/plan.yaml');

    // Rapid changes
    changeHandler(planUri);
    vi.advanceTimersByTime(100);
    changeHandler(planUri);
    vi.advanceTimersByTime(100);
    changeHandler(planUri);

    // Not fired yet
    expect(callback).not.toHaveBeenCalled();

    // After 300ms from last change
    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('returns disposable that unregisters callback', () => {
    const callback = vi.fn();
    const disposable = service.onPlanChanged(callback);
    disposable.dispose();

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    changeHandler(Uri.file('/mock/workspace/output/my-deck/plan.yaml'));
    vi.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();
  });

  it('notifies multiple registered plan change callbacks', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    service.onPlanChanged(cb1);
    service.onPlanChanged(cb2);

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    changeHandler(Uri.file('/mock/workspace/output/my-deck/plan.yaml'));
    vi.advanceTimersByTime(300);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('clears plan change timer and callbacks on dispose', () => {
    const callback = vi.fn();
    service.onPlanChanged(callback);

    const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
    changeHandler(Uri.file('/mock/workspace/output/my-deck/plan.yaml'));

    // Dispose before timer fires
    service.dispose();

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });
});
