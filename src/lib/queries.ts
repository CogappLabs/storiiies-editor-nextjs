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

export const getStory = (id: string) =>
  prisma.story.findFirst({
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

export const isStoryDeleted = async (id: string) => {
  const story = await prisma.story.findUnique({
    where: { id },
    select: { deletedAt: true },
  });
  return Boolean(story?.deletedAt);
};

export const getUploadedImages = () =>
  prisma.imageSource.findMany({
    where: { sourceType: "upload" },
    orderBy: { createdAt: "desc" },
    include: {
      stories: { select: { id: true, title: true, deletedAt: true } },
    },
  });
