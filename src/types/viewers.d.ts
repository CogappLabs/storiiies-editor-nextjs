declare module "@cogapp/storiiies-viewer" {
  interface StoriiiesViewerConfig {
    container: string | HTMLElement;
    manifestUrl: string;
    // From the viewer's initial-annotation-index branch; older releases
    // ignore them.
    initialAnnotationIndex?: number;
    useUrlHash?: boolean;
  }

  export default class StoriiiesViewer {
    constructor(config: StoriiiesViewerConfig);
    viewer?: { destroy: () => void };
    ready?: Promise<void>;
  }
}
