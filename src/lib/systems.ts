export type BodySystem =
  | "air_temperature"
  | "air_pressure"
  | "wind_speed"
  | "wind_direction"
  | "humidity"
  | "rainfall"
  | "cloud_cover";

export const SYSTEMS: {
  key: BodySystem;
  label: string;
  emoji: string;
  tagline: string;
  colorVar: string;
}[] = [
  { key: "air_temperature", label: "Air Temperature", emoji: "🌡️", tagline: "How hot or cold the air is", colorVar: "var(--air-temperature)" },
  { key: "air_pressure", label: "Air Pressure", emoji: "🧭", tagline: "How heavy the air feels", colorVar: "var(--air-pressure)" },
  { key: "wind_speed", label: "Wind Speed", emoji: "💨", tagline: "How fast the wind blows", colorVar: "var(--wind-speed)" },
  { key: "wind_direction", label: "Wind Direction", emoji: "🧭", tagline: "Where the wind comes from", colorVar: "var(--wind-direction)" },
  { key: "humidity", label: "Humidity", emoji: "💧", tagline: "How much moisture is in the air", colorVar: "var(--humidity)" },
  { key: "rainfall", label: "Rainfall", emoji: "🌧️", tagline: "How much rain falls", colorVar: "var(--rainfall)" },
  { key: "cloud_cover", label: "Cloud Cover", emoji: "☁️", tagline: "How much sky is filled with clouds", colorVar: "var(--cloud-cover)" },
];

export const systemMeta = (k: BodySystem) =>
  SYSTEMS.find((s) => s.key === k) ?? SYSTEMS[0];
