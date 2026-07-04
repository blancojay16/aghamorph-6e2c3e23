import { supabase } from "@/integrations/supabase/client";
import type { BodySystem } from "./systems";
import {
  db,
  uid,
  type LocalCheckpoint,
  type LocalVideo,
} from "./offline-db";

let running = false;

export function fireSyncEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("aghamorph:sync"));
  }
}

export async function queueVideo(input: {
  title: string;
  system: BodySystem;
  blob: Blob;
  mime: string;
}) {
  const d = await db();
  const localId = uid();
  const rec: LocalVideo = {
    localId,
    remoteId: null,
    title: input.title,
    system: input.system,
    filePath: null,
    mime: input.mime,
    createdAt: Date.now(),
    syncStatus: "pending",
  };
  await d.put("videos", rec);
  await d.put("video_blobs", { key: localId, blob: input.blob, mime: input.mime });
  fireSyncEvent();
  return localId;
}

export async function deleteLocalVideo(localId: string) {
  const d = await db();
  const v = await d.get("videos", localId);
  await d.delete("videos", localId);
  await d.delete("video_blobs", localId);
  if (v?.remoteId) await d.delete("video_blobs", v.remoteId);
  const cps = (await d.getAll("checkpoints")).filter(
    (c) => c.videoLocalId === localId,
  );
  for (const c of cps) await d.delete("checkpoints", c.localId);
  fireSyncEvent();
}

export async function listLocalVideos(): Promise<LocalVideo[]> {
  const d = await db();
  return d.getAll("videos");
}

export async function getLocalVideo(localId: string) {
  const d = await db();
  return d.get("videos", localId);
}

export async function queueCheckpoint(input: {
  videoLocalId: string | null;
  videoRemoteId: string | null;
  tsSeconds: number;
  prompt: string;
  options: string[];
  correctIndex: number;
}) {
  const d = await db();
  const localId = uid();
  const rec: LocalCheckpoint = {
    localId,
    videoLocalId: input.videoLocalId,
    videoRemoteId: input.videoRemoteId,
    remoteId: null,
    tsSeconds: input.tsSeconds,
    prompt: input.prompt,
    options: input.options,
    correctIndex: input.correctIndex,
    syncStatus: "pending",
  };
  await d.put("checkpoints", rec);
  fireSyncEvent();
  return localId;
}

export async function deleteLocalCheckpoint(localId: string) {
  const d = await db();
  await d.delete("checkpoints", localId);
  fireSyncEvent();
}

export async function localCheckpointsForVideo(opts: {
  videoLocalId?: string | null;
  videoRemoteId?: string | null;
}): Promise<LocalCheckpoint[]> {
  const d = await db();
  const all = await d.getAll("checkpoints");
  return all.filter(
    (c) =>
      (opts.videoLocalId && c.videoLocalId === opts.videoLocalId) ||
      (opts.videoRemoteId && c.videoRemoteId === opts.videoRemoteId),
  );
}

export async function getCachedVideoBlob(key: string): Promise<Blob | null> {
  try {
    const d = await db();
    const r = await d.get("video_blobs", key);
    return r?.blob ?? null;
  } catch {
    return null;
  }
}

export async function cacheRemoteVideo(remoteId: string, blob: Blob, mime: string) {
  try {
    const d = await db();
    await d.put("video_blobs", { key: remoteId, blob, mime });
  } catch {
    /* ignore */
  }
}

export async function syncOnce() {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  running = true;
  try {
    const d = await db();
    const pending = (await d.getAll("videos")).filter(
      (v) => v.syncStatus === "pending" || v.syncStatus === "error",
    );
    for (const v of pending) {
      try {
        const blobRec = await d.get("video_blobs", v.localId);
        if (!blobRec) throw new Error("Missing local video blob");
        const safe = v.title.replace(/[^a-zA-Z0-9._-]/g, "_") || "video";
        const path = `teacher/${Date.now()}-${v.localId}-${safe}`;
        const { error: upErr } = await supabase.storage.from("videos").upload(
          path,
          blobRec.blob,
          { cacheControl: "3600", upsert: false, contentType: v.mime || "video/mp4" },
        );
        if (upErr) throw upErr;
        const { data: row, error: insErr } = await supabase
          .from("videos")
          .insert({ title: v.title, system: v.system as never, file_path: path })
          .select()
          .single();
        if (insErr) throw insErr;
        v.remoteId = row.id;
        v.filePath = path;
        v.syncStatus = "synced";
        v.error = undefined;
        await d.put("videos", v);
        await d.put("video_blobs", { key: row.id, blob: blobRec.blob, mime: v.mime });
      } catch (err) {
        v.syncStatus = "error";
        v.error = (err as Error).message;
        await d.put("videos", v);
      }
    }

    const cps = (await d.getAll("checkpoints")).filter(
      (c) => c.syncStatus === "pending",
    );
    for (const c of cps) {
      let remoteVideoId = c.videoRemoteId;
      if (!remoteVideoId && c.videoLocalId) {
        const v = await d.get("videos", c.videoLocalId);
        if (v?.remoteId) remoteVideoId = v.remoteId;
      }
      if (!remoteVideoId) continue;
      try {
        const { data, error } = await supabase
          .from("checkpoints")
          .insert({
            video_id: remoteVideoId,
            ts_seconds: c.tsSeconds,
            prompt: c.prompt,
            options: c.options as never,
            correct_index: c.correctIndex,
          })
          .select()
          .single();
        if (error) throw error;
        c.remoteId = data.id;
        c.videoRemoteId = remoteVideoId;
        c.syncStatus = "synced";
        await d.put("checkpoints", c);
      } catch {
        // leave pending
      }
    }
    fireSyncEvent();
  } finally {
    running = false;
  }
}

export function startSyncLoop() {
  if (typeof window === "undefined") return;
  const trigger = () => {
    void syncOnce();
  };
  window.addEventListener("online", trigger);
  window.addEventListener("aghamorph:sync", trigger);
  trigger();
  const t = setInterval(trigger, 30_000);
  return () => {
    window.removeEventListener("online", trigger);
    window.removeEventListener("aghamorph:sync", trigger);
    clearInterval(t);
  };
}
