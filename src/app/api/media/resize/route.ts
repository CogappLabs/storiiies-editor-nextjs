import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getBlobBaseUrl } from "@/lib/blob";
import { getStrings } from "@/lib/i18n/strings";

const MAX_EDGE = 2000;
const { errors } = getStrings();

// Annotation images upload from the browser at full size (see ../route.ts);
// this swaps the original for a web-sized WebP.
export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };

    // Only our own Blob store, so this route can't be pointed at other hosts.
    const source = new URL(url ?? "");
    if (
      // URL parsing lowercases the host; the token's store ID may not be.
      source.origin !== new URL(getBlobBaseUrl()).origin ||
      !source.pathname.startsWith("/media/")
    ) {
      return NextResponse.json(
        { error: errors.invalidImageUrl },
        { status: 400 },
      );
    }

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(errors.fetchUploadFailed(response.status));
    }

    const resized = await sharp(Buffer.from(await response.arrayBuffer()), {
      animated: true,
    })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    const name = source.pathname.replace(/\.[^./]+$/, "").slice(1);
    const { url: resizedUrl } = await put(`${name}.webp`, resized, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    });
    await del(source.toString());

    return NextResponse.json({ url: resizedUrl });
  } catch (error) {
    console.error("Media resize error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resize failed" },
      { status: 500 },
    );
  }
}
