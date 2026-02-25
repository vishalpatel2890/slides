import { describe, it, expect } from 'vitest';

describe('Extension', () => {
  it('should export activate function', async () => {
    const extension = await import('../../src/extension/extension');
    expect(typeof extension.activate).toBe('function');
  });

  it('should export deactivate function', async () => {
    const extension = await import('../../src/extension/extension');
    expect(typeof extension.deactivate).toBe('function');
  });
});
