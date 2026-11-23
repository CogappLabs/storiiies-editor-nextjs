import { NextResponse } from "next/server";
import { insertStory } from "@/lib/actions/stories";
import {
  BadRequest,
  handle,
  optionalString,
  readBody,
  requiredString,
} from "@/lib/api";
import { getStrings } from "@/lib/i18n/strings";
import { isInfoResponse, normalizeInfoUrl } from "@/lib/iiif-manifest";
import { getStories } from "@/lib/queries";
import { isValidHttpUrl } from "@/lib/validation";

const { errors } = getStrings();

export async function GET() {
  return handle("list stories", async () =>
    NextResponse.json(await getStories()),
  );
}

export async function POST(request: Request) {
  return handle("create story", async () => {
    const body = await readBody(request);
    const infoJsonUrl = normalizeInfoUrl(requiredString(body, "infoJsonUrl"));
    if (!isValidHttpUrl(infoJsonUrl)) {
      throw new BadRequest(errors.invalidImageUrl);
    }
    const info = await fetch(infoJsonUrl, {
      signal: AbortSignal.timeout(10_000),
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    if (!isInfoResponse(info)) {
      throw new BadRequest(errors.notIiifImage);
    }

    const formData = new FormData();
    formData.set("title", requiredString(body, "title"));
    for (const key of [
      "author",
      "description",
      "attribution",
      "annotationMode",
      "infoPosition",
    ]) {
      const value = optionalString(body, key);
      if (value !== undefined) formData.set(key, value);
    }
    formData.set("imageUrl", infoJsonUrl);
    formData.set("imageWidth", String(info.width));
    formData.set("imageHeight", String(info.height));
    formData.set("sourceType", "url");

    const id = await insertStory(formData);
    const origin = new URL(request.url).origin;
    return NextResponse.json(
      {
        id,
        editorUrl: `${origin}/editor/${id}`,
        manifestUrl: `${origin}/api/manifest/${id}`,
      },
      { status: 201 },
    );
  });
}
