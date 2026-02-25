/**
 * ColorMetadataFields component tests
 *
 * Story Reference: v3-4-1 AC-4, AC-5; v3-4-2 AC-5 through AC-10
 * Architecture Reference: ADR-V3-006 — Non-breaking catalog schema extension
 *
 * Tests the display and editing of brand asset color intelligence metadata.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { ColorMetadataFields } from '../../../src/webview/catalog/components/ColorMetadataFields';
import type { ColorMetadata } from '../../../src/shared/types';

expect.extend(matchers);

describe('ColorMetadataFields', () => {
  const fullMetadata: ColorMetadata = {
    backgroundAffinity: 'light',
    hasTransparency: true,
    dominantColors: ['#1a1a2e', '#16213e', '#0f3460'],
    contrastNeeds: 'high',
    assetType: 'logo',
    manualOverride: false,
  };

  describe('Rendering (AC-4)', () => {
    it('renders heading', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('Color Intelligence')).toBeInTheDocument();
    });

    it('displays background affinity value in read-only mode', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('Light backgrounds')).toBeInTheDocument();
    });

    it('displays transparency value as Yes when true in read-only mode', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('displays transparency value as No when false in read-only mode', () => {
      const metadata: ColorMetadata = { ...fullMetadata, hasTransparency: false };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('displays dominant colors as color chips', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('#1a1a2e')).toBeInTheDocument();
      expect(screen.getByText('#16213e')).toBeInTheDocument();
      expect(screen.getByText('#0f3460')).toBeInTheDocument();
    });

    it('displays contrast needs value in read-only mode', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('displays asset type value in read-only mode', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByText('logo')).toBeInTheDocument();
    });
  });

  describe('Background affinity labels (read-only)', () => {
    it('displays "Light backgrounds" for light affinity', () => {
      const metadata: ColorMetadata = { ...fullMetadata, backgroundAffinity: 'light' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Light backgrounds')).toBeInTheDocument();
    });

    it('displays "Dark backgrounds" for dark affinity', () => {
      const metadata: ColorMetadata = { ...fullMetadata, backgroundAffinity: 'dark' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Dark backgrounds')).toBeInTheDocument();
    });

    it('displays "Light & dark" for both affinity', () => {
      const metadata: ColorMetadata = { ...fullMetadata, backgroundAffinity: 'both' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Light & dark')).toBeInTheDocument();
    });

    it('displays "Any background" for any affinity', () => {
      const metadata: ColorMetadata = { ...fullMetadata, backgroundAffinity: 'any' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Any background')).toBeInTheDocument();
    });
  });

  describe('Contrast needs labels (read-only)', () => {
    it('displays "High" for high contrast needs', () => {
      const metadata: ColorMetadata = { ...fullMetadata, contrastNeeds: 'high' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('displays "Medium" for medium contrast needs', () => {
      const metadata: ColorMetadata = { ...fullMetadata, contrastNeeds: 'medium' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays "Low" for low contrast needs', () => {
      const metadata: ColorMetadata = { ...fullMetadata, contrastNeeds: 'low' };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Color chips', () => {
    it('does not render colors section when dominantColors is empty', () => {
      const metadata: ColorMetadata = { ...fullMetadata, dominantColors: [] };
      render(<ColorMetadataFields metadata={metadata} readOnly />);
      expect(screen.queryByText('Colors')).not.toBeInTheDocument();
    });

    it('renders correct number of color chips', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      // Each color appears once as hex text
      const hexLabels = screen.getAllByText(/^#[0-9a-f]{6}$/i);
      expect(hexLabels).toHaveLength(3);
    });

    it('color chips have title attribute with hex value', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      const chip = screen.getByTitle('#1a1a2e');
      expect(chip).toBeInTheDocument();
    });

    it('color chips have aria-label for accessibility', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByLabelText('Dominant color #1a1a2e')).toBeInTheDocument();
    });
  });

  describe('Read-only display (AC-5)', () => {
    it('does not render any editable inputs when readOnly=true', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('does not render editable controls without onChange', () => {
      render(<ColorMetadataFields metadata={fullMetadata} />);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  describe('Editable mode (v3-4-2 AC-5 through AC-10)', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      mockOnChange.mockClear();
    });

    it('renders dropdowns when onChange is provided (AC-5)', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      // Radix Select triggers have combobox role
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(3); // background, contrast, assetType
    });

    it('renders switch for transparency when onChange is provided (AC-6)', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('switch reflects hasTransparency state', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'checked');
    });

    it('switch shows unchecked state when hasTransparency is false', () => {
      const metadata = { ...fullMetadata, hasTransparency: false };
      render(<ColorMetadataFields metadata={metadata} onChange={mockOnChange} />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    });

    it('clicking switch calls onChange with hasTransparency update (AC-6)', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      const switchEl = screen.getByRole('switch');
      fireEvent.click(switchEl);
      expect(mockOnChange).toHaveBeenCalledWith({ hasTransparency: false });
    });

    it('dominant colors remain read-only in editable mode (AC-7)', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      // Colors should still be displayed as chips, not editable
      expect(screen.getByText('#1a1a2e')).toBeInTheDocument();
      expect(screen.getByTitle('#1a1a2e')).toBeInTheDocument();
    });

    it('shows manual override indicator when manualOverride is true', () => {
      const metadata = { ...fullMetadata, manualOverride: true };
      render(<ColorMetadataFields metadata={metadata} onChange={mockOnChange} />);
      expect(screen.getByText('Manual override active')).toBeInTheDocument();
    });

    it('does not show manual override indicator when manualOverride is false', () => {
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      expect(screen.queryByText('Manual override active')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has region role with aria-label', () => {
      render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      expect(screen.getByRole('region', { name: 'Color metadata' })).toBeInTheDocument();
    });

    it('passes axe accessibility checks in read-only mode', async () => {
      const { container } = render(<ColorMetadataFields metadata={fullMetadata} readOnly />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe checks with empty colors', async () => {
      const metadata: ColorMetadata = { ...fullMetadata, dominantColors: [] };
      const { container } = render(<ColorMetadataFields metadata={metadata} readOnly />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('editable controls have accessible labels', () => {
      const mockOnChange = vi.fn();
      render(<ColorMetadataFields metadata={fullMetadata} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Select background affinity')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle transparency')).toBeInTheDocument();
      expect(screen.getByLabelText('Select contrast needs')).toBeInTheDocument();
      expect(screen.getByLabelText('Select asset type')).toBeInTheDocument();
    });
  });
});
