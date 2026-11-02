declare module "@cogapp/storiiies-viewer" {
  interface StoriiiesViewerConfig {
    container: string | HTMLElement;
    manifestUrl: string;
  }

  export default class StoriiiesViewer {
    constructor(config: StoriiiesViewerConfig);
  }
}
