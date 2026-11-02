import { expect, type Page, test } from "@playwright/test";
import sharp from "sharp";
import { blobToken } from "../playwright.config";

// A Cogapp-hosted IIIF image, so the spec does not depend on a third party.
const INFO_JSON =
  "https://storiiies-images.cogapp.com/iiif/2/1793637773002AP198108sRGBWeb.ptif/info.json";
const IMAGE_URL =
  "https://storiiies-images.cogapp.com/iiif/2/1793637773002AP198108sRGBWeb.ptif/full/200,/0/default.jpg";

type Manifest = {
  label: { en: string[] };
  items: {
    annotations?: {
      items: {
        id: string;
        target: string;
        body:
          | { type: string; value?: string; format?: string }
          | { type: string; value?: string; format?: string }[];
      }[];
    }[];
  }[];
};

test.describe.configure({ mode: "serial" });

let storyId = "";
const title = `[e2e] ${new Date().toISOString()}`;

const manifest = async (page: Page): Promise<Manifest> => {
  const res = await page.request.get(`/api/manifest/${storyId}`);
  expect(res.ok()).toBe(true);
  return res.json();
};

const annotations = async (page: Page) =>
  (await manifest(page)).items[0].annotations?.[0].items ?? [];

const bodies = (a: Awaited<ReturnType<typeof annotations>>[number]) =>
  Array.isArray(a.body) ? a.body : [a.body];

const xywh = (target: string) =>
  target.split("#xywh=")[1].split(",").map(Number);

const addAnnotation = async (page: Page, text: string) => {
  await page.getByRole("button", { name: "Add", exact: false }).first().click();
  await page.getByLabel("Annotation text").fill(text);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(text) }),
  ).toBeVisible();
};

test("create a story from a IIIF image URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("IIIF Image URL").fill(INFO_JSON);
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByText(/Valid IIIF image/)).toBeVisible();

  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: /Create Story/ }).click();

  await page.waitForURL(/\/editor\/[0-9a-f-]+$/);
  storyId = page.url().split("/editor/")[1];
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  expect((await manifest(page)).label.en[0]).toBe(title);
});

test("add annotations, one with an image URL", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);

  await page.getByRole("button", { name: "Add", exact: false }).first().click();
  await page.getByLabel("Annotation text").fill("First <note> & more");
  await page.getByRole("button", { name: /Add image/ }).click();
  await page.getByLabel("Images (optional)").fill(IMAGE_URL);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("button", { name: /First <note>/ }),
  ).toBeVisible();

  await addAnnotation(page, "Second note");

  const items = await annotations(page);
  expect(items).toHaveLength(2);
  const [first] = bodies(items[0]);
  expect(first.format).toBe("text/html");
  // Text is escaped; the image is embedded for StoriiiesViewer.
  expect(first.value).toContain("First &lt;note&gt; &amp; more");
  expect(first.value).toContain(`<img src="${IMAGE_URL}"`);
});

test("upload an image file, which is resized to WebP", async ({ page }) => {
  test.skip(
    !blobToken,
    "Needs BLOB_READ_WRITE_TOKEN; uploads go to real Blob storage",
  );
  await page.goto(`/editor/${storyId}`);
  await page.getByRole("button", { name: "Edit annotation" }).nth(1).click();
  await page.getByRole("button", { name: /Add image/ }).click();

  const png = await sharp({
    create: { width: 3000, height: 1500, channels: 3, background: "#227bff" },
  })
    .png()
    .toBuffer();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload" }).click();
  await (await chooser).setFiles({
    name: "e2e.png",
    mimeType: "image/png",
    buffer: png,
  });

  const urlInput = page.getByLabel("Images").last();
  await expect(urlInput).toHaveValue(/\.webp$/, { timeout: 30_000 });
  const uploaded = await urlInput.inputValue();
  await page.getByRole("button", { name: "Save" }).click();

  const res = await page.request.get(uploaded);
  expect(res.headers()["content-type"]).toBe("image/webp");
  const meta = await sharp(await res.body()).metadata();
  expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(2000);
});

test("edit annotation text", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);
  await page.getByRole("button", { name: "Edit annotation" }).nth(1).click();
  await page.getByLabel("Annotation text").fill("Second note, edited");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("button", { name: /Second note, edited/ }),
  ).toBeVisible();

  const items = await annotations(page);
  expect(JSON.stringify(bodies(items[1]))).toContain("Second note, edited");
});

test("resize and move the selected box with the keyboard", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);
  const [x, y, w, h] = xywh((await annotations(page))[0].target);

  await page.getByRole("button", { name: /First <note>/ }).click();
  const box = page.getByLabel(/Selected annotation/);
  await box.focus();
  // Shrink first: the box starts as the whole image, so it has nowhere to move.
  await box.press("Shift+ArrowUp");
  await box.press("Shift+ArrowLeft");
  await box.press("ArrowDown");
  await box.press("ArrowRight");

  await expect
    .poll(async () => xywh((await annotations(page))[0].target))
    .toEqual([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ]);
  await expect
    .poll(async () => {
      const [nx, ny, nw, nh] = xywh((await annotations(page))[0].target);
      return nx > x && ny > y && nw < w && nh < h;
    })
    .toBe(true);
});

test("reorder annotations by dragging with the keyboard", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);
  const [firstId] = (await annotations(page)).map((a) => a.id);

  const handle = page
    .getByRole("button", { name: "Drag to reorder annotation" })
    .first();
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");

  await expect
    .poll(async () => (await annotations(page)).map((a) => a.id)[1])
    .toBe(firstId);
});

test("delete an annotation", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete annotation" }).first().click();

  await expect.poll(async () => (await annotations(page)).length).toBe(1);
});

test("rename and delete the story", async ({ page }) => {
  await page.goto(`/editor/${storyId}`);
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(`${title} renamed`);
  await dialog.getByRole("button", { name: /Save Changes/ }).click();
  await expect(
    page.getByRole("heading", { name: `${title} renamed` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Delete Story/ }).click();
  await page.waitForURL((url) => url.pathname === "/");

  const res = await page.request.get(`/api/manifest/${storyId}`);
  expect(res.status()).toBe(410);
});
