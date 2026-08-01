"use client";

import { useEffect, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/** Bottom sheet on mobile, centred dialog on laptop. */
export default function Sheet({
  open,
  onClose,
  children,
  className = "",
  ...aria
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" {...aria}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 w-full cursor-default bg-ink/40"
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto bg-card p-5 rounded-t-[24px] shadow-[0_-6px_24px_rgba(23,21,15,.10)] lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-[480px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:p-6 ${className}`}
      >
        <div className="mx-auto mb-4 h-1 w-[34px] rounded-full bg-line lg:hidden" />
        {children}
      </div>
    </div>
  );
}
