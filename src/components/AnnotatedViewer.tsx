"use client";

import OpenSeadragon from "openseadragon";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Annotation } from "@/generated/prisma/client";
import { VIEWER_CONFIG } from "@/lib/config";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import type { AnnotationBounds, Rect } from "@/lib/types";

// Store viewer instances outside React to prevent HMR serialization issues
const viewerInstances = new WeakMap<
  HTMLDivElement,
  { viewer: OpenSeadragon.Viewer }
>();

const SVG_NS = "http://www.w3.org/2000/svg";

interface Props {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
  onAnnotationUpdate?: (id: string, coords: Rect) => void;
  onAnnotationSelect?: (id: string | null) => void;
  onReadyChange?: (ready: boolean) => void;
  selectedAnnotationId?: string | null;
  showCrosshairs?: boolean;
  onToggleCrosshairs?: () => void;
}

export interface AnnotatedViewerHandle {
  getViewportBounds: () => AnnotationBounds | null;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DragInfo {
  type: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origRect: Rect;
  annotationId: string;
}

const windowToImage = (
  viewer: OpenSeadragon.Viewer,
  clientX: number,
  clientY: number,
): { x: number; y: number } => {
  const webPoint = new OpenSeadragon.Point(clientX, clientY);
  const viewportPoint = viewer.viewport.windowToViewportCoordinates(webPoint);
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
  return { x: imagePoint.x, y: imagePoint.y };
};

const getHandlePositions = (
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

const applyResize = (
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

const clampRect = (
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
const drawRect = (group: Element, r: Rect) => {
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

const readRect = (group: Element): Rect => {
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

const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const handleCursors: Record<ResizeHandle, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

const getScale = (viewer: OpenSeadragon.Viewer): number => {
  const zoom = viewer.viewport.getZoom(true);
  const containerWidth = viewer.viewport.getContainerSize().x;
  const contentFactor = viewer.world.getContentFactor();
  return (zoom * containerWidth) / contentFactor;
};

const AnnotatedViewer = forwardRef<AnnotatedViewerHandle, Props>(
  (
    {
      imageUrl,
      imageWidth,
      imageHeight,
      annotations,
      onAnnotationUpdate,
      onAnnotationSelect,
      onReadyChange,
      selectedAnnotationId,
      showCrosshairs = false,
      onToggleCrosshairs,
    },
    ref,
  ) => {
    const strings = useStrings();
    const containerRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<SVGGElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const dragRef = useRef<DragInfo | null>(null);
    const keySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Skip fitBounds when selection originates from clicking in the viewer
    const skipFitBoundsRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    const onAnnotationSelectRef = useRef(onAnnotationSelect);
    onAnnotationSelectRef.current = onAnnotationSelect;
    const onAnnotationUpdateRef = useRef(onAnnotationUpdate);
    onAnnotationUpdateRef.current = onAnnotationUpdate;
    const annotationsRef = useRef(annotations);
    annotationsRef.current = annotations;

    const getViewer = useCallback(() => {
      if (!containerRef.current) return null;
      return viewerInstances.get(containerRef.current)?.viewer ?? null;
    }, []);

    useImperativeHandle(ref, () => ({
      getViewportBounds: (): AnnotationBounds | null => {
        const viewer = getViewer();
        if (!viewer || viewer.world.getItemCount() === 0) return null;

        const zoom = viewer.viewport.getZoom();
        const minZoom = viewer.viewport.getMinZoom();
        if (zoom <= minZoom * 1.05) {
          return {
            rect: { x: 0, y: 0, width: imageWidth, height: imageHeight },
            viewport: { x: 0, y: 0, width: imageWidth, height: imageHeight },
          };
        }

        const viewportRect = viewer.viewport.getBounds();
        const imageRect =
          viewer.viewport.viewportToImageRectangle(viewportRect);

        const left = Math.max(0, imageRect.x);
        const top = Math.max(0, imageRect.y);
        const right = Math.min(imageWidth, imageRect.x + imageRect.width);
        const bottom = Math.min(imageHeight, imageRect.y + imageRect.height);
        const bounds = {
          x: Math.round(left),
          y: Math.round(top),
          width: Math.round(Math.max(1, right - left)),
          height: Math.round(Math.max(1, bottom - top)),
        };

        return { rect: bounds, viewport: bounds };
      },
    }));

    useEffect(() => {
      onReadyChange?.(isReady);
    }, [isReady, onReadyChange]);

    // Get handle radius in image coordinates for consistent ~6px screen size
    const getHandleRadius = useCallback(() => {
      const viewer = getViewer();
      if (!viewer) return 60;
      const scale = getScale(viewer);
      if (scale <= 0) return 60;
      return 6 / scale;
    }, [getViewer]);

    // OpenSeadragon plus an SVG overlay for the annotation boxes.
    useEffect(() => {
      if (!containerRef.current) return;

      let isDisposed = false;
      let transformRafId: number | null = null;
      const container = containerRef.current;
      const viewer = OpenSeadragon({
        element: container,
        tileSources: `${imageUrl}/info.json`,
        showNavigationControl: false,
        gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: false },
        gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: false },
        visibilityRatio: 0.5,
        constrainDuringPan: false,
        debugMode: false,
      });

      viewerInstances.set(container, { viewer });

      viewer.addHandler("open", () => {
        if (isDisposed) return;

        // SVG overlay as sibling of OSD's container (avoids interfering with OSD internals)
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        svg.style.overflow = "hidden";
        container.appendChild(svg);
        svgRef.current = svg;

        // Inner <g> in image coordinates, positioned with the SVG transform attribute (not CSS)
        const g = document.createElementNS(SVG_NS, "g");
        svg.appendChild(g);
        groupRef.current = g;

        // Sync transform during pan/zoom. Throttle to one DOM update per frame.
        let lastTransform = "";
        const syncTransform = () => {
          if (isDisposed) return;
          const p = viewer.viewport.pixelFromPoint(
            new OpenSeadragon.Point(0, 0),
            true,
          );
          const scale = getScale(viewer);
          const transform = `translate(${p.x.toFixed(3)}, ${p.y.toFixed(3)}) scale(${scale.toFixed(6)})`;
          if (transform === lastTransform) return;
          lastTransform = transform;
          g.setAttribute("transform", transform);
        };
        const scheduleSyncTransform = () => {
          if (transformRafId !== null) return;
          transformRafId = window.requestAnimationFrame(() => {
            transformRafId = null;
            syncTransform();
          });
        };

        viewer.addHandler("animation", scheduleSyncTransform);
        viewer.addHandler("animation-finish", syncTransform);
        viewer.addHandler("resize", scheduleSyncTransform);
        syncTransform();

        if (!isDisposed) {
          setIsReady(true);
        }
      });

      // Deselect when clicking empty canvas area
      viewer.addHandler("canvas-click", (event: OpenSeadragon.ViewerEvent) => {
        const e = event as unknown as { quick?: boolean };
        if (e.quick) {
          onAnnotationSelectRef.current?.(null);
        }
      });

      return () => {
        isDisposed = true;
        if (transformRafId !== null) {
          window.cancelAnimationFrame(transformRafId);
          transformRafId = null;
        }
        svgRef.current?.remove();
        svgRef.current = null;
        groupRef.current = null;
        viewer.destroy();
        viewerInstances.delete(container);
        setIsReady(false);
      };
    }, [imageUrl]);

    useEffect(() => {
      const g = groupRef.current;
      if (!isReady || !g) return;

      // Rebuilding the SVG drops focus; put it back on the selected rect.
      const hadFocus = g.contains(document.activeElement);
      while (g.firstChild) g.removeChild(g.firstChild);

      const handleRadius = getHandleRadius();
      let focusTarget: SVGRectElement | null = null;

      for (const ann of annotations) {
        const isSelected = ann.id === selectedAnnotationId;
        const origRect: Rect = {
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
        };

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("data-annotation-id", ann.id);

        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(ann.x));
        rect.setAttribute("y", String(ann.y));
        rect.setAttribute("width", String(ann.width));
        rect.setAttribute("height", String(ann.height));
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("stroke", isSelected ? "#ff6600" : "#00bfff");
        rect.setAttribute("stroke-width", isSelected ? "3" : "2");
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        rect.setAttribute("class", "annotation-rect");
        rect.style.pointerEvents = "auto";
        rect.style.cursor = isSelected ? "move" : "pointer";

        if (isSelected) {
          rect.setAttribute("tabindex", "0");
          rect.setAttribute(
            "aria-label",
            strings.viewerControls.selectedAnnotation,
          );
          rect.addEventListener("keydown", (e) => {
            const step = ARROW_STEPS[e.key];
            const viewer = getViewer();
            if (!step || !viewer) return;
            e.preventDefault();

            // 10 screen pixels per press at any zoom.
            const amount = 10 / getScale(viewer);
            const [dx, dy] = [step[0] * amount, step[1] * amount];
            const current = readRect(group);
            const next = e.shiftKey
              ? clampRect(
                  {
                    ...current,
                    width: Math.max(10, current.width + dx),
                    height: Math.max(10, current.height + dy),
                  },
                  "resize",
                  imageWidth,
                  imageHeight,
                )
              : clampRect(
                  { ...current, x: current.x + dx, y: current.y + dy },
                  "move",
                  imageWidth,
                  imageHeight,
                );
            drawRect(group, next);

            // One save per burst of key presses rather than one per press.
            if (keySaveTimerRef.current) clearTimeout(keySaveTimerRef.current);
            keySaveTimerRef.current = setTimeout(() => {
              onAnnotationUpdateRef.current?.(ann.id, next);
            }, 400);
          });
          focusTarget = rect;
        }

        rect.addEventListener("pointerdown", (e) => {
          e.stopPropagation();

          if (!isSelected) {
            skipFitBoundsRef.current = true;
            onAnnotationSelectRef.current?.(ann.id);
            return;
          }

          const viewer = getViewer();
          if (!viewer) return;

          const imgPt = windowToImage(viewer, e.clientX, e.clientY);
          dragRef.current = {
            type: "move",
            startX: imgPt.x,
            startY: imgPt.y,
            origRect,
            annotationId: ann.id,
          };

          for (const h of group.querySelectorAll(".resize-handle")) {
            (h as SVGElement).style.display = "none";
          }
        });

        group.appendChild(rect);

        if (
          showCrosshairs &&
          ann.width >= VIEWER_CONFIG.crosshair.minDimension &&
          ann.height >= VIEWER_CONFIG.crosshair.minDimension
        ) {
          const cx = ann.x + ann.width / 2;
          const cy = ann.y + ann.height / 2;
          const size =
            Math.min(ann.width, ann.height) * VIEWER_CONFIG.crosshair.sizeRatio;

          const crosshairGroup = document.createElementNS(SVG_NS, "g");
          crosshairGroup.setAttribute("class", "crosshair-group");

          for (const [x1, y1, x2, y2] of [
            [cx - size, cy, cx + size, cy],
            [cx, cy - size, cx, cy + size],
          ] as [number, number, number, number][]) {
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", String(x1));
            line.setAttribute("y1", String(y1));
            line.setAttribute("x2", String(x2));
            line.setAttribute("y2", String(y2));
            line.setAttribute(
              "stroke",
              isSelected ? "red" : VIEWER_CONFIG.crosshair.strokeColor,
            );
            line.setAttribute(
              "stroke-width",
              String(VIEWER_CONFIG.crosshair.strokeWidth),
            );
            line.setAttribute("vector-effect", "non-scaling-stroke");
            crosshairGroup.appendChild(line);
          }

          group.appendChild(crosshairGroup);
        }

        if (isSelected) {
          const handles = getHandlePositions(
            ann.x,
            ann.y,
            ann.width,
            ann.height,
          );
          for (const [handle, pos] of Object.entries(handles)) {
            const circle = document.createElementNS(SVG_NS, "circle");
            circle.setAttribute("cx", String(pos.cx));
            circle.setAttribute("cy", String(pos.cy));
            circle.setAttribute("r", String(handleRadius));
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", "#ff6600");
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("vector-effect", "non-scaling-stroke");
            circle.setAttribute("class", "resize-handle");
            circle.setAttribute("data-handle", handle);
            circle.style.pointerEvents = "auto";
            circle.style.cursor = handleCursors[handle as ResizeHandle];

            circle.addEventListener("pointerdown", (e) => {
              e.stopPropagation();

              const viewer = getViewer();
              if (!viewer) return;

              const imgPt = windowToImage(viewer, e.clientX, e.clientY);
              dragRef.current = {
                type: "resize",
                handle: handle as ResizeHandle,
                startX: imgPt.x,
                startY: imgPt.y,
                origRect,
                annotationId: ann.id,
              };
            });

            group.appendChild(circle);
          }
        }

        g.appendChild(group);
      }

      if (hadFocus) focusTarget?.focus();
    }, [
      isReady,
      annotations,
      selectedAnnotationId,
      showCrosshairs,
      getHandleRadius,
      getViewer,
      imageWidth,
      imageHeight,
      strings,
    ]);

    useEffect(() => {
      const handlePointerMove = (e: PointerEvent) => {
        const drag = dragRef.current;
        const g = groupRef.current;
        const viewer = getViewer();
        if (!drag || !g || !viewer) return;

        const imgPt = windowToImage(viewer, e.clientX, e.clientY);
        const dx = imgPt.x - drag.startX;
        const dy = imgPt.y - drag.startY;

        const group = g.querySelector(
          `[data-annotation-id="${drag.annotationId}"]`,
        );
        if (!group) return;

        let newRect: Rect;
        if (drag.type === "move") {
          newRect = {
            ...drag.origRect,
            x: drag.origRect.x + dx,
            y: drag.origRect.y + dy,
          };
        } else if (drag.handle) {
          newRect = applyResize(drag.handle, drag.origRect, dx, dy);
        } else {
          return;
        }

        drawRect(group, clampRect(newRect, drag.type, imageWidth, imageHeight));
      };

      const handlePointerUp = () => {
        const drag = dragRef.current;
        if (!drag) return;

        const g = groupRef.current;

        if (g) {
          const group = g.querySelector(
            `[data-annotation-id="${drag.annotationId}"]`,
          );
          if (group) {
            const finalRect = readRect(group);

            const orig = drag.origRect;
            if (
              finalRect.x !== orig.x ||
              finalRect.y !== orig.y ||
              finalRect.width !== orig.width ||
              finalRect.height !== orig.height
            ) {
              onAnnotationUpdateRef.current?.(drag.annotationId, finalRect);
            }
          }

          if (group) {
            for (const h of group.querySelectorAll(".resize-handle")) {
              (h as SVGElement).style.display = "";
            }
          }
        }

        dragRef.current = null;
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }, [imageWidth, imageHeight, getViewer]);

    // Update resize handle sizes after zoom settles
    useEffect(() => {
      const viewer = getViewer();
      if (!viewer || !isReady) return;

      const updateHandleSizes = () => {
        const g = groupRef.current;
        if (!g) return;
        const radius = getHandleRadius();
        for (const circle of g.querySelectorAll(".resize-handle")) {
          circle.setAttribute("r", String(radius));
        }
      };

      viewer.addHandler("animation-finish", updateHandleSizes);

      return () => {
        viewer.removeHandler("animation-finish", updateHandleSizes);
      };
    }, [isReady, getViewer, getHandleRadius]);

    // Fit bounds when selected annotation changes (sidebar clicks only)
    useEffect(() => {
      if (skipFitBoundsRef.current) {
        skipFitBoundsRef.current = false;
        return;
      }

      const viewer = getViewer();
      if (!viewer || !selectedAnnotationId) return;

      const annotation = annotationsRef.current.find(
        (a) => a.id === selectedAnnotationId,
      );
      if (!annotation) return;

      const imageRect = new OpenSeadragon.Rect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height,
      );
      const viewportRect = viewer.viewport.imageToViewportRectangle(imageRect);
      viewer.viewport.fitBounds(viewportRect, false);
    }, [selectedAnnotationId, getViewer]);

    const handleZoomIn = () => {
      const viewer = getViewer();
      if (viewer) {
        viewer.viewport.zoomBy(VIEWER_CONFIG.zoomInFactor);
        viewer.viewport.applyConstraints();
      }
    };

    const handleZoomOut = () => {
      const viewer = getViewer();
      if (viewer) {
        viewer.viewport.zoomBy(VIEWER_CONFIG.zoomOutFactor);
        viewer.viewport.applyConstraints();
      }
    };

    const handleHome = () => {
      const viewer = getViewer();
      if (viewer) {
        viewer.viewport.goHome();
      }
    };

    return (
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" />

        {isReady && (
          <div className="absolute top-4 left-4 flex gap-1 z-10">
            <button
              type="button"
              onClick={handleZoomIn}
              className="bg-white hover:bg-gray-100 p-2 rounded shadow border"
              aria-label={strings.viewerControls.zoomIn}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="bg-white hover:bg-gray-100 p-2 rounded shadow border"
              aria-label={strings.viewerControls.zoomOut}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleHome}
              className="bg-white hover:bg-gray-100 p-2 rounded shadow border"
              aria-label={strings.viewerControls.resetView}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleCrosshairs}
              className={`p-2 rounded shadow border ${
                showCrosshairs
                  ? "bg-cogapp-charcoal text-cogapp-cream border-cogapp-charcoal hover:bg-cogapp-charcoal/90"
                  : "bg-white hover:bg-gray-100"
              }`}
              aria-label={
                showCrosshairs
                  ? strings.viewerControls.hideCrosshairs
                  : strings.viewerControls.showCrosshairs
              }
              aria-pressed={showCrosshairs}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v4m0 8v4m-8-8h4m8 0h4"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  },
);

AnnotatedViewer.displayName = "AnnotatedViewer";

export default AnnotatedViewer;
