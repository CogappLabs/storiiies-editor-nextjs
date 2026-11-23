import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_FILE_SIZE_BYTES, MAX_MEDIA_SIZE_BYTES } from "@/lib/validation";

// Issues short-lived tokens so the browser uploads straight to Vercel Blob,
// bypassing the 4.5 MB function body limit: annotation media under media/, and
// story images under originals/ until /api/images tiles and deletes them.
// Basic auth in proxy.ts guards this route. No onUploadCompleted: Blob's
// callback would hit that auth wall, and the follow-up request records the file.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith("originals/")) {
          return {
            allowedContentTypes: ["image/*"],
            maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
            addRandomSuffix: true,
          };
        }
        if (!pathname.startsWith("media/")) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ["image/*", "audio/*"],
          maximumSizeInBytes: MAX_MEDIA_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
