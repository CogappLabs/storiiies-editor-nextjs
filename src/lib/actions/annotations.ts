"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type ActionResult,
  actionFailure,
  httpUrls,
  validateCoordinates,
} from "./shared";

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
    validateCoordinates(data);
    validateCoordinates({
      x: data.viewportX,
      y: data.viewportY,
      width: data.viewportWidth,
      height: data.viewportHeight,
    });
    const { imageUrls, audioUrls, ...fields } = data;

    await prisma.$transaction(async (tx) => {
      await lockStory(tx, storyId);
      const { _max } = await tx.annotation.aggregate({
        where: { storyId },
        _max: { ordinal: true },
      });
      await tx.annotation.create({
        data: {
          ...fields,
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
  },
): Promise<ActionResult> => {
  try {
    validateCoordinates(data);
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
    revalidatePath(`/editor/${storyId}`);
  } catch (error) {
    return actionFailure("update annotation audio", error);
  }
};
