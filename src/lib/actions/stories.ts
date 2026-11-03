"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  AnnotationMode,
  ImageSourceType,
} from "@/generated/prisma/client";
import { getStrings } from "@/lib/i18n/strings";
import { prisma } from "@/lib/prisma";
import { isValidHttpUrl } from "@/lib/validation";
import {
  type ActionResult,
  actionFailure,
  getOptionalString,
  getPositiveInt,
  getString,
} from "./shared";

const { errors } = getStrings();

const SOURCE_TYPES: ImageSourceType[] = ["url", "manifest", "upload"];
const ANNOTATION_MODES: AnnotationMode[] = ["region", "pin"];

const storyFields = (formData: FormData) => {
  const title = getString(formData, "title").trim();
  if (!title) {
    throw new Error(errors.titleRequired);
  }
  return {
    title,
    author: getOptionalString(formData, "author"),
    description: getOptionalString(formData, "description"),
    attribution: getOptionalString(formData, "attribution"),
    // Absent when the settings form disables the choice.
    annotationMode: ANNOTATION_MODES.find(
      (m) => m === formData.get("annotationMode"),
    ),
  };
};

export const createStory = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const fields = storyFields(formData);
    const infoJsonUrl = getString(formData, "imageUrl");
    if (!isValidHttpUrl(infoJsonUrl)) {
      throw new Error(errors.invalidImageUrl);
    }
    const sourceType =
      SOURCE_TYPES.find((t) => t === formData.get("sourceType")) ?? "url";

    const imageSource = await prisma.imageSource.upsert({
      where: { infoJsonUrl },
      update: {},
      create: {
        infoJsonUrl,
        width: getPositiveInt(formData, "imageWidth"),
        height: getPositiveInt(formData, "imageHeight"),
        sourceType,
        manifestUrl: getOptionalString(formData, "manifestUrl"),
      },
    });

    const story = await prisma.story.create({
      data: { ...fields, imageSourceId: imageSource.id },
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
    const fields = storyFields(formData);
    if (fields.annotationMode) {
      const story = await prisma.story.findUniqueOrThrow({
        where: { id },
        select: {
          annotationMode: true,
          _count: { select: { annotations: true } },
        },
      });
      if (
        story.annotationMode !== fields.annotationMode &&
        story._count.annotations > 0
      ) {
        throw new Error(errors.annotationModeLocked);
      }
    }
    await prisma.story.update({ where: { id }, data: fields });
    revalidatePath(`/editor/${id}`);
  } catch (error) {
    return actionFailure("update story", error);
  }
};

export const deleteStory = async (id: string): Promise<ActionResult> => {
  try {
    await prisma.story.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/");
    revalidatePath("/admin/storiiies");
  } catch (error) {
    return actionFailure("delete story", error);
  }
};

export const restoreStory = async (id: string): Promise<ActionResult> => {
  try {
    await prisma.story.update({ where: { id }, data: { deletedAt: null } });
    revalidatePath("/");
    revalidatePath("/admin/storiiies");
  } catch (error) {
    return actionFailure("restore story", error);
  }
};
