import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "chip" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-white hover:bg-signal-press text-[15px] font-medium px-7 py-[15px] rounded-full",
  secondary:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper text-[15px] font-medium px-6 py-[14px] rounded-full",
  chip:
    "bg-paper-2 text-ink-2 hover:bg-line text-[12.5px] font-medium px-[14px] py-2 rounded-full",
  danger:
    "bg-transparent text-signal-ink text-[13px] font-medium underline underline-offset-[3px] px-1.5 py-2",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
