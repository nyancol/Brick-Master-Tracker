## Why

The Brick-Master-Tracker currently records transfers as bare data (who gave what to whom, when). But with only a handful of transfers each year, each one is a significant event — a ceremony, a story, a moment worth remembering. Currently, there is no way to capture *why* a transfer happened, what made the recipient worthy, or what challenge was overcome. The transfer ledger is sterile — a log, not a living chronicle.

Transforming the ledger into a narrative "book" makes each transfer tangible, memorable, and meaningful. It turns the app from a utility into a keepsake.

## What Changes

- **Transfer descriptions**: When transferring a brick, the sender must write a description explaining why the recipient deserves the brick (honor or shame, depending on color). The description can be edited later by the sender, and may never be emptied.
- **Photo attachments**: The sender can upload photos linked to a transfer (classic image formats, max 50MB per file). Photos are uploaded before the transfer is submitted — the transfer cannot be confirmed until all selected images have uploaded successfully. Photos can also be added/removed later when editing the transfer.
- **Chronicles view**: The flat transfer ledger is replaced by a narrative "Chroniques des Briques" view — a book-like timeline grouped by year, with full descriptions and photo galleries.
- **Home page restructure**: The current holder status and transfer actions remain at the top of the page; the chronicles section replaces the old ledger below.
- **New database tables**:
  - `transfer_story`: mutable narrative metadata per transfer (description, editor, edit timestamps)
  - `transfer_images`: photo attachments per transfer (file path, metadata, uploader)
- **New API endpoints**:
  - `GET /api/transfers` — fetch list of all transfers (id, color, from/to, timestamp) — basic metadata only
  - `GET /api/transfers/:id/story` — fetch the story (description, edit metadata, images) for a specific transfer
  - `PUT /api/transfers/:id/story` — create or update the story description (sender only, non-empty required)
  - `POST /api/transfers/:id/images` — upload a single image per request (sender only, 50MB max)
  - `DELETE /api/transfers/:id/images/:imageId` — remove an image (sender only)
  - `GET /api/uploads/:filename` — serve uploaded images (authenticated only)
- **Client-side**: New modal for transfer (description + photo upload with preview, confirm blocked until uploads complete), new chronicles UI component, ability to edit stories inline with photo management.
- **Deployment**: `DATA_PATH` env var controls where uploads and the SQLite database are stored; Docker volume mounts accordingly.

## Capabilities

### New Capabilities
- `transfer-story`: Narrative descriptions for transfers — creation, editing, and storage of per-transfer stories with edit attribution and timestamps.
- `transfer-images`: Photo attachment management — upload, serve, and delete images linked to transfers, stored on the local filesystem.

### Modified Capabilities
- `authorized-transfers`: The transfer flow REQUIRES a non-empty description to be submitted before execution. The `POST /bricks/:color/transfer` endpoint SHALL validate the `description` field is present and non-empty.

## Impact

- **Server**: New routes, new DB tables, file upload handling (multer or raw), filesystem storage directory (`./uploads/`)
- **Client**: New modal component for transfer flow, new chronicles view component replacing the ledger, edit capability, file picker for photos
- **Shared types**: New `TransferStory` and `TransferImage` interfaces
- **i18n**: New translation keys for chronicles UI
- **Database**: Migration to add `transfer_story` and `transfer_images` tables
- **Deployment**: `DATA_PATH` env var controls the directory for uploads and the SQLite database; Dockerfile and compose.yaml need volume adjustments