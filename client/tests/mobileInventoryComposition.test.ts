import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const mobileInventoryCss = globalCss.slice(globalCss.indexOf("@media (max-width: 767px)"));

describe("mobile inventory character composition", () => {
  it("keeps the character stage full width instead of applying the old 43 percent crop", () => {
    const stageRule = mobileInventoryCss.match(/\.inventory-character-stage\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(stageRule).not.toContain("right: 43%");
    expect(stageRule).toContain("overflow: hidden");
  });

  it("keeps both characters large and places the companion behind the player", () => {
    const playerRule = mobileInventoryCss.match(/\.inventory-character-figure\s*\{([^}]*)\}/)?.[1] ?? "";
    const companionRule = mobileInventoryCss.match(/\.inventory-companion-figure\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(playerRule).toContain("height: 96%");
    expect(playerRule).toContain("z-index: 3");
    expect(companionRule).toContain("height: 92%");
    expect(companionRule).toContain("z-index: 2");
    expect(companionRule).toContain("scale(0.96)");
  });

  it("recenters the player when Anariel is not active", () => {
    expect(mobileInventoryCss).toMatch(
      /\.inventory-character-stage--solo \.inventory-character-figure\s*\{[^}]*left:\s*50%/,
    );
  });
});
