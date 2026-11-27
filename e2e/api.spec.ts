import { expect, test } from "@playwright/test";
import { apiKey } from "../playwright.config";
import { IMAGE_URL, INFO_JSON } from "./fixtures";

test.describe.configure({ mode: "serial" });

const headers = { Authorization: `Bearer ${apiKey}` };
const title = `[e2e api] ${new Date().toISOString()}`;
let storyId = "";
let annotationIds: string[] = [];

test("rejects requests without the API key", async ({ request }) => {
  expect((await request.get("/api/v1/stories")).status()).toBe(401);
  const wrong = await request.get("/api/v1/stories", {
    headers: { Authorization: "Bearer nope" },
  });
  expect(wrong.status()).toBe(401);
});

test("creates a story from a IIIF image", async ({ request }) => {
  const bad = await request.post("/api/v1/stories", {
    headers,
    data: { title, infoJsonUrl: IMAGE_URL },
  });
  expect(bad.status()).toBe(400);

  const res = await request.post("/api/v1/stories", {
    headers,
    data: {
      title,
      infoJsonUrl: INFO_JSON,
      infoPosition: "bottom-left",
      regionMarkers: true,
    },
  });
  expect(res.status()).toBe(201);
  storyId = (await res.json()).id;

  const list = await (await request.get("/api/v1/stories", { headers })).json();
  expect(list.map((s: { id: string }) => s.id)).toContain(storyId);
});

test("updates story fields it is sent", async ({ request }) => {
  const res = await request.patch(`/api/v1/stories/${storyId}`, {
    headers,
    data: { author: "API" },
  });
  expect(res.ok()).toBe(true);
  const story = await res.json();
  expect(story).toMatchObject({
    title,
    author: "API",
    infoPosition: "bottom-left",
    regionMarkers: true,
  });

  const bad = await request.patch(`/api/v1/stories/${storyId}`, {
    headers,
    data: { infoPosition: "middle" },
  });
  expect(bad.status()).toBe(400);
});

test("creates, edits and reorders annotations", async ({ request }) => {
  const notAudio = await request.post(
    `/api/v1/stories/${storyId}/annotations`,
    {
      headers,
      data: {
        text: "x",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        audioUrls: [IMAGE_URL],
      },
    },
  );
  expect(notAudio.status()).toBe(400);

  for (const text of ["First", "Second"]) {
    const res = await request.post(`/api/v1/stories/${storyId}/annotations`, {
      headers,
      data: { text, x: 10, y: 10, width: 50, height: 50 },
    });
    expect(res.status()).toBe(201);
    annotationIds.push((await res.json()).id);
  }

  const edit = await request.patch(
    `/api/v1/stories/${storyId}/annotations/${annotationIds[0]}`,
    { headers, data: { text: "First, edited", imageUrls: [IMAGE_URL] } },
  );
  expect(edit.ok()).toBe(true);
  expect(await edit.json()).toMatchObject({
    text: "First, edited",
    images: [{ imageUrl: IMAGE_URL }],
  });

  annotationIds = annotationIds.toReversed();
  const order = await request.put(`/api/v1/stories/${storyId}/order`, {
    headers,
    data: { annotationIds },
  });
  expect(order.ok()).toBe(true);

  const story = await (
    await request.get(`/api/v1/stories/${storyId}`, { headers })
  ).json();
  expect(story.annotations.map((a: { text: string }) => a.text)).toEqual([
    "Second",
    "First, edited",
  ]);
});

test("deletes an annotation, then the story", async ({ request }) => {
  const del = await request.delete(
    `/api/v1/stories/${storyId}/annotations/${annotationIds[0]}`,
    { headers },
  );
  expect(del.ok()).toBe(true);
  const missing = await request.delete(
    `/api/v1/stories/${storyId}/annotations/${annotationIds[0]}`,
    { headers },
  );
  expect(missing.status()).toBe(404);

  expect(
    (await request.delete(`/api/v1/stories/${storyId}`, { headers })).ok(),
  ).toBe(true);
  expect((await request.get(`/api/manifest/${storyId}`)).status()).toBe(410);
  expect(
    (await request.get(`/api/v1/stories/${storyId}`, { headers })).status(),
  ).toBe(404);
});
