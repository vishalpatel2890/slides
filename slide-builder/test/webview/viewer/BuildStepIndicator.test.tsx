/**
 * Tests for BuildStepIndicator component.
 * v2-2-3 AC-2,4,9,10: Build step indicator with "Build: N / Total" format and dots
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BuildStepIndicator } from '../../../src/webview/viewer/components/BuildStepIndicator';

describe('BuildStepIndicator', () => {
  describe('visibility (AC-9)', () => {
    it('renders when visible=true and totalGroups > 0', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not render when visible=false', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={false}
        />
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('does not render when totalGroups=0', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={0}
          totalGroups={0}
          visible={true}
        />
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('display format (AC-2,4)', () => {
    it('displays "Build: 0 / N" when at step 0', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={0}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 0 \/ 3/)).toBeInTheDocument();
    });

    it('displays "Build: 1 / N" after first reveal (AC-4)', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 1 \/ 3/)).toBeInTheDocument();
    });

    it('displays "Build: N / N" when fully revealed', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={3}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 3 \/ 3/)).toBeInTheDocument();
    });
  });

  describe('step dots (AC-10)', () => {
    it('renders correct number of dots', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={4}
          visible={true}
        />
      );

      const dots = screen.getAllByRole('img');
      expect(dots).toHaveLength(4);
    });

    it('marks dots as filled for revealed groups (i < currentBuildStep)', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={2}
          totalGroups={4}
          visible={true}
        />
      );

      const dots = screen.getAllByRole('img');
      // First 2 dots should be filled (revealed)
      expect(dots[0]).toHaveAttribute('aria-label', 'revealed');
      expect(dots[1]).toHaveAttribute('aria-label', 'revealed');
      // Last 2 dots should be pending
      expect(dots[2]).toHaveAttribute('aria-label', 'pending');
      expect(dots[3]).toHaveAttribute('aria-label', 'pending');
    });

    it('all dots are pending when at step 0', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={0}
          totalGroups={3}
          visible={true}
        />
      );

      const dots = screen.getAllByRole('img');
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('aria-label', 'pending');
      });
    });

    it('all dots are filled when fully revealed', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={3}
          totalGroups={3}
          visible={true}
        />
      );

      const dots = screen.getAllByRole('img');
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('aria-label', 'revealed');
      });
    });
  });

  describe('variants', () => {
    it('renders status-bar variant with correct class', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
          variant="status-bar"
        />
      );

      expect(screen.getByRole('status')).toHaveClass('build-step-indicator');
    });

    it('renders fullscreen variant with correct class', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
          variant="fullscreen"
        />
      );

      expect(screen.getByRole('status')).toHaveClass('fullscreen-controls__build-indicator');
    });
  });

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for announcements', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label', () => {
      render(
        <BuildStepIndicator
          currentBuildStep={2}
          totalGroups={5}
          visible={true}
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Build step 2 of 5'
      );
    });
  });

  describe('prop updates', () => {
    it('updates display when currentBuildStep changes', () => {
      const { rerender } = render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 1 \/ 3/)).toBeInTheDocument();

      rerender(
        <BuildStepIndicator
          currentBuildStep={2}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 2 \/ 3/)).toBeInTheDocument();
    });

    it('updates display when totalGroups changes', () => {
      const { rerender } = render(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={3}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 1 \/ 3/)).toBeInTheDocument();

      rerender(
        <BuildStepIndicator
          currentBuildStep={1}
          totalGroups={5}
          visible={true}
        />
      );

      expect(screen.getByText(/Build: 1 \/ 5/)).toBeInTheDocument();
    });
  });
});
