"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import {
  deleteAnnotation,
  reorderAnnotations,
  updateAnnotation,
  updateAnnotationAudio,
  updateAnnotationImages,
} from "@/lib/actions/annotations";
import type { MediaField } from "@/lib/form-utils";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationWithMedia } from "@/lib/types";
import MediaFieldList from "./MediaFieldList";
import { Button } from "./ui";

interface Props {
  storyId: string;
  annotations: AnnotationWithMedia[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const AnnotationList = ({
  storyId,
  annotations,
  selectedId,
  onSelect,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editImageFields, setEditImageFields] = useState<MediaField[]>([]);
  const [editAudioFields, setEditAudioFields] = useState<MediaField[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Shows the dropped order at once; reverts to the server order when the
  // transition ends, by which point revalidation has delivered it.
  const [orderedAnnotations, setOrderedAnnotations] =
    useOptimistic(annotations);
  const strings = useStrings();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(orderedAnnotations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setError(null);
    startTransition(async () => {
      setOrderedAnnotations(items);
      const res = await reorderAnnotations(
        storyId,
        items.map((item) => item.id),
      );
      if (res?.error) setError(res.error);
    });
  };

  const startEditing = (annotation: AnnotationWithMedia) => {
    setEditingId(annotation.id);
    setEditText(annotation.text);
    setEditImageFields(
      annotation.images.map((img) => ({ id: img.id, value: img.imageUrl })),
    );
    setEditAudioFields(
      annotation.audio.map((aud) => ({ id: aud.id, value: aud.audioUrl })),
    );
  };

  const saveEdit = () => {
    if (!editingId) return;

    const urls = (fields: { value: string }[]) =>
      fields.map((field) => field.value.trim()).filter((url) => url !== "");

    setError(null);
    startTransition(async () => {
      const res =
        (await updateAnnotation(editingId, storyId, { text: editText })) ??
        (await updateAnnotationImages(
          editingId,
          storyId,
          urls(editImageFields),
        )) ??
        (await updateAnnotationAudio(
          editingId,
          storyId,
          urls(editAudioFields),
        ));
      if (res?.error) {
        setError(res.error);
        return;
      }
      setEditingId(null);
      setEditText("");
      setEditImageFields([]);
      setEditAudioFields([]);
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditImageFields([]);
    setEditAudioFields([]);
  };

  const handleDelete = (id: string) => {
    if (confirm(strings.annotationList.deleteConfirm)) {
      setError(null);
      startTransition(async () => {
        const res = await deleteAnnotation(id, storyId);
        if (res?.error) {
          setError(res.error);
          return;
        }
        if (selectedId === id) {
          onSelect(null);
        }
      });
    }
  };

  const errorMessage = error && (
    <p role="alert" className="mb-2 text-sm text-danger">
      {error}
    </p>
  );

  if (orderedAnnotations.length === 0) {
    return (
      <>
        {errorMessage}
        <div className="text-cogapp-gray text-center py-8">
          {strings.annotationList.noItems}
        </div>
      </>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {errorMessage}
      <Droppable droppableId="annotations">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {orderedAnnotations.map((annotation, index) => (
              <Draggable
                key={annotation.id}
                draggableId={annotation.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`p-3 border ${
                      selectedId === annotation.id
                        ? "border-cogapp-lavender bg-cogapp-lavender"
                        : "border-cogapp-charcoal/20 bg-white"
                    } ${snapshot.isDragging ? "shadow-lg" : ""} ${
                      isPending ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* biome-ignore lint/a11y/useSemanticElements: Drag handle requires div for dnd library compatibility */}
                      <div
                        {...provided.dragHandleProps}
                        role="button"
                        tabIndex={0}
                        className="mt-1 cursor-grab text-cogapp-gray hover:text-cogapp-charcoal rounded"
                        aria-label={strings.annotationList.dragHandle}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        {editingId === annotation.id ? (
                          <div className="space-y-2">
                            <textarea
                              aria-label={strings.newAnnotationForm.textLabel}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full px-2 py-1 border border-cogapp-charcoal/20 rounded text-sm"
                              rows={3}
                            />
                            <MediaFieldList
                              kind="image"
                              label={strings.annotationList.imagesLabel}
                              fields={editImageFields}
                              setFields={setEditImageFields}
                            />
                            <MediaFieldList
                              kind="audio"
                              label={strings.annotationList.audioLabel}
                              fields={editAudioFields}
                              setFields={setEditAudioFields}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={saveEdit}
                                size="sm"
                                showArrow={false}
                              >
                                {strings.newAnnotationForm.save}
                              </Button>
                              <Button
                                type="button"
                                onClick={cancelEdit}
                                variant="secondary"
                                size="sm"
                              >
                                {strings.newAnnotationForm.cancel}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelect(annotation.id)}
                              aria-pressed={selectedId === annotation.id}
                              className="block w-full text-left rounded"
                            >
                              <span className="block text-xs text-cogapp-gray mb-1">
                                {index + 1}
                              </span>
                              <span className="block text-sm whitespace-pre-wrap">
                                {annotation.text || (
                                  <span className="text-cogapp-gray italic">
                                    {strings.annotationList.noText}
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
                                    alt={strings.annotationList.imageAlt}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover rounded border"
                                    unoptimized
                                  />
                                ))}
                              </div>
                            )}
                            {annotation.audio.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {annotation.audio.map((aud) => (
                                  // biome-ignore lint/a11y/useMediaCaption: Authors supply the audio; no caption files exist to attach.
                                  <audio
                                    key={aud.id}
                                    controls
                                    preload="none"
                                    src={aud.audioUrl}
                                    className="w-full h-8"
                                  />
                                ))}
                              </div>
                            )}
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-cogapp-gray hover:text-cogapp-charcoal rounded">
                                {strings.annotationList.dataSummary}
                              </summary>
                              <div className="mt-1 p-2 bg-cogapp-cream rounded text-cogapp-gray font-mono space-y-1 break-all overflow-hidden">
                                <div>
                                  <span className="text-cogapp-gray">
                                    {strings.annotationList.rectLabel}:
                                  </span>{" "}
                                  x={Math.round(annotation.x)}, y=
                                  {Math.round(annotation.y)}, w=
                                  {Math.round(annotation.width)}, h=
                                  {Math.round(annotation.height)}
                                </div>
                                {annotation.viewportX !== null && (
                                  <div>
                                    <span className="text-cogapp-gray">
                                      {strings.annotationList.viewportLabel}:
                                    </span>{" "}
                                    x={Math.round(annotation.viewportX)}, y=
                                    {Math.round(annotation.viewportY ?? 0)}, w=
                                    {Math.round(annotation.viewportWidth ?? 0)},
                                    h=
                                    {Math.round(annotation.viewportHeight ?? 0)}
                                  </div>
                                )}
                                {annotation.images.length > 0 && (
                                  <div>
                                    <span className="text-cogapp-gray">
                                      {strings.annotationList.imagesLabel}:
                                    </span>{" "}
                                    {annotation.images
                                      .map((img) => img.imageUrl)
                                      .join(", ")}
                                  </div>
                                )}
                                {annotation.audio.length > 0 && (
                                  <div>
                                    <span className="text-cogapp-gray">
                                      {strings.annotationList.audioLabel}:
                                    </span>{" "}
                                    {annotation.audio
                                      .map((aud) => aud.audioUrl)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            </details>
                          </>
                        )}
                      </div>

                      {editingId !== annotation.id && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(annotation)}
                            className="p-1 text-cogapp-gray hover:text-cogapp-charcoal rounded"
                            aria-label={strings.annotationList.editAria}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <title>{strings.annotationList.editAria}</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(annotation.id)}
                            className="p-1 text-cogapp-gray hover:text-danger rounded"
                            aria-label={strings.annotationList.deleteAria}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <title>{strings.annotationList.deleteAria}</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default AnnotationList;
