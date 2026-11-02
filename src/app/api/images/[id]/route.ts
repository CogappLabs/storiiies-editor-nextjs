import { type NextRequest, NextResponse } from "next/server";
import { deleteDirectory } from "@/lib/blob";
import { getStrings } from "@/lib/i18n/strings";
import { prisma } from "@/lib/prisma";

const { errors } = getStrings();

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext<"/api/images/[id]">,
) {
  try {
    const { id } = await params;
    const imageSource = await prisma.imageSource.findUnique({
      where: { id },
      include: { stories: { select: { id: true, title: true } } },
    });

    if (!imageSource) {
      return NextResponse.json(
        { error: errors.imageNotFound },
        { status: 404 },
      );
    }

    if (imageSource.stories.length > 0) {
      const titles = imageSource.stories.map((s) => s.title).join(", ");
      return NextResponse.json(
        {
          error: errors.imageInUse(titles, imageSource.stories.length),
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
      { error: errors.deleteImageFailed },
      { status: 500 },
    );
  }
}
