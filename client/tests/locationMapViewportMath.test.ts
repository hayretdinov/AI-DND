import { describe, expect, it } from "vitest";
import {
  centerMapOnPercent,
  clampMapPan,
  getMapZoomRange,
  hasMapPointerDragged,
  zoomMapAroundPoint,
} from "../src/systems/map/locationMapViewportMath";

const phoneViewport = { width: 390, height: 844 };
const westernCityMap = { width: 1680, height: 938 };

describe("location map viewport math", () => {
  it("starts closer than the cover scale and preserves a useful zoom range", () => {
    const range = getMapZoomRange(phoneViewport, westernCityMap);

    expect(range.initial).toBeGreaterThan(range.min);
    expect(range.max).toBeGreaterThan(range.initial);
    expect(range.initial / range.min).toBeCloseTo(1.2);
  });

  it("centers the player position while keeping the map inside viewport bounds", () => {
    const range = getMapZoomRange(phoneViewport, westernCityMap);
    const pan = centerMapOnPercent({ x: 50, y: 50 }, phoneViewport, westernCityMap, range.initial);
    const scaledWidth = westernCityMap.width * range.initial;
    const scaledHeight = westernCityMap.height * range.initial;

    expect(pan.x).toBeLessThanOrEqual(0);
    expect(pan.x).toBeGreaterThanOrEqual(phoneViewport.width - scaledWidth);
    expect(pan.y).toBeLessThanOrEqual(0);
    expect(pan.y).toBeGreaterThanOrEqual(phoneViewport.height - scaledHeight);
  });

  it("clamps dragging at every map edge", () => {
    const range = getMapZoomRange(phoneViewport, westernCityMap);
    const topLeft = clampMapPan({ x: 10000, y: 10000 }, phoneViewport, westernCityMap, range.initial);
    const bottomRight = clampMapPan({ x: -10000, y: -10000 }, phoneViewport, westernCityMap, range.initial);

    expect(topLeft).toEqual({ x: 0, y: 0 });
    expect(bottomRight.x).toBeCloseTo(phoneViewport.width - westernCityMap.width * range.initial);
    expect(bottomRight.y).toBeCloseTo(phoneViewport.height - westernCityMap.height * range.initial);
  });

  it("keeps the same world point under the finger while zooming", () => {
    const range = getMapZoomRange(phoneViewport, westernCityMap);
    const focal = { x: 130, y: 260 };
    const state = {
      zoom: range.initial,
      pan: centerMapOnPercent({ x: 48, y: 55 }, phoneViewport, westernCityMap, range.initial),
    };
    const worldBefore = {
      x: (focal.x - state.pan.x) / state.zoom,
      y: (focal.y - state.pan.y) / state.zoom,
    };
    const next = zoomMapAroundPoint(
      state,
      range.initial * 1.25,
      focal,
      phoneViewport,
      westernCityMap,
    );
    const worldAfter = {
      x: (focal.x - next.pan.x) / next.zoom,
      y: (focal.y - next.pan.y) / next.zoom,
    };

    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);
  });

  it("distinguishes a marker tap from a drag after six pixels", () => {
    expect(hasMapPointerDragged({ x: 100, y: 100 }, { x: 104, y: 103 })).toBe(false);
    expect(hasMapPointerDragged({ x: 100, y: 100 }, { x: 107, y: 100 })).toBe(true);
  });
});
