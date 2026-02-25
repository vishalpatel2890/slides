/**
 * useOperationForms - Hook for operation form configuration and validation.
 *
 * Story Reference: v3-5-1 AC-1 to AC-3
 * Architecture Reference: ADR-V3-005 — Configuration-driven form system
 *
 * Provides:
 * - Form configurations for all operations (plan-deck, plan-one, brand:setup, etc.)
 * - Validation utilities
 * - Form state management helpers
 */

import { useCallback } from 'react';
import type { FormConfig, FormFieldConfig, FormValidationError } from '../../../shared/types';

// =============================================================================
// Operation Form Configurations
// =============================================================================

/**
 * Registry of form configurations for each operation.
 * Story Reference: v3-5-1 AC-1 — operation-specific fields for plan-deck
 */
export const operationForms: Record<string, FormConfig> = {
  'plan-deck': {
    type: 'modal',
    title: 'Plan a Deck',
    operation: 'sb-create:plan-deck',
    fields: [
      {
        name: 'title',
        label: 'Deck Title',
        type: 'text',
        required: true,
        placeholder: 'Q1 Sales Review',
      },
      {
        name: 'audience',
        label: 'Target Audience',
        type: 'text',
        required: true,
        placeholder: 'Executive leadership team',
      },
      {
        name: 'goal',
        label: 'Presentation Goal',
        type: 'textarea',
        required: true,
        placeholder: 'Convince leadership to approve budget increase...',
      },
      {
        name: 'slideCount',
        label: 'Approximate Slide Count',
        type: 'number',
        required: false,
        placeholder: '10-15',
      },
      {
        name: 'topics',
        label: 'Key Topics',
        type: 'textarea',
        required: false,
        placeholder: 'Revenue growth, Market expansion, Team wins',
      },
      {
        name: 'tone',
        label: 'Tone/Style',
        type: 'select',
        required: false,
        placeholder: 'Select a tone',
        options: [
          { label: 'Professional', value: 'professional' },
          { label: 'Casual', value: 'casual' },
          { label: 'Technical', value: 'technical' },
          { label: 'Inspirational', value: 'inspirational' },
        ],
      },
    ],
  },

  // v3-5-2: Plan-one modal (AC-1)
  'plan-one': {
    type: 'modal',
    title: 'Plan a Single Slide',
    operation: 'sb-create:plan-one',
    fields: [
      {
        name: 'purpose',
        label: 'Slide Purpose',
        type: 'text',
        required: true,
        placeholder: 'Compare Q1 vs Q2 performance',
      },
      {
        name: 'keyMessage',
        label: 'Key Message',
        type: 'textarea',
        required: true,
        placeholder: 'Revenue increased 25% quarter-over-quarter',
      },
      {
        name: 'content',
        label: 'Data/Content to Include',
        type: 'textarea',
        required: false,
        placeholder: 'Revenue figures, growth percentages, key wins',
      },
      {
        name: 'template',
        label: 'Preferred Template',
        type: 'select',
        required: false,
        placeholder: 'Select a template',
        options: [], // Populated dynamically from available templates
      },
    ],
  },

  // bt-1-2: Brand setup modal with folder picker (AC-4, AC-5, AC-6, AC-7)
  'brand-setup': {
    type: 'modal',
    title: 'Set Up Brand Theme',
    operation: 'sb-brand:setup',
    submitLabel: 'Start Brand Setup',
    fields: [
      {
        name: 'assetFolder',
        label: 'Brand Assets Folder',
        type: 'folder-picker',
        required: true,
        placeholder: 'Select folder containing brand assets...',
      },
      {
        name: 'companyName',
        label: 'Company Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Acme Corp',
      },
      {
        name: 'brandDescription',
        label: 'Brand Description',
        type: 'textarea',
        required: false,
        placeholder: 'Brief description of the brand identity and style...',
      },
    ],
  },

  // v3-5-3: Quick input for Edit operation (AC-1)
  'edit': {
    type: 'quick-input',
    placeholder: 'Describe your edit (e.g., "Make the title larger")...',
    required: true,
    operation: 'sb-create:edit',
  },

  // v3-5-3: Quick input for Animate operation (AC-2)
  'animate': {
    type: 'quick-input',
    placeholder: 'Describe animation intent (e.g., "Reveal bullets one by one")...',
    required: true,
    operation: 'sb-create:animate',
  },

  // v3-5-3: Quick input for Build One operation (AC-3)
  'build-one': {
    type: 'quick-input',
    placeholder: 'Additional build instructions (optional)...',
    required: false,
    operation: 'sb-create:build-one',
  },

  // v3-5-3: Quick input for Build All operation (AC-4)
  'build-all': {
    type: 'quick-input',
    placeholder: 'Additional build instructions (optional)...',
    required: false,
    operation: 'sb-create:build-all',
  },

  // tm-3-1: Add deck template via Claude Code (AC-2)
  'add-deck-template': {
    type: 'modal',
    title: 'Add Deck Template',
    operation: 'sb-manage:add-deck-template',
    fields: [
      {
        name: 'name',
        label: 'Template Name',
        type: 'text',
        required: true,
      },
      {
        name: 'purpose',
        label: 'Purpose/Description',
        type: 'textarea',
        required: true,
      },
      {
        name: 'audience',
        label: 'Target Audience',
        type: 'text',
        required: false,
      },
      {
        name: 'slideCount',
        label: 'Approximate Slide Count',
        type: 'number',
        required: false,
        placeholder: '5-10',
      },
    ],
  },

  // tm-3-4: Edit deck template slide via Claude Code (AC-2)
  'edit-deck-template-slide': {
    type: 'modal',
    title: 'Edit Slide',
    operation: 'sb-manage:edit-deck-template',
    fields: [
      {
        name: 'changes',
        label: 'Describe the changes you want',
        type: 'textarea',
        required: true,
        placeholder: 'Make the header larger and add a subtitle area...',
      },
    ],
  },

  // tm-1-5: Add slide template via Claude Code (AC-2, AC-3, AC-10)
  'add-slide-template': {
    type: 'modal',
    title: 'Add Slide Template',
    operation: 'sb-manage:add-slide-template',
    fields: [
      {
        name: 'name',
        label: 'Template Name',
        type: 'text',
        required: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
      },
      {
        name: 'useCases',
        label: 'Primary Use Cases',
        type: 'text',
        required: false,
        placeholder: 'e.g., title slides, data visualization',
      },
      {
        name: 'backgroundMode',
        label: 'Background Mode',
        type: 'select',
        required: false,
        options: [
          { label: 'Dark', value: 'dark' },
          { label: 'Light', value: 'light' },
        ],
      },
    ],
  },
};

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validates form data against a form configuration.
 * Returns array of validation errors (empty if valid).
 *
 * Story Reference: v3-5-1 AC-2 — validation for required fields
 */
export function validateForm(
  config: FormConfig,
  values: Record<string, unknown>
): FormValidationError[] {
  const errors: FormValidationError[] = [];

  if (!config.fields) return errors;

  for (const field of config.fields) {
    const value = values[field.name];
    const stringValue = typeof value === 'string' ? value.trim() : '';

    // Required field validation
    if (field.required && !stringValue) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
      });
      continue; // Skip other validations if required and empty
    }

    // Additional validations only if value is present
    if (field.validation && stringValue) {
      if (field.validation.minLength && stringValue.length < field.validation.minLength) {
        errors.push({
          field: field.name,
          message: `${field.label} must be at least ${field.validation.minLength} characters`,
        });
      }

      if (field.validation.maxLength && stringValue.length > field.validation.maxLength) {
        errors.push({
          field: field.name,
          message: `${field.label} must be at most ${field.validation.maxLength} characters`,
        });
      }

      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(stringValue)) {
        errors.push({
          field: field.name,
          message: `${field.label} format is invalid`,
        });
      }
    }
  }

  return errors;
}

/**
 * Gets form configuration for an operation.
 * Returns undefined if operation is not configured.
 */
export function getFormConfig(operation: string): FormConfig | undefined {
  return operationForms[operation];
}

/**
 * Checks if an operation has a form configuration.
 */
export function hasFormConfig(operation: string): boolean {
  return operation in operationForms;
}

// =============================================================================
// Hook
// =============================================================================

interface UseOperationFormsReturn {
  /** Get form config for an operation */
  getConfig: (operation: string) => FormConfig | undefined;
  /** Check if operation has a form */
  hasConfig: (operation: string) => boolean;
  /** Validate form data */
  validate: (config: FormConfig, values: Record<string, unknown>) => FormValidationError[];
  /** All available form configs */
  configs: Record<string, FormConfig>;
}

/**
 * Hook for accessing operation form configurations and validation.
 *
 * Usage:
 * ```tsx
 * const { getConfig, validate } = useOperationForms();
 * const config = getConfig('plan-deck');
 * const errors = validate(config, formValues);
 * ```
 */
export function useOperationForms(): UseOperationFormsReturn {
  const getConfig = useCallback((operation: string) => {
    return getFormConfig(operation);
  }, []);

  const hasConfig = useCallback((operation: string) => {
    return hasFormConfig(operation);
  }, []);

  const validate = useCallback((config: FormConfig, values: Record<string, unknown>) => {
    return validateForm(config, values);
  }, []);

  return {
    getConfig,
    hasConfig,
    validate,
    configs: operationForms,
  };
}
