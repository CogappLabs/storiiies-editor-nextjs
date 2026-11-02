"use client";

import { useRouter } from "next/navigation";
import { useStrings } from "@/lib/i18n/LanguageProvider";

interface DeleteImageButtonProps {
  imageId: string;
}

const DeleteImageButton = ({ imageId }: DeleteImageButtonProps) => {
  const strings = useStrings();
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(strings.admin.deleteImageConfirm)) {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete image");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-sm text-red-600 hover:underline rounded"
    >
      {strings.admin.actionLabels.delete}
    </button>
  );
};

export default DeleteImageButton;
