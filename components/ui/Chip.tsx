import type { ComponentProps } from "react";

/** Static (non-interactive) chip, e.g. the credits counter. For actions use Button variant="chip". */
export default function Chip({ className = "", ...props }: ComponentProps<"span">) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-paper-2 text-ink-3 font-mono text-[12px] px-3 py-1.5 rounded-full ${className}`}
      {...props}
    />
  );
}
