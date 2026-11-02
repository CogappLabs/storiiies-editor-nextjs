"use client";

import { deleteUnusedMedia } from "@/lib/actions/annotations";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { ConfirmDeleteButton } from "./ui";

const DeleteMediaButton = ({ url }: { url: string }) => {
  const strings = useStrings();
  return (
    <ConfirmDeleteButton
      message={strings.admin.deleteMediaConfirm}
      onDelete={async () => (await deleteUnusedMedia(url))?.error}
    />
  );
};

export default DeleteMediaButton;
