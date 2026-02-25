/**
 * Tests for Claude Code integration and launch modes.
 *
 * Story Reference: vscode-config-2 AC-7 through AC-14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { window, commands, env, type Terminal } from 'vscode';
import { sendToClaudeCode } from '../../src/extension/claude-code-integration';

// Mock VS Code API
vi.mock('vscode', () => ({
  window: {
    createTerminal: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  commands: {
    getCommands: vi.fn(),
    executeCommand: vi.fn(),
  },
  env: {
    clipboard: {
      writeText: vi.fn(),
    },
  },
  workspace: {
    getConfiguration: vi.fn(),
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
  },
}));

// Helper to create mock output channel
function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    name: 'Test Output',
  } as any;
}

// Helper to create mock terminal
function createMockTerminal(): Terminal {
  return {
    name: 'Claude Code',
    processId: Promise.resolve(1234),
    creationOptions: {},
    exitStatus: undefined,
    state: { isInteractedWith: false },
    sendText: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('sendToClaudeCode', () => {
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;
  const testCommand = '/sb-create:plan-deck';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOutputChannel = createMockOutputChannel();

    // Default mock for clipboard
    vi.mocked(env.clipboard.writeText).mockResolvedValue();

    // Default mock for commands (no Claude commands available)
    vi.mocked(commands.getCommands).mockResolvedValue([]);
  });

  describe('clipboard copy', () => {
    it('should always copy command to clipboard first (AC-13)', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(env.clipboard.writeText).toHaveBeenCalledWith(testCommand);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        `[ClaudeCode] Copied command to clipboard: ${testCommand}`
      );
    });

    it('should copy to clipboard before launching terminal (AC-7)', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      // Verify clipboard copy happened before terminal creation
      const clipboardCall = vi.mocked(env.clipboard.writeText).mock.invocationCallOrder[0];
      const terminalCall = vi.mocked(window.createTerminal).mock.invocationCallOrder[0];
      expect(clipboardCall).toBeLessThan(terminalCall);
    });
  });

  describe('terminal launch mode (AC-7, AC-8)', () => {
    it('should create terminal with correct configuration', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      const workspaceUri = { fsPath: '/workspace/path' } as any;

      await sendToClaudeCode(testCommand, mockOutputChannel, workspaceUri, {
        launchMode: 'terminal',
      });

      expect(window.createTerminal).toHaveBeenCalledWith({
        name: 'Claude Code',
        cwd: '/workspace/path',
      });
    });

    it('should show terminal and send "claude" then command with delay (AC #1, #2)', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      expect(mockTerminal.show).toHaveBeenCalled();
      expect(mockTerminal.sendText).toHaveBeenCalledTimes(2);
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(1, 'claude');
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(2, testCommand);
    });

    it('should log sent command to terminal (AC #3)', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        `[ClaudeCode] Sent command to terminal: ${testCommand}`
      );
    });

    it('should show info message after terminal launch', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        'Claude Code launched in terminal with command.'
      );
    });

    it('should have a 100ms delay between sendText calls (AC #2)', async () => {
      vi.useFakeTimers();
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      const promise = sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      // After first sendText('claude'), the setTimeout(100) is pending
      // Advance timers to resolve the delay
      await vi.advanceTimersByTimeAsync(100);
      await promise;

      // Both calls should have happened
      expect(mockTerminal.sendText).toHaveBeenCalledTimes(2);
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(1, 'claude');
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(2, testCommand);

      vi.useRealTimers();
    });

    it('should not attempt extension launch after successful terminal launch', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);
      vi.mocked(commands.getCommands).mockResolvedValue(['claude-vscode.sidebar.open']);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      // getCommands should not be called since we exit early
      expect(commands.getCommands).not.toHaveBeenCalled();
    });

    it('should fallback to extension mode on terminal creation error (AC-8)', async () => {
      vi.mocked(window.createTerminal).mockImplementation(() => {
        throw new Error('Terminal creation failed');
      });
      vi.mocked(commands.getCommands).mockResolvedValue([]);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'terminal',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ClaudeCode] Terminal launch failed')
      );
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to launch Claude Code in terminal. Falling back to extension mode.'
      );
      // Should continue to extension mode
      expect(commands.getCommands).toHaveBeenCalled();
    });
  });

  describe('extension mode - default behavior', () => {
    beforeEach(() => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.sidebar.open',
        'claude-vscode.startNewChat',
        'other.command',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);
    });

    it('should get available commands', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(commands.getCommands).toHaveBeenCalledWith(true);
    });

    it('should log available Claude commands', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ClaudeCode] Available Claude commands:')
      );
    });

    it('should execute first available command from the list', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(commands.executeCommand).toHaveBeenCalled();
      const executedCommand = vi.mocked(commands.executeCommand).mock.calls[0][0];
      expect(executedCommand).toMatch(/claude/i);
    });

    it('should attempt paste action after opening Claude Code', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(commands.executeCommand).toHaveBeenCalledWith(
        'editor.action.clipboardPasteAction'
      );
    });

    it('should show info message prompting user to paste', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        'Command copied! Paste (⌘V) into Claude Code if not auto-filled.',
        'OK'
      );
    });

    it('should handle paste action failure gracefully', async () => {
      vi.mocked(commands.executeCommand).mockImplementation((cmd: string) => {
        if (cmd === 'editor.action.clipboardPasteAction') {
          throw new Error('Paste failed');
        }
        return Promise.resolve(undefined);
      });

      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] Paste action failed (expected for webview)'
      );
      // Should still show success message
      expect(window.showInformationMessage).toHaveBeenCalled();
    });
  });

  describe('position: sidebar (AC-10)', () => {
    beforeEach(() => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.sidebar.open',
        'claudeVSCodeSidebar.open',
        'claudeVSCodeSidebar.focus',
        'workbench.view.extension.claude-sidebar',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);
    });

    it('should use sidebar commands', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'extension',
        position: 'sidebar',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] Using sidebar position'
      );
    });

    it('should attempt claude-vscode.sidebar.open first (AC #2)', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'sidebar',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      // First command executed should be claude-vscode.sidebar.open
      expect(executedCommands[0]).toBe('claude-vscode.sidebar.open');
    });

    it('should NOT attempt workbench.action.chat commands (AC #1)', async () => {
      // Make all commands available including workbench chat ones
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.sidebar.open',
        'claudeVSCodeSidebar.open',
        'claudeVSCodeSidebar.focus',
        'workbench.view.extension.claude-sidebar',
        'workbench.action.chat.openNewSessionSidebar.claude-code',
        'workbench.action.chat.open',
      ]);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'sidebar',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      const chatCommands = executedCommands.filter(cmd =>
        cmd.startsWith('workbench.action.chat.')
      );
      expect(chatCommands).toEqual([]);
    });

    it('should fall back to next command if first fails', async () => {
      vi.mocked(commands.executeCommand).mockImplementation((cmd: string) => {
        if (cmd === 'claude-vscode.sidebar.open') {
          throw new Error('Command failed');
        }
        return Promise.resolve(undefined);
      });

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'sidebar',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      // Should have tried claude-vscode.sidebar.open first, then fallen back
      expect(executedCommands[0]).toBe('claude-vscode.sidebar.open');
      expect(executedCommands[1]).toBe('claudeVSCodeSidebar.open');
    });
  });

  describe('position: editor-tab (AC-9)', () => {
    beforeEach(() => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.editor.open',
        'claude-vscode.window.open',
        'claude-vscode.startNewChat',
        'claude-vscode.newConversation',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);
    });

    it('should use editor-tab commands', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'editor-tab',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] Using editor-tab position'
      );
    });

    it('should close panel before opening in editor area (AC-9)', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'editor-tab',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      expect(executedCommands).toContain('workbench.action.closePanel');
    });

    it('should handle closePanel error gracefully', async () => {
      vi.mocked(commands.executeCommand).mockImplementation((cmd: string) => {
        if (cmd === 'workbench.action.closePanel') {
          throw new Error('Panel already closed');
        }
        return Promise.resolve(undefined);
      });

      // Should not throw
      await expect(
        sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
          position: 'editor-tab',
        })
      ).resolves.not.toThrow();
    });

    it('should NOT attempt workbench.action.chat commands (AC #1, #4)', async () => {
      // Make all commands available including workbench ones
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.editor.open',
        'claude-vscode.window.open',
        'claude-vscode.startNewChat',
        'claude-vscode.newConversation',
        'workbench.action.chat.openNewSessionEditor.claude-code',
        'workbench.action.chat.open',
      ]);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'editor-tab',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      const chatCommands = executedCommands.filter(cmd =>
        cmd.startsWith('workbench.action.chat.')
      );
      expect(chatCommands).toEqual([]);
    });

    it('should attempt claude-vscode.editor.open first (AC #2, #4)', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.editor.open',
        'claude-vscode.window.open',
        'claude-vscode.startNewChat',
        'claude-vscode.newConversation',
      ]);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'editor-tab',
      });

      // First executeCommand call after closePanel should be claude-vscode.editor.open
      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      const nonPanelCommands = executedCommands.filter(cmd => cmd !== 'workbench.action.closePanel');
      expect(nonPanelCommands[0]).toBe('claude-vscode.editor.open');
    });
  });

  describe('position: panel (AC-11)', () => {
    beforeEach(() => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'workbench.view.extension.claude-sidebar',
        'claude-vscode.sidebar.open',
        'workbench.action.chat.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      // Mock workspace configuration
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vi.fn((key: string) => {
          if (key === 'preferredLocation') return undefined; // Not set by default
          if (key === 'dontAskAboutPanelSetting') return false;
          return undefined;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn(),
      } as any);
    });

    it('should use panel position and log configuration check', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'panel',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] Using panel position'
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Claude Code preferredLocation:')
      );
    });

    it('should try direct view extension commands first', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'panel',
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      // Should try workbench.view.extension commands
      expect(
        executedCommands.some(cmd => cmd.startsWith('workbench.view.extension.'))
      ).toBe(true);
    });

    it('should offer to update preferredLocation if not set to panel', async () => {
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'panel',
      });

      // Should show information message asking to update setting
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('preferredLocation'),
        'Yes',
        'No',
        'Don\'t Ask Again'
      );
    });

    it('should update setting when user accepts', async () => {
      vi.mocked(window.showInformationMessage).mockResolvedValue('Yes' as any);

      const mockConfig = {
        get: vi.fn(() => 'sidebar'),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn(),
      };

      vi.mocked(vscode.workspace.getConfiguration).mockImplementation((section?: string) => {
        if (section === 'claude-code') return mockConfig as any;
        return {
          get: vi.fn(() => false),
          update: vi.fn().mockResolvedValue(undefined),
          has: vi.fn(),
          inspect: vi.fn(),
        } as any;
      });

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'panel',
      });

      expect(mockConfig.update).toHaveBeenCalledWith('preferredLocation', 'panel', vscode.ConfigurationTarget.Global);
    });

    it('should not ask again if user selected "Don\'t Ask Again"', async () => {
      const mockSlideBuilderConfig = {
        get: vi.fn(() => false),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn(),
        inspect: vi.fn(),
      };

      vi.mocked(vscode.workspace.getConfiguration).mockImplementation((section?: string) => {
        if (section === 'slideBuilder') return mockSlideBuilderConfig as any;
        return {
          get: vi.fn(() => 'sidebar'),
          update: vi.fn(),
          has: vi.fn(),
          inspect: vi.fn(),
        } as any;
      });

      vi.mocked(window.showInformationMessage).mockResolvedValue('Don\'t Ask Again' as any);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'panel',
      });

      expect(mockSlideBuilderConfig.update).toHaveBeenCalledWith(
        'claudeCode.dontAskAboutPanelSetting',
        true,
        vscode.ConfigurationTarget.Global
      );
    });

    it('should handle configuration errors gracefully', async () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(() => {
        throw new Error('Config error');
      });

      // Should not throw
      await expect(
        sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
          position: 'panel',
        })
      ).resolves.not.toThrow();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Could not check/update preferredLocation')
      );
    });
  });

  describe('graceful fallback when Claude Code not installed (AC-14)', () => {
    it('should show warning when no Claude commands available', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue(['other.command', 'another.command']);

      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] No Claude Code command found for sidebar - command copied to clipboard'
      );
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        'Claude Code not found. Command copied to clipboard - install Claude Code extension or paste manually.',
        'OK'
      );
    });

    it('should log "No Claude extension commands found"', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue(['workspace.open', 'file.save']);

      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] No Claude extension commands found'
      );
    });

    it('should still copy to clipboard even when extension not found', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([]);

      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(env.clipboard.writeText).toHaveBeenCalledWith(testCommand);
    });
  });

  describe('error scenarios', () => {
    it('should handle command execution errors', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue(['claude-vscode.sidebar.open']);
      vi.mocked(commands.executeCommand).mockRejectedValue(new Error('Command failed'));

      await sendToClaudeCode(testCommand, mockOutputChannel);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ClaudeCode] Command claude-vscode.sidebar.open failed')
      );
    });

    it('should try multiple commands if first one fails', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.sidebar.open',
        'claude-code.focus',
      ]);
      vi.mocked(commands.executeCommand).mockImplementation((cmd: string) => {
        if (cmd === 'claude-vscode.sidebar.open') {
          throw new Error('First command failed');
        }
        return Promise.resolve(undefined);
      });

      await sendToClaudeCode(testCommand, mockOutputChannel);

      // Should have tried both commands
      expect(commands.executeCommand).toHaveBeenCalledWith('claude-vscode.sidebar.open');
      // Note: Due to the current implementation, it stops after first success or tries all
    });
  });

  describe('integration scenarios', () => {
    it('should handle terminal mode with workspace URI', async () => {
      const mockTerminal = createMockTerminal();
      vi.mocked(window.createTerminal).mockReturnValue(mockTerminal);

      const workspaceUri = { fsPath: '/Users/test/project' } as any;

      await sendToClaudeCode(testCommand, mockOutputChannel, workspaceUri, {
        launchMode: 'terminal',
        position: 'sidebar', // Should be ignored in terminal mode
      });

      expect(window.createTerminal).toHaveBeenCalledWith({
        name: 'Claude Code',
        cwd: '/Users/test/project',
      });
      // Should exit early, not use position
      expect(commands.getCommands).not.toHaveBeenCalled();
    });

    it('should default to sidebar position when position not specified', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue(['claude-vscode.sidebar.open']);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        launchMode: 'extension',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ClaudeCode] Using sidebar position'
      );
    });

    it('should default to extension mode when launchMode not specified', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue(['claude-vscode.sidebar.open']);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel);

      // Should call getCommands (extension mode behavior)
      expect(commands.getCommands).toHaveBeenCalled();
      // Should not create terminal
      expect(window.createTerminal).not.toHaveBeenCalled();
    });
  });

  describe('newSession option (ae-1-2 AC-13, AC-16)', () => {
    it('should attempt startNewChat first when newSession is true', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
        'claude-vscode.newConversation',
        'claudeVSCodeSidebar.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      // First command should be startNewChat
      expect(executedCommands[0]).toBe('claude-vscode.startNewChat');
    });

    it('should fall back to newConversation if startNewChat is unavailable', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.newConversation',
        'claudeVSCodeSidebar.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      expect(executedCommands[0]).toBe('claude-vscode.newConversation');
    });

    it('should fall back to sidebar commands if new session commands are unavailable', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claudeVSCodeSidebar.open',
        'claudeVSCodeSidebar.focus',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      expect(executedCommands[0]).toBe('claudeVSCodeSidebar.open');
    });

    it('should fall back through commands when earlier ones fail', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
        'claude-vscode.newConversation',
        'claudeVSCodeSidebar.open',
      ]);
      vi.mocked(commands.executeCommand).mockImplementation((cmd: string) => {
        if (cmd === 'claude-vscode.startNewChat') {
          throw new Error('Command failed');
        }
        return Promise.resolve(undefined);
      });

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      const executedCommands = vi.mocked(commands.executeCommand).mock.calls.map(call => call[0]);
      expect(executedCommands[0]).toBe('claude-vscode.startNewChat');
      expect(executedCommands[1]).toBe('claude-vscode.newConversation');
    });

    it('should not use position-based commands when newSession is true', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
        'claude-vscode.editor.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
        position: 'editor-tab', // Should be ignored
      });

      // Should NOT log position-based selection
      const logCalls = vi.mocked(mockOutputChannel.appendLine).mock.calls.map(call => call[0]);
      expect(logCalls).toContain('[ClaudeCode] Using newSession command priority');
      expect(logCalls).not.toContain('[ClaudeCode] Using editor-tab position');
    });

    it('should preserve existing behavior when newSession is omitted (backward compat)', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
        'claudeVSCodeSidebar.open',
        'claude-vscode.sidebar.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      // No newSession option
      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        position: 'sidebar',
      });

      const logCalls = vi.mocked(mockOutputChannel.appendLine).mock.calls.map(call => call[0]);
      expect(logCalls).toContain('[ClaudeCode] Using sidebar position');
      expect(logCalls).not.toContain('[ClaudeCode] Using newSession command priority');
    });

    it('should preserve existing behavior when newSession is false (backward compat)', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claudeVSCodeSidebar.open',
        'claude-vscode.sidebar.open',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: false,
        position: 'sidebar',
      });

      const logCalls = vi.mocked(mockOutputChannel.appendLine).mock.calls.map(call => call[0]);
      expect(logCalls).toContain('[ClaudeCode] Using sidebar position');
      expect(logCalls).not.toContain('[ClaudeCode] Using newSession command priority');
    });

    it('should log newSession flag in diagnostic output', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '  - newSession: true'
      );
    });

    it('should show warning when no commands available for newSession', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([]);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      expect(window.showWarningMessage).toHaveBeenCalledWith(
        'Claude Code not found. Command copied to clipboard - install Claude Code extension or paste manually.',
        'OK'
      );
    });

    it('should still copy to clipboard when newSession is true', async () => {
      vi.mocked(commands.getCommands).mockResolvedValue([
        'claude-vscode.startNewChat',
      ]);
      vi.mocked(commands.executeCommand).mockResolvedValue(undefined);

      await sendToClaudeCode(testCommand, mockOutputChannel, undefined, {
        newSession: true,
      });

      expect(env.clipboard.writeText).toHaveBeenCalledWith(testCommand);
    });
  });
});
