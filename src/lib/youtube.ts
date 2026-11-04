const ID_PATTERN = /^[\w-]{11}$/;

/** The video ID from a YouTube watch, share, Shorts or embed URL, or null. */
export const parseYoutubeId = (input: string): string | null => {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  const path = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined;
  if (host === "youtu.be") {
    id = path[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      path[0] === "watch"
        ? url.searchParams.get("v")
        : ["embed", "shorts", "live"].includes(path[0])
          ? path[1]
          : undefined;
  }
  return id && ID_PATTERN.test(id) ? id : null;
};

export const youtubeWatchUrl = (id: string) =>
  `https://www.youtube.com/watch?v=${id}`;

export const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}`;
