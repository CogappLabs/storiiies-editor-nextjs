"use client";

import { useParams } from "next/navigation";
import PreviewShell from "@/components/PreviewShell";
import { useManifestUrl } from "@/lib/hooks/useManifestUrl";
import { useStrings } from "@/lib/i18n/LanguageProvider";

const MiradorPreview = () => {
  const { id } = useParams<{ id: string }>();
  const manifestUrl = useManifestUrl(id);
  const strings = useStrings();

  return (
    <PreviewShell storyId={id} viewer="mirador">
      {manifestUrl && (
        <iframe
          src={`/mirador.html?manifest=${encodeURIComponent(manifestUrl)}`}
          className="flex-1 w-full border-0"
          title={strings.common.viewer(strings.viewers.mirador)}
        />
      )}
    </PreviewShell>
  );
};

export default MiradorPreview;
