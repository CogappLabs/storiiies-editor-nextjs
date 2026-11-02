"use client";

import type { ReactNode } from "react";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { ViewerId } from "@/lib/viewers";
import { Header, ViewerSwitcher } from "./ui";

interface PreviewShellProps {
  storyId: string;
  viewer: ViewerId;
  children: ReactNode;
}

const PreviewShell = ({ storyId, viewer, children }: PreviewShellProps) => {
  const strings = useStrings();
  return (
    <div className="h-screen flex flex-col">
      <Header
        title={strings.common.viewer(strings.viewers[viewer])}
        backLink={{
          href: `/editor/${storyId}`,
          label: strings.preview.backToEditor,
        }}
        fullWidth
        actions={<ViewerSwitcher storyId={storyId} current={viewer} />}
      />
      {children}
    </div>
  );
};

export default PreviewShell;
