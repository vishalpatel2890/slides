import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ColorSwatch } from '../../src/webview/theme-editor/components/ColorSwatch';

/**
 * Component tests for ColorSwatch.
 * Story Reference: bt-3-1 Task 4.7 -- AC-1, AC-2, AC-8
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

describe('ColorSwatch', () => {
  const defaultProps = {
    label: 'Primary',
    value: '#0066cc',
    path: 'colors.primary',
    onUpdate: vi.fn(),
  };

  it('renders swatch with correct background color', () => {
    render(<ColorSwatch {...defaultProps} />);
    const preview = screen.getByTestId('swatch-preview-colors.primary');
    expect(preview).toHaveStyle({ background: '#0066cc' });
  });

  it('displays hex value as text', () => {
    render(<ColorSwatch {...defaultProps} />);
    expect(screen.getByText('#0066cc')).toBeInTheDocument();
  });

  it('displays label text', () => {
    render(<ColorSwatch {...defaultProps} />);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('click opens popover with color picker', () => {
    render(<ColorSwatch {...defaultProps} />);
    const button = screen.getByTestId('swatch-button-colors.primary');
    fireEvent.click(button);
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();
  });

  it('renders fallback indicator for invalid color', () => {
    render(<ColorSwatch {...defaultProps} value="invalid" />);
    // Should still render without crashing
    const preview = screen.getByTestId('swatch-preview-colors.primary');
    expect(preview).toBeInTheDocument();
    // Shows the raw invalid value as text
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  it('shows dirty indicator when isDirty is true', () => {
    render(<ColorSwatch {...defaultProps} isDirty={true} />);
    const container = screen.getByTestId('color-swatch-colors.primary');
    expect(container).toHaveStyle({
      borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
    });
  });

  it('does not show dirty indicator when isDirty is false', () => {
    render(<ColorSwatch {...defaultProps} isDirty={false} />);
    const container = screen.getByTestId('color-swatch-colors.primary');
    expect(container).toHaveStyle({ borderLeft: 'none' });
  });

  it('has accessible button label', () => {
    render(<ColorSwatch {...defaultProps} />);
    expect(screen.getByLabelText('Edit Primary color')).toBeInTheDocument();
  });

  // =========================================================================
  // bt-4-2: Compact variant tests (AC-7, AC-8, AC-9, AC-10)
  // =========================================================================

  describe('compact variant', () => {
    it('renders at 28x28px when compact={true} (AC-7, AC-8)', () => {
      render(<ColorSwatch {...defaultProps} compact={true} />);
      const preview = screen.getByTestId('swatch-preview-colors.primary');
      expect(preview).toHaveStyle({ width: '28px', height: '28px' });
    });

    it('renders label below swatch in small text when compact={true} (AC-8)', () => {
      render(<ColorSwatch {...defaultProps} compact={true} />);
      const label = screen.getByTestId('swatch-label-colors.primary');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Primary');
      expect(label).toHaveStyle({ fontSize: '10px' });
    });

    it('preserves full-size 32x32px rendering when compact={false} (default) (AC-7)', () => {
      render(<ColorSwatch {...defaultProps} />);
      const preview = screen.getByTestId('swatch-preview-colors.primary');
      expect(preview).toHaveStyle({ width: '32px', height: '32px' });
    });

    it('shows colored ring when compact and dirty (AC-9)', () => {
      render(<ColorSwatch {...defaultProps} compact={true} isDirty={true} />);
      const preview = screen.getByTestId('swatch-preview-colors.primary');
      expect(preview).toHaveStyle({
        boxShadow: '0 0 0 2px var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
      });
    });

    it('does not show colored ring when compact and not dirty (AC-9)', () => {
      render(<ColorSwatch {...defaultProps} compact={true} isDirty={false} />);
      const preview = screen.getByTestId('swatch-preview-colors.primary');
      expect(preview).toHaveStyle({ boxShadow: 'none' });
    });

    it('full-size dirty still shows left border, not ring (AC-9)', () => {
      render(<ColorSwatch {...defaultProps} isDirty={true} />);
      const container = screen.getByTestId('color-swatch-colors.primary');
      expect(container).toHaveStyle({
        borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
      });
    });

    it('click opens ColorPickerPopover when compact (AC-10)', () => {
      render(<ColorSwatch {...defaultProps} compact={true} />);
      const button = screen.getByTestId('swatch-button-colors.primary');
      fireEvent.click(button);
      expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();
    });

    it('has accessible button label when compact', () => {
      render(<ColorSwatch {...defaultProps} compact={true} />);
      expect(screen.getByLabelText('Edit Primary color')).toBeInTheDocument();
    });
  });
});
