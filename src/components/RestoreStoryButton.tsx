"use client";

import { restoreStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { textLinkClass } from "./ui";

interface RestoreStoryButtonProps {
  storyId: string;
}

const RestoreStoryButton = ({ storyId }: RestoreStoryButtonProps) => {
  const strings = useStrings();

  const handleRestore = async () => {
    const res = await restoreStory(storyId);
    if (res?.error) alert(res.error);
  };

  return (
    <button type="button" onClick={handleRestore} className={textLinkClass}>
      {strings.admin.actionLabels.restore}
    </button>
  );
};

export default RestoreStoryButton;
