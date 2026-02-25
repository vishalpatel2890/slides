/**
 * ValidationSection Tests
 *
 * Story Reference: 22-2 Task 1.6 - Write tests for ValidationSection
 * AC-22.2.1: Validation section renders warnings with icon, type, message, resolution
 * AC-22.2.6: Resolution suggestions are actionable for each warning type
 * AC-22.2.7: Amber styling tokens applied correctly
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationSection } from '../../src/webview/plan/components/ValidationSection';
import type { ValidationWarning } from '../../src/shared/types';

describe('ValidationSection', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  it('renders nothing when warnings array is empty', () => {
    const { container } = render(<ValidationSection warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a warning with icon, type label, message, and resolution', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);

    // Type label
    expect(screen.getByText('Missing Field')).toBeInTheDocument();
    // Message
    expect(screen.getByText('Slide intent is required')).toBeInTheDocument();
    // Resolution suggestion
    expect(screen.getByText('Add an intent description for this slide')).toBeInTheDocument();
  });

  it('renders multiple warnings', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
      {
        slideNumber: 1,
        type: 'low-confidence',
        message: 'Template confidence is low',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);

    expect(screen.getByText('Missing Field')).toBeInTheDocument();
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('Slide intent is required')).toBeInTheDocument();
    expect(screen.getByText('Template confidence is low')).toBeInTheDocument();
  });

  // ==========================================================================
  // Resolution Suggestions (AC-22.2.6)
  // ==========================================================================

  it('shows correct resolution for missing-field (intent)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Add an intent description for this slide')).toBeInTheDocument();
  });

  it('shows correct resolution for missing-field (template)', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Template assignment is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Select a template from the template selector')).toBeInTheDocument();
  });

  it('shows correct resolution for low-confidence', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'low-confidence',
        message: 'Template confidence is low',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Refine the slide intent to better match available templates')).toBeInTheDocument();
  });

  it('shows correct resolution for empty-section', () => {
    const warnings: ValidationWarning[] = [
      {
        sectionId: 'section-1',
        type: 'empty-section',
        message: 'Section "Introduction" has no slides',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Add slides to this section or remove it')).toBeInTheDocument();
  });

  it('shows correct resolution for missing-cta', () => {
    const warnings: ValidationWarning[] = [
      {
        type: 'missing-cta',
        message: 'No CTA slide exists in this deck',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Assign a CTA storyline role to at least one slide')).toBeInTheDocument();
  });

  it('shows correct resolution for empty-description', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'empty-description',
        message: 'Slide 1: Description is empty',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Add a description for this slide')).toBeInTheDocument();
  });

  it('shows correct resolution for empty-key-points', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'empty-key-points',
        message: 'Slide 1: Key points are required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByText('Add at least one key point for this slide')).toBeInTheDocument();
  });

  // ==========================================================================
  // Amber Styling (AC-22.2.7)
  // ==========================================================================

  it('applies amber styling classes', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    const { container } = render(<ValidationSection warnings={warnings} />);
    const warningDiv = container.querySelector('.bg-\\[\\#fffbeb\\]');

    expect(warningDiv).toBeInTheDocument();
    expect(warningDiv).toHaveClass('border-[#fde68a]');
  });

  it('applies amber text color to type label', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    const typeLabel = screen.getByText('Missing Field');
    expect(typeLabel).toHaveClass('text-[#f59e0b]');
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  it('has role="alert" for screen reader announcements', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="polite" for dynamic updates', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    render(<ValidationSection warnings={warnings} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('hides AlertTriangle icon from screen readers', () => {
    const warnings: ValidationWarning[] = [
      {
        slideNumber: 1,
        type: 'missing-field',
        message: 'Slide intent is required',
        severity: 'warning',
      },
    ];

    const { container } = render(<ValidationSection warnings={warnings} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  // ==========================================================================
  // Warning Type Labels
  // ==========================================================================

  it('displays correct labels for all warning types', () => {
    const warningTypes: Array<{ type: ValidationWarning['type']; label: string }> = [
      { type: 'missing-field', label: 'Missing Field' },
      { type: 'low-confidence', label: 'Low Confidence' },
      { type: 'empty-section', label: 'Empty Section' },
      { type: 'missing-cta', label: 'Missing CTA' },
      { type: 'empty-description', label: 'Empty Description' },
      { type: 'multiline-description', label: 'Multiline Description' },
      { type: 'empty-key-points', label: 'Missing Key Points' },
    ];

    warningTypes.forEach(({ type, label }) => {
      const warnings: ValidationWarning[] = [
        { slideNumber: 1, type, message: 'Test message', severity: 'warning' },
      ];

      const { unmount } = render(<ValidationSection warnings={warnings} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });
});
