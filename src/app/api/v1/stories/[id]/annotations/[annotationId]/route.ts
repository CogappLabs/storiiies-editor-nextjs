import { NextResponse } from "next/server";
import {
  deleteAnnotation,
  updateAnnotation,
  updateAnnotationAudio,
  updateAnnotationImages,
} from "@/lib/actions/annotations";
import {
  handle,
  optionalNumber,
  optionalString,
  optionalStrings,
  readBody,
  respond,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { storyWithMedia } from "@/lib/queries";

type Context = RouteContext<"/api/v1/stories/[id]/annotations/[annotationId]">;

export async function PATCH(request: Request, { params }: Context) {
  return handle("update annotation", async () => {
    const { id, annotationId } = await params;
    const body = await readBody(request);
    const imageUrls = optionalStrings(body, "imageUrls");
    const audioUrls = optionalStrings(body, "audioUrls");

    // Each step saves on its own, so a later failure leaves earlier ones in.
    const result =
      (await updateAnnotation(annotationId, id, {
        text: optionalString(body, "text"),
        x: optionalNumber(body, "x"),
        y: optionalNumber(body, "y"),
        width: optionalNumber(body, "width"),
        height: optionalNumber(body, "height"),
        youtubeUrl: optionalString(body, "youtubeUrl"),
      })) ??
      (imageUrls &&
        (await updateAnnotationImages(annotationId, id, imageUrls))) ??
      (audioUrls && (await updateAnnotationAudio(annotationId, id, audioUrls)));
    if (result) return respond(result);

    return NextResponse.json(
      await prisma.annotation.findUnique({
        where: { id: annotationId },
        include: storyWithMedia.annotations.include,
      }),
    );
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  return handle("delete annotation", async () => {
    const { id, annotationId } = await params;
    return respond(await deleteAnnotation(annotationId, id));
  });
}
