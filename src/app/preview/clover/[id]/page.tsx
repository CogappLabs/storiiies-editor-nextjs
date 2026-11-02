"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import PreviewShell from "@/components/PreviewShell";
import { useManifestUrl } from "@/lib/hooks/useManifestUrl";
import { useStrings } from "@/lib/i18n/LanguageProvider";

const ViewerLoading = () => {
  const strings = useStrings();
  return (
    <div className="flex-1 flex items-center justify-center">
      {strings.preview.loadingViewer}
    </div>
  );
};

const Viewer = dynamic(() => import("@samvera/clover-iiif/viewer"), {
  ssr: false,
  loading: ViewerLoading,
});

const CloverPreview = () => {
  const { id } = useParams<{ id: string }>();
  const manifestUrl = useManifestUrl(id);

  return (
    <PreviewShell storyId={id} viewer="clover">
      <div className="flex-1">
        {manifestUrl && <Viewer iiifContent={manifestUrl} />}
      </div>
    </PreviewShell>
  );
};

export default CloverPreview;
