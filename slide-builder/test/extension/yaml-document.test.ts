import { describe, it, expect } from 'vitest';
import {
  parseYaml,
  serializeYaml,
  getField,
  setField,
  hasField,
  deleteField,
  insertSlide,
  deleteSlide,
  renumberSlides,
  moveSlide,
} from '../../src/extension/yaml-document';

describe('yaml-document', () => {
  describe('parseYaml', () => {
    it('should parse valid YAML into a Document', () => {
      const yaml = `slides:
  - id: slide-1
    title: Introduction`;

      const doc = parseYaml(yaml);
      expect(doc).toBeDefined();
      expect(doc.getIn(['slides', 0, 'id'])).toBe('slide-1');
    });

    it('should preserve comments through parse cycle (AC-18.2.5)', () => {
      const yamlWithComments = `# This is a plan file
slides:
  # First slide
  - id: slide-1
    title: Introduction  # Title comment
`;

      const doc = parseYaml(yamlWithComments);
      const output = serializeYaml(doc);

      expect(output).toContain('# This is a plan file');
      expect(output).toContain('# First slide');
      expect(output).toContain('# Title comment');
    });

    it('should handle empty YAML', () => {
      const doc = parseYaml('');
      expect(doc).toBeDefined();
    });

    it('should handle YAML with only comments', () => {
      const doc = parseYaml('# Just a comment');
      const output = serializeYaml(doc);
      expect(output).toContain('# Just a comment');
    });
  });

  describe('serializeYaml', () => {
    it('should serialize Document back to YAML string (AC-18.2.6)', () => {
      const yaml = `slides:
  - id: slide-1
    title: Test
`;

      const doc = parseYaml(yaml);
      const output = serializeYaml(doc);

      expect(output).toContain('slides:');
      expect(output).toContain('id: slide-1');
      expect(output).toContain('title: Test');
    });

    it('should preserve formatting after modification (AC-18.2.6)', () => {
      const yamlWithComments = `# Plan file
slides:
  # Intro slide
  - id: slide-1
    title: Introduction
`;

      const doc = parseYaml(yamlWithComments);
      setField(doc, ['slides', 0, 'title'], 'Updated Title');
      const output = serializeYaml(doc);

      // Comments should still be present
      expect(output).toContain('# Plan file');
      expect(output).toContain('# Intro slide');
      // Value should be updated
      expect(output).toContain('title: Updated Title');
      expect(output).not.toContain('title: Introduction');
    });

    it('should output identical content for unmodified document', () => {
      const yaml = `slides:
  - id: slide-1
`;

      const doc = parseYaml(yaml);
      const output = serializeYaml(doc);

      expect(output.trim()).toBe(yaml.trim());
    });
  });

  describe('getField', () => {
    it('should retrieve values at simple paths (AC-18.2.7)', () => {
      const yaml = `title: My Deck
slides:
  - id: slide-1
`;

      const doc = parseYaml(yaml);
      expect(getField(doc, ['title'])).toBe('My Deck');
    });

    it('should retrieve values at nested paths', () => {
      const yaml = `slides:
  - id: slide-1
    content:
      heading: Hello
      body: World
`;

      const doc = parseYaml(yaml);
      expect(getField(doc, ['slides', 0, 'id'])).toBe('slide-1');
      expect(getField(doc, ['slides', 0, 'content', 'heading'])).toBe('Hello');
    });

    it('should return undefined for non-existent paths', () => {
      const doc = parseYaml('slides: []');
      expect(getField(doc, ['nonexistent'])).toBeUndefined();
      expect(getField(doc, ['slides', 999])).toBeUndefined();
    });
  });

  describe('setField', () => {
    it('should modify values at specified paths (AC-18.2.7)', () => {
      const yaml = `slides:
  - id: slide-1
    title: Original
`;

      const doc = parseYaml(yaml);
      setField(doc, ['slides', 0, 'title'], 'Updated');

      expect(getField(doc, ['slides', 0, 'title'])).toBe('Updated');
    });

    it('should not affect sibling values when modifying', () => {
      const yaml = `slides:
  - id: slide-1
    title: Title 1
  - id: slide-2
    title: Title 2
`;

      const doc = parseYaml(yaml);
      setField(doc, ['slides', 0, 'title'], 'Updated Title 1');

      expect(getField(doc, ['slides', 0, 'title'])).toBe('Updated Title 1');
      expect(getField(doc, ['slides', 1, 'title'])).toBe('Title 2');
      expect(getField(doc, ['slides', 0, 'id'])).toBe('slide-1');
    });

    it('should create path if it does not exist', () => {
      const doc = parseYaml('slides: []');
      setField(doc, ['metadata', 'author'], 'Test Author');

      expect(getField(doc, ['metadata', 'author'])).toBe('Test Author');
    });
  });

  describe('hasField', () => {
    it('should return true for existing paths', () => {
      const yaml = `slides:
  - id: slide-1
`;

      const doc = parseYaml(yaml);
      expect(hasField(doc, ['slides'])).toBe(true);
      expect(hasField(doc, ['slides', 0])).toBe(true);
      expect(hasField(doc, ['slides', 0, 'id'])).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      const doc = parseYaml('slides: []');
      expect(hasField(doc, ['nonexistent'])).toBe(false);
    });
  });

  describe('deleteField', () => {
    it('should delete values at specified paths', () => {
      const yaml = `slides:
  - id: slide-1
    title: To Delete
`;

      const doc = parseYaml(yaml);
      const result = deleteField(doc, ['slides', 0, 'title']);

      expect(result).toBe(true);
      expect(hasField(doc, ['slides', 0, 'title'])).toBe(false);
      expect(hasField(doc, ['slides', 0, 'id'])).toBe(true);
    });

    it('should return false when deleting non-existent path', () => {
      const doc = parseYaml('slides: []');
      const result = deleteField(doc, ['nonexistent']);

      expect(result).toBe(false);
    });
  });

  describe('comment preservation (AC-18.4.2)', () => {
    it('should preserve multi-line string values with comments (Task 2.4)', () => {
      const yamlWithMultiline = `# Plan file with multi-line content
slides:
  - number: 1
    # Intent description
    intent: |
      This is a multi-line
      intent description
      spanning several lines
    # Key points comment
    key_points:
      - First point  # inline
      - Second point
`;

      const doc = parseYaml(yamlWithMultiline);

      // Modify a different field
      setField(doc, ['slides', 0, 'number'], 2);

      const output = serializeYaml(doc);

      // All comments should be preserved
      expect(output).toContain('# Plan file with multi-line content');
      expect(output).toContain('# Intent description');
      expect(output).toContain('# Key points comment');
      expect(output).toContain('# inline');

      // Multi-line content should be preserved
      expect(output).toContain('intent: |');
      expect(output).toContain('This is a multi-line');
    });

    it('should preserve comments in various positions through edit cycle', () => {
      const yamlWithVariousComments = `# Header comment
deck_name: Test Deck  # Inline after value

# Section comment before slides
slides:
  # Comment before first item
  - number: 1
    intent: First slide  # Trailing comment
    # Comment between fields
    template: hero

  # Comment before second item
  - number: 2
    intent: Second slide
`;

      const doc = parseYaml(yamlWithVariousComments);

      // Modify multiple fields
      setField(doc, ['slides', 0, 'intent'], 'Updated first');
      setField(doc, ['slides', 1, 'template'], 'two-column');

      const output = serializeYaml(doc);

      // All comment types should be preserved
      expect(output).toContain('# Header comment');
      expect(output).toContain('# Inline after value');
      expect(output).toContain('# Section comment before slides');
      expect(output).toContain('# Comment before first item');
      expect(output).toContain('# Trailing comment');
      expect(output).toContain('# Comment between fields');
      expect(output).toContain('# Comment before second item');

      // Modified values should be updated
      expect(output).toContain('intent: Updated first');
      expect(output).toContain('template: two-column');
    });
  });

  describe('round-trip integrity', () => {
    it('should preserve complex YAML structure through parse-modify-serialize cycle', () => {
      const complexYaml = `# Deck configuration
title: "Q4 Planning"
author: Team Lead

# Slides section
slides:
  # Section 1: Overview
  - id: slide-1
    section: overview
    title: "Q4 Overview"
    keyPoints:
      - Revenue targets
      - New initiatives

  # Section 2: Details
  - id: slide-2
    section: details
    title: "Detailed Plans"
    template: two-column
`;

      const doc = parseYaml(complexYaml);

      // Make some modifications
      setField(doc, ['slides', 0, 'title'], 'Updated Q4 Overview');
      setField(doc, ['slides', 1, 'keyPoints'], ['Point A', 'Point B']);

      const output = serializeYaml(doc);

      // All comments should be preserved
      expect(output).toContain('# Deck configuration');
      expect(output).toContain('# Slides section');
      expect(output).toContain('# Section 1: Overview');
      expect(output).toContain('# Section 2: Details');

      // Unmodified values should remain
      expect(output).toContain('title: "Q4 Planning"');
      expect(output).toContain('author: Team Lead');
      expect(output).toContain('section: overview');

      // Modified values should be updated
      // Note: YAML library preserves quoting style from original, so nested title gets quoted
      expect(output).toContain('title: "Updated Q4 Overview"');
    });
  });

  // ===========================================================================
  // Story 21-1: Slide Array Operations (AC-21.1.3, AC-21.1.9, AC-21.1.10)
  // ===========================================================================

  describe('renumberSlides', () => {
    it('should renumber all slides sequentially from 1', () => {
      const yaml = `slides:
  - number: 5
    description: First
  - number: 10
    description: Second
  - number: 15
    description: Third
`;
      const doc = parseYaml(yaml);
      renumberSlides(doc);

      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      expect(getField(doc, ['slides', 1, 'number'])).toBe(2);
      expect(getField(doc, ['slides', 2, 'number'])).toBe(3);
    });

    it('should handle empty slides array', () => {
      const doc = parseYaml('slides: []');
      renumberSlides(doc); // should not throw
      const output = serializeYaml(doc);
      expect(output).toContain('slides: []');
    });

    it('should handle missing slides field gracefully', () => {
      const doc = parseYaml('deck_name: Test');
      renumberSlides(doc); // should not throw
    });
  });

  describe('insertSlide', () => {
    it('should insert at beginning of slides array', () => {
      const yaml = `slides:
  - number: 1
    description: Original First
`;
      const doc = parseYaml(yaml);
      insertSlide(doc, 0, { number: 0, description: 'New First' });
      const output = serializeYaml(doc);

      expect(getField(doc, ['slides', 0, 'description'])).toBe('New First');
      expect(getField(doc, ['slides', 1, 'description'])).toBe('Original First');
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      expect(getField(doc, ['slides', 1, 'number'])).toBe(2);
    });

    it('should insert at middle of slides array', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      insertSlide(doc, 1, { number: 0, description: 'Inserted' });

      expect(getField(doc, ['slides', 0, 'description'])).toBe('First');
      expect(getField(doc, ['slides', 1, 'description'])).toBe('Inserted');
      expect(getField(doc, ['slides', 2, 'description'])).toBe('Second');
      expect(getField(doc, ['slides', 3, 'description'])).toBe('Third');
      // Renumbered
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      expect(getField(doc, ['slides', 1, 'number'])).toBe(2);
      expect(getField(doc, ['slides', 2, 'number'])).toBe(3);
      expect(getField(doc, ['slides', 3, 'number'])).toBe(4);
    });

    it('should insert at end of slides array', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
`;
      const doc = parseYaml(yaml);
      insertSlide(doc, 2, { number: 0, description: 'Appended' });

      expect(getField(doc, ['slides', 2, 'description'])).toBe('Appended');
      expect(getField(doc, ['slides', 2, 'number'])).toBe(3);
    });

    it('should insert into empty slides array', () => {
      const yaml = `slides: []
`;
      const doc = parseYaml(yaml);
      insertSlide(doc, 0, { number: 0, description: 'Only slide' });

      expect(getField(doc, ['slides', 0, 'description'])).toBe('Only slide');
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
    });

    it('should preserve comments through insert operation', () => {
      const yaml = `# Plan header
slides:
  # First slide
  - number: 1
    description: First  # inline comment
  # Second slide
  - number: 2
    description: Second
`;
      const doc = parseYaml(yaml);
      insertSlide(doc, 1, { number: 0, description: 'Inserted' });
      const output = serializeYaml(doc);

      expect(output).toContain('# Plan header');
      expect(output).toContain('# First slide');
      expect(output).toContain('# inline comment');
      expect(output).toContain('# Second slide');
    });

    it('should throw when slides is not a sequence', () => {
      const doc = parseYaml('slides: not-a-sequence');
      expect(() => insertSlide(doc, 0, { number: 1 })).toThrow('slides field is not a YAML sequence');
    });
  });

  describe('deleteSlide', () => {
    it('should delete first slide and renumber', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      deleteSlide(doc, 0);

      expect(getField(doc, ['slides', 0, 'description'])).toBe('Second');
      expect(getField(doc, ['slides', 1, 'description'])).toBe('Third');
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      expect(getField(doc, ['slides', 1, 'number'])).toBe(2);
    });

    it('should delete middle slide and renumber', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      deleteSlide(doc, 1);

      expect(getField(doc, ['slides', 0, 'description'])).toBe('First');
      expect(getField(doc, ['slides', 1, 'description'])).toBe('Third');
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      expect(getField(doc, ['slides', 1, 'number'])).toBe(2);
    });

    it('should delete last slide and renumber', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
`;
      const doc = parseYaml(yaml);
      deleteSlide(doc, 1);

      expect(getField(doc, ['slides', 0, 'description'])).toBe('First');
      expect(getField(doc, ['slides', 0, 'number'])).toBe(1);
      const output = serializeYaml(doc);
      expect(output).not.toContain('Second');
    });

    it('should delete only slide resulting in empty array', () => {
      const yaml = `slides:
  - number: 1
    description: Only slide
`;
      const doc = parseYaml(yaml);
      deleteSlide(doc, 0);

      const output = serializeYaml(doc);
      expect(output).not.toContain('Only slide');
    });

    it('should preserve comments through delete operation', () => {
      const yaml = `# Plan header
slides:
  # First slide
  - number: 1
    description: First
  # Second slide (to delete)
  - number: 2
    description: Second
  # Third slide
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      deleteSlide(doc, 1);
      const output = serializeYaml(doc);

      expect(output).toContain('# Plan header');
      expect(output).toContain('# First slide');
      expect(output).toContain('# Third slide');
    });
  });

  // ===========================================================================
  // Story 21-2: moveSlide (AC-21.2.5, AC-21.2.6, AC-21.2.7)
  //
  // moveSlide uses insertion-point semantics:
  //   toIndex = position in the ORIGINAL array where the slide should end up.
  //   When toIndex > fromIndex, an internal adjustment (toIndex - 1) accounts
  //   for the index shift after removing the source element.
  //
  // The hook converts @dnd-kit's over-element index to an insertion point:
  //   forward moves: insertionIndex = overIndex + 1
  //   backward moves: insertionIndex = overIndex
  // ===========================================================================

  describe('moveSlide', () => {
    it('should move slide forward within section (AC-21.2.5)', () => {
      const yaml = `slides:
  - number: 1
    description: First
    agenda_section_id: intro
  - number: 2
    description: Second
    agenda_section_id: intro
  - number: 3
    description: Third
    agenda_section_id: intro
`;
      const doc = parseYaml(yaml);
      // Insertion point 3 = "after Third" (hook sends overIndex+1 = 2+1 = 3)
      const result = moveSlide(doc, 0, 3);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('Second');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('Third');
      expect(getField(reparsed, ['slides', 2, 'description'])).toBe('First');
    });

    it('should move slide forward by one position', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      // Insertion point 2 = "after Second" (hook sends overIndex+1 = 1+1 = 2)
      const result = moveSlide(doc, 0, 2);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('Second');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('First');
      expect(getField(reparsed, ['slides', 2, 'description'])).toBe('Third');
    });

    it('should move slide backward within section (AC-21.2.5)', () => {
      const yaml = `slides:
  - number: 1
    description: First
    agenda_section_id: intro
  - number: 2
    description: Second
    agenda_section_id: intro
  - number: 3
    description: Third
    agenda_section_id: intro
`;
      const doc = parseYaml(yaml);
      // Insertion point 0 = "before First" (hook sends overIndex = 0)
      const result = moveSlide(doc, 2, 0);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('Third');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('First');
      expect(getField(reparsed, ['slides', 2, 'description'])).toBe('Second');
    });

    it('should renumber slides after move (AC-21.2.7)', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      const result = moveSlide(doc, 2, 0);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'number'])).toBe(1);
      expect(getField(reparsed, ['slides', 1, 'number'])).toBe(2);
      expect(getField(reparsed, ['slides', 2, 'number'])).toBe(3);
    });

    it('should update agenda_section_id for cross-section move (AC-21.2.6)', () => {
      const yaml = `slides:
  - number: 1
    description: First
    agenda_section_id: intro
  - number: 2
    description: Second
    agenda_section_id: intro
  - number: 3
    description: Third
    agenda_section_id: body
`;
      const doc = parseYaml(yaml);
      // Move First to after Third (insertion point 3, section header sends indexOf(lastSlide)+1)
      const result = moveSlide(doc, 0, 3, 'body');

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('Second');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('Third');
      expect(getField(reparsed, ['slides', 2, 'description'])).toBe('First');
      expect(getField(reparsed, ['slides', 2, 'agenda_section_id'])).toBe('body');
    });

    it('should return unchanged YAML for no-op move (same index, no section change)', () => {
      const yaml = `slides:
  - number: 1
    description: First
  - number: 2
    description: Second
`;
      const doc = parseYaml(yaml);
      const result = moveSlide(doc, 1, 1);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('First');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('Second');
    });

    it('should handle section change at same index', () => {
      const yaml = `slides:
  - number: 1
    description: First
    agenda_section_id: intro
`;
      const doc = parseYaml(yaml);
      const result = moveSlide(doc, 0, 0, 'body');

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'agenda_section_id'])).toBe('body');
    });

    it('should throw for invalid fromIndex', () => {
      const yaml = `slides:
  - number: 1
    description: First
`;
      const doc = parseYaml(yaml);
      expect(() => moveSlide(doc, 5, 0)).toThrow('No slide at index 5');
    });

    it('should throw when slides is not a sequence', () => {
      const doc = parseYaml('slides: not-a-sequence');
      expect(() => moveSlide(doc, 0, 1)).toThrow('slides field is not a YAML sequence');
    });

    it('should preserve comments through move operation', () => {
      const yaml = `# Plan header
slides:
  # First slide
  - number: 1
    description: First
  # Second slide
  - number: 2
    description: Second
  # Third slide
  - number: 3
    description: Third
`;
      const doc = parseYaml(yaml);
      const result = moveSlide(doc, 0, 3);

      expect(result).toContain('# Plan header');
    });

    it('should swap adjacent elements forward (insertion point after next)', () => {
      const yaml = `slides:
  - number: 1
    description: A
  - number: 2
    description: B
`;
      const doc = parseYaml(yaml);
      // Hook sends overIndex+1 = 1+1 = 2 for forward swap
      const result = moveSlide(doc, 0, 2);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('B');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('A');
    });

    it('should swap adjacent elements backward', () => {
      const yaml = `slides:
  - number: 1
    description: A
  - number: 2
    description: B
`;
      const doc = parseYaml(yaml);
      // Hook sends overIndex = 0 for backward move
      const result = moveSlide(doc, 1, 0);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('B');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('A');
    });

    it('should handle move to same position as no-op (insertion point semantics)', () => {
      const yaml = `slides:
  - number: 1
    description: A
  - number: 2
    description: B
`;
      const doc = parseYaml(yaml);
      // toIndex=1 with fromIndex=0: adjusted = 1-1 = 0, effectively no-op
      const result = moveSlide(doc, 0, 1);

      const reparsed = parseYaml(result);
      expect(getField(reparsed, ['slides', 0, 'description'])).toBe('A');
      expect(getField(reparsed, ['slides', 1, 'description'])).toBe('B');
    });
  });
});
