"use client";

import { deleteStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { ConfirmDeleteButton } from "./ui";

const DeleteStoryButton = ({ storyId }: { storyId: string }) => {
  const strings = useStrings();
  return (
    <ConfirmDeleteButton
      message={strings.storySettings.deleteConfirm}
      onDelete={async () => (await deleteStory(storyId))?.error}
    />
  );
};

export default DeleteStoryButton;
