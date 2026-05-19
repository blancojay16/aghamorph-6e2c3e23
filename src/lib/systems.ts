export type BodySystem =
  | "skeletal"
  | "muscular"
  | "digestive"
  | "circulatory"
  | "respiratory";

export const SYSTEMS: {
  key: BodySystem;
  label: string;
  emoji: string;
  tagline: string;
  colorVar: string;
}[] = [
  { key: "skeletal", label: "Skeletal", emoji: "🦴", tagline: "Bones that hold us up", colorVar: "var(--skeletal)" },
  { key: "muscular", label: "Muscular", emoji: "💪", tagline: "Muscles that move us", colorVar: "var(--muscular)" },
  { key: "digestive", label: "Digestive", emoji: "🍎", tagline: "How we use food", colorVar: "var(--digestive)" },
  { key: "circulatory", label: "Circulatory", emoji: "❤️", tagline: "Heart and blood", colorVar: "var(--circulatory)" },
  { key: "respiratory", label: "Respiratory", emoji: "🫁", tagline: "Lungs that breathe", colorVar: "var(--respiratory)" },
];

export const systemMeta = (k: BodySystem) =>
  SYSTEMS.find((s) => s.key === k) ?? SYSTEMS[0];
