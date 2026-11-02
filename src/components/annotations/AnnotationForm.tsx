"use client";

import { useId, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions/shared";
import { createMediaField, type MediaField } from "@/lib/form-utils";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { Button } from "../ui";
import MediaFieldList from "./MediaFieldList";

export interface AnnotationFormValues {
  text: string;
  imageUrls: string[];
  audioUrls: string[];
}

interface AnnotationFormProps {
  initial?: AnnotationFormValues;
  onSubmit: (values: AnnotationFormValues) => Promise<ActionResult>;
  onDone: () => void;
  className?: string;
}

const toFields = (urls: string[] = []) => urls.map(createMediaField);
const toUrls = (fields: MediaField[]) =>
  fields.map((field) => field.value.trim()).filter(Boolean);

/** Text, image and audio fields for creating or editing an annotation. */
const AnnotationForm = ({
  initial,
  onSubmit,
  onDone,
  className = "",
}: AnnotationFormProps) => {
  const strings = useStrings().newAnnotationForm;
  const textAreaId = useId();
  const [text, setText] = useState(initial?.text ?? "");
  const [imageFields, setImageFields] = useState(toFields(initial?.imageUrls));
  const [audioFields, setAudioFields] = useState(toFields(initial?.audioUrls));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await onSubmit({
        text,
        imageUrls: toUrls(imageFields),
        audioUrls: toUrls(audioFields),
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      onDone();
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label htmlFor={textAreaId} className="block text-sm font-medium mb-2">
          {strings.textLabel}
        </label>
        <textarea
          id={textAreaId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-2 py-1 border border-cogapp-charcoal/20 rounded text-sm"
          rows={3}
          placeholder={strings.placeholder}
        />
      </div>
      <MediaFieldList
        kind="image"
        label={strings.imagesLabel}
        fields={imageFields}
        setFields={setImageFields}
      />
      <MediaFieldList
        kind="audio"
        label={strings.audioLabel}
        fields={audioFields}
        setFields={setAudioFields}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? strings.saving : strings.save}
        </Button>
        <Button variant="secondary" size="sm" onClick={onDone}>
          {strings.cancel}
        </Button>
      </div>
    </div>
  );
};

export default AnnotationForm;
