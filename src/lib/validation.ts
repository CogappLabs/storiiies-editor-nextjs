export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 25;

// Annotation images and audio go straight from the browser to Vercel Blob.
export const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_MEDIA_SIZE_MB = 50;
