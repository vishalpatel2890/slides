/**
 * Tests for Story 1.3: plan.yaml auto-open suppression during builds.
 *
 * Tests the guard logic added to the onPlanChanged handler in extension.ts
 * that suppresses auto-open when buildProgressService.isBuilding() is true.
 *
 * AC #1: Auto-open suppressed when build is active for that deck
 * AC #2: Auto-open proceeds when no build is active
 * AC #3: Manual opens are unaffected (only onPlanChanged auto-open is guarded)
 * AC #4: Guard errors fail-open (auto-open proceeds)
 * AC #5: Suppression is logged with "extension:" prefix
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Uri } from 'vscode';

// The regex used in the guard (extracted for direct testing)
const PLAN_YAML_REGEX = /output[/\\]([^/\\]+)[/\\]plan\.yaml$/;

describe('Plan auto-open guard regex', () => {
  it('extracts deckId from output/deckId/plan.yaml path (unix)', () => {
    const match = PLAN_YAML_REGEX.exec('/workspace/output/my-deck/plan.yaml');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('my-deck');
  });

  it('extracts deckId from output\\deckId\\plan.yaml path (windows)', () => {
    const match = PLAN_YAML_REGEX.exec('C:\\workspace\\output\\my-deck\\plan.yaml');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('my-deck');
  });

  it('handles deck names with spaces and special chars', () => {
    const match = PLAN_YAML_REGEX.exec('/workspace/output/Q4 Sales Pitch/plan.yaml');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Q4 Sales Pitch');
  });

  it('does not match plan.yaml outside output/ directory', () => {
    const match = PLAN_YAML_REGEX.exec('/workspace/.slide-builder/decks/my-deck/plan.yaml');
    expect(match).toBeNull();
  });

  it('does not match non-plan files in output/', () => {
    const match = PLAN_YAML_REGEX.exec('/workspace/output/my-deck/manifest.json');
    expect(match).toBeNull();
  });

  it('does not match plan.yml (only .yaml)', () => {
    const match = PLAN_YAML_REGEX.exec('/workspace/output/my-deck/plan.yml');
    expect(match).toBeNull();
  });
});

describe('Plan auto-open guard behavior (AC #1, #2, #4, #5)', () => {
  let mockOutputChannel: { appendLine: ReturnType<typeof vi.fn> };
  let mockBuildProgressService: { isBuilding: ReturnType<typeof vi.fn> };
  let mockOpenWith: ReturnType<typeof vi.fn>;

  // Simulate the guard logic from extension.ts onPlanChanged handler
  function simulateOnPlanChanged(fsPath: string): boolean {
    const uri = Uri.file(fsPath);
    mockOutputChannel.appendLine(`extension: Plan changed — opening editor for ${uri.fsPath}`);

    // Guard logic (mirrors extension.ts implementation)
    try {
      const planMatch = PLAN_YAML_REGEX.exec(uri.fsPath);
      if (planMatch) {
        const deckId = planMatch[1];
        if (mockBuildProgressService.isBuilding(deckId)) {
          mockOutputChannel.appendLine(`extension: Suppressing plan.yaml auto-open during build for deck '${deckId}'`);
          return false; // suppressed
        }
      }
    } catch (guardError) {
      mockOutputChannel.appendLine(`extension: Plan auto-open guard error (proceeding with open): ${guardError}`);
    }

    // Auto-open would proceed
    mockOpenWith(uri);
    return true; // opened
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockOutputChannel = { appendLine: vi.fn() };
    mockBuildProgressService = { isBuilding: vi.fn().mockReturnValue(false) };
    mockOpenWith = vi.fn();
  });

  it('suppresses auto-open when build is active for the deck (AC #1)', () => {
    mockBuildProgressService.isBuilding.mockReturnValue(true);

    const opened = simulateOnPlanChanged('/workspace/output/my-deck/plan.yaml');

    expect(opened).toBe(false);
    expect(mockOpenWith).not.toHaveBeenCalled();
    expect(mockBuildProgressService.isBuilding).toHaveBeenCalledWith('my-deck');
  });

  it('proceeds with auto-open when no build is active (AC #2)', () => {
    mockBuildProgressService.isBuilding.mockReturnValue(false);

    const opened = simulateOnPlanChanged('/workspace/output/my-deck/plan.yaml');

    expect(opened).toBe(true);
    expect(mockOpenWith).toHaveBeenCalled();
    expect(mockBuildProgressService.isBuilding).toHaveBeenCalledWith('my-deck');
  });

  it('does not affect non-output plan.yaml paths (AC #3 related)', () => {
    const opened = simulateOnPlanChanged('/workspace/.slide-builder/decks/my-deck/plan.yaml');

    expect(opened).toBe(true);
    expect(mockOpenWith).toHaveBeenCalled();
    expect(mockBuildProgressService.isBuilding).not.toHaveBeenCalled();
  });

  it('fails open when guard throws an error (AC #4)', () => {
    mockBuildProgressService.isBuilding.mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    const opened = simulateOnPlanChanged('/workspace/output/my-deck/plan.yaml');

    expect(opened).toBe(true);
    expect(mockOpenWith).toHaveBeenCalled();
  });

  it('logs suppression with "extension:" prefix (AC #5)', () => {
    mockBuildProgressService.isBuilding.mockReturnValue(true);

    simulateOnPlanChanged('/workspace/output/my-deck/plan.yaml');

    const suppressionLog = mockOutputChannel.appendLine.mock.calls.find(
      (call: string[]) => call[0].includes('Suppressing')
    );
    expect(suppressionLog).toBeDefined();
    expect(suppressionLog![0]).toMatch(/^extension:/);
    expect(suppressionLog![0]).toContain('my-deck');
  });

  it('logs guard error with "extension:" prefix (AC #4)', () => {
    mockBuildProgressService.isBuilding.mockImplementation(() => {
      throw new Error('Boom');
    });

    simulateOnPlanChanged('/workspace/output/my-deck/plan.yaml');

    const errorLog = mockOutputChannel.appendLine.mock.calls.find(
      (call: string[]) => call[0].includes('guard error')
    );
    expect(errorLog).toBeDefined();
    expect(errorLog![0]).toMatch(/^extension:/);
  });

  it('checks isBuilding with correct deckId for different decks', () => {
    mockBuildProgressService.isBuilding.mockImplementation((id: string) => id === 'building-deck');

    // Non-building deck proceeds
    const opened1 = simulateOnPlanChanged('/workspace/output/idle-deck/plan.yaml');
    expect(opened1).toBe(true);

    // Building deck is suppressed
    const opened2 = simulateOnPlanChanged('/workspace/output/building-deck/plan.yaml');
    expect(opened2).toBe(false);
  });
});
