// Local-first student progress: zero-login, kept in browser localStorage.
import type { BodySystem } from "./systems";
import { syncScore } from "./student";

const KEY = "aghamorph.progress.v1";

export interface Progress {
  score: number;
  badges: Record<BodySystem, boolean>;
  videosCompleted: string[];
}

const empty = (): Progress => ({
  score: 0,
  badges: {
    food_chain: false,
    herbivore: false,
    carnivore: false,
    omnivore: false,
  },
  videosCompleted: [],
});

export function loadProgress(): Progress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("aghamorph:progress"));
  void syncScore(p.score);
}

// All point-bearing actions award exactly 1 point each.
export function addScore(_delta?: number) {
  const p = loadProgress();
  p.score += 1;
  saveProgress(p);
}

export function awardBadge(system: BodySystem) {
  const p = loadProgress();
  if (!p.badges[system]) {
    p.badges[system] = true;
    p.score += 1;
    saveProgress(p);
  }
}

export function markVideoComplete(videoId: string) {
  const p = loadProgress();
  if (!p.videosCompleted.includes(videoId)) {
    p.videosCompleted.push(videoId);
    p.score += 1;
    saveProgress(p);
  }
}
