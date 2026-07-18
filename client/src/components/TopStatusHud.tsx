export type TopStatusIndicatorId =
  | "health"
  | "enemyHealth"
  | "mana"
  | "stamina"
  | "distance"
  | "cover"
  | "relationship"
  | "trust"
  | "fear"
  | "hostility";

export const TOP_STATUS_ORDER: TopStatusIndicatorId[] = [
  "health",
  "enemyHealth",
  "mana",
  "stamina",
  "distance",
  "cover",
  "relationship",
  "trust",
  "fear",
  "hostility",
];

export type TopStatusIndicatorData = {
  id: TopStatusIndicatorId;
  label: string;
  value: string | number;
  icon: string;
};

type TopStatusBarProps = {
  indicators: TopStatusIndicatorData[];
  ariaLabel: string;
};

export function StatusIndicator({ indicator }: { indicator: TopStatusIndicatorData }) {
  return (
    <div className={`top-status-indicator top-status-indicator--${indicator.id}`} title={`${indicator.label}: ${indicator.value}`}>
      <span className="top-status-indicator__icon" aria-hidden="true">
        {indicator.icon}
      </span>
      <span className="top-status-indicator__label">{indicator.label}</span>
      <strong>{indicator.value}</strong>
    </div>
  );
}

export function TopStatusBar({ indicators, ariaLabel }: TopStatusBarProps) {
  return (
    <div className="top-status-bar" aria-label={ariaLabel}>
      {indicators.map((indicator) => (
        <StatusIndicator key={indicator.id} indicator={indicator} />
      ))}
    </div>
  );
}
