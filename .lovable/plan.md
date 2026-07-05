
## Overview

Full rewrite of the app from TanStack Start (SSR on Cloudflare Workers) to an Ionic React + Vite single-page app with Capacitor for Android. All current features (groups, videos + checkpoints, 4 games, teacher dashboard, rankings) are ported. Offline model changes to online-first with automatic background caching. A new "Trace the Food Chain" arrow-drawing game is added. Omnivore icon and current SSR hydration bug are fixed as part of the rewrite.

## What changes

### 1. Stack migration — TanStack Start → Ionic React + Vite (SPA)

- New `package.json` with `@ionic/react`, `@ionic/react-router`, `react-router-dom@5`, `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/filesystem`, `@capacitor/network`, `vite`, `@vitejs/plugin-react`, Tailwind v4, existing shadcn/Radix UI, `@supabase/supabase-js`, `idb`.
- New `vite.config.ts` (plain `@vitejs/plugin-react`, port 8080, no SSR, no Cloudflare, no `vite-plugin-pwa`).
- New entry `src/main.tsx` mounts `<App />` into `#root`; new `index.html` at project root.
- New `src/App.tsx` uses `<IonApp><IonReactRouter>` with `IonRouterOutlet` and `Route` from `react-router-dom` v5.
- Delete TanStack files: `src/router.tsx`, `src/routeTree.gen.ts`, `src/server.ts`, `src/start.ts`, `src/routes/__root.tsx`, all TanStack `createFileRoute` route files, `src/integrations/supabase/auth-*.ts`, `src/integrations/supabase/client.server.ts`, `wrangler.jsonc`, `public/sw.js` (generated), `src/pwa/register-sw.ts`, `.workspace`/`.lovable` template hooks that assume TanStack.
- Keep as-is: `src/integrations/supabase/client.ts` (browser Supabase client), `src/integrations/supabase/types.ts`, all shadcn `src/components/ui/*`, Tailwind theme in `src/styles.css`, `src/lib/systems.ts`, `src/lib/progress.ts`, `src/lib/student.ts`, `src/lib/utils.ts`.
- New pages under `src/pages/`:
  - `Home.tsx` (role picker)
  - `Student.tsx` (group picker + game grid)
  - `Play.tsx` (video player with checkpoints)
  - `games/Label.tsx`, `games/Memory.tsx`, `games/Jigsaw.tsx`, `games/Quiz.tsx`, `games/Trace.tsx` (new)
  - `teacher/Dashboard.tsx`, `teacher/Groups.tsx`, `teacher/GamesAdmin.tsx`, `teacher/Rankings.tsx`, `teacher/Video.tsx`, `teacher/TraceAdmin.tsx` (upload organisms for the trace game)
- New `capacitor.config.ts` (`appId: com.aghamorph.app`, `appName: Aghamorph`, `webDir: dist`).
- Scripts in `package.json`:
  - `dev`: `vite --port 8080` (this is what the Lovable preview runs)
  - `build`: `vite build`
  - `serve`: `vite preview --port 8080`
  - Ionic/Capacitor CLIs work when the user runs them locally: `ionic serve` (delegates to vite), `ionic build` → `ionic cap add android` → `ionic cap sync` → `ionic cap open android`.
- README section with the exact Android build commands.

### 2. Offline model — online-first with auto-cache

- **Upload path (teacher, online only):** video + checkpoints are written straight to Supabase Storage + `videos`/`checkpoints` tables. The offline upload queue and `deleteLocalVideo`/`queueVideo` flows are removed. If offline, the upload button is disabled with "Connect to internet to upload".
- **Cache path (all clients):** a small background worker in `src/lib/offline-cache.ts` runs whenever the app is online:
  1. Fetch the current list of `videos` + their `checkpoints` from Supabase.
  2. For each video not yet in IndexedDB, fetch the file from Storage (signed URL) as a `Blob` and store it under `video_blobs` keyed by `remoteId`.
  3. Mirror `videos` and `checkpoints` rows into IndexedDB stores `videos_meta` and `checkpoints_meta`.
- **Playback:** `Play.tsx` first checks IndexedDB. If a cached blob exists, play from `URL.createObjectURL(blob)` and read checkpoints from `checkpoints_meta`. Otherwise stream from Supabase and cache in the background. Works the same on Android via Capacitor.
- **Games:** game assets (jigsaw pieces, quiz questions, trace organisms) follow the same cache-mirror pattern so they play offline once seen online.
- **UI:** the teacher header badge becomes "Online / Offline / Caching N videos…" driven by `@capacitor/network` on native and `navigator.onLine` on web. Fixes the current SSR hydration mismatch by rendering the badge only after mount.

### 3. Trace the Food Chain — new game

- New Supabase table `trace_chains`:
  - `id`, `title`, `system`, `created_at`
- New table `trace_organisms`:
  - `id`, `chain_id` (FK → trace_chains), `label`, `file_path` (Storage), `position` (int, 1..N — the correct order in the chain)
- New Storage bucket `trace-organisms` (public read).
- **Teacher side (`teacher/TraceAdmin.tsx`):** create a chain (e.g. "Rice field"), then upload one image per organism with a label and its position. Add/remove/reorder organisms. Delete chain.
- **Student side (`games/Trace.tsx`):**
  - Pick a chain.
  - The app scatters the organism images at random positions on a full-screen canvas (each image ~90–120px, non-overlapping, seeded by chain id so replays look consistent).
  - Student drags a finger from one organism to the next to draw an arrow (SVG line + arrowhead). Arrows snap to the nearest organism center on release.
  - When N-1 arrows are drawn, tap "Check". Correct if the traced sequence matches `position` order; award 1 point per correct link via `awardGameScore("trace", n)`.
  - "Undo" removes the last arrow; "Reset" clears all.
- New leaderboard column in `teacher/Rankings.tsx`.

### 4. Omnivore icon fix

- Replace the emoji-cluster `"🌿🍖"` with a proper two-emoji layout: in `systems.ts`, store `emoji: "🐖"` fallback and add `emojis: ["🌿", "🍖"]`. Wherever the icon is rendered (`Home`, `Student`, `Label` game, teacher lists) render as two `<span>`s inside a flex container with `-space-x-2` and a subtle badge so they no longer collide with adjacent text.

### 5. Bug sweep

- Remove SSR-only code paths (fixes the current teacher header hydration mismatch).
- Wrap all Supabase calls with try/catch + Ionic toast; no more silent failures.
- Add `ErrorBoundary` around `IonRouterOutlet`.
- Replace the current TanStack `Link` / `useNavigate` usage with `react-router-dom` v5 equivalents throughout.

## Technical details

- **Routing:** `react-router-dom@5` (Ionic 8 still requires v5). Paths kept close to today: `/`, `/student`, `/games`, `/games/:kind`, `/play/:videoId`, `/teacher`, `/teacher/groups`, `/teacher/games`, `/teacher/rankings`, `/teacher/video/:videoId`, `/teacher/trace`.
- **IndexedDB (`aghamorph-cache` v2):** stores `videos_meta`, `checkpoints_meta`, `video_blobs`, `trace_chains_meta`, `trace_organisms_meta`, `image_blobs`. Cleanup: LRU cap at ~500MB (configurable), evicts oldest blobs first.
- **Capacitor:** `capacitor.config.ts` with `server: { androidScheme: 'https' }`. `@capacitor/filesystem` is imported but only used on native for very large videos (>50MB) — small videos stay in IndexedDB.
- **Auth:** none (the app is unauthenticated today, matches current RLS `public` policies). Groups stay in the existing `students` table.
- **Migrations (one migration):**
  - `create table public.trace_chains (...)` + grants + RLS + permissive policies
  - `create table public.trace_organisms (...)` + grants + RLS + permissive policies
  - Storage bucket `trace-organisms` (public)
- **Removed packages:** `@tanstack/*`, `@lovable.dev/vite-tanstack-config`, `vite-plugin-pwa`, `workbox-window`, `wrangler`.
- **Added packages:** `@ionic/react`, `@ionic/react-router`, `react-router@5`, `react-router-dom@5`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/network`, `@capacitor/filesystem`, `ionicons`, `@vitejs/plugin-react`.

## Out of scope (ask if you want these)

- iOS build (`cap add ios`) — Android only per your instructions.
- Peer-to-peer sharing of cached videos between devices.
- Signed / private videos (public bucket stays public).
- Play Store signing / release keystore setup.

## Note on `ionic serve`

`ionic serve` in the Lovable preview is not available — the preview runs `npm run dev` (Vite) on port 8080. On your local machine, after `npm install`, both `ionic serve` and `npm run dev` will start the same Vite dev server. The Android commands (`ionic cap add android`, `cap copy`, `cap sync`, `cap open android`) work locally after `ionic build`.
