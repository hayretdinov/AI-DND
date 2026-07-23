export type MapViewportSize = {
  width: number;
  height: number;
};

export type MapViewportPoint = {
  x: number;
  y: number;
};

export type MapViewportState = {
  zoom: number;
  pan: MapViewportPoint;
};

export type MapZoomRange = {
  min: number;
  initial: number;
  max: number;
};

const INITIAL_ZOOM_MULTIPLIER = 1.2;
const MAX_ZOOM_MULTIPLIER = 3;

export function clampMapValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMapZoomRange(
  viewport: MapViewportSize,
  content: MapViewportSize,
): MapZoomRange {
  if (viewport.width <= 0 || viewport.height <= 0 || content.width <= 0 || content.height <= 0) {
    return { min: 1, initial: 1, max: 3 };
  }

  const coverZoom = Math.max(viewport.width / content.width, viewport.height / content.height);
  const initial = coverZoom * INITIAL_ZOOM_MULTIPLIER;

  return {
    min: coverZoom,
    initial,
    max: Math.max(initial, coverZoom * MAX_ZOOM_MULTIPLIER),
  };
}

export function clampMapPan(
  pan: MapViewportPoint,
  viewport: MapViewportSize,
  content: MapViewportSize,
  zoom: number,
): MapViewportPoint {
  const scaledWidth = content.width * zoom;
  const scaledHeight = content.height * zoom;

  const clampAxis = (position: number, viewportLength: number, contentLength: number) => {
    if (contentLength <= viewportLength) {
      return (viewportLength - contentLength) / 2;
    }

    return clampMapValue(position, viewportLength - contentLength, 0);
  };

  return {
    x: clampAxis(pan.x, viewport.width, scaledWidth),
    y: clampAxis(pan.y, viewport.height, scaledHeight),
  };
}

export function centerMapOnPercent(
  focusPercent: MapViewportPoint,
  viewport: MapViewportSize,
  content: MapViewportSize,
  zoom: number,
): MapViewportPoint {
  const focusX = clampMapValue(focusPercent.x, 0, 100) / 100;
  const focusY = clampMapValue(focusPercent.y, 0, 100) / 100;

  return clampMapPan(
    {
      x: viewport.width / 2 - content.width * zoom * focusX,
      y: viewport.height / 2 - content.height * zoom * focusY,
    },
    viewport,
    content,
    zoom,
  );
}

export function zoomMapAroundPoint(
  state: MapViewportState,
  nextZoom: number,
  focalPoint: MapViewportPoint,
  viewport: MapViewportSize,
  content: MapViewportSize,
): MapViewportState {
  const worldX = (focalPoint.x - state.pan.x) / state.zoom;
  const worldY = (focalPoint.y - state.pan.y) / state.zoom;
  const nextPan = {
    x: focalPoint.x - worldX * nextZoom,
    y: focalPoint.y - worldY * nextZoom,
  };

  return {
    zoom: nextZoom,
    pan: clampMapPan(nextPan, viewport, content, nextZoom),
  };
}

export function hasMapPointerDragged(
  start: MapViewportPoint,
  current: MapViewportPoint,
  threshold = 6,
) {
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}
