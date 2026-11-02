export type Locale = "en";

const en = {
  app: {
    title: "Storiiies Editor",
    subtitle: "Create annotated stories from IIIF images",
    adminTitle: "Admin Dashboard",
    adminSubtitle: "Manage stories and settings",
  },
  common: {
    back: "Back",
    admin: "Admin",
    close: "Close",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    add: "Add",
    data: "Data",
    viewer: (name: string) => `${name} Viewer`,
  },
  home: {
    createSectionTitle: "Create New Story",
    allStoriesTitle: "All Stories",
    adminLinkLabel: "Admin →",
    noStoriesMessage: "No stories yet. Create your first one!",
    storyAnnotationsLabel: (count: number) =>
      `${count} ${count === 1 ? "annotation" : "annotations"}`,
    storyUpdatedLabel: (date: string) => `Updated ${date}`,
    byAuthor: (author: string) => `by ${author}`,
  },
  createStoryForm: {
    sourceTabUrl: "From URL",
    sourceTabUpload: "Upload Image",
    infoLabel: "IIIF Image URL",
    infoPlaceholder: "https://example.com/iiif/image/info.json",
    infoHint: "Paste either an IIIF image info.json URL or an IIIF manifest.",
    validate: "Validate",
    validating: "Checking...",
    validIIIF: (width: number, height: number) =>
      `Valid IIIF image: ${width} × ${height} pixels`,
    errorValidate: "Failed to validate IIIF URL",
    invalidUrl: "Please enter a valid HTTP or HTTPS URL",
    titleLabel: "Title *",
    authorLabel: "Author",
    descriptionLabel: "Description",
    attributionLabel: "Image Attribution",
    titlePlaceholder: "Story title",
    submit: "Create Story",
    mustValidate: "Please validate the IIIF URL first",
    titleRequired: "Title is required",
    manifestDetected: (count: number) =>
      `Detected IIIF manifest with ${count} ${count === 1 ? "canvas" : "canvases"}.`,
    manifestInstructions: "Select the image you want to use for this story.",
    untitledCanvas: "Untitled canvas",
    canvasSize: (width: number, height: number) =>
      `${width} × ${height} pixels`,
    invalidManifest:
      "Manifest does not contain canvases with IIIF Image services.",
    invalidInfoResponse: "Invalid IIIF info response: missing width or height.",
    thumbnailAlt: (label: string) => `Thumbnail preview for ${label}`,
    fetchFailed: (status: number, statusText: string) =>
      `Failed to fetch: ${status} ${statusText}`,
    uploadLabel: "Select an image",
    uploadHint: "Supported formats: JPEG, PNG, WebP, TIFF. Max 25MB.",
    invalidFileType: "Please select an image file",
    fileTooLarge: (maxMb: number) =>
      `File is too large. Maximum size is ${maxMb}MB.`,
    uploading: "Uploading and processing...",
    uploadSuccess: "Image uploaded successfully",
    uploadError: "Failed to upload image",
    dragDropHint: "or drag and drop",
  },
  editor: {
    previewButton: "Preview and share",
    settingsButton: "Settings",
    annotationsHeading: "Annotations",
    addButton: "Add",
    noAnnotations: 'No annotations yet. Click "Add" to create one.',
    sidebarLabel: "Annotations sidebar",
    saving: "Saving...",
    saved: "Saved",
    saveFailed: "Save failed",
    crosshairs: {
      show: "Show crosshairs",
      hide: "Hide crosshairs",
    },
    deletedTitle: "Story Deleted",
    deletedHeading: "This story has been deleted",
    deletedMessage:
      "The story you are looking for has been deleted and is no longer available.",
    deletedBackHome: "Go to Homepage",
  },
  annotationList: {
    noItems: 'No annotations yet. Pan and zoom to a region, then click "Add".',
    noText: "No text",
    dataSummary: "Data",
    rectLabel: "rect",
    viewportLabel: "viewport",
    imagesLabel: "images",
    audioLabel: "audio",
    editAria: "Edit annotation",
    deleteAria: "Delete annotation",
    deleteConfirm: "Delete this annotation?",
    imageAlt: "Annotation image",
    dragHandle: "Drag to reorder annotation",
    removeImage: "Remove image URL",
    removeAudio: "Remove audio URL",
  },
  newAnnotationForm: {
    textLabel: "Annotation text",
    placeholder: "Enter annotation text...",
    imagesLabel: "Images (optional)",
    imagePlaceholder: "https://example.com/image.jpg",
    addImage: "Add image",
    removeImage: "Remove",
    audioLabel: "Audio (optional)",
    audioPlaceholder: "https://example.com/audio.mp3",
    addAudio: "Add audio",
    removeAudio: "Remove",
    upload: "Upload",
    uploading: "Uploading...",
    uploadFailed: "Upload failed",
    fileTooLarge: (mb: number) => `File is too large. Maximum size is ${mb}MB.`,
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    previewUnavailable: "Preview unavailable (too large to display).",
  },
  sharePopup: {
    title: "IIIF Manifest URL",
    copy: "Copy",
    copied: "Copied!",
    instructions:
      "Use this URL to view your story in any IIIF-compatible viewer.",
    previewHeading: "Preview in:",
  },
  storySettings: {
    title: "Story Settings",
    titleLabel: "Title",
    authorLabel: "Author",
    descriptionLabel: "Description",
    attributionLabel: "Attribution",
    deleteButton: "Delete Story",
    saveButton: "Save Changes",
    deleteConfirm:
      "Are you sure you want to delete this story? This cannot be undone.",
  },
  errorBoundary: {
    title: "Something went wrong",
    message: "An unexpected error occurred",
    tryAgain: "Try again",
  },
  viewerControls: {
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    showCrosshairs: "Show crosshairs",
    hideCrosshairs: "Hide crosshairs",
    selectedAnnotation:
      "Selected annotation. Arrow keys move it; Shift and arrow keys resize it.",
  },
  viewers: {
    storiiies: "Storiiies",
    clover: "Clover",
    mirador: "Mirador",
    annona: "Annona",
  },
  preview: {
    backToEditor: "Back to Editor",
    errorLoading: (viewer: string, reason: string) =>
      `Failed to load ${viewer}: ${reason}`,
    errorGeneric: "Failed to load viewer",
    loadingViewer: "Loading viewer...",
    loadingAnnona: "Loading Annona...",
  },
  admin: {
    allStoriesTitle: "All Storiiies",
    allImagesTitle: "Uploaded Images",
    cardDescription: "View and manage all stories in the database",
    imagesCardDescription: "View and manage uploaded IIIF images",
    noAuthorPlaceholder: "-",
    storiesCount: (count: number) => `${count} stories`,
    deletedStories: (count: number) => `Deleted stories (${count})`,
    byAuthor: (author: string) => `by ${author}`,
    deletedOn: (date: string) => `Deleted ${date}`,
    previewLabel: "Preview",
    imagesCount: (count: number) => `${count} images`,
    noStories: "No stories in the database yet.",
    noImages: "No uploaded images yet.",
    tableHeaders: {
      story: "Story",
      annotations: "Annotations",
      updated: "Updated",
      actions: "Actions",
    },
    imageTableHeaders: {
      filename: "Filename",
      dimensions: "Dimensions",
      usedBy: "Used By",
      created: "Created",
      actions: "Actions",
    },
    actionLabels: {
      edit: "Edit",
      delete: "Delete",
      restore: "Restore",
      storiiies: "Storiiies",
      clover: "Clover",
      mirador: "Mirador",
      annona: "Annona",
      manifest: "Manifest",
      viewInfoJson: "info.json",
    },
    status: {
      active: "Active",
      deleted: "Deleted",
    },
    notUsed: "Not used",
    deleteImageConfirm: "Delete this image? This cannot be undone.",
  },
} as const;

const STRINGS: Record<Locale, typeof en> = {
  en,
};

export type Strings = typeof en;

export const getStrings = (locale: Locale = "en"): Strings =>
  STRINGS[locale] ?? en;

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
