/**
 * Tests for useOperationForms hook and form validation utilities.
 *
 * Story Reference: v3-5-1 AC-1, AC-2
 *
 * AC-1: Form configurations for operations
 * AC-2: Form validation logic
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useOperationForms,
  operationForms,
  validateForm,
  getFormConfig,
  hasFormConfig,
} from '../../../../src/webview/catalog/hooks/useOperationForms';
import type { FormConfig } from '../../../../src/shared/types';

describe('operationForms configuration', () => {
  describe('plan-deck configuration', () => {
    const config = operationForms['plan-deck'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('modal');
    });

    it('has correct title and operation', () => {
      expect(config.title).toBe('Plan a Deck');
      expect(config.operation).toBe('sb-create:plan-deck');
    });

    it('has all 6 required fields', () => {
      expect(config.fields).toHaveLength(6);
    });

    it('has correct field names', () => {
      const fieldNames = config.fields!.map(f => f.name);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('audience');
      expect(fieldNames).toContain('goal');
      expect(fieldNames).toContain('slideCount');
      expect(fieldNames).toContain('topics');
      expect(fieldNames).toContain('tone');
    });

    it('marks title, audience, and goal as required', () => {
      const requiredFields = config.fields!.filter(f => f.required).map(f => f.name);
      expect(requiredFields).toContain('title');
      expect(requiredFields).toContain('audience');
      expect(requiredFields).toContain('goal');
    });

    it('marks slideCount, topics, and tone as optional', () => {
      const optionalFields = config.fields!.filter(f => !f.required).map(f => f.name);
      expect(optionalFields).toContain('slideCount');
      expect(optionalFields).toContain('topics');
      expect(optionalFields).toContain('tone');
    });

    it('tone field has select options', () => {
      const toneField = config.fields!.find(f => f.name === 'tone');
      expect(toneField?.type).toBe('select');
      expect(toneField?.options).toHaveLength(4);
      expect(toneField?.options?.[0].value).toBe('professional');
    });
  });

  // v3-5-2: plan-one configuration tests (AC-1)
  describe('plan-one configuration', () => {
    const config = operationForms['plan-one'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('modal');
    });

    it('has correct title and operation', () => {
      expect(config.title).toBe('Plan a Single Slide');
      expect(config.operation).toBe('sb-create:plan-one');
    });

    it('has all 4 fields', () => {
      expect(config.fields).toHaveLength(4);
    });

    it('has correct field names', () => {
      const fieldNames = config.fields!.map(f => f.name);
      expect(fieldNames).toContain('purpose');
      expect(fieldNames).toContain('keyMessage');
      expect(fieldNames).toContain('content');
      expect(fieldNames).toContain('template');
    });

    it('marks purpose and keyMessage as required', () => {
      const requiredFields = config.fields!.filter(f => f.required).map(f => f.name);
      expect(requiredFields).toContain('purpose');
      expect(requiredFields).toContain('keyMessage');
      expect(requiredFields).toHaveLength(2);
    });

    it('marks content and template as optional', () => {
      const optionalFields = config.fields!.filter(f => !f.required).map(f => f.name);
      expect(optionalFields).toContain('content');
      expect(optionalFields).toContain('template');
    });

    it('template field is a select type with empty options (populated dynamically)', () => {
      const templateField = config.fields!.find(f => f.name === 'template');
      expect(templateField?.type).toBe('select');
      expect(templateField?.options).toHaveLength(0);
    });
  });

  // bt-1-2: brand-setup configuration tests (AC-4, AC-6, AC-7)
  describe('brand-setup configuration (bt-1-2)', () => {
    const config = operationForms['brand-setup'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('modal');
    });

    it('has correct title, operation, and submitLabel', () => {
      expect(config.title).toBe('Set Up Brand Theme');
      expect(config.operation).toBe('brand-setup');
      expect(config.submitLabel).toBe('Start Brand Setup');
    });

    it('has 3 fields (assetFolder, companyName, brandDescription)', () => {
      expect(config.fields).toHaveLength(3);
    });

    it('has correct field names', () => {
      const fieldNames = config.fields!.map(f => f.name);
      expect(fieldNames).toContain('assetFolder');
      expect(fieldNames).toContain('companyName');
      expect(fieldNames).toContain('brandDescription');
    });

    it('has assetFolder as folder-picker type and required', () => {
      const assetFolder = config.fields!.find(f => f.name === 'assetFolder');
      expect(assetFolder).toBeDefined();
      expect(assetFolder!.type).toBe('folder-picker');
      expect(assetFolder!.required).toBe(true);
    });

    it('marks only assetFolder as required', () => {
      const requiredFields = config.fields!.filter(f => f.required).map(f => f.name);
      expect(requiredFields).toEqual(['assetFolder']);
    });

    it('marks companyName and brandDescription as optional', () => {
      const optionalFields = config.fields!.filter(f => !f.required).map(f => f.name);
      expect(optionalFields).toContain('companyName');
      expect(optionalFields).toContain('brandDescription');
    });

    it('has companyName as text type and brandDescription as textarea type', () => {
      const companyName = config.fields!.find(f => f.name === 'companyName');
      const brandDescription = config.fields!.find(f => f.name === 'brandDescription');
      expect(companyName!.type).toBe('text');
      expect(brandDescription!.type).toBe('textarea');
    });
  });

  // tm-3-1: add-deck-template configuration tests (Task 6.7)
  describe('add-deck-template configuration (tm-3-1 AC-2)', () => {
    const config = operationForms['add-deck-template'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('modal');
    });

    it('has correct title and operation', () => {
      expect(config.title).toBe('Add Deck Template');
      expect(config.operation).toBe('sb-manage:add-deck-template');
    });

    it('has all 4 fields', () => {
      expect(config.fields).toHaveLength(4);
    });

    it('has correct field names', () => {
      const fieldNames = config.fields!.map(f => f.name);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('purpose');
      expect(fieldNames).toContain('audience');
      expect(fieldNames).toContain('slideCount');
    });

    it('has correct field types', () => {
      const nameField = config.fields!.find(f => f.name === 'name');
      const purposeField = config.fields!.find(f => f.name === 'purpose');
      const audienceField = config.fields!.find(f => f.name === 'audience');
      const slideCountField = config.fields!.find(f => f.name === 'slideCount');
      expect(nameField?.type).toBe('text');
      expect(purposeField?.type).toBe('textarea');
      expect(audienceField?.type).toBe('text');
      expect(slideCountField?.type).toBe('number');
    });

    it('marks name and purpose as required', () => {
      const requiredFields = config.fields!.filter(f => f.required).map(f => f.name);
      expect(requiredFields).toContain('name');
      expect(requiredFields).toContain('purpose');
      expect(requiredFields).toHaveLength(2);
    });

    it('marks audience and slideCount as optional', () => {
      const optionalFields = config.fields!.filter(f => !f.required).map(f => f.name);
      expect(optionalFields).toContain('audience');
      expect(optionalFields).toContain('slideCount');
    });

    it('slideCount has placeholder "5-10"', () => {
      const slideCountField = config.fields!.find(f => f.name === 'slideCount');
      expect(slideCountField?.placeholder).toBe('5-10');
    });
  });

  // tm-3-4: edit-deck-template-slide configuration tests (Task 7.1)
  describe('edit-deck-template-slide configuration (tm-3-4 AC-2)', () => {
    const config = operationForms['edit-deck-template-slide'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('modal');
    });

    it('has correct title and operation', () => {
      expect(config.title).toBe('Edit Slide');
      expect(config.operation).toBe('sb-manage:edit-deck-template');
    });

    it('has exactly 1 field', () => {
      expect(config.fields).toHaveLength(1);
    });

    it('has a required changes textarea field', () => {
      const changesField = config.fields![0];
      expect(changesField.name).toBe('changes');
      expect(changesField.type).toBe('textarea');
      expect(changesField.required).toBe(true);
    });

    it('changes field has descriptive label', () => {
      const changesField = config.fields![0];
      expect(changesField.label).toBe('Describe the changes you want');
    });
  });

  // v3-5-3: Quick input configuration tests
  describe('edit quick input configuration (v3-5-3 AC-1)', () => {
    const config = operationForms['edit'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('quick-input');
    });

    it('has correct operation', () => {
      expect(config.operation).toBe('sb-create:edit');
    });

    it('has descriptive placeholder', () => {
      expect(config.placeholder).toContain('edit');
      expect(config.placeholder).toContain('Make the title larger');
    });

    it('is marked as required', () => {
      expect(config.required).toBe(true);
    });

    it('has no fields (quick input)', () => {
      expect(config.fields).toBeUndefined();
    });
  });

  describe('animate quick input configuration (v3-5-3 AC-2)', () => {
    const config = operationForms['animate'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('quick-input');
    });

    it('has correct operation', () => {
      expect(config.operation).toBe('sb-create:animate');
    });

    it('has descriptive placeholder', () => {
      expect(config.placeholder).toContain('animation');
      expect(config.placeholder).toContain('Reveal bullets one by one');
    });

    it('is marked as required', () => {
      expect(config.required).toBe(true);
    });
  });

  describe('build-one quick input configuration (v3-5-3 AC-3)', () => {
    const config = operationForms['build-one'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('quick-input');
    });

    it('has correct operation', () => {
      expect(config.operation).toBe('sb-create:build-one');
    });

    it('has placeholder indicating optional', () => {
      expect(config.placeholder).toContain('optional');
    });

    it('is marked as NOT required (optional)', () => {
      expect(config.required).toBe(false);
    });
  });

  describe('build-all quick input configuration (v3-5-3 AC-4)', () => {
    const config = operationForms['build-all'];

    it('exists and has correct type', () => {
      expect(config).toBeDefined();
      expect(config.type).toBe('quick-input');
    });

    it('has correct operation', () => {
      expect(config.operation).toBe('sb-create:build-all');
    });

    it('has placeholder indicating optional', () => {
      expect(config.placeholder).toContain('optional');
    });

    it('is marked as NOT required (optional)', () => {
      expect(config.required).toBe(false);
    });
  });
});

describe('validateForm', () => {
  const config: FormConfig = {
    type: 'modal',
    title: 'Test Form',
    operation: 'test-op',
    fields: [
      { name: 'requiredField', label: 'Required Field', type: 'text', required: true },
      { name: 'optionalField', label: 'Optional Field', type: 'text', required: false },
      {
        name: 'validatedField',
        label: 'Validated Field',
        type: 'text',
        required: false,
        validation: { minLength: 3, maxLength: 10 },
      },
    ],
  };

  it('returns empty array when all required fields are filled', () => {
    const values = { requiredField: 'value' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(0);
  });

  it('returns error when required field is empty', () => {
    const values = { requiredField: '' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('requiredField');
    expect(errors[0].message).toBe('Required Field is required');
  });

  it('returns error when required field is missing', () => {
    const values = {};
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('requiredField');
  });

  it('returns error when required field is only whitespace', () => {
    const values = { requiredField: '   ' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('requiredField');
  });

  it('does not return error for empty optional field', () => {
    const values = { requiredField: 'value', optionalField: '' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(0);
  });

  it('returns error for minLength violation', () => {
    const values = { requiredField: 'value', validatedField: 'ab' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('validatedField');
    expect(errors[0].message).toContain('at least 3 characters');
  });

  it('returns error for maxLength violation', () => {
    const values = { requiredField: 'value', validatedField: 'this is way too long' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('validatedField');
    expect(errors[0].message).toContain('at most 10 characters');
  });

  it('does not validate length for empty optional field', () => {
    const values = { requiredField: 'value', validatedField: '' };
    const errors = validateForm(config, values);
    expect(errors).toHaveLength(0);
  });

  it('handles form config without fields', () => {
    const configNoFields: FormConfig = {
      type: 'quick-input',
      operation: 'test-op',
    };
    const errors = validateForm(configNoFields, {});
    expect(errors).toHaveLength(0);
  });
});

describe('getFormConfig', () => {
  it('returns config for plan-deck', () => {
    const config = getFormConfig('plan-deck');
    expect(config).toBeDefined();
    expect(config?.title).toBe('Plan a Deck');
  });

  it('returns config for plan-one (v3-5-2)', () => {
    const config = getFormConfig('plan-one');
    expect(config).toBeDefined();
    expect(config?.title).toBe('Plan a Single Slide');
  });

  it('returns config for brand-setup (bt-1-2)', () => {
    const config = getFormConfig('brand-setup');
    expect(config).toBeDefined();
    expect(config?.title).toBe('Set Up Brand Theme');
    expect(config?.submitLabel).toBe('Start Brand Setup');
  });

  it('returns config for add-deck-template (tm-3-1)', () => {
    const config = getFormConfig('add-deck-template');
    expect(config).toBeDefined();
    expect(config?.title).toBe('Add Deck Template');
  });

  it('returns config for edit-deck-template-slide (tm-3-4)', () => {
    const config = getFormConfig('edit-deck-template-slide');
    expect(config).toBeDefined();
    expect(config?.title).toBe('Edit Slide');
  });

  it('returns config for edit quick input (v3-5-3)', () => {
    const config = getFormConfig('edit');
    expect(config).toBeDefined();
    expect(config?.type).toBe('quick-input');
  });

  it('returns config for animate quick input (v3-5-3)', () => {
    const config = getFormConfig('animate');
    expect(config).toBeDefined();
    expect(config?.type).toBe('quick-input');
  });

  it('returns config for build-one quick input (v3-5-3)', () => {
    const config = getFormConfig('build-one');
    expect(config).toBeDefined();
    expect(config?.type).toBe('quick-input');
  });

  it('returns config for build-all quick input (v3-5-3)', () => {
    const config = getFormConfig('build-all');
    expect(config).toBeDefined();
    expect(config?.type).toBe('quick-input');
  });

  it('returns undefined for unknown operation', () => {
    const config = getFormConfig('unknown-operation');
    expect(config).toBeUndefined();
  });
});

describe('hasFormConfig', () => {
  it('returns true for plan-deck', () => {
    expect(hasFormConfig('plan-deck')).toBe(true);
  });

  it('returns true for plan-one (v3-5-2)', () => {
    expect(hasFormConfig('plan-one')).toBe(true);
  });

  it('returns true for brand-setup (bt-1-2)', () => {
    expect(hasFormConfig('brand-setup')).toBe(true);
  });

  it('returns true for add-deck-template (tm-3-1)', () => {
    expect(hasFormConfig('add-deck-template')).toBe(true);
  });

  it('returns true for edit-deck-template-slide (tm-3-4)', () => {
    expect(hasFormConfig('edit-deck-template-slide')).toBe(true);
  });

  it('returns true for edit (v3-5-3)', () => {
    expect(hasFormConfig('edit')).toBe(true);
  });

  it('returns true for animate (v3-5-3)', () => {
    expect(hasFormConfig('animate')).toBe(true);
  });

  it('returns true for build-one (v3-5-3)', () => {
    expect(hasFormConfig('build-one')).toBe(true);
  });

  it('returns true for build-all (v3-5-3)', () => {
    expect(hasFormConfig('build-all')).toBe(true);
  });

  it('returns false for unknown operation', () => {
    expect(hasFormConfig('unknown-operation')).toBe(false);
  });
});

describe('useOperationForms hook', () => {
  it('returns getConfig function', () => {
    const { result } = renderHook(() => useOperationForms());
    expect(typeof result.current.getConfig).toBe('function');
  });

  it('returns hasConfig function', () => {
    const { result } = renderHook(() => useOperationForms());
    expect(typeof result.current.hasConfig).toBe('function');
  });

  it('returns validate function', () => {
    const { result } = renderHook(() => useOperationForms());
    expect(typeof result.current.validate).toBe('function');
  });

  it('returns configs object', () => {
    const { result } = renderHook(() => useOperationForms());
    expect(result.current.configs).toBe(operationForms);
  });

  it('getConfig works correctly', () => {
    const { result } = renderHook(() => useOperationForms());
    const config = result.current.getConfig('plan-deck');
    expect(config?.title).toBe('Plan a Deck');
  });

  it('hasConfig works correctly', () => {
    const { result } = renderHook(() => useOperationForms());
    expect(result.current.hasConfig('plan-deck')).toBe(true);
    expect(result.current.hasConfig('unknown')).toBe(false);
  });

  it('validate works correctly', () => {
    const { result } = renderHook(() => useOperationForms());
    const config = result.current.getConfig('plan-deck')!;
    const errors = result.current.validate(config, {});
    expect(errors.length).toBeGreaterThan(0);
  });
});
