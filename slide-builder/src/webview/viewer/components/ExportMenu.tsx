import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, FileImage, FileText, ChevronRight } from 'lucide-react';
import type { UseExportReturn } from '../hooks/useExport';
import type { ViewerMode } from '../context/ViewerContext';
import { PDF_QUALITY_PRESETS } from '../../../shared/types';
import type { PdfQualityPreset } from '../../../shared/types';

/**
 * Props for ExportMenu component.
 */
interface ExportMenuProps {
  /** Export hook return values */
  exportActions: UseExportReturn;
  /** Current viewer mode (export only available in presentation mode) */
  mode: ViewerMode;
}

/**
 * Export dropdown menu for the viewer toolbar.
 * v2-5-1 AC-1: Radix DropdownMenu with 3 export options.
 * v2-5-1 AC-12: Disabled during active export.
 * v2-5-1 AC-13: Disabled when not in presentation mode.
 *
 * Architecture Reference: ADR-004 — html-to-image + jsPDF client-side export
 */
export function ExportMenu({ exportActions, mode }: ExportMenuProps): React.ReactElement {
  const { exportCurrentPng, exportAllPng, exportPdf, isExporting } = exportActions;
  const isDisabled = isExporting || mode !== 'presentation';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`viewer-toolbar__button${isDisabled ? ' viewer-toolbar__button--disabled' : ''}`}
          aria-label="Export slides"
          title="Export slides as PNG or PDF"
          disabled={isDisabled}
        >
          <Download size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="export-menu"
          sideOffset={4}
          align="end"
        >
          <DropdownMenu.Item
            className="export-menu__item"
            onSelect={() => void exportCurrentPng()}
            disabled={isDisabled}
          >
            <FileImage size={14} className="export-menu__icon" />
            <span>Current Slide as PNG</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="export-menu__item"
            onSelect={() => void exportAllPng()}
            disabled={isDisabled}
          >
            <FileImage size={14} className="export-menu__icon" />
            <span>All Slides as PNG</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="export-menu__separator" />

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger
              className="export-menu__item export-menu__sub-trigger"
              disabled={isDisabled}
            >
              <FileText size={14} className="export-menu__icon" />
              <span>All Slides as PDF</span>
              <ChevronRight size={14} className="export-menu__chevron" />
            </DropdownMenu.SubTrigger>

            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className="export-menu export-menu__sub-content"
                sideOffset={4}
                alignOffset={-4}
              >
                {(Object.entries(PDF_QUALITY_PRESETS) as [PdfQualityPreset, typeof PDF_QUALITY_PRESETS[PdfQualityPreset]][]).map(([key, preset]) => (
                  <DropdownMenu.Item
                    key={key}
                    className="export-menu__item"
                    onSelect={() => void exportPdf(key)}
                    disabled={isDisabled}
                  >
                    <span>{preset.label}</span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
