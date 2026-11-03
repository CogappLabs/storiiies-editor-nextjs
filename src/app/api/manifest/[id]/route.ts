import { type NextRequest, NextResponse } from "next/server";
import { getStrings } from "@/lib/i18n/strings";
import { prisma } from "@/lib/prisma";
import { storyWithMedia } from "@/lib/queries";

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const { errors } = getStrings();

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/manifest/[id]">,
) {
  const { id } = await params;
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  // findUnique rather than getStory: a deleted story answers 410, not 404.
  const story = await prisma.story.findUnique({
    where: { id },
    include: storyWithMedia,
  });

  if (!story) {
    return NextResponse.json({ error: errors.storyNotFound }, { status: 404 });
  }

  if (story.deletedAt) {
    return NextResponse.json({ error: errors.storyDeleted }, { status: 410 });
  }

  const imageServiceUrl = story.imageSource.infoJsonUrl.replace(
    /\/info\.json$/,
    "",
  );

  const canvasId = `${baseUrl}/api/manifest/${story.id}/canvas/1`;

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
        id: canvasId,
        type: "Canvas",
        width: story.imageSource.width,
        height: story.imageSource.height,
        items: [
          {
            id: `${canvasId}/page`,
            type: "AnnotationPage",
            items: [
              {
                id: `${canvasId}/page/image`,
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
                target: canvasId,
              },
            ],
          },
        ],
        annotations:
          story.annotations.length > 0
            ? [
                {
                  id: `${canvasId}/annotations`,
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
                      id: `${canvasId}/annotations/${annotation.id}`,
                      type: "Annotation",
                      motivation: "commenting",
                      body,
                      target:
                        story.annotationMode === "pin"
                          ? {
                              type: "SpecificResource",
                              // Clover resolves the canvas by type, so a
                              // bare id string crashes its annotation panel.
                              source: { id: canvasId, type: "Canvas" },
                              selector: {
                                type: "PointSelector",
                                x: Math.round(annotation.x),
                                y: Math.round(annotation.y),
                              },
                            }
                          : `${canvasId}#xywh=${Math.round(annotation.x)},${Math.round(annotation.y)},${Math.round(annotation.width)},${Math.round(annotation.height)}`,
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
