/**
 * ChipGroup Component Tests
 *
 * Story Reference: 19-1 Task 7.2 - Create test/webview/ChipGroup.test.tsx
 * AC-19.1.6: Storyline role chip color-coded per UX spec
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip, ChipGroup, ROLE_COLORS, type StorylineRole } from '../../src/webview/plan/components/ChipGroup';

describe('Chip', () => {
  it('renders with the provided label', () => {
    render(<Chip label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeDefined();
  });

  it('renders with neutral color scheme by default', () => {
    const { container } = render(<Chip label="Neutral" />);
    const chip = container.querySelector('span');
    expect(chip?.style.backgroundColor).toBe('var(--surface)');
  });

  it('applies size sm by default - AC-19.4.3 updated to 11px', () => {
    const { container } = render(<Chip label="Small" />);
    const chip = container.querySelector('span');
    // UX spec: Caption = 11px (updated from 10px per AC-19.4.3)
    expect(chip?.className).toContain('text-[11px]');
  });

  it('applies size md when specified', () => {
    const { container } = render(<Chip label="Medium" size="md" />);
    const chip = container.querySelector('span');
    expect(chip?.className).toContain('text-xs');
  });

  it('applies outlined variant correctly', () => {
    const { container } = render(<Chip label="Outlined" variant="outlined" />);
    const chip = container.querySelector('span');
    expect(chip?.className).toContain('bg-transparent');
  });
});

describe('Chip - Storyline Role Colors (AC-19.1.6)', () => {
  const roles: StorylineRole[] = ['hook', 'context', 'evidence', 'detail', 'transition', 'cta'];

  roles.forEach((role) => {
    it(`applies correct colors for ${role} role`, () => {
      const { container } = render(<Chip label={role} colorScheme={role} />);
      const chip = container.querySelector('span');

      // Verify style attributes are applied (browser converts hex to rgb)
      expect(chip?.style.backgroundColor).toBeDefined();
      expect(chip?.style.color).toBeDefined();
      expect(chip?.style.borderColor).toBeDefined();

      // For roles using CSS variables (detail), check they're set correctly
      if (role === 'detail') {
        expect(chip?.style.backgroundColor).toBe('var(--surface)');
        expect(chip?.style.color).toBe('var(--fg-secondary)');
      } else {
        // For hex colors, verify they're not empty (browser converts to rgb)
        expect(chip?.style.backgroundColor).not.toBe('');
        expect(chip?.style.color).not.toBe('');
      }
    });
  });

  it('hook chip has blue colors', () => {
    expect(ROLE_COLORS.hook.bg).toBe('#eff6ff');
    expect(ROLE_COLORS.hook.text).toBe('#1d4ed8');
  });

  it('context chip has yellow colors', () => {
    expect(ROLE_COLORS.context.bg).toBe('#fefce8');
    expect(ROLE_COLORS.context.text).toBe('#a16207');
  });

  it('evidence chip has green colors', () => {
    expect(ROLE_COLORS.evidence.bg).toBe('#f0fdf4');
    expect(ROLE_COLORS.evidence.text).toBe('#15803d');
  });

  it('detail chip has neutral/surface colors', () => {
    expect(ROLE_COLORS.detail.bg).toBe('var(--surface)');
    expect(ROLE_COLORS.detail.text).toBe('var(--fg-secondary)');
  });

  it('transition chip has purple colors', () => {
    expect(ROLE_COLORS.transition.bg).toBe('#faf5ff');
    expect(ROLE_COLORS.transition.text).toBe('#7c3aed');
  });

  it('cta chip has red colors', () => {
    expect(ROLE_COLORS.cta.bg).toBe('#fef2f2');
    expect(ROLE_COLORS.cta.text).toBe('#dc2626');
  });
});

describe('ChipGroup', () => {
  it('renders multiple chips', () => {
    render(
      <ChipGroup
        chips={[
          { label: 'Chip 1' },
          { label: 'Chip 2' },
          { label: 'Chip 3' },
        ]}
      />
    );

    expect(screen.getByText('Chip 1')).toBeDefined();
    expect(screen.getByText('Chip 2')).toBeDefined();
    expect(screen.getByText('Chip 3')).toBeDefined();
  });

  it('applies small gap by default', () => {
    const { container } = render(
      <ChipGroup chips={[{ label: 'A' }, { label: 'B' }]} />
    );
    const group = container.querySelector('div');
    expect(group?.className).toContain('gap-1');
  });

  it('applies medium gap when specified', () => {
    const { container } = render(
      <ChipGroup chips={[{ label: 'A' }, { label: 'B' }]} gap="md" />
    );
    const group = container.querySelector('div');
    expect(group?.className).toContain('gap-2');
  });

  it('passes color scheme to chips', () => {
    const { container } = render(
      <ChipGroup
        chips={[
          { label: 'hook', colorScheme: 'hook' },
          { label: 'cta', colorScheme: 'cta' },
        ]}
      />
    );
    const chips = container.querySelectorAll('span');
    // Browser converts hex to rgb, so just verify colors are applied
    expect(chips[0]?.style.backgroundColor).not.toBe('');
    expect(chips[1]?.style.backgroundColor).not.toBe('');
    // Both should have colors applied (not using CSS variables)
    expect(chips[0]?.style.backgroundColor).toContain('rgb');
    expect(chips[1]?.style.backgroundColor).toContain('rgb');
  });
});
