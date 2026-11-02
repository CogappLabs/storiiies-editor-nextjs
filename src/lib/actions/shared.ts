import { unstable_rethrow } from "next/navigation";
import { getStrings } from "@/lib/i18n/strings";
import { isValidHttpUrl } from "@/lib/validation";

const { errors } = getStrings();

export type ActionResult = { error: string } | undefined;

// Next masks thrown server action errors in production, so mutations return
// the message instead. Prisma errors are verbose and internal, so users get
// the generic message and the log gets the detail.
export const actionFailure = (scope: string, error: unknown): ActionResult => {
  unstable_rethrow(error);
  console.error(`Failed to ${scope}:`, error);
  const isOwnMessage =
    error instanceof Error && !error.constructor.name.startsWith("Prisma");
  return { error: isOwnMessage ? error.message : errors.generic };
};

export const getString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(errors.missingField(key));
  }
  return value;
};

/** Trimmed, or null when absent or blank. */
export const getOptionalString = (
  formData: FormData,
  key: string,
): string | null => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const getPositiveInt = (formData: FormData, key: string): number => {
  const num = Number.parseInt(getString(formData, key), 10);
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(errors.notPositive(key));
  }
  return num;
};

/** Throws on a negative position or a non-positive size; skips absent keys. */
export const validateCoordinates = ({
  x,
  y,
  width,
  height,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) => {
  const valid = (n: number | undefined, min: number) =>
    n === undefined || (Number.isFinite(n) && n >= min);
  if (!valid(x, 0) || !valid(y, 0)) {
    throw new Error(errors.coordinatesNegative);
  }
  if (!valid(width, Number.MIN_VALUE) || !valid(height, Number.MIN_VALUE)) {
    throw new Error(errors.sizeNotPositive);
  }
};

export const httpUrls = (urls: string[] = []) =>
  urls.map((url) => url.trim()).filter(isValidHttpUrl);
