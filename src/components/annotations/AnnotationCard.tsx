"use client";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import Image from "next/image";
import { useState } from "react";
import {
  updateAnnotation,
  updateAnnotationAudio,
  updateAnnotationImages,
} from "@/lib/actions/annotations";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationWithMedia } from "@/lib/types";
import Icon from "../ui/Icon";
import AnnotationForm, { type AnnotationFormValues } from "./AnnotationForm";

interface AnnotationCardProps {
  storyId: string;
  annotation: AnnotationWithMedia;
  index: number;
  isSelected: boolean;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  onSelect: () => void;
  onDelete: () => void;
}

const AnnotationCard = ({
  storyId,
  annotation,
  index,
  isSelected,
  dragHandleProps,
  onSelect,
  onDelete,
}: AnnotationCardProps) => {
  const strings = useStrings().annotationList;
  const [isEditing, setIsEditing] = useState(false);

  const save = async ({ text, imageUrls, audioUrls }: AnnotationFormValues) =>
    (await updateAnnotation(annotation.id, storyId, { text })) ??
    (await updateAnnotationImages(annotation.id, storyId, imageUrls)) ??
    (await updateAnnotationAudio(annotation.id, storyId, audioUrls));

  return (
    <div className="flex items-start gap-2">
      {/* biome-ignore lint/a11y/useSemanticElements: Drag handle requires div for dnd library compatibility */}
      <div
        {...dragHandleProps}
        role="button"
        tabIndex={0}
        className="mt-1 cursor-grab text-cogapp-gray hover:text-cogapp-charcoal"
        aria-label={strings.dragHandle}
      >
        <Icon name="drag" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <AnnotationForm
            initial={{
              text: annotation.text,
              imageUrls: annotation.images.map((img) => img.imageUrl),
              audioUrls: annotation.audio.map((aud) => aud.audioUrl),
            }}
            onSubmit={save}
            onDone={() => setIsEditing(false)}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={isSelected}
              className="block w-full text-left"
            >
              <span className="block text-xs text-cogapp-gray mb-1">
                {index + 1}
              </span>
              <span className="block text-sm whitespace-pre-wrap">
                {annotation.text || (
                  <span className="text-cogapp-gray italic">
                    {strings.noText}
                  </span>
                )}
              </span>
            </button>
            {annotation.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {annotation.images.map((img) => (
                  <Image
                    key={img.id}
                    src={img.imageUrl}
                    alt={strings.imageAlt}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover border border-cogapp-charcoal/20"
                  />
                ))}
              </div>
            )}
            {annotation.audio.map((aud) => (
              // biome-ignore lint/a11y/useMediaCaption: Authors supply the audio; no caption files exist to attach.
              <audio
                key={aud.id}
                controls
                preload="none"
                src={aud.audioUrl}
                className="mt-2 w-full h-8"
              />
            ))}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-cogapp-gray hover:text-cogapp-charcoal">
                {strings.dataSummary}
              </summary>
              <dl className="mt-1 p-2 bg-cogapp-cream text-cogapp-gray font-mono space-y-1 break-all">
                <div>
                  <dt className="inline">{strings.rectLabel}: </dt>
                  <dd className="inline">
                    x={Math.round(annotation.x)}, y={Math.round(annotation.y)},
                    w={Math.round(annotation.width)}, h=
                    {Math.round(annotation.height)}
                  </dd>
                </div>
                {annotation.images.length > 0 && (
                  <div>
                    <dt className="inline">{strings.imagesLabel}: </dt>
                    <dd className="inline">
                      {annotation.images.map((img) => img.imageUrl).join(", ")}
                    </dd>
                  </div>
                )}
                {annotation.audio.length > 0 && (
                  <div>
                    <dt className="inline">{strings.audioLabel}: </dt>
                    <dd className="inline">
                      {annotation.audio.map((aud) => aud.audioUrl).join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </details>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-cogapp-gray hover:text-cogapp-charcoal"
            aria-label={strings.editAria}
          >
            <Icon name="edit" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-cogapp-gray hover:text-danger"
            aria-label={strings.deleteAria}
          >
            <Icon name="delete" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnotationCard;
