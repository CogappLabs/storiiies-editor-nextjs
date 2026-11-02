"use client";

import { useId, useState, useTransition } from "react";
import { createAnnotation } from "@/lib/actions/annotations";
import type { MediaField } from "@/lib/form-utils";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationBounds } from "@/lib/types";
import MediaFieldList from "./MediaFieldList";
import { Button } from "./ui";

interface NewAnnotationFormProps {
  storyId: string;
  pendingData: AnnotationBounds;
  onSave: () => void;
  onCancel: () => void;
}

const NewAnnotationForm = ({
  storyId,
  pendingData,
  onSave,
  onCancel,
}: NewAnnotationFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [imageFields, setImageFields] = useState<MediaField[]>([]);
  const [audioFields, setAudioFields] = useState<MediaField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const strings = useStrings();
  const textAreaId = useId();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await createAnnotation(storyId, {
        text,
        x: pendingData.rect.x,
        y: pendingData.rect.y,
        width: pendingData.rect.width,
        height: pendingData.rect.height,
        viewportX: pendingData.viewport.x,
        viewportY: pendingData.viewport.y,
        viewportWidth: pendingData.viewport.width,
        viewportHeight: pendingData.viewport.height,
        imageUrls: imageFields
          .map((field) => field.value.trim())
          .filter((url) => url !== ""),
        audioUrls: audioFields
          .map((field) => field.value.trim())
          .filter((url) => url !== ""),
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      onSave();
    });
  };

  return (
    <div className="mb-4 p-3 border-2 border-cogapp-lavender bg-cogapp-lavender/40">
      <label htmlFor={textAreaId} className="block text-sm font-medium mb-2">
        {strings.newAnnotationForm.textLabel}
      </label>
      <textarea
        id={textAreaId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-2 py-1 border rounded text-sm"
        rows={3}
        placeholder={strings.newAnnotationForm.placeholder}
      />

      <div className="mt-3">
        <MediaFieldList
          kind="image"
          label={strings.newAnnotationForm.imagesLabel}
          fields={imageFields}
          setFields={setImageFields}
        />
      </div>

      <div className="mt-3">
        <MediaFieldList
          kind="audio"
          label={strings.newAnnotationForm.audioLabel}
          fields={audioFields}
          setFields={setAudioFields}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending
            ? strings.newAnnotationForm.saving
            : strings.newAnnotationForm.save}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {strings.newAnnotationForm.cancel}
        </Button>
      </div>
    </div>
  );
};

export default NewAnnotationForm;
