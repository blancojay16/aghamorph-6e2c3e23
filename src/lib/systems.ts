export type BodySystem =
  | "food_chain"
  | "herbivore"
  | "carnivore"
  | "omnivore";

export const SYSTEMS: {
  key: BodySystem;
  label: string;
  emoji: string;
  tagline: string;
  colorVar: string;
}[] = [
  { key: "food_chain", label: "Food Chain", emoji: "🔄", tagline: "How living things depend on each other for food", colorVar: "var(--food-chain)" },
  { key: "herbivore", label: "Herbivore", emoji: "🌿", tagline: "Animals that eat only plants", colorVar: "var(--herbivore)" },
  { key: "carnivore", label: "Carnivore", emoji: "🍖", tagline: "Animals that eat other animals", colorVar: "var(--carnivore)" },
  { key: "omnivore", label: "Omnivore", emoji: "🌿🍖", tagline: "Animals that eat both plants and animals", colorVar: "var(--omnivore)" },
];

export const systemMeta = (k: BodySystem) =>
  SYSTEMS.find((s) => s.key === k) ?? SYSTEMS[0];
