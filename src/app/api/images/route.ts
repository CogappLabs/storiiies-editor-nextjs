import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getBlobBaseUrl, uploadDirectory } from "@/lib/blob";
import { cleanupTempDir, generateIIIFTiles } from "@/lib/iiif";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format) {
        return NextResponse.json(
          { error: "File is not a valid image" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "File is not a valid image" },
        { status: 400 },
      );
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

export async function GET() {
  try {
    const imageSources = await prisma.imageSource.findMany({
      where: { sourceType: "upload" },
      orderBy: { createdAt: "desc" },
      include: {
        stories: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({
      images: imageSources.map((imageSource) => ({
        id: imageSource.id,
        originalName: imageSource.originalName,
        width: imageSource.width,
        height: imageSource.height,
        infoJson: imageSource.infoJsonUrl,
        createdAt: imageSource.createdAt.toISOString(),
        usedBy: imageSource.stories.map((s) => ({
          id: s.id,
          title: s.title,
        })),
      })),
    });
  } catch (error) {
    console.error("Image list error:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 },
    );
  }
}
