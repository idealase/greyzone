import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "default",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const variantClass = variant !== "default" ? ` btn--${variant}` : "";
  const sizeClass = size !== "md" ? ` btn--${size}` : "";

  return (
    <button
      className={`btn${variantClass}${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
