/**
 * SlideManagement Integration Tests - Add/Delete Flows
 *
 * Story Reference: 21-1 - Add/Delete Slide Management
 * Tests for the complete add slide and delete slide user flows
 *
 * AC-21.1.1: Add slide button calls postMessage with add-slide type
 * AC-21.1.5: Delete button opens confirmation dialog
 * AC-21.1.6: Confirm delete fires postMessage with delete-slide type
 * AC-21.1.9: Post-delete selection adjustment
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditPanel } from '../../src/webview/plan/components/EditPanel';
import { SlideGrid } from '../../src/webview/plan/components/SlideGrid';
import { PlanProvider, usePlan } from '../../src/webview/plan/context/PlanContext';
import type { SlideEntry, AgendaSection, PlanData } from '../../src/shared/types';

// =============================================================================
// Mock useVSCodeApi - follows pattern from existing tests
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
// Test Fixtures
// =============================================================================

const mockSections: AgendaSection[] = [
  { id: 'intro', title: 'Introduction', narrative_role: 'opening' },
  { id: 'body', title: 'Main Content', narrative_role: 'evidence' },
];

const mockSlide: SlideEntry = {
  number: 2,
  description: 'Present the key benefits of our solution',
  suggested_template: 'content-slide',
  status: 'pending',
  storyline_role: 'evidence',
  agenda_section_id: 'body',
  key_points: ['Cost savings', 'Time efficiency'],
  design_plan: 'Use icons for each benefit',
  tone: 'Confident',
};

const mockPlan: PlanData = {
  deck_name: 'Test Deck',
  created: '2026-02-15',
  last_modified: '2026-02-15',
  audience: {
    description: 'Test audience',
    knowledge_level: 'intermediate',
    priorities: ['clarity'],
  },
  purpose: 'Testing',
  desired_outcome: 'Tests pass',
  key_message: 'Test message',
  storyline: {
    opening_hook: 'Hook',
    tension: 'Tension',
    resolution: 'Resolution',
    call_to_action: 'Action',
  },
  recurring_themes: ['testing'],
  agenda_sections: mockSections,
  slides: [
    {
      number: 1,
      description: 'Introduction slide',
      suggested_template: 'title-slide',
      status: 'pending',
      storyline_role: 'hook',
      agenda_section_id: 'intro',
      key_points: ['Welcome'],
      tone: 'Engaging',
    },
    mockSlide,
  ],
};

// =============================================================================
// Helper: PlanProvider wrapper that dispatches initial plan state
// =============================================================================

function PlanProviderWithData({
  children,
  plan,
}: {
  children: React.ReactNode;
  plan: PlanData;
}): React.ReactElement {
  return (
    <PlanProvider>
      <PlanInitializer plan={plan} />
      {children}
    </PlanProvider>
  );
}

/**
 * Helper component that dispatches SET_PLAN on mount.
 * This populates the context so SlideGrid renders actual slides.
 */
function PlanInitializer({ plan }: { plan: PlanData }): null {
  const { dispatch } = usePlan();
  React.useEffect(() => {
    dispatch({ type: 'SET_PLAN', plan, validationWarnings: [] });
  }, [dispatch, plan]);
  return null;
}

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Tests - Add Slide Flow (AC-21.1.1, AC-21.1.2)
// =============================================================================

describe('SlideManagement - Add Slide', () => {
  it('Add slide button calls postMessage with add-slide type (AC-21.1.1)', async () => {
    render(
      <PlanProviderWithData plan={mockPlan}>
        <SlideGrid />
      </PlanProviderWithData>
    );

    // Wait for the plan to be loaded and slides to render
    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
    });

    // Find and click an "Add slide" button (rendered after each section's slides)
    const addButtons = screen.getAllByText('Add slide');
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'add-slide',
      })
    );
  });

  it('Add slide message includes afterSlideNumber and sectionId', async () => {
    render(
      <PlanProviderWithData plan={mockPlan}>
        <SlideGrid />
      </PlanProviderWithData>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
    });

    const addButtons = screen.getAllByText('Add slide');
    fireEvent.click(addButtons[0]);

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'add-slide',
        afterSlideNumber: expect.any(Number),
        sectionId: expect.any(String),
      })
    );
  });
});

// =============================================================================
// Helper: Render EditPanel with PlanProvider wrapper
// =============================================================================

function renderEditPanel(props: {
  slide: SlideEntry;
  sections: AgendaSection[];
  onEdit: (field: string, value: unknown) => void;
  onDelete?: (slideNumber: number) => void;
}) {
  return render(
    <PlanProvider>
      <EditPanel {...props} />
    </PlanProvider>
  );
}

// =============================================================================
// Tests - Delete Slide Flow (AC-21.1.5, AC-21.1.6, AC-21.1.9)
// =============================================================================

describe('SlideManagement - Delete Slide', () => {
  it('Delete button on EditPanel opens confirmation dialog (AC-21.1.5)', () => {
    const onDelete = vi.fn();
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
      onDelete,
    });

    // Find the delete button (trash icon) in the header
    const deleteButton = screen.getByRole('button', {
      name: /delete slide 2/i,
    });
    fireEvent.click(deleteButton);

    // Confirmation dialog should appear
    expect(screen.getByText('Delete slide 2?')).toBeDefined();
    expect(
      screen.getByText('Present the key benefits of our solution')
    ).toBeDefined();
  });

  it('Confirming delete dialog fires onDelete callback with slide number (AC-21.1.6)', () => {
    const onDelete = vi.fn();
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
      onDelete,
    });

    // Open the dialog
    const deleteButton = screen.getByRole('button', {
      name: /delete slide 2/i,
    });
    fireEvent.click(deleteButton);

    // Click the confirm "Delete" button in the dialog
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it('Cancelling delete dialog does not fire onDelete', () => {
    const onDelete = vi.fn();
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
      onDelete,
    });

    // Open the dialog
    fireEvent.click(
      screen.getByRole('button', { name: /delete slide 2/i })
    );

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('Delete dialog closes after confirmation', () => {
    const onDelete = vi.fn();
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
      onDelete,
    });

    // Open and confirm
    fireEvent.click(
      screen.getByRole('button', { name: /delete slide 2/i })
    );
    fireEvent.click(screen.getByText('Delete'));

    // Dialog should be closed (no dialog title visible)
    expect(screen.queryByText('Delete slide 2?')).toBeNull();
  });

  it('Delete dialog closes after cancellation', () => {
    const onDelete = vi.fn();
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
      onDelete,
    });

    // Open and cancel
    fireEvent.click(
      screen.getByRole('button', { name: /delete slide 2/i })
    );
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be closed
    expect(screen.queryByText('Delete slide 2?')).toBeNull();
  });

  it('Delete button is not rendered when onDelete prop is not provided', () => {
    renderEditPanel({
      slide: mockSlide,
      sections: mockSections,
      onEdit: vi.fn(),
    });

    expect(
      screen.queryByRole('button', { name: /delete slide/i })
    ).toBeNull();
  });
});
