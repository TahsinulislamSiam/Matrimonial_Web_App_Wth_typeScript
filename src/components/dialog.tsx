"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg animate-fade-up rounded-t-3xl border border-line bg-cream p-5 shadow-lift sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="dialog-title" className={`text-xl ${danger ? "text-rose" : "text-forest"}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-parchment hover:text-forest"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
