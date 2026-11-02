"use client";

import { useParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import PreviewShell from "@/components/PreviewShell";
import { useManifestUrl } from "@/lib/hooks/useManifestUrl";
import { useStrings } from "@/lib/i18n/LanguageProvider";

const AnnonaPreview = () => {
  const { id } = useParams<{ id: string }>();
  const manifestUrl = useManifestUrl(id);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storyboardRef = useRef<HTMLDivElement>(null);
  const strings = useStrings();

  // Create the web component safely via DOM API instead of dangerouslySetInnerHTML
  useEffect(() => {
    if (
      !manifestUrl ||
      !scriptsLoaded ||
      !storyboardRef.current ||
      !containerRef.current
    )
      return;

    const container = storyboardRef.current;
    const height = containerRef.current.clientHeight;
    container.innerHTML = "";

    const storyboard = document.createElement("iiif-storyboard");
    storyboard.setAttribute("url", manifestUrl);
    storyboard.setAttribute("styling", `height: ${height};`);
    container.appendChild(storyboard);

    const handleResize = () => {
      if (containerRef.current) {
        const newHeight = containerRef.current.clientHeight;
        storyboard.setAttribute("styling", `height: ${newHeight};`);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      container.innerHTML = "";
    };
  }, [manifestUrl, scriptsLoaded]);

  return (
    <PreviewShell storyId={id} viewer="annona">
      <Script
        src="https://ncsu-libraries.github.io/annona/dist/annona.js"
        onLoad={() => setScriptsLoaded(true)}
      />
      <link
        rel="stylesheet"
        href="https://ncsu-libraries.github.io/annona/dist/annona.css"
      />

      <div ref={containerRef} className="flex-1">
        {scriptsLoaded ? (
          <div ref={storyboardRef} className="h-full w-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-cogapp-gray">
            {strings.preview.loadingAnnona}
          </div>
        )}
      </div>
    </PreviewShell>
  );
};

export default AnnonaPreview;
