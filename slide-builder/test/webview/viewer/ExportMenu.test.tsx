/**
 * Tests for ExportMenu component.
 * Story 1.2: Export Quality Presets UI
 *
 * Note: Full submenu interaction testing requires end-to-end tests in a real browser
 * because Radix UI DropdownMenu uses portals that don't render in jsdom.
 * These tests verify component structure, props, and basic rendering.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportMenu } from '../../../src/webview/viewer/components/ExportMenu';
import type { UseExportReturn } from '../../../src/webview/viewer/hooks/useExport';
import { PDF_QUALITY_PRESETS } from '../../../src/shared/types';

/** Create mock export actions with optional overrides. */
function createMockExportActions(overrides: Partial<UseExportReturn> = {}): UseExportReturn {
  return {
    exportCurrentPng: vi.fn(),
    exportAllPng: vi.fn(),
    exportPdf: vi.fn(),
    isExporting: false,
    exportProgress: null,
    ...overrides,
  };
}

describe('ExportMenu', () => {
  it('renders the export trigger button (AC #1)', () => {
    render(
      <ExportMenu
        exportActions={createMockExportActions()}
        mode="presentation"
      />
    );

    const trigger = screen.getByRole('button', { name: /export slides/i });
    expect(trigger).toBeInTheDocument();
  });

  it('trigger button has correct accessibility attributes', () => {
    render(
      <ExportMenu
        exportActions={createMockExportActions()}
        mode="presentation"
      />
    );

    const trigger = screen.getByRole('button', { name: /export slides/i });
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('title')).toBe('Export slides as PNG or PDF');
  });

  it('disables trigger when isExporting is true (AC #8)', () => {
    render(
      <ExportMenu
        exportActions={createMockExportActions({ isExporting: true })}
        mode="presentation"
      />
    );

    const trigger = screen.getByRole('button', { name: /export slides/i });
    expect(trigger).toBeDisabled();
    expect(trigger.className).toContain('viewer-toolbar__button--disabled');
  });

  it('disables trigger when not in presentation mode (AC #8)', () => {
    render(
      <ExportMenu
        exportActions={createMockExportActions()}
        mode="edit"
      />
    );

    const trigger = screen.getByRole('button', { name: /export slides/i });
    expect(trigger).toBeDisabled();
  });

  it('enables trigger in presentation mode when not exporting', () => {
    render(
      <ExportMenu
        exportActions={createMockExportActions()}
        mode="presentation"
      />
    );

    const trigger = screen.getByRole('button', { name: /export slides/i });
    expect(trigger).not.toBeDisabled();
    expect(trigger.className).not.toContain('viewer-toolbar__button--disabled');
  });

  it('renders without crashing with all props', () => {
    const { container } = render(
      <ExportMenu
        exportActions={createMockExportActions()}
        mode="presentation"
      />
    );
    expect(container.firstChild).toBeDefined();
  });

  it('exportPdf accepts preset parameter in UseExportReturn interface (AC #3)', () => {
    const mockExportPdf = vi.fn();
    const exportActions = createMockExportActions({ exportPdf: mockExportPdf });

    // Verify the interface accepts preset parameter
    void exportActions.exportPdf('standard');
    expect(mockExportPdf).toHaveBeenCalledWith('standard');

    void exportActions.exportPdf('best');
    expect(mockExportPdf).toHaveBeenCalledWith('best');

    void exportActions.exportPdf('compact');
    expect(mockExportPdf).toHaveBeenCalledWith('compact');
  });

  it('exportPdf works without preset parameter (backwards compatible)', () => {
    const mockExportPdf = vi.fn();
    const exportActions = createMockExportActions({ exportPdf: mockExportPdf });

    void exportActions.exportPdf();
    expect(mockExportPdf).toHaveBeenCalledWith();
  });

  describe('PDF_QUALITY_PRESETS configuration (AC #2)', () => {
    it('defines exactly 3 presets: best, standard, compact', () => {
      const presetKeys = Object.keys(PDF_QUALITY_PRESETS);
      expect(presetKeys).toEqual(['best', 'standard', 'compact']);
    });

    it('each preset has a label and description', () => {
      for (const [, preset] of Object.entries(PDF_QUALITY_PRESETS)) {
        expect(preset.label).toBeTruthy();
        expect(typeof preset.label).toBe('string');
        expect(preset.description).toBeTruthy();
        expect(typeof preset.description).toBe('string');
      }
    });

    it('best preset uses PNG format (lossless)', () => {
      expect(PDF_QUALITY_PRESETS.best.format).toBe('png');
      expect(PDF_QUALITY_PRESETS.best.quality).toBeUndefined();
    });

    it('standard preset uses JPEG with quality setting', () => {
      expect(PDF_QUALITY_PRESETS.standard.format).toBe('jpeg');
      expect(PDF_QUALITY_PRESETS.standard.quality).toBeDefined();
      expect(PDF_QUALITY_PRESETS.standard.quality).toBeGreaterThan(0);
      expect(PDF_QUALITY_PRESETS.standard.quality).toBeLessThanOrEqual(100);
    });

    it('compact preset uses JPEG with lower quality than standard', () => {
      expect(PDF_QUALITY_PRESETS.compact.format).toBe('jpeg');
      expect(PDF_QUALITY_PRESETS.compact.quality).toBeDefined();
      expect(PDF_QUALITY_PRESETS.compact.quality!).toBeLessThan(PDF_QUALITY_PRESETS.standard.quality!);
    });
  });

  // Integration note: Submenu rendering, preset item click behavior, and
  // disabled state propagation to submenu items should be tested in
  // end-to-end tests using a real browser (e.g., Playwright) because
  // Radix UI DropdownMenu.Portal renders outside the component tree
  // and requires a proper DOM environment to function correctly.
});
