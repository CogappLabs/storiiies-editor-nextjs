import { type NextRequest, NextResponse } from "next/server";
import { deleteDirectory } from "@/lib/blob";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const imageSource = await prisma.imageSource.findUnique({
      where: { id },
      include: {
        stories: {
          select: { id: true, title: true },
        },
      },
    });

    if (!imageSource) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: imageSource.id,
      originalName: imageSource.originalName,
      width: imageSource.width,
      height: imageSource.height,
      sourceType: imageSource.sourceType,
      infoJson: imageSource.infoJsonUrl,
      createdAt: imageSource.createdAt.toISOString(),
      usedBy: imageSource.stories.map((s) => ({ id: s.id, title: s.title })),
    });
  } catch (error) {
    console.error("Image fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const imageSource = await prisma.imageSource.findUnique({
      where: { id },
      include: { stories: { select: { id: true, title: true } } },
    });

    if (!imageSource) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (imageSource.stories.length > 0) {
      const titles = imageSource.stories.map((s) => s.title).join(", ");
      return NextResponse.json(
        {
          error: `Cannot delete image: it is being used by ${imageSource.stories.length === 1 ? "story" : "stories"} "${titles}"`,
        },
        { status: 409 },
      );
    }

    if (imageSource.sourceType === "upload") {
      await deleteDirectory(`iiif/${id}`);
    }

    await prisma.imageSource.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
