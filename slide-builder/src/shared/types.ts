/**
 * Shared type definitions between extension host and webview.
 * This file is imported by both contexts.
 *
 * Architecture Reference: notes/architecture/architecture.md#Message Protocol
 * Story Reference: 18-3 AC-18.3.7 - Typed messages follow discriminated union pattern
 */

// =============================================================================
// Plan Data Model (matches plan.yaml schema)
// =============================================================================

export interface PlanData {
  deck_name: string;
  created: string; // ISO 8601
  last_modified: string; // ISO 8601
  audience: AudienceContext;
  purpose: string;
  desired_outcome: string;
  key_message: string;
  storyline: Storyline;
  recurring_themes: string[];
  /** Direct array format (older schema) */
  agenda_sections?: AgendaSection[];
  /** Nested format: agenda.sections (newer schema from plan-deck workflow) */
  agenda?: {
    total_sections?: number;
    sections: AgendaSection[];
  };
  slides: SlideEntry[];
}

export interface AudienceContext {
  description: string;
  knowledge_level: 'beginner' | 'intermediate' | 'expert';
  priorities: string[];
}

export interface Storyline {
  opening_hook: string;
  tension: string;
  resolution: string;
  call_to_action: string;
}

export interface AgendaSection {
  id: string;
  title: string;
  narrative_role: string;
  discovery?: Record<string, unknown>;
}

export interface SlideEntry {
  number: number;
  /** Short one-line title/explainer for this slide (required) */
  description: string;
  /** @deprecated Legacy field name. Use description instead. Kept for backward compat on read. */
  intent?: string;
  /** Template - supports both field names */
  suggested_template?: string;
  template?: string;
  status: 'pending' | 'built';
  storyline_role: string; // Flexible to support various role names
  agenda_section_id: string;
  /** Detailed talking points as bullet list (required, min 1 point) */
  key_points: string[];
  /** Visual guidance - supports both field names */
  design_plan?: string;
  visual_guidance?: string;
  tone?: string;
  background_mode?: string;
}

/**
 * Helper to get the slide's main description/intent text.
 * Supports both 'description' (new schema) and 'intent' (old schema).
 */
export function getSlideIntent(slide: SlideEntry): string {
  return slide.description ?? slide.intent ?? '';
}

/**
 * Helper to get the slide's template.
 * Supports both 'suggested_template' (new schema) and 'template' (old schema).
 */
export function getSlideTemplate(slide: SlideEntry): string {
  return slide.suggested_template ?? slide.template ?? '';
}

/**
 * Helper to get the slide's visual guidance.
 * Supports both 'design_plan' (new schema) and 'visual_guidance' (old schema).
 */
export function getSlideVisualGuidance(slide: SlideEntry): string {
  return slide.design_plan ?? slide.visual_guidance ?? '';
}

// =============================================================================
// Schema Enforcement
// =============================================================================

/**
 * Normalizes a description value to be single-line.
 * Collapses newlines to spaces and trims whitespace.
 */
export function normalizeDescription(value: string): string {
  return value.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Validates a single slide entry against the plan schema.
 * Uses getSlideIntent() for backward compat with legacy 'intent' field.
 */
export function validateSlide(slide: SlideEntry): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const desc = getSlideIntent(slide);

  if (!desc || desc.trim().length === 0) {
    warnings.push({
      slideNumber: slide.number,
      type: 'empty-description',
      message: `Slide ${slide.number}: Description is empty`,
      severity: 'warning',
    });
  }

  if (desc && desc.includes('\n')) {
    warnings.push({
      slideNumber: slide.number,
      type: 'multiline-description',
      message: `Slide ${slide.number}: Description should be a single line`,
      severity: 'warning',
    });
  }

  const keyPoints = slide.key_points ?? [];
  if (keyPoints.length === 0) {
    warnings.push({
      slideNumber: slide.number,
      type: 'empty-key-points',
      message: `Slide ${slide.number}: Key points are required`,
      severity: 'warning',
    });
  }

  return warnings;
}

/**
 * Validates all slides in a plan.
 */
export function validatePlan(slides: SlideEntry[]): ValidationWarning[] {
  return slides.flatMap(validateSlide);
}

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationWarning {
  slideNumber?: number; // undefined = deck-level warning
  sectionId?: string;
  type: 'empty-section' | 'missing-cta' | 'low-confidence' | 'missing-field'
    | 'multiline-description' | 'empty-description' | 'empty-key-points';
  message: string;
  severity: 'warning' | 'info';
}

// =============================================================================
// Template Types
// =============================================================================

export interface TemplateCatalogEntry {
  id: string;
  name: string;
  description: string;
  use_cases: string[];
  /** Story tm-1-1: Background mode for dark/light template variants */
  background_mode?: 'dark' | 'light';
}

/**
 * Template metadata for AI prompt customization.
 * Stored as additional fields in slide-templates.json catalog entries.
 * Story Reference: v3-2-3 AC-3, AC-4, AC-5
 */
export interface TemplateMetadata {
  aiPrompt: string;
  placeholderGuidance: string;
  styleRules: string;
}

/**
 * Schema fields for a slide template that are directly editable in the UI.
 * Story Reference: tm-1-1
 * Architecture Reference: notes/architecture-template-management.md#Implementation Patterns §3
 */
export interface SlideTemplateSchema {
  name: string;
  description: string;
  use_cases: string[];
  background_mode: 'dark' | 'light';
}

export interface TemplateScore {
  templateId: string;
  templateName: string;
  score: number; // 0-100
  tier: 'high' | 'medium' | 'low'; // >=80, 50-79, <50
  description: string; // Template description for display in TemplateSelector
}

/**
 * Deck template info for "Create from Template" feature.
 * Story Reference: cv-3-1 AC-3
 */
export interface DeckTemplateInfo {
  id: string;
  name: string;
  description: string;
  path: string; // Relative path to template folder
}

/**
 * Slide template display info for template browsing showcase.
 * Extends TemplateCatalogEntry with category for filtering.
 * Story Reference: cv-5-1 AC-2, AC-3, AC-4
 */
export interface SlideTemplateDisplay extends TemplateCatalogEntry {
  category: string;      // e.g., "Title", "Content", "Data", "Image"
  previewUri?: string;   // Webview-safe URI for preview image (optional)
}

/**
 * Deck template display info for template browsing showcase.
 * Extends DeckTemplateInfo with category and slideCount for catalog display.
 * Story Reference: cv-5-2 AC-12, AC-13
 */
export interface DeckTemplateDisplay extends DeckTemplateInfo {
  category: string;      // e.g., "Business", "Education", "Creative"
  slideCount: number;    // Number of slides in the template
  previewUri?: string;   // Webview-safe URI for preview image (optional)
}

// =============================================================================
// Theme Types
// =============================================================================

export interface ThemeConfig {
  colors?: Record<string, string>;
  typography?: Record<string, unknown>;
  shapes?: Record<string, unknown>;
}

// =============================================================================
// Build Status
// =============================================================================

export type BuildStatus = 'pending' | 'building' | 'built' | 'error';

// =============================================================================
// Thumbnail Cache Data Model (cv-5-3)
// Story Reference: cv-5-3 AC-20, AC-26
// Architecture Reference: ADR-006 — Webview-based Thumbnail Generation
// =============================================================================

/**
 * Single entry in the thumbnail cache index.
 * AC-20: Cache keys use md5(filePath + mtime) for automatic invalidation.
 */
export interface ThumbnailCacheEntry {
  /** Absolute path to the original slide HTML file */
  sourcePath: string;
  /** md5(filePath + mtime) cache key */
  cacheKey: string;
  /** Absolute path to the cached PNG thumbnail */
  thumbnailPath: string;
  /** Unix timestamp when thumbnail was generated */
  generatedAt: number;
}

/**
 * Cache index structure stored in index.json.
 * AC-26: Cache index stored in .slide-builder/cache/thumbnails/index.json
 */
export interface ThumbnailCacheIndex {
  version: 1;
  entries: ThumbnailCacheEntry[];
}

// =============================================================================
// Brand Asset Data Model (cv-4-1)
// Architecture Reference: ADR-007 — Brand Asset Metadata in JSON Sidecar
// =============================================================================

export type BrandAssetType = 'icon' | 'logo' | 'image';

export const SUPPORTED_IMAGE_FORMATS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'] as const;

export interface BrandAsset {
  id: string;
  name: string;
  type: BrandAssetType;
  path: string;
  relativePath: string;
  description: string;
  tags: string[];
  dimensions?: { width: number; height: number };
  fileSize: number;
  format: string;
  lastModified: number;
  webviewUri?: string;
  /** v3-4-1: Color intelligence metadata (auto-detected or manually overridden) */
  colorMetadata?: ColorMetadata;
}

export interface BrandAssetMetadata {
  path: string;
  name: string;
  type: BrandAssetType;
  description: string;
  tags: string[];
}

export interface BrandAssetCatalog {
  version: 1;
  assets: BrandAssetMetadata[];
}

export type AssetSubCategory = 'all' | 'images' | 'icons' | 'logos';

// =============================================================================
// Color Metadata for Brand Asset Intelligence (v3-4-1)
// Architecture Reference: ADR-V3-003, ADR-V3-006
// =============================================================================

export interface ColorMetadata {
  backgroundAffinity: 'light' | 'dark' | 'both' | 'any';
  hasTransparency: boolean;
  dominantColors: string[]; // hex values, max 5
  contrastNeeds: 'high' | 'medium' | 'low';
  assetType: 'logo' | 'icon' | 'photo' | 'illustration' | 'shape';
  manualOverride: boolean;
}

// =============================================================================
// Per-Type Brand Asset Catalog Schemas
// Story Reference: story-brand-catalog-sync-1 — Per-type catalog matching
// =============================================================================

export interface IconCatalogEntry {
  id: string;
  name: string;
  description: string;
  file: string;
  base_icon: string;
  size: number;
  backgroundAffinity: 'light' | 'dark' | 'both' | 'any';
  hasTransparency: boolean;
  dominantColors: string[];
  contrastNeeds: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface IconCatalog {
  version: string;
  icons: IconCatalogEntry[];
}

export interface LogoVariant {
  variant_id: string;
  file: string;
}

export interface LogoCatalogEntry {
  id: string;
  name: string;
  description: string;
  variants: LogoVariant[];
  tags: string[];
}

export interface LogoCatalog {
  version: string;
  logos: LogoCatalogEntry[];
}

export interface ImagesCatalogEntry {
  id: string;
  name: string;
  description: string;
  file: string;
  tags: string[];
  category?: string;
}

export interface ImagesCatalog {
  version: string;
  images: ImagesCatalogEntry[];
}

// =============================================================================
// Operation Form System (v3-5-1)
// Story Reference: v3-5-1 AC-1 to AC-5
// Architecture Reference: ADR-V3-005 — Configuration-driven form system
// =============================================================================

/**
 * Form configuration for an operation.
 * Defines whether the operation uses a modal form or quick input.
 * Story Reference: v3-5-1 AC-1
 */
export interface FormConfig {
  /** Form type: 'modal' for complex forms, 'quick-input' for single field */
  type: 'modal' | 'quick-input';
  /** Title displayed at top of modal (modal only) */
  title?: string;
  /** Field definitions for the form (modal only) */
  fields?: FormFieldConfig[];
  /** Placeholder text (quick-input only) */
  placeholder?: string;
  /** Whether input is required (quick-input only) */
  required?: boolean;
  /** Target skill command to invoke with form data */
  operation: string;
  /** Custom submit button label (defaults to "Submit") */
  submitLabel?: string;
}

/**
 * Configuration for a single form field.
 * Story Reference: v3-5-1 AC-1, AC-2
 */
export interface FormFieldConfig {
  /** Unique field name used as key in form data */
  name: string;
  /** Display label shown above the field */
  label: string;
  /** Input type determines the rendered component */
  type: 'text' | 'textarea' | 'number' | 'select' | 'folder-picker';
  /** Whether this field must have a value to submit */
  required: boolean;
  /** Hint text shown in empty field */
  placeholder?: string;
  /** Options for select field type */
  options?: { label: string; value: string }[];
  /** Optional validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

/**
 * Validation error for a form field.
 * Story Reference: v3-5-1 AC-2
 */
export interface FormValidationError {
  /** Field name that has the error */
  field: string;
  /** User-friendly error message */
  message: string;
}

/**
 * Data submitted from an operation form.
 * Story Reference: v3-5-1 AC-3
 */
export interface FormSubmissionData {
  /** Target operation/skill to invoke */
  operation: string;
  /** Form field values keyed by field name */
  data: Record<string, unknown>;
  /** Submission timestamp for tracking */
  timestamp: number;
}

// =============================================================================
// Build Progress (cv-3-5)
// Story Reference: cv-3-5 AC29-AC40
// Architecture Reference: ADR-005 - File-system-driven build progress
// =============================================================================

/**
 * Overall build progress state for a deck.
 * Tracks the status of all slides being built.
 */
export interface BuildProgress {
  deckId: string;
  deckName: string;
  status: 'idle' | 'building' | 'complete' | 'cancelled' | 'error';
  slides: BuildSlideStatus[];
  startedAt: number;      // Epoch timestamp
  completedAt?: number;   // Epoch timestamp (if complete/cancelled)
}

/**
 * Per-slide build status within a build operation.
 */
export interface BuildSlideStatus {
  number: number;
  name: string;           // Slide title/intent snippet
  status: 'pending' | 'building' | 'built' | 'error';
  errorMessage?: string;  // Populated if status === 'error'
  htmlPath?: string;      // Path to built HTML file (if built)
  thumbnailUri?: string;  // Webview URI once generated
}

// =============================================================================
// Message Protocol: Extension -> Webview
// Architecture Reference: notes/architecture/architecture.md#Message Protocol
// =============================================================================

export type ExtensionMessage =
  | { type: 'plan-updated'; plan: PlanData; validationWarnings: ValidationWarning[] }
  | { type: 'templates-loaded'; templates: TemplateCatalogEntry[] }
  | { type: 'theme-loaded'; theme: ThemeConfig | null }
  | { type: 'confidence-scores'; scores: Record<number, TemplateScore[]> }
  | { type: 'build-status-changed'; slideNumber: number; status: BuildStatus }
  | { type: 'deck-build-status'; hasBuiltSlides: boolean }
  | { type: 'build-all-result'; allBuilt: boolean; totalCount: number };

// =============================================================================
// Message Protocol: Webview -> Extension
// =============================================================================

export type WebviewMessage =
  | { type: 'edit-slide'; slideNumber: number; field: string; value: unknown }
  | { type: 'add-slide'; afterSlideNumber: number; sectionId: string }
  | { type: 'delete-slide'; slideNumber: number }
  | { type: 'reorder-slide'; slideNumber: number; newIndex: number; newSectionId?: string }
  | { type: 'build-slide'; slideNumber: number }
  | { type: 'build-all' }
  | { type: 'open-claude'; slideNumber?: number; instruction?: string }
  | { type: 'open-slide-viewer' }
  | { type: 'ready' };

// =============================================================================
// Type Guards for Message Handling
// =============================================================================

export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    [
      'plan-updated',
      'templates-loaded',
      'theme-loaded',
      'confidence-scores',
      'build-status-changed',
    ].includes((msg as { type: string }).type)
  );
}

export function isWebviewMessage(msg: unknown): msg is WebviewMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    [
      'edit-slide',
      'add-slide',
      'delete-slide',
      'reorder-slide',
      'build-slide',
      'build-all',
      'open-claude',
      'ready',
    ].includes((msg as { type: string }).type)
  );
}

// =============================================================================
// Catalog Data Model
// =============================================================================

/**
 * Catalog tab identifiers.
 * Story Reference: cv-1-2 Task 7 — Shared catalog types
 */
export type CatalogTab = 'decks' | 'brand-assets' | 'templates';

export type DeckStatus = 'planned' | 'partial' | 'built' | 'error';

export interface DeckInfo {
  id: string;
  name: string;
  path: string;
  slideCount: number;
  builtSlideCount: number;
  status: DeckStatus;
  thumbnailUri?: string;
  lastModified: number;
  audience?: string;
  /** Parent folder ID (undefined = root level). Story cv-3-3 AC-17 */
  folderId?: string;
  /** Absolute path to first built slide HTML for thumbnail generation. Story cv-5-3 AC-19 */
  firstSlidePath?: string;
}

/**
 * Folder information for deck organization.
 * Folders are physical directories under output/ containing deck subdirectories.
 *
 * Story Reference: cv-3-3 AC-17, AC-23
 */
export interface FolderInfo {
  /** Folder directory name (used as ID) */
  id: string;
  /** Display name (same as directory name) */
  name: string;
  /** Relative path from workspace root */
  path: string;
  /** Number of decks inside this folder */
  deckCount: number;
  /** Most recent modification timestamp */
  lastModified: number;
}

export interface SlideInfo {
  number: number;
  intent?: string;
  template?: string;
  status: 'planned' | 'built' | 'error';
  htmlPath?: string;
  thumbnailUri?: string;
}

export interface DeckDetail extends DeckInfo {
  slides: SlideInfo[];
  planPath: string;
  viewerPath?: string;
}

export interface NavigationEntry {
  id: string;
  label: string;
  type: 'tab-root' | 'deck-detail' | 'folder';
}

// =============================================================================
// Catalog State & Actions
// =============================================================================

export interface CatalogState {
  activeTab: CatalogTab;
  navigationStack: NavigationEntry[];
  decks: DeckInfo[];
  /** Folders for deck organization. Story cv-3-3 AC-17 */
  folders: FolderInfo[];
  searchQuery: string;
  statusFilters: DeckStatus[];
  selectedDeckId: string | null;
  deckDetail: DeckDetail | null;
  viewMode: 'grid' | 'list';
  /** Current folder ID when drilled into a folder (undefined = root). Story cv-3-3 AC-20 */
  currentFolderId?: string;
}

export type CatalogAction =
  | { type: 'SET_TAB'; tab: CatalogTab }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_FILTER'; status: DeckStatus }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'NAVIGATE_TO_DECK'; deckId: string }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'SET_DECKS'; decks: DeckInfo[] }
  | { type: 'SET_VIEW_MODE'; mode: 'grid' | 'list' }
  | { type: 'SET_DECK_DETAIL'; deck: DeckDetail | null }
  /** Story cv-3-3: Folder operations */
  | { type: 'SET_FOLDERS'; folders: FolderInfo[] }
  | { type: 'NAVIGATE_TO_FOLDER'; folderId: string }
  | { type: 'SET_NEW_FOLDER'; folderId: string };

// =============================================================================
// Catalog Message Protocol: Extension -> Webview (cv-1-3)
// =============================================================================

export type CatalogExtensionMessage =
  | { type: 'catalog-data'; decks: DeckInfo[]; folders: FolderInfo[] }
  | { type: 'deck-detail'; deck: DeckDetail }
  | { type: 'deck-created'; deckId: string }
  | { type: 'folder-created'; folderId: string }
  | { type: 'build-triggered'; deckId: string; mode: 'all' | 'one' }
  /** Story cv-3-5: Build progress updates */
  | { type: 'build-progress'; progress: BuildProgress }
  /** Story cv-4-1: Brand asset data */
  | { type: 'brand-assets'; assets: BrandAsset[] }
  /** Story cv-4-4: Browse files result */
  | { type: 'browse-files-result'; paths: string[] }
  /** Story cv-4-4: Asset operation success */
  | { type: 'asset-operation-success'; operation: 'add' | 'update' | 'delete' | 'duplicate'; count?: number }
  /** Story cv-4-4: Asset operation error */
  | { type: 'asset-operation-error'; operation: string; message: string }
  /** Story cv-5-1, cv-5-2: Template catalog data */
  | { type: 'templates'; slideTemplates: SlideTemplateDisplay[]; deckTemplates: DeckTemplateDisplay[] }
  /** Story cv-5-3: Thumbnail ready notification */
  | { type: 'thumbnail-ready'; id: string; uri: string }
  /** Story v3-2-1: View preference persistence (Extension → Webview) */
  | { type: 'view-preference'; mode: 'grid' | 'list' }
  /** Story v3-2-3: Template metadata loaded (Extension → Webview) */
  | { type: 'template-metadata'; templateId: string; metadata: TemplateMetadata }
  /** Story v3-2-3: Template metadata save acknowledgment (Extension → Webview) */
  | { type: 'template-metadata-saved'; templateId: string; success: boolean }
  /** Story tm-1-1: Slide template schema save acknowledgment (Extension → Webview) */
  | { type: 'slide-template-schema-saved'; templateId: string; success: boolean }
  /** Story tm-1-3: Slide template delete acknowledgment (Extension → Webview) */
  | { type: 'slide-template-deleted'; templateId: string; success: boolean }
  /** Story tm-1-4: Slide template reorder acknowledgment (Extension → Webview) */
  | { type: 'slide-templates-reordered'; success: boolean }
  /** Story v3-4-1: Color metadata updated for a brand asset */
  | { type: 'color-metadata-updated'; assetId: string; metadata: ColorMetadata }
  /** Story v3-4-2: Batch analysis progress */
  | { type: 'batch-analysis-progress'; current: number; total: number }
  /** Story v3-4-2: Batch analysis complete */
  | { type: 'batch-analysis-complete'; results: { assetId: string; success: boolean; error?: string }[] }
  /** Story v3-5-1: Form submission acknowledgment (Extension → Webview) */
  | { type: 'form-submitted-ack'; operationId: string; success: boolean; error?: string }
  /** Story v4-1-1: Deck template config loaded (Extension → Webview) */
  | { type: 'deck-template-config'; templateId: string; config: DeckTemplateConfig }
  /** Story v4-1-1: Deck template config save result (Extension → Webview) */
  | { type: 'deck-template-config-saved'; templateId: string; success: boolean; error?: string }
  /** Story v4-1-1: Slide HTML preview for element highlighting (Extension → Webview) */
  | { type: 'deck-template-slide-preview'; templateId: string; slideNumber: number; html: string }
  /** Story tm-2-3: Deck template delete acknowledgment (Extension → Webview) */
  | { type: 'deck-template-deleted'; templateId: string; success: boolean }
  /** Story tm-3-2: Deck template files changed externally — triggers catalog refresh (Extension → Webview) */
  | { type: 'deck-templates-updated' }
  /** Story bt-1-1: Brand theme existence status (Extension → Webview) */
  | { type: 'brand-status'; hasTheme: boolean }
  /** Story bt-1-2: Folder picker result from native OS dialog (Extension → Webview) */
  | { type: 'folder-picked'; path: string }
  /** Story bt-1-2: Trigger brand setup modal from Command Palette (Extension → Webview) */
  | { type: 'open-brand-setup' }
  /** Story rename-deck-1: Deck renamed confirmation (Extension → Webview) */
  | { type: 'deck-renamed'; deckId: string; newName: string }
  | { type: 'error'; message: string; context?: string };

// =============================================================================
// Catalog Message Protocol: Webview -> Extension (cv-1-3)
// =============================================================================

export type CatalogWebviewMessage =
  | { type: 'ready' }
  | { type: 'request-deck-detail'; deckId: string }
  | { type: 'open-plan-editor'; deckId: string }
  | { type: 'open-slide-viewer'; deckId: string }
  | { type: 'present-deck'; deckId: string }
  | { type: 'build-deck'; deckId: string; mode: 'all' | 'one'; slideNumber?: number }
  | { type: 'create-deck'; method: 'from-template'; templateId?: string }
  | { type: 'duplicate-deck'; deckId: string }
  | { type: 'delete-deck'; deckId: string }
  /** Story cv-3-3: Folder operations */
  | { type: 'create-folder'; parentId?: string }
  | { type: 'rename-folder'; folderId: string; newName: string }
  | { type: 'delete-folder'; folderId: string }
  | { type: 'move-deck'; deckId: string; targetFolderId?: string }
  /** Story cv-3-5: Cancel build operation */
  | { type: 'cancel-build'; deckId: string }
  /** Story cv-4-4: Browse for asset files */
  | { type: 'browse-files'; assetType: BrandAssetType }
  /** Story cv-4-4: Add brand assets */
  | { type: 'add-brand-assets'; paths: string[]; assetType: BrandAssetType; description?: string; tags?: string[] }
  /** Story cv-4-5: Update brand asset metadata */
  | { type: 'update-brand-asset'; id: string; updates: Partial<Pick<BrandAssetMetadata, 'name' | 'description' | 'tags'>> }
  /** Story cv-4-5: Delete brand asset */
  | { type: 'delete-brand-asset'; id: string }
  /** Story cv-4-5: Duplicate brand asset */
  | { type: 'duplicate-brand-asset'; id: string }
  /** Story cv-4-5: Copy asset path to clipboard */
  | { type: 'copy-asset-path'; relativePath: string }
  /** Story cv-5-1: Request template catalog data */
  | { type: 'request-templates' }
  /** Story cv-5-2: Use deck template to create new deck */
  | { type: 'use-deck-template'; templateId: string }
  /** Story cv-5-3: Request thumbnail for a deck/slide */
  | { type: 'request-thumbnail'; id: string; sourcePath: string }
  /** Story v3-2-1: View preference persistence (Webview → Extension) */
  | { type: 'set-view-preference'; mode: 'grid' | 'list' }
  /** Story v3-2-3: Load template metadata for editing (Webview → Extension) */
  | { type: 'load-template-metadata'; templateId: string }
  /** Story v3-2-3: Save template metadata after editing (Webview → Extension) */
  | { type: 'save-template-metadata'; templateId: string; metadata: TemplateMetadata }
  /** Story tm-1-1: Save slide template schema fields (Webview → Extension) */
  | { type: 'save-slide-template-schema'; templateId: string; schema: SlideTemplateSchema }
  /** Story tm-1-3: Delete slide template (Webview → Extension) */
  | { type: 'delete-slide-template'; templateId: string }
  /** Story tm-1-4: Reorder slide templates (Webview → Extension) */
  | { type: 'reorder-slide-templates'; templateIds: string[] }
  /** Story cv-5-4: Bulk delete decks */
  | { type: 'delete-decks'; deckIds: string[] }
  /** Story cv-5-4: Bulk delete brand assets */
  | { type: 'delete-brand-assets'; ids: string[] }
  /** Story cv-5-4: Bulk delete slides from a deck */
  | { type: 'delete-slides'; deckId: string; slideNumbers: number[] }
  /** Story cv-5-4: Move multiple decks to a folder */
  | { type: 'move-decks-to-folder'; deckIds: string[]; targetFolderId: string }
  /** Story v3-4-2: Update color metadata for a brand asset */
  | { type: 'update-color-metadata'; assetId: string; metadata: Partial<ColorMetadata> }
  /** Story v3-4-2: Start batch analysis of all assets */
  | { type: 'start-batch-analysis' }
  /** Story v3-5-1: Submit operation form data (Webview → Extension) */
  | { type: 'submit-operation-form'; operation: string; data: Record<string, unknown> }
  /** Story v4-1-1: Load deck template config (Webview → Extension) */
  | { type: 'load-deck-template-config'; templateId: string }
  /** Story v4-1-1: Save full deck template config (Webview → Extension) */
  | { type: 'save-deck-template-config'; templateId: string; config: DeckTemplateConfig }
  /** Story v4-1-1: Save slide instructions only (Webview → Extension) */
  | { type: 'save-slide-instructions'; templateId: string; slideNumber: number; instructions: string }
  /** Story v4-1-1: Save content sources only (Webview → Extension) */
  | { type: 'save-content-sources'; templateId: string; slideNumber: number; sources: ContentSource[] }
  /** Story v4-1-1: Request slide HTML for preview (Webview → Extension) */
  | { type: 'request-slide-preview'; templateId: string; slideNumber: number }
  /** Story tm-2-1: Inspect deck template — open DeckTemplateDetail panel (Webview → Extension) */
  | { type: 'inspect-deck-template'; templateId: string }
  /** Story tm-2-2: Preview deck template slide in SlideViewerV2Panel (Webview → Extension) */
  | { type: 'preview-deck-template-slide'; templateId: string; slideFile: string }
  /** Story 1.2: Preview slide template in SlideViewerV2Panel (Webview → Extension) */
  | { type: 'preview-slide-template'; templateId: string }
  /** Story tm-2-3: Delete deck template (Webview → Extension) */
  | { type: 'delete-deck-template'; templateId: string }
  /** Story bt-1-1: Open theme editor (Webview → Extension) */
  | { type: 'open-theme-editor' }
  /** Story bt-1-1: Launch AI theme edit via Claude Code (Webview → Extension) */
  | { type: 'launch-ai-theme-edit' }
  /** Story bt-1-2: Request native OS folder picker via extension host (Webview → Extension) */
  | { type: 'pick-folder' }
  /** Story rename-deck-1: Rename deck display name and/or directory slug (Webview → Extension) */
  | { type: 'rename-deck'; deckId: string; newName?: string; newSlug?: string };

// =============================================================================
// Viewer Data Model
// Story Reference: cv-2-1 Task 1
// =============================================================================

export interface ViewerState {
  deckId: string;
  deckName: string;
  currentSlide: number; // 1-based index
  totalSlides: number;
  slides: ViewerSlideInfo[];
  isLoading: boolean;
}

export interface ViewerSlideInfo {
  number: number; // 1-based
  thumbnailUri?: string; // Webview-safe URI to thumbnail
  title?: string; // Slide intent/title for accessibility
}

export interface ViewerDeckContent {
  deckId: string;
  deckName: string;
  slideCount: number;
  viewerHtmlUri: string; // Webview URI for iframe src (patched .vscode-viewer.html)
  slides: ViewerSlideInfo[];
  planPath: string; // For "Edit Plan" navigation
}

// =============================================================================
// Viewer Message Protocol: Extension -> Webview
// =============================================================================

export type ViewerExtensionMessage =
  | { type: 'deck-loaded'; deck: ViewerDeckContent }
  | { type: 'rebuilding' }
  | { type: 'refreshed' }
  | { type: 'error'; message: string };

// =============================================================================
// Viewer Message Protocol: Webview -> Extension
// =============================================================================

export type ViewerWebviewMessage =
  | { type: 'ready' }
  | { type: 'navigate'; slideNumber: number }
  | { type: 'open-plan-editor' }
  | { type: 'present' }
  | { type: 'rebuild' };

// =============================================================================
// Viewer Type Guards
// =============================================================================

export function isViewerExtensionMessage(msg: unknown): msg is ViewerExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    ['deck-loaded', 'rebuilding', 'refreshed', 'error'].includes((msg as { type: string }).type)
  );
}

export function isViewerWebviewMessage(msg: unknown): msg is ViewerWebviewMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    ['ready', 'navigate', 'open-plan-editor', 'present', 'rebuild'].includes(
      (msg as { type: string }).type
    )
  );
}

// =============================================================================
// Viewer Template Context (tm-3-5)
// Story Reference: tm-3-5 AC-5 — Template context threading from editor to viewer
// =============================================================================

/**
 * Context passed from DeckTemplateEditorPanel to SlideViewerV2Panel when
 * previewing a deck template slide. Enables the viewer to show an Edit button
 * and assemble edit prompts with the correct template/slide references.
 */
export interface ViewerTemplateContext {
  templateId: string;
  slideFile: string;
  slideName: string;
}

// =============================================================================
// Viewer V2 Data Model (v2-1-1)
// Story Reference: v2-1-1 AC-6 - V2 message types with v2- prefix
// Architecture Reference: ADR-008 — v2- Message Prefix Convention
// =============================================================================

/**
 * Individual slide content for V2 viewer (direct HTML rendering, no iframe).
 */
export interface ViewerV2SlideContent {
  number: number;        // 1-based slide number
  html: string;          // Full HTML content of the slide
  fileName: string;      // Original filename (e.g., "slide-1.html")
  slideId: string;       // Unique ID derived from filename
  title: string;         // Slide title/intent for accessibility
}

/**
 * Animation group definition in manifest.
 * v2-2-3: Build animation groups for step-by-step reveal.
 */
export interface ViewerV2AnimationGroup {
  id: string;           // Unique group identifier (e.g., "group-1")
  order: number;        // Display order (1-based)
  elementIds: string[]; // HTML element IDs to animate together
  colorIndex: number;   // Color index for visual grouping in editor
}

/**
 * Animation definition for a slide.
 */
export interface ViewerV2SlideAnimations {
  groups: ViewerV2AnimationGroup[];
}

/**
 * Manifest entry for a single slide (from manifest.json).
 */
export interface ViewerV2ManifestSlide {
  number: number;
  fileName: string;
  title: string;
  template?: string;
  slideId?: string;                      // Unique slide identifier
  animations?: ViewerV2SlideAnimations;  // Animation build groups
  /** @deprecated Use animations.groups instead */
  buildGroups?: string[][];              // Legacy format
}

/**
 * Deck manifest structure (from output/{deckId}/manifest.json).
 */
export interface ViewerV2Manifest {
  deckId: string;
  deckName: string;
  slideCount: number;
  plannedSlideCount?: number; // Total slides in plan.yaml (for build badge)
  slides: ViewerV2ManifestSlide[];
  generatedAt: string;   // ISO 8601 timestamp
}

/**
 * Complete deck content sent to V2 viewer webview.
 */
export interface ViewerV2DeckContent {
  deckId: string;
  deckName: string;
  slides: ViewerV2SlideContent[];
  manifest: ViewerV2Manifest;
  planPath: string;      // For "Edit Plan" navigation
}

/**
 * Webview-only UI state for V2 viewer (not persisted to extension).
 */
export interface ViewerV2UIState {
  currentSlide: number;       // 1-based index
  isLoading: boolean;
  error: string | null;
  sidebarVisible: boolean;
  fullscreenMode: 'view' | 'edit' | null;  // v3-1: null = not fullscreen, 'view' = presentation, 'edit' = text editing
  currentBuildStep: number;   // For animation builds (0 = all visible)
}

/**
 * Export progress state for batch PNG/PDF operations.
 * v2-5-1: Webview-only state tracked in ViewerContext.
 */
export interface ExportProgress {
  current: number;        // Current slide being exported (1-based)
  total: number;          // Total slides to export
  format: 'png' | 'pdf'; // Export type in progress
  preset?: string;        // PDF quality preset name (e.g., 'standard', 'compact')
}

/**
 * Options for Puppeteer slide capture format and quality.
 * story-1.1 AC-1,2: Supports JPEG with quality or PNG (default).
 */
export interface CaptureOptions {
  format: 'png' | 'jpeg';
  quality?: number; // JPEG quality 0-100 (ignored for PNG)
}

/**
 * PDF quality preset type for export UI.
 * story-1.1 AC-1: Three presets balancing quality vs file size.
 */
export type PdfQualityPreset = 'best' | 'standard' | 'compact';

/**
 * PDF quality preset definitions with capture options and metadata.
 * story-1.1 AC-1: Maps preset names to capture format/quality settings.
 */
export const PDF_QUALITY_PRESETS: Record<PdfQualityPreset, {
  label: string;
  format: 'png' | 'jpeg';
  quality?: number;
  description: string;
}> = {
  best: {
    label: 'Best Quality',
    format: 'png',
    description: 'Lossless PNG capture, largest file size',
  },
  standard: {
    label: 'Standard',
    format: 'jpeg',
    quality: 82,
    description: 'JPEG capture at high quality, good balance of size and fidelity',
  },
  compact: {
    label: 'Compact',
    format: 'jpeg',
    quality: 65,
    description: 'JPEG capture at moderate quality, smallest file size',
  },
};

// =============================================================================
// Viewer V2 Message Protocol: Extension -> Webview (v2-1-1)
// All V2 messages use v2- prefix per ADR-008
// =============================================================================

export type ViewerV2ExtensionMessage =
  | { type: 'v2-deck-loaded'; deck: ViewerV2DeckContent }
  | { type: 'v2-slide-updated'; slideNumber: number; html: string }
  | { type: 'v2-manifest-updated'; manifest: ViewerV2Manifest }
  | { type: 'v2-save-result'; success: boolean; fileName: string; error?: string }
  | { type: 'v2-rebuilding' }
  | { type: 'v2-refreshed' }
  | { type: 'v2-reorder-result'; success: boolean; error?: string }
  | { type: 'v2-error'; message: string }
  | { type: 'v2-export-ready'; format: 'png' | 'pdf'; fileName: string }
  | { type: 'v2-export-folder-ready' }
  | { type: 'v2-export-cancelled' }
  | { type: 'v2-capture-result'; requestId: string; dataUri: string }
  | { type: 'v2-capture-error'; requestId: string; error: string }
  | { type: 'v2-edit-started'; success: boolean; error?: string }
  /** Story 1.2: Animate with AI launch result (AC-10, AC-11) */
  | { type: 'v2-animate-started'; success: boolean; error?: string }
  /** Story tm-3-5: Template context for viewer Edit button (AC-5) */
  | { type: 'v2-template-context'; context: ViewerTemplateContext }
  /** Story lv-1-1: Build started signal for auto-open viewer (AC-7) */
  | { type: 'v2-build-started'; mode: 'all' | 'one' | 'resume'; totalSlides: number; startSlide: number; buildId: string }
  /** Story lv-2-1 AC-7: Build progress update for live slide navigation */
  | { type: 'v2-build-progress'; currentSlide: number; totalSlides: number; builtCount: number; status: 'building' | 'built' | 'error' }
  /** Story lv-2-2 AC-19: Build completion signal with outcome details */
  | { type: 'v2-build-complete'; builtCount: number; errorCount: number; cancelled: boolean }
  /** Story story-viewer-add-slide-1: Add slide result from extension */
  | { type: 'v2-add-slide-started'; success: boolean; error?: string; newSlideNumber?: number };

// =============================================================================
// Viewer V2 Message Protocol: Webview -> Extension (v2-1-1)
// =============================================================================

export type ViewerV2WebviewMessage =
  | { type: 'v2-ready' }
  | { type: 'v2-navigate'; slideNumber: number }
  | { type: 'v2-open-plan-editor' }
  | { type: 'v2-rebuild' }
  | { type: 'v2-present' }
  | { type: 'v2-save-slide'; slideNumber: number; html: string }
  | { type: 'v2-toggle-sidebar' }
  | { type: 'v2-toggle-fullscreen' }
  | { type: 'v2-enter-fullscreen'; mode: 'view' | 'edit' }
  | { type: 'v2-exit-fullscreen' }
  | { type: 'v2-reorder-slides'; newOrder: number[] }
  | { type: 'v2-save-animations'; slideNumber: number; groups: ViewerV2AnimationGroup[] }
  | { type: 'v2-export-file'; format: 'png' | 'pdf'; data: string; fileName: string; deckId?: string }
  | { type: 'v2-capture-slide'; requestId: string; html: string; captureOptions?: CaptureOptions }
  | { type: 'v2-batch-complete'; total: number; errorCount: number }
  | { type: 'v2-edit-with-ai'; instruction: string; slideNumber: number }
  /** Story 1.2: Animate with AI request (AC-4, AC-5) */
  | { type: 'v2-animate-with-ai'; instruction: string; slideNumber: number }
  /** Story tm-3-5: Submit edit form from viewer toolbar (AC-3, AC-4) */
  | { type: 'v2-submit-edit-form'; operation: string; data: Record<string, unknown> }
  /** Story story-viewer-add-slide-1 AC-7: Add slide request with position and description */
  | { type: 'v2-add-slide'; position: number | 'end'; description: string };

// =============================================================================
// Viewer V2 Type Guards (v2-1-1)
// =============================================================================

/**
 * Type guard for V2 extension messages.
 * Returns true if msg is a valid ViewerV2ExtensionMessage.
 */
export function isViewerV2ExtensionMessage(msg: unknown): msg is ViewerV2ExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    [
      'v2-deck-loaded',
      'v2-slide-updated',
      'v2-manifest-updated',
      'v2-save-result',
      'v2-rebuilding',
      'v2-refreshed',
      'v2-reorder-result',
      'v2-error',
      'v2-export-ready',
      'v2-export-folder-ready',
      'v2-export-cancelled',
      'v2-capture-result',
      'v2-capture-error',
      'v2-edit-started',
      'v2-animate-started',
      'v2-template-context',
      'v2-build-started',
      'v2-build-progress',
      'v2-build-complete',
      'v2-add-slide-started',
    ].includes((msg as { type: string }).type)
  );
}

/**
 * Type guard for V2 webview messages.
 * Returns true if msg is a valid ViewerV2WebviewMessage.
 */
export function isViewerV2WebviewMessage(msg: unknown): msg is ViewerV2WebviewMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    [
      'v2-ready',
      'v2-navigate',
      'v2-open-plan-editor',
      'v2-rebuild',
      'v2-present',
      'v2-save-slide',
      'v2-toggle-sidebar',
      'v2-toggle-fullscreen',
      'v2-enter-fullscreen',
      'v2-exit-fullscreen',
      'v2-reorder-slides',
      'v2-save-animations',
      'v2-export-file',
      'v2-capture-slide',
      'v2-batch-complete',
      'v2-edit-with-ai',
      'v2-animate-with-ai',
      'v2-submit-edit-form',
      'v2-add-slide',
    ].includes((msg as { type: string }).type)
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extracts agenda sections from PlanData, supporting both formats:
 * - agenda_sections: AgendaSection[] (older/direct format)
 * - agenda.sections: AgendaSection[] (newer/nested format from plan-deck workflow)
 *
 * @param plan - The plan data object
 * @returns Array of agenda sections, or empty array if none found
 */
export function getAgendaSections(plan: PlanData | null): AgendaSection[] {
  if (!plan) return [];
  // Prefer nested agenda.sections (newer format), fall back to agenda_sections
  return plan.agenda?.sections ?? plan.agenda_sections ?? [];
}

// =============================================================================
// Deck Template Configuration Types (v4-1-1)
// Story Reference: v4-1-1 AC-1, AC-2, AC-3
// Architecture Reference: .slide-builder/CONVENTIONS.md#Template Config Schema
// =============================================================================

/**
 * Context variable definition for deck template required/optional context.
 * Maps to the required_context and optional_context arrays in template-config.yaml.
 */
export interface ContextVariable {
  /** Variable name used for template substitution (e.g., "client_name") */
  name: string;
  /** Data type of the variable */
  type: 'string' | 'date' | 'number';
  /** Human-readable description */
  description: string;
  /** Question to ask user (required_context only) */
  prompt?: string;
  /** Default value (optional_context only) */
  default?: string;
}

/**
 * Content source definition for populating slide placeholders.
 * Maps to the content_sources array entries in template-config.yaml.
 */
export interface ContentSource {
  /** Source type determines how placeholder data is acquired */
  type: 'web_search' | 'file' | 'mcp_tool' | 'user_input';
  /** Search query template (web_search) */
  query?: string;
  /** Fields to extract from search results (web_search) */
  extract?: string[];
  /** File path to read content from (file) */
  path?: string;
  /** MCP tool name to invoke (mcp_tool) */
  tool?: string;
  /** Form field name for user input (user_input) */
  field?: string;
  /** Fallback instruction if primary source fails (user_input) */
  fallback?: string;
}

/**
 * Per-slide configuration within a deck template.
 * Maps to individual entries in the slides array of template-config.yaml.
 */
export interface SlideConfig {
  /** Slide order (1-indexed) */
  number: number;
  /** Slide display name */
  name: string;
  /** Path to HTML file relative to template folder (e.g., "slides/slide-1.html") */
  file: string;
  /** Multiline agent instructions for content replacement */
  instructions: string;
  /** Data sources for populating slide placeholders */
  content_sources: ContentSource[];
}

/**
 * Quality checkpoint configuration for deck template instantiation.
 * Maps to the checkpoints section of template-config.yaml.
 */
export interface TemplateCheckpoint {
  /** Whether to validate after each slide is built */
  after_each_slide: boolean;
  /** List of validation rules to check */
  validation_rules: string[];
  /** User interaction behavior on various conditions */
  user_interaction: {
    on_incomplete: 'ask' | 'skip' | 'error';
    on_uncertain: 'ask' | 'skip';
    on_quality_fail: 'ask' | 'retry';
  };
}

/**
 * Complete deck template configuration.
 * Maps to the full template-config.yaml file schema.
 */
export interface DeckTemplateConfig {
  /** Template display name */
  name: string;
  /** Template purpose description */
  description: string;
  /** Semantic version string */
  version: string;
  /** Total number of slides in the template */
  slide_count: number;
  /** Context variables the user must provide */
  required_context: ContextVariable[];
  /** Context variables with defaults (agent can infer or ask) */
  optional_context: ContextVariable[];
  /** Per-slide configuration with instructions and content sources */
  slides: SlideConfig[];
  /** Quality checkpoint settings */
  checkpoints: TemplateCheckpoint;
}

// =============================================================================
// Theme Editor Data Model
// Story Reference: bt-2-1 Task 1.5 — ThemeJson interface and sub-interfaces
// Architecture Reference: notes/architecture.md — ThemeJson type expansion
// =============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: { default: string; alt: string; light?: string; dark: string; darkAlt?: string };
  text: { heading: string; body: string; muted?: string; onDark: string; onLight?: string; onPrimary?: string };
  brand?: Record<string, string>;
  dataViz?: { palette: string[]; positive?: string; negative?: string; neutral?: string; highlight?: string };
  semantic?: { success?: string; warning?: string; error?: string; info?: string };
}

export interface ThemeTypography {
  fonts: { heading: string; body: string; mono?: string };
  scale: Record<string, string>;
  weights: Record<string, number>;
  lineHeight?: Record<string, number>;
}

export interface ThemeShapes {
  borderRadius: Record<string, string>;
  shadow: Record<string, string>;
  border: Record<string, string>;
}

export interface ThemeComponents {
  box?: Record<string, Record<string, string | undefined>>;
  arrow?: Record<string, { strokeWidth?: number; color?: string; headType?: string; curveStyle?: string }>;
  icon?: Record<string, Record<string, string | undefined>>;
  button?: Record<string, Record<string, string | undefined>>;
}

export interface ThemeWorkflowRules {
  rhythm?: {
    defaultMode?: string;
    maxConsecutiveDark?: number;
    maxConsecutiveLight?: number;
    forceBreakAfter?: number;
    roleOverrides?: Record<string, { backgroundMode?: string }>;
  };
  colorSchemes?: Record<string, unknown>;
  narrativeDefaults?: Record<string, unknown>;
}

export interface ThemeJson {
  name: string;
  version: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  shapes: ThemeShapes;
  components: ThemeComponents;
  slides?: Record<string, unknown>;
  gradients?: Record<string, string>;
  workflowRules?: ThemeWorkflowRules;
  personality?: {
    classification?: string;
    traits?: string[];
    guidance?: { do?: string[]; dont?: string[] };
  };
  meta?: {
    extractedFrom?: Record<string, string>;
    brandDescription?: string;
    confidence?: number;
    locked?: boolean;
    changeNotes?: string[];
  };
  /** Optional unstructured brand context: voice, design philosophy, color usage notes, etc. */
  brandContext?: Record<string, unknown>;
  /** Preserve unknown properties on save — prevents data loss */
  [key: string]: unknown;
}

// =============================================================================
// Theme Editor Message Protocol
// Story Reference: bt-2-1 Task 1.1, 1.2 — Discriminated union message types
// Architecture Reference: ADR-008 — theme-editor- prefixed discriminated unions
// =============================================================================

/**
 * Messages sent from the Theme Editor webview to the extension host.
 */
export type ThemeEditorWebviewMessage =
  | { type: 'theme-editor-ready' }
  | { type: 'theme-editor-save'; theme: ThemeJson }
  | { type: 'theme-editor-revert' }
  | { type: 'theme-editor-dirty'; isDirty: boolean }
  | { type: 'theme-editor-launch-edit' }
  | { type: 'theme-editor-launch-setup' };

/**
 * Messages sent from the extension host to the Theme Editor webview.
 */
export type ThemeEditorExtensionMessage =
  | { type: 'theme-editor-data'; theme: ThemeJson | null; exists: boolean }
  | { type: 'theme-editor-save-result'; success: boolean; error?: string }
  | { type: 'theme-editor-external-change'; theme: ThemeJson };

// =============================================================================
// Theme Editor Type Guards
// Story Reference: bt-2-1 Task 1.3, 1.4 — Type guard functions
// =============================================================================

const THEME_EDITOR_WEBVIEW_TYPES = [
  'theme-editor-ready',
  'theme-editor-save',
  'theme-editor-revert',
  'theme-editor-dirty',
  'theme-editor-launch-edit',
  'theme-editor-launch-setup',
] as const;

const THEME_EDITOR_EXTENSION_TYPES = [
  'theme-editor-data',
  'theme-editor-save-result',
  'theme-editor-external-change',
] as const;

/**
 * Type guard: validates that a message is a ThemeEditorWebviewMessage.
 */
export function isThemeEditorWebviewMessage(msg: unknown): msg is ThemeEditorWebviewMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    (THEME_EDITOR_WEBVIEW_TYPES as readonly string[]).includes((msg as { type: string }).type)
  );
}

/**
 * Type guard: validates that a message is a ThemeEditorExtensionMessage.
 */
export function isThemeEditorExtensionMessage(msg: unknown): msg is ThemeEditorExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    (THEME_EDITOR_EXTENSION_TYPES as readonly string[]).includes((msg as { type: string }).type)
  );
}
