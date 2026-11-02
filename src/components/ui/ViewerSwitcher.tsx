"use client";

import { useStrings } from "@/lib/i18n/LanguageProvider";
import { VIEWERS, type ViewerId } from "@/lib/viewers";
import { ButtonLink } from "./Button";

interface ViewerSwitcherProps {
  storyId: string;
  current: ViewerId;
}

const ViewerSwitcher = ({ storyId, current }: ViewerSwitcherProps) => {
  const strings = useStrings();
  return VIEWERS.filter((viewer) => viewer !== current).map((viewer) => (
    <ButtonLink
      key={viewer}
      href={`/preview/${viewer}/${storyId}`}
      className="min-w-24 justify-center"
    >
      {strings.viewers[viewer]}
    </ButtonLink>
  ));
};

export default ViewerSwitcher;
