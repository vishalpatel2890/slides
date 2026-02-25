import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import type {
  ViewerV2WebviewMessage,
  ViewerV2DeckContent,
  ViewerV2SlideContent,
  ViewerV2Manifest,
  ViewerV2ManifestSlide,
} from '../shared/types';
import type { CatalogDataService } from './CatalogDataService';
import type { FileWatcherService } from './FileWatcherService';
import type { PromptAssemblyService } from './PromptAssemblyService';
import { sendToClaudeCode } from './claude-code-integration';
import { CatalogViewProvider } from './CatalogViewProvider';
import { configService } from './extension';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';
import { parseYaml, getField, serializeYaml, renumberSlides } from './yaml-document';
import { isSeq } from 'yaml';
import { captureSlide } from './puppeteer-capture';

/**
 * Creates a message handler for the V2 Slide Viewer webview.
 * Routes ViewerV2WebviewMessage types (v2- prefixed) to appropriate handlers.
 *
 * Story Reference: v2-1-1 AC-6 - React app sends v2-ready message on mount
 * Story Reference: v2-1-2 AC-1,2,3 - Load and send deck content on v2-ready
 * Architecture Reference: ADR-008 — v2- Message Prefix Convention
 * Architecture Reference: ADR-005 — All Slide Content Sent to Webview on Init
 */
export function createViewerV2MessageHandler(
  webview: vscode.Webview,
  deckId: string,
  dataService: CatalogDataService,
  outputChannel: vscode.OutputChannel,
  fileWatcher?: FileWatcherService,
  promptAssemblyService?: PromptAssemblyService
): vscode.Disposable {
  const disposables: vscode.Disposable[] = [];

  // v2-5-1: Batch export folder — persists across messages within a batch operation
  let batchExportFolder: vscode.Uri | null = null;

  // story-ai-edit-refresh-1 AC#6: Track active AI edit polling per slide number
  const aiEditPolling = new Map<number, { interval: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout> }>();

  // story-viewer-add-slide-2 AC#5,7: Track active add-slide polling per slide number
  const addSlidePolling = new Map<number, { interval: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout> }>();

  const messageDisposable = webview.onDidReceiveMessage(
    async (message: ViewerV2WebviewMessage) => {
      outputChannel.appendLine(
        `ViewerV2MessageHandler [${deckId}]: Received ${message.type}`
      );

      switch (message.type) {
        case 'v2-ready': {
          // AC-6: React app sends v2-ready on mount
          // v2-1-2 AC-1,2,3: Load and send deck content

          // tm-2-2 bug fix: flush any pending messages queued before the SPA loaded.
          // For the synthetic __deck-template-preview__ deckId the preview payload is
          // delivered via the queue instead of loading from disk.
          const pendingMessages = SlideViewerV2Panel.flushPendingMessages(deckId);
          if (pendingMessages.length > 0) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: V2 viewer ready — flushing ${pendingMessages.length} pending message(s)`
            );
            for (const pending of pendingMessages) {
              await webview.postMessage(pending);
            }
            // For synthetic preview decks, the queued message IS the content — skip disk load.
            // For real decks (e.g. build-started queued), continue to load deck content below.
            if (deckId === '__deck-template-preview__') {
              break;
            }
          }

          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: V2 viewer ready — loading deck content`
          );
          try {
            const startTime = Date.now();
            const deckContent = await loadDeckContent(deckId, dataService, outputChannel);
            const loadTime = Date.now() - startTime;

            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Loaded ${deckContent.slides.length} slides in ${loadTime}ms`
            );

            await webview.postMessage({
              type: 'v2-deck-loaded',
              deck: deckContent,
            });
          } catch (error) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Error loading deck content: ${error}`
            );
            await webview.postMessage({
              type: 'v2-error',
              message: `Failed to load deck: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
          break;
        }

        case 'v2-navigate': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Navigate to slide ${message.slideNumber}`
          );
          // Navigation is handled client-side in V2, this is for logging/analytics
          break;
        }

        case 'v2-open-plan-editor': {
          // Open plan.yaml in the Plan Editor
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Opening plan editor`
          );
          try {
            // Use findDeckUri to support decks in folders (cv-3-3)
            const deckUri = await dataService.findDeckUri(deckId);
            const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');
            await vscode.commands.executeCommand('vscode.open', planUri);
          } catch (error) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Error opening plan: ${error}`
            );
          }
          break;
        }

        case 'v2-rebuild': {
          // v2-2-1 AC-8: Trigger rebuild via Claude Code
          // lv-1-1 AC-6: Send v2-build-started to viewer for build mode
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Rebuild requested`
          );
          try {
            // Get deck path for the build command
            const deckUri = await dataService.findDeckUri(deckId);
            const deckPath = deckUri.fsPath;

            // Build command for Claude Code (same pattern as catalog-message-handler)
            const buildCommand = `/sb-create:build-all --deck "${deckPath}"`;
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Build All command: ${buildCommand}`
            );

            // lv-1-1 AC-6, AC-7: Send v2-build-started to the viewer (already open)
            const buildId = `${deckId}-${Date.now()}`;
            let totalSlides = 0;
            let startSlide = 1;
            try {
              const deckDetail = await dataService.getDeckDetail(deckId);
              if (deckDetail) {
                totalSlides = deckDetail.slides.length;
                const firstPending = deckDetail.slides.find(s => s.status !== 'built');
                if (firstPending) {
                  startSlide = firstPending.number;
                }
              }
            } catch (detailError) {
              outputChannel.appendLine(
                `[BuildViewer] Viewer rebuild: could not get deck detail: ${detailError}`
              );
            }

            await webview.postMessage({
              type: 'v2-build-started',
              mode: 'all' as const,
              totalSlides,
              startSlide,
              buildId,
            });
            outputChannel.appendLine(
              `[BuildViewer] Viewer rebuild: v2-build-started sent for '${deckId}' buildId='${buildId}'`
            );

            // Send to Claude Code sidebar (opens sidebar, copies command to clipboard)
            // Story Reference: vscode-config-2 AC-7 through AC-14
            await sendToClaudeCode(buildCommand, outputChannel, undefined, {
              launchMode: configService.readSettings().claudeCode.launchMode,
              position: configService.readSettings().claudeCode.position
            });

            // Notify catalog sidebar to show build progress (cv-3-5)
            CatalogViewProvider.postMessage({
              type: 'build-triggered',
              deckId,
              mode: 'all',
            });

            // Notify V2 viewer webview that rebuild was triggered
            await webview.postMessage({ type: 'v2-rebuilding' });
          } catch (error) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Error triggering rebuild: ${error}`
            );
            await webview.postMessage({
              type: 'v2-error',
              message: `Failed to trigger rebuild: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
          break;
        }

        case 'v2-present': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Present deck requested`
          );
          // Trigger present via command
          try {
            await vscode.commands.executeCommand('slideBuilder.presentDeck', deckId);
          } catch (error) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Error triggering present: ${error}`
            );
          }
          break;
        }

        case 'v2-save-slide': {
          // v2-3-1 AC-3.1.6: Write edited slide HTML to disk
          const slideNumber = message.slideNumber;
          const html = message.html;

          // Validate slideNumber is positive integer
          if (!Number.isInteger(slideNumber) || slideNumber < 1) {
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Invalid slide number: ${slideNumber}`
            );
            await webview.postMessage({
              type: 'v2-save-result',
              success: false,
              fileName: '',
              error: `Invalid slide number: ${slideNumber}`,
            });
            break;
          }

          const fileName = `slide-${slideNumber}.html`;
          try {
            const deckUri = await dataService.findDeckUri(deckId);
            const slideUri = vscode.Uri.joinPath(deckUri, 'slides', fileName);
            const encoder = new TextEncoder();
            const content = encoder.encode(html);

            await vscode.workspace.fs.writeFile(slideUri, content);

            // v2-3-2 AC-4,5: Suppress the file watcher to prevent self-triggered refresh
            fileWatcher?.suppressNextRefresh(deckId);

            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Save: ${fileName} (${content.byteLength} bytes)`
            );

            await webview.postMessage({
              type: 'v2-save-result',
              success: true,
              fileName,
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Save failed: ${fileName} - ${errorMsg}`
            );
            await webview.postMessage({
              type: 'v2-save-result',
              success: false,
              fileName,
              error: errorMsg,
            });
          }
          break;
        }

        case 'v2-toggle-sidebar': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Toggle sidebar (client-side only)`
          );
          // Sidebar toggle is handled client-side, this is for logging
          break;
        }

        case 'v2-toggle-fullscreen': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Toggle fullscreen (client-side only)`
          );
          // Fullscreen toggle is handled client-side, this is for logging
          break;
        }

        // v3-1: Explicit fullscreen mode messages
        case 'v2-enter-fullscreen': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Enter fullscreen mode=${message.mode} (client-side only)`
          );
          break;
        }

        case 'v2-exit-fullscreen': {
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Exit fullscreen (client-side only)`
          );
          break;
        }

        case 'v2-reorder-slides': {
          // v2-4-1 AC-4,5: Reorder slides in manifest.json and plan.yaml
          const { newOrder } = message;
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Reorder slides - newOrder: [${newOrder.join(', ')}]`
          );

          try {
            const deckUri = await dataService.findDeckUri(deckId);
            const slidesUri = vscode.Uri.joinPath(deckUri, 'slides');
            const manifestUri = vscode.Uri.joinPath(slidesUri, 'manifest.json');
            const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');
            const encoder = new TextEncoder();

            // v2-4-1 AC-4: Update manifest.json
            const manifestBytes = await vscode.workspace.fs.readFile(manifestUri);
            const manifestData = JSON.parse(new TextDecoder().decode(manifestBytes));

            // Create map of original number -> slide entry
            const slideMap = new Map<number, ViewerV2ManifestSlide>();
            for (const slide of manifestData.slides || []) {
              slideMap.set(slide.number, slide);
            }

            // Reorder and renumber slides according to newOrder
            const reorderedSlides: ViewerV2ManifestSlide[] = [];
            for (let i = 0; i < newOrder.length; i++) {
              const originalNum = newOrder[i];
              const slide = slideMap.get(originalNum);
              if (slide) {
                reorderedSlides.push({
                  ...slide,
                  number: i + 1, // Renumber sequentially
                });
              }
            }
            manifestData.slides = reorderedSlides;
            manifestData.slideCount = reorderedSlides.length;

            // Suppress file watcher before writes (ADR-007)
            fileWatcher?.suppressNextRefresh(deckId);

            // Write updated manifest.json
            await vscode.workspace.fs.writeFile(
              manifestUri,
              encoder.encode(JSON.stringify(manifestData, null, 2))
            );
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Reorder: manifest.json updated`
            );

            // v2-4-1 AC-5: Update plan.yaml with comment preservation
            try {
              const planBytes = await vscode.workspace.fs.readFile(planUri);
              const planText = new TextDecoder().decode(planBytes);
              const planDoc = parseYaml(planText);

              const slidesNode = planDoc.getIn(['slides'], true);
              if (isSeq(slidesNode)) {
                // Create map of original number -> slide node
                const nodeMap = new Map<number, unknown>();
                for (let i = 0; i < slidesNode.items.length; i++) {
                  const slideNum = planDoc.getIn(['slides', i, 'number']);
                  if (typeof slideNum === 'number') {
                    nodeMap.set(slideNum, slidesNode.items[i]);
                  }
                }

                // Reorder nodes according to newOrder
                const reorderedNodes: unknown[] = [];
                for (const originalNum of newOrder) {
                  const node = nodeMap.get(originalNum);
                  if (node) {
                    reorderedNodes.push(node);
                  }
                }

                // Replace slides array items
                slidesNode.items.length = 0;
                for (const node of reorderedNodes) {
                  slidesNode.items.push(node as never);
                }

                // Renumber all slides 1..N
                renumberSlides(planDoc);

                // Write plan.yaml with comment preservation
                const updatedPlanText = serializeYaml(planDoc);
                await vscode.workspace.fs.writeFile(planUri, encoder.encode(updatedPlanText));
                outputChannel.appendLine(
                  `ViewerV2MessageHandler [${deckId}]: Reorder: plan.yaml updated with comments preserved`
                );
              }
            } catch (planError) {
              // Plan.yaml update is best-effort — manifest.json is primary source
              outputChannel.appendLine(
                `ViewerV2MessageHandler [${deckId}]: Reorder: plan.yaml update failed (non-fatal): ${planError}`
              );
            }

            // Send success result
            await webview.postMessage({
              type: 'v2-reorder-result',
              success: true,
            });

            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Reorder: ${newOrder.length} slides reordered successfully`
            );
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Reorder failed: ${errorMsg}`
            );
            await webview.postMessage({
              type: 'v2-reorder-result',
              success: false,
              error: errorMsg,
            });
          }
          break;
        }

        case 'v2-save-animations': {
          // v2-4-2 AC-4: Save animation groups to manifest.json
          const { slideNumber, groups } = message;
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Save animations - slide ${slideNumber}, ${groups.length} groups`
          );

          try {
            const deckUri = await dataService.findDeckUri(deckId);
            const slidesUri = vscode.Uri.joinPath(deckUri, 'slides');
            const manifestUri = vscode.Uri.joinPath(slidesUri, 'manifest.json');
            const encoder = new TextEncoder();

            // Read current manifest.json
            const manifestBytes = await vscode.workspace.fs.readFile(manifestUri);
            const manifestData = JSON.parse(new TextDecoder().decode(manifestBytes));

            // Find and update the slide's animations
            const slideIdx = slideNumber - 1;
            if (manifestData.slides && manifestData.slides[slideIdx]) {
              // Initialize animations object if it doesn't exist
              if (!manifestData.slides[slideIdx].animations) {
                manifestData.slides[slideIdx].animations = { groups: [] };
              }
              // Update groups array
              manifestData.slides[slideIdx].animations.groups = groups;
            }

            // Suppress file watcher before write (ADR-007)
            fileWatcher?.suppressNextRefresh(deckId);

            // Write updated manifest.json
            await vscode.workspace.fs.writeFile(
              manifestUri,
              encoder.encode(JSON.stringify(manifestData, null, 2))
            );

            outputChannel.appendLine(
              `[v2] Animations: saved ${groups.length} groups for slide-${slideNumber}`
            );

            // Send success result
            await webview.postMessage({
              type: 'v2-save-result',
              success: true,
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Save animations failed: ${errorMsg}`
            );
            await webview.postMessage({
              type: 'v2-save-result',
              success: false,
              error: errorMsg,
            });
          }
          break;
        }

        case 'v2-capture-slide': {
          // story-1.1 AC-1,2,3,4: Puppeteer slide capture with format/quality options
          const { requestId, html, captureOptions } = message;
          const captureFormat = captureOptions?.format ?? 'png';
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Capture slide as ${captureFormat} (requestId: ${requestId})`
          );

          try {
            const imageBuffer = await captureSlide(html, captureOptions);
            const mimeType = captureFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
            const dataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            await webview.postMessage({
              type: 'v2-capture-result',
              requestId,
              dataUri,
            });
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Capture complete (${imageBuffer.byteLength} bytes, ${captureFormat})`
            );
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Capture failed: ${errorMsg}`
            );
            await webview.postMessage({
              type: 'v2-capture-error',
              requestId,
              error: errorMsg,
            });
          }
          break;
        }

        case 'v2-export-file': {
          // v2-5-1: Handle export file from webview (PNG or PDF)
          // v2-5-2 AC-4: Use deck folder as default save path
          const { format, data, fileName, deckId: messageDeckId } = message;
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Export ${format} - ${fileName}`
          );

          try {
            if (data === '__batch_init__') {
              // v2-5-1 AC-6: Batch PNG init — show folder picker
              const folderUris = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Export Folder',
                title: 'Choose folder for exported slides',
              });

              if (folderUris && folderUris.length > 0) {
                batchExportFolder = folderUris[0];
                outputChannel.appendLine(
                  `ViewerV2MessageHandler [${deckId}]: Export batch folder: ${batchExportFolder.fsPath}`
                );
                await webview.postMessage({ type: 'v2-export-folder-ready' });
              } else {
                batchExportFolder = null;
                outputChannel.appendLine(
                  `ViewerV2MessageHandler [${deckId}]: Export batch cancelled by user`
                );
                await webview.postMessage({ type: 'v2-export-cancelled' });
              }
              break;
            }

            // Decode data URI to buffer.
            // jsPDF produces URIs with extra segments: data:application/pdf;filename=...;base64,...
            // so we split on ";base64," rather than using a strict regex.
            const base64Marker = ';base64,';
            const base64Index = data.indexOf(base64Marker);
            if (base64Index === -1) {
              throw new Error('Invalid data URI format — missing ;base64, marker');
            }
            const base64Data = data.slice(base64Index + base64Marker.length);
            const buffer = Buffer.from(base64Data, 'base64');

            if (format === 'png' && batchExportFolder) {
              // v2-5-1 AC-6,7: Batch PNG — write to selected folder
              const fileUri = vscode.Uri.joinPath(batchExportFolder, fileName);
              await vscode.workspace.fs.writeFile(fileUri, buffer);
              outputChannel.appendLine(
                `ViewerV2MessageHandler [${deckId}]: Export: ${fileName} written to batch folder (${buffer.byteLength} bytes)`
              );
              await webview.postMessage({
                type: 'v2-export-ready',
                format: 'png',
                fileName,
              });
            } else {
              // v2-5-1 AC-3,11: Single PNG or PDF — show save dialog
              // v2-5-4: Default to system Downloads folder (cross-platform)
              const downloadsPath = path.join(os.homedir(), 'Downloads', fileName);
              const defaultUri = vscode.Uri.file(downloadsPath);
              outputChannel.appendLine(
                `ViewerV2MessageHandler [${deckId}]: Export default path: ${defaultUri.fsPath}`
              );

              const filters: Record<string, string[]> = format === 'pdf'
                ? { 'PDF Files': ['pdf'] }
                : { 'PNG Images': ['png'] };
              const saveUri = await vscode.window.showSaveDialog({
                defaultUri,
                filters,
                title: `Save ${format.toUpperCase()} Export`,
              });

              if (saveUri) {
                await vscode.workspace.fs.writeFile(saveUri, buffer);
                outputChannel.appendLine(
                  `ViewerV2MessageHandler [${deckId}]: Export: ${fileName} saved (${buffer.byteLength} bytes)`
                );
                await webview.postMessage({
                  type: 'v2-export-ready',
                  format,
                  fileName,
                });
              } else {
                outputChannel.appendLine(
                  `ViewerV2MessageHandler [${deckId}]: Export cancelled by user`
                );
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `ViewerV2MessageHandler [${deckId}]: Export failed: ${errorMsg}`
            );
            await webview.postMessage({
              type: 'v2-error',
              message: `Export failed: ${errorMsg}`,
            });
          }
          break;
        }

        case 'v2-batch-complete': {
          // v2-5-3: Batch export finished — clear folder state so next single export shows save dialog
          const { total, errorCount } = message;
          const successCount = total - errorCount;
          batchExportFolder = null;

          const summary = errorCount > 0
            ? `Exported ${successCount} of ${total} slides (${errorCount} failed)`
            : `Exported ${total} slides`;
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Batch complete — ${summary}`
          );

          await webview.postMessage({
            type: 'v2-export-ready',
            format: 'png',
            fileName: summary,
          });
          break;
        }

        case 'v2-edit-with-ai': {
          // ae-1-2 AC-11, AC-12, AC-14, AC-15: Edit with AI prompt composition and CC session launch
          const { instruction, slideNumber } = message;
          outputChannel.appendLine(
            `[ViewerV2] Edit with AI: slide ${slideNumber}, instruction: "${instruction}"`
          );

          // Compose prompt in the exact format expected by sb-create:edit workflow
          const prompt = `/sb-create:edit\n\nDeck: ${deckId}\nSlide: ${slideNumber}\nEdit instruction: ${instruction}`;

          try {
            // ae-1-2 AC-13: Launch new Claude Code session with newSession: true
            await sendToClaudeCode(prompt, outputChannel, undefined, {
              newSession: true,
              launchMode: configService.readSettings().claudeCode.launchMode,
              position: configService.readSettings().claudeCode.position,
            });

            // ae-1-2 AC-14: Post success confirmation back to webview
            await webview.postMessage({ type: 'v2-edit-started', success: true });
            outputChannel.appendLine(
              `[ViewerV2] Edit with AI: v2-edit-started sent (success: true)`
            );

            // story-ai-edit-refresh-1: Start polling for file changes after AI edit
            // AC#1: Detect file changes within ~1-2s of write
            // AC#6: Clear previous polling for same slide before starting new
            const existingPoll = aiEditPolling.get(slideNumber);
            if (existingPoll) {
              clearInterval(existingPoll.interval);
              clearTimeout(existingPoll.timeout);
              aiEditPolling.delete(slideNumber);
              outputChannel.appendLine(
                `[ViewerV2] AI edit polling: cleared previous polling for slide ${slideNumber}`
              );
            }

            // Construct slide file URI using findDeckUri (supports folders, cv-3-3)
            const deckUri = await dataService.findDeckUri(deckId);
            const slideUri = vscode.Uri.joinPath(deckUri, 'slides', `slide-${slideNumber}.html`);

            // Record initial mtime for comparison
            let initialMtime = 0;
            try {
              const stat = await vscode.workspace.fs.stat(slideUri);
              initialMtime = stat.mtime;
            } catch {
              // File may not exist yet — any creation will be detected
              outputChannel.appendLine(
                `[ViewerV2] AI edit polling: slide-${slideNumber}.html not found yet, will detect creation`
              );
            }

            // AC#1, AC#3: Poll every 1000ms, detect mtime change, send update, clear
            const pollInterval = setInterval(async () => {
              try {
                const stat = await vscode.workspace.fs.stat(slideUri);
                if (stat.mtime > initialMtime) {
                  // Change detected — read file and send to viewer
                  clearInterval(pollInterval);
                  clearTimeout(pollTimeout);
                  aiEditPolling.delete(slideNumber);

                  const bytes = await vscode.workspace.fs.readFile(slideUri);
                  const html = new TextDecoder().decode(bytes);
                  await webview.postMessage({
                    type: 'v2-slide-updated',
                    slideNumber,
                    html,
                  });
                  outputChannel.appendLine(
                    `[ViewerV2] AI edit polling: detected change for slide ${slideNumber}, sent v2-slide-updated`
                  );
                }
              } catch {
                // File not found or stat error — continue polling
              }
            }, 1000);

            // AC#4: Safety timeout at 120s
            const pollTimeout = setTimeout(() => {
              clearInterval(pollInterval);
              aiEditPolling.delete(slideNumber);
              outputChannel.appendLine(
                `[ViewerV2] AI edit polling: timed out after 120s for slide ${slideNumber}`
              );
            }, 120_000);

            aiEditPolling.set(slideNumber, { interval: pollInterval, timeout: pollTimeout });

            // AC#5: Register cleanup in disposables for panel dispose
            disposables.push({
              dispose: () => {
                clearInterval(pollInterval);
                clearTimeout(pollTimeout);
              },
            });
          } catch (error) {
            // ae-1-2 AC-15: Error handling for CC unavailability or launch failure
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `[ViewerV2] Edit with AI failed: ${errorMsg}`
            );
            vscode.window.showErrorMessage(
              `Edit with AI failed: ${errorMsg}. Ensure Claude Code extension is installed.`
            );
            await webview.postMessage({
              type: 'v2-edit-started',
              success: false,
              error: errorMsg,
            });
            outputChannel.appendLine(
              `[ViewerV2] Edit with AI: v2-edit-started sent (success: false)`
            );
          }
          break;
        }

        case 'v2-animate-with-ai': {
          // story-1.2 AC-4,5,10,11: Animate with AI prompt composition and CC session launch
          const { instruction, slideNumber } = message;
          outputChannel.appendLine(
            `[ViewerV2] Animate with AI: slide ${slideNumber}`
          );

          // Compose prompt: /sb-create:animate {slideNumber} with deck context and optional instruction
          let prompt = `/sb-create:animate ${slideNumber}\n\nDeck: ${deckId}`;
          if (instruction && instruction.trim().length > 0) {
            prompt += `\nInstruction: ${instruction}`;
          }

          try {
            // Launch new Claude Code session with newSession: true
            await sendToClaudeCode(prompt, outputChannel, undefined, {
              newSession: true,
              launchMode: configService.readSettings().claudeCode.launchMode,
              position: configService.readSettings().claudeCode.position,
            });

            await webview.postMessage({ type: 'v2-animate-started', success: true });
            outputChannel.appendLine(
              `[ViewerV2] Animate with AI: v2-animate-started sent (success: true)`
            );
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `[ViewerV2] Animate with AI failed: ${errorMsg}`
            );
            vscode.window.showErrorMessage(
              `Animate with AI failed: ${errorMsg}. Ensure Claude Code extension is installed.`
            );
            await webview.postMessage({
              type: 'v2-animate-started',
              success: false,
              error: errorMsg,
            });
            outputChannel.appendLine(
              `[ViewerV2] Animate with AI: v2-animate-started sent (success: false)`
            );
          }
          break;
        }

        case 'v2-submit-edit-form': {
          // tm-3-5 AC-3, AC-4: Route template edit form through PromptAssemblyService
          outputChannel.appendLine(
            `[viewer-v2-message-handler] v2-submit-edit-form: routing to PromptAssemblyService`
          );

          try {
            if (!promptAssemblyService) {
              throw new Error('PromptAssemblyService not available in viewer message handler');
            }

            const { data } = message;
            const editTemplateId = String(data['templateId'] ?? '');
            const editSlideFile = String(data['slideFile'] ?? '');

            const prompt = await promptAssemblyService.assembleEditDeckTemplatePrompt(
              data,
              editTemplateId,
              editSlideFile
            );

            await sendToClaudeCode(prompt, outputChannel);

            outputChannel.appendLine(
              `[viewer-v2-message-handler] v2-submit-edit-form: dispatched to Claude Code`
            );
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `[viewer-v2-message-handler] v2-submit-edit-form failed: ${errorMsg}`
            );
            vscode.window.showErrorMessage(
              `Could not launch Claude Code for edit: ${errorMsg}`
            );
          }
          break;
        }

        case 'v2-add-slide': {
          // story-viewer-add-slide-2 AC#1,2,3,5,7,8: Add slide prompt composition, CC launch, polling
          const { position, description } = message;
          outputChannel.appendLine(
            `[ViewerV2] Add Slide: position=${JSON.stringify(position)}, description="${description}"`
          );

          // AC#1: Compute new slide number
          let newSlideNumber: number;
          if (position === 'end') {
            const deckDetail = await dataService.getDeckDetail(deckId);
            newSlideNumber = (deckDetail?.slides.length || 0) + 1;
          } else {
            newSlideNumber = position + 1;
          }

          // AC#1: Compose position text for the prompt
          const positionText = position === 'end'
            ? 'at the end'
            : `after slide ${position}`;

          // AC#1: Compose /sb-create:add-slide prompt
          const addSlidePrompt = `/sb-create:add-slide\n\nDeck: ${deckId}\nPosition: ${positionText}\nSlide content: ${description}`;

          try {
            // AC#2: Launch new Claude Code session
            await sendToClaudeCode(addSlidePrompt, outputChannel, undefined, {
              newSession: true,
              launchMode: configService.readSettings().claudeCode.launchMode,
              position: configService.readSettings().claudeCode.position,
            });

            // AC#3: Send success response to webview
            await webview.postMessage({
              type: 'v2-add-slide-started',
              success: true,
              newSlideNumber,
            });
            outputChannel.appendLine(
              `[ViewerV2] Add Slide: v2-add-slide-started sent (success: true, newSlideNumber: ${newSlideNumber})`
            );

            // AC#5,7: Start polling for new slide file
            const deckUri = await dataService.findDeckUri(deckId);
            const slideUri = vscode.Uri.joinPath(deckUri, 'slides', `slide-${newSlideNumber}.html`);

            // AC#5: Poll every 1000ms for the new slide file
            const pollInterval = setInterval(async () => {
              try {
                const stat = await vscode.workspace.fs.stat(slideUri);
                if (stat.mtime > 0) {
                  // File detected — read and send to viewer
                  clearInterval(pollInterval);
                  clearTimeout(pollTimeout);
                  addSlidePolling.delete(newSlideNumber);

                  const bytes = await vscode.workspace.fs.readFile(slideUri);
                  const html = new TextDecoder().decode(bytes);
                  await webview.postMessage({
                    type: 'v2-slide-updated',
                    slideNumber: newSlideNumber,
                    html,
                  });
                  outputChannel.appendLine(
                    `[ViewerV2] Add Slide polling: detected slide-${newSlideNumber}.html, sent v2-slide-updated`
                  );
                }
              } catch {
                // File not found yet — continue polling
              }
            }, 1000);

            // AC#7: Safety timeout at 180 seconds
            const pollTimeout = setTimeout(() => {
              clearInterval(pollInterval);
              addSlidePolling.delete(newSlideNumber);
              outputChannel.appendLine(
                `[ViewerV2] Add Slide polling: timed out after 180s for slide ${newSlideNumber}`
              );
            }, 180_000);

            addSlidePolling.set(newSlideNumber, { interval: pollInterval, timeout: pollTimeout });

            // Register cleanup in disposables for panel dispose
            disposables.push({
              dispose: () => {
                clearInterval(pollInterval);
                clearTimeout(pollTimeout);
              },
            });
          } catch (error) {
            // AC#8: Error handling for CC unavailability or launch failure
            const errorMsg = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(
              `[ViewerV2] Add Slide failed: ${errorMsg}`
            );
            vscode.window.showErrorMessage(
              `Add Slide failed: ${errorMsg}. Ensure Claude Code extension is installed.`
            );
            await webview.postMessage({
              type: 'v2-add-slide-started',
              success: false,
              error: errorMsg,
            });
            outputChannel.appendLine(
              `[ViewerV2] Add Slide: v2-add-slide-started sent (success: false)`
            );
          }
          break;
        }

        default:
          outputChannel.appendLine(
            `ViewerV2MessageHandler [${deckId}]: Unhandled message type: ${(message as { type: string }).type}`
          );
      }
    }
  );
  disposables.push(messageDisposable);

  return {
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * Load all deck content for the V2 viewer.
 * v2-1-2 AC-1: Reads ALL slide HTML files in parallel using vscode.workspace.fs
 * v2-1-2 AC-2: Reads manifest.json for slide metadata
 * v2-1-2 AC-3: Bundles into ViewerV2DeckContent
 *
 * Architecture Reference: ADR-005 — All Slide Content Sent to Webview on Init
 * Architecture Reference: ADR-006 — VS Code workspace.fs for All File Operations
 */
async function loadDeckContent(
  deckId: string,
  dataService: CatalogDataService,
  outputChannel: vscode.OutputChannel
): Promise<ViewerV2DeckContent> {
  // Use findDeckUri to support decks in folders (cv-3-3)
  const deckUri = await dataService.findDeckUri(deckId);
  const slidesUri = vscode.Uri.joinPath(deckUri, 'slides');
  // manifest.json is in the slides/ directory (matches CatalogDataService and save-server)
  const manifestUri = vscode.Uri.joinPath(slidesUri, 'manifest.json');
  const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');

  // Step 1: Read manifest.json for metadata (AC-2)
  let manifest: ViewerV2Manifest;
  let deckName = deckId;
  try {
    const manifestBytes = await vscode.workspace.fs.readFile(manifestUri);
    const manifestData = JSON.parse(new TextDecoder().decode(manifestBytes));
    manifest = {
      deckId: manifestData.deckId || deckId,
      deckName: manifestData.deckName || deckId,
      slideCount: manifestData.slideCount || 0,
      slides: manifestData.slides || [],
      generatedAt: manifestData.generatedAt || new Date().toISOString(),
    };
    deckName = manifest.deckName;
  } catch {
    outputChannel.appendLine(
      `ViewerV2MessageHandler [${deckId}]: No manifest.json found, using defaults`
    );
    manifest = {
      deckId,
      deckName: deckId,
      slideCount: 0,
      slides: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Step 2: Get deck name and planned slide count from plan.yaml
  // v2-3-2 AC-8: Use parseDocument with keepSourceTokens for comment preservation
  try {
    const planBytes = await vscode.workspace.fs.readFile(planUri);
    const planText = new TextDecoder().decode(planBytes);
    const planDoc = parseYaml(planText);
    if (deckName === deckId) {
      const parsedDeckName = getField(planDoc, ['deck_name']);
      if (typeof parsedDeckName === 'string' && parsedDeckName.trim()) {
        deckName = parsedDeckName.trim();
      }
    }
    // story-1.1: Extract planned slide count for build badge
    // getField returns a YAMLSeq node for arrays, use .items.length
    const planSlides = getField(planDoc, ['slides']) as { items?: unknown[] } | undefined;
    if (planSlides?.items) {
      manifest.plannedSlideCount = planSlides.items.length;
    }
  } catch {
    // Use deckId as fallback, no planned count available
  }

  // Step 3: List all slide files (AC-1)
  let slideFiles: [string, vscode.FileType][] = [];
  try {
    const entries = await vscode.workspace.fs.readDirectory(slidesUri);
    slideFiles = entries.filter(
      ([name, type]) =>
        type === vscode.FileType.File &&
        name.startsWith('slide-') &&
        name.endsWith('.html')
    );
    // Sort by slide number
    slideFiles.sort(([a], [b]) => {
      const numA = parseInt(a.match(/slide-(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide-(\d+)/)?.[1] || '0', 10);
      return numA - numB;
    });
  } catch {
    outputChannel.appendLine(
      `ViewerV2MessageHandler [${deckId}]: No slides/ directory found`
    );
    // Return empty deck content (AC-10 empty state)
    return {
      deckId,
      deckName,
      slides: [],
      manifest,
      planPath: `output/${deckId}/plan.yaml`,
    };
  }

  // Step 4: Read all slide files in parallel (AC-1, AC-9 performance)
  const slidePromises = slideFiles.map(async ([fileName]): Promise<ViewerV2SlideContent | null> => {
    const slideUri = vscode.Uri.joinPath(slidesUri, fileName);
    try {
      const slideBytes = await vscode.workspace.fs.readFile(slideUri);
      const html = new TextDecoder().decode(slideBytes);

      // Extract slide number from filename
      const slideNumber = parseInt(fileName.match(/slide-(\d+)/)?.[1] || '0', 10);

      // Extract data-slide-id from HTML
      const slideIdMatch = html.match(/data-slide-id=["']([^"']+)["']/);
      const slideId = slideIdMatch?.[1] || `slide-${slideNumber}`;

      // Extract title from HTML (look for h1, title tag, or data-title attribute)
      let title = `Slide ${slideNumber}`;
      const titleMatch =
        html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
        html.match(/<title>([^<]+)<\/title>/i) ||
        html.match(/data-title=["']([^"']+)["']/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      return {
        number: slideNumber,
        html,
        fileName,
        slideId,
        title,
      };
    } catch (error) {
      // AC-11: Handle corrupted/unreadable slide files
      outputChannel.appendLine(
        `ViewerV2MessageHandler [${deckId}]: Error reading ${fileName}: ${error}`
      );
      const slideNumber = parseInt(fileName.match(/slide-(\d+)/)?.[1] || '0', 10);
      return {
        number: slideNumber,
        html: createErrorPlaceholderHtml(slideNumber, fileName, error),
        fileName,
        slideId: `slide-${slideNumber}-error`,
        title: `Slide ${slideNumber} (Error)`,
      };
    }
  });

  const slideResults = await Promise.all(slidePromises);
  const slides = slideResults.filter((s): s is ViewerV2SlideContent => s !== null);

  // Order slides according to manifest if available (fixes drag-drop persistence)
  let orderedSlides: ViewerV2SlideContent[];
  if (manifest.slides && manifest.slides.length > 0) {
    // Use manifest order - create map of fileName -> slide content
    const slideByFileName = new Map<string, ViewerV2SlideContent>();
    for (const slide of slides) {
      slideByFileName.set(slide.fileName, slide);
    }

    // Build ordered array from manifest
    // Note: manifest files use 'filename' (lowercase) not 'fileName' (camelCase)
    orderedSlides = [];
    for (const manifestSlide of manifest.slides) {
      const manifestFileName =
        (manifestSlide as unknown as Record<string, unknown>).filename as string | undefined ||
        manifestSlide.fileName;
      const slideContent = slideByFileName.get(manifestFileName);
      if (slideContent) {
        orderedSlides.push({
          ...slideContent,
          number: manifestSlide.number, // Use manifest's number
        });
      }
    }

    // Add any slides not in manifest (newly added files)
    for (const slide of slides) {
      const hasSlide = manifest.slides.some((ms) => {
        const msFileName =
          (ms as unknown as Record<string, unknown>).filename as string | undefined || ms.fileName;
        return msFileName === slide.fileName;
      });
      if (!hasSlide) {
        orderedSlides.push(slide);
      }
    }
  } else {
    // No manifest order - use filename order (current behavior)
    orderedSlides = slides;
  }

  // Update manifest slide count
  manifest.slideCount = orderedSlides.length;

  // Compute relative planPath from workspace root for decks in folders (cv-3-3)
  const workspaceRoot = dataService.getWorkspaceRoot();
  const relativeDeckPath = deckUri.fsPath
    .replace(workspaceRoot.fsPath + '/', '')
    .replace(workspaceRoot.fsPath + '\\', '');

  return {
    deckId,
    deckName,
    slides: orderedSlides,
    manifest,
    planPath: `${relativeDeckPath}/plan.yaml`,
  };
}

/**
 * Create error placeholder HTML for a slide that failed to load.
 * v2-1-2 AC-11: Corrupted slide shows placeholder, other slides remain navigable.
 */
function createErrorPlaceholderHtml(
  slideNumber: number,
  fileName: string,
  error: unknown
): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
      background: #2d2d2d;
      color: #ff6b6b;
      font-family: system-ui, sans-serif;
      text-align: center;
    ">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h2 style="margin: 16px 0 8px; font-size: 24px; color: #ffffff;">
        Slide ${slideNumber} Failed to Load
      </h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #888888;">
        File: ${fileName}
      </p>
      <p style="margin: 0; font-size: 12px; color: #666666; max-width: 400px;">
        ${errorMessage}
      </p>
    </div>
  `;
}
