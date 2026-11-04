"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { deleteOrphanedMedia } from "@/lib/blob";
import { getStrings } from "@/lib/i18n/strings";
import { prisma } from "@/lib/prisma";
import { parseYoutubeId } from "@/lib/youtube";
import {
  type ActionResult,
  actionFailure,
  httpUrls,
  validateCoordinates,
} from "./shared";

const { errors } = getStrings();

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
    throw new Error(errors.annotationNotFound);
  }
};

/** Null for a blank field; throws on a URL that isn't a YouTube video. */
const toYoutubeId = (url: string) => {
  if (!url.trim()) return null;
  const id = parseYoutubeId(url);
  if (!id) throw new Error(errors.invalidYoutubeUrl);
  return id;
};

// After the response, so a slow or failing Blob call never blocks a save.
const cleanUpMedia = (urls: string[]) =>
  after(() =>
    deleteOrphanedMedia(urls).catch((error) =>
      console.error("Failed to delete orphaned media:", error),
    ),
  );

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
    youtubeUrl?: string;
  },
): Promise<ActionResult> => {
  try {
    validateCoordinates(data);
    validateCoordinates({
      x: data.viewportX,
      y: data.viewportY,
      width: data.viewportWidth,
      height: data.viewportHeight,
    });
    const { imageUrls, audioUrls, youtubeUrl = "", ...fields } = data;
    const youtubeId = toYoutubeId(youtubeUrl);

    await prisma.$transaction(async (tx) => {
      await lockStory(tx, storyId);
      const { _max } = await tx.annotation.aggregate({
        where: { storyId },
        _max: { ordinal: true },
      });
      await tx.annotation.create({
        data: {
          ...fields,
          youtubeId,
          storyId,
          ordinal: (_max.ordinal ?? -1) + 1,
          images: {
            create: httpUrls(imageUrls).map((imageUrl, ordinal) => ({
              imageUrl,
              ordinal,
            })),
          },
          audio: {
            create: httpUrls(audioUrls).map((audioUrl, ordinal) => ({
              audioUrl,
              ordinal,
            })),
          },
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
    youtubeUrl?: string;
  },
): Promise<ActionResult> => {
  try {
    validateCoordinates(data);
    const { youtubeUrl, ...fields } = data;
    const { count } = await prisma.annotation.updateMany({
      where: { id, storyId },
      data: {
        ...fields,
        ...(youtubeUrl !== undefined && { youtubeId: toYoutubeId(youtubeUrl) }),
      },
    });
    if (count === 0) {
      throw new Error(errors.annotationNotFound);
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
    const annotation = await prisma.annotation.findFirst({
      where: { id, storyId },
      select: { images: true, audio: true },
    });
    if (!annotation) {
      throw new Error(errors.annotationNotFound);
    }
    await prisma.annotation.delete({ where: { id } });
    cleanUpMedia([
      ...annotation.images.map((img) => img.imageUrl),
      ...annotation.audio.map((aud) => aud.audioUrl),
    ]);
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
      throw new Error(errors.annotationListStale);
    }

    await prisma.$transaction(
      annotationIds.map((id, ordinal) =>
        prisma.annotation.update({ where: { id }, data: { ordinal } }),
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
    await assertAnnotationInStory(annotationId, storyId);
    const previous = await prisma.annotationImage.findMany({
      where: { annotationId },
      select: { imageUrl: true },
    });
    await prisma.$transaction([
      prisma.annotationImage.deleteMany({ where: { annotationId } }),
      prisma.annotationImage.createMany({
        data: httpUrls(imageUrls).map((imageUrl, ordinal) => ({
          annotationId,
          imageUrl,
          ordinal,
        })),
      }),
    ]);
    cleanUpMedia(previous.map((row) => row.imageUrl));
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
    await assertAnnotationInStory(annotationId, storyId);
    const previous = await prisma.annotationAudio.findMany({
      where: { annotationId },
      select: { audioUrl: true },
    });
    await prisma.$transaction([
      prisma.annotationAudio.deleteMany({ where: { annotationId } }),
      prisma.annotationAudio.createMany({
        data: httpUrls(audioUrls).map((audioUrl, ordinal) => ({
          annotationId,
          audioUrl,
          ordinal,
        })),
      }),
    ]);
    cleanUpMedia(previous.map((row) => row.audioUrl));
    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("update annotation audio", error);
  }
};

/** Deletes an uploaded media file, but only if no annotation references it. */
export const deleteUnusedMedia = async (url: string): Promise<ActionResult> => {
  try {
    await deleteOrphanedMedia([url]);
    revalidatePath("/admin/images");
  } catch (error) {
    return actionFailure("delete media", error);
  }
};
