## What I'll build

### 1. Groups replace individual student names
- Teacher dashboard gets a new "Groups" section (replaces "Students") where the teacher creates Group 1, Group 2, Group 3, … with a simple "+ Add group" button.
- Student side: instead of typing a name, students see the list of groups the teacher created and tap the group they belong to. Their device remembers the choice.
- Reuse the existing `students` table but rename its meaning to "groups" in the UI. The `name` column stores "Group 1" etc. No destructive migration needed — existing data stays.

### 2. Per-game leaderboard in the teacher tab
- New table `group_game_scores` with columns: `group_id`, `game` ('label' | 'memory' | 'jigsaw' | 'quiz'), `score`, `updated_at`. Unique on `(group_id, game)`.
- Each game writes/updates the row for the current group when they earn points.
- New teacher route `/teacher/rankings` shows 4 leaderboards (one per game), sorted highest-first, with medal icons for the top 3.
- Sidebar link added to the teacher layout.

### 3. Combined omnivore icon
- Change the omnivore emoji from 🍽️ to a herbivore+carnivore combo shown as "🌿🍖" (rendered side-by-side wherever the emoji is displayed). Updated in `src/lib/systems.ts` and `src/routes/games.label.tsx`.

### 4. Offline hybrid (local now, sync later)
- Add a service worker (via `vite-plugin-pwa`, `generateSW`, guarded so it never registers in the Lovable preview iframe) so the app shell + already-visited routes work offline.
- Local video store: uploaded video files are saved to IndexedDB (via `idb`) with a queued record `{ localId, title, system, blob, checkpoints[], syncStatus }`. The teacher can upload and add checkpoints fully offline.
- A background sync worker (runs on app load and whenever the browser fires `online`) walks queued items, uploads the blob to Supabase Storage, inserts the `videos` + `checkpoints` rows, and marks the local record as synced.
- Student playback: when online, videos stream from Supabase as today. When offline, the player looks up the video in IndexedDB (cached on first play) and plays from a blob URL. Checkpoints for cached videos are also stored locally.
- UI: small "Offline" / "Syncing…" / "Synced" badge in the teacher header so the teacher can see queue state.

## Technical details

- **Packages added**: `vite-plugin-pwa`, `workbox-window`, `idb`.
- **PWA config**: `registerType: "autoUpdate"`, `NetworkFirst` for HTML, `CacheFirst` for hashed assets and Supabase Storage video URLs, `/sw.js` output. Registration wrapper refuses in dev, iframe, and Lovable preview hostnames, and honors `?sw=off` kill switch.
- **IndexedDB schema** (`aghamorph-offline` DB, v1):
  - `videos` store: `{ localId, remoteId?, title, system, blob, mime, createdAt, syncStatus }`
  - `checkpoints` store: `{ localId, videoLocalId, remoteId?, tsSeconds, prompt, options, correctIndex, syncStatus }`
  - `video-blobs` store keyed by `remoteId` for cached remote videos
- **Sync function** in `src/lib/offline-sync.ts`: idempotent, retries on failure, updates local records with remote IDs, dispatches `aghamorph:sync` events for UI badge.
- **New migration**: creates `group_game_scores` with grants (`anon` + `service_role`) and permissive RLS matching the current app's no-auth model.
- **Teacher routes touched**: `teacher.tsx` (sidebar + sync badge), `teacher.index.tsx` (upload writes to local queue first, then syncs), `teacher.students.tsx` renamed conceptually to "Groups" with add/delete, new `teacher.rankings.tsx`.
- **Student routes touched**: `student-gate.tsx` becomes a group picker; `play.$videoId.tsx` falls back to IndexedDB blob when offline; games call a new `awardGameScore(game, delta)` helper that writes to both local progress and `group_game_scores`.
- **Emoji**: `SYSTEMS` entry for `omnivore` uses `"🌿🍖"`.

## Out of scope (ask if you want these)
- Sharing offline-uploaded videos peer-to-peer between devices before they sync.
- Editing an already-synced video's checkpoints while offline (offline edits only apply to videos still in the local queue).
