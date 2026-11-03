"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createAnnotation, updateAnnotation } from "@/lib/actions/annotations";
import { useManifestUrl } from "@/lib/hooks/useManifestUrl";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationBounds, Rect, StoryWithAnnotations } from "@/lib/types";
import AnnotationForm from "./annotations/AnnotationForm";
import AnnotationList from "./annotations/AnnotationList";
import SharePopup from "./SharePopup";
import StorySettingsModal from "./StorySettingsModal";
import { Button, Header } from "./ui";
import type { AnnotatedViewerHandle } from "./viewer/AnnotatedViewer";

const ViewerLoading = () => {
  const strings = useStrings();
  return (
    <div className="h-full w-full flex items-center justify-center bg-cogapp-cream">
      {strings.preview.loadingViewer}
    </div>
  );
};

// OpenSeadragon needs window, so the viewer is client-only.
const AnnotatedViewer = dynamic(() => import("./viewer/AnnotatedViewer"), {
  ssr: false,
  loading: ViewerLoading,
});

interface Props {
  story: StoryWithAnnotations;
}

const Editor = ({ story }: Props) => {
  const viewerRef = useRef<AnnotatedViewerHandle>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showManifestLink, setShowManifestLink] = useState(false);
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  // "Add" captures the current view, so it waits for the image to open.
  const [viewerReady, setViewerReady] = useState(false);
  const [pendingData, setPendingData] = useState<AnnotationBounds | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  // Drag saves run one after another so the last drag is the one stored.
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const saveSeq = useRef(0);
  const strings = useStrings();

  const manifestUrl = useManifestUrl(story.id);
  const pinMode = story.annotationMode === "pin";

  const handleAddAnnotation = () => {
    const bounds = viewerRef.current?.getViewportBounds();
    if (!bounds) return;
    const { x, y, width, height } = bounds.viewport;
    setPendingData(
      pinMode
        ? {
            ...bounds,
            rect: {
              x: Math.round(x + width / 2),
              y: Math.round(y + height / 2),
              width: 0,
              height: 0,
            },
          }
        : bounds,
    );
  };

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 1500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleAnnotationUpdate = (id: string, coords: Rect) => {
    const seq = ++saveSeq.current;
    setSaveStatus("saving");
    const save = saveChain.current.then(() =>
      updateAnnotation(id, story.id, coords),
    );
    saveChain.current = save.catch(() => undefined);
    save.then(
      (result) => {
        if (seq === saveSeq.current) {
          setSaveStatus(result?.error ? "error" : "saved");
        }
      },
      () => {
        if (seq === saveSeq.current) setSaveStatus("error");
      },
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        title={story.title}
        backLink={{ href: "/", label: strings.common.back }}
        fullWidth
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowSettings(!showSettings)}
              aria-expanded={showSettings}
              aria-haspopup="dialog"
            >
              {strings.editor.settingsButton}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowManifestLink(!showManifestLink)}
              aria-expanded={showManifestLink}
              aria-haspopup="dialog"
            >
              {strings.editor.previewButton}
            </Button>
          </>
        }
      />

      {showManifestLink && (
        <SharePopup
          storyId={story.id}
          manifestUrl={manifestUrl}
          annotationNumber={
            story.annotations.findIndex((a) => a.id === selectedAnnotationId) +
              1 || undefined
          }
          onClose={() => setShowManifestLink(false)}
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="h-3/5 md:h-auto md:flex-1 relative">
          <AnnotatedViewer
            ref={viewerRef}
            imageUrl={story.imageSource.infoJsonUrl.replace(
              /\/info\.json$/,
              "",
            )}
            imageWidth={story.imageSource.width}
            imageHeight={story.imageSource.height}
            annotations={story.annotations}
            pinMode={pinMode}
            onAnnotationUpdate={handleAnnotationUpdate}
            onReadyChange={setViewerReady}
            onAnnotationSelect={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
            showCrosshairs={showCrosshairs}
            onToggleCrosshairs={() => setShowCrosshairs(!showCrosshairs)}
          />
        </div>

        {/* After the viewer in the DOM; shown below it on mobile, left of it on desktop. */}
        <aside
          className="h-2/5 md:h-auto md:w-80 border-t md:border-t-0 md:border-l bg-white flex flex-col order-2 md:order-first"
          aria-label={strings.editor.sidebarLabel}
        >
          <div className="p-2 md:p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-sm md:text-base">
                {strings.editor.annotationsHeading}
              </h2>
              <output
                className={`text-xs ${saveStatus === "error" ? "text-danger" : "text-cogapp-gray"}`}
              >
                {saveStatus !== "idle" &&
                  strings.editor[
                    saveStatus === "error" ? "saveFailed" : saveStatus
                  ]}
              </output>
            </div>
            <Button onClick={handleAddAnnotation} disabled={!viewerReady}>
              {strings.editor.addButton}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            {pendingData && (
              <AnnotationForm
                className="mb-4 p-3 border-2 border-cogapp-lavender bg-cogapp-lavender/40"
                onSubmit={(values) =>
                  createAnnotation(story.id, {
                    ...values,
                    ...pendingData.rect,
                    viewportX: pendingData.viewport.x,
                    viewportY: pendingData.viewport.y,
                    viewportWidth: pendingData.viewport.width,
                    viewportHeight: pendingData.viewport.height,
                  })
                }
                onDone={() => setPendingData(null)}
              />
            )}

            <AnnotationList
              storyId={story.id}
              annotations={story.annotations}
              selectedId={selectedAnnotationId}
              onSelect={setSelectedAnnotationId}
            />
          </div>
        </aside>
      </div>

      {showSettings && (
        <StorySettingsModal
          story={story}
          modeLocked={story.annotations.length > 0}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Editor;
