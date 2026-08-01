import type { ComponentProps } from "react";

export default function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`bg-card border border-line rounded-2xl ${className}`}
      {...props}
    />
  );
}
