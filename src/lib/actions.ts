"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type {
  ImageSource,
  ImageSourceType,
  Prisma,
  Story,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidHttpUrl } from "@/lib/validation";

type StoryWithImageSource = Story & { imageSource: ImageSource };
type StoryWithCount = StoryWithImageSource & {
  _count: { annotations: number };
};

const getString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`Missing or invalid field: ${key}`);
  }
  return value;
};

const getOptionalString = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  return value;
};

const getPositiveInt = (formData: FormData, key: string): number => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`Missing or invalid field: ${key}`);
  }
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(`${key} must be a positive number`);
  }
  return num;
};

const validateCoordinates = (coords: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}): void => {
  const { x, y, width, height } = coords;

  if (
    x !== undefined &&
    (typeof x !== "number" || !Number.isFinite(x) || x < 0)
  ) {
    throw new Error("x coordinate must be a non-negative number");
  }
  if (
    y !== undefined &&
    (typeof y !== "number" || !Number.isFinite(y) || y < 0)
  ) {
    throw new Error("y coordinate must be a non-negative number");
  }
  if (
    width !== undefined &&
    (typeof width !== "number" || !Number.isFinite(width) || width <= 0)
  ) {
    throw new Error("width must be a positive number");
  }
  if (
    height !== undefined &&
    (typeof height !== "number" || !Number.isFinite(height) || height <= 0)
  ) {
    throw new Error("height must be a positive number");
  }
};

const handleActionError = (scope: string, error: unknown): never => {
  const fallback = `Failed to ${scope}`;
  console.error(`${fallback}:`, error);
  throw error instanceof Error ? error : new Error(fallback);
};

export type ActionResult = { error: string } | undefined;

// Next masks thrown server action errors in production, so mutations return
// the message instead. Prisma errors are verbose and internal, so they get
// the generic fallback.
const actionFailure = (scope: string, error: unknown): ActionResult => {
  unstable_rethrow(error);
  const fallback = `Failed to ${scope}`;
  console.error(`${fallback}:`, error);
  const isOwnMessage =
    error instanceof Error && !error.constructor.name.startsWith("Prisma");
  return { error: isOwnMessage ? error.message : fallback };
};

// Serialises ordinal allocation per story: concurrent creates otherwise both
// read the same max ordinal under Read Committed.
const lockStory = (tx: Prisma.TransactionClient, storyId: string) =>
  tx.$executeRaw`SELECT 1 FROM "Story" WHERE id = ${storyId} FOR UPDATE`;

const assertAnnotationInStory = async (
  annotationId: string,
  storyId: string,
) => {
  const count = await prisma.annotation.count({
    where: { id: annotationId, storyId },
  });
  if (count === 0) {
    throw new Error("Annotation not found");
  }
};

export const createStory = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const title = getString(formData, "title");
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    const author = getOptionalString(formData, "author");
    const description = getOptionalString(formData, "description");
    const attribution = getOptionalString(formData, "attribution");
    const infoJsonUrl = getString(formData, "imageUrl");

    if (!isValidHttpUrl(infoJsonUrl)) {
      throw new Error("Invalid image URL");
    }

    const width = getPositiveInt(formData, "imageWidth");
    const height = getPositiveInt(formData, "imageHeight");

    const sourceTypeValue = getOptionalString(formData, "sourceType");
    const sourceType: ImageSourceType =
      sourceTypeValue === "manifest"
        ? "manifest"
        : sourceTypeValue === "upload"
          ? "upload"
          : "url";

    const manifestUrl = getOptionalString(formData, "manifestUrl");

    const imageSource = await prisma.imageSource.upsert({
      where: { infoJsonUrl },
      update: {},
      create: {
        infoJsonUrl,
        width,
        height,
        sourceType,
        manifestUrl,
      },
    });

    const story = await prisma.story.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        description: description?.trim() || null,
        attribution: attribution?.trim() || null,
        imageSourceId: imageSource.id,
      },
    });

    redirect(`/editor/${story.id}`);
  } catch (error) {
    return actionFailure("create story", error);
  }
};

export const updateStory = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    if (!id) {
      throw new Error("Story ID is required");
    }

    const title = getString(formData, "title");
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    const author = getOptionalString(formData, "author");
    const description = getOptionalString(formData, "description");
    const attribution = getOptionalString(formData, "attribution");

    await prisma.story.update({
      where: { id },
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        description: description?.trim() || null,
        attribution: attribution?.trim() || null,
      },
    });

    revalidatePath(`/editor/${id}`);
  } catch (error) {
    return actionFailure("update story", error);
  }
};

export const deleteStory = async (id: string): Promise<ActionResult> => {
  try {
    if (!id) {
      throw new Error("Story ID is required");
    }

    await prisma.story.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/");
    redirect("/");
  } catch (error) {
    return actionFailure("delete story", error);
  }
};

export const restoreStory = async (id: string): Promise<ActionResult> => {
  try {
    if (!id) {
      throw new Error("Story ID is required");
    }

    await prisma.story.update({
      where: { id },
      data: { deletedAt: null },
    });
    revalidatePath("/");
    revalidatePath("/admin/storiiies");
  } catch (error) {
    return actionFailure("restore story", error);
  }
};

export const getStories = async (): Promise<StoryWithCount[]> => {
  try {
    return await prisma.story.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        imageSource: true,
        _count: { select: { annotations: true } },
      },
    });
  } catch (error) {
    handleActionError("fetch stories", error);
    throw error;
  }
};

export const getAllStories = async (): Promise<
  (StoryWithCount & { deletedAt: Date | null })[]
> => {
  try {
    return await prisma.story.findMany({
      orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
      include: {
        imageSource: true,
        _count: { select: { annotations: true } },
      },
    });
  } catch (error) {
    handleActionError("fetch all stories", error);
    throw error;
  }
};

export const getStory = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Story ID is required");
    }

    return await prisma.story.findFirst({
      where: { id, deletedAt: null },
      include: {
        imageSource: true,
        annotations: {
          orderBy: { ordinal: "asc" },
          include: {
            images: { orderBy: { ordinal: "asc" } },
            audio: { orderBy: { ordinal: "asc" } },
          },
        },
      },
    });
  } catch (error) {
    handleActionError("fetch story", error);
    throw error;
  }
};

export const isStoryDeleted = async (id: string): Promise<boolean> => {
  try {
    if (!id) return false;

    const story = await prisma.story.findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    return story?.deletedAt !== null && story?.deletedAt !== undefined;
  } catch {
    return false;
  }
};

export const createAnnotation = async (
  storyId: string,
  data: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    viewportX?: number;
    viewportY?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    imageUrls?: string[];
    audioUrls?: string[];
  },
): Promise<ActionResult> => {
  try {
    if (!storyId) {
      throw new Error("Story ID is required");
    }

    validateCoordinates({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    });

    if (
      data.viewportX !== undefined ||
      data.viewportY !== undefined ||
      data.viewportWidth !== undefined ||
      data.viewportHeight !== undefined
    ) {
      validateCoordinates({
        x: data.viewportX,
        y: data.viewportY,
        width: data.viewportWidth,
        height: data.viewportHeight,
      });
    }

    const validImageUrls = data.imageUrls?.filter((url) => {
      if (!url.trim()) return false;
      return isValidHttpUrl(url);
    });

    const validAudioUrls = data.audioUrls?.filter((url) => {
      if (!url.trim()) return false;
      return isValidHttpUrl(url);
    });

    await prisma.$transaction(async (tx) => {
      await lockStory(tx, storyId);
      const maxOrdinal = await tx.annotation.aggregate({
        where: { storyId },
        _max: { ordinal: true },
      });

      return tx.annotation.create({
        data: {
          storyId,
          text: data.text,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          viewportX: data.viewportX,
          viewportY: data.viewportY,
          viewportWidth: data.viewportWidth,
          viewportHeight: data.viewportHeight,
          ordinal: (maxOrdinal._max.ordinal ?? -1) + 1,
          images: validImageUrls?.length
            ? {
                create: validImageUrls.map((url, index) => ({
                  imageUrl: url,
                  ordinal: index,
                })),
              }
            : undefined,
          audio: validAudioUrls?.length
            ? {
                create: validAudioUrls.map((url, index) => ({
                  audioUrl: url,
                  ordinal: index,
                })),
              }
            : undefined,
        },
      });
    });

    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("create annotation", error);
  }
};

export const updateAnnotation = async (
  id: string,
  storyId: string,
  data: {
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
): Promise<ActionResult> => {
  try {
    if (!id || !storyId) {
      throw new Error("Annotation ID and Story ID are required");
    }

    validateCoordinates({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    });

    const { count } = await prisma.annotation.updateMany({
      where: { id, storyId },
      data,
    });
    if (count === 0) {
      throw new Error("Annotation not found");
    }

    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("update annotation", error);
  }
};

export const deleteAnnotation = async (
  id: string,
  storyId: string,
): Promise<ActionResult> => {
  try {
    if (!id || !storyId) {
      throw new Error("Annotation ID and Story ID are required");
    }

    const { count } = await prisma.annotation.deleteMany({
      where: { id, storyId },
    });
    if (count === 0) {
      throw new Error("Annotation not found");
    }
    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("delete annotation", error);
  }
};

export const reorderAnnotations = async (
  storyId: string,
  annotationIds: string[],
): Promise<ActionResult> => {
  try {
    if (!storyId) {
      throw new Error("Story ID is required");
    }

    if (!Array.isArray(annotationIds) || annotationIds.length === 0) {
      throw new Error("Annotation IDs are required");
    }

    // A partial or stale list would leave duplicate ordinals behind.
    const [matching, total] = await Promise.all([
      prisma.annotation.count({
        where: { id: { in: annotationIds }, storyId },
      }),
      prisma.annotation.count({ where: { storyId } }),
    ]);
    if (
      new Set(annotationIds).size !== annotationIds.length ||
      matching !== annotationIds.length ||
      total !== annotationIds.length
    ) {
      throw new Error("Annotation list is out of date. Reload and try again.");
    }

    await prisma.$transaction(
      annotationIds.map((id, index) =>
        prisma.annotation.update({
          where: { id },
          data: { ordinal: index },
        }),
      ),
    );

    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("reorder annotations", error);
  }
};

export const updateAnnotationImages = async (
  annotationId: string,
  storyId: string,
  imageUrls: string[],
): Promise<ActionResult> => {
  try {
    if (!annotationId || !storyId) {
      throw new Error("Annotation ID and Story ID are required");
    }

    await assertAnnotationInStory(annotationId, storyId);

    const validUrls = imageUrls.filter(
      (url) => url.trim() && isValidHttpUrl(url),
    );

    await prisma.$transaction([
      prisma.annotationImage.deleteMany({ where: { annotationId } }),
      ...validUrls.map((url, index) =>
        prisma.annotationImage.create({
          data: {
            annotationId,
            imageUrl: url,
            ordinal: index,
          },
        }),
      ),
    ]);

    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("update annotation images", error);
  }
};

export const updateAnnotationAudio = async (
  annotationId: string,
  storyId: string,
  audioUrls: string[],
): Promise<ActionResult> => {
  try {
    if (!annotationId || !storyId) {
      throw new Error("Annotation ID and Story ID are required");
    }

    await assertAnnotationInStory(annotationId, storyId);

    const validUrls = audioUrls.filter(
      (url) => url.trim() && isValidHttpUrl(url),
    );

    await prisma.$transaction([
      prisma.annotationAudio.deleteMany({ where: { annotationId } }),
      ...validUrls.map((url, index) =>
        prisma.annotationAudio.create({
          data: {
            annotationId,
            audioUrl: url,
            ordinal: index,
          },
        }),
      ),
    ]);

    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("update annotation audio", error);
  }
};

export type ImageSourceWithStories = ImageSource & {
  stories: { id: string; title: string; deletedAt: Date | null }[];
};

export const getImageSources = async (): Promise<ImageSourceWithStories[]> => {
  try {
    const imageSources = await prisma.imageSource.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stories: {
          select: { id: true, title: true, deletedAt: true },
        },
      },
    });

    return imageSources;
  } catch (error) {
    handleActionError("fetch image sources", error);
    throw error;
  }
};

export const getUploadedImages = async (): Promise<
  ImageSourceWithStories[]
> => {
  try {
    const imageSources = await prisma.imageSource.findMany({
      where: { sourceType: "upload" },
      orderBy: { createdAt: "desc" },
      include: {
        stories: {
          select: { id: true, title: true, deletedAt: true },
        },
      },
    });

    return imageSources;
  } catch (error) {
    handleActionError("fetch uploaded images", error);
    throw error;
  }
};
