"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header, ViewerSwitcher } from "@/components/ui";
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
  loading: () => <ViewerLoading />,
});

const CloverPreview = () => {
  const params = useParams();
  const id = params.id as string;
  const [manifestUrl, setManifestUrl] = useState("");
  const strings = useStrings();
  const viewerLabel = strings.common.viewer(strings.viewers.clover);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setManifestUrl(`${window.location.origin}/api/manifest/${id}`);
    }
  }, [id]);

  return (
    <div className="h-screen flex flex-col">
      <Header
        title={viewerLabel}
        backLink={{
          href: `/editor/${id}`,
          label: strings.preview.backToEditor,
        }}
        fullWidth
        actions={<ViewerSwitcher storyId={id} current="clover" />}
      />

      <div className="flex-1">
        {manifestUrl && <Viewer iiifContent={manifestUrl} />}
      </div>
    </div>
  );
};

export default CloverPreview;
