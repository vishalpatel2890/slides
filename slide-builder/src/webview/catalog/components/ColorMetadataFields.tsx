/**
 * ColorMetadataFields - Editable display of brand asset color intelligence metadata.
 *
 * Story Reference: v3-4-1 AC-4, AC-5 (read-only); v3-4-2 AC-5 through AC-10 (editable)
 * Architecture Reference: ADR-V3-006 — Non-breaking catalog schema extension
 *
 * Displays backgroundAffinity (dropdown), hasTransparency (toggle), dominantColors (read-only chips),
 * contrastNeeds (dropdown), and assetType (dropdown). Manual editing triggers onChange callback.
 */

import React from 'react';
import { Palette, Eye, Contrast, Tag, Layers, ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import type { ColorMetadata } from '../../../shared/types';

interface ColorMetadataFieldsProps {
  metadata: ColorMetadata;
  /** Callback when a field is changed. Called with partial metadata. */
  onChange?: (updates: Partial<ColorMetadata>) => void;
  /** If true, render read-only display (badges instead of dropdowns) */
  readOnly?: boolean;
}

const AFFINITY_OPTIONS: Array<{ value: ColorMetadata['backgroundAffinity']; label: string }> = [
  { value: 'light', label: 'Light backgrounds' },
  { value: 'dark', label: 'Dark backgrounds' },
  { value: 'both', label: 'Light & dark' },
  { value: 'any', label: 'Any background' },
];

const CONTRAST_OPTIONS: Array<{ value: ColorMetadata['contrastNeeds']; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ASSET_TYPE_OPTIONS: Array<{ value: ColorMetadata['assetType']; label: string }> = [
  { value: 'logo', label: 'Logo' },
  { value: 'icon', label: 'Icon' },
  { value: 'photo', label: 'Photo' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'shape', label: 'Shape' },
];

const AFFINITY_LABELS: Record<ColorMetadata['backgroundAffinity'], string> = {
  light: 'Light backgrounds',
  dark: 'Dark backgrounds',
  both: 'Light & dark',
  any: 'Any background',
};

const CONTRAST_LABELS: Record<ColorMetadata['contrastNeeds'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function ColorMetadataFields({
  metadata,
  onChange,
  readOnly = false,
}: ColorMetadataFieldsProps): React.ReactElement {
  const isEditable = !readOnly && onChange !== undefined;

  return (
    <div className="color-metadata" role="region" aria-label="Color metadata">
      <h3 className="color-metadata__heading">Color Intelligence</h3>

      {/* Background Affinity - AC-5 */}
      <div className="asset-detail__info-row">
        <span className="asset-detail__info-label">
          <Layers size={12} />
          Background
        </span>
        <span className="asset-detail__info-value">
          {isEditable ? (
            <Select.Root
              value={metadata.backgroundAffinity}
              onValueChange={(value) =>
                onChange({ backgroundAffinity: value as ColorMetadata['backgroundAffinity'] })
              }
            >
              <Select.Trigger
                className="color-metadata__select-trigger"
                aria-label="Select background affinity"
              >
                <Select.Value />
                <Select.Icon className="color-metadata__select-icon">
                  <ChevronDown size={12} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="color-metadata__select-content" position="popper">
                  <Select.Viewport>
                    {AFFINITY_OPTIONS.map((opt) => (
                      <Select.Item
                        key={opt.value}
                        value={opt.value}
                        className="color-metadata__select-item"
                      >
                        <Select.ItemText>{opt.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          ) : (
            <span
              className={`color-metadata__badge color-metadata__badge--${metadata.backgroundAffinity}`}
            >
              {AFFINITY_LABELS[metadata.backgroundAffinity]}
            </span>
          )}
        </span>
      </div>

      {/* Transparency - AC-6 */}
      <div className="asset-detail__info-row">
        <span className="asset-detail__info-label">
          <Eye size={12} />
          Transparency
        </span>
        <span className="asset-detail__info-value">
          {isEditable ? (
            <Switch.Root
              className="color-metadata__switch-root"
              checked={metadata.hasTransparency}
              onCheckedChange={(checked) => onChange({ hasTransparency: checked })}
              aria-label="Toggle transparency"
            >
              <Switch.Thumb className="color-metadata__switch-thumb" />
            </Switch.Root>
          ) : (
            metadata.hasTransparency ? 'Yes' : 'No'
          )}
        </span>
      </div>

      {/* Dominant Colors - AC-7 (read-only) */}
      {metadata.dominantColors.length > 0 && (
        <div className="asset-detail__info-row color-metadata__colors-row">
          <span className="asset-detail__info-label">
            <Palette size={12} />
            Colors
          </span>
          <div className="color-metadata__colors">
            {metadata.dominantColors.map((color) => (
              <span
                key={color}
                className="color-metadata__chip"
                title={color}
                aria-label={`Dominant color ${color}`}
              >
                <span
                  className="color-metadata__chip-swatch"
                  style={{ backgroundColor: color }}
                />
                <span className="color-metadata__chip-hex">{color}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contrast Needs - AC-8 */}
      <div className="asset-detail__info-row">
        <span className="asset-detail__info-label">
          <Contrast size={12} />
          Contrast
        </span>
        <span className="asset-detail__info-value">
          {isEditable ? (
            <Select.Root
              value={metadata.contrastNeeds}
              onValueChange={(value) =>
                onChange({ contrastNeeds: value as ColorMetadata['contrastNeeds'] })
              }
            >
              <Select.Trigger
                className="color-metadata__select-trigger"
                aria-label="Select contrast needs"
              >
                <Select.Value />
                <Select.Icon className="color-metadata__select-icon">
                  <ChevronDown size={12} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="color-metadata__select-content" position="popper">
                  <Select.Viewport>
                    {CONTRAST_OPTIONS.map((opt) => (
                      <Select.Item
                        key={opt.value}
                        value={opt.value}
                        className="color-metadata__select-item"
                      >
                        <Select.ItemText>{opt.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          ) : (
            CONTRAST_LABELS[metadata.contrastNeeds]
          )}
        </span>
      </div>

      {/* Asset Type - AC-9 */}
      <div className="asset-detail__info-row">
        <span className="asset-detail__info-label">
          <Tag size={12} />
          Asset Type
        </span>
        <span className="asset-detail__info-value">
          {isEditable ? (
            <Select.Root
              value={metadata.assetType}
              onValueChange={(value) =>
                onChange({ assetType: value as ColorMetadata['assetType'] })
              }
            >
              <Select.Trigger
                className="color-metadata__select-trigger"
                aria-label="Select asset type"
              >
                <Select.Value />
                <Select.Icon className="color-metadata__select-icon">
                  <ChevronDown size={12} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="color-metadata__select-content" position="popper">
                  <Select.Viewport>
                    {ASSET_TYPE_OPTIONS.map((opt) => (
                      <Select.Item
                        key={opt.value}
                        value={opt.value}
                        className="color-metadata__select-item"
                      >
                        <Select.ItemText>{opt.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          ) : (
            metadata.assetType
          )}
        </span>
      </div>

      {/* Manual Override Indicator */}
      {metadata.manualOverride && (
        <div className="color-metadata__override-indicator">
          Manual override active
        </div>
      )}
    </div>
  );
}
