import type { ButtonHTMLAttributes, ReactNode } from "react";

type FantasyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function FantasyButton({
  children,
  variant = "secondary",
  className = "",
  ...props
}: FantasyButtonProps) {
  return (
    <button className={`fantasy-button fantasy-button--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
