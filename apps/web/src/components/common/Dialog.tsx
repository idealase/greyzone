import { ReactNode, useEffect, useId, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="dialog-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog__title" id={titleId}>{title}</div>
        <div>{children}</div>
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </div>
  );
}
