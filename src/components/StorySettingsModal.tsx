"use client";

import { useRef, useState, useTransition } from "react";
import type { Story } from "@/generated/prisma/client";
import { deleteStory, updateStory } from "@/lib/actions/stories";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { Button, Modal } from "./ui";

interface StorySettingsModalProps {
  story: Story;
  onClose: () => void;
}

const StorySettingsModal = ({ story, onClose }: StorySettingsModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const strings = useStrings();
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    if (confirm(strings.storySettings.deleteConfirm)) {
      setError(null);
      startTransition(async () => {
        const res = await deleteStory(story.id);
        if (res?.error) setError(res.error);
      });
    }
  };

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
        <div>
          <label
            htmlFor="story-title"
            className="block text-sm font-medium mb-1"
          >
            {strings.storySettings.titleLabel}
          </label>
          <input
            id="story-title"
            name="title"
            defaultValue={story.title}
            ref={titleInputRef}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label
            htmlFor="story-author"
            className="block text-sm font-medium mb-1"
          >
            {strings.storySettings.authorLabel}
          </label>
          <input
            id="story-author"
            name="author"
            defaultValue={story.author || ""}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label
            htmlFor="story-description"
            className="block text-sm font-medium mb-1"
          >
            {strings.storySettings.descriptionLabel}
          </label>
          <textarea
            id="story-description"
            name="description"
            defaultValue={story.description || ""}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>
        <div>
          <label
            htmlFor="story-attribution"
            className="block text-sm font-medium mb-1"
          >
            {strings.storySettings.attributionLabel}
          </label>
          <input
            id="story-attribution"
            name="attribution"
            defaultValue={story.attribution || ""}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="flex justify-between pt-4 border-t">
          <Button variant="danger" onClick={handleDeleteStory}>
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
