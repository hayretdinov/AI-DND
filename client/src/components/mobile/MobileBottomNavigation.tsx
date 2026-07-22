import { t } from "../../i18n/i18n";
import "./mobile-bottom-navigation.css";

export type MobileNavigationSection = "character" | "inventory" | "skills" | "map" | "quests" | "settings";

type MobileBottomNavigationProps = {
  activeSection?: MobileNavigationSection | null;
  onNavigate: (section: MobileNavigationSection) => void;
};

const navigationItems: Array<{
  id: MobileNavigationSection;
  labelKey:
    | "mobileNavigationCharacter"
    | "mobileNavigationInventory"
    | "mobileNavigationSkills"
    | "mobileNavigationMap"
    | "mobileNavigationQuests"
    | "mobileNavigationSettings";
  icon: string;
}> = [
  { id: "character", labelKey: "mobileNavigationCharacter", icon: "/assets/world-map/ui/player_portrait_frame.png" },
  { id: "inventory", labelKey: "mobileNavigationInventory", icon: "/assets/world-map/ui/inventory_icon.png" },
  { id: "skills", labelKey: "mobileNavigationSkills", icon: "/assets/ui/buttons/class-selection/class-warrior-button.png" },
  { id: "map", labelKey: "mobileNavigationMap", icon: "/assets/world-map/icons/central_settlement.png" },
  { id: "quests", labelKey: "mobileNavigationQuests", icon: "/assets/world-map/ui/messages_icon.png" },
  { id: "settings", labelKey: "mobileNavigationSettings", icon: "/assets/world-map/ui/settings_icon.png" },
];

export function MobileBottomNavigation({ activeSection, onNavigate }: MobileBottomNavigationProps) {
  return (
    <nav className="mobile-bottom-navigation" aria-label={t("mobileNavigationLabel")}>
      {navigationItems.map((item) => {
        const isActive = item.id === activeSection;

        return (
          <button
            key={item.id}
            type="button"
            className={isActive ? "mobile-bottom-navigation__item mobile-bottom-navigation__item--active" : "mobile-bottom-navigation__item"}
            onClick={() => onNavigate(item.id)}
            aria-label={t(item.labelKey)}
            aria-current={isActive ? "page" : undefined}
          >
            <img src={item.icon} alt="" aria-hidden="true" />
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
