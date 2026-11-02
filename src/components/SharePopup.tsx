"use client";

import { useRef, useState } from "react";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import { Button, ButtonLink, Modal } from "./ui";

interface SharePopupProps {
  storyId: string;
  manifestUrl: string;
  onClose: () => void;
}

const SharePopup = ({ storyId, manifestUrl, onClose }: SharePopupProps) => {
  const [copied, setCopied] = useState(false);
  const manifestInputRef = useRef<HTMLInputElement>(null);
  const strings = useStrings();

  const copyManifestUrl = async () => {
    await navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      title={strings.sharePopup.title}
      titleId="share-dialog-title"
      onClose={onClose}
      initialFocusRef={manifestInputRef}
      describedById="share-dialog-description"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={manifestUrl}
            readOnly
            aria-label={strings.sharePopup.title}
            ref={manifestInputRef}
            className="flex-1 px-3 py-2 border rounded text-sm bg-cogapp-cream"
          />
          <Button onClick={copyManifestUrl}>
            {copied ? strings.sharePopup.copied : strings.sharePopup.copy}
          </Button>
        </div>
        <p className="text-xs text-cogapp-gray" id="share-dialog-description">
          {strings.sharePopup.instructions}
        </p>
        <div className="pt-4 border-t">
          <p className="text-xs text-cogapp-gray mb-2">
            {strings.sharePopup.previewHeading}
          </p>
          <div className="flex gap-2 flex-wrap">
            <ButtonLink
              href={`/preview/storiiies/${storyId}`}
              size="sm"
              className="flex-1 justify-center"
            >
              {strings.viewers.storiiies}
            </ButtonLink>
            <ButtonLink
              href={`/preview/clover/${storyId}`}
              size="sm"
              className="flex-1 justify-center"
            >
              {strings.viewers.clover}
            </ButtonLink>
            <ButtonLink
              href={`/preview/mirador/${storyId}`}
              size="sm"
              className="flex-1 justify-center"
            >
              {strings.viewers.mirador}
            </ButtonLink>
            <ButtonLink
              href={`/preview/annona/${storyId}`}
              size="sm"
              className="flex-1 justify-center"
            >
              {strings.viewers.annona}
            </ButtonLink>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SharePopup;
