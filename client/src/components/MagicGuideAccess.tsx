import { useEffect, useState } from "react";
import { isEditableTarget } from "./dialogueInputUtils";
import { t, type TranslationKey } from "../i18n/i18n";
import {
  contextGuideDefinitions,
  getContextGuideItem,
  getReadableImageAsset,
  isGuideRead,
  type ContextGuideId,
} from "../systems/inventory/readableItems";
import type { GameSave } from "../systems/save/saveSystem";
import type { InventoryItem } from "../types/inventory";

type ReadableImageViewerProps = {
  item: InventoryItem;
  onClose: () => void;
};

type MagicGuideQuickAccessProps = {
  save: GameSave | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type ContextGuideButtonProps = {
  guideId: ContextGuideId;
  save: GameSave | null;
  isOpen: boolean;
  onToggle: () => void;
};

type ContextGuideSidePanelProps = {
  guideId: ContextGuideId;
  save: GameSave | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (guideId: ContextGuideId) => void;
};

function translateOptionalKey(key: string | undefined, fallbackKey: TranslationKey) {
  return t((key ?? fallbackKey) as TranslationKey);
}

export function ReadableImageViewer({ item, onClose }: ReadableImageViewerProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const asset = getReadableImageAsset(item);
  const title = translateOptionalKey(item.readTitleKey, "magicGuide.viewerTitle");
  const description = translateOptionalKey(item.readDescriptionKey, "items.magicApprenticeGuide.description");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="readable-viewer" role="dialog" aria-modal="true" aria-labelledby="readable-viewer-title">
      <button className="readable-viewer__backdrop" type="button" aria-label={t("magicGuide.close")} onClick={onClose} />
      <section className="readable-viewer__panel">
        <header className="readable-viewer__header">
          <div>
            <h2 id="readable-viewer-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button className="readable-viewer__close" type="button" onClick={onClose} aria-label={t("magicGuide.close")}>
            {t("magicGuide.close")}
          </button>
        </header>
        <div className="readable-viewer__image-frame">
          {asset && !hasImageError ? (
            <img
              src={asset.src}
              alt={t(asset.altKey as TranslationKey)}
              onError={() => setHasImageError(true)}
            />
          ) : (
            <p className="readable-viewer__error">{t("magicGuide.imageLoadError")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function MagicGuideQuickAccess({ save, isOpen, onOpen, onClose }: MagicGuideQuickAccessProps) {
  return (
    <div className="magic-guide-access">
      <ContextGuideButton
        guideId="magic_apprentice_guide"
        save={save}
        isOpen={isOpen}
        onToggle={isOpen ? onClose : onOpen}
      />
      <ContextGuideSidePanel
        guideId="magic_apprentice_guide"
        save={save}
        isOpen={isOpen}
        onClose={onClose}
        onMarkRead={() => undefined}
      />
    </div>
  );
}

export function ContextGuideButton({ guideId, save, isOpen, onToggle }: ContextGuideButtonProps) {
  const definition = contextGuideDefinitions[guideId];
  const guideItem = getContextGuideItem(save, guideId);
  const hasGuide = Boolean(guideItem);
  const read = isGuideRead(save, guideId);
  const tooltipKey = hasGuide
    ? isOpen
      ? definition.closeKey
      : definition.openKey
    : definition.requiredKey;

  return (
    <button
      className={`dialogue-guide-button${!hasGuide ? " dialogue-guide-button--disabled" : ""}`}
      type="button"
      disabled={!hasGuide}
      aria-label={t(tooltipKey as TranslationKey)}
      aria-pressed={isOpen}
      title={t(tooltipKey as TranslationKey)}
      onClick={onToggle}
    >
      <span className="dialogue-guide-button__icon" aria-hidden="true">?</span>
      <span className="dialogue-guide-button__label">{t(definition.titleKey as TranslationKey)}</span>
      {hasGuide && !read ? <span className="dialogue-guide-button__new">{t("guide.common.unread")}</span> : null}
    </button>
  );
}

export function ContextGuideSidePanel({ guideId, save, isOpen, onClose, onMarkRead }: ContextGuideSidePanelProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const definition = contextGuideDefinitions[guideId];
  const guideItem = getContextGuideItem(save, guideId);
  const asset = getReadableImageAsset(guideItem);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setHasImageError(false);
  }, [asset?.src]);

  useEffect(() => {
    if (isOpen && guideItem) {
      onMarkRead(guideId);
    }
  }, [guideId, guideItem, isOpen, onMarkRead]);

  return (
    <aside
      id={`context-guide-side-panel-${guideId}`}
      className={`magic-guide-side-panel${isOpen && guideItem ? " magic-guide-side-panel--open" : ""}`}
      aria-hidden={!isOpen || !guideItem}
      aria-labelledby={`context-guide-side-title-${guideId}`}
    >
      <header className="magic-guide-side-panel__header">
        <div>
          <h2 id={`context-guide-side-title-${guideId}`}>{t(definition.titleKey as TranslationKey)}</h2>
          <p>{t(definition.descriptionKey as TranslationKey)}</p>
        </div>
        <button className="magic-guide-side-panel__close" type="button" onClick={onClose} aria-label={t("magicGuide.collapse")}>
          {t("magicGuide.collapse")}
        </button>
      </header>
      <div className="magic-guide-side-panel__body">
        {asset && !hasImageError ? (
          <img
            src={asset.src}
            alt={t(asset.altKey as TranslationKey)}
            onError={() => setHasImageError(true)}
          />
        ) : (
          <p className="magic-guide-side-panel__error">{t("magicGuide.imageLoadError")}</p>
        )}
      </div>
    </aside>
  );
}
