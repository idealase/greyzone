interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass =
    size === "sm" ? "spinner--sm" : size === "lg" ? "spinner--lg" : "";

  return <span className={`spinner ${sizeClass}`} role="status" aria-label="Loading" />;
}
