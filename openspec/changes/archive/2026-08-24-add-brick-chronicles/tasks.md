## 1. Database & Shared Types

- [x] 1.1 Add `transfer_story` table to DB schema in `server/db.ts` (transfer_id PK/FK, description TEXT NOT NULL, edited_by INT FK, edited_at INT, created_at INT)
- [x] 1.2 Add `transfer_images` table to DB schema in `server/db.ts` (id PK, transfer_id INTEGER FK NULLABLE, filename TEXT, original_name TEXT, mime_type TEXT, uploaded_by INT FK, uploaded_at INT)
- [x] 1.3 Add `TransferStory` interface to `shared/types.ts` (description, editedBy, editedByName, editedAt)
- [x] 1.4 Add `TransferImage` interface to `shared/types.ts` (id, filename, originalName, mimeType, uploadedAt)
- [x] 1.5 Extend `Transfer` interface to include `images?: TransferImage[]`

## 2. Server — Transfer Story

- [x] 2.1 Add `multer` and `uuid` dependencies to `package.json`
- [x] 2.2 Configure `DATA_PATH` env var (defaults to `./data`) in server startup; ensure `$DATA_PATH/uploads/` directory exists
- [x] 2.3 Modify `POST /bricks/:color/transfer` to accept `description` and `imageIds` in body — validate description is non-empty, INSERT into `transfer_story`, UPDATE `transfer_images` rows to set `transfer_id` — all within the transaction
- [x] 2.4 Modify `GET /api/transfers` to return basic transfer metadata only (id, color, from/to, timestamp) — no story join
- [x] 2.5 Add `GET /api/transfers/:id/story` endpoint — returns description + edit metadata + images array for a specific transfer
- [x] 2.6 Add `PUT /api/transfers/:id/story` endpoint — upsert description (non-empty required), authorize sender only, return updated story

## 3. Server — Transfer Images

- [x] 3.1 Configure multer middleware: disk storage at `$DATA_PATH/uploads/`, 50MB file size limit, MIME filter (jpeg/png/webp/gif)
- [x] 3.2 Add `POST /api/uploads/staging` endpoint — multer single, store file with UUID name, INSERT into `transfer_images` with `transfer_id = NULL`, return image metadata (id, filename, originalName, mimeType)
- [x] 3.3 Add `DELETE /api/uploads/staging/:id` endpoint — verify uploader owns the image, delete file + DB row
- [x] 3.4 Add `POST /api/transfers/:id/images` endpoint — verify transfer exists (404 if not), authorize sender, single file, store with UUID, INSERT into `transfer_images`, return image metadata
- [x] 3.5 Add `DELETE /api/transfers/:id/images/:imageId` endpoint — authorize sender, delete file from filesystem, DELETE row from DB
- [x] 3.6 Add `GET /api/uploads/:filename` endpoint — requireAuth, validate filename exists in DB, serve file with correct Content-Type

## 4. i18n

- [x] 4.1 Add English translations: modal title, description placeholder/required hint, photo upload label, edit button, chronicles section title ("Chroniques des Briques"), year group labels, edit attribution ("Edited by X on Y")
- [x] 4.2 Add French translations: same keys in French

## 5. Client — API layer

- [x] 5.1 Update `transferBrick()` in `src/api.ts` to accept `description` and `imageIds` parameters
- [x] 5.2 Add `fetchTransferStory(id)` to `src/api.ts`
- [x] 5.3 Add `editStory(id, description)` to `src/api.ts`
- [x] 5.4 Add `uploadStagingImage(file: File)` to `src/api.ts` — POST multipart to `/api/uploads/staging`
- [x] 5.5 Add `deleteStagingImage(id)` to `src/api.ts`
- [x] 5.6 Add `uploadTransferImage(transferId, file)` and `deleteTransferImage(transferId, imageId)` to `src/api.ts`

## 6. Client — Transfer Modal

- [x] 6.1 Create `TransferModal` component: brick color indicator, recipient name (read-only), description textarea (required, non-empty validation), photo picker, image preview thumbnails, cancel/confirm buttons
- [x] 6.2 Integrate modal into `home.tsx` — clicking a transfer button opens the modal instead of calling `transferBrick` directly
- [x] 6.3 Implement two-phase submit: Phase 1 — images upload to staging on file selection, show progress/errors, allow removal of failed/unwanted images. Confirm button disabled while any image is uploading or failed
- [x] 6.4 Phase 2 — on confirm, POST to `/api/bricks/:color/transfer` with `{ to, description, imageIds }`, handle errors, close modal + refresh on success

## 7. Client — Chronicles View

- [x] 7.1 Create `ChroniclesView` component — fetches transfers list, groups by year, renders year headers + entry summaries
- [x] 7.2 Create `ChronicleEntry` component — renders one transfer: color dot, fromName → toName, date, description excerpt. Click to expand, fetching `/api/transfers/:id/story`
- [x] 7.3 Create expanded view in `ChronicleEntry` — full description, edit button (visible if current user is the sender), photo gallery
- [x] 7.4 Create `PhotoGallery` sub-component — grid of uploaded photos, clickable to view full-size (lightbox or new tab)
- [x] 7.5 Replace the transfer ledger section in `home.tsx` with the new `ChroniclesView` component

## 8. Client — Story Editing

- [x] 8.1 Add inline edit mode for description: click text → textarea, save triggers `PUT /api/transfers/:id/story`, non-empty validation on save
- [x] 8.2 Add photo upload button in edit view: opens native file picker, uploads via `POST /api/transfers/:id/images`, appends to gallery
- [x] 8.3 Add photo delete button (visible only to sender): confirmation dialog, `DELETE /api/transfers/:id/images/:imageId`, removes from gallery

## 9. Deployment

- [x] 9.1 Update `server/index.ts` to accept `DATA_PATH` env var for uploads directory location
- [x] 9.2 Update `compose.yaml` to mount a volume at `DATA_PATH` and expose `DATA_PATH` env var
- [x] 9.3 Update `Dockerfile` if needed for the `uploads/` path