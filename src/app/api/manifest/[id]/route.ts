import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      imageSource: true,
      annotations: {
        orderBy: { ordinal: "asc" },
        include: {
          images: { orderBy: { ordinal: "asc" } },
          audio: { orderBy: { ordinal: "asc" } },
        },
      },
    },
  });

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  if (story.deletedAt) {
    return NextResponse.json(
      { error: "This story has been deleted and is no longer available" },
      { status: 410 },
    );
  }

  const imageServiceUrl = story.imageSource.infoJsonUrl.replace(
    /\/info\.json$/,
    "",
  );

  const manifest = {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    id: `${baseUrl}/api/manifest/${story.id}`,
    type: "Manifest",
    label: { en: [story.title] },
    ...(story.author && {
      metadata: [{ label: { en: ["Author"] }, value: { en: [story.author] } }],
    }),
    ...(story.description && { summary: { en: [story.description] } }),
    ...(story.attribution && {
      requiredStatement: {
        label: { en: ["Attribution"] },
        value: { en: [story.attribution] },
      },
    }),
    items: [
      {
        id: `${baseUrl}/api/manifest/${story.id}/canvas/1`,
        type: "Canvas",
        width: story.imageSource.width,
        height: story.imageSource.height,
        items: [
          {
            id: `${baseUrl}/api/manifest/${story.id}/canvas/1/page`,
            type: "AnnotationPage",
            items: [
              {
                id: `${baseUrl}/api/manifest/${story.id}/canvas/1/page/image`,
                type: "Annotation",
                motivation: "painting",
                body: {
                  id: `${imageServiceUrl}/full/max/0/default.jpg`,
                  type: "Image",
                  format: "image/jpeg",
                  width: story.imageSource.width,
                  height: story.imageSource.height,
                  service: [
                    {
                      id: imageServiceUrl,
                      type: "ImageService3",
                      // Uploads are static sharp tiles, which only support level0.
                      profile:
                        story.imageSource.sourceType === "upload"
                          ? "level0"
                          : "level1",
                    },
                  ],
                },
                target: `${baseUrl}/api/manifest/${story.id}/canvas/1`,
              },
            ],
          },
        ],
        annotations:
          story.annotations.length > 0
            ? [
                {
                  id: `${baseUrl}/api/manifest/${story.id}/canvas/1/annotations`,
                  type: "AnnotationPage",
                  items: story.annotations.map((annotation) => {
                    // StoriiiesViewer renders only TextualBody and Sound
                    // bodies, so images go inline as <img> in an HTML body.
                    const textBody =
                      annotation.images.length > 0
                        ? {
                            type: "TextualBody",
                            value: [
                              `<p>${escapeHtml(annotation.text).replace(/\r?\n/g, "<br>")}</p>`,
                              ...annotation.images.map(
                                (img) =>
                                  `<p><img src="${escapeHtml(img.imageUrl)}" alt=""></p>`,
                              ),
                            ].join(""),
                            language: "en",
                            format: "text/html",
                          }
                        : {
                            type: "TextualBody",
                            value: annotation.text,
                            language: "en",
                            format: "text/plain",
                          };

                    const audioBodies = annotation.audio.map((aud) => ({
                      type: "Sound",
                      id: aud.audioUrl,
                      format: "audio/mpeg",
                    }));

                    const body =
                      audioBodies.length > 0
                        ? [textBody, ...audioBodies]
                        : textBody;

                    return {
                      id: `${baseUrl}/api/manifest/${story.id}/canvas/1/annotations/${annotation.id}`,
                      type: "Annotation",
                      motivation: "commenting",
                      body,
                      target: `${baseUrl}/api/manifest/${story.id}/canvas/1#xywh=${Math.round(annotation.x)},${Math.round(annotation.y)},${Math.round(annotation.width)},${Math.round(annotation.height)}`,
                    };
                  }),
                },
              ]
            : undefined,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type":
        'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json"',
      "Access-Control-Allow-Origin": "*",
    },
  });
}
