"use client";

import "@nulib/clover/styles.css";
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

const CloverStory = dynamic(
  async () => {
    const { Root, Body, Annotations } = await import("@nulib/clover");
    return ({ manifestUrl }: { manifestUrl: string }) => (
      <Root
        iiifContent={manifestUrl}
        className="flex-1 flex flex-col md:flex-row min-h-0"
      >
        <Body className="flex-1 min-h-[50vh] [--clover-body-height:auto]" />
        <Annotations className="md:w-96 overflow-y-auto p-4" />
      </Root>
    );
  },
  { ssr: false, loading: ViewerLoading },
);

const CloverPreview = () => {
  const { id } = useParams<{ id: string }>();
  const manifestUrl = useManifestUrl(id);

  return (
    <PreviewShell storyId={id} viewer="clover">
      {manifestUrl && <CloverStory manifestUrl={manifestUrl} />}
    </PreviewShell>
  );
};

export default CloverPreview;
