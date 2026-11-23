declare module "@cogapp/storiiies-viewer" {
  interface StoriiiesViewerConfig {
    container: string | HTMLElement;
    manifestUrl: string;
    // From unreleased viewer branches (see the pin note in CLAUDE.md);
    // older releases ignore them.
    initialAnnotationIndex?: number;
    useUrlHash?: boolean;
    infoPosition?: import("@/lib/viewers").InfoPosition;
  }

  export default class StoriiiesViewer {
    constructor(config: StoriiiesViewerConfig);
    viewer?: { destroy: () => void };
    ready?: Promise<void>;
  }
}
