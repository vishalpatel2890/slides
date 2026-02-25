import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PropertyGroup } from '../../src/webview/theme-editor/components/PropertyInput';

/**
 * Component tests for PropertyGroup layout prop.
 * Story Reference: bt-4-2 Tasks 4, 5 -- AC-11, AC-12
 */

// Mock acquireVsCodeApi
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

describe('PropertyGroup', () => {
  it('renders children vertically by default (no layout prop) (AC-11)', () => {
    render(
      <PropertyGroup title="Test Group">
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </PropertyGroup>
    );
    // Children should be direct children of the group container, not wrapped in a flex div
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    // No flex content wrapper in vertical mode
    expect(screen.queryByTestId('property-group-content-Test Group')).not.toBeInTheDocument();
  });

  it('renders children vertically when layout="vertical" (AC-11)', () => {
    render(
      <PropertyGroup title="Vertical Group" layout="vertical">
        <div data-testid="child-1">Child 1</div>
      </PropertyGroup>
    );
    expect(screen.queryByTestId('property-group-content-Vertical Group')).not.toBeInTheDocument();
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
  });

  it('renders children in flex-wrap container when layout="horizontal" (AC-11, AC-12)', () => {
    render(
      <PropertyGroup title="Horizontal Group" layout="horizontal">
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </PropertyGroup>
    );
    const content = screen.getByTestId('property-group-content-Horizontal Group');
    expect(content).toBeInTheDocument();
    expect(content).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });
  });

  it('horizontal layout has 8px gap between children (AC-12)', () => {
    render(
      <PropertyGroup title="Gap Group" layout="horizontal">
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </PropertyGroup>
    );
    const content = screen.getByTestId('property-group-content-Gap Group');
    expect(content).toHaveStyle({ gap: '8px' });
    // All children rendered inside flex container
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('displays the title label', () => {
    render(
      <PropertyGroup title="Colors">
        <div>child</div>
      </PropertyGroup>
    );
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });
});
