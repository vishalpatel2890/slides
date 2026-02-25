import { vi } from 'vitest';

// Mock OutputChannel
const createMockOutputChannel = () => ({
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Mock Channel',
});

// Mock Disposable
const createMockDisposable = () => ({
  dispose: vi.fn(),
});

// Mock Terminal
const createMockTerminal = () => ({
  show: vi.fn(),
  hide: vi.fn(),
  sendText: vi.fn(),
  dispose: vi.fn(),
  name: 'Mock Terminal',
});

// Mock FileSystemWatcher
const createMockFileSystemWatcher = () => ({
  onDidCreate: vi.fn().mockImplementation(() => createMockDisposable()),
  onDidChange: vi.fn().mockImplementation(() => createMockDisposable()),
  onDidDelete: vi.fn().mockImplementation(() => createMockDisposable()),
  dispose: vi.fn(),
});

// Mock WebviewPanel for SlideViewerPanel tests (cv-2-1)
const createMockWebviewPanel = () => {
  let messageHandler: ((msg: any) => void) | null = null;
  let disposeHandler: (() => void) | null = null;
  const panel = {
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn().mockImplementation((handler: any) => {
        messageHandler = handler;
        return createMockDisposable();
      }),
      postMessage: vi.fn().mockResolvedValue(true),
      asWebviewUri: vi.fn().mockImplementation((uri: any) => ({
        ...uri,
        toString: () => `https://webview-uri${uri.fsPath || uri.toString()}`,
      })),
      cspSource: 'https://webview-csp-source',
      options: {},
    },
    reveal: vi.fn(),
    dispose: vi.fn().mockImplementation(() => {
      disposeHandler?.();
    }),
    onDidDispose: vi.fn().mockImplementation((handler: any) => {
      disposeHandler = handler;
      return createMockDisposable();
    }),
    visible: true,
    viewType: 'slideBuilder.slideViewer',
    title: '',
    _simulateMessage: (msg: any) => messageHandler?.(msg),
    _simulateDispose: () => disposeHandler?.(),
  };
  return panel;
};

// VS Code mock implementation
export const window = {
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showTextDocument: vi.fn().mockResolvedValue(undefined),
  createOutputChannel: vi.fn().mockImplementation(() => createMockOutputChannel()),
  createTerminal: vi.fn().mockImplementation(() => createMockTerminal()),
  registerCustomEditorProvider: vi.fn().mockImplementation(() => createMockDisposable()),
  registerWebviewViewProvider: vi.fn().mockImplementation(() => createMockDisposable()),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  createWebviewPanel: vi.fn().mockImplementation(() => createMockWebviewPanel()),
  terminals: [] as ReturnType<typeof createMockTerminal>[],
  tabGroups: {
    all: [] as Array<{ tabs: Array<{ input: unknown }> }>,
    close: vi.fn().mockResolvedValue(undefined),
  },
};

export const env = {
  openExternal: vi.fn().mockResolvedValue(true),
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
};

export const commands = {
  getCommands: vi.fn().mockResolvedValue([]),
  executeCommand: vi.fn().mockResolvedValue(undefined),
  registerCommand: vi.fn().mockImplementation(() => createMockDisposable()),
};

export const workspace = {
  openTextDocument: vi.fn().mockResolvedValue({}),
  fs: {
    stat: vi.fn().mockResolvedValue({ type: 2 }), // FileType.Directory = 2
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readDirectory: vi.fn().mockResolvedValue([]),
    rename: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    copy: vi.fn().mockResolvedValue(undefined),
  },
  getWorkspaceFolder: vi.fn().mockReturnValue({
    uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
    name: 'mock-workspace',
    index: 0,
  }),
  onDidChangeTextDocument: vi.fn().mockImplementation(() => createMockDisposable()),
  createFileSystemWatcher: vi.fn().mockImplementation(() => createMockFileSystemWatcher()),
  workspaceFolders: [],
  applyEdit: vi.fn().mockResolvedValue(true),
};

// Mock Range class
export class Range {
  constructor(
    public readonly start: { line: number; character: number },
    public readonly end: { line: number; character: number }
  ) {}
}

// Mock Position class
export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number
  ) {}
}

// Mock WorkspaceEdit class
export class WorkspaceEdit {
  private edits: Array<{
    uri: unknown;
    range: Range;
    newText: string;
  }> = [];

  replace(uri: unknown, range: Range, newText: string): void {
    this.edits.push({ uri, range, newText });
  }

  get size(): number {
    return this.edits.length;
  }

  entries(): Array<[unknown, Array<{ range: Range; newText: string }>]> {
    const grouped = new Map<unknown, Array<{ range: Range; newText: string }>>();
    for (const edit of this.edits) {
      const existing = grouped.get(edit.uri) || [];
      existing.push({ range: edit.range, newText: edit.newText });
      grouped.set(edit.uri, existing);
    }
    return Array.from(grouped.entries());
  }
}

export const Uri = {
  joinPath: vi.fn((base: { fsPath?: string }, ...parts: string[]) => ({
    fsPath: `${base.fsPath || base}/${parts.join('/')}`,
    toString: () => `${base.fsPath || base}/${parts.join('/')}`,
    scheme: 'file',
  })),
  file: vi.fn((path: string) => ({
    fsPath: path,
    toString: () => path,
    scheme: 'file',
  })),
  parse: vi.fn((str: string) => ({
    fsPath: str,
    toString: () => str,
    scheme: 'file',
  })),
};

export class ExtensionContext {
  subscriptions: { dispose: () => void }[] = [];
  extensionUri = { fsPath: '/mock/extension', toString: () => '/mock/extension' };
  extensionPath = '/mock/extension';
  globalState = {
    get: vi.fn(),
    update: vi.fn(),
    keys: vi.fn().mockReturnValue([]),
  };
  workspaceState = {
    get: vi.fn(),
    update: vi.fn(),
    keys: vi.fn().mockReturnValue([]),
  };
}

// ViewColumn enum (cv-2-1)
export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3,
  Active: -1,
  Beside: -2,
};

// File types enum
export const FileType = {
  Unknown: 0,
  File: 1,
  Directory: 2,
  SymbolicLink: 64,
};

// Mock RelativePattern class (cv-1-3)
export class RelativePattern {
  constructor(
    public readonly base: unknown,
    public readonly pattern: string
  ) {}
}

// Mock FileSystemError class (cv-1-3)
export class FileSystemError extends Error {
  static FileNotFound(uri?: unknown): FileSystemError {
    return new FileSystemError(`FileNotFound: ${uri}`);
  }
  constructor(message?: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

// Mock TabInputCustom class (story-1.2)
export class TabInputCustom {
  constructor(public readonly uri: { toString: () => string }) {}
}

// Export default for module import
export default {
  window,
  workspace,
  commands,
  env,
  Uri,
  ExtensionContext,
  FileType,
  ViewColumn,
  Range,
  Position,
  WorkspaceEdit,
  RelativePattern,
  FileSystemError,
  TabInputCustom,
};
