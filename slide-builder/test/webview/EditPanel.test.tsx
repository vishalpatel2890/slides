/**
 * EditPanel Component Tests
 *
 * Story Reference: 20-1 - Edit Panel with Slide Detail Form
 * Story Reference: 22-2 - Validation Details in Edit Panel
 * Tests for panel structure, form fields, accessibility, interactions, and inline validation
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { EditPanel } from '../../src/webview/plan/components/EditPanel';
import { PlanProvider } from '../../src/webview/plan/context/PlanContext';
import type { SlideEntry, AgendaSection, ValidationWarning } from '../../src/shared/types';

// =============================================================================
// Mock useVSCodeApi - required for Claude button postMessage
// =============================================================================

const mockPostMessage = vi.fn();
vi.mock('../../src/webview/plan/hooks/useVSCodeApi', () => ({
  useVSCodeApi: () => ({
    postMessage: mockPostMessage,
    postEditSlide: vi.fn(),
    onMessage: vi.fn(() => vi.fn()),
  }),
}));

// =============================================================================
// Test Helper - PlanProvider Wrapper
// =============================================================================

interface RenderOptions {
  slide: SlideEntry | null;
  sections: AgendaSection[];
  onEdit: (field: string, value: unknown) => void;
  onDelete?: (slideNumber: number) => void;
  onOpenClaude?: (slideNumber: number) => void;
  warnings?: ValidationWarning[];
}

/** Helper to render EditPanel wrapped in PlanProvider with optional warnings */
function renderEditPanel({
  slide,
  sections,
  onEdit,
  onDelete,
  onOpenClaude,
  warnings = [],
}: RenderOptions) {
  return render(
    <PlanProvider initialWarnings={warnings}>
      <EditPanel slide={slide} sections={sections} onEdit={onEdit} onDelete={onDelete} onOpenClaude={onOpenClaude} />
    </PlanProvider>
  );
}

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSlide: SlideEntry = {
  number: 3,
  description: 'Present the key benefits of our solution',
  suggested_template: 'content-slide',
  status: 'pending',
  storyline_role: 'evidence',
  agenda_section_id: 'benefits',
  key_points: ['Cost savings', 'Time efficiency', 'Quality improvement'],
  design_plan: 'Use icons for each benefit point',
  tone: 'Confident and persuasive',
};

const mockSections: AgendaSection[] = [
  { id: 'intro', title: 'Introduction', narrative_role: 'hook' },
  { id: 'benefits', title: 'Key Benefits', narrative_role: 'evidence' },
  { id: 'conclusion', title: 'Conclusion', narrative_role: 'cta' },
];

const slideWithEmptyFields: SlideEntry = {
  number: 1,
  description: '',
  suggested_template: 'title-slide',
  status: 'pending',
  storyline_role: 'hook',
  agenda_section_id: 'intro',
  key_points: [],
  design_plan: '',
  tone: '',
};

// =============================================================================
// Tests - Empty State (AC-20.1.1)
// =============================================================================

describe('EditPanel - Empty State', () => {
  it('displays placeholder when no slide is selected (AC-20.1.1)', () => {
    renderEditPanel({ slide: null, sections: mockSections, onEdit: vi.fn() });

    expect(screen.getByText('Select a slide to edit')).toBeDefined();
  });

  it('placeholder text is centered and muted', () => {
    renderEditPanel({ slide: null, sections: mockSections, onEdit: vi.fn() });

    const placeholder = screen.getByText('Select a slide to edit');
    expect(placeholder.className).toContain('text-center');
    expect(placeholder.className).toContain('text-[var(--fg-muted)]');
  });

  it('maintains ARIA attributes in empty state (AC-20.1.8)', () => {
    const { container } = renderEditPanel({ slide: null, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.getAttribute('role')).toBe('complementary');
    expect(aside?.getAttribute('aria-label')).toBe('Slide details');
  });
});

// =============================================================================
// Tests - Panel Appearance (AC-20.1.2, AC-20.1.3)
// =============================================================================

describe('EditPanel - Panel Appearance', () => {
  it('has 400px fixed width (AC-20.1.2)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-[400px]');
  });

  it('has flex-shrink-0 to prevent shrinking', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('flex-shrink-0');
  });

  it('renders panel header with slide number (AC-20.1.3)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const header = screen.getByRole('heading', { level: 2 });
    expect(header.textContent).toBe('Slide 3');
  });

  it('header has correct typography (14px, 600 weight)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const header = screen.getByRole('heading', { level: 2 });
    expect(header.className).toContain('text-[14px]');
    expect(header.className).toContain('font-semibold');
  });

  it('has card background and left border', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('bg-[var(--card)]');
    expect(aside?.className).toContain('border-l');
  });
});

// =============================================================================
// Tests - Form Fields (AC-20.1.4)
// =============================================================================

describe('EditPanel - Form Fields', () => {
  it('renders description as single-line input (AC-20.1.4)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const descriptionField = screen.getByLabelText(/description/i);
    expect(descriptionField.tagName.toLowerCase()).toBe('input');
    expect(descriptionField.getAttribute('type')).toBe('text');
  });

  it('renders tone text input (AC-20.1.4)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const toneField = screen.getByLabelText(/tone/i);
    expect(toneField.tagName.toLowerCase()).toBe('input');
    expect(toneField.getAttribute('type')).toBe('text');
  });

  it('renders design plan textarea (AC-20.1.4)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const designPlanField = screen.getByLabelText(/design plan/i);
    expect(designPlanField.tagName.toLowerCase()).toBe('textarea');
    expect(designPlanField.getAttribute('rows')).toBe('3');
  });

  it('renders section dropdown (AC-20.1.4)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    // Radix Select trigger has the aria-label
    const sectionTrigger = screen.getByRole('combobox', { name: /section/i });
    expect(sectionTrigger).toBeDefined();
  });

  it('populates fields with slide data', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    expect(screen.getByDisplayValue('Present the key benefits of our solution')).toBeDefined();
    expect(screen.getByDisplayValue('Confident and persuasive')).toBeDefined();
    expect(screen.getByDisplayValue('Use icons for each benefit point')).toBeDefined();
  });

  it('handles slides with empty fields gracefully', () => {
    renderEditPanel({ slide: slideWithEmptyFields, sections: mockSections, onEdit: vi.fn() });

    const descriptionField = screen.getByLabelText(/description/i) as HTMLInputElement;
    expect(descriptionField.value).toBe('');
  });
});

// =============================================================================
// Tests - Label Styling (AC-20.1.5)
// =============================================================================

describe('EditPanel - Label Styling', () => {
  it('labels have 12px font size and medium weight (AC-20.1.5)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const labels = container.querySelectorAll('label');
    labels.forEach((label) => {
      expect(label.className).toContain('text-[12px]');
      expect(label.className).toContain('font-medium');
    });
  });

  it('labels use --fg-secondary color (AC-20.1.5)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const labels = container.querySelectorAll('label');
    labels.forEach((label) => {
      expect(label.className).toContain('text-[var(--fg-secondary)]');
    });
  });

  it('labels have cursor-help for tooltip indication', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const labels = container.querySelectorAll('label');
    labels.forEach((label) => {
      expect(label.className).toContain('cursor-help');
    });
  });
});

// =============================================================================
// Tests - Required Field Indicator (AC-20.1.6)
// =============================================================================

describe('EditPanel - Required Field Indicator', () => {
  it('description field has red dot indicator (AC-20.1.6)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    // Find the Description label and check for the red dot
    const descriptionLabel = screen.getByText('Description');
    const redDot = descriptionLabel.parentElement?.querySelector('.bg-red-500');
    expect(redDot).toBeDefined();
    expect(redDot?.className).toContain('rounded-full');
  });

  it('key points field has red dot indicator', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const keyPointsLabel = screen.getByText('Key Points');
    const redDot = keyPointsLabel.parentElement?.querySelector('.bg-red-500');
    expect(redDot).toBeDefined();
    expect(redDot?.className).toContain('rounded-full');
  });

  it('non-required fields do not have red dot', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    // Tone label should not have red dot
    const toneLabel = screen.getByText('Tone');
    const redDot = toneLabel.parentElement?.querySelector('.bg-red-500');
    expect(redDot).toBeNull();
  });
});

// =============================================================================
// Tests - ARIA Accessibility (AC-20.1.8)
// =============================================================================

describe('EditPanel - ARIA Accessibility', () => {
  it('has role="complementary" (AC-20.1.8)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.getAttribute('role')).toBe('complementary');
  });

  it('has aria-label="Slide details" (AC-20.1.8)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.getAttribute('aria-label')).toBe('Slide details');
  });

  it('panel is focusable (AC-20.1.9)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.getAttribute('tabindex')).toBe('0');
  });
});

// =============================================================================
// Tests - Two-Way Sync (AC-20.1.7)
// =============================================================================

describe('EditPanel - Two-Way Sync', () => {
  it('calls onEdit on blur when value changed (AC-20.1.7)', async () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    const toneField = screen.getByLabelText(/tone/i) as HTMLInputElement;

    // Change the value
    fireEvent.change(toneField, { target: { value: 'Enthusiastic' } });

    // Blur the field
    fireEvent.blur(toneField);

    expect(onEdit).toHaveBeenCalledWith('tone', 'Enthusiastic');
  });

  it('does not call onEdit on blur if value unchanged', () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    const toneField = screen.getByLabelText(/tone/i);

    // Just blur without changing
    fireEvent.blur(toneField);

    expect(onEdit).not.toHaveBeenCalled();
  });

  it('calls onEdit on Enter key for text input (AC-20.1.7)', () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    const toneField = screen.getByLabelText(/tone/i);

    // Change value and press Enter
    fireEvent.change(toneField, { target: { value: 'Bold' } });
    fireEvent.keyDown(toneField, { key: 'Enter' });

    expect(onEdit).toHaveBeenCalledWith('tone', 'Bold');
  });

  it('calls onEdit for description field on blur', () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    const descriptionField = screen.getByLabelText(/description/i);

    fireEvent.change(descriptionField, { target: { value: 'New description text' } });
    fireEvent.blur(descriptionField);

    expect(onEdit).toHaveBeenCalledWith('description', 'New description text');
  });

  it('calls onEdit for design_plan field on blur', () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    const designPlanField = screen.getByLabelText(/design plan/i);

    fireEvent.change(designPlanField, { target: { value: 'New design plan' } });
    fireEvent.blur(designPlanField);

    expect(onEdit).toHaveBeenCalledWith('design_plan', 'New design plan');
  });
});

// =============================================================================
// Tests - Section Change (AC-20.1.10)
// =============================================================================

describe('EditPanel - Section Assignment', () => {
  it('displays current section in dropdown', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    // The trigger should show "Key Benefits" (the current section)
    expect(screen.getByText('Key Benefits')).toBeDefined();
  });

  it('calls onEdit with agenda_section_id when section changed (AC-20.1.10)', async () => {
    const onEdit = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit });

    // Open the dropdown
    const trigger = screen.getByRole('combobox', { name: /section/i });
    fireEvent.click(trigger);

    // Wait for dropdown content to appear and select a different section
    await waitFor(() => {
      const conclusionOption = screen.getByRole('option', { name: 'Conclusion' });
      fireEvent.click(conclusionOption);
    });

    expect(onEdit).toHaveBeenCalledWith('agenda_section_id', 'conclusion');
  });
});

// =============================================================================
// Tests - Responsive Behavior (AC-20.1.11, AC-20.1.12)
// =============================================================================

describe('EditPanel - Responsive Behavior', () => {
  it('has medium width breakpoint style (AC-20.1.11)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    // Check for the media query class
    expect(aside?.className).toContain('max-[1200px]:w-[340px]');
  });

  it('has narrow width hidden breakpoint (AC-20.1.12)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('max-[800px]:hidden');
  });
});

// =============================================================================
// Tests - State Updates
// =============================================================================

describe('EditPanel - State Updates', () => {
  it('updates fields when selected slide changes', () => {
    const { rerender } = render(
      <PlanProvider>
        <EditPanel slide={mockSlide} sections={mockSections} onEdit={vi.fn()} />
      </PlanProvider>
    );

    // Verify initial state
    expect(screen.getByDisplayValue('Confident and persuasive')).toBeDefined();

    // Change selected slide
    const newSlide: SlideEntry = {
      ...mockSlide,
      number: 5,
      tone: 'Friendly and approachable',
    };

    rerender(
      <PlanProvider>
        <EditPanel slide={newSlide} sections={mockSections} onEdit={vi.fn()} />
      </PlanProvider>
    );

    // Verify updated state
    expect(screen.getByDisplayValue('Friendly and approachable')).toBeDefined();
    expect(screen.getByText('Slide 5')).toBeDefined();
  });

  it('clears fields when slide becomes null', () => {
    const { rerender } = render(
      <PlanProvider>
        <EditPanel slide={mockSlide} sections={mockSections} onEdit={vi.fn()} />
      </PlanProvider>
    );

    // Initially has content
    expect(screen.getByDisplayValue('Confident and persuasive')).toBeDefined();

    // Set slide to null
    rerender(
      <PlanProvider>
        <EditPanel slide={null} sections={mockSections} onEdit={vi.fn()} />
      </PlanProvider>
    );

    // Should show empty state
    expect(screen.getByText('Select a slide to edit')).toBeDefined();
  });
});

// =============================================================================
// Tests - Inline Validation Warnings (AC-22.2.2, AC-22.2.3, AC-22.2.4)
// =============================================================================

describe('EditPanel - Inline Validation Warnings', () => {
  it('shows no inline warnings when slide has no warnings', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings: [] });

    // No warning alerts should be present
    expect(screen.queryAllByRole('alert').length).toBe(0);
  });

  it('shows inline warning below description field for missing intent (AC-22.2.3)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Should show the warning message (appears in both inline and summary sections)
    const warningTexts = screen.getAllByText('Slide intent is required');
    expect(warningTexts.length).toBeGreaterThanOrEqual(1);
    // Should show the resolution suggestion
    const suggestions = screen.getAllByText('Add an intent description for this slide');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('shows inline warning below template field for missing template (AC-22.2.4)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Template assignment is required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Warning appears in both inline and summary sections
    const warningTexts = screen.getAllByText('Template assignment is required');
    expect(warningTexts.length).toBeGreaterThanOrEqual(1);
    const suggestions = screen.getAllByText('Select a template from the template selector');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('shows inline warning below template field for low confidence (AC-22.2.2)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'low-confidence',
        message: 'Template confidence is low (best match below 50%)',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Warning appears in both inline and summary sections
    const warningTexts = screen.getAllByText('Template confidence is low (best match below 50%)');
    expect(warningTexts.length).toBeGreaterThanOrEqual(1);
    const suggestions = screen.getAllByText('Refine the slide intent to better match available templates');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('shows multiple inline warnings when slide has both missing intent and template warnings', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Template assignment is required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Warnings appear in both inline and summary sections
    const intentWarnings = screen.getAllByText('Slide intent is required');
    expect(intentWarnings.length).toBeGreaterThanOrEqual(1);
    const templateWarnings = screen.getAllByText('Template assignment is required');
    expect(templateWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('inline warnings use amber text color', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Find alert element with amber color
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.className).toContain('text-[#f59e0b]');
  });

  it('inline warnings have role="alert" for accessibility', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('does not show warnings for other slides', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 5, // Different slide
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Should not show warning for slide 5 when viewing slide 3
    expect(screen.queryByText('Slide intent is required')).not.toBeInTheDocument();
  });

  it('does not show deck-level warnings in EditPanel (AC-22.2.5)', () => {
    const warnings: ValidationWarning[] = [
      {
        type: 'missing-cta', // Deck-level warning (no slideNumber)
        message: 'No CTA slide exists in this deck',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Deck-level warnings should NOT appear in EditPanel
    expect(screen.queryByText('No CTA slide exists in this deck')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests - General Validation Section (AC-22.2.5)
// =============================================================================

describe('EditPanel - General Validation Section', () => {
  it('shows ValidationSection with header when warnings exist (AC-22.2.5)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'empty-description',
        message: 'Slide 3: Description is empty',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Should have "Warnings" header
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    // ValidationSection should display the warning
    expect(screen.getByText('Slide 3: Description is empty')).toBeInTheDocument();
  });

  it('hides ValidationSection when no warnings exist', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings: [] });

    // Should not have "Warnings" header
    expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
  });

  it('shows multiple warnings in ValidationSection', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'empty-description',
        message: 'Slide 3: Description is empty',
        severity: 'warning',
      },
      {
        slideNumber: 3,
        type: 'empty-key-points',
        message: 'Slide 3: Key points are required',
        severity: 'warning',
      },
    ];

    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    expect(screen.getByText('Slide 3: Description is empty')).toBeInTheDocument();
    expect(screen.getByText('Slide 3: Key points are required')).toBeInTheDocument();
  });

  it('ValidationSection has border separator from form fields', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 3,
        type: 'empty-description',
        message: 'Slide 3: Description is empty',
        severity: 'warning',
      },
    ];

    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), warnings });

    // Find the Warnings section container
    const warningsHeader = screen.getByText('Warnings');
    const warningsContainer = warningsHeader.parentElement;
    expect(warningsContainer?.className).toContain('border-t');
  });
});

// =============================================================================
// Tests - Edit with Claude Button in Header (Story 1.2 - Reposition)
// =============================================================================

describe('EditPanel - Claude Button in Header', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it('renders Sparkles button in header when slide is selected (AC #1)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), onDelete: vi.fn() });

    const claudeButton = screen.getByRole('button', { name: 'Edit slide with Claude' });
    expect(claudeButton).toBeInTheDocument();
    // Button should contain an SVG (Sparkles icon)
    const svg = claudeButton.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('Claude button is not rendered in empty state', () => {
    renderEditPanel({ slide: null, sections: mockSections, onEdit: vi.fn() });

    expect(screen.queryByRole('button', { name: 'Edit slide with Claude' })).not.toBeInTheDocument();
  });

  it('no Claude button exists at bottom of form (AC #2)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), onDelete: vi.fn() });

    // The old button was in a div with border-t classes after form fields
    // Query for any button with "Claude" text at the bottom — should not exist
    const formArea = container.querySelector('.flex.flex-col.gap-6.p-6');
    if (formArea) {
      const buttonsInForm = within(formArea as HTMLElement).queryAllByRole('button');
      const claudeButtonInForm = buttonsInForm.find(
        (btn) => btn.getAttribute('aria-label')?.includes('Claude')
      );
      expect(claudeButtonInForm).toBeUndefined();
    }
  });

  it('clicking header Sparkles button calls onOpenClaude with slide number (AC #3)', () => {
    const onOpenClaude = vi.fn();
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), onOpenClaude });

    const claudeButton = screen.getByRole('button', { name: 'Edit slide with Claude' });
    fireEvent.click(claudeButton);

    expect(onOpenClaude).toHaveBeenCalledWith(3);
  });

  it('button has correct aria-label "Edit slide with Claude" (AC #5)', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const claudeButton = screen.getByRole('button', { name: 'Edit slide with Claude' });
    expect(claudeButton.getAttribute('aria-label')).toBe('Edit slide with Claude');
  });

  it('header layout order: Slide N text, then Sparkles, then Trash2 (AC #6)', () => {
    const { container } = renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn(), onDelete: vi.fn() });

    const header = container.querySelector('header');
    expect(header).toBeTruthy();

    // The right-side button group should contain both buttons in order
    const buttonGroup = header!.querySelector('.flex.items-center.gap-1\\.5');
    expect(buttonGroup).toBeTruthy();

    const buttons = buttonGroup!.querySelectorAll('button');
    expect(buttons.length).toBe(2);

    // First button: Sparkles (Claude)
    expect(buttons[0].getAttribute('aria-label')).toBe('Edit slide with Claude');
    // Second button: Trash2 (Delete)
    expect(buttons[1].getAttribute('aria-label')).toBe('Delete slide 3');
  });

  it('Claude button has primary-color hover styling', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const claudeButton = screen.getByRole('button', { name: 'Edit slide with Claude' });
    expect(claudeButton.className).toContain('hover:text-[var(--primary)]');
    expect(claudeButton.className).toContain('hover:bg-[var(--primary-light)]');
  });

  it('Claude button has focus-visible ring styling', () => {
    renderEditPanel({ slide: mockSlide, sections: mockSections, onEdit: vi.fn() });

    const claudeButton = screen.getByRole('button', { name: 'Edit slide with Claude' });
    expect(claudeButton.className).toContain('focus-visible:ring-2');
    expect(claudeButton.className).toContain('focus-visible:ring-[var(--primary)]');
  });
});
