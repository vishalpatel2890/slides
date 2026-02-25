/**
 * Tests for ConfigurationService.
 *
 * Story Reference: vscode-config-1 AC-1, AC-2, AC-3, AC-5, AC-6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigurationService } from '../../src/extension/ConfigurationService';
import type { ExtensionContext, OutputChannel, WorkspaceConfiguration } from 'vscode';

// Mock VS Code workspace API
const mockWorkspaceConfig = {
  get: vi.fn(),
};

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => mockWorkspaceConfig),
  },
}));

// Helper functions to create mocks
function createMockExtensionContext(): ExtensionContext {
  const workspaceState = new Map<string, unknown>();
  return {
    workspaceState: {
      get: vi.fn((key: string) => workspaceState.get(key)),
      update: vi.fn((key: string, value: unknown) => {
        workspaceState.set(key, value);
        return Promise.resolve();
      }),
    },
  } as unknown as ExtensionContext;
}

function createMockOutputChannel(): OutputChannel {
  return {
    appendLine: vi.fn(),
  } as unknown as OutputChannel;
}

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let mockContext: ExtensionContext;
  let mockOutputChannel: OutputChannel;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockWorkspaceConfig.get.mockReset();

    // Create fresh instances
    mockContext = createMockExtensionContext();
    mockOutputChannel = createMockOutputChannel();
    service = new ConfigurationService(mockContext, mockOutputChannel);
  });

  describe('readSettings', () => {
    it('should read default settings when no user configuration exists (AC-2, AC-3)', () => {
      // Mock config.get to return defaults (second parameter)
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => defaultValue);

      const config = service.readSettings();

      expect(config.claudeCode.launchMode).toBe('extension');
      expect(config.claudeCode.position).toBe('editor-tab');
      expect(config.ui.sidebarWidthPercent).toBe(40);
      expect(config.ui.rememberManualAdjustments).toBe(true);
    });

    it('should read user-configured values (AC-5)', () => {
      // Mock config.get to return custom values
      mockWorkspaceConfig.get.mockImplementation((key: string) => {
        const values: Record<string, unknown> = {
          'claudeCode.launchMode': 'terminal',
          'claudeCode.position': 'sidebar',
          'ui.sidebarWidthPercent': 50,
          'ui.rememberManualAdjustments': false,
        };
        return values[key];
      });

      const config = service.readSettings();

      expect(config.claudeCode.launchMode).toBe('terminal');
      expect(config.claudeCode.position).toBe('sidebar');
      expect(config.ui.sidebarWidthPercent).toBe(50);
      expect(config.ui.rememberManualAdjustments).toBe(false);
    });

    it('should clamp sidebar width to minimum 15% (AC-5)', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'ui.sidebarWidthPercent') return 10; // Below minimum
        return defaultValue;
      });

      const config = service.readSettings();

      expect(config.ui.sidebarWidthPercent).toBe(15); // Clamped to minimum
    });

    it('should clamp sidebar width to maximum 60% (AC-5)', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'ui.sidebarWidthPercent') return 100; // Above maximum
        return defaultValue;
      });

      const config = service.readSettings();

      expect(config.ui.sidebarWidthPercent).toBe(60); // Clamped to maximum
    });

    it('should log warning when clamping sidebar width', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'ui.sidebarWidthPercent') return 5; // Below minimum
        return defaultValue;
      });

      service.readSettings();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Sidebar width 5% outside valid range, clamped to 15%')
      );
    });

    it('should return hardcoded defaults on error', () => {
      // Simulate error in getConfiguration
      mockWorkspaceConfig.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      const config = service.readSettings();

      // Should fall back to defaults
      expect(config.claudeCode.launchMode).toBe('extension');
      expect(config.claudeCode.position).toBe('editor-tab');
      expect(config.ui.sidebarWidthPercent).toBe(40);
      expect(config.ui.rememberManualAdjustments).toBe(true);

      // Should log error
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Error reading settings')
      );
    });

    it('should log loaded settings', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => defaultValue);

      service.readSettings();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Settings loaded: launchMode=extension, position=editor-tab')
      );
    });
  });

  describe('loadManualAdjustments', () => {
    it('should return undefined when no manual adjustment exists', () => {
      const result = service.loadManualAdjustments();
      expect(result).toBeUndefined();
    });

    it('should return saved manual width from workspace state', async () => {
      // Save a manual adjustment first
      await service.saveManualAdjustments(55);

      // Load it back
      const result = service.loadManualAdjustments();

      expect(result).toBe(55);
    });

    it('should log loaded manual width', async () => {
      await service.saveManualAdjustments(45);

      vi.clearAllMocks(); // Clear previous logs
      service.loadManualAdjustments();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Loaded manual width adjustment: 45%')
      );
    });

    it('should handle errors gracefully', () => {
      // Mock workspace state to throw error
      vi.spyOn(mockContext.workspaceState, 'get').mockImplementation(() => {
        throw new Error('State error');
      });

      const result = service.loadManualAdjustments();

      expect(result).toBeUndefined();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Error loading manual adjustments')
      );
    });
  });

  describe('saveManualAdjustments', () => {
    it('should save manual width to workspace state', async () => {
      await service.saveManualAdjustments(50);

      expect(mockContext.workspaceState.update).toHaveBeenCalledWith(
        'slideBuilder.manualWidth',
        50
      );
    });

    it('should clamp width to minimum before saving', async () => {
      await service.saveManualAdjustments(10); // Below minimum

      expect(mockContext.workspaceState.update).toHaveBeenCalledWith(
        'slideBuilder.manualWidth',
        15 // Clamped
      );
    });

    it('should clamp width to maximum before saving', async () => {
      await service.saveManualAdjustments(80); // Above maximum

      expect(mockContext.workspaceState.update).toHaveBeenCalledWith(
        'slideBuilder.manualWidth',
        60 // Clamped
      );
    });

    it('should log saved manual width', async () => {
      await service.saveManualAdjustments(45);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Saved manual width adjustment: 45%')
      );
    });

    it('should handle save errors gracefully', async () => {
      // Mock workspace state update to throw error
      vi.spyOn(mockContext.workspaceState, 'update').mockRejectedValue(new Error('Update error'));

      await service.saveManualAdjustments(50);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Config] Error saving manual adjustments')
      );
    });
  });

  describe('integration scenarios', () => {
    it('should prioritize manual adjustment over configured default (AC-5)', async () => {
      // Configure default to 40%
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'ui.sidebarWidthPercent') return 40;
        return defaultValue;
      });

      // User manually adjusts to 55%
      await service.saveManualAdjustments(55);

      // Load manual adjustment
      const manualWidth = service.loadManualAdjustments();

      expect(manualWidth).toBe(55); // Manual takes priority over 40% default
    });

    it('should handle all enum values correctly', () => {
      // Test all valid combinations
      const testCases = [
        { launchMode: 'extension' as const, position: 'editor-tab' as const },
        { launchMode: 'extension' as const, position: 'sidebar' as const },
        { launchMode: 'extension' as const, position: 'panel' as const },
        { launchMode: 'terminal' as const, position: 'editor-tab' as const },
      ];

      testCases.forEach(({ launchMode, position }) => {
        mockWorkspaceConfig.get.mockImplementation((key: string) => {
          if (key === 'claudeCode.launchMode') return launchMode;
          if (key === 'claudeCode.position') return position;
          return undefined;
        });

        const config = service.readSettings();

        expect(config.claudeCode.launchMode).toBe(launchMode);
        expect(config.claudeCode.position).toBe(position);
      });
    });
  });
});
