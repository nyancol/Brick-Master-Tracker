## 1. Server: count persistence and endpoint

- [x] 1.1 Add `site_stats` table DDL (`key TEXT PRIMARY KEY, value INTEGER NOT NULL`, `CREATE TABLE IF NOT EXISTS`) to `server/db.ts`
- [x] 1.2 Add `POST /api/visits` to `server/app.ts`: if `counted` cookie absent, atomically upsert-increment `site_stats['visits']` and `Set-Cookie: counted=1; HttpOnly; SameSite=Lax` (session cookie, no Max-Age/Expires); always return `{ count }`; add OpenAPI JSDoc annotation in existing style

## 2. Client: render the real count

- [x] 2.1 Add `registerVisit(): Promise<number>` helper to `src/api.ts` (`POST /api/visits`)
- [x] 2.2 Rewrite `VisitorCounter` (`src/components/kitsch/VisitorCounter.tsx`): `useState`/`useEffect` on mount calling `registerVisit`, initial render `0000000`, display `String(count).padStart(7, "0")`; delete `BASE`, `readVisitCount`, and all localStorage usage; keep odometer markup and `footer.counterLabel` unchanged
- [x] 2.3 Run `npm run typecheck` and `npm run build` until clean

## 3. Verification

- [x] 3.1 Start isolated test server per UX conventions (`fuser -k 3199/tcp` first, `PORT=3199 DATA_PATH=/tmp/opencode/bmt-data DB_PATH=/tmp/opencode/bmt-data/brick.db IMAGE_PATH=/tmp/opencode/bmt-data/upload node dist/server.mjs`, confirm "listening" line in log)
- [x] 3.2 curl contract test against fresh DB: first `POST /api/visits` returns `{"count":1}`; repeat with same cookie jar returns `{"count":1}` unchanged; new cookie jar returns `{"count":2}`; inspect `Set-Cookie` flags (session cookie: no Max-Age/Expires, has HttpOnly, SameSite=Lax)
- [x] 3.3 Browser test (playwright-core scratch install in /tmp/opencode): fresh context loads home → footer shows `0000001`; reload same context → count unchanged; verify `site_stats` value in the /tmp DB matches
- [x] 3.4 Matrix: light + dark themes × en + fr × reduced-motion on/off; footer odometer screenshots eyeballed via Read; confirm no visual change vs. old counter styling
- [x] 3.5 Failure mode: abort/block `/api/visits` requests → counter renders `0000000`, no console errors, rest of footer intact
- [x] 3.6 Kill test server (`fuser -k 3199/tcp`) and clean up /tmp scratch
