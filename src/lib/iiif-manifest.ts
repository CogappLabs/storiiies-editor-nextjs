import type { IIIFInfo } from "@/lib/types";

export type ManifestCanvasOption = {
  id: string;
  label: string;
  width: number;
  height: number;
  infoUrl: string;
  thumbnail?: string;
};

export const normalizeInfoUrl = (url: string): string => {
  if (!url) return "";
  return url.endsWith("info.json")
    ? url
    : `${url.replace(/\/$/, "")}/info.json`;
};

const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getLabel = (label: unknown, fallback: string): string => {
  if (!label) return fallback;
  if (typeof label === "string") return label;
  if (
    typeof label === "object" &&
    label !== null &&
    "en" in label &&
    Array.isArray((label as { en: string[] }).en) &&
    (label as { en: string[] }).en.length > 0
  ) {
    return (label as { en: string[] }).en[0];
  }
  return fallback;
};

export const isInfoResponse = (data: unknown): data is IIIFInfo =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as { width?: unknown }).width === "number" &&
  typeof (data as { height?: unknown }).height === "number";

export const extractManifestOptions = (
  manifest: unknown,
): ManifestCanvasOption[] => {
  if (
    !manifest ||
    typeof manifest !== "object" ||
    !Array.isArray((manifest as { items?: unknown[] }).items)
  ) {
    return [];
  }

  const canvases = toArray((manifest as { items?: unknown[] }).items);
  const options: ManifestCanvasOption[] = [];

  canvases.forEach((canvasRaw, index) => {
    if (!canvasRaw || typeof canvasRaw !== "object") return;
    const canvas = canvasRaw as {
      id?: string;
      label?: unknown;
      width?: number;
      height?: number;
      items?: unknown[];
      thumbnail?: Array<{ id?: string }>;
    };

    const annotationPage = toArray(canvas.items)[0] as
      | { items?: unknown[] }
      | undefined;
    const annotation =
      annotationPage &&
      toArray(annotationPage?.items).find(
        (item) => item && typeof item === "object",
      );
    const bodies =
      annotation && typeof annotation === "object"
        ? toArray((annotation as { body?: unknown }).body)
        : [];
    const imageBody = bodies.find(
      (body) =>
        body &&
        typeof body === "object" &&
        (body as { type?: string }).type === "Image",
    ) as { service?: unknown; id?: string } | undefined;

    const service = imageBody
      ? toArray<{ id?: string }>(
          imageBody.service as { id?: string } | { id?: string }[] | undefined,
        )[0]
      : undefined;

    const serviceId =
      (typeof service?.id === "string" && service.id) ||
      (typeof imageBody?.id === "string"
        ? imageBody.id.replace(/\/full\/.*$/, "")
        : undefined);

    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height || !serviceId) return;

    options.push({
      id: canvas.id ?? `canvas-${index}`,
      label: getLabel(canvas.label, ""),
      width,
      height,
      infoUrl: normalizeInfoUrl(serviceId),
      thumbnail: canvas.thumbnail?.[0]?.id,
    });
  });

  return options;
};
