"use client";

import { upload } from "@vercel/blob/client";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import { createMediaField, type MediaField } from "@/lib/form-utils";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { MAX_MEDIA_SIZE_BYTES, MAX_MEDIA_SIZE_MB } from "@/lib/validation";
import { Button } from "../ui";

interface Props {
  kind: "image" | "audio";
  label: string;
  fields: MediaField[];
  setFields: Dispatch<SetStateAction<MediaField[]>>;
}

const MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024;

const MediaFieldList = ({ kind, label, fields, setFields }: Props) => {
  const strings = useStrings().newAnnotationForm;
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isImage = kind === "image";
  // One hidden file input serves every row; this records which row asked.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetIdRef = useRef<string | null>(null);

  const setValue = (id: string, value: string) =>
    setFields((current) =>
      current.map((item) => (item.id === id ? { ...item, value } : item)),
    );

  const handleFile = async (id: string, file: File) => {
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      setError(strings.fileTooLarge(MAX_MEDIA_SIZE_MB));
      return;
    }
    setError(null);
    setUploadingId(id);
    try {
      const blob = await upload(`media/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/media",
        multipart: file.size > MULTIPART_THRESHOLD_BYTES,
      });
      if (!isImage) {
        setValue(id, blob.url);
        return;
      }

      const response = await fetch("/api/media/resize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? strings.uploadFailed);
      }
      setValue(id, result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.uploadFailed);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div>
      <p className="block text-sm font-medium mb-2">{label}</p>
      {fields.map((field) => (
        <div key={field.id} className="flex gap-2 mb-2 items-center">
          <input
            type="url"
            value={field.value}
            onChange={(e) => setValue(field.id, e.target.value)}
            disabled={uploadingId === field.id}
            className="flex-1 min-w-0 px-2 py-1 border rounded text-sm disabled:bg-cogapp-cream"
            placeholder={
              isImage ? strings.imagePlaceholder : strings.audioPlaceholder
            }
            aria-label={label}
          />
          <Button
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
            disabled={uploadingId !== null}
            aria-busy={uploadingId === field.id}
            onClick={() => {
              targetIdRef.current = field.id;
              fileInputRef.current?.click();
            }}
          >
            {uploadingId === field.id ? strings.uploading : strings.upload}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              setFields((current) =>
                current.filter((item) => item.id !== field.id),
              )
            }
          >
            {isImage ? strings.removeImage : strings.removeAudio}
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {error}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={isImage ? "image/*" : "audio/*"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file && targetIdRef.current)
            handleFile(targetIdRef.current, file);
        }}
      />
      <button
        type="button"
        onClick={() => setFields((current) => [...current, createMediaField()])}
        className="text-sm text-cogapp-charcoal hover:text-cogapp-charcoal/70 rounded"
      >
        + {isImage ? strings.addImage : strings.addAudio}
      </button>
    </div>
  );
};

export default MediaFieldList;
