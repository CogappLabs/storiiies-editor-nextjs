"use client";

import { useState } from "react";
import { restoreStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { textLinkClass } from "./ui";

const RestoreStoryButton = ({ storyId }: { storyId: string }) => {
  const strings = useStrings();
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    setError(null);
    const res = await restoreStory(storyId);
    if (res?.error) setError(res.error);
  };

  return (
    <>
      <button type="button" onClick={handleRestore} className={textLinkClass}>
        {strings.admin.actionLabels.restore}
      </button>
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </>
  );
};

export default RestoreStoryButton;
