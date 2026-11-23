import { NextResponse } from "next/server";
import { insertAnnotation } from "@/lib/actions/annotations";
import {
  findLiveStory,
  handle,
  notFound,
  optionalString,
  optionalStrings,
  readBody,
  requiredNumber,
  requiredString,
} from "@/lib/api";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/v1/stories/[id]/annotations">,
) {
  return handle("create annotation", async () => {
    const { id } = await params;
    const body = await readBody(request);
    if (!(await findLiveStory(id))) return notFound();

    const annotationId = await insertAnnotation(id, {
      text: requiredString(body, "text"),
      x: requiredNumber(body, "x"),
      y: requiredNumber(body, "y"),
      width: requiredNumber(body, "width"),
      height: requiredNumber(body, "height"),
      imageUrls: optionalStrings(body, "imageUrls"),
      audioUrls: optionalStrings(body, "audioUrls"),
      youtubeUrl: optionalString(body, "youtubeUrl"),
    });
    return NextResponse.json({ id: annotationId }, { status: 201 });
  });
}
