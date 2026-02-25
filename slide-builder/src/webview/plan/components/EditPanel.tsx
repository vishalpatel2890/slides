/**
 * EditPanel - Right sidebar form for editing slide details.
 *
 * Story Reference: 20-1 - Edit Panel with Slide Detail Form
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 *
 * AC-20.1.1: Empty state placeholder when no slide selected
 * AC-20.1.2: 400px fixed-width panel on right
 * AC-20.1.3: Header "Slide {N}" with 14px, 600 weight
 * AC-20.1.4: Form fields (intent, tone, visual_guidance, section)
 * AC-20.1.5: Label styling 12px, 500 weight, --fg-secondary
 * AC-20.1.6: Required field indicator (red dot)
 * AC-20.1.7: Two-way sync on blur/Enter
 * AC-20.1.8: ARIA role="complementary", aria-label="Slide details"
 * AC-20.1.9: Tab navigation from grid to panel
 * AC-20.1.10: Section change moves card
 * AC-20.1.11: Medium width (800-1200px) → 340px
 * AC-20.1.12: Narrow width (<800px) → hidden
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ChevronDown, Check, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { KeyPointsEditor } from './KeyPointsEditor';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ValidationSection } from './ValidationSection';
import { useValidation } from '../hooks/useValidation';
import {
  getSlideIntent,
  getSlideTemplate,
  getSlideVisualGuidance,
  type SlideEntry,
  type AgendaSection,
  type ValidationWarning,
} from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface EditPanelProps {
  /** Currently selected slide, null if none selected */
  slide: SlideEntry | null;
  /** Available agenda sections for the section dropdown */
  sections: AgendaSection[];
  /** Callback when a field is edited (called on blur or Enter) */
  onEdit: (field: string, value: unknown) => void;
  /** Callback when delete is confirmed (AC-21.1.5) */
  onDelete?: (slideNumber: number) => void;
  /** Callback when Edit with Claude is clicked (opens dialog) */
  onOpenClaude?: (slideNumber: number) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// FormField Component - Reusable field wrapper with label and tooltip
// =============================================================================

interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Tooltip help text */
  tooltip: string;
  /** Whether this field is required */
  required?: boolean;
  /** HTML id for the input element */
  htmlFor: string;
  /** Child input element */
  children: React.ReactNode;
}

function FormField({
  label,
  tooltip,
  required = false,
  htmlFor,
  children,
}: FormFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <Tooltip.Provider delayDuration={300}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <label
              htmlFor={htmlFor}
              className={cn(
                'flex items-center gap-1',
                'text-[12px] font-medium text-[var(--fg-secondary)]',
                'cursor-help'
              )}
            >
              {/* AC-20.1.6: Required field indicator (red dot before label) */}
              {required && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {label}
            </label>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className={cn(
                'z-50 px-3 py-2 max-w-xs',
                'text-[12px] text-[var(--fg)]',
                'bg-[var(--card)] border border-[var(--border)]',
                'rounded-md shadow-lg',
                'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
              )}
              sideOffset={4}
            >
              {tooltip}
              <Tooltip.Arrow className="fill-[var(--card)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      {children}
    </div>
  );
}

// =============================================================================
// InlineWarning Component - Field-level validation warning (AC-22.2.2, 22.2.3, 22.2.4)
// =============================================================================

interface InlineWarningProps {
  /** Warning to display */
  warning: ValidationWarning | undefined;
  /** Resolution suggestion text */
  suggestion: string;
}

/**
 * InlineWarning displays a compact amber warning below a form field.
 * Used for field-specific validation (missing intent, missing template, low confidence).
 */
function InlineWarning({ warning, suggestion }: InlineWarningProps): React.ReactElement | null {
  if (!warning) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-1.5 mt-1 text-[#f59e0b]"
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-medium">{warning.message}</span>
        <span className="text-[11px] text-[#b45309] italic">{suggestion}</span>
      </div>
    </div>
  );
}

// =============================================================================
// EditPanel Component
// =============================================================================

/**
 * EditPanel displays a form for editing slide details.
 * Shows empty state when no slide is selected.
 *
 * @example
 * <EditPanel
 *   slide={selectedSlide}
 *   sections={agendaSections}
 *   onEdit={(field, value) => handleEdit(field, value)}
 * />
 */
export function EditPanel({
  slide,
  sections,
  onEdit,
  onDelete,
  onOpenClaude,
  className,
}: EditPanelProps): React.ReactElement {
  // Local state for form fields (controlled inputs)
  const [intent, setIntent] = useState('');
  const [tone, setTone] = useState('');
  const [visualGuidance, setVisualGuidance] = useState('');
  const [sectionId, setSectionId] = useState('');

  // AC-21.1.6: Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // AC-21.1.4: Ref for auto-focusing intent input on newly added slides
  const intentInputRef = useRef<HTMLInputElement>(null);

  // AC-22.2.8: Ref for scrolling panel to top when slide selected (e.g., via badge click)
  const panelRef = useRef<HTMLElement>(null);

  // Track original values to detect changes
  const originalValues = useRef({
    intent: '',
    tone: '',
    visualGuidance: '',
    sectionId: '',
  });

  // Track previous slide number for detecting newly selected slides
  const prevSlideNumberRef = useRef<number | null>(null);

  // AC-22.2.9: Get validation warnings for the selected slide
  const { slideWarnings } = useValidation();
  const warnings = slide ? slideWarnings(slide.number) : [];

  // Note: open-claude messaging now handled by parent via onOpenClaude prop

  // AC-22.2.2, 22.2.3, 22.2.4: Filter warnings for inline field display
  const descriptionWarning = warnings.find(
    (w) =>
      w.type === 'missing-field' &&
      (w.message.toLowerCase().includes('intent') ||
        w.message.toLowerCase().includes('description'))
  );
  const templateMissingWarning = warnings.find(
    (w) =>
      w.type === 'missing-field' &&
      w.message.toLowerCase().includes('template')
  );
  const lowConfidenceWarning = warnings.find((w) => w.type === 'low-confidence');

  // Update local state when selected slide changes
  // Uses helper functions for schema compatibility (description vs intent, etc.)
  useEffect(() => {
    if (slide) {
      const newIntent = getSlideIntent(slide);
      const newTone = slide.tone ?? '';
      const newVisualGuidance = getSlideVisualGuidance(slide);
      const newSectionId = slide.agenda_section_id ?? '';

      setIntent(newIntent);
      setTone(newTone);
      setVisualGuidance(newVisualGuidance);
      setSectionId(newSectionId);

      // Store original values for change detection
      originalValues.current = {
        intent: newIntent,
        tone: newTone,
        visualGuidance: newVisualGuidance,
        sectionId: newSectionId,
      };

      // AC-22.2.8: Scroll panel to top when a different slide is selected (e.g., via badge click)
      if (slide.number !== prevSlideNumberRef.current) {
        requestAnimationFrame(() => {
          // Guard for test environment where scrollTo may not be available
          if (panelRef.current?.scrollTo) {
            panelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }

      // AC-21.1.4: Auto-focus intent input when newly added slide is selected (empty description)
      if (slide.number !== prevSlideNumberRef.current && newIntent === '') {
        requestAnimationFrame(() => {
          intentInputRef.current?.focus();
        });
      }
      prevSlideNumberRef.current = slide.number;
    }
  }, [slide]);

  // AC-20.1.7: Handle blur - write to YAML if value changed
  // Field names match the schema: 'description' (not 'intent'), 'design_plan' (not 'visual_guidance')
  const handleBlur = useCallback(
    (field: string, value: string, originalValue: string) => {
      if (value !== originalValue) {
        onEdit(field, value);
        // Update original value after successful edit
        if (field === 'description') originalValues.current.intent = value;
        else if (field === 'tone') originalValues.current.tone = value;
        else if (field === 'design_plan') originalValues.current.visualGuidance = value;
      }
    },
    [onEdit]
  );

  // AC-20.1.7: Handle Enter key to trigger save
  // Field names match the schema: 'description' (not 'intent'), 'design_plan' (not 'visual_guidance')
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      field: string,
      value: string,
      originalValue: string,
      isMultiline: boolean
    ) => {
      // For multiline textareas, only save on Enter without shift
      // For single-line inputs, save on any Enter
      if (e.key === 'Enter' && (!isMultiline || !e.shiftKey)) {
        if (!isMultiline) {
          e.preventDefault();
        }
        if (value !== originalValue) {
          onEdit(field, value);
          // Update original value
          if (field === 'description') originalValues.current.intent = value;
          else if (field === 'tone') originalValues.current.tone = value;
          else if (field === 'design_plan') originalValues.current.visualGuidance = value;
        }
      }
    },
    [onEdit]
  );

  // AC-20.3.9: Handle key points changes (full array replacement)
  const handleKeyPointsChange = useCallback(
    (newPoints: string[]) => {
      onEdit('key_points', newPoints);
    },
    [onEdit]
  );

  // AC-20.1.10: Handle section change
  const handleSectionChange = useCallback(
    (newSectionId: string) => {
      setSectionId(newSectionId);
      if (newSectionId !== originalValues.current.sectionId) {
        onEdit('agenda_section_id', newSectionId);
        originalValues.current.sectionId = newSectionId;
      }
    },
    [onEdit]
  );

  // AC-23.2.4: Handle "Edit with Claude" button click - delegates to parent via prop
  const handleOpenClaude = useCallback(() => {
    if (slide && onOpenClaude) {
      onOpenClaude(slide.number);
    }
  }, [slide, onOpenClaude]);

  // =============================================================================
  // Empty State - AC-20.1.1
  // =============================================================================

  if (!slide) {
    return (
      <aside
        role="complementary"
        aria-label="Slide details"
        className={cn(
          // AC-20.1.2: 400px fixed width
          'w-[400px] flex-shrink-0',
          // AC-20.1.11: Medium width (800-1200px) → 340px
          'max-[1200px]:w-[340px]',
          // AC-20.1.12: Narrow width (<800px) → hidden
          'max-[800px]:hidden',
          // Panel styling
          'bg-[var(--card)] border-l border-[var(--border)]',
          'flex items-center justify-center',
          'h-full',
          className
        )}
      >
        <p className="text-[14px] text-[var(--fg-muted)] text-center">
          Select a slide to edit
        </p>
      </aside>
    );
  }

  // =============================================================================
  // Edit Panel with Form Fields
  // =============================================================================

  return (
    <aside
      ref={panelRef}
      role="complementary"
      aria-label="Slide details"
      tabIndex={0}
      className={cn(
        // AC-20.1.2: 400px fixed width
        'w-[400px] flex-shrink-0',
        // AC-20.1.11: Medium width (800-1200px) → 340px
        'max-[1200px]:w-[340px]',
        // AC-20.1.12: Narrow width (<800px) → hidden
        'max-[800px]:hidden',
        // Panel styling
        'bg-[var(--card)] border-l border-[var(--border)]',
        'flex flex-col',
        'h-full overflow-y-auto',
        className
      )}
    >
      {/* AC-20.1.3: Panel header "Slide {N}" with Claude + delete buttons */}
      <header className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[var(--fg)]">
          Slide {slide.number}
        </h2>
        <div className="flex items-center gap-1.5">
          {/* AC-1.2: Sparkles icon button with Tooltip "Edit with Claude" */}
          <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={handleOpenClaude}
                  aria-label="Edit slide with Claude"
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-[var(--fg-muted)] hover:text-[var(--primary)]',
                    'hover:bg-[var(--primary-light)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                    'transition-colors duration-150'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className={cn(
                    'z-50 px-3 py-2 max-w-xs',
                    'text-[12px] text-[var(--fg)]',
                    'bg-[var(--card)] border border-[var(--border)]',
                    'rounded-md shadow-lg',
                    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
                  )}
                  sideOffset={4}
                >
                  Edit with Claude
                  <Tooltip.Arrow className="fill-[var(--card)]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
          {onDelete && (
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              aria-label={`Delete slide ${slide.number}`}
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--fg-muted)] hover:text-[#ef4444]',
                'hover:bg-[#fef2f2]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                'transition-colors duration-150'
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* AC-21.1.6: Delete confirmation dialog */}
      {onDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          slideNumber={slide.number}
          slideIntent={getSlideIntent(slide)}
          onConfirm={() => {
            onDelete(slide.number);
            setDeleteDialogOpen(false);
          }}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      )}

      {/* Form Fields */}
      <div className="flex flex-col gap-6 p-6 pb-8">
        {/* AC-20.1.4: Description single-line input - maps to 'description' in schema */}
        <FormField
          label="Description"
          tooltip="Short title or one-line explainer for this slide. Detailed content goes in Key Points."
          required={true}
          htmlFor="edit-description"
        >
          <input
            ref={intentInputRef}
            id="edit-description"
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onBlur={() => handleBlur('description', intent, originalValues.current.intent)}
            onKeyDown={(e) =>
              handleKeyDown(e, 'description', intent, originalValues.current.intent, false)
            }
            className={cn(
              'w-full px-3 py-2',
              'text-[13px] text-[var(--fg)]',
              'bg-[var(--bg)] border border-[var(--border)]',
              'rounded-[var(--radius-sm)]',
              'placeholder:text-[var(--fg-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'transition-shadow duration-150'
            )}
            placeholder="Short slide title or explainer..."
          />
          {/* AC-22.2.3: Inline warning for missing intent/description */}
          <InlineWarning
            warning={descriptionWarning}
            suggestion="Add an intent description for this slide"
          />
        </FormField>

        {/* Template field - read-only display of suggested template */}
        <FormField
          label="Template"
          tooltip="The suggested slide template for this slide."
          htmlFor="edit-template"
        >
          <div
            id="edit-template"
            className={cn(
              'w-full px-3 py-2',
              'text-[13px] text-[var(--fg)]',
              'bg-[var(--surface)] border border-[var(--border)]',
              'rounded-[var(--radius-sm)]'
            )}
          >
            {getSlideTemplate(slide) || 'No template assigned'}
          </div>
          {/* AC-22.2.4: Inline warning for missing template */}
          <InlineWarning
            warning={templateMissingWarning}
            suggestion="Select a template from the template selector"
          />
          {/* AC-22.2.2: Inline warning for low confidence */}
          <InlineWarning
            warning={lowConfidenceWarning}
            suggestion="Refine the slide intent to better match available templates"
          />
        </FormField>

        {/* AC-20.1.4: Tone text input (single line) */}
        <FormField
          label="Tone"
          tooltip="The emotional quality or attitude of the slide content. Examples: confident, empathetic, urgent, inspiring."
          htmlFor="edit-tone"
        >
          <input
            id="edit-tone"
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            onBlur={() => handleBlur('tone', tone, originalValues.current.tone)}
            onKeyDown={(e) =>
              handleKeyDown(e, 'tone', tone, originalValues.current.tone, false)
            }
            className={cn(
              'w-full px-3 py-2',
              'text-[13px] text-[var(--fg)]',
              'bg-[var(--bg)] border border-[var(--border)]',
              'rounded-[var(--radius-sm)]',
              'placeholder:text-[var(--fg-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'transition-shadow duration-150'
            )}
            placeholder="e.g., Confident and persuasive"
          />
        </FormField>

        {/* AC-20.3.1: Key Points inline editor */}
        <FormField
          label="Key Points"
          tooltip="Talking points for this slide. Click to edit, drag to reorder, or use keyboard shortcuts (Alt+↑/↓ to move, Delete to remove)."
          required={true}
          htmlFor="edit-key-points"
        >
          <KeyPointsEditor
            points={slide.key_points ?? []}
            onChange={handleKeyPointsChange}
          />
        </FormField>

        {/* AC-20.1.4: Design Plan textarea (3 rows) - maps to 'design_plan' in schema */}
        <FormField
          label="Design Plan"
          tooltip="Suggestions for visual elements, imagery, charts, or layout preferences for this slide."
          htmlFor="edit-design-plan"
        >
          <textarea
            id="edit-design-plan"
            value={visualGuidance}
            onChange={(e) => setVisualGuidance(e.target.value)}
            onBlur={() =>
              handleBlur('design_plan', visualGuidance, originalValues.current.visualGuidance)
            }
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                'design_plan',
                visualGuidance,
                originalValues.current.visualGuidance,
                true
              )
            }
            rows={3}
            className={cn(
              'w-full px-3 py-2',
              'text-[13px] text-[var(--fg)]',
              'bg-[var(--bg)] border border-[var(--border)]',
              'rounded-[var(--radius-sm)]',
              'resize-none',
              'placeholder:text-[var(--fg-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'transition-shadow duration-150'
            )}
            placeholder="Describe visual preferences or requirements..."
          />
        </FormField>

        {/* AC-20.1.4: Section Assignment dropdown using Radix Select */}
        <FormField
          label="Section"
          tooltip="The agenda section this slide belongs to. Changing this will move the slide to the new section."
          htmlFor="edit-section"
        >
          <Select.Root value={sectionId} onValueChange={handleSectionChange}>
            <Select.Trigger
              id="edit-section"
              className={cn(
                'w-full px-3 py-2',
                'text-[13px] text-[var(--fg)]',
                'bg-[var(--bg)] border border-[var(--border)]',
                'rounded-[var(--radius-sm)]',
                'flex items-center justify-between gap-2',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                'transition-shadow duration-150',
                'data-[placeholder]:text-[var(--fg-muted)]'
              )}
              aria-label="Section assignment"
            >
              <Select.Value placeholder="Select a section..." />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                className={cn(
                  'z-50 min-w-[200px] overflow-hidden',
                  'bg-[var(--card)] border border-[var(--border)]',
                  'rounded-[var(--radius-sm)]',
                  'shadow-lg',
                  'animate-in fade-in-0 zoom-in-95'
                )}
                position="popper"
                sideOffset={4}
              >
                <Select.Viewport className="p-1">
                  {sections.map((section) => (
                    <Select.Item
                      key={section.id}
                      value={section.id}
                      className={cn(
                        'relative flex items-center gap-2',
                        'px-3 py-2 pr-8',
                        'text-[13px] text-[var(--fg)]',
                        'rounded-[var(--radius-xs)]',
                        'cursor-pointer',
                        'select-none outline-none',
                        'data-[highlighted]:bg-[var(--primary-light)]',
                        'data-[highlighted]:text-[var(--primary)]',
                        'transition-colors duration-100'
                      )}
                    >
                      <Select.ItemText>{section.title}</Select.ItemText>
                      <Select.ItemIndicator className="absolute right-2">
                        <Check className="w-4 h-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </FormField>

        {/* AC-22.2.5: General validation section showing all slide warnings */}
        {warnings.length > 0 && (
          <div className="pt-4 mt-2 border-t border-[var(--border)]">
            <h3 className="text-[12px] font-medium text-[var(--fg-secondary)] mb-2">
              Warnings
            </h3>
            <ValidationSection warnings={warnings} />
          </div>
        )}

      </div>
    </aside>
  );
}
