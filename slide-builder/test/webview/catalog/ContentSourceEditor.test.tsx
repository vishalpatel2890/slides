/**
 * Tests for ContentSourceEditor component.
 * Story Reference: v4-1-6 AC-1, AC-2, AC-3, AC-4, AC-5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ContentSourceEditor } from '../../../src/webview/catalog/components/ContentSourceEditor';
import type { ContentSource } from '../../../src/shared/types';

const mockSources: ContentSource[] = [
  { type: 'web_search', query: '{client_name} overview' },
  { type: 'file', path: 'data/overview.md' },
  { type: 'user_input', field: 'company_name', fallback: 'Ask user' },
];

describe('ContentSourceEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderEditor(sources: ContentSource[] = mockSources, readOnly = false) {
    return render(
      <ContentSourceEditor
        sources={sources}
        onChange={mockOnChange}
        readOnly={readOnly}
      />,
    );
  }

  describe('Rendering (AC-1)', () => {
    it('renders source count', () => {
      renderEditor();
      expect(screen.getByText('Content Sources (3)')).toBeDefined();
    });

    it('renders all sources', () => {
      renderEditor();
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(3);
    });

    it('renders empty state when no sources', () => {
      renderEditor([]);
      expect(screen.getByText('No content sources defined')).toBeDefined();
    });

    it('has accessible region label', () => {
      renderEditor();
      expect(screen.getByRole('region', { name: 'Content sources' })).toBeDefined();
    });
  });

  describe('Add source (AC-2)', () => {
    it('clicking Add creates a new user_input source', () => {
      renderEditor();
      const addBtn = screen.getByLabelText('Add content source');
      fireEvent.click(addBtn);

      expect(mockOnChange).toHaveBeenCalledWith([
        ...mockSources,
        { type: 'user_input' },
      ]);
    });

    it('Add button is hidden in read-only mode', () => {
      renderEditor(mockSources, true);
      expect(screen.queryByLabelText('Add content source')).toBeNull();
    });
  });

  describe('Edit source properties (AC-3)', () => {
    it('shows type-specific fields for web_search', () => {
      renderEditor([{ type: 'web_search', query: 'test query' }]);
      expect(screen.getByLabelText('Search Query')).toBeDefined();
    });

    it('shows type-specific fields for file', () => {
      renderEditor([{ type: 'file', path: 'data.md' }]);
      expect(screen.getByLabelText('File Path')).toBeDefined();
    });

    it('shows type-specific fields for mcp_tool', () => {
      renderEditor([{ type: 'mcp_tool', tool: 'fetch' }]);
      expect(screen.getByLabelText('Tool Name')).toBeDefined();
    });

    it('shows type-specific fields for user_input', () => {
      renderEditor([{ type: 'user_input', field: 'name', fallback: 'Ask' }]);
      expect(screen.getByLabelText('Field Name')).toBeDefined();
      expect(screen.getByLabelText('Fallback Instructions')).toBeDefined();
    });

    it('changing type updates the source', () => {
      renderEditor([{ type: 'web_search', query: 'test' }]);
      const select = screen.getByLabelText('Source 1 type');
      fireEvent.change(select, { target: { value: 'file' } });

      expect(mockOnChange).toHaveBeenCalledWith([{ type: 'file' }]);
    });

    it('changing field value updates the source', () => {
      renderEditor([{ type: 'web_search', query: 'old query' }]);
      const input = screen.getByLabelText('Search Query');
      fireEvent.change(input, { target: { value: 'new query' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        { type: 'web_search', query: 'new query' },
      ]);
    });
  });

  describe('Delete source (AC-4)', () => {
    it('clicking delete removes the source', () => {
      renderEditor();
      const deleteBtn = screen.getByLabelText('Delete source 2');
      fireEvent.click(deleteBtn);

      expect(mockOnChange).toHaveBeenCalledWith([
        mockSources[0],
        mockSources[2],
      ]);
    });

    it('delete buttons are hidden in read-only mode', () => {
      renderEditor(mockSources, true);
      expect(screen.queryByLabelText(/Delete source/)).toBeNull();
    });
  });

  describe('Read-only mode', () => {
    it('disables all inputs in read-only mode', () => {
      renderEditor([{ type: 'web_search', query: 'test' }], true);
      const input = screen.getByLabelText('Search Query') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('disables type selects in read-only mode', () => {
      renderEditor([{ type: 'web_search' }], true);
      const select = screen.getByLabelText('Source 1 type') as HTMLSelectElement;
      expect(select.disabled).toBe(true);
    });
  });
});
