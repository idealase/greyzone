import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  title,
  subtitle,
  hoverable = false,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      className={`card${hoverable ? " card--hover" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {title && <div className="card__title">{title}</div>}
      {subtitle && <div className="card__subtitle">{subtitle}</div>}
      <div className="card__body">{children}</div>
    </div>
  );
}
