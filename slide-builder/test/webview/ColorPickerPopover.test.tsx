import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ColorPickerPopover } from '../../src/webview/theme-editor/components/ColorPickerPopover';

/**
 * Component tests for ColorPickerPopover.
 * Story Reference: bt-3-1 Task 3.8 -- AC-2, AC-3, AC-4, AC-5, AC-8
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

describe('ColorPickerPopover', () => {
  it('renders the popover container', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);
    expect(screen.getByTestId('color-picker-popover')).toBeInTheDocument();
  });

  it('renders hex input with current color value', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff5733" onChange={onChange} />);
    const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
    expect(hexInput.value).toBe('#ff5733');
  });

  it('renders RGB inputs with correct values for #ff0000', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    expect((screen.getByTestId('rgb-r-input') as HTMLInputElement).value).toBe('255');
    expect((screen.getByTestId('rgb-g-input') as HTMLInputElement).value).toBe('0');
    expect((screen.getByTestId('rgb-b-input') as HTMLInputElement).value).toBe('0');
  });

  it('renders HSL inputs with correct values for #ff0000', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    expect((screen.getByTestId('hsl-h-input') as HTMLInputElement).value).toBe('0');
    expect((screen.getByTestId('hsl-s-input') as HTMLInputElement).value).toBe('100');
    expect((screen.getByTestId('hsl-l-input') as HTMLInputElement).value).toBe('50');
  });

  it('fires onChange when hex input changes to valid hex', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    const hexInput = screen.getByTestId('hex-input');
    fireEvent.change(hexInput, { target: { value: '#00ff00' } });

    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  it('does not fire onChange for invalid hex input', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    const hexInput = screen.getByTestId('hex-input');
    fireEvent.change(hexInput, { target: { value: '#xyz' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires onChange when RGB input changes', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    const gInput = screen.getByTestId('rgb-g-input');
    fireEvent.change(gInput, { target: { value: '128' } });

    expect(onChange).toHaveBeenCalled();
    // The new hex should incorporate green = 128
    const calledHex = onChange.mock.calls[0][0];
    expect(calledHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('fires onChange when HSL input changes', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    const hInput = screen.getByTestId('hsl-h-input');
    fireEvent.change(hInput, { target: { value: '120' } });

    expect(onChange).toHaveBeenCalled();
    const calledHex = onChange.mock.calls[0][0];
    expect(calledHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('has accessible labels on all inputs', () => {
    const onChange = vi.fn();
    render(<ColorPickerPopover color="#ff0000" onChange={onChange} />);

    expect(screen.getByLabelText('Hex color value')).toBeInTheDocument();
    expect(screen.getByLabelText('Red')).toBeInTheDocument();
    expect(screen.getByLabelText('Green')).toBeInTheDocument();
    expect(screen.getByLabelText('Blue')).toBeInTheDocument();
    // "Hue" appears twice: react-colorful's internal slider + our input
    expect(screen.getAllByLabelText('Hue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Saturation')).toBeInTheDocument();
    expect(screen.getByLabelText('Lightness')).toBeInTheDocument();
  });
});
