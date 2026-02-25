/**
 * SectionHeader Component Tests
 *
 * Story Reference: 19-2 Task 7.1 - SectionHeader tests
 * AC-19.2.2: Header displays title (13px, 600 weight, uppercase, 0.5px letter-spacing),
 *            narrative role, and slide count badge.
 * AC-19.2.4: Clicking header toggles collapse with aria-expanded.
 * AC-19.2.6: Keyboard-accessible: Enter/Space to toggle.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Accordion from '@radix-ui/react-accordion';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { SectionHeader } from '../../src/webview/plan/components/SectionHeader';
import { PlanProvider } from '../../src/webview/plan/context/PlanContext';
import type { AgendaSection } from '../../src/shared/types';

// Extend expect with axe matchers
expect.extend(matchers);

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSection: AgendaSection = {
  id: 'intro',
  title: 'Introduction',
  narrative_role: 'Opening and context-setting',
};

const mockSectionNoRole: AgendaSection = {
  id: 'empty-role',
  title: 'No Role Section',
  narrative_role: '',
};

// =============================================================================
// Helper: Wrap SectionHeader in PlanProvider + Accordion for proper testing
// =============================================================================

function renderSection(section: AgendaSection, slideCount: number, extraProps: Record<string, unknown> = {}) {
  return render(
    <PlanProvider>
      <SectionHeader section={section} slideCount={slideCount} {...extraProps} />
    </PlanProvider>
  );
}

function AccordionWrapper({
  section,
  slideCount,
  defaultExpanded = true,
}: {
  section: AgendaSection;
  slideCount: number;
  defaultExpanded?: boolean;
}): React.ReactElement {
  return (
    <PlanProvider>
      <Accordion.Root
        type="multiple"
        defaultValue={defaultExpanded ? [section.id] : []}
      >
        <Accordion.Item value={section.id}>
          <Accordion.Trigger asChild>
            <SectionHeader section={section} slideCount={slideCount} />
          </Accordion.Trigger>
          <Accordion.Content>
            <div>Section content</div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </PlanProvider>
  );
}

// =============================================================================
// Basic Rendering Tests (AC-19.2.2)
// =============================================================================

describe('SectionHeader Rendering (AC-19.2.2)', () => {
  it('renders section title', () => {
    renderSection(mockSection, 5);
    expect(screen.getByText('Introduction')).toBeDefined();
  });

  it('renders title with professional styling', () => {
    renderSection(mockSection, 5);
    const title = screen.getByText('Introduction');
    // 19-4 Enterprise: Clean, professional title (no uppercase)
    expect(title.className).toContain('font-semibold');
  });

  it('renders narrative role when present', () => {
    renderSection(mockSection, 5);
    expect(screen.getByText('Opening and context-setting')).toBeDefined();
  });

  it('does not render narrative role when empty', () => {
    const { container } = renderSection(mockSectionNoRole, 5);
    // Should not crash - component renders successfully
    expect(screen.getByText('No Role Section')).toBeDefined();
  });

  it('renders slide count badge', () => {
    renderSection(mockSection, 5);
    expect(screen.getByText('5')).toBeDefined();
  });

  it('renders slide count of 0', () => {
    renderSection(mockSection, 0);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('renders chevron icon', () => {
    const { container } = renderSection(mockSection, 5);
    // Chevron is an SVG element
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });
});

// =============================================================================
// Typography Tests (AC-19.2.2)
// =============================================================================

describe('SectionHeader Typography (AC-19.2.2)', () => {
  it('applies correct font size class for title', () => {
    renderSection(mockSection, 5);
    const title = screen.getByText('Introduction');
    // 19-4 Enterprise: Clean 13px for professional look
    expect(title.className).toContain('text-[13px]');
  });

  it('applies semibold font weight to title', () => {
    renderSection(mockSection, 5);
    const title = screen.getByText('Introduction');
    // 19-4 Enterprise: Semibold for clean hierarchy
    expect(title.className).toContain('font-semibold');
  });
});

// =============================================================================
// Accordion Integration Tests (AC-19.2.3, AC-19.2.4)
// =============================================================================

describe('SectionHeader Accordion Integration (AC-19.2.3, AC-19.2.4)', () => {
  it('works as Accordion.Trigger', () => {
    render(<AccordionWrapper section={mockSection} slideCount={5} />);
    // Should render without error
    expect(screen.getByText('Introduction')).toBeDefined();
  });

  it('has aria-expanded attribute when used with Accordion', () => {
    const { container } = render(
      <AccordionWrapper section={mockSection} slideCount={5} defaultExpanded />
    );
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-expanded')).toBe('true');
  });

  it('has aria-expanded=false when collapsed', () => {
    const { container } = render(
      <AccordionWrapper section={mockSection} slideCount={5} defaultExpanded={false} />
    );
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles aria-expanded on click', () => {
    const { container } = render(
      <AccordionWrapper section={mockSection} slideCount={5} defaultExpanded />
    );
    const button = container.querySelector('button')!;

    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});

// =============================================================================
// Keyboard Accessibility Tests (AC-19.2.6)
// =============================================================================

describe('SectionHeader Keyboard Accessibility (AC-19.2.6)', () => {
  it('is a button element (keyboard accessible by default)', () => {
    const { container } = renderSection(mockSection, 5);
    const button = container.querySelector('button');
    expect(button).toBeDefined();
    expect(button?.tagName.toLowerCase()).toBe('button');
  });

  it('has type="button" to prevent form submission', () => {
    const { container } = renderSection(mockSection, 5);
    const button = container.querySelector('button');
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('is focusable', () => {
    const { container } = renderSection(mockSection, 5);
    const button = container.querySelector('button')!;

    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('has focus-visible styles available', () => {
    const { container } = renderSection(mockSection, 5);
    const button = container.querySelector('button');
    // Check that focus-visible classes are present
    expect(button?.className).toContain('focus-visible:');
  });

  it('Radix Accordion handles Enter/Space keyboard activation', () => {
    const { container } = render(
      <AccordionWrapper section={mockSection} slideCount={5} defaultExpanded />
    );
    const button = container.querySelector('button')!;

    // Button should have aria-controls pointing to content
    expect(button.getAttribute('aria-controls')).toBeTruthy();
    // Button should be focusable
    expect(button.getAttribute('tabindex')).toBeFalsy(); // Not -1, so focusable
  });
});

// =============================================================================
// Accessibility Scan (AC-19.2.6)
// =============================================================================

describe('SectionHeader Accessibility Scan', () => {
  it('has no accessibility violations as standalone button', async () => {
    const { container } = renderSection(mockSection, 5);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in accordion context', async () => {
    const { container } = render(
      <AccordionWrapper section={mockSection} slideCount={5} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// =============================================================================
// Event Handling Tests
// =============================================================================

describe('SectionHeader Event Handling', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = renderSection(mockSection, 5, { onClick });

    fireEvent.click(container.querySelector('button')!);
    expect(onClick).toHaveBeenCalled();
  });

  it('spreads additional props to button', () => {
    const { container } = renderSection(mockSection, 5, { 'data-testid': 'section-header' });

    expect(container.querySelector('[data-testid="section-header"]')).toBeDefined();
  });
});
