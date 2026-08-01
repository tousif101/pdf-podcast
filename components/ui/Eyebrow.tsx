import type { ComponentProps } from "react";

export default function Eyebrow({ className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`font-mono text-[10px] font-medium tracking-[.09em] uppercase text-ink-5 ${className}`}
      {...props}
    />
  );
}
