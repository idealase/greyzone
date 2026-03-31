import { ReactNode, useId, useState } from "react";

interface InfoTooltipProps {
  /** Content shown inside the tooltip bubble */
  content: ReactNode;
  /** Accessible label for the trigger */
  label?: string;
  /** Optional className for the wrapper */
  className?: string;
}

export default function InfoTooltip({
  content,
  label = "More information",
  className = "",
}: InfoTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span
      className={`info-tooltip ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        className="info-tooltip__trigger"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      <span
        role="tooltip"
        id={tooltipId}
        className={`info-tooltip__bubble${
          open ? " info-tooltip__bubble--visible" : ""
        }`}
      >
        {content}
      </span>
    </span>
  );
}
