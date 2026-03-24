interface BadgeProps {
  label: string;
  variant?: "blue" | "red" | "green" | "yellow" | "purple" | "gray";
}

export default function Badge({ label, variant = "gray" }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{label}</span>;
}
