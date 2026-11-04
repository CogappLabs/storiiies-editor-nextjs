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
  youtubeUrl: string;
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

/** Text, image, audio and YouTube fields for creating or editing an annotation. */
const AnnotationForm = ({
  initial,
  onSubmit,
  onDone,
  className = "",
}: AnnotationFormProps) => {
  const strings = useStrings().newAnnotationForm;
  const textAreaId = useId();
  const youtubeId = useId();
  const [text, setText] = useState(initial?.text ?? "");
  const [imageFields, setImageFields] = useState(toFields(initial?.imageUrls));
  const [audioFields, setAudioFields] = useState(toFields(initial?.audioUrls));
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Saving mid-upload would store the row without the file.
  const [uploads, setUploads] = useState(0);
  const trackUpload = (uploading: boolean) =>
    setUploads((n) => n + (uploading ? 1 : -1));

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await onSubmit({
        text,
        imageUrls: toUrls(imageFields),
        audioUrls: toUrls(audioFields),
        youtubeUrl,
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
        onUploadingChange={trackUpload}
      />
      <MediaFieldList
        kind="audio"
        label={strings.audioLabel}
        fields={audioFields}
        setFields={setAudioFields}
        onUploadingChange={trackUpload}
      />
      <div>
        <label htmlFor={youtubeId} className="block text-sm font-medium mb-2">
          {strings.youtubeLabel}
        </label>
        <input
          id={youtubeId}
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="w-full px-2 py-1 border border-cogapp-charcoal/20 rounded text-sm"
          placeholder={strings.youtubePlaceholder}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || uploads > 0}
        >
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
