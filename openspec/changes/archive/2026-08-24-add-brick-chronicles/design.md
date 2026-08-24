## Context

The Brick-Master-Tracker is a single-page app (Express + better-sqlite3 backend, React + Vite frontend) tracking two physical bricks (Red = Honor, Blue = Shame). Transfers are currently bare — only `from`, `to`, `color`, and timestamp are recorded. With ~5-10 transfers per year, each is a significant event that deserves narrative weight.

The app currently has no file upload capability, no mutable transfer metadata, and a flat chronological ledger display.

## Goals / Non-Goals

**Goals:**
- Add a description field to every transfer, editable later by the sender (cannot be emptied)
- Allow photo uploads attached to transfers (classic image formats, 50MB max per file, filesystem storage)
- Replace the flat transfer ledger with a year-grouped narrative "Chroniques des Briques" view
- Restructure the home page: current holder status + transfer actions at top, chronicles below
- File picker must work on iOS, Android, and desktop browsers
- `DATA_PATH` env var controls storage location for uploads (and database)
- Transfers cannot be submitted while images are still uploading or have failed

**Non-Goals:**
- No image resizing/optimization (serve originals as uploaded)
- No cloud storage (filesystem only)
- No multi-user editing (only the sender can edit story or manage images)
- No video uploads
- No pagination (feasible for <100 transfers total)

## Decisions

### D1: Separate `transfer_story` table instead of adding columns to `transfer_history`

`transfer_history` is an immutable audit log. Keeping description mutable in a separate table cleanly separates fact from narrative.

```
transfer_history (immutable)     transfer_story (mutable)
┌──────────────────────────┐     ┌─────────────────────────┐
│ id (PK)                  │     │ transfer_id (PK, FK)    │
│ color, from_id, to_id,   │     │ description TEXT        │
│ transferred_by_id,       │     │ edited_by INT FK        │
│ transferred_at           │     │ edited_at INT           │
└──────────────────────────┘     │ created_at INT          │
                                 └─────────────────────────┘
```

- `transfer_story` is created at transfer time (with a user-supplied description)
- On edit, `description`, `edited_by`, and `edited_at` are updated
- `GET /api/transfers` returns transfers sorted by date; story details are fetched lazily via `GET /api/transfers/:id/story`

### D2: `transfer_images` table + filesystem storage

```
transfer_images
┌──────────────────────────────┐
│ id (PK)                      │
│ transfer_id (FK, NULLABLE)   │
│ filename TEXT (uuid-based)   │
│ original_name TEXT           │
│ mime_type TEXT               │
│ uploaded_by INT FK           │
│ uploaded_at INT              │
└──────────────────────────────┘
```

- Files stored at `$DATA_PATH/uploads/<uuid>.<ext>` — UUID avoids collisions and path traversal. `DATA_PATH` defaults to `./data` if unset.
- `transfer_id` is NULLABLE: images are uploaded before the transfer exists, then associated to a transfer when submitted or deleted if abandoned.
- Served via `GET /api/uploads/:filename` with auth middleware
- 50MB per-file limit enforced by multer
- Only the sender can upload/delete images for a transfer

### D3: Multer for file uploads, 50MB limit

`multer` handles multipart parsing, configured with:
- `dest` = `$DATA_PATH/uploads/` (disk storage, not memory)
- `limits.fileSize` = `50 * 1024 * 1024` (50MB)
- File filter: only `image/jpeg`, `image/png`, `image/webp`, `image/gif`

No image processing or resizing — files are stored as-is.

### D4: Description is required at transfer time, and on edit

Given the low transfer frequency (~5-10/year), requiring a description at the moment of transfer ensures every entry has a story. The modal blocks transfer submission until a non-empty description is provided. Photos are optional but must finish uploading before submission.

On edit via `PUT /api/transfers/:id/story`, the description must remain non-empty — clearing it is rejected with 400.

### D5: Chronicles view is year-grouped timeline

```
┌─ 2026 ──────────────────────────────────┐
│ Ch. 4 — Sophie · Mar 12                │
│ "Elle a mené la rétro la plus..."       │
│ 📸 3 photos                             │
├─────────────────────────────────────────┤
│ Ch. 3 — Antoine · Jan 2                │
│ "Atelier CPP legendary..."              │
│ 📸 1 photo                              │
├─────────────────────────────────────────┤
│ 2025                                    │
│ Ch. 2 — Yann · Sep 18                  │
│ ...                                     │
└─────────────────────────────────────────┘
```

Each entry is clickable to expand/full-view. Oldest entry per brick is the "origin story" (no previous holder).

### D6: Transfer modal flow (two-phase)

**Phase 1: Compose**
1. User clicks "Passer à [name]" on a brick card
2. Modal opens with:
   - Recipient name (pre-filled, read-only)
   - Brick color indicator
   - Description textarea (required, non-empty)
   - Photo picker (optional) — selected files are uploaded immediately via `POST /api/uploads/staging` to the DB (with `transfer_id = NULL`) and shown as preview thumbnails. Uploaded images show a checkmark; failed images show an error badge and can be removed.
3. Failed or unwanted images can be removed pre-submission via `DELETE /api/uploads/staging/:id`
4. **"Confirmer le transfert" is disabled while any image is still uploading or has failed**

**Phase 2: Submit**
1. On confirm: `POST /api/bricks/:color/transfer` with `{ to, description, imageIds: [...] }` body (JSON)
2. Server transaction: creates transfer_history + transfer_story, updates `transfer_images` rows to set `transfer_id`
3. On success: modal closes, brick status + chronicles refresh
4. Later: sender clicks on a chronicle entry to edit description or manage photos (add/delete via the per-transfer endpoints)

### D7: Staging upload endpoint for pre-transfer images

Images selected in the modal must be uploaded before the transfer exists. A staging endpoint handles this:

- `POST /api/uploads/staging` — accepts a single file (multer), inserts into `transfer_images` with `transfer_id = NULL`, returns `{ id, filename, originalName, mimeType }`. Auth required (any authenticated user).
- `DELETE /api/uploads/staging/:id` — removes a staging image (the uploader only). Deletes file from disk and row from DB.
- On transfer submit, `POST /bricks/:color/transfer` receives `imageIds: [...]`. Server sets `transfer_id` on those image rows within the transaction.
- Images that are uploaded but never associated to a transfer (abandoned modal) have `transfer_id = NULL` permanently. Acceptable for low-volume app.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Filesystem fills up** with large uploads | 50MB per-file limit + ~5-10 transfers/year makes this a non-issue. |
| **Path traversal** via filename in `GET /api/uploads/` | Store files by UUID, validate filename against DB, reject unknown UUIDs. Never use user-supplied filenames for serving. |
| **Orphaned images** if user abandons modal with uploaded images | Staging images have `transfer_id = NULL`. A cleanup query can periodically purge images older than 24h with no transfer_id. |
| **Large file OOM** on server | Multer configured with `diskStorage` (never memory), 50MB limit. Acceptable for small team. |
| **Migration for existing transfers** — they have no stories | `transfer_story` rows are created at transfer time. Old transfers simply don't have a story — chronicles show them without description/photos. |