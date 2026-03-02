"use client";

import React, { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

// PUBLIC_INTERFACE
export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    // Focus first focusable element in modal.
    const t = window.setTimeout(() => {
      const container = containerRef.current;
      const focusable = container?.querySelector<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onMouseDown={(e) => {
        // Click outside closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        ref={containerRef}
      >
        <div className="modalHeader">
          <div>
            <div id={titleId} style={{ fontWeight: 800, letterSpacing: 0.2 }}>
              {title}
            </div>
            {description ? (
              <div id={descId} className="helpText" style={{ marginTop: 4 }}>
                {description}
              </div>
            ) : null}
          </div>

          <button type="button" className="btn btnSm btnGhost" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>

        <div className="modalBody">{children}</div>

        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
