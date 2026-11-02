"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useOptimistic, useState, useTransition } from "react";
import {
  deleteAnnotation,
  reorderAnnotations,
} from "@/lib/actions/annotations";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationWithMedia } from "@/lib/types";
import { ConfirmDialog } from "../ui";
import AnnotationCard from "./AnnotationCard";

interface AnnotationListProps {
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
}: AnnotationListProps) => {
  const { annotationList: strings, common } = useStrings();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Shows the dropped order at once; reverts to the server order when the
  // transition ends, by which point revalidation has delivered it.
  const [ordered, setOrdered] = useOptimistic(annotations);

  const run = (action: () => Promise<{ error: string } | undefined>) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
    });
  };

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;
    const items = [...ordered];
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);
    run(async () => {
      setOrdered(items);
      return reorderAnnotations(
        storyId,
        items.map((item) => item.id),
      );
    });
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    if (selectedId === deletingId) onSelect(null);
    run(async () => {
      const res = await deleteAnnotation(deletingId, storyId);
      if (!res?.error) setDeletingId(null);
      return res;
    });
  };

  return (
    <>
      {error && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {error}
        </p>
      )}
      {ordered.length === 0 ? (
        <p className="text-cogapp-gray text-center py-8">{strings.noItems}</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="annotations">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {ordered.map((annotation, index) => (
                  <Draggable
                    key={annotation.id}
                    draggableId={annotation.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative p-3 border ${
                          selectedId === annotation.id
                            ? "border-cogapp-lavender bg-cogapp-lavender"
                            : "border-cogapp-charcoal/20 bg-white hover:bg-cogapp-cream/50"
                        } ${snapshot.isDragging ? "shadow-lg" : ""} ${
                          isPending ? "opacity-50" : ""
                        }`}
                      >
                        <AnnotationCard
                          storyId={storyId}
                          annotation={annotation}
                          index={index}
                          isSelected={selectedId === annotation.id}
                          dragHandleProps={provided.dragHandleProps}
                          onSelect={() => onSelect(annotation.id)}
                          onDelete={() => setDeletingId(annotation.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {deletingId && (
        <ConfirmDialog
          title={common.confirmDeleteTitle}
          message={strings.deleteConfirm}
          confirmLabel={common.delete}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
          pending={isPending}
          error={error}
        />
      )}
    </>
  );
};

export default AnnotationList;
