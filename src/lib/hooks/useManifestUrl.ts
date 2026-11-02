import { useEffect, useState } from "react";

/** Empty until mounted: the origin is only known in the browser. */
export const useManifestUrl = (storyId: string) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${window.location.origin}/api/manifest/${storyId}`);
  }, [storyId]);
  return url;
};
