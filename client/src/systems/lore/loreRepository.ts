import { ARDANIA_LORE_SOURCE_PATH, ardanianPublicLoreEntries } from "../../data/ardaniaLore";
import { appEventBus } from "../events/eventBus";
import type { LoreEntry } from "./loreTypes";

export class ArdanianLoreRepository {
  private cachedEntries?: LoreEntry[];

  /** Return structured, client-safe lore entries derived from the canonical lore document. */
  getEntries() {
    if (this.cachedEntries) {
      return this.cachedEntries;
    }

    appEventBus.emit("LORE_LOADING_STARTED", { source: ARDANIA_LORE_SOURCE_PATH });

    try {
      this.cachedEntries = ardanianPublicLoreEntries;
      appEventBus.emit("LORE_LOADING_FINISHED", {
        source: ARDANIA_LORE_SOURCE_PATH,
        entries: this.cachedEntries.length,
      });
      return this.cachedEntries;
    } catch (error) {
      appEventBus.emit("LORE_LOADING_FAILED", {
        source: ARDANIA_LORE_SOURCE_PATH,
        message: error instanceof Error ? error.message : "unknown lore loading error",
      });
      return [];
    }
  }

  /** Clear the in-memory cache; useful in development when lore data changes. */
  clearCache() {
    this.cachedEntries = undefined;
  }
}

export const ardanianLoreRepository = new ArdanianLoreRepository();
