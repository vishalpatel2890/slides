import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ViewerV2DeckContent, ViewerV2SlideContent, ViewerV2Manifest, ViewerV2AnimationGroup, ExportProgress, ViewerTemplateContext } from '../../../shared/types';

/**
 * Viewer mode state machine.
 * v2-3-1 AC-3.1.1: presentation ↔ live-edit toggle via E key.
 * Architecture Reference: Pattern 2 — Multi-Mode Viewer State Machine.
 * Modes are mutually exclusive: must exit one before entering another.
 */
export type ViewerMode = 'presentation' | 'live-edit' | 'animation-builder';

/**
 * Save status state machine for live edit.
 * v2-3-1 AC-3.1.7, AC-3.1.8
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Selectable element metadata for animation builder.
 * v2-4-2 AC-2: Stores element info discovered during DOM scan.
 */
export interface SelectableElement {
  buildId: string;    // data-build-id attribute value
  tagName: string;    // HTML tag name (h1, p, li, img, etc.)
  label: string;      // Human-readable label for UI display
  rect: DOMRect;      // Bounding rectangle for overlay positioning
  groupId?: string;   // If element belongs to an existing group
}

/**
 * Animation builder state for element selection and group creation.
 * v2-4-2 AC-2,3,5: State for animation builder mode.
 */
export interface AnimationBuilderState {
  selectedElementIds: string[];       // Currently selected element buildIds
  isScanning: boolean;                // True while scanning DOM for elements
  selectableElements: SelectableElement[];  // Discovered selectable elements
  focusedIndex: number;               // Index of focused element for keyboard nav (-1 = none)
  selectedGroupId: string | null;     // v2-4-4: ID of group selected for editing (null = none)
}

/**
 * Build mode state for live viewer auto-open.
 * Story Reference: lv-1-1 AC-8: BuildModeState interface with correct initial state.
 * Architecture Reference: ADR-LV-1 — Extend ViewerContext with buildMode fields.
 */
export interface BuildModeState {
  active: boolean;
  buildId: string | null;
  mode: 'all' | 'one' | 'resume' | null;
  totalSlides: number;
  currentSlide: number;
  builtCount: number;
  status: 'idle' | 'building' | 'complete' | 'error' | 'cancelled';
  completedAt: number | null;
}

/**
 * V2 Viewer state interface.
 * Story Reference: v2-1-1 Task 6.3
 * Story Reference: v2-2-3 AC1-11 - Animation playback state
 * Story Reference: v2-3-1 AC1-11 - Live text editing with save status
 */
export interface ViewerState {
  slides: ViewerV2SlideContent[];
  manifest: ViewerV2Manifest | null;  // v2-2-3: Manifest with animation groups
  currentSlide: number;  // 1-based index
  isLoading: boolean;
  error: string | null;
  deckId: string | null;
  deckName: string | null;
  sidebarVisible: boolean;
  fullscreenMode: 'view' | 'edit' | null;  // v3-1: null = not fullscreen
  currentBuildStep: number;  // For animation builds (0 = all visible)
  navigatedBackward: boolean;  // v2-2-3 AC-7: Track backward navigation for fully-built state
  mode: ViewerMode;  // v2-3-1: Current viewer mode
  saveStatus: SaveStatus;  // v2-3-1: Live edit save status
  builderState: AnimationBuilderState;  // v2-4-2: Animation builder mode state
  exportProgress: ExportProgress | null;  // v2-5-1: Export progress for batch operations
  showEditModal: boolean;  // ae-1-1: Edit with AI modal visibility
  aiEditInFlight: boolean;  // ae-1-1: AI edit request in flight
  showAnimateModal: boolean;  // story-1.2: Animate with AI modal visibility
  aiAnimateInFlight: boolean;  // story-1.2: Animate with AI request in flight
  showAddSlideModal: boolean;  // story-viewer-add-slide-1 AC-1: Add Slide modal visibility
  aiAddSlideInFlight: boolean;  // story-viewer-add-slide-1 AC-10: Add Slide request in flight
  pendingAddSlideNumber: number | null;  // story-viewer-add-slide-1: Pending new slide number after add
  templateContext: ViewerTemplateContext | null;  // tm-3-5: Template context for viewer Edit button
  buildMode: BuildModeState;  // lv-1-1: Build mode state for live viewer auto-open
}

/**
 * Initial state for the viewer.
 */
/**
 * Initial builder state (empty).
 */
/**
 * Initial build mode state (idle).
 * Story Reference: lv-1-1 AC-8
 */
const initialBuildMode: BuildModeState = {
  active: false,
  buildId: null,
  mode: null,
  totalSlides: 0,
  currentSlide: 0,
  builtCount: 0,
  status: 'idle',
  completedAt: null,
};

const initialBuilderState: AnimationBuilderState = {
  selectedElementIds: [],
  isScanning: false,
  selectableElements: [],
  focusedIndex: -1,
  selectedGroupId: null,
};

const initialState: ViewerState = {
  slides: [],
  manifest: null,
  currentSlide: 1,
  isLoading: true,
  error: null,
  deckId: null,
  deckName: null,
  sidebarVisible: true,
  fullscreenMode: null,
  currentBuildStep: 0,
  navigatedBackward: false,
  mode: 'presentation',
  saveStatus: 'idle',
  builderState: initialBuilderState,
  exportProgress: null,
  showEditModal: false,
  aiEditInFlight: false,
  showAnimateModal: false,
  aiAnimateInFlight: false,
  showAddSlideModal: false,
  aiAddSlideInFlight: false,
  pendingAddSlideNumber: null,
  templateContext: null,
  buildMode: initialBuildMode,
};

/**
 * Action types for the viewer reducer.
 */
export type ViewerAction =
  | { type: 'SET_DECK_CONTENT'; deck: ViewerV2DeckContent }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CURRENT_SLIDE'; slideNumber: number }
  | { type: 'NAVIGATE_NEXT' }
  | { type: 'NAVIGATE_PREV' }
  | { type: 'UPDATE_SLIDE'; slideNumber: number; html: string }
  | { type: 'SET_MANIFEST'; manifest: ViewerV2Manifest }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'ENTER_FULLSCREEN_VIEW' }
  | { type: 'ENTER_FULLSCREEN_EDIT' }
  | { type: 'EXIT_FULLSCREEN' }
  | { type: 'SET_BUILD_STEP'; step: number }
  | { type: 'ADVANCE_BUILD' }
  | { type: 'ENTER_EDIT_MODE' }
  | { type: 'EXIT_EDIT_MODE' }
  | { type: 'SET_SAVE_STATUS'; saveStatus: SaveStatus }
  | { type: 'REORDER_SLIDES'; newOrder: number[] }
  | { type: 'RESET' }
  // v2-4-2: Animation builder mode actions
  | { type: 'ENTER_BUILDER_MODE' }
  | { type: 'EXIT_BUILDER_MODE' }
  | { type: 'SET_SELECTABLE_ELEMENTS'; elements: SelectableElement[] }
  | { type: 'TOGGLE_ELEMENT_SELECTION'; buildId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FOCUSED_ELEMENT'; index: number }
  | { type: 'ADD_ANIMATION_GROUP'; slideNumber: number; group: ViewerV2AnimationGroup }
  // v2-4-3: Replace all animation groups for a slide (used for delete and reorder)
  | { type: 'SET_SLIDE_ANIMATION_GROUPS'; slideNumber: number; groups: ViewerV2AnimationGroup[] }
  // v2-4-4: Group selection for color coding
  | { type: 'SELECT_GROUP'; groupId: string }
  | { type: 'DESELECT_GROUP' }
  // v2-5-1: Export progress tracking
  | { type: 'SET_EXPORT_PROGRESS'; progress: ExportProgress }
  | { type: 'CLEAR_EXPORT_PROGRESS' }
  // ae-1-1: Edit with AI modal and in-flight state
  | { type: 'OPEN_EDIT_MODAL' }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'SET_AI_EDIT_IN_FLIGHT'; inFlight: boolean }
  // story-1.2: Animate with AI modal and in-flight state
  | { type: 'OPEN_ANIMATE_MODAL' }
  | { type: 'CLOSE_ANIMATE_MODAL' }
  | { type: 'SET_AI_ANIMATE_IN_FLIGHT'; inFlight: boolean }
  // story-viewer-add-slide-1: Add Slide modal and in-flight state
  | { type: 'OPEN_ADD_SLIDE_MODAL' }
  | { type: 'CLOSE_ADD_SLIDE_MODAL' }
  | { type: 'SET_AI_ADD_SLIDE_IN_FLIGHT'; inFlight: boolean }
  | { type: 'SET_PENDING_ADD_SLIDE'; slideNumber: number | null }
  // tm-3-5: Template context for viewer Edit button
  | { type: 'SET_TEMPLATE_CONTEXT'; context: ViewerTemplateContext | null }
  // lv-1-1: Build mode actions (AC-9)
  | { type: 'BUILD_STARTED'; mode: 'all' | 'one' | 'resume'; totalSlides: number; startSlide: number; buildId: string }
  // lv-2-1 AC-8: Build progress updates (currentSlide, builtCount, totalSlides)
  | { type: 'BUILD_PROGRESS'; currentSlide: number; totalSlides: number; builtCount: number; status: 'building' | 'built' | 'error' }
  // lv-2-2 AC-20: Build completion with outcome (complete/cancelled/error)
  | { type: 'BUILD_COMPLETE'; builtCount: number; errorCount: number; cancelled: boolean }
  // lv-2-2 AC-21: Dismiss build bar, reset buildMode to idle
  | { type: 'BUILD_DISMISSED' };

/**
 * Reducer for V2 viewer state.
 */
function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'SET_DECK_CONTENT':
      return {
        ...state,
        slides: action.deck.slides,
        manifest: action.deck.manifest,  // v2-2-3: Store manifest for animation groups
        deckId: action.deck.deckId,
        deckName: action.deck.deckName,
        isLoading: false,
        error: null,
        currentSlide: 1,
        currentBuildStep: 0,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };

    case 'SET_CURRENT_SLIDE':
      if (action.slideNumber < 1 || action.slideNumber > state.slides.length) {
        return state;
      }
      return {
        ...state,
        currentSlide: action.slideNumber,
        currentBuildStep: 0,  // Reset build step when changing slides
        navigatedBackward: false,  // Direct navigation is not backward
      };

    case 'NAVIGATE_NEXT':
      // v2-1-3 AC2: Wrap to slide 1 when at end
      if (state.slides.length === 0) return state;
      return {
        ...state,
        currentSlide: state.currentSlide >= state.slides.length ? 1 : state.currentSlide + 1,
        currentBuildStep: 0,
        navigatedBackward: false,  // Forward navigation
      };

    case 'NAVIGATE_PREV':
      // v2-1-3 AC3: Wrap to last slide when at beginning
      // v2-2-3 AC-7: Mark as backward navigation for fully-built state
      if (state.slides.length === 0) return state;
      return {
        ...state,
        currentSlide: state.currentSlide <= 1 ? state.slides.length : state.currentSlide - 1,
        currentBuildStep: 0,
        navigatedBackward: true,  // Backward navigation - previous slide should be fully built
      };

    case 'UPDATE_SLIDE': {
      // story-viewer-upsert-1: Upsert — update existing slide or insert new one
      const exists = state.slides.some((s) => s.number === action.slideNumber);
      let updatedSlides: ViewerV2SlideContent[];

      if (exists) {
        // Existing behavior: update in place
        updatedSlides = state.slides.map((slide) =>
          slide.number === action.slideNumber
            ? { ...slide, html: action.html }
            : slide
        );
      } else {
        // Upsert: create new entry and insert at sorted position
        const newSlide: ViewerV2SlideContent = {
          number: action.slideNumber,
          html: action.html,
          fileName: `slide-${action.slideNumber}.html`,
          slideId: `slide-${action.slideNumber}`,
          title: `Slide ${action.slideNumber}`,
        };
        updatedSlides = [...state.slides, newSlide].sort((a, b) => a.number - b.number);
      }

      // story-viewer-add-slide-2 AC#6: Auto-navigate when pending add-slide arrives
      if (state.pendingAddSlideNumber === action.slideNumber) {
        return {
          ...state,
          slides: updatedSlides,
          currentSlide: action.slideNumber,
          pendingAddSlideNumber: null,
        };
      }

      // lv-2-1 AC-1,3,4,5,10: Auto-navigate to newly updated slide during build mode
      // Checks only buildMode.active, not build mode type (mode-agnostic per ADR-LV-4)
      if (state.buildMode.active) {
        return {
          ...state,
          slides: updatedSlides,
          currentSlide: action.slideNumber,
        };
      }
      return {
        ...state,
        slides: updatedSlides,
      };
    }

    // v2-3-2 AC-7: Update manifest when file changes externally
    case 'SET_MANIFEST':
      return {
        ...state,
        manifest: action.manifest,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarVisible: !state.sidebarVisible,
      };

    case 'TOGGLE_FULLSCREEN':
      // Legacy: kept for backward compatibility during transition
      return {
        ...state,
        fullscreenMode: state.fullscreenMode !== null ? null : 'view',
      };

    // v3-1: Explicit fullscreen mode actions
    case 'ENTER_FULLSCREEN_VIEW':
      return {
        ...state,
        fullscreenMode: 'view',
      };

    case 'ENTER_FULLSCREEN_EDIT':
      return {
        ...state,
        fullscreenMode: 'edit',
      };

    case 'EXIT_FULLSCREEN':
      return {
        ...state,
        fullscreenMode: null,
      };

    case 'SET_BUILD_STEP':
      return {
        ...state,
        currentBuildStep: action.step,
      };

    case 'ADVANCE_BUILD':
      return {
        ...state,
        currentBuildStep: state.currentBuildStep + 1,
      };

    // v2-3-1 AC-3.1.1: Enter edit mode (mutually exclusive with animation-builder)
    case 'ENTER_EDIT_MODE':
      if (state.mode === 'animation-builder') return state; // Must exit animation-builder first
      return {
        ...state,
        mode: 'live-edit',
        saveStatus: 'idle',
      };

    // v2-3-1 AC-3.1.10: Exit edit mode
    case 'EXIT_EDIT_MODE':
      return {
        ...state,
        mode: 'presentation',
        saveStatus: 'idle',
      };

    // v2-3-1 AC-3.1.7, AC-3.1.8: Save status transitions
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.saveStatus,
      };

    // v2-4-1: Reorder slides after drag-and-drop or keyboard move
    case 'REORDER_SLIDES': {
      const { newOrder } = action;
      // Reorder slides array according to newOrder (array of original slide numbers)
      const reorderedSlides = newOrder.map((origNumber, index) => {
        const slide = state.slides.find((s) => s.number === origNumber);
        if (!slide) return state.slides[index]; // fallback
        return { ...slide, number: index + 1 }; // renumber sequentially
      });
      // Track current slide: find where the currently-viewed slide ended up
      const currentOrigNumber = state.slides[state.currentSlide - 1]?.number;
      const newPosition = newOrder.indexOf(currentOrigNumber);
      return {
        ...state,
        slides: reorderedSlides,
        currentSlide: newPosition >= 0 ? newPosition + 1 : 1,
        currentBuildStep: 0,
      };
    }

    case 'RESET':
      return initialState;

    // v2-4-2 AC-1,8: Enter animation builder mode (mutually exclusive with live-edit)
    case 'ENTER_BUILDER_MODE':
      // Guard: Cannot enter builder mode while in live-edit mode (AC-8)
      if (state.mode === 'live-edit') return state;
      return {
        ...state,
        mode: 'animation-builder',
        builderState: {
          ...initialBuilderState,
          isScanning: true,  // Signal to AnimationBuilder to scan DOM
        },
      };

    // v2-4-2 AC-9: Exit animation builder mode
    case 'EXIT_BUILDER_MODE':
      return {
        ...state,
        mode: 'presentation',
        builderState: initialBuilderState,
      };

    // v2-4-2 AC-2: Store discovered selectable elements
    case 'SET_SELECTABLE_ELEMENTS':
      return {
        ...state,
        builderState: {
          ...state.builderState,
          selectableElements: action.elements,
          isScanning: false,
        },
      };

    // v2-4-2 AC-3: Toggle element selection
    case 'TOGGLE_ELEMENT_SELECTION': {
      const { buildId } = action;
      const currentSelection = state.builderState.selectedElementIds;
      const isSelected = currentSelection.includes(buildId);
      return {
        ...state,
        builderState: {
          ...state.builderState,
          selectedElementIds: isSelected
            ? currentSelection.filter((id) => id !== buildId)
            : [...currentSelection, buildId],
        },
      };
    }

    // v2-4-2 AC-5: Clear selection after group creation
    case 'CLEAR_SELECTION':
      return {
        ...state,
        builderState: {
          ...state.builderState,
          selectedElementIds: [],
          focusedIndex: -1,
        },
      };

    // v2-4-2 AC-10: Set focused element index for keyboard navigation
    case 'SET_FOCUSED_ELEMENT':
      return {
        ...state,
        builderState: {
          ...state.builderState,
          focusedIndex: action.index,
        },
      };

    // v2-4-2 AC-4: Add animation group to manifest (optimistic update)
    case 'ADD_ANIMATION_GROUP': {
      if (!state.manifest) return state;
      const { slideNumber, group } = action;
      const slideIndex = slideNumber - 1;
      const updatedSlides = state.manifest.slides.map((slide, idx) => {
        if (idx !== slideIndex) return slide;
        const existingGroups = slide.animations?.groups ?? [];
        return {
          ...slide,
          animations: {
            groups: [...existingGroups, group],
          },
        };
      });
      return {
        ...state,
        manifest: {
          ...state.manifest,
          slides: updatedSlides,
        },
      };
    }

    // v2-4-3 AC-3,4: Replace all animation groups for a slide (delete, reorder)
    case 'SET_SLIDE_ANIMATION_GROUPS': {
      if (!state.manifest) return state;
      const { slideNumber: targetSlide, groups: newGroups } = action;
      const targetIndex = targetSlide - 1;
      const updatedManifestSlides = state.manifest.slides.map((slide, idx) => {
        if (idx !== targetIndex) return slide;
        return {
          ...slide,
          animations: {
            groups: newGroups,
          },
        };
      });
      return {
        ...state,
        manifest: {
          ...state.manifest,
          slides: updatedManifestSlides,
        },
      };
    }

    // v2-4-4 AC-1,4,5: Select a group for color coding
    case 'SELECT_GROUP':
      return {
        ...state,
        builderState: {
          ...state.builderState,
          selectedGroupId: action.groupId,
        },
      };

    // v2-4-4 AC-4,6: Deselect group, return overlays to default
    case 'DESELECT_GROUP':
      return {
        ...state,
        builderState: {
          ...state.builderState,
          selectedGroupId: null,
        },
      };

    // v2-5-1 AC-6,7,10: Export progress tracking
    case 'SET_EXPORT_PROGRESS':
      return {
        ...state,
        exportProgress: action.progress,
      };

    case 'CLEAR_EXPORT_PROGRESS':
      return {
        ...state,
        exportProgress: null,
      };

    // ae-1-1: Edit with AI modal actions
    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        showEditModal: true,
      };

    case 'CLOSE_EDIT_MODAL':
      return {
        ...state,
        showEditModal: false,
      };

    case 'SET_AI_EDIT_IN_FLIGHT':
      return {
        ...state,
        aiEditInFlight: action.inFlight,
      };

    // story-1.2: Animate with AI modal actions
    case 'OPEN_ANIMATE_MODAL':
      return {
        ...state,
        showAnimateModal: true,
      };

    case 'CLOSE_ANIMATE_MODAL':
      return {
        ...state,
        showAnimateModal: false,
      };

    case 'SET_AI_ANIMATE_IN_FLIGHT':
      return {
        ...state,
        aiAnimateInFlight: action.inFlight,
      };

    // story-viewer-add-slide-1: Add Slide modal actions
    case 'OPEN_ADD_SLIDE_MODAL':
      return {
        ...state,
        showAddSlideModal: true,
      };

    case 'CLOSE_ADD_SLIDE_MODAL':
      return {
        ...state,
        showAddSlideModal: false,
      };

    case 'SET_AI_ADD_SLIDE_IN_FLIGHT':
      return {
        ...state,
        aiAddSlideInFlight: action.inFlight,
      };

    case 'SET_PENDING_ADD_SLIDE':
      return {
        ...state,
        pendingAddSlideNumber: action.slideNumber,
      };

    // tm-3-5: Store template context from extension host
    case 'SET_TEMPLATE_CONTEXT':
      return {
        ...state,
        templateContext: action.context,
      };

    // lv-1-1 AC-9: BUILD_STARTED sets buildMode.active = true, all build fields, currentSlide = startSlide
    case 'BUILD_STARTED':
      return {
        ...state,
        buildMode: {
          active: true,
          buildId: action.buildId,
          mode: action.mode,
          totalSlides: action.totalSlides,
          currentSlide: action.startSlide,
          builtCount: 0,
          status: 'building',
          completedAt: null,
        },
        currentSlide: action.startSlide,
      };

    // lv-2-1 AC-8: BUILD_PROGRESS updates buildMode counters without changing buildMode.active
    case 'BUILD_PROGRESS':
      return {
        ...state,
        buildMode: {
          ...state.buildMode,
          currentSlide: action.currentSlide,
          builtCount: action.builtCount,
          totalSlides: action.totalSlides,
          // If status === 'built', keep buildMode.status as 'building' (individual slide built, not entire build)
          status: action.status === 'built' ? state.buildMode.status : action.status,
        },
      };

    // lv-2-2 AC-20: BUILD_COMPLETE ends build mode, sets status based on cancelled/errorCount flags
    case 'BUILD_COMPLETE': {
      const completionStatus: BuildModeState['status'] = action.cancelled
        ? 'cancelled'
        : action.errorCount > 0
          ? 'error'
          : 'complete';
      return {
        ...state,
        buildMode: {
          ...state.buildMode,
          active: false,
          builtCount: action.builtCount,
          status: completionStatus,
          completedAt: Date.now(),
        },
      };
    }

    // lv-2-2 AC-21: BUILD_DISMISSED resets buildMode to initial idle state
    case 'BUILD_DISMISSED':
      return {
        ...state,
        buildMode: initialBuildMode,
      };

    default:
      return state;
  }
}

/**
 * Context for viewer state.
 */
const ViewerStateContext = createContext<ViewerState | null>(null);

/**
 * Context for viewer dispatch.
 */
const ViewerDispatchContext = createContext<React.Dispatch<ViewerAction> | null>(null);

/**
 * Provider component for V2 viewer state.
 */
export function ViewerProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(viewerReducer, initialState);

  return (
    <ViewerStateContext.Provider value={state}>
      <ViewerDispatchContext.Provider value={dispatch}>
        {children}
      </ViewerDispatchContext.Provider>
    </ViewerStateContext.Provider>
  );
}

/**
 * Hook to access viewer state.
 */
export function useViewerState(): ViewerState {
  const state = useContext(ViewerStateContext);
  if (state === null) {
    throw new Error('useViewerState must be used within a ViewerProvider');
  }
  return state;
}

/**
 * Hook to access viewer dispatch.
 */
export function useViewerDispatch(): React.Dispatch<ViewerAction> {
  const dispatch = useContext(ViewerDispatchContext);
  if (dispatch === null) {
    throw new Error('useViewerDispatch must be used within a ViewerProvider');
  }
  return dispatch;
}

/**
 * Hook to access current slide content.
 */
export function useCurrentSlide(): ViewerV2SlideContent | null {
  const state = useViewerState();
  return state.slides[state.currentSlide - 1] ?? null;
}

/**
 * Hook to check if on first slide.
 */
export function useIsFirstSlide(): boolean {
  const state = useViewerState();
  return state.currentSlide === 1;
}

/**
 * Hook to check if on last slide.
 */
export function useIsLastSlide(): boolean {
  const state = useViewerState();
  return state.currentSlide === state.slides.length;
}
