/**
 * AssetDetail component tests
 *
 * Story Reference: cv-4-3 AC-17 through AC-23
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { AssetDetail } from '../../src/webview/catalog/components/AssetDetail';
import type { BrandAsset } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAsset: BrandAsset = {
  id: 'test-asset-1',
  name: 'Test Logo',
  type: 'logo',
  path: '/absolute/path/to/logo.png',
  relativePath: 'brand-assets/logos/logo.png',
  description: 'A test logo for unit tests',
  tags: ['brand', 'primary', 'logo'],
  dimensions: { width: 200, height: 100 },
  fileSize: 15360, // 15 KB
  format: 'png',
  lastModified: Date.now(),
  webviewUri: 'vscode-webview://test/logo.png',
};

const mockAssetWithoutDimensions: BrandAsset = {
  ...mockAsset,
  id: 'test-asset-2',
  name: 'SVG Icon',
  type: 'icon',
  dimensions: undefined,
  format: 'svg',
  fileSize: 1024,
};

// =============================================================================
// Helper
// =============================================================================

function renderWithContext(
  ui: React.ReactElement,
  overrides: { selectedAsset?: BrandAsset | null } = {}
) {
  return render(
    <CatalogProvider initialOverrides={{ selectedAsset: overrides.selectedAsset ?? null } as never}>
      {ui}
    </CatalogProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('AssetDetail', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering (AC-17, AC-18, AC-19, AC-23)', () => {
    it('renders nothing when no asset is selected', () => {
      renderWithContext(<AssetDetail />);
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('renders panel with role="complementary" when asset selected (AC-23)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('has aria-label "Asset details" (AC-23)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Asset details');
    });

    it('displays full-size preview image (AC-18)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      const img = screen.getByAltText('Test Logo');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'vscode-webview://test/logo.png');
    });

    it('displays asset name (AC-19, AC-35)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      // Name is now rendered via InlineEditText as h2 with aria-label for click-to-edit
      expect(screen.getByText('Test Logo')).toBeInTheDocument();
    });

    it('displays asset description (AC-19)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      expect(screen.getByText('A test logo for unit tests')).toBeInTheDocument();
    });

    it('displays tags as chips (AC-19)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      // Check tags section has the expected tags
      const tagElements = screen.getAllByText('brand');
      expect(tagElements.length).toBeGreaterThan(0);
      expect(screen.getByText('primary')).toBeInTheDocument();
      // 'logo' appears in both tags and type info, so check for 2 occurrences
      const logoElements = screen.getAllByText('logo');
      expect(logoElements.length).toBe(2); // one in tags, one in type info
    });

    it('displays file info: type, format, dimensions, size, path (AC-19)', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      // Type appears in file info (and also in tags)
      const logoElements = screen.getAllByText('logo');
      expect(logoElements.length).toBeGreaterThan(0);
      expect(screen.getByText('PNG')).toBeInTheDocument();
      expect(screen.getByText('200 x 100')).toBeInTheDocument();
      expect(screen.getByText('15.0 KB')).toBeInTheDocument();
      expect(screen.getByText('brand-assets/logos/logo.png')).toBeInTheDocument();
    });

    it('handles assets without dimensions', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAssetWithoutDimensions });
      expect(screen.queryByText(/x/)).not.toBeInTheDocument();
    });
  });

  describe('Copy Path (AC-20)', () => {
    it('displays Copy Path button', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      expect(screen.getByRole('button', { name: /copy path/i })).toBeInTheDocument();
    });

    it('copies relativePath to clipboard on click', async () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      const copyBtn = screen.getByRole('button', { name: /copy path/i });

      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('brand-assets/logos/logo.png');
      });
    });

    it('shows feedback after copy', async () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      const copyBtn = screen.getByRole('button', { name: /copy path/i });

      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Close Behaviors (AC-21)', () => {
    it('renders close button with aria-label', () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      expect(screen.getByRole('button', { name: 'Close asset details' })).toBeInTheDocument();
    });

    it('close button click dispatches SET_SELECTED_ASSET(null)', async () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });
      const closeBtn = screen.getByRole('button', { name: 'Close asset details' });

      fireEvent.click(closeBtn);

      // After close, the panel should not be rendered
      await waitFor(() => {
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      });
    });

    it('Escape key closes panel', async () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });

      // Verify panel is open
      expect(screen.getByRole('complementary')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      });
    });

    it('calls onClose callback when closing', async () => {
      const onClose = vi.fn();
      renderWithContext(<AssetDetail onClose={onClose} />, { selectedAsset: mockAsset });

      const closeBtn = screen.getByRole('button', { name: 'Close asset details' });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('focuses close button when panel opens', async () => {
      renderWithContext(<AssetDetail />, { selectedAsset: mockAsset });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Close asset details' })).toHaveFocus();
      });
    });
  });
});
