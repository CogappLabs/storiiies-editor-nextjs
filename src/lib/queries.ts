import type { Prisma } from "@/generated/prisma/client";
import { listAll } from "@/lib/blob";
import { isInfoResponse, thumbnailUrl } from "@/lib/iiif-manifest";
import { prisma } from "@/lib/prisma";

// Reads for server components. Kept out of the "use server" action modules,
// which would expose them as publicly callable endpoints.

const withImageAndCount = {
  imageSource: true,
  _count: { select: { annotations: true } },
} as const;

export const getStories = () =>
  prisma.story.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: withImageAndCount,
  });

export const getAllStories = () =>
  prisma.story.findMany({
    orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
    include: withImageAndCount,
  });

export const storyWithMedia = {
  imageSource: true,
  annotations: {
    orderBy: { ordinal: "asc" },
    include: {
      images: { orderBy: { ordinal: "asc" } },
      audio: { orderBy: { ordinal: "asc" } },
    },
  },
} satisfies Prisma.StoryInclude;

export const getStory = (id: string) =>
  prisma.story.findFirst({
    where: { id, deletedAt: null },
    include: storyWithMedia,
  });

export const isStoryDeleted = async (id: string) => {
  const story = await prisma.story.findUnique({
    where: { id },
    select: { deletedAt: true },
  });
  return Boolean(story?.deletedAt);
};

export const getUploadedImages = async () => {
  const images = await prisma.imageSource.findMany({
    where: { sourceType: "upload" },
    orderBy: { createdAt: "desc" },
    include: {
      stories: { select: { id: true, title: true, deletedAt: true } },
    },
  });
  // info.json says which small size the tile set has for a preview.
  return Promise.all(
    images.map(async (image) => {
      const info = await fetch(image.infoJsonUrl)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
      return {
        ...image,
        thumbnail: isInfoResponse(info)
          ? thumbnailUrl(image.infoJsonUrl, info)
          : null,
      };
    }),
  );
};

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm)$/i;

/**
 * Every file uploaded for annotations (Blob media/), with the annotations that
 * use it. Unreferenced files appear with an empty usedBy.
 */
export const getAnnotationMedia = async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const blobs = await listAll("media/");
  const urls = blobs.map((blob) => blob.url);
  const usage = {
    select: {
      annotation: {
        select: {
          ordinal: true,
          story: { select: { id: true, title: true, deletedAt: true } },
        },
      },
    },
  } as const;
  const [images, audio] = await Promise.all([
    prisma.annotationImage.findMany({
      where: { imageUrl: { in: urls } },
      select: { imageUrl: true, ...usage.select },
    }),
    prisma.annotationAudio.findMany({
      where: { audioUrl: { in: urls } },
      select: { audioUrl: true, ...usage.select },
    }),
  ]);
  const refs = [
    ...images.map((row) => ({ url: row.imageUrl, ...row.annotation })),
    ...audio.map((row) => ({ url: row.audioUrl, ...row.annotation })),
  ];

  return blobs
    .map((blob) => ({
      url: blob.url,
      name: blob.pathname.replace(/^media\//, ""),
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      kind: AUDIO_EXTENSIONS.test(blob.pathname)
        ? ("audio" as const)
        : ("image" as const),
      usedBy: refs.filter((ref) => ref.url === blob.url),
    }))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
};
