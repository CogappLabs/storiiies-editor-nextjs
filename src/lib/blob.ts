import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { del, list, put } from "@vercel/blob";

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/ld+json",
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

export const deleteDirectory = async (blobPrefix: string): Promise<void> => {
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: blobPrefix, cursor });
    if (result.blobs.length > 0) {
      await del(result.blobs.map((blob) => blob.url));
    }
    cursor = result.cursor;
  } while (cursor);
};

export const getBlobBaseUrl = (): string => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  // Extract store ID from token to construct base URL
  // Token format: vercel_blob_rw_<storeId>_<rest>
  const match = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/);
  if (!match) {
    throw new Error("Invalid BLOB_READ_WRITE_TOKEN format");
  }
  return `https://${match[1]}.public.blob.vercel-storage.com`;
};
