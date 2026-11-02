import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { del, type ListBlobResultBlob, list, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  // Blob serves only some types inline; application/ld+json downloads instead
  // of displaying. IIIF accepts plain JSON for info.json.
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const getContentType = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
};

const getFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
};

export const uploadDirectory = async (
  localDir: string,
  blobPrefix: string,
): Promise<string[]> => {
  const files = await getFilesRecursive(localDir);
  const uploadedUrls: string[] = [];

  // A large image makes thousands of tiles; one at a time can exceed the
  // function timeout.
  const BATCH_SIZE = 20;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const urls = await Promise.all(
      batch.map(async (filePath) => {
        const relativePath = filePath.replace(localDir, "");
        const { url } = await put(
          `${blobPrefix}${relativePath}`,
          await readFile(filePath),
          {
            access: "public",
            addRandomSuffix: false,
            contentType: getContentType(filePath),
          },
        );
        return url;
      }),
    );
    uploadedUrls.push(...urls);
  }

  return uploadedUrls;
};

export const listAll = async (prefix: string) => {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor });
    blobs.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor);
  return blobs;
};

export const deleteDirectory = async (blobPrefix: string): Promise<void> => {
  const blobs = await listAll(blobPrefix);
  if (blobs.length > 0) {
    await del(blobs.map((blob) => blob.url));
  }
};

export const getBlobBaseUrl = (): string => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  // Token format: vercel_blob_rw_<storeId>_<rest>
  const match = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/);
  if (!match) {
    throw new Error("Invalid BLOB_READ_WRITE_TOKEN format");
  }
  return `https://${match[1]}.public.blob.vercel-storage.com`;
};

/**
 * Deletes uploaded annotation media (this store's media/ folder) that no
 * annotation references any more. Pasted URLs from other hosts are ignored.
 */
export const deleteOrphanedMedia = async (urls: string[]) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const store = new URL(getBlobBaseUrl()).origin;
  const uploaded = urls.filter((url) => {
    const parsed = URL.canParse(url) ? new URL(url) : null;
    return parsed?.origin === store && parsed.pathname.startsWith("/media/");
  });
  if (uploaded.length === 0) return;

  const [images, audio] = await Promise.all([
    prisma.annotationImage.findMany({
      where: { imageUrl: { in: uploaded } },
      select: { imageUrl: true },
    }),
    prisma.annotationAudio.findMany({
      where: { audioUrl: { in: uploaded } },
      select: { audioUrl: true },
    }),
  ]);
  const inUse = new Set([
    ...images.map((i) => i.imageUrl),
    ...audio.map((a) => a.audioUrl),
  ]);
  const orphans = uploaded.filter((url) => !inUse.has(url));
  if (orphans.length > 0) await del(orphans);
};
