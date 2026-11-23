import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getBlobBaseUrl, uploadDirectory } from "@/lib/blob";
import { getStrings } from "@/lib/i18n/strings";
import { cleanupTempDir, generateIIIFTiles } from "@/lib/iiif";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/validation";

const { errors } = getStrings();

// The browser uploads the original to Blob under originals/ (see
// ../media/route.ts) and posts its URL here. The original is deleted once
// tiled, or on failure.
export async function POST(request: Request) {
  let source: URL | null = null;
  try {
    const { url, name } = (await request.json()) as {
      url?: string;
      name?: string;
    };

    // Only our own Blob store, so this route can't be pointed at other hosts.
    const candidate = URL.canParse(url ?? "") ? new URL(url ?? "") : null;
    if (
      !candidate ||
      // URL parsing lowercases the host; the token's store ID may not be.
      candidate.origin !== new URL(getBlobBaseUrl()).origin ||
      !candidate.pathname.startsWith("/originals/")
    ) {
      return NextResponse.json({ error: errors.noImageFile }, { status: 400 });
    }
    source = candidate;

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(errors.fetchUploadFailed(response.status));
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: errors.fileTooLarge(MAX_FILE_SIZE_MB) },
        { status: 400 },
      );
    }

    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format) {
        return NextResponse.json({ error: errors.notAnImage }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: errors.notAnImage }, { status: 400 });
    }

    const imageId = crypto.randomUUID();
    const blobBaseUrl = getBlobBaseUrl();

    const { tempDir, tileDir, width, height } = await generateIIIFTiles(
      buffer,
      imageId,
      blobBaseUrl,
    );

    try {
      await uploadDirectory(tileDir, `iiif/${imageId}`);
    } finally {
      await cleanupTempDir(tempDir);
    }

    const infoJsonUrl = `${blobBaseUrl}/iiif/${imageId}/info.json`;

    const imageSource = await prisma.imageSource.create({
      data: {
        id: imageId,
        infoJsonUrl,
        width,
        height,
        sourceType: "upload",
        originalName: name || null,
      },
    });

    return NextResponse.json({
      id: imageSource.id,
      originalName: imageSource.originalName,
      width: imageSource.width,
      height: imageSource.height,
      infoJson: infoJsonUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 },
    );
  } finally {
    if (source) {
      await del(source.toString()).catch((error) =>
        console.error("Failed to delete upload original:", error),
      );
    }
  }
}
