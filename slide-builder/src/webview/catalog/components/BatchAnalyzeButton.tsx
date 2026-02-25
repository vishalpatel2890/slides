/**
 * BatchAnalyzeButton - Triggers batch color analysis for brand assets.
 *
 * Story Reference: v3-4-2 AC-11, AC-13, AC-15
 * Architecture Reference: ADR-V3-006 — Non-breaking catalog schema extension
 *
 * AC-11: "Analyze All Assets" button triggers batch analysis
 * AC-13: Progress indicator (current/total) during processing
 * AC-15: Reports success/failure summary on completion
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';

interface BatchProgress {
  current: number;
  total: number;
}

interface BatchResult {
  assetId: string;
  success: boolean;
  error?: string;
}

export function BatchAnalyzeButton(): React.ReactElement {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: number; failed: number } | null>(null);

  // Listen for batch analysis progress and completion messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'batch-analysis-progress') {
        setProgress({
          current: message.current,
          total: message.total,
        });
      }

      if (message.type === 'batch-analysis-complete') {
        const results = message.results as BatchResult[];
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        setLastResult({ success: successCount, failed: failedCount });
        setIsAnalyzing(false);
        setProgress(null);
        setShowSummary(true);

        // Auto-hide summary after 5 seconds
        setTimeout(() => setShowSummary(false), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // AC-11: Handle click to start batch analysis
  const handleClick = useCallback(() => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setShowSummary(false);
    setLastResult(null);
    setProgress({ current: 0, total: 0 });

    getVSCodeApi().postMessage({
      type: 'start-batch-analysis',
    });
  }, [isAnalyzing]);

  // Render button content based on state
  const renderContent = () => {
    // AC-13: Show progress during analysis
    if (isAnalyzing && progress) {
      return (
        <>
          <Loader2 size={14} className="batch-analyze__spinner" />
          <span>
            {progress.total > 0
              ? `Analyzing ${progress.current}/${progress.total}...`
              : 'Starting analysis...'}
          </span>
        </>
      );
    }

    // AC-15: Show success/failure summary briefly after completion
    if (showSummary && lastResult) {
      if (lastResult.failed === 0) {
        return (
          <>
            <CheckCircle size={14} className="batch-analyze__icon--success" />
            <span>{lastResult.success} analyzed</span>
          </>
        );
      } else {
        return (
          <>
            <AlertCircle size={14} className="batch-analyze__icon--warning" />
            <span>
              {lastResult.success} done, {lastResult.failed} failed
            </span>
          </>
        );
      }
    }

    // Default state: ready to analyze
    return (
      <>
        <Sparkles size={14} />
        <span>Analyze Assets</span>
      </>
    );
  };

  return (
    <button
      type="button"
      className={`batch-analyze-btn${isAnalyzing ? ' batch-analyze-btn--analyzing' : ''}${showSummary ? ' batch-analyze-btn--summary' : ''}`}
      onClick={handleClick}
      disabled={isAnalyzing}
      aria-label="Analyze all brand assets for color metadata"
      aria-busy={isAnalyzing}
    >
      {renderContent()}
    </button>
  );
}
