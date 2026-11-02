export type MediaField = { id: string; value: string };

export const createMediaField = (value = ""): MediaField => ({
  id: crypto.randomUUID(),
  value,
});
