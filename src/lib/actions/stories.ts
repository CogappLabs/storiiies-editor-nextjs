"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ImageSourceType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidHttpUrl } from "@/lib/validation";
import {
  type ActionResult,
  actionFailure,
  getOptionalString,
  getPositiveInt,
  getString,
} from "./shared";

const SOURCE_TYPES: ImageSourceType[] = ["url", "manifest", "upload"];

const storyFields = (formData: FormData) => {
  const title = getString(formData, "title").trim();
  if (!title) {
    throw new Error("Title is required");
  }
  return {
    title,
    author: getOptionalString(formData, "author"),
    description: getOptionalString(formData, "description"),
    attribution: getOptionalString(formData, "attribution"),
  };
};

export const createStory = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const fields = storyFields(formData);
    const infoJsonUrl = getString(formData, "imageUrl");
    if (!isValidHttpUrl(infoJsonUrl)) {
      throw new Error("Invalid image URL");
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
    await prisma.story.update({ where: { id }, data: storyFields(formData) });
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
    redirect("/");
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
