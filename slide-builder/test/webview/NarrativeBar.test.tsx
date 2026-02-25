/**
 * NarrativeBar Component Tests
 *
 * Story Reference: 19-3 Task 6.2 - NarrativeBar tests
 * AC-19.3.3: NarrativeBar displays storyline as horizontal flow: Hook, Tension, Resolution, CTA
 *            with corresponding values from storyline object.
 * AC-19.3.4: Narrative flow elements connected by arrow separators (→).
 * AC-19.3.5: NarrativeBar is scrollable on overflow (for narrow panes).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { NarrativeBar } from '../../src/webview/plan/components/NarrativeBar';
import type { Storyline } from '../../src/shared/types';

// Extend expect with axe matchers
expect.extend(matchers);

// =============================================================================
// Test Fixtures
// =============================================================================

const mockStoryline: Storyline = {
  opening_hook: 'Start with impact',
  tension: 'The challenge we face',
  resolution: 'Our solution approach',
  call_to_action: 'Take action now',
};

const mockStorylinePartial: Storyline = {
  opening_hook: 'Start with impact',
  tension: '',
  resolution: 'Our solution',
  call_to_action: '',
};

const mockStorylineEmpty: Storyline = {
  opening_hook: '',
  tension: '',
  resolution: '',
  call_to_action: '',
};

// =============================================================================
// Basic Rendering Tests (AC-19.3.3)
// =============================================================================

describe('NarrativeBar Rendering (AC-19.3.3)', () => {
  it('renders all four segment labels', () => {
    render(<NarrativeBar storyline={mockStoryline} />);

    expect(screen.getByText('Hook')).toBeDefined();
    expect(screen.getByText('Tension')).toBeDefined();
    expect(screen.getByText('Resolution')).toBeDefined();
    expect(screen.getByText('CTA')).toBeDefined();
  });

  it('renders storyline values', () => {
    render(<NarrativeBar storyline={mockStoryline} />);

    expect(screen.getByText('Start with impact')).toBeDefined();
    expect(screen.getByText('The challenge we face')).toBeDefined();
    expect(screen.getByText('Our solution approach')).toBeDefined();
    expect(screen.getByText('Take action now')).toBeDefined();
  });

  it('maps opening_hook to Hook label', () => {
    render(<NarrativeBar storyline={mockStoryline} />);

    // The value should be next to the Hook label
    expect(screen.getByText('Start with impact')).toBeDefined();
  });

  it('maps call_to_action to CTA label', () => {
    render(<NarrativeBar storyline={mockStoryline} />);

    expect(screen.getByText('Take action now')).toBeDefined();
  });
});

// =============================================================================
// Arrow Separator Tests (AC-19.3.4)
// =============================================================================

describe('NarrativeBar Arrow Separators (AC-19.3.4)', () => {
  it('renders arrow icons between segments', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);

    // Should have 3 arrow icons (between 4 segments)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
  });

  it('arrow icons are hidden from screen readers', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);

    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('arrows have correct size classes', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);

    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      // SVG elements use class attribute, not className property
      const classes = svg.getAttribute('class') ?? '';
      expect(classes).toContain('w-4');
      expect(classes).toContain('h-4');
    });
  });
});

// =============================================================================
// Empty/Missing Values Tests (AC-19.3.3)
// =============================================================================

describe('NarrativeBar Empty Values', () => {
  it('shows placeholder for empty storyline fields', () => {
    render(<NarrativeBar storyline={mockStorylinePartial} />);

    // Empty fields should show "—" placeholder
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBe(2); // tension and call_to_action are empty
  });

  it('shows all placeholders when storyline is entirely empty', () => {
    render(<NarrativeBar storyline={mockStorylineEmpty} />);

    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBe(4);
  });

  it('still renders labels when values are empty', () => {
    render(<NarrativeBar storyline={mockStorylineEmpty} />);

    expect(screen.getByText('Hook')).toBeDefined();
    expect(screen.getByText('Tension')).toBeDefined();
    expect(screen.getByText('Resolution')).toBeDefined();
    expect(screen.getByText('CTA')).toBeDefined();
  });

  it('handles null storyline gracefully', () => {
    // TypeScript would prevent this, but test runtime behavior
    render(<NarrativeBar storyline={null as unknown as Storyline} />);

    // Should render with placeholders and not crash
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBe(4);
  });
});

// =============================================================================
// Scrollable Overflow Tests (AC-19.3.5)
// =============================================================================

describe('NarrativeBar Scrollable Overflow (AC-19.3.5)', () => {
  it('has overflow-x-auto for horizontal scrolling', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('overflow-x-auto');
  });

  it('has whitespace-nowrap to prevent wrapping', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('whitespace-nowrap');
  });

  it('segments do not shrink', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);

    // Each segment container should have flex-shrink-0
    const segments = container.querySelectorAll('[class*="flex-col"]');
    segments.forEach((segment) => {
      expect(segment.className).toContain('flex-shrink-0');
    });
  });
});

// =============================================================================
// Typography Tests
// =============================================================================

describe('NarrativeBar Typography', () => {
  it('labels have uppercase styling', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookLabel = screen.getByText('Hook');

    expect(hookLabel.className).toContain('uppercase');
  });

  it('labels have caption size (11px)', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookLabel = screen.getByText('Hook');

    expect(hookLabel.className).toContain('text-[11px]');
  });

  it('labels have tracking (letter-spacing)', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookLabel = screen.getByText('Hook');

    expect(hookLabel.className).toContain('tracking-wide');
  });

  it('values have body text size', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookValue = screen.getByText('Start with impact');

    expect(hookValue.className).toContain('text-sm');
  });

  it('values are truncated with max-width', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookValue = screen.getByText('Start with impact');

    expect(hookValue.className).toContain('truncate');
    expect(hookValue.className).toContain('max-w-[200px]');
  });
});

// =============================================================================
// Styling Tests
// =============================================================================

describe('NarrativeBar Styling', () => {
  it('has surface background', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('bg-[var(--surface)]');
  });

  it('has bottom border', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('border-b');
  });

  it('has horizontal padding', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('px-6');
  });

  it('has vertical padding', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('py-3');
  });

  it('has gap between items', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('gap-4');
  });

  it('accepts custom className', () => {
    const { container } = render(
      <NarrativeBar storyline={mockStoryline} className="custom-class" />
    );
    const narrativeBar = container.firstChild as HTMLElement;

    expect(narrativeBar.className).toContain('custom-class');
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('NarrativeBar Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with partial storyline', async () => {
    const { container } = render(<NarrativeBar storyline={mockStorylinePartial} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with empty storyline', async () => {
    const { container } = render(<NarrativeBar storyline={mockStorylineEmpty} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has region role for navigation landmark', () => {
    const { container } = render(<NarrativeBar storyline={mockStoryline} />);
    const region = container.querySelector('[role="region"]');

    expect(region).toBeDefined();
    expect(region?.getAttribute('aria-label')).toBe('Narrative flow');
  });

  it('values have title attribute for tooltip on truncation', () => {
    render(<NarrativeBar storyline={mockStoryline} />);
    const hookValue = screen.getByText('Start with impact');

    expect(hookValue.getAttribute('title')).toBe('Start with impact');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('NarrativeBar Edge Cases', () => {
  it('handles very long storyline values', () => {
    const longStoryline: Storyline = {
      opening_hook: 'This is an extremely long opening hook that should be truncated when it exceeds the maximum width of 200 pixels',
      tension: 'Short tension',
      resolution: 'Resolution',
      call_to_action: 'CTA',
    };

    render(<NarrativeBar storyline={longStoryline} />);
    const hookValue = screen.getByText(/This is an extremely long/);

    expect(hookValue.className).toContain('truncate');
    expect(hookValue.getAttribute('title')).toContain('This is an extremely long');
  });

  it('handles special characters in storyline values', () => {
    const specialStoryline: Storyline = {
      opening_hook: 'Hook with <special> & "characters"',
      tension: 'Tension',
      resolution: 'Resolution',
      call_to_action: 'CTA',
    };

    render(<NarrativeBar storyline={specialStoryline} />);
    expect(screen.getByText('Hook with <special> & "characters"')).toBeDefined();
  });

  it('renders correctly with undefined storyline fields', () => {
    const partialStoryline = {
      opening_hook: 'Hook',
    } as Storyline;

    render(<NarrativeBar storyline={partialStoryline} />);

    // Should show placeholder for missing fields
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThanOrEqual(3);
  });
});
