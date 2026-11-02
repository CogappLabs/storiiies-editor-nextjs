"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header, ViewerSwitcher } from "@/components/ui";
import "@cogapp/storiiies-viewer/dist/storiiies-viewer.css";
import { useStrings } from "@/lib/i18n/LanguageProvider";

const StoriiiesPreview = () => {
  const params = useParams();
  const id = params.id as string;
  const [manifestUrl, setManifestUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const strings = useStrings();
  const viewerLabel = strings.common.viewer(strings.viewers.storiiies);
  const { errorLoading, errorGeneric } = strings.preview;

  useEffect(() => {
    setManifestUrl(`${window.location.origin}/api/manifest/${id}`);
  }, [id]);

  useEffect(() => {
    if (!manifestUrl) return;

    // Effect-local rather than React state/ref, to avoid Turbopack HMR
    // serialization. `disposed` covers cleanup running before the import
    // resolves (strict mode double mount, fast navigation).
    let disposed = false;
    let instance: { viewer?: { destroy: () => void } } | null = null;

    import("@cogapp/storiiies-viewer")
      .then((module) => {
        if (disposed) return;
        const StoriiiesViewer = module.default;

        try {
          instance = new StoriiiesViewer({
            container: "#storiiies-viewer",
            manifestUrl: manifestUrl,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : errorGeneric;
          setError(errorLoading(viewerLabel, message));
        }
      })
      .catch((err) => {
        setError(
          errorLoading(
            viewerLabel,
            err instanceof Error ? err.message : errorGeneric,
          ),
        );
      });

    return () => {
      disposed = true;
      instance?.viewer?.destroy();
      const container = document.getElementById("storiiies-viewer");
      if (container) container.innerHTML = "";
    };
  }, [errorGeneric, errorLoading, manifestUrl, viewerLabel]);

  return (
    <div className="h-screen flex flex-col">
      <Header
        title={viewerLabel}
        backLink={{
          href: `/editor/${id}`,
          label: strings.preview.backToEditor,
        }}
        fullWidth
        actions={<ViewerSwitcher storyId={id} current="storiiies" />}
      />

      {error && (
        <div className="bg-danger/10 text-danger p-4 text-center">{error}</div>
      )}

      <div id="storiiies-viewer" className="flex-1" />
    </div>
  );
};

export default StoriiiesPreview;
