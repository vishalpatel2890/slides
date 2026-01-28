# Story 7.1: Google OAuth Setup

Status: ready-for-dev

## Story

As a **user**,
I want **to authenticate with Google once during my first export**,
So that **I can export decks to Google Slides without repeated login prompts**.

## Acceptance Criteria

1. **AC7.1.1:** When user runs `/export` for the first time and no credentials exist, the system guides them through OAuth flow
2. **AC7.1.2:** OAuth flow opens browser for Google authentication
3. **AC7.1.3:** System requests only `presentations` scope (minimal permissions)
4. **AC7.1.4:** Tokens are saved to `.slide-builder/credentials/google-oauth.json`
5. **AC7.1.5:** Credentials file is in gitignored directory
6. **AC7.1.6:** Subsequent exports use saved tokens without re-authentication
7. **AC7.1.7:** Expired tokens are refreshed automatically
8. **AC7.1.8:** If refresh fails, user is prompted to re-authenticate

## Frontend Test Gate

**Gate ID**: 7-1-TG1

### Prerequisites
- [ ] Slide Builder framework installed with `.slide-builder/` directory structure
- [ ] At least one slide exists (run `/sb:plan-one` + `/sb:build-one` or have deck slides)
- [ ] Node.js 18+ installed
- [ ] `googleapis` package installed via npm
- [ ] Google Cloud project created with Slides API enabled
- [ ] OAuth 2.0 credentials (Desktop app type) downloaded from Google Cloud Console
- [ ] Claude Code active in terminal
- [ ] Starting state: No existing credentials at `.slide-builder/credentials/google-oauth.json`

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Verify no credentials exist | File system: `.slide-builder/credentials/` | Directory empty or no google-oauth.json |
| 2 | Run `/sb:export` | CLI | System detects missing credentials, prompts for OAuth |
| 3 | Follow OAuth guidance | CLI output | Instructions for Google Cloud setup displayed |
| 4 | Browser opens for Google auth | Browser | Google sign-in page appears |
| 5 | Sign in to Google account | Browser | Google account selection/login |
| 6 | Review permissions requested | Browser consent screen | Only "Google Slides" scope shown |
| 7 | Approve access | Browser "Allow" button | Authorization code provided or redirect occurs |
| 8 | Return to CLI | CLI | System confirms token received |
| 9 | Verify credentials saved | File system | `google-oauth.json` exists in credentials/ |
| 10 | Run `/sb:export` again | CLI | Export proceeds without OAuth prompt |
| 11 | Wait for token expiry (or manually invalidate) | - | Token becomes invalid |
| 12 | Run `/sb:export` | CLI | Token refreshed automatically, export proceeds |

### Success Criteria (What User Sees)
- [ ] Clear guidance for first-time OAuth setup
- [ ] Browser opens automatically for Google authentication
- [ ] Only "Google Slides" permission requested (not Drive, Gmail, etc.)
- [ ] Credentials file created at `.slide-builder/credentials/google-oauth.json`
- [ ] credentials/ directory is gitignored (check `.gitignore`)
- [ ] Subsequent exports skip OAuth flow entirely
- [ ] Token refresh happens silently without user intervention
- [ ] If refresh fails, clear prompt for re-authentication
- [ ] No console errors in terminal
- [ ] No credentials exposed in terminal output

### Feedback Questions
1. Was the OAuth setup guidance clear and easy to follow?
2. Did the browser open automatically for authentication?
3. Were you concerned about the permissions being requested?
4. Did subsequent exports feel seamless (no re-auth)?

## Tasks / Subtasks

- [ ] **Task 1: Create Export Workflow Structure** (AC: 1)
  - [ ] 1.1: Create `.slide-builder/workflows/export/` directory
  - [ ] 1.2: Create `workflow.yaml` with name, description, instructions path
  - [ ] 1.3: Create `instructions.md` skeleton with workflow steps placeholder
  - [ ] 1.4: Register `/sb:export` slash command in skill configuration

- [ ] **Task 2: Implement OAuth Manager - Credential Check** (AC: 1, 6)
  - [ ] 2.1: In export instructions Step 1, check for `.slide-builder/credentials/google-oauth.json`
  - [ ] 2.2: If exists, parse JSON and verify structure (access_token, refresh_token, expiry_date)
  - [ ] 2.3: If valid credentials exist, skip to token validation step
  - [ ] 2.4: If missing or malformed, trigger OAuth flow

- [ ] **Task 3: Implement First-Time OAuth Flow** (AC: 1, 2, 3)
  - [ ] 3.1: Display OAuth setup guidance:
    - Explain Google Cloud project requirement
    - List steps: Enable Slides API, create OAuth credentials
    - Provide Google Cloud Console URL
  - [ ] 3.2: Prompt user for client credentials (client_id, client_secret) or path to credentials JSON
  - [ ] 3.3: Generate OAuth authorization URL with:
    - `scope: https://www.googleapis.com/auth/presentations`
    - `access_type: offline` (for refresh token)
    - `prompt: consent` (ensure refresh token granted)
  - [ ] 3.4: Open browser to authorization URL (use Bash `open` command on macOS)
  - [ ] 3.5: Prompt user to paste authorization code after approval
  - [ ] 3.6: Exchange code for tokens via Google OAuth token endpoint

- [ ] **Task 4: Implement Token Storage** (AC: 4, 5)
  - [ ] 4.1: Create credentials/ directory if not exists
  - [ ] 4.2: Save tokens to `google-oauth.json` with structure:
    ```json
    {
      "access_token": "...",
      "refresh_token": "...",
      "scope": "https://www.googleapis.com/auth/presentations",
      "token_type": "Bearer",
      "expiry_date": <timestamp_ms>
    }
    ```
  - [ ] 4.3: Set appropriate file permissions (readable by owner only if possible)
  - [ ] 4.4: Verify `.gitignore` includes `.slide-builder/credentials/`
  - [ ] 4.5: Display success message: "Credentials saved. Future exports won't require authentication."

- [ ] **Task 5: Implement Token Validation and Refresh** (AC: 6, 7)
  - [ ] 5.1: On export start, check token expiry_date vs current time
  - [ ] 5.2: If token expires within 5 minutes, trigger proactive refresh
  - [ ] 5.3: If token already expired, trigger refresh before proceeding
  - [ ] 5.4: Refresh flow:
    - Use refresh_token to request new access_token
    - Update expiry_date in credentials file
    - Log refresh event to status.yaml history
  - [ ] 5.5: If refresh successful, proceed with export silently

- [ ] **Task 6: Implement Refresh Failure Handling** (AC: 8)
  - [ ] 6.1: If refresh fails (invalid_grant, revoked token):
    - Display clear error: "Google authentication expired or revoked"
    - Delete invalid credentials file
    - Prompt: "Run /export again to re-authenticate"
  - [ ] 6.2: If refresh fails due to network:
    - Display: "Network error refreshing token. Check connection and try again."
    - Preserve credentials file for retry
  - [ ] 6.3: Log refresh failure to status.yaml with error details

- [ ] **Task 7: Integration with Export Workflow** (AC: All)
  - [ ] 7.1: In instructions.md, add OAuth check as Step 2 (after slide check in Step 1)
  - [ ] 7.2: Store valid access_token in workflow context for later steps
  - [ ] 7.3: If OAuth fails at any point, halt workflow with clear message
  - [ ] 7.4: Never display access_token or refresh_token in terminal output

- [ ] **Task 8: Testing - OAuth Flow Verification** (AC: 1-8)
  - [ ] 8.1: Test first-time flow: No credentials → OAuth → Credentials saved
  - [ ] 8.2: Test subsequent export: Credentials exist → No OAuth prompt
  - [ ] 8.3: Test token refresh: Modify expiry_date to past → Refresh triggered
  - [ ] 8.4: Test refresh failure: Invalid refresh_token → Re-auth prompt
  - [ ] 8.5: Verify credentials file not in git staging
  - [ ] 8.6: Run Frontend Test Gate checklist

## Dev Notes

### Architecture Patterns and Constraints

**From Tech Spec - OAuth Manager Module:**

Per the Epic 7 Tech Spec, the OAuth Manager handles authentication:

```
Module: OAuth Manager
Responsibility: Handle Google authentication flow, token storage/refresh
Inputs: Client credentials, user authorization
Outputs: Access token, refresh token

Interface:
  authenticate(): Promise<OAuth2Client>
  getValidToken(): Promise<string>
  isAuthenticated(): boolean
```

**OAuth Flow Sequence (from Tech Spec):**

```
User runs /export
        │
        ▼
┌─────────────────────────────────┐
│ 2. Authenticate with Google     │
│    - Check for existing token   │
│    - Refresh if expired         │
│    - OAuth flow if first time   │
└─────────────────────────────────┘
```

**Token Storage Schema (from Tech Spec):**

```json
{
  "access_token": "ya29.xxx",
  "refresh_token": "1//xxx",
  "scope": "https://www.googleapis.com/auth/presentations",
  "token_type": "Bearer",
  "expiry_date": 1706400000000
}
```

**Key Constraints (from Tech Spec):**

- OAuth 2.0 with PKCE flow for desktop applications
- Refresh tokens stored locally, never transmitted to third parties
- Scopes limited to `presentations` only (no drive, email access)
- Credentials stored in gitignored `credentials/` directory (per NFR11)
- HTTPS only for all Google API calls

**Security Requirements (from Tech Spec NFR):**

- OAuth credentials exposure → Stored in gitignored `credentials/` directory
- Token in memory → Cleared after export completes
- API key management → Client credentials via OAuth flow, not hardcoded
- Never display tokens in terminal output

**Dependencies (from Tech Spec):**

- `googleapis` npm package (^140.0.0)
- Node.js 18+
- User must have Google Cloud project with Slides API enabled
- User must create OAuth 2.0 credentials (Desktop app type)

**Open Question Resolution (from Tech Spec Q4):**

> "MCP Google Workspace tool available - use instead of raw googleapis?"

The MCP `google_workspace` tool is available in this environment. **Investigate whether `mcp__google_workspace__start_google_auth` can simplify the OAuth flow** instead of implementing raw googleapis OAuth. This could significantly reduce implementation complexity.

### Project Structure Notes

**Files to Create:**

```
.slide-builder/
├── workflows/
│   └── export/
│       ├── workflow.yaml          # CREATE - Workflow configuration
│       └── instructions.md        # CREATE - Execution instructions
├── credentials/
│   └── google-oauth.json          # CREATE - OAuth tokens (gitignored)
└── status.yaml                    # MODIFY - Log OAuth events
```

**Alignment with Architecture:**

Per Architecture Project Structure:
- `workflows/export/` follows BMAD pattern (workflow.yaml + instructions.md)
- `credentials/` is gitignored per ADR-006 (Open Source Content Strategy)
- All state changes logged to status.yaml with ISO 8601 timestamps

Per Architecture Error Handling:
- "Export auth fails → Guide user through OAuth re-authentication"

**Integration Points:**

- This is the first story in Epic 7 - establishes foundation for 7.2, 7.3, 7.4
- OAuth Manager provides `getValidToken()` for Slides Uploader in Story 7.3
- Export workflow structure created here, extended in subsequent stories

### Learnings from Previous Story

**From Story 6-4-theme-rollback (Status: done)**

Story 6.4 was in a different epic (Theme Management) but establishes patterns for:

- **Workflow Structure:** Created workflow instructions with multi-phase execution
- **Status Logging:** History entries with action and timestamp patterns
- **User Prompts:** Confirmation flows before significant actions

**Relevant Patterns to Reuse:**

- Status.yaml history logging format from 6.4
- User prompt patterns for approval/confirmation
- Phase-based workflow structure in instructions.md

**No Direct Code to Reuse:**

Epic 7 is a new functional area (export) with no direct code dependencies on Epic 6. However, the workflow patterns established across prior epics should be followed.

[Source: notes/sprint-artifacts/6-4-theme-rollback.md#Dev-Agent-Record]

### Testing Standards

**From Tech Spec Test Strategy:**

Story 7.1 Test Scenarios:
- First-time auth: Opens browser, stores tokens
- Token refresh: Expired token triggers refresh
- Refresh failure: Prompts re-authentication
- Credentials file: Created in correct location, gitignored

**Edge Cases (from Tech Spec):**

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid credentials | Clear re-auth prompt |
| Network error during OAuth | Helpful error message |
| User denies permission | Clear guidance on retry |
| Malformed credentials file | Delete and re-authenticate |

### MCP Tool Investigation

**Available MCP Tool:** `mcp__google_workspace__start_google_auth`

This tool may provide a simplified OAuth flow for Google Workspace services. Before implementing raw googleapis OAuth:

1. Test if `start_google_auth` supports Google Slides scope
2. Check if it handles token storage and refresh automatically
3. Evaluate if it simplifies the implementation vs. manual OAuth

If MCP tool is suitable, it could replace Tasks 3, 5, and 6 with a single tool call.

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#Story 7.1: Google OAuth Setup] - AC definitions (AC7.1.1-AC7.1.8)
- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#Services and Modules] - OAuth Manager specification
- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - Token storage schema
- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#Security] - OAuth security requirements
- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#Dependencies and Integrations] - googleapis dependency
- [Source: notes/sprint-artifacts/tech-spec-epic-7.md#Open Questions] - Q4 MCP tool investigation
- [Source: notes/architecture.md#Project Structure] - credentials/ directory location
- [Source: notes/architecture.md#Security Architecture] - Credentials storage pattern
- [Source: notes/architecture.md#ADR-006] - Gitignore strategy for credentials
- [Source: notes/epics.md#Story 7.1: Google OAuth Setup] - User story context
- [Source: notes/prd.md#FR42-47] - Export functional requirements
- [Source: notes/prd.md#NFR6-7] - OAuth integration requirements
- [Source: notes/prd.md#NFR11] - Credentials security requirement

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/7-1-google-oauth-setup.context.xml`

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Story drafted from create-story workflow | SM Agent |
