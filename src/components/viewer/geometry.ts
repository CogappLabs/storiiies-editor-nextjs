import OpenSeadragon from "openseadragon";
import { VIEWER_CONFIG } from "@/lib/config";
import type { Rect } from "@/lib/types";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const windowToImage = (
  viewer: OpenSeadragon.Viewer,
  clientX: number,
  clientY: number,
): { x: number; y: number } => {
  const webPoint = new OpenSeadragon.Point(clientX, clientY);
  const viewportPoint = viewer.viewport.windowToViewportCoordinates(webPoint);
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
  return { x: imagePoint.x, y: imagePoint.y };
};

export const getHandlePositions = (
  x: number,
  y: number,
  w: number,
  h: number,
): Record<ResizeHandle, { cx: number; cy: number }> => ({
  nw: { cx: x, cy: y },
  n: { cx: x + w / 2, cy: y },
  ne: { cx: x + w, cy: y },
  e: { cx: x + w, cy: y + h / 2 },
  se: { cx: x + w, cy: y + h },
  s: { cx: x + w / 2, cy: y + h },
  sw: { cx: x, cy: y + h },
  w: { cx: x, cy: y + h / 2 },
});

export const applyResize = (
  handle: ResizeHandle,
  origRect: Rect,
  dx: number,
  dy: number,
): Rect => {
  let { x, y, width, height } = origRect;
  const minSize = 10;

  switch (handle) {
    case "nw":
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case "n":
      y += dy;
      height -= dy;
      break;
    case "ne":
      y += dy;
      width += dx;
      height -= dy;
      break;
    case "e":
      width += dx;
      break;
    case "se":
      width += dx;
      height += dy;
      break;
    case "s":
      height += dy;
      break;
    case "sw":
      x += dx;
      width -= dx;
      height += dy;
      break;
    case "w":
      x += dx;
      width -= dx;
      break;
  }

  if (width < minSize) {
    if (handle.includes("w")) x = origRect.x + origRect.width - minSize;
    width = minSize;
  }
  if (height < minSize) {
    if (handle.includes("n")) y = origRect.y + origRect.height - minSize;
    height = minSize;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
};

export const clampRect = (
  r: Rect,
  type: "move" | "resize",
  imageWidth: number,
  imageHeight: number,
): Rect => {
  const x = Math.max(0, r.x);
  const y = Math.max(0, r.y);
  return type === "move"
    ? {
        x: Math.round(Math.min(x, imageWidth - r.width)),
        y: Math.round(Math.min(y, imageHeight - r.height)),
        width: Math.round(r.width),
        height: Math.round(r.height),
      }
    : {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(Math.min(r.width, imageWidth - x)),
        height: Math.round(Math.min(r.height, imageHeight - y)),
      };
};

// Moves an annotation's rect, crosshairs and handles without a React render,
// so drags and key nudges stay smooth until the save round-trips.
export const drawRect = (group: Element, r: Rect) => {
  const rect = group.querySelector(".annotation-rect");
  rect?.setAttribute("x", String(r.x));
  rect?.setAttribute("y", String(r.y));
  rect?.setAttribute("width", String(r.width));
  rect?.setAttribute("height", String(r.height));

  const [hLine, vLine] = group.querySelectorAll(".crosshair-group line");
  if (hLine && vLine) {
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const size =
      Math.min(r.width, r.height) * VIEWER_CONFIG.crosshair.sizeRatio;
    hLine.setAttribute("x1", String(cx - size));
    hLine.setAttribute("y1", String(cy));
    hLine.setAttribute("x2", String(cx + size));
    hLine.setAttribute("y2", String(cy));
    vLine.setAttribute("x1", String(cx));
    vLine.setAttribute("y1", String(cy - size));
    vLine.setAttribute("x2", String(cx));
    vLine.setAttribute("y2", String(cy + size));
  }

  const handles = getHandlePositions(r.x, r.y, r.width, r.height);
  for (const [handle, pos] of Object.entries(handles)) {
    const circle = group.querySelector(`[data-handle="${handle}"]`);
    circle?.setAttribute("cx", String(pos.cx));
    circle?.setAttribute("cy", String(pos.cy));
  }
};

export const readRect = (group: Element): Rect => {
  const rect = group.querySelector(".annotation-rect");
  const num = (name: string) =>
    Math.round(Number.parseFloat(rect?.getAttribute(name) || "0"));
  return {
    x: num("x"),
    y: num("y"),
    width: num("width"),
    height: num("height"),
  };
};

export const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export const handleCursors: Record<ResizeHandle, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

export const getScale = (viewer: OpenSeadragon.Viewer): number => {
  const zoom = viewer.viewport.getZoom(true);
  const containerWidth = viewer.viewport.getContainerSize().x;
  const contentFactor = viewer.world.getContentFactor();
  return (zoom * containerWidth) / contentFactor;
};
