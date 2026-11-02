"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { updateAnnotation } from "@/lib/actions";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationBounds, Rect, StoryWithAnnotations } from "@/lib/types";
import type { AnnotatedViewerHandle } from "./AnnotatedViewer";
import AnnotationList from "./AnnotationList";
import NewAnnotationForm from "./NewAnnotationForm";
import SharePopup from "./SharePopup";
import StorySettingsModal from "./StorySettingsModal";
import { Button, Header } from "./ui";

// Dynamic import for the viewer (uses OpenSeadragon which needs window)
const AnnotatedViewer = dynamic(() => import("./AnnotatedViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      Loading viewer...
    </div>
  ),
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
  const [manifestUrl, setManifestUrl] = useState("");
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setManifestUrl(`${window.location.origin}/api/manifest/${story.id}`);
    }
  }, [story.id]);

  const handleAddAnnotation = () => {
    const bounds = viewerRef.current?.getViewportBounds();
    if (bounds) {
      setPendingData(bounds);
    }
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
                className={`text-xs ${saveStatus === "error" ? "text-red-600" : "text-gray-500"}`}
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
              <NewAnnotationForm
                storyId={story.id}
                pendingData={pendingData}
                onSave={() => setPendingData(null)}
                onCancel={() => setPendingData(null)}
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
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Editor;
