import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  ViewerProvider,
  useViewerState,
  useViewerDispatch,
  useCurrentSlide,
  useIsFirstSlide,
  useIsLastSlide,
} from '../../src/webview/viewer/context/ViewerContext';
import type { ViewerV2DeckContent } from '../../src/shared/types';

/**
 * Tests for V2 Viewer context and reducer.
 * Story Reference: v2-1-1 Task 8.4
 */
describe('ViewerContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ViewerProvider>{children}</ViewerProvider>
  );

  describe('useViewerState', () => {
    it('provides initial state with isLoading true', () => {
      const { result } = renderHook(() => useViewerState(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.slides).toEqual([]);
      expect(result.current.currentSlide).toBe(1);
      expect(result.current.error).toBe(null);
      expect(result.current.deckId).toBe(null);
      expect(result.current.deckName).toBe(null);
    });

    it('throws when used outside ViewerProvider', () => {
      const { result } = renderHook(() => {
        try {
          return useViewerState();
        } catch (e) {
          return e;
        }
      });

      expect(result.current).toBeInstanceOf(Error);
    });
  });

  describe('SET_DECK_CONTENT action', () => {
    it('updates state with deck content and sets isLoading false', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slides: [
          {
            number: 1,
            html: '<div>Slide 1</div>',
            fileName: 'slide-1.html',
            slideId: 'slide-1',
            title: 'First Slide',
          },
          {
            number: 2,
            html: '<div>Slide 2</div>',
            fileName: 'slide-2.html',
            slideId: 'slide-2',
            title: 'Second Slide',
          },
        ],
        manifest: {
          deckId: 'test-deck',
          deckName: 'Test Deck',
          slideCount: 2,
          slides: [
            { number: 1, fileName: 'slide-1.html', title: 'First Slide' },
            { number: 2, fileName: 'slide-2.html', title: 'Second Slide' },
          ],
          generatedAt: '2026-02-18',
        },
        planPath: '/path/to/plan.yaml',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.slides).toHaveLength(2);
      expect(result.current.state.deckId).toBe('test-deck');
      expect(result.current.state.deckName).toBe('Test Deck');
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.currentSlide).toBe(1);
    });
  });

  describe('SET_LOADING action', () => {
    it('updates isLoading state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', isLoading: false });
      });

      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR action', () => {
    it('sets error and clears loading', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_ERROR', error: 'Something went wrong' });
      });

      expect(result.current.state.error).toBe('Something went wrong');
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('SET_CURRENT_SLIDE action', () => {
    it('navigates to valid slide', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // First set up deck content
      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slides: [
          { number: 1, html: '', fileName: 'slide-1.html', slideId: '1', title: 'S1' },
          { number: 2, html: '', fileName: 'slide-2.html', slideId: '2', title: 'S2' },
          { number: 3, html: '', fileName: 'slide-3.html', slideId: '3', title: 'S3' },
        ],
        manifest: { deckId: 'test', deckName: 'Test', slideCount: 3, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: 2 });
      });

      expect(result.current.state.currentSlide).toBe(2);
    });

    it('ignores invalid slide number (too high)', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '', fileName: '', slideId: '', title: '' },
          { number: 2, html: '', fileName: '', slideId: '', title: '' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 2, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: 10 });
      });

      expect(result.current.state.currentSlide).toBe(1);
    });

    it('ignores invalid slide number (zero or negative)', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: 0 });
      });

      expect(result.current.state.currentSlide).toBe(1);
    });
  });

  describe('NAVIGATE_NEXT and NAVIGATE_PREV actions', () => {
    it('navigates forward and backward', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '', fileName: '', slideId: '', title: '' },
          { number: 2, html: '', fileName: '', slideId: '', title: '' },
          { number: 3, html: '', fileName: '', slideId: '', title: '' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 3, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // Navigate next
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_NEXT' });
      });
      expect(result.current.state.currentSlide).toBe(2);

      // Navigate next again
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_NEXT' });
      });
      expect(result.current.state.currentSlide).toBe(3);

      // Navigate next at end (wraps to slide 1, v2-1-3 AC2)
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_NEXT' });
      });
      expect(result.current.state.currentSlide).toBe(1);

      // Navigate prev at start (wraps to last slide, v2-1-3 AC3)
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_PREV' });
      });
      expect(result.current.state.currentSlide).toBe(3);

      // Navigate prev
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_PREV' });
      });
      expect(result.current.state.currentSlide).toBe(2);

      // Navigate prev again
      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_PREV' });
      });
      expect(result.current.state.currentSlide).toBe(1);
    });
  });

  describe('UPDATE_SLIDE action', () => {
    it('updates specific slide HTML', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '<div>Original</div>', fileName: '', slideId: '', title: '' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 1, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 1,
          html: '<div>Updated</div>',
        });
      });

      expect(result.current.state.slides[0].html).toBe('<div>Updated</div>');
    });
  });

  // story-viewer-upsert-1: UPDATE_SLIDE upsert behavior tests
  describe('UPDATE_SLIDE upsert behavior (story-viewer-upsert-1)', () => {
    it('AC #1: inserts new slide when slides array is empty', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Set loading false with empty slides (simulates viewer opened before build)
      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', isLoading: false });
      });

      expect(result.current.state.slides).toHaveLength(0);

      // Upsert slide 1 into empty array
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 1,
          html: '<div>Slide 1</div>',
        });
      });

      expect(result.current.state.slides).toHaveLength(1);
      expect(result.current.state.slides[0]).toEqual({
        number: 1,
        html: '<div>Slide 1</div>',
        fileName: 'slide-1.html',
        slideId: 'slide-1',
        title: 'Slide 1',
      });
    });

    it('AC #2: multiple out-of-order upserts maintain sorted order', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', isLoading: false });
      });

      // Insert slide 3 first
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 3,
          html: '<div>Slide 3</div>',
        });
      });

      // Insert slide 1
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 1,
          html: '<div>Slide 1</div>',
        });
      });

      // Insert slide 2
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 2,
          html: '<div>Slide 2</div>',
        });
      });

      expect(result.current.state.slides).toHaveLength(3);
      expect(result.current.state.slides[0].number).toBe(1);
      expect(result.current.state.slides[1].number).toBe(2);
      expect(result.current.state.slides[2].number).toBe(3);
    });

    it('AC #3: updates existing slide in place (regression test)', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '<div>Original 1</div>', fileName: 'slide-1.html', slideId: 'slide-1', title: 'Slide 1' },
          { number: 2, html: '<div>Original 2</div>', fileName: 'slide-2.html', slideId: 'slide-2', title: 'Slide 2' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 2, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // Update existing slide 1
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 1,
          html: '<div>Updated 1</div>',
        });
      });

      expect(result.current.state.slides).toHaveLength(2);
      expect(result.current.state.slides[0].html).toBe('<div>Updated 1</div>');
      expect(result.current.state.slides[0].fileName).toBe('slide-1.html'); // Preserves original metadata
      expect(result.current.state.slides[1].html).toBe('<div>Original 2</div>'); // Untouched
    });

    it('AC #4: build mode active auto-navigates on upsert', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Start build mode with empty slides
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'upsert-nav-test',
        });
      });

      // Upsert slide 3 into empty array during build mode
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 3,
          html: '<div>Slide 3</div>',
        });
      });

      expect(result.current.state.slides).toHaveLength(1);
      expect(result.current.state.currentSlide).toBe(3); // Auto-navigated
    });

    it('AC #5: upsert appends to existing slides in sorted position', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '<div>S1</div>', fileName: 'slide-1.html', slideId: 'slide-1', title: 'Slide 1' },
          { number: 2, html: '<div>S2</div>', fileName: 'slide-2.html', slideId: 'slide-2', title: 'Slide 2' },
          { number: 3, html: '<div>S3</div>', fileName: 'slide-3.html', slideId: 'slide-3', title: 'Slide 3' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 3, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // Upsert slide 4 — should append at end in sorted position
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 4,
          html: '<div>S4</div>',
        });
      });

      expect(result.current.state.slides).toHaveLength(4);
      expect(result.current.state.slides[3].number).toBe(4);
      expect(result.current.state.slides[3].html).toBe('<div>S4</div>');
      expect(result.current.state.slides[3].fileName).toBe('slide-4.html');
      // Verify existing slides untouched
      expect(result.current.state.slides[0].html).toBe('<div>S1</div>');
      expect(result.current.state.slides[1].html).toBe('<div>S2</div>');
      expect(result.current.state.slides[2].html).toBe('<div>S3</div>');
    });

    it('synthesizes correct metadata for upserted slides', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', isLoading: false });
      });

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 7,
          html: '<div>Slide 7</div>',
        });
      });

      const slide = result.current.state.slides[0];
      expect(slide.number).toBe(7);
      expect(slide.fileName).toBe('slide-7.html');
      expect(slide.slideId).toBe('slide-7');
      expect(slide.title).toBe('Slide 7');
    });
  });

  describe('TOGGLE_SIDEBAR and TOGGLE_FULLSCREEN actions', () => {
    it('toggles sidebar visibility', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      expect(result.current.state.sidebarVisible).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_SIDEBAR' });
      });

      expect(result.current.state.sidebarVisible).toBe(false);
    });

    it('enters fullscreen view mode', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      expect(result.current.state.fullscreenMode).toBeNull();

      act(() => {
        result.current.dispatch({ type: 'ENTER_FULLSCREEN_VIEW' });
      });

      expect(result.current.state.fullscreenMode).toBe('view');
    });

    it('exits fullscreen mode', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'ENTER_FULLSCREEN_VIEW' });
      });
      expect(result.current.state.fullscreenMode).toBe('view');

      act(() => {
        result.current.dispatch({ type: 'EXIT_FULLSCREEN' });
      });
      expect(result.current.state.fullscreenMode).toBeNull();
    });
  });

  describe('useCurrentSlide hook', () => {
    it('returns current slide content', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch(), currentSlide: useCurrentSlide() }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '<div>S1</div>', fileName: 'slide-1.html', slideId: '1', title: 'First' },
          { number: 2, html: '<div>S2</div>', fileName: 'slide-2.html', slideId: '2', title: 'Second' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 2, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      expect(result.current.currentSlide?.html).toBe('<div>S1</div>');

      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_NEXT' });
      });

      // Need to re-render to get updated currentSlide
      const { result: result2 } = renderHook(
        () => ({ currentSlide: useCurrentSlide(), state: useViewerState() }),
        { wrapper }
      );

      // Fresh hook call - state is reset, so we need to set it up again
      // This is expected behavior - each hook call gets fresh provider
    });
  });

  describe('useIsFirstSlide and useIsLastSlide hooks', () => {
    it('correctly identifies first and last slides', () => {
      const { result } = renderHook(
        () => ({
          dispatch: useViewerDispatch(),
          isFirst: useIsFirstSlide(),
          isLast: useIsLastSlide(),
        }),
        { wrapper }
      );

      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [
          { number: 1, html: '', fileName: '', slideId: '', title: '' },
          { number: 2, html: '', fileName: '', slideId: '', title: '' },
        ],
        manifest: { deckId: '', deckName: '', slideCount: 2, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // At slide 1
      expect(result.current.isFirst).toBe(true);
      expect(result.current.isLast).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'NAVIGATE_NEXT' });
      });

      // At slide 2
      expect(result.current.isFirst).toBe(false);
      expect(result.current.isLast).toBe(true);
    });
  });

  // ae-1-1: Edit with AI modal and in-flight state
  describe('OPEN_EDIT_MODAL action', () => {
    it('sets showEditModal to true', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      expect(result.current.state.showEditModal).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'OPEN_EDIT_MODAL' });
      });

      expect(result.current.state.showEditModal).toBe(true);
    });
  });

  describe('CLOSE_EDIT_MODAL action', () => {
    it('sets showEditModal to false', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'OPEN_EDIT_MODAL' });
      });
      expect(result.current.state.showEditModal).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'CLOSE_EDIT_MODAL' });
      });
      expect(result.current.state.showEditModal).toBe(false);
    });
  });

  describe('SET_AI_EDIT_IN_FLIGHT action', () => {
    it('sets aiEditInFlight to true', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      expect(result.current.state.aiEditInFlight).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: true });
      });

      expect(result.current.state.aiEditInFlight).toBe(true);
    });

    it('sets aiEditInFlight back to false', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: true });
      });
      expect(result.current.state.aiEditInFlight).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: false });
      });
      expect(result.current.state.aiEditInFlight).toBe(false);
    });
  });

  // tm-3-5: SET_TEMPLATE_CONTEXT action
  describe('SET_TEMPLATE_CONTEXT action', () => {
    it('sets templateContext with context object', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      expect(result.current.state.templateContext).toBe(null);

      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE_CONTEXT',
          context: {
            templateId: 'my-template',
            slideFile: 'slides/slide-1.html',
            slideName: 'slide-1.html',
          },
        });
      });

      expect(result.current.state.templateContext).toEqual({
        templateId: 'my-template',
        slideFile: 'slides/slide-1.html',
        slideName: 'slide-1.html',
      });
    });

    it('clears templateContext when set to null', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // First set a context
      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE_CONTEXT',
          context: {
            templateId: 'test',
            slideFile: 'test.html',
            slideName: 'test',
          },
        });
      });

      expect(result.current.state.templateContext).not.toBe(null);

      // Clear it
      act(() => {
        result.current.dispatch({
          type: 'SET_TEMPLATE_CONTEXT',
          context: null,
        });
      });

      expect(result.current.state.templateContext).toBe(null);
    });

    it('initial templateContext is null', () => {
      const { result } = renderHook(
        () => useViewerState(),
        { wrapper }
      );

      expect(result.current.templateContext).toBe(null);
    });
  });

  // lv-1-1: BUILD_STARTED action
  describe('BUILD_STARTED action (lv-1-1 AC-8, AC-9)', () => {
    it('activates build mode with correct state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'test-deck-12345',
        });
      });

      expect(result.current.state.buildMode.active).toBe(true);
      expect(result.current.state.buildMode.mode).toBe('all');
      expect(result.current.state.buildMode.totalSlides).toBe(5);
      expect(result.current.state.buildMode.currentSlide).toBe(1);
      expect(result.current.state.buildMode.buildId).toBe('test-deck-12345');
      expect(result.current.state.buildMode.status).toBe('building');
      expect(result.current.state.buildMode.builtCount).toBe(0);
      expect(result.current.state.buildMode.completedAt).toBe(null);
    });

    it('sets currentSlide to startSlide', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'one',
          totalSlides: 1,
          startSlide: 3,
          buildId: 'test-deck-67890',
        });
      });

      expect(result.current.state.currentSlide).toBe(3);
      expect(result.current.state.buildMode.mode).toBe('one');
    });

    it('initial buildMode is idle', () => {
      const { result } = renderHook(
        () => useViewerState(),
        { wrapper }
      );

      expect(result.current.buildMode.active).toBe(false);
      expect(result.current.buildMode.status).toBe('idle');
      expect(result.current.buildMode.buildId).toBe(null);
    });
  });

  // lv-2-1 AC-8: BUILD_PROGRESS reducer action
  describe('BUILD_PROGRESS action (lv-2-1 AC-8)', () => {
    it('updates buildMode counters correctly', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // First start a build
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 6,
          startSlide: 1,
          buildId: 'build-123',
        });
      });

      // Dispatch BUILD_PROGRESS
      act(() => {
        result.current.dispatch({
          type: 'BUILD_PROGRESS',
          currentSlide: 3,
          totalSlides: 6,
          builtCount: 2,
          status: 'building',
        });
      });

      expect(result.current.state.buildMode.currentSlide).toBe(3);
      expect(result.current.state.buildMode.builtCount).toBe(2);
      expect(result.current.state.buildMode.totalSlides).toBe(6);
    });

    it('does NOT change buildMode.active', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Start build
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'build-456',
        });
      });

      expect(result.current.state.buildMode.active).toBe(true);

      // Dispatch BUILD_PROGRESS
      act(() => {
        result.current.dispatch({
          type: 'BUILD_PROGRESS',
          currentSlide: 2,
          totalSlides: 5,
          builtCount: 1,
          status: 'building',
        });
      });

      // active should still be true
      expect(result.current.state.buildMode.active).toBe(true);
    });

    it('keeps buildMode.status as building when individual slide status is built', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'build-789',
        });
      });

      // Send progress with status 'built' (individual slide built)
      act(() => {
        result.current.dispatch({
          type: 'BUILD_PROGRESS',
          currentSlide: 3,
          totalSlides: 5,
          builtCount: 3,
          status: 'built',
        });
      });

      // buildMode.status should remain 'building' (the build is still active)
      expect(result.current.state.buildMode.status).toBe('building');
    });

    it('sets buildMode.status to error when status is error', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'build-err',
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'BUILD_PROGRESS',
          currentSlide: 2,
          totalSlides: 5,
          builtCount: 1,
          status: 'error',
        });
      });

      expect(result.current.state.buildMode.status).toBe('error');
    });
  });

  // lv-2-1 AC-1,3,4,5,10: UPDATE_SLIDE auto-navigation during build mode
  describe('UPDATE_SLIDE auto-navigation (lv-2-1 AC-1,3,4,5,10)', () => {
    const mockDeck: ViewerV2DeckContent = {
      deckId: 'test-deck',
      deckName: 'Test Deck',
      slides: [
        { number: 1, html: '<div>Slide 1</div>', fileName: 'slide-1.html', slideId: '1', title: 'S1' },
        { number: 2, html: '<div>Slide 2</div>', fileName: 'slide-2.html', slideId: '2', title: 'S2' },
        { number: 3, html: '<div>Slide 3</div>', fileName: 'slide-3.html', slideId: '3', title: 'S3' },
        { number: 4, html: '<div>Slide 4</div>', fileName: 'slide-4.html', slideId: '4', title: 'S4' },
        { number: 5, html: '<div>Slide 5</div>', fileName: 'slide-5.html', slideId: '5', title: 'S5' },
        { number: 6, html: '<div>Slide 6</div>', fileName: 'slide-6.html', slideId: '6', title: 'S6' },
      ],
      manifest: { deckId: 'test-deck', deckName: 'Test Deck', slideCount: 6, slides: [], generatedAt: '' },
      planPath: '',
    };

    it('AC-1: auto-navigates to slideNumber when buildMode.active is true', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // Start build mode
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 6,
          startSlide: 1,
          buildId: 'nav-test-1',
        });
      });

      // UPDATE_SLIDE for slide 3 should auto-navigate
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 3,
          html: '<div>Updated Slide 3</div>',
        });
      });

      expect(result.current.state.currentSlide).toBe(3);
      expect(result.current.state.slides[2].html).toBe('<div>Updated Slide 3</div>');
    });

    it('AC-10: does NOT auto-navigate when buildMode.active is false', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      // buildMode.active defaults to false
      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.currentSlide).toBe(1);

      // UPDATE_SLIDE for slide 3 should NOT change currentSlide
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SLIDE',
          slideNumber: 3,
          html: '<div>Updated Slide 3</div>',
        });
      });

      expect(result.current.state.currentSlide).toBe(1); // Unchanged
      expect(result.current.state.slides[2].html).toBe('<div>Updated Slide 3</div>');
    });

    it('AC-3: auto-navigate works for mode=all', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => { result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck }); });
      act(() => {
        result.current.dispatch({ type: 'BUILD_STARTED', mode: 'all', totalSlides: 6, startSlide: 1, buildId: 'mode-all' });
      });
      act(() => { result.current.dispatch({ type: 'UPDATE_SLIDE', slideNumber: 4, html: '<div>4</div>' }); });

      expect(result.current.state.currentSlide).toBe(4);
    });

    it('AC-3: auto-navigate works for mode=one', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => { result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck }); });
      act(() => {
        result.current.dispatch({ type: 'BUILD_STARTED', mode: 'one', totalSlides: 1, startSlide: 5, buildId: 'mode-one' });
      });
      act(() => { result.current.dispatch({ type: 'UPDATE_SLIDE', slideNumber: 5, html: '<div>5</div>' }); });

      expect(result.current.state.currentSlide).toBe(5);
    });

    it('AC-3: auto-navigate works for mode=resume', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => { result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck }); });
      act(() => {
        result.current.dispatch({ type: 'BUILD_STARTED', mode: 'resume', totalSlides: 6, startSlide: 3, buildId: 'mode-resume' });
      });
      act(() => { result.current.dispatch({ type: 'UPDATE_SLIDE', slideNumber: 4, html: '<div>4</div>' }); });

      expect(result.current.state.currentSlide).toBe(4);
    });

    it('AC-5: manual nav override -- next UPDATE_SLIDE navigates back to newly built slide', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => { result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck }); });
      act(() => {
        result.current.dispatch({ type: 'BUILD_STARTED', mode: 'all', totalSlides: 6, startSlide: 1, buildId: 'override-test' });
      });

      // User manually navigates to slide 1
      act(() => { result.current.dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: 1 }); });
      expect(result.current.state.currentSlide).toBe(1);

      // Next UPDATE_SLIDE for slide 6 should auto-navigate back
      act(() => { result.current.dispatch({ type: 'UPDATE_SLIDE', slideNumber: 6, html: '<div>6</div>' }); });
      expect(result.current.state.currentSlide).toBe(6);
    });
  });

  // lv-2-2 AC-20: BUILD_COMPLETE reducer action
  describe('BUILD_COMPLETE action (lv-2-2 AC-20)', () => {
    it('sets status=complete, active=false, completedAt when successful build', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Start a build first
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 12,
          startSlide: 1,
          buildId: 'complete-test-1',
        });
      });

      expect(result.current.state.buildMode.active).toBe(true);

      // Complete the build successfully
      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 12,
          errorCount: 0,
          cancelled: false,
        });
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('complete');
      expect(result.current.state.buildMode.builtCount).toBe(12);
      expect(result.current.state.buildMode.completedAt).toBeTypeOf('number');
    });

    it('sets status=cancelled when cancelled is true', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'cancel-test',
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 5,
          errorCount: 0,
          cancelled: true,
        });
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('cancelled');
      expect(result.current.state.buildMode.builtCount).toBe(5);
      expect(result.current.state.buildMode.completedAt).toBeTypeOf('number');
    });

    it('sets status=error when errorCount > 0', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'error-test',
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 8,
          errorCount: 2,
          cancelled: false,
        });
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('error');
      expect(result.current.state.buildMode.builtCount).toBe(8);
    });
  });

  // lv-2-2 AC-21: BUILD_DISMISSED reducer action
  describe('BUILD_DISMISSED action (lv-2-2 AC-21)', () => {
    it('resets buildMode to initialBuildMode from complete state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Start and complete a build
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'dismiss-test-1',
        });
      });
      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 5,
          errorCount: 0,
          cancelled: false,
        });
      });

      // Dismiss
      act(() => {
        result.current.dispatch({ type: 'BUILD_DISMISSED' });
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('idle');
      expect(result.current.state.buildMode.buildId).toBe(null);
      expect(result.current.state.buildMode.completedAt).toBe(null);
      expect(result.current.state.buildMode.builtCount).toBe(0);
      expect(result.current.state.buildMode.totalSlides).toBe(0);
    });

    it('resets buildMode to initialBuildMode from building state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'dismiss-building',
        });
      });

      expect(result.current.state.buildMode.active).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'BUILD_DISMISSED' });
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('idle');
    });

    it('resets buildMode to initialBuildMode from error state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'dismiss-error',
        });
      });
      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 8,
          errorCount: 2,
          cancelled: false,
        });
      });

      expect(result.current.state.buildMode.status).toBe('error');

      act(() => {
        result.current.dispatch({ type: 'BUILD_DISMISSED' });
      });

      expect(result.current.state.buildMode.status).toBe('idle');
      expect(result.current.state.buildMode.completedAt).toBe(null);
    });

    it('resets buildMode to initialBuildMode from cancelled state', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'dismiss-cancel',
        });
      });
      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 5,
          errorCount: 0,
          cancelled: true,
        });
      });

      expect(result.current.state.buildMode.status).toBe('cancelled');

      act(() => {
        result.current.dispatch({ type: 'BUILD_DISMISSED' });
      });

      expect(result.current.state.buildMode.status).toBe('idle');
      expect(result.current.state.buildMode.active).toBe(false);
    });
  });

  describe('RESET action', () => {
    it('resets state to initial values', () => {
      const { result } = renderHook(
        () => ({ state: useViewerState(), dispatch: useViewerDispatch() }),
        { wrapper }
      );

      // Set up some state
      const mockDeck: ViewerV2DeckContent = {
        deckId: 'test',
        deckName: 'Test',
        slides: [{ number: 1, html: '', fileName: '', slideId: '', title: '' }],
        manifest: { deckId: '', deckName: '', slideCount: 1, slides: [], generatedAt: '' },
        planPath: '',
      };

      act(() => {
        result.current.dispatch({ type: 'SET_DECK_CONTENT', deck: mockDeck });
      });

      expect(result.current.state.deckId).toBe('test');

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET' });
      });

      expect(result.current.state.deckId).toBe(null);
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.slides).toEqual([]);
    });
  });
});
