import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

export interface VideoMeta {
  id: string;
  title: string;
  system: string;
  file_path: string;
  created_at: string;
}
export interface CheckpointMeta {
  id: string;
  video_id: string;
  ts_seconds: number;
  prompt: string;
  options: string[];
  correct_index: number;
}
export interface QuizMeta {
  id: string;
  video_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  position: number;
}

interface CacheDB extends DBSchema {
  videos_meta: { key: string; value: VideoMeta };
  checkpoints_meta: { key: string; value: CheckpointMeta; indexes: { by_video: string } };
  quiz_meta: { key: string; value: QuizMeta; indexes: { by_video: string } };
  video_blobs: { key: string; value: { key: string; blob: Blob; mime: string; savedAt: number } };
}

let dbP: Promise<IDBPDatabase<CacheDB>> | null = null;
export function db() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  if (!dbP) {
    dbP = openDB<CacheDB>("aghamorph-cache", 1, {
      upgrade(d) {
        d.createObjectStore("videos_meta", { keyPath: "id" });
        const c = d.createObjectStore("checkpoints_meta", { keyPath: "id" });
        c.createIndex("by_video", "video_id");
        const q = d.createObjectStore("quiz_meta", { keyPath: "id" });
        q.createIndex("by_video", "video_id");
        d.createObjectStore("video_blobs", { keyPath: "key" });
      },
    });
  }
  return dbP;
}

function onlineNow() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function fireCacheEvent() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aghamorph:cache"));
}

export async function getCachedVideoBlob(videoId: string): Promise<Blob | null> {
  try {
    const d = await db();
    const r = await d.get("video_blobs", videoId);
    return r?.blob ?? null;
  } catch {
    return null;
  }
}

export async function cacheVideoBlob(videoId: string, blob: Blob, mime: string) {
  try {
    const d = await db();
    await d.put("video_blobs", { key: videoId, blob, mime, savedAt: Date.now() });
    fireCacheEvent();
  } catch {
    /* ignore */
  }
}

export async function listCachedVideoIds(): Promise<Set<string>> {
  try {
    const d = await db();
    const keys = await d.getAllKeys("video_blobs");
    return new Set(keys as string[]);
  } catch {
    return new Set();
  }
}

export async function listCachedVideosMeta(): Promise<VideoMeta[]> {
  try {
    const d = await db();
    return await d.getAll("videos_meta");
  } catch {
    return [];
  }
}

export async function getCachedVideoMeta(videoId: string): Promise<VideoMeta | undefined> {
  try {
    const d = await db();
    return await d.get("videos_meta", videoId);
  } catch {
    return undefined;
  }
}

export async function getCachedCheckpoints(videoId: string): Promise<CheckpointMeta[]> {
  try {
    const d = await db();
    return await d.getAllFromIndex("checkpoints_meta", "by_video", videoId);
  } catch {
    return [];
  }
}

export async function getCachedQuiz(videoId: string): Promise<QuizMeta[]> {
  try {
    const d = await db();
    const list = await d.getAllFromIndex("quiz_meta", "by_video", videoId);
    return list.sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

// Progress reporter for the header badge
interface Status {
  online: boolean;
  caching: number;
  totalCached: number;
}
let status: Status = { online: true, caching: 0, totalCached: 0 };
export function getCacheStatus() {
  return status;
}
function setStatus(patch: Partial<Status>) {
  status = { ...status, ...patch };
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("aghamorph:cache-status", { detail: status }));
}

async function syncMetadata() {
  const d = await db();
  const [{ data: videos, error: ve }, { data: cps }, { data: qz }] = await Promise.all([
    supabase.from("videos").select("id,title,system,file_path,created_at"),
    supabase.from("checkpoints").select("id,video_id,ts_seconds,prompt,options,correct_index"),
    supabase.from("quiz_questions").select("id,video_id,prompt,options,correct_index,position"),
  ]);
  if (ve) throw ve;

  const remoteVideoIds = new Set((videos ?? []).map((v) => v.id));

  // Mirror rows
  const vTx = d.transaction("videos_meta", "readwrite");
  await vTx.store.clear();
  for (const v of videos ?? []) await vTx.store.put(v as VideoMeta);
  await vTx.done;

  const cTx = d.transaction("checkpoints_meta", "readwrite");
  await cTx.store.clear();
  for (const c of cps ?? []) {
    await cTx.store.put({
      ...(c as any),
      options: Array.isArray((c as any).options) ? ((c as any).options as string[]) : [],
    });
  }
  await cTx.done;

  const qTx = d.transaction("quiz_meta", "readwrite");
  await qTx.store.clear();
  for (const q of qz ?? []) {
    await qTx.store.put({
      ...(q as any),
      options: Array.isArray((q as any).options) ? ((q as any).options as string[]) : [],
    });
  }
  await qTx.done;

  // Prune blobs for deleted videos
  const blobKeys = (await d.getAllKeys("video_blobs")) as string[];
  for (const k of blobKeys) {
    if (!remoteVideoIds.has(k)) await d.delete("video_blobs", k);
  }
  return videos ?? [];
}

async function fetchAndCacheOne(v: VideoMeta) {
  const { data } = supabase.storage.from("videos").getPublicUrl(v.file_path);
  const url = data.publicUrl;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${v.title}`);
  const blob = await res.blob();
  await cacheVideoBlob(v.id, blob, blob.type || "video/mp4");
}

let running = false;
export async function syncCacheOnce() {
  if (running || !onlineNow()) return;
  running = true;
  try {
    const videos = await syncMetadata();
    const cached = await listCachedVideoIds();
    const missing = videos.filter((v) => !cached.has(v.id));
    setStatus({
      online: true,
      caching: missing.length,
      totalCached: videos.length - missing.length,
    });
    for (const v of missing) {
      try {
        await fetchAndCacheOne(v as VideoMeta);
        setStatus({ caching: (getCacheStatus().caching || 1) - 1, totalCached: getCacheStatus().totalCached + 1 });
      } catch {
        /* try again next loop */
      }
    }
    setStatus({ caching: 0 });
  } catch {
    /* offline or db error */
  } finally {
    running = false;
    fireCacheEvent();
  }
}

export function startCacheLoop() {
  if (typeof window === "undefined") return;
  const trigger = () => {
    setStatus({ online: onlineNow() });
    void syncCacheOnce();
  };
  window.addEventListener("online", trigger);
  window.addEventListener("offline", trigger);
  window.addEventListener("aghamorph:cache", trigger);
  trigger();
  const t = window.setInterval(trigger, 60_000);
  return () => {
    window.removeEventListener("online", trigger);
    window.removeEventListener("offline", trigger);
    window.removeEventListener("aghamorph:cache", trigger);
    window.clearInterval(t);
  };
}
