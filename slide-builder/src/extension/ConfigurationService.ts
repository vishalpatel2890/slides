import * as vscode from 'vscode';

/**
 * Configuration interface for Slide Builder extension settings.
 *
 * Story Reference: vscode-config-1 AC-1, AC-2, AC-3
 */
export interface SlideBuilderConfig {
  claudeCode: {
    launchMode: 'extension' | 'terminal';
    position: 'editor-tab' | 'sidebar' | 'panel';
  };
  ui: {
    sidebarWidthPercent: number;
    rememberManualAdjustments: boolean;
  };
}

/**
 * ConfigurationService - Manages Slide Builder extension configuration and workspace state persistence.
 *
 * Story Reference: vscode-config-1
 *
 * Responsibilities:
 * - Reading VS Code settings with fallback defaults
 * - Validating and clamping configuration values
 * - Managing workspace state for manual UI adjustments
 * - Providing type-safe configuration access
 */
export class ConfigurationService {
  private static readonly CONFIG_SECTION = 'slideBuilder';
  private static readonly SIDEBAR_WIDTH_MIN = 15;
  private static readonly SIDEBAR_WIDTH_MAX = 60;
  private static readonly WORKSPACE_STATE_KEY = 'slideBuilder.manualWidth';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly outputChannel: vscode.OutputChannel
  ) {}

  /**
   * Reads current Slide Builder settings with fallback defaults.
   * Validates and clamps values to acceptable ranges.
   *
   * Story Reference: vscode-config-1 AC-1, AC-2, AC-3
   *
   * @returns Configuration object with all settings
   */
  public readSettings(): SlideBuilderConfig {
    try {
      const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIG_SECTION);

      // Read launch mode with default fallback
      const launchMode = config.get<'extension' | 'terminal'>('claudeCode.launchMode', 'extension');

      // Read position with default fallback
      const position = config.get<'editor-tab' | 'sidebar' | 'panel'>('claudeCode.position', 'editor-tab');

      // Read sidebar width and clamp to valid range (15-60)
      const rawSidebarWidth = config.get<number>('ui.sidebarWidthPercent', 40);
      const sidebarWidthPercent = Math.max(
        ConfigurationService.SIDEBAR_WIDTH_MIN,
        Math.min(ConfigurationService.SIDEBAR_WIDTH_MAX, rawSidebarWidth)
      );

      // Log warning if clamping occurred
      if (rawSidebarWidth !== sidebarWidthPercent) {
        this.outputChannel.appendLine(
          `[Config] Sidebar width ${rawSidebarWidth}% outside valid range, clamped to ${sidebarWidthPercent}%`
        );
      }

      // Read remember adjustments boolean
      const rememberManualAdjustments = config.get<boolean>('ui.rememberManualAdjustments', true);

      const settings: SlideBuilderConfig = {
        claudeCode: {
          launchMode,
          position
        },
        ui: {
          sidebarWidthPercent,
          rememberManualAdjustments
        }
      };

      this.outputChannel.appendLine(
        `[Config] Settings loaded: launchMode=${launchMode}, position=${position}, ` +
        `sidebarWidth=${sidebarWidthPercent}%, rememberAdjustments=${rememberManualAdjustments}`
      );

      return settings;
    } catch (error) {
      this.outputChannel.appendLine(`[Config] Error reading settings: ${error}. Using defaults.`);
      // Return hardcoded defaults on error
      return {
        claudeCode: {
          launchMode: 'extension',
          position: 'editor-tab'
        },
        ui: {
          sidebarWidthPercent: 40,
          rememberManualAdjustments: true
        }
      };
    }
  }

  /**
   * Loads persisted manual adjustments from workspace state.
   *
   * Story Reference: vscode-config-1 (used in Story 1.3)
   *
   * @returns Saved width percentage or undefined if not found
   */
  public loadManualAdjustments(): number | undefined {
    try {
      const manualWidth = this.context.workspaceState.get<number>(ConfigurationService.WORKSPACE_STATE_KEY);
      if (manualWidth !== undefined) {
        this.outputChannel.appendLine(`[Config] Loaded manual width adjustment: ${manualWidth}%`);
      }
      return manualWidth;
    } catch (error) {
      this.outputChannel.appendLine(`[Config] Error loading manual adjustments: ${error}`);
      return undefined;
    }
  }

  /**
   * Saves manual sidebar width adjustment to workspace state.
   *
   * Story Reference: vscode-config-1 (used in Story 1.3)
   *
   * @param widthPercent - Width as percentage of screen (15-60)
   */
  public async saveManualAdjustments(widthPercent: number): Promise<void> {
    try {
      // Clamp to valid range before saving
      const clampedWidth = Math.max(
        ConfigurationService.SIDEBAR_WIDTH_MIN,
        Math.min(ConfigurationService.SIDEBAR_WIDTH_MAX, widthPercent)
      );

      await this.context.workspaceState.update(ConfigurationService.WORKSPACE_STATE_KEY, clampedWidth);
      this.outputChannel.appendLine(`[Config] Saved manual width adjustment: ${clampedWidth}%`);
    } catch (error) {
      this.outputChannel.appendLine(`[Config] Error saving manual adjustments: ${error}`);
    }
  }
}
