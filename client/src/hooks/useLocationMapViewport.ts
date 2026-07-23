import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type SyntheticEvent,
} from "react";
import {
  centerMapOnPercent,
  clampMapPan,
  clampMapValue,
  getMapZoomRange,
  hasMapPointerDragged,
  zoomMapAroundPoint,
  type MapViewportPoint,
  type MapViewportSize,
  type MapViewportState,
} from "../systems/map/locationMapViewportMath";

type UseLocationMapViewportOptions = {
  focusPercent: MapViewportPoint;
};

type DragState = {
  pointerId: number;
  startPointer: MapViewportPoint;
  startPan: MapViewportPoint;
  hasDragged: boolean;
};

type PinchState = {
  active: boolean;
  startDistance: number;
  startZoom: number;
  startPan: MapViewportPoint;
  startMidpoint: MapViewportPoint;
};

const MOBILE_MAP_QUERY = "(max-width: 768px)";
const ZOOM_STEP_RATIO = 0.18;

function getPointerMidpoint(points: MapViewportPoint[]) {
  const [first, second] = points;
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function getPointerDistance(points: MapViewportPoint[]) {
  const [first, second] = points;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function useLocationMapViewport({ focusPercent }: UseLocationMapViewportOptions) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(MOBILE_MAP_QUERY).matches,
  );
  const [contentSize, setContentSize] = useState<MapViewportSize>({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState<MapViewportSize>({ width: 0, height: 0 });
  const [viewState, setViewState] = useState<MapViewportState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isDragging, setIsDragging] = useState(false);
  const initializedRef = useRef(false);
  const viewStateRef = useRef(viewState);
  const viewportSizeRef = useRef(viewportSize);
  const contentSizeRef = useRef(contentSize);
  const activePointersRef = useRef(new Map<number, MapViewportPoint>());
  const dragStateRef = useRef<DragState>({
    pointerId: -1,
    startPointer: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    hasDragged: false,
  });
  const pinchStateRef = useRef<PinchState>({
    active: false,
    startDistance: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startMidpoint: { x: 0, y: 0 },
  });
  const suppressMarkerClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    viewportSizeRef.current = viewportSize;
  }, [viewportSize]);

  useEffect(() => {
    contentSizeRef.current = contentSize;
  }, [contentSize]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MAP_QUERY);
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
      initializedRef.current = false;
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const updateViewportSize = () => {
      const rect = viewport.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateViewportSize();
    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isMobile || viewportSize.width <= 0 || contentSize.width <= 0) {
      return;
    }

    const zoomRange = getMapZoomRange(viewportSize, contentSize);
    const zoom = initializedRef.current
      ? clampMapValue(viewStateRef.current.zoom, zoomRange.min, zoomRange.max)
      : zoomRange.initial;
    const pan = initializedRef.current
      ? clampMapPan(viewStateRef.current.pan, viewportSize, contentSize, zoom)
      : centerMapOnPercent(focusPercent, viewportSize, contentSize, zoom);

    initializedRef.current = true;
    setViewState({ zoom, pan });
  }, [contentSize, focusPercent.x, focusPercent.y, isMobile, viewportSize]);

  useEffect(() => () => {
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
  }, []);

  const markClickAsSuppressed = useCallback(() => {
    suppressMarkerClickRef.current = true;

    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }

    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressMarkerClickRef.current = false;
    }, 300);
  }, []);

  const updateZoom = useCallback((requestedZoom: number, focalPoint?: MapViewportPoint) => {
    const viewport = viewportSizeRef.current;
    const content = contentSizeRef.current;
    const current = viewStateRef.current;
    const zoomRange = getMapZoomRange(viewport, content);
    const nextZoom = clampMapValue(requestedZoom, zoomRange.min, zoomRange.max);
    const focal = focalPoint ?? { x: viewport.width / 2, y: viewport.height / 2 };
    const nextState = zoomMapAroundPoint(current, nextZoom, focal, viewport, content);

    viewStateRef.current = nextState;
    setViewState(nextState);
  }, []);

  const resetView = useCallback(() => {
    const viewport = viewportSizeRef.current;
    const content = contentSizeRef.current;
    const zoomRange = getMapZoomRange(viewport, content);
    const nextState = {
      zoom: zoomRange.initial,
      pan: centerMapOnPercent(focusPercent, viewport, content, zoomRange.initial),
    };

    viewStateRef.current = nextState;
    setViewState(nextState);
  }, [focusPercent.x, focusPercent.y]);

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setContentSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isMobile || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const pointer = { x: event.clientX, y: event.clientY };
    activePointersRef.current.set(event.pointerId, pointer);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activePointersRef.current.size === 2) {
      const pointers = Array.from(activePointersRef.current.values());
      pinchStateRef.current = {
        active: true,
        startDistance: getPointerDistance(pointers),
        startZoom: viewStateRef.current.zoom,
        startPan: viewStateRef.current.pan,
        startMidpoint: getPointerMidpoint(pointers),
      };
      dragStateRef.current.hasDragged = true;
      setIsDragging(true);
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startPointer: pointer,
      startPan: viewStateRef.current.pan,
      hasDragged: false,
    };
  }, [isMobile]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !activePointersRef.current.has(event.pointerId)) {
      return;
    }

    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchStateRef.current.active && activePointersRef.current.size >= 2) {
      event.preventDefault();
      const pointers = Array.from(activePointersRef.current.values());
      const pinch = pinchStateRef.current;
      const currentMidpoint = getPointerMidpoint(pointers);
      const zoomRange = getMapZoomRange(viewportSizeRef.current, contentSizeRef.current);
      const nextZoom = clampMapValue(
        pinch.startZoom * (getPointerDistance(pointers) / Math.max(1, pinch.startDistance)),
        zoomRange.min,
        zoomRange.max,
      );
      const worldX = (pinch.startMidpoint.x - pinch.startPan.x) / pinch.startZoom;
      const worldY = (pinch.startMidpoint.y - pinch.startPan.y) / pinch.startZoom;
      const nextState = {
        zoom: nextZoom,
        pan: clampMapPan(
          {
            x: currentMidpoint.x - worldX * nextZoom,
            y: currentMidpoint.y - worldY * nextZoom,
          },
          viewportSizeRef.current,
          contentSizeRef.current,
          nextZoom,
        ),
      };

      viewStateRef.current = nextState;
      setViewState(nextState);
      return;
    }

    const drag = dragStateRef.current;

    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const currentPointer = { x: event.clientX, y: event.clientY };
    if (!drag.hasDragged && hasMapPointerDragged(drag.startPointer, currentPointer)) {
      drag.hasDragged = true;
      setIsDragging(true);
    }

    if (!drag.hasDragged) {
      return;
    }

    event.preventDefault();
    const nextPan = clampMapPan(
      {
        x: drag.startPan.x + currentPointer.x - drag.startPointer.x,
        y: drag.startPan.y + currentPointer.y - drag.startPointer.y,
      },
      viewportSizeRef.current,
      contentSizeRef.current,
      viewStateRef.current.zoom,
    );
    const nextState = { zoom: viewStateRef.current.zoom, pan: nextPan };
    viewStateRef.current = nextState;
    setViewState(nextState);
  }, [isMobile]);

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isMobile) {
      return;
    }

    const wasPinching = pinchStateRef.current.active;
    const wasDragging = dragStateRef.current.hasDragged;
    activePointersRef.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (wasPinching && activePointersRef.current.size < 2) {
      pinchStateRef.current.active = false;
      markClickAsSuppressed();
    } else if (wasDragging) {
      markClickAsSuppressed();
    }

    if (dragStateRef.current.pointerId === event.pointerId) {
      dragStateRef.current.pointerId = -1;
      dragStateRef.current.hasDragged = false;
    }

    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    }
  }, [isMobile, markClickAsSuppressed]);

  const consumeSuppressedMarkerClick = useCallback(() => {
    if (!suppressMarkerClickRef.current) {
      return false;
    }

    suppressMarkerClickRef.current = false;
    return true;
  }, []);

  const worldStyle = useMemo<CSSProperties | undefined>(() => {
    if (!isMobile || contentSize.width <= 0 || contentSize.height <= 0) {
      return undefined;
    }

    return {
      width: `${contentSize.width}px`,
      height: `${contentSize.height}px`,
      transform: `translate3d(${viewState.pan.x}px, ${viewState.pan.y}px, 0) scale(${viewState.zoom})`,
    };
  }, [contentSize.height, contentSize.width, isMobile, viewState.pan.x, viewState.pan.y, viewState.zoom]);

  const zoomRange = getMapZoomRange(viewportSize, contentSize);

  return {
    viewportRef,
    worldStyle,
    isMobile,
    isDragging,
    handleImageLoad,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    consumeSuppressedMarkerClick,
    zoomIn: () => updateZoom(viewStateRef.current.zoom + zoomRange.initial * ZOOM_STEP_RATIO),
    zoomOut: () => updateZoom(viewStateRef.current.zoom - zoomRange.initial * ZOOM_STEP_RATIO),
    resetView,
  };
}
