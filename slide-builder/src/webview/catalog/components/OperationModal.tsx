/**
 * OperationModal - Configuration-driven modal form for complex operations.
 *
 * Story Reference: v3-5-1 AC-1 to AC-5
 * Architecture Reference: ADR-V3-005 — Configuration-driven form system
 *
 * AC-1: Modal displays operation-specific form fields
 * AC-2: Inline validation errors for required fields
 * AC-3: Submits form data to extension for CLI invocation
 * AC-4: Dismissible via ESC, outside click, or close button
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, Check, FolderOpen } from 'lucide-react';
import type { FormConfig, FormFieldConfig, FormValidationError } from '../../../shared/types';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';

// =============================================================================
// Props Interface
// =============================================================================

export interface OperationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FormConfig;
  onSubmit: (data: Record<string, unknown>) => void;
}

// =============================================================================
// Component
// =============================================================================

export function OperationModal({
  open,
  onOpenChange,
  config,
  onSubmit,
}: OperationModalProps): React.ReactElement {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FormValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setValues({});
      setErrors([]);
      setTouched(new Set());
      // Focus first input after dialog opens
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open]);

  // bt-1-2 AC-5: Listen for folder-picked messages from extension host
  // This enables the folder-picker field type round-trip pattern:
  // webview sends pick-folder → extension host opens native dialog → returns folder-picked
  useEffect(() => {
    const hasFolderPicker = config.fields?.some(f => f.type === 'folder-picker');
    if (!open || !hasFolderPicker) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'folder-picked' && typeof message.path === 'string') {
        // Find the folder-picker field name and update its value
        const folderField = config.fields?.find(f => f.type === 'folder-picker');
        if (folderField) {
          setValues(prev => ({ ...prev, [folderField.name]: message.path }));
          // Clear validation error for this field
          setErrors(prev => prev.filter(e => e.field !== folderField.name));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, config.fields]);

  // Validate form fields
  const validateForm = useCallback((): FormValidationError[] => {
    const newErrors: FormValidationError[] = [];

    if (!config.fields) return newErrors;

    for (const field of config.fields) {
      const value = values[field.name];
      const stringValue = typeof value === 'string' ? value.trim() : '';

      if (field.required && !stringValue) {
        // bt-1-2 AC-6: Custom validation message for folder-picker fields
        const message = field.type === 'folder-picker'
          ? `Please select a brand assets folder`
          : `${field.label} is required`;
        newErrors.push({
          field: field.name,
          message,
        });
      }

      if (field.validation && stringValue) {
        if (field.validation.minLength && stringValue.length < field.validation.minLength) {
          newErrors.push({
            field: field.name,
            message: `${field.label} must be at least ${field.validation.minLength} characters`,
          });
        }
        if (field.validation.maxLength && stringValue.length > field.validation.maxLength) {
          newErrors.push({
            field: field.name,
            message: `${field.label} must be at most ${field.validation.maxLength} characters`,
          });
        }
        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(stringValue)) {
          newErrors.push({
            field: field.name,
            message: `${field.label} format is invalid`,
          });
        }
      }
    }

    return newErrors;
  }, [config.fields, values]);

  const handleFieldChange = useCallback((name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    setErrors(prev => prev.filter(e => e.field !== name));
  }, []);

  const handleFieldBlur = useCallback((name: string) => {
    setTouched(prev => new Set([...prev, name]));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    if (config.fields) {
      setTouched(new Set(config.fields.map(f => f.name)));
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      onSubmit(values);
      onOpenChange(false);
    }
  }, [config.fields, validateForm, values, onSubmit, onOpenChange]);

  const getFieldError = useCallback((name: string): string | undefined => {
    if (!touched.has(name)) return undefined;
    return errors.find(e => e.field === name)?.message;
  }, [errors, touched]);

  const renderField = (field: FormFieldConfig, index: number) => {
    const error = getFieldError(field.name);
    const value = values[field.name] ?? '';
    const isFirst = index === 0;

    const commonProps = {
      id: field.name,
      'aria-describedby': error ? `${field.name}-error` : undefined,
      'aria-invalid': !!error,
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            {...commonProps}
            ref={isFirst ? firstInputRef as React.RefObject<HTMLInputElement> : undefined}
            type="text"
            className={`operation-modal__input ${error ? 'operation-modal__input--error' : ''}`}
            placeholder={field.placeholder}
            value={value as string}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            onBlur={() => handleFieldBlur(field.name)}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            ref={isFirst ? firstInputRef as React.RefObject<HTMLTextAreaElement> : undefined}
            className={`operation-modal__textarea ${error ? 'operation-modal__input--error' : ''}`}
            placeholder={field.placeholder}
            value={value as string}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            onBlur={() => handleFieldBlur(field.name)}
            rows={3}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            ref={isFirst ? firstInputRef as React.RefObject<HTMLInputElement> : undefined}
            type="number"
            className={`operation-modal__input ${error ? 'operation-modal__input--error' : ''}`}
            placeholder={field.placeholder}
            value={value as string}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            onBlur={() => handleFieldBlur(field.name)}
          />
        );

      case 'select':
        return (
          <Select.Root
            value={value as string}
            onValueChange={v => handleFieldChange(field.name, v)}
          >
            <Select.Trigger
              className={`operation-modal__select-trigger ${error ? 'operation-modal__input--error' : ''}`}
              aria-label={field.label}
            >
              <Select.Value placeholder={field.placeholder || 'Select an option'} />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="operation-modal__select-content">
                <Select.Viewport className="operation-modal__select-viewport">
                  {field.options?.map(option => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="operation-modal__select-item"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator className="operation-modal__select-indicator">
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        );

      // bt-1-2 AC-4, AC-5: Folder picker field type — read-only input + Browse button
      case 'folder-picker':
        return (
          <div className="operation-modal__folder-picker">
            <input
              {...commonProps}
              type="text"
              className={`operation-modal__input operation-modal__input--folder ${error ? 'operation-modal__input--error' : ''}`}
              placeholder={field.placeholder}
              value={value as string}
              readOnly
              tabIndex={-1}
            />
            <button
              type="button"
              className="operation-modal__btn operation-modal__btn--browse"
              onClick={() => {
                const api = getVSCodeApi();
                api.postMessage({ type: 'pick-folder' });
              }}
              aria-label="Browse for folder"
            >
              <FolderOpen size={14} />
              <span>Browse...</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // bt-1-2 AC-6: Disable submit when a required folder-picker field is empty
  // Only folder-picker fields disable submit (user can't type in them, so validation on submit is insufficient)
  const hasRequiredFolderPickerEmpty = config.fields?.some(field => {
    if (!field.required || field.type !== 'folder-picker') return false;
    const value = values[field.name];
    const stringValue = typeof value === 'string' ? value.trim() : '';
    return !stringValue;
  }) ?? false;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* AC-4: Click outside dismisses dialog */}
        <Dialog.Overlay className="operation-modal__overlay" />
        <Dialog.Content
          className="operation-modal__content"
          aria-describedby="operation-modal-description"
        >
          {/* Header with title and close button */}
          <div className="operation-modal__header">
            <Dialog.Title className="operation-modal__title">
              {config.title || 'Operation'}
            </Dialog.Title>
            {/* AC-4: Close button dismisses dialog */}
            <Dialog.Close asChild>
              <button
                type="button"
                className="operation-modal__close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="operation-modal__form">
            {config.fields?.map((field, index) => (
              <div key={field.name} className="operation-modal__field">
                <label htmlFor={field.name} className="operation-modal__label">
                  {field.label}
                  {field.required && <span className="operation-modal__required" aria-hidden="true">*</span>}
                </label>
                {renderField(field, index)}
                {/* AC-2: Inline validation errors */}
                {/* bt-1-2 AC-6: folder-picker required fields show validation hint when empty (no touch needed) */}
                {(getFieldError(field.name) || (
                  field.type === 'folder-picker' && field.required && !(values[field.name] as string)?.trim()
                )) && (
                  <span
                    id={`${field.name}-error`}
                    className="operation-modal__error"
                    role="alert"
                  >
                    {getFieldError(field.name) || (
                      field.type === 'folder-picker' ? 'Please select a brand assets folder' : `${field.label} is required`
                    )}
                  </span>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="operation-modal__actions">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="operation-modal__btn operation-modal__btn--secondary"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="operation-modal__btn operation-modal__btn--primary"
                disabled={hasRequiredFolderPickerEmpty}
              >
                {config.submitLabel || 'Submit'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
