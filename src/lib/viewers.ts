export const VIEWERS = ["storiiies", "clover", "mirador", "annona"] as const;

export type ViewerId = (typeof VIEWERS)[number];

// StoriiiesViewer's `infoPosition` values. The package ships no types.
export const INFO_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

export type InfoPosition = (typeof INFO_POSITIONS)[number];

export const toInfoPosition = (value: unknown): InfoPosition | undefined =>
  INFO_POSITIONS.find((p) => p === value);
