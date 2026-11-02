import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getBlobBaseUrl, uploadDirectory } from "@/lib/blob";
import { getStrings } from "@/lib/i18n/strings";
import { cleanupTempDir, generateIIIFTiles } from "@/lib/iiif";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/validation";

const { errors } = getStrings();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: errors.noImageFile }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: errors.fileTooLarge(MAX_FILE_SIZE_MB) },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

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
        originalName: file.name,
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
  }
}
