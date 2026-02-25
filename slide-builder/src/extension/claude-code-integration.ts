import * as vscode from 'vscode';

/**
 * Known Claude Code sidebar commands to try.
 * Priority: new-session commands first, then open/focus fallbacks.
 *
 * Story Reference: vscode-config-2 AC-10 - Sidebar position
 */
const CLAUDE_SIDEBAR_COMMANDS = [
  // Primary: opens new session in sidebar
  'claudeVSCodeSidebar.open',
  // Fallbacks
  'claude-vscode.newConversation',
  'claude-vscode.sidebar.open',
  'claudeVSCodeSidebar.focus',
];

/**
 * Commands for opening Claude Code in the editor area (as a tab).
 * Priority: new-session commands first, then open/focus fallbacks.
 *
 * Story Reference: vscode-config-2 AC-9 - Editor tab position
 */
const CLAUDE_EDITOR_TAB_COMMANDS = [
  // Primary: opens new session in editor tab
  'claude-vscode.editor.open',
  // Fallbacks
  'claude-vscode.newConversation',
  'claude-vscode.window.open',
];

/**
 * Commands for opening Claude Code in the panel (bottom area).
 * Priority: new-session commands first, then open/focus fallbacks.
 *
 * Story Reference: vscode-config-2 AC-11 - Panel position
 */
const CLAUDE_PANEL_COMMANDS = [
  // Primary: opens new session in editor tab (panel not natively supported)
  'claude-vscode.editor.open',
  // Fallbacks
  'claude-vscode.newConversation',
  'claudeVSCodeSidebar.open',
];

/**
 * Options for configuring Claude Code launch behavior.
 * Story Reference: vscode-config-2 AC-7 through AC-14
 * Story Reference: ae-1-2 AC-16 - newSession option (backward compatible)
 */
export interface SendToClaudeCodeOptions {
  launchMode?: 'extension' | 'terminal';
  position?: 'editor-tab' | 'sidebar' | 'panel';
  newSession?: boolean;
}

/**
 * Sends a command/prompt to Claude Code via the VS Code sidebar or integrated terminal.
 *
 * Strategy:
 * 1. Copy command to clipboard
 * 2. If launchMode = 'terminal': Launch Claude CLI in integrated terminal
 * 3. If launchMode = 'extension': Open Claude Code extension in specified position
 * 4. User pastes command manually (auto-paste attempted but often fails in webviews)
 *
 * Story Reference: vscode-config-2
 *
 * @param command - The slash command to send (e.g., /sb-create:plan-deck)
 * @param outputChannel - Output channel for logging
 * @param workspaceUri - Optional workspace URI (used for terminal cwd)
 * @param options - Optional launch mode and position configuration
 */
export async function sendToClaudeCode(
  command: string,
  outputChannel: vscode.OutputChannel,
  workspaceUri?: vscode.Uri,
  options?: SendToClaudeCodeOptions
): Promise<void> {
  // Diagnostic logging
  outputChannel.appendLine(`[ClaudeCode] sendToClaudeCode called with:`);
  outputChannel.appendLine(`  - command: ${command}`);
  outputChannel.appendLine(`  - launchMode: ${options?.launchMode || 'undefined (will use default)'}`);
  outputChannel.appendLine(`  - position: ${options?.position || 'undefined (will use default)'}`);
  outputChannel.appendLine(`  - newSession: ${options?.newSession || false}`);
  outputChannel.appendLine(`  - workspaceUri: ${workspaceUri?.fsPath || 'undefined'}`);

  // Always copy to clipboard first
  await vscode.env.clipboard.writeText(command);
  outputChannel.appendLine(`[ClaudeCode] Copied command to clipboard: ${command}`);

  // Story Reference: vscode-config-2 AC-7 - Terminal launch mode
  if (options?.launchMode === 'terminal') {
    try {
      const terminal = vscode.window.createTerminal({
        name: 'Claude Code',
        cwd: workspaceUri?.fsPath
      });
      terminal.show();
      terminal.sendText('claude');
      await new Promise(resolve => setTimeout(resolve, 100));
      terminal.sendText(command);
      outputChannel.appendLine(`[ClaudeCode] Sent command to terminal: ${command}`);
      vscode.window.showInformationMessage('Claude Code launched in terminal with command.');
      return; // Skip extension launch logic
    } catch (error) {
      outputChannel.appendLine(`[ClaudeCode] Terminal launch failed: ${error}`);
      vscode.window.showErrorMessage('Failed to launch Claude Code in terminal. Falling back to extension mode.');
      // Continue to extension mode as fallback
    }
  }

  // Get available commands
  const allCommands = await vscode.commands.getCommands(true);
  const claudeCommands = allCommands.filter((cmd) =>
    cmd.toLowerCase().includes('claude')
  );

  if (claudeCommands.length > 0) {
    outputChannel.appendLine(`[ClaudeCode] Available Claude commands: ${claudeCommands.join(', ')}`);
  } else {
    outputChannel.appendLine('[ClaudeCode] No Claude extension commands found');
  }

  // Story Reference: ae-1-2 AC-13, AC-16 - New session command priority
  // When newSession is true, trigger a new conversation first, then fall through
  // to the normal position-based open/focus logic to ensure the UI actually opens.
  if (options?.newSession) {
    outputChannel.appendLine('[ClaudeCode] newSession requested - creating new conversation first');
    if (allCommands.includes('claude-vscode.newConversation')) {
      try {
        await vscode.commands.executeCommand('claude-vscode.newConversation');
        outputChannel.appendLine('[ClaudeCode] New conversation created via claude-vscode.newConversation');
      } catch (error) {
        outputChannel.appendLine(`[ClaudeCode] newConversation failed: ${error}`);
      }
    } else {
      outputChannel.appendLine('[ClaudeCode] claude-vscode.newConversation not available');
    }
    // Fall through to position-based open/focus below
  }

  // Story Reference: vscode-config-2 AC-9, AC-10, AC-11 - Position-specific command selection
  // Determine which command list to use based on position
  const position = options?.position || 'sidebar';
  let commandsToTry: string[];

  switch (position) {
    case 'editor-tab':
      commandsToTry = CLAUDE_EDITOR_TAB_COMMANDS;
      outputChannel.appendLine('[ClaudeCode] Using editor-tab position');
      // Try to close panel first to ensure Claude Code opens in editor area
      try {
        await vscode.commands.executeCommand('workbench.action.closePanel');
      } catch {
        // Ignore errors if panel is already closed
      }
      break;
    case 'panel':
      commandsToTry = CLAUDE_PANEL_COMMANDS;
      outputChannel.appendLine('[ClaudeCode] Using panel position');
      break;
    case 'sidebar':
    default:
      commandsToTry = CLAUDE_SIDEBAR_COMMANDS;
      outputChannel.appendLine('[ClaudeCode] Using sidebar position');
      break;
  }

  // Try to open Claude Code in specified position
  let sidebarOpened = false;
  for (const cmd of commandsToTry) {
    if (allCommands.includes(cmd)) {
      try {
        // Try passing the command as a parameter (some commands support this)
        await vscode.commands.executeCommand(cmd);
        outputChannel.appendLine(`[ClaudeCode] Opened Claude Code in ${position} via: ${cmd}`);
        sidebarOpened = true;

        // Small delay for Claude Code to open
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Try to explicitly focus Claude Code (brings it to front)
        try {
          if (allCommands.includes('claudeVSCodeSidebar.focus')) {
            await vscode.commands.executeCommand('claudeVSCodeSidebar.focus');
            outputChannel.appendLine('[ClaudeCode] Focused via claudeVSCodeSidebar.focus');
          } else if (allCommands.includes('claude-vscode.focus')) {
            await vscode.commands.executeCommand('claude-vscode.focus');
            outputChannel.appendLine('[ClaudeCode] Focused via claude-vscode.focus');
          }
        } catch (focusError) {
          outputChannel.appendLine(`[ClaudeCode] Focus command failed: ${focusError}`);
        }

        // Try to paste using keyboard shortcut simulation
        try {
          await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
          outputChannel.appendLine('[ClaudeCode] Paste action executed');
        } catch {
          // Expected - paste often doesn't work in webview inputs
          outputChannel.appendLine('[ClaudeCode] Paste action failed (expected for webview)');
        }

        // Show notification so user knows to paste if needed
        vscode.window.showInformationMessage(
          'Command copied! Paste (⌘V) into Claude Code if not auto-filled.',
          'OK'
        );
        return;
      } catch (error) {
        outputChannel.appendLine(`[ClaudeCode] Command ${cmd} failed: ${error}`);
      }
    }
  }

  // If we reach here, no command was available for the specified position
  outputChannel.appendLine(`[ClaudeCode] No Claude Code command found for ${position} - command copied to clipboard`);
  vscode.window.showWarningMessage(
    `Claude Code not found. Command copied to clipboard - install Claude Code extension or paste manually.`,
    'OK'
  );
}

