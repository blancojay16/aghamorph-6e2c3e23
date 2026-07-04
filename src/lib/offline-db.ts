import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface LocalVideo {
  localId: string;
  remoteId: string | null;
  title: string;
  system: string;
  filePath: string | null;
  mime: string;
  createdAt: number;
  syncStatus: "pending" | "synced" | "error";
  error?: string;
}

export interface LocalCheckpoint {
  localId: string;
  videoLocalId: string | null;
  videoRemoteId: string | null;
  remoteId: string | null;
  tsSeconds: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  syncStatus: "pending" | "synced";
}

interface AghamorphDB extends DBSchema {
  videos: {
    key: string;
    value: LocalVideo;
    indexes: { by_remoteId: string; by_status: string };
  };
  checkpoints: {
    key: string;
    value: LocalCheckpoint;
    indexes: { by_videoLocalId: string; by_videoRemoteId: string; by_status: string };
  };
  video_blobs: {
    key: string;
    value: { key: string; blob: Blob; mime: string };
  };
}

let dbP: Promise<IDBPDatabase<AghamorphDB>> | null = null;

export function db() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  if (!dbP) {
    dbP = openDB<AghamorphDB>("aghamorph-offline", 1, {
      upgrade(d) {
        const v = d.createObjectStore("videos", { keyPath: "localId" });
        v.createIndex("by_remoteId", "remoteId");
        v.createIndex("by_status", "syncStatus");
        const c = d.createObjectStore("checkpoints", { keyPath: "localId" });
        c.createIndex("by_videoLocalId", "videoLocalId");
        c.createIndex("by_videoRemoteId", "videoRemoteId");
        c.createIndex("by_status", "syncStatus");
        d.createObjectStore("video_blobs", { keyPath: "key" });
      },
    });
  }
  return dbP;
}

export const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
