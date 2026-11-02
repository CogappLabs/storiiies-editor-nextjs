"use client";

import { restoreStory } from "@/lib/actions";
import { useStrings } from "@/lib/i18n/LanguageProvider";

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
    <button
      type="button"
      onClick={handleRestore}
      className="text-sm text-cogapp-charcoal underline decoration-cogapp-charcoal/30 hover:decoration-cogapp-charcoal"
    >
      {strings.admin.actionLabels.restore}
    </button>
  );
};

export default RestoreStoryButton;
