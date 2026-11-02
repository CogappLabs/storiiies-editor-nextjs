"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PreviewShell from "@/components/PreviewShell";
import "@cogapp/storiiies-viewer/dist/storiiies-viewer.css";
import { useManifestUrl } from "@/lib/hooks/useManifestUrl";
import { useStrings } from "@/lib/i18n/LanguageProvider";

const StoriiiesPreview = () => {
  const { id } = useParams<{ id: string }>();
  const manifestUrl = useManifestUrl(id);
  const [error, setError] = useState<string | null>(null);
  const strings = useStrings();
  const viewerLabel = strings.common.viewer(strings.viewers.storiiies);
  const { errorLoading, errorGeneric } = strings.preview;

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
            // #annotation-N in the URL opens that annotation, and the hash
            // follows navigation, so the address is always shareable.
            useUrlHash: true,
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
    <PreviewShell storyId={id} viewer="storiiies">
      {error && (
        <div className="bg-danger/10 text-danger p-4 text-center">{error}</div>
      )}

      <div id="storiiies-viewer" className="flex-1" />
    </PreviewShell>
  );
};

export default StoriiiesPreview;
