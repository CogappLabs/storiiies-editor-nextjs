export const VIEWERS = ["storiiies", "clover", "mirador", "annona"] as const;

export type ViewerId = (typeof VIEWERS)[number];
