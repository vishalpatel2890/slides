# Epic Technical Specification: Google Slides Export

Date: 2026-01-27
Author: Vishal
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 delivers the final step in the Slide Builder workflow: exporting completed HTML slides to Google Slides presentations. This enables users to take their brand-perfect, locally-generated slides and share them via Google's collaboration platform. The epic encompasses Google OAuth authentication, HTML-to-image conversion using Puppeteer, Google Slides API integration for presentation creation and image upload, and progress feedback throughout the export process.

This functionality fulfills the PRD's "Demo Tomorrow" test by completing the full workflow loop: setup → plan → build → **export**. Without export, users would need to manually screenshot and upload slides, undermining the framework's value proposition of seamless, end-to-end slide generation.

## Objectives and Scope

**In Scope:**
- One-time Google OAuth 2.0 authentication flow with token persistence
- Automatic token refresh for subsequent exports
- HTML slide conversion to PNG images at 1920x1080 resolution via Puppeteer
- Creation of new Google Slides presentations via API
- Full-bleed image upload (no margins/borders) for each slide
- Real-time progress feedback during conversion and upload
- Final presentation URL returned to user
- Graceful handling of API rate limits
- Error recovery without losing local slide data

**Out of Scope:**
- Editing slides within Google Slides after export (one-way export only)
- Exporting to PowerPoint format (Growth feature per PRD)
- Incremental/partial exports (re-export overwrites)
- Syncing changes back from Google Slides to local HTML
- Multiple Google account support
- Team/shared drive destinations

## System Architecture Alignment

Per Architecture ADR-004, Puppeteer is the chosen tool for HTML-to-image conversion, providing reliable CSS/JS rendering in a headless browser environment.

Per Architecture ADR-005, this is a user-initiated external integration - local data stays local until the user explicitly runs `/export`. No automatic syncing or background uploads.

**Components Referenced:**
- `workflows/export/` - Export workflow definition (workflow.yaml + instructions.md)
- `.slide-builder/credentials/google-oauth.json` - Stored OAuth tokens (gitignored)
- `.slide-builder/deck/slides/` or `.slide-builder/single/` - Source HTML slides
- `status.yaml` - Export progress logging

**Constraints:**
- Requires Node.js 18+ and Chrome/Chromium installed
- Requires user to have Google Cloud project with Slides API enabled
- Images uploaded as full-slide backgrounds (not native Slides elements)
- Rate limit handling via exponential backoff

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **OAuth Manager** | Handle Google authentication flow, token storage/refresh | Client credentials, user authorization | Access token, refresh token |
| **Slide Converter** | Convert HTML slides to PNG images via Puppeteer | HTML file paths, viewport dimensions | PNG image files |
| **Slides Uploader** | Create presentation and upload images via Google API | PNG files, presentation title, access token | Presentation URL |
| **Progress Reporter** | Display real-time progress to user | Step completions, errors | Terminal output |
| **Export Orchestrator** | Coordinate the full export workflow | Slide paths, mode (deck/single) | Final presentation URL |

**Module Interactions:**
```
Export Orchestrator
    ├── OAuth Manager (authenticate/refresh)
    ├── Slide Converter (for each slide)
    │   └── Progress Reporter (conversion progress)
    ├── Slides Uploader (create + upload)
    │   └── Progress Reporter (upload progress)
    └── Progress Reporter (completion)
```

### Data Models and Contracts

**OAuth Token Storage** (`credentials/google-oauth.json`):
```json
{
  "access_token": "ya29.xxx",
  "refresh_token": "1//xxx",
  "scope": "https://www.googleapis.com/auth/presentations",
  "token_type": "Bearer",
  "expiry_date": 1706400000000
}
```

**Export State** (added to `status.yaml` during export):
```yaml
export:
  status: "in_progress" | "completed" | "failed"
  started_at: "2026-01-27T10:00:00Z"
  completed_at: "2026-01-27T10:02:30Z"
  slides_converted: 5
  slides_uploaded: 5
  total_slides: 7
  presentation_url: "https://docs.google.com/presentation/d/xxx"
  last_error: null
```

**Converted Image Metadata** (temp directory):
```
/tmp/slide-builder-export-{timestamp}/
├── slide-1.png
├── slide-2.png
└── ...
```

### APIs and Interfaces

**Google Slides API Endpoints Used:**

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/v1/presentations` | Create new presentation | `{ title: string }` | `{ presentationId: string }` |
| POST | `/v1/presentations/{id}:batchUpdate` | Add slides + images | `{ requests: [...] }` | `{ replies: [...] }` |

**batchUpdate Request Structure:**
```javascript
{
  requests: [
    // Create blank slide
    {
      createSlide: {
        objectId: "slide_1",
        slideLayoutReference: { predefinedLayout: "BLANK" }
      }
    },
    // Add full-bleed image
    {
      createImage: {
        objectId: "image_1",
        url: "data:image/png;base64,{base64_data}",
        elementProperties: {
          pageObjectId: "slide_1",
          size: {
            width: { magnitude: 720, unit: "PT" },
            height: { magnitude: 405, unit: "PT" }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 0,
            translateY: 0,
            unit: "PT"
          }
        }
      }
    }
  ]
}
```

**Internal Module Interfaces:**

```typescript
// OAuth Manager
interface OAuthManager {
  authenticate(): Promise<OAuth2Client>;
  getValidToken(): Promise<string>;
  isAuthenticated(): boolean;
}

// Slide Converter
interface SlideConverter {
  convertSlide(htmlPath: string, outputPath: string): Promise<void>;
  convertAll(htmlPaths: string[], outputDir: string): Promise<string[]>;
}

// Slides Uploader
interface SlidesUploader {
  createPresentation(title: string): Promise<string>; // returns presentationId
  uploadSlide(presentationId: string, imagePath: string, slideIndex: number): Promise<void>;
  getUrl(presentationId: string): string;
}
```

### Workflows and Sequencing

**Export Workflow Sequence:**

```
User runs /export
        │
        ▼
┌─────────────────────────────────┐
│ 1. Check for slides             │
│    - Detect mode (deck/single)  │
│    - Gather slide HTML paths    │
│    - Error if no slides exist   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 2. Authenticate with Google     │
│    - Check for existing token   │
│    - Refresh if expired         │
│    - OAuth flow if first time   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 3. Convert HTML to Images       │
│    - Launch Puppeteer           │
│    - For each slide:            │
│      - Open HTML file           │
│      - Set viewport 1920x1080   │
│      - Screenshot to PNG        │
│      - Report progress          │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 4. Create Google Presentation   │
│    - POST /presentations        │
│    - Store presentationId       │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 5. Upload Slide Images          │
│    - For each image:            │
│      - batchUpdate: createSlide │
│      - batchUpdate: createImage │
│      - Handle rate limits       │
│      - Report progress          │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 6. Complete and Report          │
│    - Log to status.yaml         │
│    - Display presentation URL   │
│    - Cleanup temp files         │
└─────────────────────────────────┘
```

**Error Recovery Flow:**
```
On Error at any step
        │
        ▼
┌─────────────────────────────────┐
│ Log error to status.yaml        │
│ Preserve local slides (no-op)   │
│ Display helpful error message   │
│ Suggest remediation steps       │
└─────────────────────────────────┘
```

## Non-Functional Requirements

### Performance

| Metric | Target | Source |
|--------|--------|--------|
| Single slide conversion | < 3 seconds | Puppeteer screenshot overhead |
| Full deck conversion (10 slides) | < 30 seconds | Sequential processing |
| Single slide upload | < 5 seconds | Network + API latency |
| Full deck upload (10 slides) | < 60 seconds | Including rate limit handling |
| End-to-end export (10 slides) | < 2 minutes | Total user wait time |

**Optimizations:**
- Reuse single Puppeteer browser instance across all slides
- Batch slide creation requests where API allows
- Parallel image encoding (base64) while waiting for API responses

### Security

| Concern | Mitigation | Source |
|---------|------------|--------|
| OAuth credentials exposure | Stored in gitignored `credentials/` directory | NFR11 |
| Token in memory | Cleared after export completes | Best practice |
| Slide content privacy | Only transmitted during user-initiated export | ADR-005 |
| API key management | Client credentials via OAuth flow, not hardcoded | NFR11 |
| HTTPS only | All Google API calls over TLS | googleapis default |

**Authentication Security:**
- OAuth 2.0 with PKCE flow for desktop applications
- Refresh tokens stored locally, never transmitted to third parties
- Scopes limited to `presentations` only (no drive, email access)

### Reliability/Availability

| Scenario | Handling | Source |
|----------|----------|--------|
| Network interruption | Retry with exponential backoff (3 attempts) | NFR8 |
| API rate limit (429) | Wait per Retry-After header, then continue | NFR8 |
| Puppeteer crash | Restart browser, retry from failed slide | NFR14 |
| Partial upload failure | Log progress, allow resume from last successful | NFR14 |
| Token expiry mid-export | Auto-refresh and continue | NFR7 |
| Google API outage | Fail gracefully, preserve local data | NFR16 |

**Recovery Guarantees:**
- Local HTML slides are NEVER modified during export
- Export can be re-run at any time without data loss
- status.yaml tracks progress for debugging

### Observability

| Signal | Location | Purpose |
|--------|----------|---------|
| Export start/end timestamps | status.yaml | Duration tracking |
| Per-slide conversion status | Terminal output | User feedback |
| Per-slide upload status | Terminal output | User feedback |
| Error messages with context | Terminal + status.yaml | Debugging |
| Final presentation URL | Terminal + status.yaml | Success confirmation |
| Rate limit events | status.yaml history | Capacity planning |

**Progress Output Format:**
```
🔄 Converting slides to images...
   ✓ Slide 1 of 7 converted
   ✓ Slide 2 of 7 converted
   ...
📤 Uploading to Google Slides...
   ✓ Slide 1 of 7 uploaded
   ✓ Slide 2 of 7 uploaded
   ...
✅ Export complete!
   📎 https://docs.google.com/presentation/d/xxx/edit
   7 slides exported
```

## Dependencies and Integrations

### NPM Dependencies (from package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `puppeteer` | ^23.0.0 | Headless Chrome for HTML-to-image conversion |
| `googleapis` | ^140.0.0 | Google Slides API client |

### System Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Chrome/Chromium | Latest | Puppeteer browser backend |

### External Service Integrations

| Service | Integration Point | Authentication |
|---------|------------------|----------------|
| Google Slides API | REST API via googleapis | OAuth 2.0 |
| Google OAuth | Token exchange | Client credentials |

### Google Cloud Setup Requirements

User must complete one-time setup:
1. Create Google Cloud project
2. Enable Google Slides API
3. Create OAuth 2.0 credentials (Desktop app type)
4. Download client credentials JSON

**Note:** Setup instructions will be provided in workflow instructions.md

### Internal Dependencies

| Component | Dependency | Notes |
|-----------|------------|-------|
| Export workflow | Slides exist (deck/ or single/) | Error if no slides |
| Export workflow | Theme exists (for deck naming) | Falls back to "Untitled" |
| OAuth flow | credentials/ directory | Created by Epic 1 scaffolding |
| Slide conversion | HTML slides follow pattern | contenteditable, data-field attributes |

## Acceptance Criteria (Authoritative)

### Story 7.1: Google OAuth Setup

| AC# | Acceptance Criteria |
|-----|---------------------|
| AC7.1.1 | When user runs `/export` for the first time and no credentials exist, the system guides them through OAuth flow |
| AC7.1.2 | OAuth flow opens browser for Google authentication |
| AC7.1.3 | System requests only `presentations` scope |
| AC7.1.4 | Tokens are saved to `.slide-builder/credentials/google-oauth.json` |
| AC7.1.5 | Credentials file is in gitignored directory |
| AC7.1.6 | Subsequent exports use saved tokens without re-authentication |
| AC7.1.7 | Expired tokens are refreshed automatically |
| AC7.1.8 | If refresh fails, user is prompted to re-authenticate |

### Story 7.2: HTML to Image Conversion

| AC# | Acceptance Criteria |
|-----|---------------------|
| AC7.2.1 | When export runs, system launches Puppeteer headless browser |
| AC7.2.2 | Each slide HTML file is opened in the browser |
| AC7.2.3 | Viewport is set to 1920x1080 |
| AC7.2.4 | Screenshot is taken at full resolution |
| AC7.2.5 | Images are saved as PNG to temp directory |
| AC7.2.6 | All slides are converted (single mode: 1, deck mode: all) |
| AC7.2.7 | Progress is reported during conversion ("Converting slide N of M...") |
| AC7.2.8 | If Puppeteer not installed, helpful error guides user to install |

### Story 7.3: Google Slides Creation

| AC# | Acceptance Criteria |
|-----|---------------------|
| AC7.3.1 | After images generated, system creates new presentation via API |
| AC7.3.2 | For each image, a blank slide is created |
| AC7.3.3 | Image is uploaded at full size (1920x1080 mapped to slide dimensions) |
| AC7.3.4 | Image is positioned to cover entire slide (full-bleed, no margins) |
| AC7.3.5 | Slides appear in correct order (1, 2, 3...) |
| AC7.3.6 | If rate limits hit, system waits and retries |
| AC7.3.7 | Progress updates show wait status during rate limiting |
| AC7.3.8 | Local slides are not modified or deleted on export failure |

### Story 7.4: Export Progress and Completion

| AC# | Acceptance Criteria |
|-----|---------------------|
| AC7.4.1 | User sees progress: "Converting slide N of M..." |
| AC7.4.2 | User sees progress: "Uploading slide N of M..." |
| AC7.4.3 | User sees "Creating presentation..." during API call |
| AC7.4.4 | Final message shows "Export complete!" |
| AC7.4.5 | Final message includes clickable Google Slides URL |
| AC7.4.6 | Final message shows total slides exported |
| AC7.4.7 | On error, message identifies which step failed |
| AC7.4.8 | On error, message suggests fix and confirms local slides preserved |

## Traceability Mapping

| AC | Spec Section | Component | Test Approach |
|----|--------------|-----------|---------------|
| AC7.1.1-7.1.3 | APIs/OAuth | OAuth Manager | Integration: Mock OAuth server |
| AC7.1.4-7.1.5 | Data Models/OAuth | OAuth Manager | Unit: File write verification |
| AC7.1.6-7.1.8 | Workflows/Auth | OAuth Manager | Integration: Token lifecycle |
| AC7.2.1-7.2.5 | Services/Converter | Slide Converter | Integration: Puppeteer screenshot |
| AC7.2.6-7.2.7 | Workflows/Convert | Export Orchestrator | E2E: Multi-slide conversion |
| AC7.2.8 | NFR/Reliability | Slide Converter | Unit: Error handling |
| AC7.3.1-7.3.2 | APIs/Slides | Slides Uploader | Integration: Mock Slides API |
| AC7.3.3-7.3.5 | APIs/batchUpdate | Slides Uploader | Integration: Image positioning |
| AC7.3.6-7.3.7 | NFR/Reliability | Slides Uploader | Integration: Rate limit simulation |
| AC7.3.8 | NFR/Reliability | Export Orchestrator | E2E: Failure recovery |
| AC7.4.1-7.4.6 | NFR/Observability | Progress Reporter | Unit: Output format |
| AC7.4.7-7.4.8 | NFR/Observability | Progress Reporter | Unit: Error messages |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | Google API rate limits slow large deck exports | Medium | Medium | Implement exponential backoff; batch requests where possible |
| R2 | Puppeteer screenshot quality varies by CSS | Medium | Low | Test with all layout templates; document CSS constraints |
| R3 | OAuth flow complexity confuses first-time users | Low | Medium | Provide step-by-step setup guide; clear error messages |
| R4 | Base64 image encoding hits memory limits for large decks | Low | Low | Stream images instead of loading all at once |
| R5 | Google changes Slides API behavior | Medium | Low | Pin googleapis version; monitor deprecation notices |

### Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| A1 | User has Google account with Slides access | Export fails; need to add account check |
| A2 | Chrome/Chromium available on user's system | Puppeteer fails; need to add fallback instructions |
| A3 | Network connectivity during export | Partial failure; need offline queue (out of scope) |
| A4 | Google Cloud project setup is one-time effort | If creds expire, need clearer re-auth UX |
| A5 | 1920x1080 images map cleanly to slide dimensions | May need aspect ratio adjustment |

### Open Questions

| ID | Question | Owner | Due | Resolution |
|----|----------|-------|-----|------------|
| Q1 | Should we support exporting to existing presentation (append)? | PM | Before Story 7.3 | **Defer to Growth** - MVP creates new only |
| Q2 | What presentation title should be used? | Dev | Story 7.3 | Use deck_name from plan.yaml or "Slide Builder Export" |
| Q3 | Should temp PNG files be cleaned up automatically? | Dev | Story 7.4 | Yes, cleanup on success; preserve on failure for debugging |
| Q4 | MCP Google Workspace tool available - use instead of raw googleapis? | Dev | Story 7.1 | **Investigate** - May simplify OAuth flow |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage |
|-------|-------|-------|----------|
| Unit | Individual modules (OAuth, Converter, Uploader) | Jest | AC validation logic, error handling |
| Integration | Module interactions, API contracts | Jest + mocks | OAuth flow, API responses |
| E2E | Full export workflow | Manual + script | All AC from 7.1-7.4 |

### Test Scenarios by Story

**Story 7.1: OAuth Setup**
- First-time auth: Opens browser, stores tokens
- Token refresh: Expired token triggers refresh
- Refresh failure: Prompts re-authentication
- Credentials file: Created in correct location, gitignored

**Story 7.2: HTML to Image**
- Single slide: Converts to 1920x1080 PNG
- Multiple slides: All converted in order
- Complex slide: CSS renders correctly (shadows, gradients)
- Missing Puppeteer: Clear error message

**Story 7.3: Slides Creation**
- Create presentation: Returns valid ID
- Upload single image: Full-bleed positioning
- Upload 10 images: Correct order maintained
- Rate limit: Waits and retries successfully
- Network error: Local files preserved

**Story 7.4: Progress & Completion**
- Progress output: Matches expected format
- Success: URL displayed and clickable
- Failure: Error message includes step and fix

### Critical Path Testing

```
/export (deck mode, 5 slides, valid credentials)
    → Verify all 5 slides converted
    → Verify presentation created
    → Verify all 5 images uploaded
    → Verify URL accessible
    → Verify slides in correct order
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No slides exist | Error: "No slides to export. Run /build first." |
| Single slide mode | Export 1 slide successfully |
| Very long deck (20+ slides) | Complete with rate limit handling |
| Network drops mid-upload | Error with resume guidance |
| Invalid credentials | Clear re-auth prompt |
| Slide with special characters in content | PNG renders correctly |
