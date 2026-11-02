"use client";

import { useRouter } from "next/navigation";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { ConfirmDeleteButton } from "./ui";

const DeleteImageButton = ({ imageId }: { imageId: string }) => {
  const strings = useStrings();
  const router = useRouter();

  const deleteImage = async () => {
    const response = await fetch(`/api/images/${imageId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.refresh();
      return undefined;
    }
    const data = await response.json().catch(() => null);
    return data?.error ?? strings.common.deleteFailed;
  };

  return (
    <ConfirmDeleteButton
      message={strings.admin.deleteImageConfirm}
      onDelete={deleteImage}
    />
  );
};

export default DeleteImageButton;
