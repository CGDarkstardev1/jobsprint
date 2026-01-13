# Change: Add File Browser, Cloud Connectors, and Document Management

## Why

Users need a single place to manage documents (resumes, cover letters, portfolios) across local files and cloud providers (Google Drive, Dropbox, OneDrive). To enable robust AI tailoring and automated applying, we must provide a beautiful file browser, default document attachments, versioning, cloud connectors with secure OAuth, and real-time sync/metrics.

## What Changes

- Add a File Browser UI for local and cloud files (GDrive, Dropbox, OneDrive) with upload, preview, tag, and versioning.
- Add backend connector endpoints (mock-first) for OAuth flows and file listing/download.
- Add documents object store in IndexedDB and APIs to save, version, and mark defaults for resume/cover letters.
- Add real-time WebSocket server to stream sync/tailoring/apply progress and feed dashboards.
- Add dashboard widgets for document metrics and activity streams with Recharts visuals.
- Add settings for connectors, and default resume/cover letter selection.
- Add tests for storage, connectors, and basic UI flows.

## Impact

- Affects capabilities: document-management, connectors, cloud-sync, ai-tailoring, realtime-monitoring
- Affects code: frontend routes and components (Files), storage service, cloudSync service, backend API routes and websocket server, dashboard widgets, resume tailoring components
- Backward compatibility: defaults to demo connectors when OAuth credentials are missing; no breaking change to existing APIs

## Rollout Plan

1. Create specs and tasks (this change)
2. Implement storage & APIs (documents store & connector endpoints)
3. Implement WebSocket server for progress events
4. Implement File Browser UI and connect to mock connectors
5. Integrate AI tailoring with selected documents and versioning
6. Add dashboard widgets and real-time activity feed
7. Tests, docs, and deploy to GitHub Pages / Puter as appropriate

## Risks

- OAuth connectors require secret management; initial rollout uses demo/mocked connectors. Production requires secure server-side token storage.
- Auto-apply automation requires careful rate limiting and legal caution; we'll implement assisted autofill with opt-in and throttling.

## Acceptance Criteria

- Users can upload local files and import files from mock cloud connectors
- Users can set default resume and default cover letter and see them in Settings
- AI tailoring can select a document from the File Browser and create a tailored version saved as a document version
- WebSocket events are emitted during connector sync and tailoring and are visible in the frontend activity feed
- Tests covering storage functions and connector endpoints exist and pass
