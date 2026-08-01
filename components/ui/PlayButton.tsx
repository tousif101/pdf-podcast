import type { ComponentProps } from "react";

export type PlayButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE: Record<PlayButtonSize, string> = {
  xs: "size-[34px]",
  sm: "size-10",
  md: "size-11",
  lg: "size-[52px]",
  xl: "size-[62px]",
};

const ICON: Record<PlayButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 15,
  lg: 18,
  xl: 22,
};

type PlayButtonProps = Omit<ComponentProps<"button">, "children"> & {
  size?: PlayButtonSize;
  /** Signal fill when this is the focal action of the surface (full player, continue card, shared hero). */
  focal?: boolean;
  playing?: boolean;
};

export default function PlayButton({
  size = "sm",
  focal = false,
  playing = false,
  type = "button",
  className = "",
  ...props
}: PlayButtonProps) {
  const iconSize = ICON[size];
  const fill = focal ? "fill-white" : "fill-paper";
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-40 disabled:pointer-events-none ${
        focal ? "bg-signal hover:bg-signal-press" : "bg-ink"
      } ${SIZE[size]} ${className}`}
      {...props}
    >
      {playing ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={fill}
        >
          <rect x="3" y="2" width="3.5" height="12" rx="1" />
          <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
        </svg>
      ) : (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`translate-x-[1px] ${fill}`}
        >
          <path d="M4.5 2.7c0-.9 1-1.5 1.8-1L13 6.9c.8.5.8 1.7 0 2.2l-6.7 5.2c-.8.5-1.8-.1-1.8-1V2.7z" />
        </svg>
      )}
    </button>
  );
}
