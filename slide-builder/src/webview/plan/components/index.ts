/**
 * Component exports for the Plan Editor webview.
 *
 * Story Reference: 19-1 - SlideCard Component & Responsive Card Grid
 * Story Reference: 19-2 - Section-Grouped Display & Collapsible Headers
 * Story Reference: 19-3 - Deck Metadata Header & Narrative Flow Bar
 */

export { Chip, ChipGroup, ROLE_COLORS } from './ChipGroup';
export type { ChipProps, ChipGroupProps, StorylineRole } from './ChipGroup';

export { SlideCard } from './SlideCard';
export type { SlideCardProps } from './SlideCard';

export { SlideGrid, groupSlidesBySection } from './SlideGrid';
export type { SlideGridProps } from './SlideGrid';

export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';

export { NarrativeBar } from './NarrativeBar';
export type { NarrativeBarProps } from './NarrativeBar';

export { EditPanel } from './EditPanel';
export type { EditPanelProps } from './EditPanel';

export { ConfidenceScore, scoreTier } from './ConfidenceScore';
export type { ConfidenceScoreProps } from './ConfidenceScore';

export { TemplateSelector } from './TemplateSelector';
export type { TemplateSelectorProps } from './TemplateSelector';

export { KeyPointsEditor } from './KeyPointsEditor';
export type { KeyPointsEditorProps } from './KeyPointsEditor';

export { DeleteConfirmDialog } from './DeleteConfirmDialog';
export type { DeleteConfirmDialogProps } from './DeleteConfirmDialog';

export { EditWithClaudeDialog } from './EditWithClaudeDialog';
export type { EditWithClaudeDialogProps } from './EditWithClaudeDialog';

export { SlideContextMenu } from './SlideContextMenu';
export type { SlideContextMenuProps } from './SlideContextMenu';

export { ValidationBadge } from './ValidationBadge';
export type { ValidationBadgeProps } from './ValidationBadge';

export { ValidationSection } from './ValidationSection';
export type { ValidationSectionProps } from './ValidationSection';
