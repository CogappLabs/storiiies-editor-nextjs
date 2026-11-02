export const VIEWER_CONFIG = {
  zoomInFactor: 1.5,
  zoomOutFactor: 0.67,
  crosshair: {
    minDimension: 5,
    sizeRatio: 0.15,
    strokeWidth: 2,
  },
  // Hex copies of the Cogapp tokens in globals.css: SVG attributes set from
  // script can't reliably resolve CSS variables.
  colours: {
    cream: "#ebebe1",
    charcoal: "#282828",
    blue: "#227bff",
    handleFill: "#ffffff",
  },
  // The charcoal underlay is wider than the coloured line so a dark edge
  // shows on both sides of it.
  boxStroke: { normal: 2, selected: 3, underlayExtra: 2 },
} as const;
