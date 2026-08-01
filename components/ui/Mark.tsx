/** The Earshot mark — amplitude bars on an ink squircle. */
export default function Mark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] bg-ink text-signal"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ width: size * 0.55, height: size * 0.55 }}
      >
        <path d="M5 10v4m3.5-7v10M12 8v8m3.5-11v14M19 10v4" />
      </svg>
    </span>
  );
}
