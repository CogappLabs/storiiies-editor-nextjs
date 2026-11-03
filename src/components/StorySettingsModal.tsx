"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Story } from "@/generated/prisma/client";
import { deleteStory, updateStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import StoryFields from "./StoryFields";
import { Button, ConfirmDialog, Modal } from "./ui";

interface StorySettingsModalProps {
  story: Story;
  modeLocked: boolean;
  onClose: () => void;
}

const StorySettingsModal = ({
  story,
  modeLocked,
  onClose,
}: StorySettingsModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const strings = useStrings();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpdateStory = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await updateStory(story.id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  };

  const handleDeleteStory = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteStory(story.id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/");
    });
  };

  // Swaps in for the settings modal rather than stacking on it, so only one
  // dialog owns Escape and the focus trap.
  if (confirmingDelete) {
    return (
      <ConfirmDialog
        title={strings.common.confirmDeleteTitle}
        message={strings.storySettings.deleteConfirm}
        confirmLabel={strings.storySettings.deleteButton}
        onConfirm={handleDeleteStory}
        onCancel={() => setConfirmingDelete(false)}
        pending={isPending}
        error={error}
      />
    );
  }

  return (
    <Modal
      title={strings.storySettings.title}
      titleId="settings-dialog-title"
      onClose={onClose}
      initialFocusRef={titleInputRef}
    >
      <form action={handleUpdateStory} className="space-y-4">
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <StoryFields
          story={story}
          titleRef={titleInputRef}
          modeLocked={modeLocked}
        />
        <div className="flex justify-between pt-4 border-t">
          <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
            {strings.storySettings.deleteButton}
          </Button>
          <Button type="submit" disabled={isPending}>
            {strings.storySettings.saveButton}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StorySettingsModal;
