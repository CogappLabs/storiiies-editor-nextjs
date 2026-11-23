import { NextResponse } from "next/server";
import { deleteStory, updateStory } from "@/lib/actions/stories";
import {
  BadRequest,
  findLiveStory,
  handle,
  notFound,
  optionalString,
  readBody,
  respond,
} from "@/lib/api";
import { getStrings } from "@/lib/i18n/strings";
import { getStory } from "@/lib/queries";
import { toInfoPosition } from "@/lib/viewers";

const { errors } = getStrings();

type Context = RouteContext<"/api/v1/stories/[id]">;

export async function GET(_request: Request, { params }: Context) {
  return handle("get story", async () => {
    const story = await getStory((await params).id);
    return story ? NextResponse.json(story) : notFound();
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return handle("update story", async () => {
    const { id } = await params;
    const body = await readBody(request);
    const story = await findLiveStory(id);
    if (!story) return notFound();

    // updateStory takes the whole settings form, so absent fields keep
    // their current values.
    const formData = new FormData();
    formData.set("title", optionalString(body, "title") ?? story.title);
    for (const key of ["author", "description", "attribution"] as const) {
      const value = body[key] === null ? "" : optionalString(body, key);
      formData.set(key, value ?? story[key] ?? "");
    }
    const infoPosition = optionalString(body, "infoPosition");
    if (infoPosition !== undefined && !toInfoPosition(infoPosition)) {
      throw new BadRequest(errors.invalidField("infoPosition"));
    }
    formData.set("infoPosition", infoPosition ?? story.infoPosition);
    const annotationMode = optionalString(body, "annotationMode");
    if (annotationMode !== undefined) {
      if (annotationMode !== "region" && annotationMode !== "pin") {
        throw new BadRequest(errors.invalidField("annotationMode"));
      }
      formData.set("annotationMode", annotationMode);
    }

    const result = await updateStory(id, formData);
    return result ? respond(result) : NextResponse.json(await getStory(id));
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  return handle("delete story", async () => {
    const { id } = await params;
    if (!(await findLiveStory(id))) return notFound();
    return respond(await deleteStory(id));
  });
}
