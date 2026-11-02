"use client";

import Image from "next/image";
import { useState } from "react";
import { createStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import {
  extractManifestOptions,
  isInfoResponse,
  type ManifestCanvasOption,
  normalizeInfoUrl,
} from "@/lib/iiif-manifest";
import type { IIIFInfo } from "@/lib/types";
import {
  isValidHttpUrl,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/validation";
import StoryFields from "./StoryFields";
import { Button, panelClass } from "./ui";

type SourceMode = "url" | "upload";
type ImageSourceType = "url" | "manifest" | "upload";

const CreateStoryForm = () => {
  const [sourceMode, setSourceMode] = useState<SourceMode>("url");
  const [infoUrl, setInfoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iiifInfo, setIiifInfo] = useState<IIIFInfo | null>(null);
  const [manifestOptions, setManifestOptions] = useState<
    ManifestCanvasOption[]
  >([]);
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageSourceType, setImageSourceType] =
    useState<ImageSourceType>("url");
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const strings = useStrings();

  const resetImageState = () => {
    setIiifInfo(null);
    setManifestOptions([]);
    setSelectedManifestId(null);
    setError(null);
    setImageSourceType("url");
    setManifestUrl(null);
  };

  const validateIIIF = async () => {
    setLoading(true);
    setError(null);
    resetImageState();

    const trimmedInput = infoUrl.trim();
    if (!trimmedInput) {
      setLoading(false);
      return;
    }

    if (!isValidHttpUrl(trimmedInput)) {
      setError(strings.createStoryForm.invalidUrl);
      setLoading(false);
      return;
    }

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          strings.createStoryForm.fetchFailed(
            response.status,
            response.statusText,
          ),
        );
      }
      return response.json();
    };

    try {
      let requestUrl = trimmedInput;
      let payload: unknown;

      try {
        payload = await fetchJson(requestUrl);
      } catch (initialError) {
        const fallback = normalizeInfoUrl(trimmedInput);
        if (fallback !== requestUrl) {
          requestUrl = fallback;
          payload = await fetchJson(requestUrl);
        } else {
          throw initialError;
        }
      }

      if (isInfoResponse(payload)) {
        if (!payload.width || !payload.height) {
          throw new Error(strings.createStoryForm.invalidInfoResponse);
        }
        setIiifInfo(payload);
        setInfoUrl(normalizeInfoUrl(requestUrl));
        setImageSourceType("url");
        return;
      }

      const options = extractManifestOptions(payload);
      if (options.length === 0) {
        throw new Error(strings.createStoryForm.invalidManifest);
      }
      setManifestOptions(options);
      setManifestUrl(trimmedInput);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : strings.createStoryForm.errorValidate,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManifestSelect = async (optionId: string) => {
    const option = manifestOptions.find(
      (candidate) => candidate.id === optionId,
    );
    if (!option) return;
    setSelectedManifestId(optionId);
    setInfoUrl(option.infoUrl);
    setImageSourceType("manifest");

    // Some manifests swap canvas width and height; info.json is authoritative.
    try {
      const response = await fetch(option.infoUrl);
      if (response.ok) {
        const infoJson = await response.json();
        if (
          typeof infoJson.width === "number" &&
          typeof infoJson.height === "number"
        ) {
          setIiifInfo({ width: infoJson.width, height: infoJson.height });
          return;
        }
      }
    } catch {}
    setIiifInfo({ width: option.width, height: option.height });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(strings.createStoryForm.invalidFileType);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(strings.createStoryForm.fileTooLarge(MAX_FILE_SIZE_MB));
      return;
    }

    setUploading(true);
    setError(null);
    resetImageState();

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || strings.createStoryForm.uploadError);
      }

      const data = await response.json();
      setInfoUrl(data.infoJson);
      setIiifInfo({ width: data.width, height: data.height });
      setImageSourceType("upload");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : strings.createStoryForm.uploadError,
      );
    } finally {
      setUploading(false);
    }
  };

  const uploadFirst = (files: FileList | null) => {
    const file = files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!iiifInfo) {
      setError(strings.createStoryForm.mustValidate);
      return;
    }

    formData.set("imageUrl", infoUrl);
    formData.set("imageWidth", iiifInfo.width.toString());
    formData.set("imageHeight", iiifInfo.height.toString());
    formData.set("sourceType", imageSourceType);
    if (manifestUrl) {
      formData.set("manifestUrl", manifestUrl);
    }

    const res = await createStory(formData);
    if (res?.error) setError(res.error);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="flex border-b border-cogapp-charcoal/20">
        {(
          [
            ["url", strings.createStoryForm.sourceTabUrl],
            ["upload", strings.createStoryForm.sourceTabUpload],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={sourceMode === mode}
            onClick={() => {
              setSourceMode(mode);
              resetImageState();
              setInfoUrl("");
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              sourceMode === mode
                ? "border-cogapp-charcoal text-cogapp-charcoal"
                : "border-transparent text-cogapp-gray hover:text-cogapp-charcoal"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sourceMode === "url" && (
        <div>
          <label htmlFor="infoUrl" className="block text-sm font-medium mb-2">
            {strings.createStoryForm.infoLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              id="infoUrl"
              value={infoUrl}
              onChange={(e) => {
                setInfoUrl(e.target.value);
                resetImageState();
              }}
              placeholder={strings.createStoryForm.infoPlaceholder}
              className="flex-1 min-w-0 px-3 py-2 border border-cogapp-charcoal/20 rounded"
              required={sourceMode === "url"}
            />
            <Button
              type="button"
              variant="secondary"
              showArrow={false}
              onClick={validateIIIF}
              disabled={loading || !infoUrl}
            >
              {loading
                ? strings.createStoryForm.validating
                : strings.createStoryForm.validate}
            </Button>
          </div>
          <p className="text-xs text-cogapp-gray mt-1">
            {strings.createStoryForm.infoHint}
          </p>
        </div>
      )}

      {sourceMode === "upload" && (
        <div>
          <span className="block text-sm font-medium mb-2">
            {strings.createStoryForm.uploadLabel}
          </span>
          <label
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFirst(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`block border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-cogapp-lavender bg-cogapp-lavender/10"
                : "border-cogapp-charcoal/20 hover:border-cogapp-charcoal/20"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadFirst(e.target.files)}
              className="sr-only"
            />
            {uploading ? (
              <span className="text-cogapp-gray">
                {strings.createStoryForm.uploading}
              </span>
            ) : (
              <>
                <span className="block text-cogapp-gray">
                  {strings.createStoryForm.uploadLabel}
                </span>
                <span className="block text-sm text-cogapp-gray mt-1">
                  {strings.createStoryForm.dragDropHint}
                </span>
              </>
            )}
          </label>
          <p className="text-xs text-cogapp-gray mt-1">
            {strings.createStoryForm.uploadHint}
          </p>
        </div>
      )}

      {iiifInfo && (
        <p className="text-sm text-success">
          {strings.createStoryForm.validIIIF(iiifInfo.width, iiifInfo.height)}
        </p>
      )}

      {error && (
        <div className="p-3 bg-danger/10 text-danger text-sm">{error}</div>
      )}

      {manifestOptions.length > 0 && (
        <div className={`${panelClass} p-4 space-y-3`}>
          <div>
            <p className="text-sm font-medium text-cogapp-gray">
              {strings.createStoryForm.manifestDetected(manifestOptions.length)}
            </p>
            <p className="text-xs text-cogapp-gray mt-1">
              {strings.createStoryForm.manifestInstructions}
            </p>
          </div>
          <div className="space-y-2">
            {manifestOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 border p-2 cursor-pointer ${
                  selectedManifestId === option.id
                    ? "border-cogapp-lavender bg-cogapp-lavender"
                    : "border-cogapp-charcoal/20 bg-white hover:border-cogapp-gray"
                }`}
              >
                <input
                  type="radio"
                  name="manifest-canvas"
                  value={option.id}
                  checked={selectedManifestId === option.id}
                  onChange={() => handleManifestSelect(option.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {option.label || strings.createStoryForm.untitledCanvas}
                  </div>
                  <div className="text-xs text-cogapp-gray">
                    {strings.createStoryForm.canvasSize(
                      option.width,
                      option.height,
                    )}
                  </div>
                </div>
                {option.thumbnail && (
                  <div className="w-14 h-14 flex-shrink-0">
                    <Image
                      src={option.thumbnail}
                      alt={strings.createStoryForm.thumbnailAlt(option.label)}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover rounded border"
                    />
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {iiifInfo && (
        <>
          <StoryFields />

          <Button
            type="submit"
            className="w-full justify-center"
            showArrow={false}
          >
            {strings.createStoryForm.submit}
          </Button>
        </>
      )}
    </form>
  );
};

export default CreateStoryForm;
