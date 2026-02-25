import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple component for testing React setup
function TestComponent(): React.ReactElement {
  return <div data-testid="test">Hello World</div>;
}

describe('Webview', () => {
  it('should render React components', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test')).toBeDefined();
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
