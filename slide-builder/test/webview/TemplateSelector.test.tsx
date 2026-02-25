/**
 * TemplateSelector Component Tests
 *
 * Story Reference: 20-2 Task 3.5, Task 4.5 - Component + accessibility tests
 * AC-20.2.1: Template field opens dropdown (Radix Popover)
 * AC-20.2.2: All templates displayed
 * AC-20.2.3: Each template shows name, description, confidence badge
 * AC-20.2.5: Sorted by confidence score descending
 * AC-20.2.10: Selection triggers onSelect
 * AC-20.2.11: ARIA role="listbox", keyboard navigation
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateSelector } from '../../src/webview/plan/components/TemplateSelector';
import type { TemplateCatalogEntry, TemplateScore } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockTemplates: TemplateCatalogEntry[] = [
  { id: 'title-slide', name: 'Title Slide', description: 'Opening slide with title and subtitle', use_cases: ['introduction'] },
  { id: 'content-slide', name: 'Content Slide', description: 'General content with bullet points', use_cases: ['content'] },
  { id: 'data-chart', name: 'Data Chart', description: 'Data visualization with charts', use_cases: ['data'] },
];

const mockScores: TemplateScore[] = [
  { templateId: 'data-chart', templateName: 'Data Chart', score: 85, tier: 'high', description: 'Data visualization with charts' },
  { templateId: 'content-slide', templateName: 'Content Slide', score: 65, tier: 'medium', description: 'General content with bullet points' },
  { templateId: 'title-slide', templateName: 'Title Slide', score: 25, tier: 'low', description: 'Opening slide with title and subtitle' },
];

// =============================================================================
// Tests - Trigger Display
// =============================================================================

describe('TemplateSelector - Trigger', () => {
  it('displays current template name', () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Content Slide')).toBeDefined();
  });

  it('displays placeholder when no current template', () => {
    render(
      <TemplateSelector
        currentTemplate=""
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Select template...')).toBeDefined();
  });

  it('shows current template confidence badge on trigger', () => {
    render(
      <TemplateSelector
        currentTemplate="data-chart"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );
    // Should show 85% badge for data-chart
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('has aria-haspopup="listbox" on trigger', () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );
    const trigger = screen.getByRole('button');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
  });
});

// =============================================================================
// Tests - Dropdown Content (AC-20.2.2, AC-20.2.3, AC-20.2.5)
// =============================================================================

describe('TemplateSelector - Dropdown', () => {
  it('opens dropdown on click (AC-20.2.1)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeDefined();
    });
  });

  it('shows all templates in dropdown (AC-20.2.2)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);
    });
  });

  it('shows template name, description, and score badge (AC-20.2.3)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      // Template names
      expect(screen.getByText('Data Chart')).toBeDefined();
      // Descriptions
      expect(screen.getByText('Data visualization with charts')).toBeDefined();
      // Score badges - use getAllByText since trigger also shows current template score
      expect(screen.getAllByText('85%').length).toBeGreaterThanOrEqual(1);
      // 65% appears twice: on trigger (current template) and in dropdown
      expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('25%').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('sorts templates by score descending (AC-20.2.5)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      // First option should be data-chart (85%), then content (65%), then title (25%)
      expect(options[0].textContent).toContain('Data Chart');
      expect(options[1].textContent).toContain('Content Slide');
      expect(options[2].textContent).toContain('Title Slide');
    });
  });

  it('shows empty state when no templates', async () => {
    render(
      <TemplateSelector
        currentTemplate=""
        templates={[]}
        scores={[]}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('No templates available')).toBeDefined();
    });
  });
});

// =============================================================================
// Tests - Selection (AC-20.2.10)
// =============================================================================

describe('TemplateSelector - Selection', () => {
  it('calls onSelect when template clicked (AC-20.2.10)', async () => {
    const onSelect = vi.fn();
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      fireEvent.click(options[0]); // Click Data Chart (first sorted by score)
    });

    expect(onSelect).toHaveBeenCalledWith('data-chart');
  });

  it('marks current template as selected', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      const contentOption = options.find((o) => o.textContent?.includes('Content Slide'));
      expect(contentOption?.getAttribute('aria-selected')).toBe('true');
    });
  });
});

// =============================================================================
// Tests - Accessibility (AC-20.2.11)
// =============================================================================

describe('TemplateSelector - Accessibility', () => {
  it('has role="listbox" on template list (AC-20.2.11)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeDefined();
    });
  });

  it('has role="option" on each template item (AC-20.2.11)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);
    });
  });

  it('keyboard: Enter selects active item (AC-20.2.11)', async () => {
    const onSelect = vi.fn();
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeDefined();
    });

    // Find the popover content element that has the keyDown handler
    const listbox = screen.getByRole('listbox');
    const popoverContent = listbox.parentElement!;

    // Navigate down then press Enter
    fireEvent.keyDown(popoverContent, { key: 'ArrowDown' });
    fireEvent.keyDown(popoverContent, { key: 'Enter' });

    // Should have selected the first item (after ArrowDown sets activeIndex to 0)
    expect(onSelect).toHaveBeenCalledWith('data-chart');
  });

  it('keyboard: Escape closes dropdown (AC-20.2.11)', async () => {
    render(
      <TemplateSelector
        currentTemplate="content-slide"
        templates={mockTemplates}
        scores={mockScores}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeDefined();
    });

    // Press Escape on the popover content
    const listbox = screen.getByRole('listbox');
    const popoverContent = listbox.parentElement!;
    fireEvent.keyDown(popoverContent, { key: 'Escape' });

    // Dropdown should close - listbox should no longer be in DOM
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });
});

// =============================================================================
// Tests - Fallback Display (no scores)
// =============================================================================

describe('TemplateSelector - Fallback', () => {
  it('shows templates with 0% when no scores provided', async () => {
    render(
      <TemplateSelector
        currentTemplate=""
        templates={mockTemplates}
        scores={[]}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3);
      // All should show 0%
      const zeroPercents = screen.getAllByText('0%');
      expect(zeroPercents.length).toBeGreaterThanOrEqual(3);
    });
  });
});
