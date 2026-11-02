import type {
  Annotation,
  AnnotationAudio,
  AnnotationImage,
  ImageSource,
  Story,
} from "@/generated/prisma/client";

export interface IIIFInfo {
  width: number;
  height: number;
  "@context"?: unknown;
  "@id"?: string;
  id?: string;
  profile?: unknown;
  tiles?: { scaleFactors?: number[] }[];
}

export type Rect = { x: number; y: number; width: number; height: number };

// The view an annotation was created from, alongside its box.
export type AnnotationBounds = { rect: Rect; viewport: Rect };

export type AnnotationWithMedia = Annotation & {
  images: AnnotationImage[];
  audio: AnnotationAudio[];
};

export type StoryWithAnnotations = Story & {
  imageSource: ImageSource;
  annotations: AnnotationWithMedia[];
};
