"use client";

import { deleteStory } from "@/lib/actions";
import { useStrings } from "@/lib/i18n/LanguageProvider";

interface DeleteStoryButtonProps {
  storyId: string;
}

const DeleteStoryButton = ({ storyId }: DeleteStoryButtonProps) => {
  const strings = useStrings();

  const handleDelete = async () => {
    if (confirm(strings.storySettings.deleteConfirm)) {
      const res = await deleteStory(storyId);
      if (res?.error) alert(res.error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-sm text-danger underline decoration-danger/30 hover:decoration-danger"
    >
      {strings.admin.actionLabels.delete}
    </button>
  );
};

export default DeleteStoryButton;
