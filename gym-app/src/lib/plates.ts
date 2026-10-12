/**
 * Every muscle group gets the colour of a weight plate. The colour is the
 * app's way of saying "what are you training?" in filters, cards and summaries.
 */
export const PLATE_COLORS: Record<string, string> = {
  chest: "#D3303E",
  back: "#2F6FDB",
  shoulders: "#F2B400",
  "upper arms": "#2E9F5B",
  "lower arms": "#7C5CD6",
  "upper legs": "#F07A1A",
  "lower legs": "#12A4A8",
  waist: "#2B3645",
  cardio: "#C0398F",
  neck: "#8B95A1",
};

const FALLBACK = "#8B95A1";

export function plateColor(bodyPart: string): string {
  return PLATE_COLORS[bodyPart] ?? FALLBACK;
}

/** Same colours, but the dark plate is lightened so it stays visible on the dark player. */
export function plateColorOnDark(bodyPart: string): string {
  return bodyPart === "waist" ? "#C9D2DC" : plateColor(bodyPart);
}
